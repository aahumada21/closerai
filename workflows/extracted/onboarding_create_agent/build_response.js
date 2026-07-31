// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: onboarding_create_agent  (workflow id OnHysjH5lvf77zbJ)
// Nodo:        build_response
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const input = $json || {};

if (input.status === "forbidden") {
  return [{
    json: {
      ok: false,
      error: "forbidden",
      message: "El usuario no pertenece a esa organizacion.",
      agent_id: null
    }
  }];
}

if (input.status === "creation_failed") {
  return [{
    json: {
      ok: false,
      error: "creation_failed",
      message: "No se pudo crear el agente. Revisa el slug o intenta de nuevo.",
      agent_id: null
    }
  }];
}

return [{
  json: {
    ok: true,
    agent_id: input.agent_id,
    organization_id: input.organization_id,
    slug: input.slug,
    agent_name: input.agent_name,
    business_config_id: input.business_config_id,
    pricing_version_id: input.pricing_version_id,
    prices_created: input.prices_created,
    channel_created: input.channel_created || false,
    channel_id: input.channel_id || null
  }
}];
