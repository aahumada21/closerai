// Escanea SOLO los archivos trackeados por git (lo que esta publicado en el
// repo publico) buscando secretos. Ignora node_modules/vendor via git ls-files.
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = 'c:/Dev/Closer IA Agent/N8N';
const files = execSync('git -C "' + ROOT + '" ls-files', { maxBuffer: 64 * 1024 * 1024 })
  .toString().split('\n').filter(Boolean);

// Patrones de secretos reales (no UUIDs internos, que son inocuos)
const PATRONES = [
  [/\bghp_[A-Za-z0-9]{30,}\b/g, 'GitHub token'],
  [/\bsk-[A-Za-z0-9_-]{20,}\b/g, 'OpenAI key'],
  [/\bAIza[A-Za-z0-9_-]{30,}\b/g, 'Google API key'],
  [/\beyJ[A-Za-z0-9_-]{30,}\.[A-Za-z0-9_-]{10,}/g, 'JWT'],
  [/postgres(?:ql)?:\/\/[^\s"'`]{16,}/gi, 'Postgres URL'],
  [/\b[0-9a-f]{64}\b/g, 'hex 64 (token/secreto)'],
  [/EAA[A-Za-z0-9]{60,}/g, 'Meta/WhatsApp token'],
  [/\bGOCSPX-[A-Za-z0-9_-]{10,}/g, 'Google OAuth secret'],
  [/(?:password|passwd|secret|api[_-]?key|token)\s*[:=]\s*["'`]([^"'`\s${}]{12,})["'`]/gi, 'literal password/secret'],
];

// El calendar_id de Google es hex de 64 pero no es secreto: es un identificador.
const FALSO_POSITIVO = /@group\.calendar\.google\.com/;

const hallazgos = new Map(); // valor -> {tipo, archivos:Set}

for (const rel of files) {
  const full = path.join(ROOT, rel);
  let txt;
  try {
    const st = fs.statSync(full);
    if (st.size > 8 * 1024 * 1024) continue;
    txt = fs.readFileSync(full, 'utf8');
  } catch { continue; }

  for (const [re, tipo] of PATRONES) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(txt)) !== null) {
      const val = m[1] || m[0];
      // descartar calendar ids (hex64 seguido de @group.calendar...)
      const ctx = txt.slice(m.index, m.index + val.length + 40);
      if (FALSO_POSITIVO.test(ctx)) continue;
      if (/^0+$/.test(val)) continue;
      const key = tipo + '|' + val;
      if (!hallazgos.has(key)) hallazgos.set(key, { tipo, val, archivos: new Set() });
      hallazgos.get(key).archivos.add(rel);
    }
  }
}

console.log('archivos trackeados escaneados: ' + files.length);
console.log('hallazgos distintos: ' + hallazgos.size + '\n');

for (const { tipo, val, archivos } of hallazgos.values()) {
  console.log('[' + tipo + ']  ' + val.slice(0, 22) + '...' + val.slice(-6) + '   (' + val.length + ' chars)');
  [...archivos].slice(0, 4).forEach((a) => console.log('      ' + a));
  if (archivos.size > 4) console.log('      ... +' + (archivos.size - 4) + ' archivos mas');
}
