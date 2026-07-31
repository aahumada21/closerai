// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 9.1.1 qa_run_single_conversation  (workflow id 34092303-cb4a-4fd2-800e-ac16f650fc52)
// Nodo:        build_llm_judge_prompt
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const ctx = $("collect_scenario_info").first().json;
const dbResult = $json || {};

const transcript = Array.isArray(dbResult.transcript) ? dbResult.transcript : [];

const transcriptText = transcript
  .map((step) => {
    const lines = [
      "Paso " + step.step_index + ":",
      "Usuario: " + (step.text_sent || "(sin texto)"),
      "Bot: " + (step.bot_response || "(sin respuesta)")
    ];
    if (Array.isArray(step.errors) && step.errors.length > 0) {
      lines.push("Errores tecnicos detectados por las validaciones automaticas: " + step.errors.join(" | "));
    }
    return lines.join("\n");
  })
  .join("\n\n");

const developerPrompt = `Eres un evaluador de calidad (QA) para un bot de ventas conversacional (WhatsApp/webchat) de un negocio de detailing y lavado de autos en Chile.

Te voy a dar:
1. El objetivo esperado de la conversacion (lo que deberia lograr el bot).
2. La transcripcion completa de la conversacion de prueba (cada paso: lo que escribio el usuario y lo que respondio el bot).

Tu trabajo es evaluar si la conversacion en su conjunto cumplio el objetivo esperado, sin inventar problemas que no se vean en la transcripcion. Se especifico citando el paso exacto (ej. "en el paso 3...") cuando reportes un problema o inconsistencia.

Responde siempre en espanol, en el formato JSON estructurado que se te pide.`;

const userPrompt = `Objetivo esperado de esta conversacion de prueba:
${ctx.expected_outcome}

Nombre del escenario: ${ctx.scenario_name || "(sin nombre)"}

Transcripcion completa:
${transcriptText || "(no se registraron pasos)"}

Evalua si la conversacion cumplio el objetivo esperado. Reporta:
- passed: true si el bot logro el objetivo esperado de forma razonable, sin errores graves ni respuestas inconsistentes con el contexto previo. false si no lo logro, si se repitio sin avanzar, si dio informacion incorrecta o inconsistente, o si hubo errores tecnicos visibles.
- inconsistencies: lista de momentos donde el bot se contradijo, perdio el contexto de la conversacion, o respondio algo que no calza con lo que el usuario pidio.
- problems: lista de errores tecnicos o fallas evidentes (mensajes vacios, loops, texto corrupto, etc).
- notes: un resumen breve (2-3 frases) de como te parecio la conversacion en general.`;

return [{
  json: {
    ...ctx,
    developer_prompt: developerPrompt,
    user_prompt: userPrompt
  }
}];
