// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: onboarding_create_agent  (workflow id OnHysjH5lvf77zbJ)
// Nodo:        build_create_agent_query
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const input = $json || {};

function sqlText(value) {
  if (value === undefined || value === null || value === "") return "NULL";
  return "'" + String(value).replace(/'/g, "''") + "'";
}

function sqlUuidOrNull(value) {
  const text = String(value || "").trim();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(text);
  return isUuid ? "'" + text + "'" : "NULL";
}

function sqlJsonb(value) {
  const json = JSON.stringify(value === undefined ? null : value);
  return "'" + json.replace(/'/g, "''") + "'::jsonb";
}

if (!input.valid) {
  return [{ json: { ...input, create_agent_query: null } }];
}

const query = `
WITH membership AS (
  SELECT EXISTS (
    SELECT 1 FROM organization_members
    WHERE user_id = ${sqlUuidOrNull(input.user_id)}
      AND organization_id = ${sqlUuidOrNull(input.organization_id)}
  ) AS is_member
),
new_agent AS (
  INSERT INTO agents (organization_id, slug, name, role, is_active)
  SELECT ${sqlUuidOrNull(input.organization_id)}, ${sqlText(input.slug)}, ${sqlText(input.agent_name)}, 'closer', true
  FROM membership WHERE membership.is_member
  RETURNING id, organization_id
),
new_business_config AS (
  INSERT INTO agent_business_config (organization_id, agent_id, version, is_active, config)
  SELECT organization_id, id, 1, true, ${sqlJsonb(input.business_config)}
  FROM new_agent
  RETURNING id, agent_id
),
new_pricing_version AS (
  INSERT INTO pricing_versions (agent_id, name, is_active, valid_from)
  SELECT id, 'onboarding_v1', true, now()
  FROM new_agent
  RETURNING id, agent_id
),
new_prices AS (
  INSERT INTO service_vehicle_prices (pricing_version_id, service_code, vehicle_type, base_price, is_active)
  SELECT npv.id, v.service_code, v.vehicle_type, v.base_price, true
  FROM new_pricing_version npv
  CROSS JOIN (
    VALUES
      ('lavado_basico', 'sedan', 25000),
      ('lavado_basico', 'suv', 30000),
      ('lavado_basico', 'camioneta', 32000),
      ('lavado_premium', 'sedan', 35000),
      ('lavado_premium', 'suv', 40000),
      ('lavado_premium', 'camioneta', 45000),
      ('encerado_full', 'sedan', 60000),
      ('encerado_full', 'suv', 70000),
      ('encerado_full', 'camioneta', 80000)
  ) AS v(service_code, vehicle_type, base_price)
  RETURNING id
)
SELECT
  (SELECT is_member FROM membership) AS is_member,
  (SELECT id FROM new_agent) AS agent_id,
  (SELECT organization_id FROM new_agent) AS organization_id,
  (SELECT id FROM new_business_config) AS business_config_id,
  (SELECT id FROM new_pricing_version) AS pricing_version_id,
  (SELECT count(*) FROM new_prices) AS prices_created;
`;

return [{
  json: {
    ...input,
    create_agent_query: query
  }
}];
