// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 1.1 n8n_chat_test_router  (workflow id 0b02fa7c-8ba2-4a4d-a6e3-87a3165020eb)
// Nodo:        attach_test_agent_context
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const event = $('build_normalized_event').first().json;
const match = $json || {};

// Fallback: si el numero de prueba no esta registrado en agent_channels,
// usamos el agente Ahumada Detailing por defecto (unico agente real en uso).
const DEFAULT_AGENT_ID = '90351a2d-1c0c-4918-b3ef-b4cef1f3df9d';
const DEFAULT_ORGANIZATION_ID = '0f709b9c-23b3-4fd5-9fd5-db11a767d364';

const agentId = match.agent_id || DEFAULT_AGENT_ID;
const organizationId = match.organization_id || DEFAULT_ORGANIZATION_ID;

return [
  {
    json: {
      ...event,
      agent_id: agentId,
      organization_id: organizationId,
      routing: {
        ...(event.routing || {}),
        agent_id: agentId,
        organization_id: organizationId
      }
    }
  }
];
