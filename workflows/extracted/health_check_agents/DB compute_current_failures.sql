-- === ARCHIVO GENERADO -- NO EDITAR ===
-- Extraido de: health_check_agents  (workflow id ZgKBBYK2ZUyNIM7r)
-- Nodo:        DB compute_current_failures
--
-- La fuente de verdad es el JSON del workflow en workflows/exports/.
-- Regenerar con: node scripts/extract_workflow_code.js
-- =====================================

WITH agent_config AS (
  SELECT
    a.id AS agent_id,
    a.organization_id,
    a.name AS agent_name,
    ac.id AS channel_id,
    bc.id AS business_config_id,
    bc.config AS config,
    jsonb_array_length(COALESCE(bc.config->'schedule', '[]'::jsonb)) AS schedule_blocks,
    bc.config->>'calendar_id' AS fallback_calendar_id,
    pv.id AS pricing_version_id,
    (SELECT count(*) FROM agent_staff s WHERE s.agent_id = a.id AND s.is_active = true) AS active_staff_count
  FROM agents a
  LEFT JOIN agent_channels ac ON ac.agent_id = a.id AND ac.is_active = true
  LEFT JOIN agent_business_config bc ON bc.agent_id = a.id AND bc.is_active = true
  LEFT JOIN pricing_versions pv ON pv.agent_id = a.id AND pv.is_active = true
  WHERE a.is_active = true
),
config_failures AS (
  SELECT organization_id, agent_id, agent_name, 'missing_channel' AS check_key, 'critical' AS severity,
    'El agente "' || agent_name || '" no tiene ningun canal activo (WhatsApp/webchat) conectado.' AS message,
    '{}'::jsonb AS details
  FROM agent_config WHERE channel_id IS NULL
  UNION ALL
  SELECT organization_id, agent_id, agent_name, 'missing_business_config', 'critical',
    'El agente "' || agent_name || '" no tiene una configuracion de negocio activa (agent_business_config).', '{}'::jsonb
  FROM agent_config WHERE business_config_id IS NULL
  UNION ALL
  SELECT organization_id, agent_id, agent_name, 'no_schedule', 'critical',
    'El agente "' || agent_name || '" tiene configuracion de negocio pero sin horarios definidos (schedule vacio): no puede ofrecer horas.', '{}'::jsonb
  FROM agent_config WHERE business_config_id IS NOT NULL AND schedule_blocks = 0
  UNION ALL
  SELECT organization_id, agent_id, agent_name, 'missing_pricing', 'critical',
    'El agente "' || agent_name || '" no tiene una version de precios activa: no puede cotizar.', '{}'::jsonb
  FROM agent_config WHERE pricing_version_id IS NULL
  UNION ALL
  SELECT organization_id, agent_id, agent_name, 'missing_calendar', 'critical',
    'El agente "' || agent_name || '" no tiene calendario configurado (ni calendario propio ni personal activo en agent_staff): no puede agendar.', '{}'::jsonb
  FROM agent_config WHERE fallback_calendar_id IS NULL AND active_staff_count = 0
),
last_inbound AS (
  SELECT DISTINCT ON (m.lead_id)
    m.lead_id, m.created_at AS inbound_at, l.agent_id, l.organization_id
  FROM messages m
  JOIN leads l ON l.id = m.lead_id
  WHERE m.direction = 'inbound'
    AND m.created_at > now() - interval '24 hours'
  ORDER BY m.lead_id, m.created_at DESC
),
unanswered AS (
  SELECT li.agent_id, li.organization_id, count(*) AS unanswered_count, max(li.inbound_at) AS most_recent_unanswered_at
  FROM last_inbound li
  WHERE li.inbound_at < now() - interval '15 minutes'
    AND NOT EXISTS (
      SELECT 1 FROM messages mo
      WHERE mo.lead_id = li.lead_id AND mo.direction = 'outbound' AND mo.created_at > li.inbound_at
    )
  GROUP BY li.agent_id, li.organization_id
),
response_failures AS (
  SELECT u.organization_id, u.agent_id, ac2.agent_name, 'no_response_gap' AS check_key, 'critical' AS severity,
    'El agente "' || ac2.agent_name || '" tiene ' || u.unanswered_count || ' mensaje(s) de cliente sin respuesta hace mas de 15 minutos (ultimo: ' || to_char(u.most_recent_unanswered_at, 'DD/MM HH24:MI') || ').' AS message,
    jsonb_build_object('unanswered_count', u.unanswered_count, 'most_recent_unanswered_at', u.most_recent_unanswered_at) AS details
  FROM unanswered u
  JOIN agent_config ac2 ON ac2.agent_id = u.agent_id
),
failed_msgs AS (
  SELECT l.agent_id, l.organization_id, count(*) AS failed_count
  FROM messages m
  JOIN leads l ON l.id = m.lead_id
  WHERE m.direction = 'outbound' AND m.status = 'failed'
    AND m.created_at > now() - interval '24 hours'
  GROUP BY l.agent_id, l.organization_id
),
error_failures AS (
  SELECT f.organization_id, f.agent_id, ac3.agent_name, 'failed_messages' AS check_key, 'warning' AS severity,
    'El agente "' || ac3.agent_name || '" tuvo ' || f.failed_count || ' mensaje(s) de salida fallidos en las ultimas 24h.' AS message,
    jsonb_build_object('failed_count', f.failed_count) AS details
  FROM failed_msgs f
  JOIN agent_config ac3 ON ac3.agent_id = f.agent_id
),
all_failures AS (
  SELECT organization_id, agent_id, agent_name, check_key, severity, message, details FROM config_failures
  UNION ALL
  SELECT organization_id, agent_id, agent_name, check_key, severity, message, details FROM response_failures
  UNION ALL
  SELECT organization_id, agent_id, agent_name, check_key, severity, message, details FROM error_failures
)
SELECT COALESCE(json_agg(row_to_json(all_failures)), '[]'::json) AS failures
FROM all_failures;
