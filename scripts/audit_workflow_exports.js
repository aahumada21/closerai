// Que exports del repo apuntan a workflows que ya NO existen en n8n.
// El campo `active` de un export es una foto historica del momento en que se
// exporto, no la verdad de hoy -- por eso un archivo fantasma puede decir
// "active: true" aunque el workflow este borrado hace meses.
const fs = require('fs');
const path = require('path');
const { request } = require('./lib_n8n_api.js');

const DIRS = ['uncategorized', 'manual', 'onboarding', 'meta_whatsapp'].map(
  (d) => 'c:/Dev/Closer IA Agent/N8N/workflows/exports/' + d
);

(async () => {
  const { text } = await request('GET', '/api/v1/workflows?limit=250');
  const live = new Map();
  for (const w of JSON.parse(text).data || []) live.set(w.id, w);
  console.log('workflows vivos en n8n: ' + live.size + '\n');

  const ghosts = [];
  const noId = [];
  const ok = [];

  for (const dir of DIRS) {
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir)) {
      if (!f.endsWith('.json')) continue;
      let wf;
      try { wf = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8').replace(/^\uFEFF/, '')); }
      catch { continue; }
      if (!wf || !wf.nodes) continue;

      const rel = path.basename(dir) + '/' + f;
      if (!wf.id) { noId.push({ rel, name: wf.name }); continue; }
      if (!live.has(wf.id)) ghosts.push({ rel, name: wf.name, id: wf.id, declaraActive: wf.active });
      else ok.push(rel);
    }
  }

  console.log('=== EXPORTS FANTASMA (el workflow ya no existe en n8n) ===');
  ghosts.forEach((g) =>
    console.log(`  ${g.rel}\n      name="${g.name}"  id=${g.id}  el archivo declara active=${g.declaraActive}`)
  );
  console.log('\n=== EXPORTS SIN id (nunca sincronizados desde n8n) ===');
  noId.forEach((n) => console.log(`  ${n.rel}   name="${n.name}"`));

  console.log(`\nresumen: ${ok.length} vigentes · ${ghosts.length} fantasma · ${noId.length} sin id`);

  // Workflows vivos que NO tienen export en el repo
  const exported = new Set();
  for (const dir of DIRS) {
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir)) {
      if (!f.endsWith('.json')) continue;
      try {
        const wf = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8').replace(/^\uFEFF/, ''));
        if (wf && wf.id) exported.add(wf.id);
      } catch {}
    }
  }
  const sinExport = [...live.values()].filter((w) => !exported.has(w.id) && !w.isArchived);
  console.log('\n=== VIVOS Y ACTIVOS SIN EXPORT EN EL REPO ===');
  sinExport.forEach((w) => console.log(`  ${w.name}  (id=${w.id}, active=${w.active})`));
  if (!sinExport.length) console.log('  (ninguno)');
})();
