// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: ChatBot AhumadaDetialing  (workflow id 2b2069db-55b3-4530-8b62-9e2c07a34651)
// Nodo:        Code in JavaScript
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const steps = $json.intermediateSteps ?? [];
const createStep = steps.find(s => s?.action?.tool === 'Create_event');
if (!createStep) return [];

const ev = JSON.parse(createStep.observation)[0];

return [{
  json: {
    conversation_id: $json.sessionId, // viene de Message [1][2]
    event_id: ev.id,
    start_at: ev.start?.dateTime,
    end_at: ev.end?.dateTime,
    summary: ev.summary,
    description: ev.description,
    status: 'confirmed',
  }
}];
