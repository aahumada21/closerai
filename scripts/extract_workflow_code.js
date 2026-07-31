#!/usr/bin/env node
/**
 * Extrae el codigo que vive DENTRO de los JSON de n8n a archivos reales.
 *
 * ## Por que existe
 *
 * En este repo, ~26% del JSON de los workflows es logica: 721 KB de JS en 283
 * Code nodes (`parameters.jsCode`) y 89 KB de SQL en 111 nodos Postgres
 * (`parameters.query`). Todo eso vive como *strings* dentro del JSON, asi que
 * ninguna herramienta que indexe codigo por AST de archivos (graphify,
 * Sourcegraph, ctags, lo que sea) puede verlo. El caso extremo es
 * `3 rules_engine`: 245 KB de JS en un solo nodo -- el cerebro del sistema,
 * completamente invisible.
 *
 * Cambiar de herramienta no arregla eso. Lo que lo arregla es sacar el codigo
 * a archivos, que es lo que hace este script.
 *
 * ## Por que los archivos generados SI se commitean
 *
 * Son derivados, o sea que el instinto seria gitignorearlos. No se puede:
 * graphify respeta `.gitignore` (verificado empiricamente -- un archivo
 * gitignorado desaparece del grafo), asi que ignorarlos anularia todo el
 * proposito. Ademas hay un beneficio secundario real: el diff de un cambio al
 * motor de reglas pasa a ser legible en el code review, en vez de una linea de
 * 245 KB de JSON escapado.
 *
 * ## Contrato
 *
 * - Fuente de verdad: SIEMPRE el JSON del workflow. Estos archivos son de solo
 *   lectura; editarlos no tiene ningun efecto (el proximo deploy los pisa).
 * - Es idempotente y limpia lo que sobra: si un nodo se borra o se renombra, su
 *   archivo desaparece en la siguiente corrida.
 *
 * Uso:  node scripts/extract_workflow_code.js [--check]
 *       --check  no escribe nada; sale con codigo 1 si algo esta desactualizado
 *                (util para CI o como pre-commit)
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(REPO_ROOT, 'workflows', 'extracted');
const SOURCE_DIRS = ['uncategorized', 'manual', 'onboarding', 'meta_whatsapp'].map((d) =>
  path.join(REPO_ROOT, 'workflows', 'exports', d)
);

const CHECK_ONLY = process.argv.includes('--check');

/** Nombres de workflow/nodo -> nombre de archivo seguro en Windows y Linux. */
function safeName(name) {
  return String(name || 'sin_nombre')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\.+$/, '')
    .slice(0, 120) || 'sin_nombre';
}

function readWorkflow(file) {
  // Ojo: 9 exports tienen BOM. Sin quitarlo JSON.parse tira, y un catch mudo
  // los saltaria en silencio (ya paso una vez con 6.24 persist_and_audit).
  const raw = fs.readFileSync(file, 'utf8').replace(/^﻿/, '');
  return JSON.parse(raw);
}

/**
 * Recolecta los workflows deduplicados por id.
 *
 * Criterio: gana `uncategorized/`, que es el espejo crudo de lo que esta
 * desplegado en n8n. `manual/` es una copia curada a mano y puede ir atrasada
 * -- de hecho lo esta: la copia manual de `6 action_executor` tiene 64 nodos y
 * le falta la llamada a `6.28`, contra 65 nodos del espejo, y ambas declaran el
 * MISMO `updatedAt`, asi que ese campo no sirve de desempate. Preferir `manual/`
 * hacia que el grafo de dependencias perdiera aristas reales.
 *
 * Cuando las dos copias existen y difieren, se reporta el drift en vez de
 * elegir en silencio.
 */
function collectWorkflows() {
  const byId = new Map();
  const unparseable = [];
  const drift = [];

  for (const dir of SOURCE_DIRS) {
    if (!fs.existsSync(dir)) continue;
    const isMirror = path.basename(dir) === 'uncategorized';

    for (const f of fs.readdirSync(dir)) {
      if (!f.endsWith('.json')) continue;
      const full = path.join(dir, f);
      let wf;
      try {
        wf = readWorkflow(full);
      } catch (e) {
        unparseable.push({ file: path.relative(REPO_ROOT, full), error: e.message });
        continue;
      }
      if (!wf || !Array.isArray(wf.nodes)) continue;

      const id = wf.id || f;
      const prev = byId.get(id);

      if (prev && prev.wf.nodes.length !== wf.nodes.length) {
        drift.push({
          name: wf.name,
          id,
          a: `${path.basename(path.dirname(prev.file))} (${prev.wf.nodes.length} nodos)`,
          b: `${path.basename(dir)} (${wf.nodes.length} nodos)`,
        });
      }

      if (!prev || (isMirror && !prev.isMirror)) {
        byId.set(id, { wf, file: full, isMirror });
      }
    }
  }
  return { workflows: [...byId.values()], unparseable, drift };
}

const HEADER_JS = (wfName, nodeName, wfId) =>
  `// === ARCHIVO GENERADO -- NO EDITAR ===\n` +
  `// Extraido de: ${wfName}  (workflow id ${wfId})\n` +
  `// Nodo:        ${nodeName}\n` +
  `//\n` +
  `// La fuente de verdad es el JSON del workflow en workflows/exports/.\n` +
  `// Editar este archivo no tiene ningun efecto. Regenerar con:\n` +
  `//   node scripts/extract_workflow_code.js\n` +
  `// =====================================\n\n`;

const HEADER_SQL = (wfName, nodeName, wfId) =>
  `-- === ARCHIVO GENERADO -- NO EDITAR ===\n` +
  `-- Extraido de: ${wfName}  (workflow id ${wfId})\n` +
  `-- Nodo:        ${nodeName}\n` +
  `--\n` +
  `-- La fuente de verdad es el JSON del workflow en workflows/exports/.\n` +
  `-- Regenerar con: node scripts/extract_workflow_code.js\n` +
  `-- =====================================\n\n`;

function extract() {
  const { workflows, unparseable, drift } = collectWorkflows();
  const wanted = new Map(); // ruta absoluta -> contenido
  const deps = []; // { from, to, node }

  for (const { wf } of workflows) {
    const wfDir = path.join(OUT_DIR, safeName(wf.name));

    for (const node of wf.nodes) {
      const p = node.parameters || {};

      if (typeof p.jsCode === 'string' && p.jsCode.trim()) {
        wanted.set(
          path.join(wfDir, safeName(node.name) + '.js'),
          HEADER_JS(wf.name, node.name, wf.id) + p.jsCode.replace(/\r\n/g, '\n').trimEnd() + '\n'
        );
      }

      if (typeof p.query === 'string' && p.query.trim()) {
        wanted.set(
          path.join(wfDir, safeName(node.name) + '.sql'),
          HEADER_SQL(wf.name, node.name, wf.id) + p.query.replace(/\r\n/g, '\n').trimEnd() + '\n'
        );
      }

      if (node.type === 'n8n-nodes-base.executeWorkflow') {
        const ref = p.workflowId || {};
        const value = typeof ref === 'string' ? ref : ref.value || '';
        const isExpression = typeof value === 'string' && value.includes('{{');
        deps.push({
          from: wf.name,
          fromId: wf.id,
          // Se resuelve por ID mas adelante, NO por `cachedResultName`: ese
          // campo es una etiqueta cacheada en el que llama y queda vieja si el
          // workflow destino se renombra. Fiarse de el hacia que workflows que
          // si se llaman (ej. 6.28) aparecieran como huerfanos.
          toId: isExpression ? null : value || null,
          cachedName: isExpression ? null : ref.cachedResultName || null,
          node: node.name,
          dynamic: isExpression,
          expression: isExpression ? value : null,
        });
      }
    }
  }

  return { wanted, deps, workflows, unparseable, drift };
}

/** Lo que hay hoy en disco bajo OUT_DIR. */
function currentFiles() {
  const out = new Set();
  if (!fs.existsSync(OUT_DIR)) return out;
  for (const dir of fs.readdirSync(OUT_DIR)) {
    const full = path.join(OUT_DIR, dir);
    if (!fs.statSync(full).isDirectory()) continue;
    for (const f of fs.readdirSync(full)) out.add(path.join(full, f));
  }
  return out;
}

function main() {
  const { wanted, deps, workflows, unparseable, drift } = extract();
  const existing = currentFiles();

  const toWrite = [];
  const toDelete = [];

  for (const [file, content] of wanted) {
    const current = existing.has(file) ? fs.readFileSync(file, 'utf8') : null;
    if (current !== content) toWrite.push(file);
  }
  for (const file of existing) {
    if (!wanted.has(file)) toDelete.push(file);
  }

  if (CHECK_ONLY) {
    const stale = toWrite.length + toDelete.length;
    console.log(`workflows: ${workflows.length} · archivos esperados: ${wanted.size}`);
    if (stale === 0) {
      console.log('OK — workflows/extracted/ esta al dia.');
      process.exit(0);
    }
    console.log(`DESACTUALIZADO — ${toWrite.length} por escribir, ${toDelete.length} por borrar.`);
    console.log('Correr: node scripts/extract_workflow_code.js');
    process.exit(1);
  }

  for (const file of toWrite) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, wanted.get(file), 'utf8');
  }
  for (const file of toDelete) fs.unlinkSync(file);

  // Borrar carpetas que quedaron vacias (workflow renombrado o eliminado).
  if (fs.existsSync(OUT_DIR)) {
    for (const dir of fs.readdirSync(OUT_DIR)) {
      const full = path.join(OUT_DIR, dir);
      if (fs.statSync(full).isDirectory() && fs.readdirSync(full).length === 0) fs.rmdirSync(full);
    }
  }

  const js = [...wanted.keys()].filter((f) => f.endsWith('.js')).length;
  const sql = [...wanted.keys()].filter((f) => f.endsWith('.sql')).length;
  const bytes = [...wanted.values()].reduce((a, c) => a + c.length, 0);

  console.log(`workflows procesados : ${workflows.length}`);
  console.log(`archivos JS          : ${js}`);
  console.log(`archivos SQL         : ${sql}`);
  console.log(`total                : ${(bytes / 1024).toFixed(0)} KB`);
  console.log(`escritos/actualizados: ${toWrite.length}`);
  console.log(`eliminados (stale)   : ${toDelete.length}`);

  if (unparseable.length) {
    console.log(`\nAVISO — ${unparseable.length} export(s) no son JSON valido y quedaron fuera:`);
    unparseable.forEach((u) => console.log(`  ${u.file}`));
  }

  if (drift.length) {
    console.log(`\nAVISO — ${drift.length} workflow(s) con copias divergentes entre carpetas.`);
    console.log('Gana el espejo de uncategorized/ (lo que esta desplegado en n8n):');
    drift.forEach((d) => console.log(`  ${d.name}: ${d.a} vs ${d.b}`));
  }

  writeDependencyGraph(deps, workflows);
}

/** Grafo de dependencias entre workflows (quien llama a quien) en Mermaid. */
function writeDependencyGraph(deps, workflows) {
  const docPath = path.join(REPO_ROOT, 'docs', 'arquitectura', 'GRAFO_WORKFLOWS.md');

  // Resolver los destinos por ID real. `cachedResultName` solo se usa como
  // ultimo recurso, para destinos que apuntan a un workflow que ya no existe
  // entre los exports (borrado o nunca exportado).
  const nameById = new Map(workflows.map((w) => [w.wf.id, w.wf.name]));

  const edges = new Map(); // "from|to" -> [nodos]
  const noResueltos = [];
  for (const d of deps) {
    let to;
    if (d.dynamic) {
      to = 'DESPACHO_DINAMICO';
    } else {
      to = nameById.get(d.toId);
      if (!to) {
        to = d.cachedName || d.toId;
        noResueltos.push({ from: d.from, node: d.node, to, id: d.toId });
      }
    }
    if (!to) continue;
    const key = d.from + '|' + to;
    if (!edges.has(key)) edges.set(key, []);
    edges.get(key).push(d.node);
  }

  const called = new Set();
  for (const d of deps) {
    const n = d.dynamic ? null : nameById.get(d.toId) || d.cachedName;
    if (n) called.add(n);
  }
  const callers = new Set(deps.map((d) => d.from));
  const allNames = workflows.map((w) => w.wf.name);
  const huerfanos = allNames.filter((n) => !called.has(n) && !callers.has(n)).sort();
  const dinamicos = deps.filter((d) => d.dynamic);

  const id = (name) => 'n' + Buffer.from(String(name)).toString('hex').slice(0, 12);

  const lines = [];
  lines.push('# Grafo de dependencias entre workflows');
  lines.push('');
  lines.push('> **Generado** por `node scripts/extract_workflow_code.js`. No editar a mano.');
  lines.push('');
  lines.push(
    'Cada flecha es un nodo `executeWorkflow` (un workflow llamando a otro). ' +
      'Se excluyen los workflows aislados, que se listan aparte mas abajo.'
  );
  lines.push('');
  lines.push('```mermaid');
  lines.push('graph LR');
  const seenNode = new Set();
  for (const key of [...edges.keys()].sort()) {
    const [from, to] = key.split('|');
    for (const n of [from, to]) {
      if (!seenNode.has(n)) {
        seenNode.add(n);
        lines.push(`  ${id(n)}["${n.replace(/"/g, "'")}"]`);
      }
    }
    const count = edges.get(key).length;
    lines.push(`  ${id(from)} -->${count > 1 ? `|${count}|` : ''} ${id(to)}`);
  }
  lines.push('```');
  lines.push('');
  lines.push(`## Resumen`);
  lines.push('');
  lines.push(`- Workflows totales: **${workflows.length}**`);
  lines.push(`- Llamadas \`executeWorkflow\`: **${deps.length}** (${edges.size} pares distintos)`);
  lines.push(`- Con destino dinamico (expresion, no resoluble estaticamente): **${dinamicos.length}**`);
  lines.push(`- Workflows aislados (ni llaman ni son llamados): **${huerfanos.length}**`);
  lines.push('');

  if (dinamicos.length) {
    lines.push('### Despachos dinamicos');
    lines.push('');
    lines.push('Un grafo estatico no puede seguir estos destinos — revisarlos a mano:');
    lines.push('');
    dinamicos.forEach((d) => {
      lines.push(`- \`${d.from}\` :: \`${d.node}\``);
      lines.push('  ```');
      lines.push('  ' + String(d.expression).replace(/\n/g, ' ').slice(0, 200));
      lines.push('  ```');
    });
    lines.push('');
  }

  if (noResueltos.length) {
    lines.push('### Destinos que no resuelven a ningun export');
    lines.push('');
    lines.push(
      'El `workflowId` apunta a un id que no existe entre los exports locales. ' +
        'O el workflow vive solo en n8n y nunca se exporto, o quedo una referencia ' +
        'colgada a uno borrado.'
    );
    lines.push('');
    noResueltos.forEach((d) =>
      lines.push(`- \`${d.from}\` :: \`${d.node}\` → \`${d.to}\` (id \`${d.id}\`)`)
    );
    lines.push('');
  }

  lines.push('### Workflows aislados');
  lines.push('');
  lines.push(
    'No aparecen en el grafo porque ningun `executeWorkflow` los referencia y ellos ' +
      'no llaman a nadie. Puede ser legitimo (se disparan por webhook, cron o trigger ' +
      'de n8n) o puede ser que hayan quedado huerfanos — vale la pena revisarlos.'
  );
  lines.push('');
  huerfanos.forEach((h) => lines.push(`- ${h}`));
  lines.push('');

  fs.mkdirSync(path.dirname(docPath), { recursive: true });
  fs.writeFileSync(docPath, lines.join('\n'), 'utf8');
  console.log(`\ngrafo de dependencias -> ${path.relative(REPO_ROOT, docPath)}`);
  console.log(`  ${edges.size} aristas, ${huerfanos.length} workflows aislados, ${dinamicos.length} despachos dinamicos`);
}

main();
