-- === ARCHIVO GENERADO -- NO EDITAR ===
-- Extraido de: 2 lead_loader  (workflow id f5383ae7-dd2e-4177-9875-c6dcff27e3d5)
-- Nodo:        db_load_agent_config
--
-- La fuente de verdad es el JSON del workflow en workflows/exports/.
-- Regenerar con: node scripts/extract_workflow_code.js
-- =====================================

with input as (
  select nullif('{{ String($node["code_prepare_lookup"].json["lookup"]?.agent_id || "").replace(/'/g, "''") }}', '')::uuid as agent_id
), selected_agent as (
  select
    a.id as agent_id,
    a.slug as agent_slug,
    a.name as agent_name,
    a.role as agent_role,
    a.description as agent_description,
    a.personality,
    a.model_config,
    a.policies,
    a.is_active as agent_is_active,
    o.id as organization_id,
    o.slug as organization_slug,
    o.name as organization_name,
    o.timezone,
    o.locale,
    o.is_active as organization_is_active
  from input i
  join public.agents a on a.id = i.agent_id
  join public.organizations o on o.id = a.organization_id
  where a.is_active = true and o.is_active = true
  limit 1
), business_config as (
  select abc.*
  from public.agent_business_config abc
  join selected_agent sa on sa.agent_id = abc.agent_id
  where abc.is_active = true
  order by abc.version desc
  limit 1
), rules as (
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', ar.id,
    'rule_key', ar.rule_key,
    'priority', ar.priority,
    'rule_type', ar.rule_type,
    'config', ar.config
  ) order by ar.priority asc), '[]'::jsonb) as items
  from public.agent_rules ar
  join selected_agent sa on sa.agent_id = ar.agent_id
  where ar.is_active = true
), tools as (
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', at.id,
    'tool_name', at.tool_name,
    'executor_type', at.executor_type,
    'executor_ref', at.executor_ref,
    'required_fields', at.required_fields,
    'config', at.config,
    'side_effect_level', at.side_effect_level
  ) order by at.tool_name asc), '[]'::jsonb) as items
  from public.agent_tools at
  join selected_agent sa on sa.agent_id = at.agent_id
  where at.is_active = true
), staff as (
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', ast.id,
    'name', ast.name,
    'calendar_id', ast.calendar_id,
    'services', to_jsonb(ast.services),
    'display_order', ast.display_order,
    'schedule', coalesce(ast.schedule, 'null'::jsonb)
  ) order by ast.display_order asc, ast.name asc), '[]'::jsonb) as items
  from public.agent_staff ast
  join selected_agent sa on sa.agent_id = ast.agent_id
  where ast.is_active = true
)
select
  exists(select 1 from selected_agent) as agent_context_loaded,
  case when sa.organization_id is null then null else jsonb_build_object(
    'id', sa.organization_id,
    'slug', sa.organization_slug,
    'name', sa.organization_name,
    'timezone', sa.timezone,
    'locale', sa.locale,
    'is_active', sa.organization_is_active
  ) end as organization,
  case when sa.agent_id is null then null else jsonb_build_object(
    'id', sa.agent_id,
    'slug', sa.agent_slug,
    'name', sa.agent_name,
    'role', sa.agent_role,
    'description', sa.agent_description,
    'personality', sa.personality,
    'model_config', sa.model_config,
    'policies', sa.policies,
    'is_active', sa.agent_is_active
  ) end as agent,
  case when bc.id is null then null else jsonb_build_object(
    'id', bc.id,
    'version', bc.version,
    'config', bc.config,
    'is_active', bc.is_active
  ) end as agent_business_config,
  coalesce((select items from rules), '[]'::jsonb) as agent_rules,
  coalesce((select items from tools), '[]'::jsonb) as agent_tools,
  coalesce((select items from staff), '[]'::jsonb) as agent_staff
from input i
left join selected_agent sa on true
left join business_config bc on true;
