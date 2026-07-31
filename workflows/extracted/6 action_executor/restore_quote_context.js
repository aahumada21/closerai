// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6 action_executor  (workflow id 80e7685e-2690-4d1e-a5e7-5ccb7d0e8a13)
// Nodo:        restore_quote_context
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

// message_to_send is lost after inser_quote (Postgres INSERT returns only DB row).
// Recover full context from Call '6.8 send_quote' output.
// 6.8 output includes message_to_send and a partial state_update (quoted_price, etc.)
// but NOT the full state_update from rules_engine (which has stage=qualified, last_bot_action).
// Merge both state_updates to preserve all fields.
const quoteCtx = $("Call '6.8 send_quote'").first()?.json || {};
const rulesStateUpdate = quoteCtx.decision?.state_update || {};
const quoteStateUpdate = quoteCtx.state_update || {};
return [{
  json: {
    ...quoteCtx,
    state_update: {
      ...rulesStateUpdate,
      ...quoteStateUpdate
    },
    offers_or_quotes_id: $json.id || null
  }
}];
