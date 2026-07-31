// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.19 answer_objection  (workflow id 1823781d-ffb8-4c74-8729-6877a3cdc83e)
// Nodo:        answer_objection
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

function normText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

const msg = (
  $json.execution_context?.message ||
  $json.decision?.message ||
  ""
).trim();

const latestUser = normText(
  $json.context_packet?.conversation?.latest_user_message
);

const isWillThink =
  latestUser.includes("lo voy a pensar") ||
  latestUser.includes("lo pensare") ||
  latestUser.includes("lo pensar") ||
  latestUser.includes("despues veo") ||
  latestUser.includes("despues te aviso") ||
  latestUser.includes("lo veo");

const strongWillThink =
  "Perfecto, tomate tu tiempo. Cualquier cosa me escribes y te puedo ayudar con dudas, precios u horarios. Si quieres, puedo enviarte horarios disponibles o agendar cuando te acomode. Que prefieres?";

const genericFallback =
  "Perfecto. Cualquier cosa me dices y te puedo ayudar. Que te gustaria revisar?";

function hasExpectedClosings(text) {
  const t = normText(text);
  return (
    t.includes("perfecto") &&
    t.includes("cualquier cosa") &&
    (t.includes("te puedo ayudar") || t.includes("te ayudo")) &&
    (t.includes("horario") || t.includes("horarios"))
  );
}

let messageToSend = msg;

if (isWillThink) {
  // Si el LLM entrego un texto muy corto/debil, lo reemplazamos por la plantilla robusta.
  if (!messageToSend || !hasExpectedClosings(messageToSend)) {
    messageToSend = strongWillThink;
  }
} else {
  if (!messageToSend) {
    messageToSend = genericFallback;
  }
}

return [
  {
    json: {
      ...$json,
      message_to_send: messageToSend,
      db_operations: ["messages", "lead_state"],
      state_update: {
        ...($json.execution_context?.state_update || {}),
        stage: "closing",
        intent_last: "objection_answered",
        next_goal: "book_appointment",
        last_bot_action: "answer_objection",
        missing_fields: []
      }
    }
  }
];
