// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: health_check_agents  (workflow id ZgKBBYK2ZUyNIM7r)
// Nodo:        build_alert_query
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const raw = $json.failures;
const failures = Array.isArray(raw) ? raw : (typeof raw === "string" ? JSON.parse(raw) : []);

function sqlText(value) {
  if (value === undefined || value === null || value === "") return "NULL";
  return "'" + String(value).replace(/'/g, "''") + "'";
}

function sqlUuid(value) {
  const text = String(value || "").trim();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(text);
  if (!isUuid) throw new Error("Invalid uuid in health check failure row: " + text);
  return "'" + text + "'::uuid";
}

function sqlJsonb(value) {
  const json = JSON.stringify(value === undefined ? {} : value);
  return "'" + json.replace(/'/g, "''") + "'::jsonb";
}

if (failures.length === 0) {
  return [{
    json: {
      alert_query: `
WITH resolved AS (
  UPDATE public.health_alerts
  SET status = 'resolved', resolved_at = now()
  WHERE status = 'open'
  RETURNING id
)
SELECT 0 AS upserted_count, (SELECT count(*) FROM resolved) AS resolved_count;
`,
      has_failures: false
    }
  }];
}

const valuesRows = failures.map((f) => {
  return "(" + [
    sqlUuid(f.organization_id),
    sqlUuid(f.agent_id),
    sqlText(f.check_key),
    sqlText(f.severity || "critical"),
    sqlText(f.message),
    sqlJsonb(f.details)
  ].join(", ") + ")";
}).join(",\n    ");

const query = `
WITH incoming(organization_id, agent_id, check_key, severity, message, details) AS (
  VALUES
    ${valuesRows}
),
prior AS (
  SELECT ha.agent_id, ha.check_key, ha.status AS prior_status
  FROM public.health_alerts ha
  JOIN incoming i ON i.agent_id = ha.agent_id AND i.check_key = ha.check_key
),
upserted AS (
  INSERT INTO public.health_alerts (organization_id, agent_id, check_key, severity, message, details, status, first_detected_at, last_detected_at)
  SELECT organization_id, agent_id, check_key, severity, message, details, 'open', now(), now()
  FROM incoming
  ON CONFLICT (agent_id, check_key) DO UPDATE SET
    severity = EXCLUDED.severity,
    message = EXCLUDED.message,
    details = EXCLUDED.details,
    last_detected_at = now(),
    first_detected_at = CASE WHEN public.health_alerts.status = 'open' THEN public.health_alerts.first_detected_at ELSE now() END,
    status = 'open',
    resolved_at = NULL
  RETURNING id, organization_id, agent_id, check_key, severity, message
),
resolved AS (
  UPDATE public.health_alerts ha
  SET status = 'resolved', resolved_at = now()
  WHERE ha.status = 'open'
    AND NOT EXISTS (
      SELECT 1 FROM incoming i WHERE i.agent_id = ha.agent_id AND i.check_key = ha.check_key
    )
  RETURNING ha.id
)
SELECT u.id, u.organization_id, u.agent_id, u.check_key, u.severity, u.message,
       COALESCE(p.prior_status, 'none') AS prior_status,
       o.alert_whatsapp_number, o.alert_email, o.name AS organization_name
FROM upserted u
LEFT JOIN prior p ON p.agent_id = u.agent_id AND p.check_key = u.check_key
LEFT JOIN public.organizations o ON o.id = u.organization_id;
`;

return [{ json: { alert_query: query, has_failures: true } }];
