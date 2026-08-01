// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.30 reconcile_pending_payments  (workflow id nRnyi0HdNMaYFFeC)
// Nodo:        build_stuck_alert_message
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const d = $("find_pending_payments").item.json;
const ageRounded = Math.round(Number(d.age_days) * 10) / 10;

const lines = [
  "ALERTA: pago pendiente hace mas de 24h",
  "Lead: " + d.lead_id,
  "Telefono: " + (d.phone || "desconocido"),
  "Flow order: " + d.flow_order_id,
  "Antiguedad: " + ageRounded + " dias",
  "payment_mode: " + (d.payment_mode || "(sin especificar)")
];

return [{ message: lines.join("\n") }];
