// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6 action_executor  (workflow id 80e7685e-2690-4d1e-a5e7-5ccb7d0e8a13)
// Nodo:        build_missing_requirements_result
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const action = $json.validation?.action || null;
const missing_fields = $json.validation?.missing_fields || [];

const explicitMessage = String(
  $json.decision?.message ||
  $json.execution_context?.message ||
  $json.rule_result?.message ||
  ""
).trim();

let fallback_message = explicitMessage || "Necesito un poco mas de informacion para continuar.";

if (!explicitMessage) {
  if (missing_fields.includes("district")) {
    fallback_message = "Perfecto. Para ayudarte bien, en que comuna estas?";
  } else if (missing_fields.includes("vehicle_type")) {
    fallback_message = "Perfecto. Que tipo de vehiculo tienes? Puede ser auto, SUV o camioneta.";
  } else if (missing_fields.includes("service_interest")) {
    fallback_message = "Perfecto. Que servicio te interesa?";
  } else if (missing_fields.includes("booking_date")) {
    fallback_message = "Perfecto. Para que dia te gustaria agendar?";
  } else if (missing_fields.includes("booking_time")) {
    fallback_message = "Perfecto. Que horario te acomoda?";
  }
}

let nextGoal = "collect_missing_data";

if (
  missing_fields.includes("vehicle_type") &&
  missing_fields.includes("district")
) {
  nextGoal = "collect_vehicle_and_district";
} else if (missing_fields.includes("service_interest")) {
  nextGoal = "collect_service_interest";
} else if (missing_fields.includes("vehicle_type")) {
  nextGoal = "collect_vehicle_type";
} else if (missing_fields.includes("district")) {
  nextGoal = "collect_district";
}

const stateUpdate = $json.state_update || {};

return [{
  ...$json,

  message_to_send: fallback_message,

  db_operations: ["messages", "lead_state"],

  state_update: {
    ...stateUpdate,
    missing_fields,
    last_bot_action: "ask_missing_data",
    next_goal: stateUpdate.next_goal || nextGoal
  },

  execution_result: {
    success: false,
    action,
    message_sent: false,
    state_updated: true,
    db_records_created: ["messages", "lead_state"],
    notes: [
      "blocked_missing_requirements",
      ...(explicitMessage ? ["used_explicit_rule_message"] : []),
      ...missing_fields
    ],
    fallback_action: "ask_missing_data",
    fallback_message
  }
}];
