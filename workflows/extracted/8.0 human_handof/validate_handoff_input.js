// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 8.0 human_handof  (workflow id 2360b175-88ae-483d-8551-b2aa36c1c625)
// Nodo:        validate_handoff_input
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

function parseMaybeJson(value, fallback) {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "object") return value;

  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }

  return fallback;
}

const input = $json;

const lead = parseMaybeJson(input.lead, {});
const state = parseMaybeJson(input.state, {});
const conversation = parseMaybeJson(input.conversation, {});
const metadata = parseMaybeJson(input.metadata, {});

const leadId =
  input.lead_id ||
  input.execution_context?.lead_id ||
  lead.id ||
  state.lead_id ||
  metadata.lead_id ||
  null;

const reason =
  input.reason ||
  input.handoff_reason ||
  input.execution_context?.handoff_reason ||
  metadata.reason ||
  null;

if (!leadId) {
  throw new Error("Missing lead_id");
}

if (!reason) {
  throw new Error("Missing handoff reason");
}

return [
  {
    ...input,
    lead_id: leadId,
    reason,
    lead,
    state,
    conversation,
    metadata,
    validated_at: new Date().toISOString()
  }
];
