-- Fase 9 - QA multiagente.
-- Crea fixtures controlados y 10 escenarios temp 569900389-569900389.
-- No desactiva escenarios previos; ejecuta con -ScenarioKey o -BatchMode -TempPrefix 56990038.

WITH qa_org AS (
  INSERT INTO public.organizations (slug, name, timezone, locale, is_active, metadata)
  VALUES
    ('qa_multiagent_org_a', 'QA Multiagent Org A', 'America/Santiago', 'es-CL', true, '{"qa_fixture":true}'::jsonb),
    ('qa_multiagent_org_b', 'QA Multiagent Org B', 'America/Santiago', 'es-CL', true, '{"qa_fixture":true}'::jsonb),
    ('qa_multiagent_org_inactive', 'QA Multiagent Inactive Org', 'America/Santiago', 'es-CL', true, '{"qa_fixture":true}'::jsonb)
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    is_active = EXCLUDED.is_active,
    metadata = EXCLUDED.metadata,
    updated_at = now()
  RETURNING id, slug
), qa_agents AS (
  INSERT INTO public.agents (
    organization_id,
    slug,
    name,
    role,
    description,
    personality,
    model_config,
    policies,
    is_active,
    metadata
  )
  SELECT
    o.id,
    v.slug,
    v.name,
    'closer',
    v.description,
    v.personality::jsonb,
    '{"provider":"openai","decision_mode":"structured_json","temperature":0.2}'::jsonb,
    v.policies::jsonb,
    v.is_active,
    '{"qa_fixture":true,"phase":"fase9_multiagent"}'::jsonb
  FROM public.organizations o
  JOIN (
    VALUES
      (
        'qa_multiagent_org_a',
        'qa_agent_lavado',
        'QA Agent Lavado',
        'Agente QA que solo vende lavado premium.',
        '{"tone":"directo","language":"es-CL"}',
        '{"must_not_invent_prices":true,"must_not_invent_availability":true}',
        true
      ),
      (
        'qa_multiagent_org_b',
        'qa_agent_polarizado',
        'QA Agent Polarizado',
        'Agente QA que solo informa polarizado.',
        '{"tone":"directo","language":"es-CL"}',
        '{"must_not_invent_prices":true,"must_not_invent_availability":true}',
        true
      ),
      (
        'qa_multiagent_org_inactive',
        'qa_agent_inactive',
        'QA Agent Inactive',
        'Agente QA inactivo.',
        '{"tone":"directo","language":"es-CL"}',
        '{"must_not_invent_prices":true,"must_not_invent_availability":true}',
        false
      )
  ) AS v(org_slug, slug, name, description, personality, policies, is_active)
    ON o.slug = v.org_slug
  ON CONFLICT (organization_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    personality = EXCLUDED.personality,
    policies = EXCLUDED.policies,
    is_active = EXCLUDED.is_active,
    metadata = EXCLUDED.metadata,
    updated_at = now()
  RETURNING id, organization_id, slug
), configs AS (
  INSERT INTO public.agent_business_config (organization_id, agent_id, version, is_active, config)
  SELECT
    a.organization_id,
    a.id,
    1,
    true,
    CASE a.slug
      WHEN 'qa_agent_lavado' THEN '{
        "business_name":"QA Lavado",
        "locale":"es-CL",
        "timezone":"America/Santiago",
        "services":[{"key":"lavado_premium","name":"Lavado premium","description":"Limpieza interior y exterior completa.","aliases":["lavado premium","premium"]}],
        "service_aliases":{"lavado premium":"lavado_premium","premium":"lavado_premium"},
        "coverage":{"districts":["Huechuraba"]},
        "pricing_policy":{"source":"legacy_pricing_workflow","must_not_invent_prices":true,"requires_service_vehicle_district":true},
        "booking_policy":{"duration_minutes_default":120,"max_slots_default":3,"requires_address_confirmation":true,"requires_availability_confirmation":true},
        "messages":{"ask_service":"Que servicio te interesa?","no_slots":"Por ahora no encontre horarios disponibles."},
        "agent_limits":{"do_not_confirm_without_address":true,"do_not_book_without_valid_quote":true,"do_not_invent_availability":true}
      }'::jsonb
      WHEN 'qa_agent_polarizado' THEN '{
        "business_name":"QA Polarizado",
        "locale":"es-CL",
        "timezone":"America/Santiago",
        "services":[{"key":"polarizado","name":"Polarizado","description":"Instalacion de lamina polarizada para vidrios.","aliases":["polarizado","lamina"]}],
        "service_aliases":{"polarizado":"polarizado","lamina":"polarizado"},
        "coverage":{"districts":["Santiago"]},
        "pricing_policy":{"source":"manual_only","must_not_invent_prices":true,"requires_service_vehicle_district":true},
        "booking_policy":{"enabled":false,"duration_minutes_default":0,"max_slots_default":0},
        "messages":{"ask_service":"Que servicio te interesa?","no_slots":"Este agente no tiene agenda automatica."},
        "agent_limits":{"do_not_confirm_without_address":true,"do_not_book_without_valid_quote":true,"do_not_invent_availability":true}
      }'::jsonb
      ELSE '{
        "business_name":"QA Inactive",
        "services":[{"key":"inactive","name":"Inactive","description":"No debe procesar."}],
        "agent_limits":{"do_not_invent_availability":true}
      }'::jsonb
    END
  FROM qa_agents a
  WHERE a.slug IN ('qa_agent_lavado','qa_agent_polarizado','qa_agent_inactive')
  ON CONFLICT (agent_id, version) DO UPDATE SET
    organization_id = EXCLUDED.organization_id,
    config = EXCLUDED.config,
    is_active = EXCLUDED.is_active,
    updated_at = now()
  RETURNING agent_id
), channels AS (
  INSERT INTO public.agent_channels (
    organization_id,
    agent_id,
    channel,
    provider,
    external_channel_id,
    display_name,
    is_active,
    config
  )
  SELECT
    a.organization_id,
    a.id,
    'whatsapp',
    'meta_whatsapp_cloud_api',
    CASE a.slug
      WHEN 'qa_agent_lavado' THEN 'qa-phone-agent-lavado'
      WHEN 'qa_agent_polarizado' THEN 'qa-phone-agent-polarizado'
      ELSE 'qa-phone-agent-inactive'
    END,
    CASE a.slug
      WHEN 'qa_agent_lavado' THEN 'QA Lavado'
      WHEN 'qa_agent_polarizado' THEN 'QA Polarizado'
      ELSE 'QA Inactive'
    END,
    true,
    '{"environment":"testing","qa_fixture":true}'::jsonb
  FROM qa_agents a
  WHERE a.slug IN ('qa_agent_lavado','qa_agent_polarizado','qa_agent_inactive')
  ON CONFLICT (provider, external_channel_id) DO UPDATE SET
    organization_id = EXCLUDED.organization_id,
    agent_id = EXCLUDED.agent_id,
    display_name = EXCLUDED.display_name,
    is_active = EXCLUDED.is_active,
    config = EXCLUDED.config,
    updated_at = now()
  RETURNING id
), ahumada_channel AS (
  INSERT INTO public.agent_channels (
    organization_id,
    agent_id,
    channel,
    provider,
    external_channel_id,
    display_name,
    is_active,
    config
  )
  SELECT
    a.organization_id,
    a.id,
    'whatsapp',
    'meta_whatsapp_cloud_api',
    'qa-phone-ahumada-agent-aware',
    'QA Ahumada Agent Aware',
    true,
    '{"environment":"testing","qa_fixture":true}'::jsonb
  FROM public.agents a
  JOIN public.organizations o ON o.id = a.organization_id
  WHERE o.slug = 'ahumada_detailing'
    AND a.slug = 'ahumada_detailing_closer'
  ON CONFLICT (provider, external_channel_id) DO UPDATE SET
    organization_id = EXCLUDED.organization_id,
    agent_id = EXCLUDED.agent_id,
    display_name = EXCLUDED.display_name,
    is_active = EXCLUDED.is_active,
    config = EXCLUDED.config,
    updated_at = now()
  RETURNING id
), tools AS (
  INSERT INTO public.agent_tools (
    organization_id,
    agent_id,
    tool_name,
    executor_type,
    executor_ref,
    required_fields,
    config,
    side_effect_level,
    is_active
  )
  SELECT
    a.organization_id,
    a.id,
    t.tool_name,
    t.executor_type,
    t.executor_ref,
    t.required_fields,
    t.config,
    t.side_effect_level,
    CASE
      WHEN a.slug = 'qa_agent_polarizado' AND t.tool_name LIKE 'calendar.%' THEN false
      ELSE true
    END
  FROM qa_agents a
  JOIN public.agents src_agent ON src_agent.slug = 'ahumada_detailing_closer'
  JOIN public.agent_tools t ON t.agent_id = src_agent.id
  WHERE a.slug IN ('qa_agent_lavado','qa_agent_polarizado')
  ON CONFLICT (agent_id, tool_name) DO UPDATE SET
    executor_type = EXCLUDED.executor_type,
    executor_ref = EXCLUDED.executor_ref,
    required_fields = EXCLUDED.required_fields,
    config = EXCLUDED.config,
    side_effect_level = EXCLUDED.side_effect_level,
    is_active = EXCLUDED.is_active,
    updated_at = now()
  RETURNING id
)
SELECT
  (SELECT count(*) FROM qa_agents) AS agents_upserted,
  (SELECT count(*) FROM channels) + (SELECT count(*) FROM ahumada_channel) AS channels_upserted;

INSERT INTO public.qa_test_scenarios_temp
(id, scenario_key, name, suite, enabled, priority, tags, steps, created_at, updated_at)
VALUES
(
  gen_random_uuid(),
  '569900380',
  'Fase9 QA380: legacy sin phone_number_id no procesa',
  'multiagent', true, 1,
  ARRAY['fase9','multiagent','legacy','negative','missing_phone_number_id'],
  '[{"role":"user","text":"Hola","expect":{"should_process":false}}]'::jsonb,
  now(), now()
),
(
  gen_random_uuid(),
  '569900381',
  'Fase9 QA381: Ahumada agent-aware resuelve agente',
  'multiagent', true, 1,
  ARRAY['fase9','multiagent','agent_aware','ahumada'],
  '[{"role":"user","text":"Hola","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},"expect":{"must_have_audit":true,"must_have_agent":true,"must_have_organization":true}},{"role":"user","text":"Quiero cotizar lavado premium","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},"expect":{"must_have_audit":true,"must_have_agent":true,"must_have_organization":true}}]'::jsonb,
  now(), now()
),
(
  gen_random_uuid(),
  '569900382',
  'Fase9 QA382: numero no configurado no procesa',
  'multiagent', true, 1,
  ARRAY['fase9','multiagent','unconfigured_number','negative'],
  '[{"role":"user","text":"Hola","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-not-configured"},"expect":{"should_process":false}}]'::jsonb,
  now(), now()
),
(
  gen_random_uuid(),
  '569900383',
  'Fase9 QA383: agente inactivo no procesa',
  'multiagent', true, 1,
  ARRAY['fase9','multiagent','inactive_agent','negative'],
  '[{"role":"user","text":"Hola","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-agent-inactive"},"expect":{"should_process":false}}]'::jsonb,
  now(), now()
),
(
  gen_random_uuid(),
  '569900384',
  'Fase9 QA384: agente lavado responde sin mezclar polarizado',
  'multiagent', true, 1,
  ARRAY['fase9','multiagent','routing','agent_lavado'],
  '[{"role":"user","text":"Que servicios tienen?","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-agent-lavado"},"expect":{"must_have_audit":true,"must_have_agent":true,"must_have_organization":true,"response_includes_any":["lavado","premium"],"response_not_includes":["Polarizado","polarizado"]}}]'::jsonb,
  now(), now()
),
(
  gen_random_uuid(),
  '569900385',
  'Fase9 QA385: agente polarizado responde sin mezclar lavado',
  'multiagent', true, 1,
  ARRAY['fase9','multiagent','routing','agent_polarizado'],
  '[{"role":"user","text":"Que servicios tienen?","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-agent-polarizado"},"expect":{"must_have_audit":true,"must_have_agent":true,"must_have_organization":true,"response_includes_any":["polarizado","lamina"],"response_not_includes":["Lavado premium","lavado premium"]}}]'::jsonb,
  now(), now()
),
(
  gen_random_uuid(),
  '569900386',
  'Fase9 QA386: agente sin calendar no ofrece agenda automatica',
  'multiagent', true, 1,
  ARRAY['fase9','multiagent','no_calendar','tools'],
  '[{"role":"user","text":"Quiero agendar polarizado","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-agent-polarizado"},"expect":{"must_have_audit":true,"must_have_agent":true,"must_have_organization":true,"response_not_includes":["1.","2.","3.","horarios disponibles"]}}]'::jsonb,
  now(), now()
),
(
  gen_random_uuid(),
  '569900387',
  'Fase9 QA387: agente sin pricing no confirma cotizacion inventada',
  'multiagent', true, 1,
  ARRAY['fase9','multiagent','no_pricing','guardrail'],
  '[{"role":"user","text":"Cuanto cuesta polarizado para SUV en Santiago?","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-agent-polarizado"},"expect":{"must_have_audit":true,"must_have_agent":true,"must_have_organization":true,"response_not_includes":["$","CLP","vale"]}}]'::jsonb,
  now(), now()
),
(
  gen_random_uuid(),
  '569900388',
  'Fase9 QA388: allowed_actions cambia por agente',
  'multiagent', true, 1,
  ARRAY['fase9','multiagent','allowed_actions','agent_tools'],
  '[{"role":"user","text":"Agendar","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-agent-polarizado"},"expect":{"must_have_audit":true,"must_have_agent":true,"must_have_organization":true,"response_not_includes":["elige 1","opcion 1","horarios disponibles"]}}]'::jsonb,
  now(), now()
),
(
  gen_random_uuid(),
  '569900389',
  'Fase9 QA389: auditoria incluye agent organization y tool',
  'multiagent', true, 1,
  ARRAY['fase9','multiagent','audit','tool_registry'],
  '[{"role":"user","text":"Hola","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-agent-lavado"},"expect":{"must_have_audit":true,"must_have_agent":true,"must_have_organization":true,"tool_name_any":["message.send"]}}]'::jsonb,
  now(), now()
)
ON CONFLICT (scenario_key) DO UPDATE SET
  name = EXCLUDED.name,
  suite = EXCLUDED.suite,
  enabled = true,
  priority = EXCLUDED.priority,
  tags = EXCLUDED.tags,
  steps = EXCLUDED.steps,
  updated_at = now();

SELECT scenario_key, enabled, name
FROM public.qa_test_scenarios_temp
WHERE scenario_key BETWEEN '569900380' AND '569900389'
ORDER BY scenario_key;


