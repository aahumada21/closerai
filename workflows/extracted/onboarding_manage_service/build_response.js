// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: onboarding_manage_service  (workflow id bnQxcyxo3Hwwb7CK)
// Nodo:        build_response
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const input = $json || {};

if (input.status === "forbidden") {
  return [{ json: { ok: false, error: "forbidden", message: "El usuario no pertenece a esa organizacion." } }];
}
if (input.status === "agent_not_found") {
  return [{ json: { ok: false, error: "agent_not_found", message: "El agente no existe o no pertenece a esa organizacion." } }];
}
if (input.status === "config_not_found") {
  return [{ json: { ok: false, error: "config_not_found", message: "El agente no tiene una configuracion de negocio activa (agent_business_config). No se puede agregar/quitar un servicio hasta que exista una." } }];
}

const action = input.action;
const service = input.service || {};

let message;
if (action === "add") {
  message = input.service_already_existed
    ? `Servicio "${service.key}" actualizado.`
    : `Servicio "${service.key}" agregado.`;
  if (input.prices_requested_count > 0 && (input.prices_written_count || 0) === 0 && input.prices_action !== "none") {
    message += " Aviso: se esperaban precios pero no se pudieron insertar (revisar pricing_version activa del agente).";
  } else if (input.prices_requested_count === 0) {
    message += " Sin precios asociados todavia -- el servicio no se podra cotizar hasta que se agreguen.";
  }
} else {
  message = input.service_already_existed
    ? `Servicio "${service.key}" eliminado del catalogo (precios desactivados, historial preservado).`
    : `El servicio "${service.key}" no estaba en el catalogo -- nada que quitar (precios existentes, si los habia, quedaron desactivados igual).`;
}

return [{
  json: {
    ok: true,
    action,
    service_key: service.key,
    service_already_existed: input.service_already_existed,
    new_config_version: input.new_version_written || input.new_version,
    prices_action: input.prices_action,
    prices_written_count: input.prices_written_count || 0,
    message,
  }
}];
