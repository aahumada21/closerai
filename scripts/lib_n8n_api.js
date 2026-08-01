// Helper correcto para hablar con la API de n8n.
//
// IMPORTANTE -- por que existe este archivo: los scripts previos hacian
//   res.on('data', (c) => body += c)
// que convierte cada chunk a string por separado. Si un caracter UTF-8
// multi-byte ("e" con tilde, "n" con virgulilla) cae justo en el limite entre
// dos chunks, cada mitad se decodifica sola y se convierte en U+FFFD. El
// resultado es corrupcion silenciosa y NO DETERMINISTA (depende de como la red
// parta los chunks), que ademas puede terminar deployeada a produccion via PUT.
// La forma correcta es acumular Buffers y decodificar una sola vez al final.
const fs = require('fs');
const https = require('https');

const env = {};
fs.readFileSync('c:/Dev/Closer IA Agent/N8N/.env', 'utf8').split('\n').forEach((l) => {
  const t = l.trim();
  if (!t || t.startsWith('#') || !t.includes('=')) return;
  const i = t.indexOf('=');
  env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
});

function request(method, path, bodyObj) {
  return new Promise((resolve, reject) => {
    const payload = bodyObj ? Buffer.from(JSON.stringify(bodyObj), 'utf8') : null;
    const url = new URL(env.N8N_API_URL.replace(/\/$/, '') + path);
    const headers = { 'X-N8N-API-KEY': env.N8N_API_KEY };
    if (payload) {
      headers['Content-Type'] = 'application/json; charset=utf-8';
      headers['Content-Length'] = payload.length;
    }
    const req = https.request(url, { method, headers }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        resolve({ status: res.statusCode, text });
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

const getWorkflow = async (id) => {
  const { status, text } = await request('GET', '/api/v1/workflows/' + id);
  if (status !== 200) throw new Error('GET ' + id + ' -> ' + status + ': ' + text.slice(0, 200));
  return JSON.parse(text);
};

const putWorkflow = async (id, wf) => {
  const { status, text } = await request('PUT', '/api/v1/workflows/' + id, {
    name: wf.name,
    nodes: wf.nodes,
    connections: wf.connections,
    settings: { executionOrder: wf.settings.executionOrder },
  });
  return { status, text };
};

function countBad(value) {
  const s = typeof value === 'string' ? value : JSON.stringify(value);
  return (s.match(/\uFFFD/g) || []).length;
}

module.exports = { request, getWorkflow, putWorkflow, countBad, env };
