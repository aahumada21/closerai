-- AI Agents foundation.
-- Creates multi-organization / multi-agent configuration tables without changing runtime behavior.

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  timezone text not null default 'America/Santiago',
  locale text not null default 'es-CL',
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  slug text not null,
  name text not null,
  role text not null default 'closer',
  description text null,
  personality jsonb not null default '{}'::jsonb,
  model_config jsonb not null default '{}'::jsonb,
  policies jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, slug)
);

create index if not exists idx_agents_organization_active
on public.agents (organization_id, is_active);

create table if not exists public.agent_channels (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  agent_id uuid not null references public.agents(id),
  channel text not null,
  provider text not null,
  external_channel_id text not null,
  display_name text null,
  is_active boolean not null default true,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, external_channel_id)
);

create index if not exists idx_agent_channels_agent_active
on public.agent_channels (agent_id, is_active);

create index if not exists idx_agent_channels_org_active
on public.agent_channels (organization_id, is_active);

create table if not exists public.agent_business_config (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  agent_id uuid not null references public.agents(id),
  config jsonb not null default '{}'::jsonb,
  version integer not null default 1,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (agent_id, version)
);

create index if not exists idx_agent_business_config_active
on public.agent_business_config (agent_id, is_active, version desc);

create table if not exists public.agent_rules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  agent_id uuid not null references public.agents(id),
  rule_key text not null,
  priority integer not null default 100,
  rule_type text not null,
  config jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (agent_id, rule_key)
);

create index if not exists idx_agent_rules_active_priority
on public.agent_rules (agent_id, is_active, priority);

create table if not exists public.agent_tools (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  agent_id uuid not null references public.agents(id),
  tool_name text not null,
  executor_type text not null
    check (executor_type in ('workflow', 'http', 'sql', 'internal')),
  executor_ref text not null,
  required_fields jsonb not null default '[]'::jsonb,
  config jsonb not null default '{}'::jsonb,
  side_effect_level text not null default 'medium'
    check (side_effect_level in ('none', 'low', 'medium', 'high')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (agent_id, tool_name)
);

create index if not exists idx_agent_tools_active
on public.agent_tools (agent_id, is_active);

create table if not exists public.agent_knowledge_sources (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  agent_id uuid not null references public.agents(id),
  source_key text not null,
  source_type text not null
    check (source_type in ('text', 'url', 'file', 'database', 'manual')),
  title text not null,
  content text null,
  uri text null,
  metadata jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (agent_id, source_key)
);

create index if not exists idx_agent_knowledge_sources_active
on public.agent_knowledge_sources (agent_id, is_active);

create table if not exists public.agent_prompt_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  agent_id uuid not null references public.agents(id),
  template_key text not null,
  template_type text not null
    check (template_type in ('decision', 'message', 'tool', 'fallback', 'system')),
  content text not null,
  variables jsonb not null default '[]'::jsonb,
  version integer not null default 1,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (agent_id, template_key, version)
);

create index if not exists idx_agent_prompt_templates_active
on public.agent_prompt_templates (agent_id, template_key, is_active, version desc);

create table if not exists public.agent_runtime_versions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  agent_id uuid not null references public.agents(id),
  version integer not null,
  business_config_version integer null,
  prompt_version integer null,
  rules_version integer null,
  tools_version integer null,
  status text not null default 'draft'
    check (status in ('draft', 'active', 'archived')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  activated_at timestamptz null,
  unique (agent_id, version)
);

create index if not exists idx_agent_runtime_versions_status
on public.agent_runtime_versions (agent_id, status, version desc);

-- Seed current business as the first organization/agent.
with org as (
  insert into public.organizations (
    slug,
    name,
    timezone,
    locale,
    is_active,
    metadata
  )
  values (
    'ahumada_detailing',
    'Ahumada Detailing',
    'America/Santiago',
    'es-CL',
    true,
    '{"source":"ai_agents_foundation_seed"}'::jsonb
  )
  on conflict (slug) do update set
    name = excluded.name,
    timezone = excluded.timezone,
    locale = excluded.locale,
    is_active = excluded.is_active,
    updated_at = now()
  returning id
),
agent as (
  insert into public.agents (
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
  select
    org.id,
    'ahumada_detailing_closer',
    'Ahumada Detailing Closer',
    'closer',
    'AI closer comercial para cotizar, agendar, cancelar y reagendar servicios de detailing.',
    '{
      "tone": "claro, directo y profesional",
      "language": "es-CL",
      "style": "breve, orientado a cierre comercial",
      "avoid": ["inventar precios", "inventar horarios", "confirmar sin direccion"]
    }'::jsonb,
    '{
      "provider": "openai",
      "decision_mode": "structured_json",
      "temperature": 0.2
    }'::jsonb,
    '{
      "must_use_allowed_actions": true,
      "must_not_execute_tools": true,
      "must_not_invent_prices": true,
      "must_not_invent_availability": true,
      "must_confirm_address_before_booking": true
    }'::jsonb,
    true,
    '{"source":"ai_agents_foundation_seed","legacy_runtime":"ahumada_detailing"}'::jsonb
  from org
  on conflict (organization_id, slug) do update set
    name = excluded.name,
    role = excluded.role,
    description = excluded.description,
    personality = excluded.personality,
    model_config = excluded.model_config,
    policies = excluded.policies,
    is_active = excluded.is_active,
    updated_at = now()
  returning id, organization_id
),
business_config as (
  insert into public.agent_business_config (
    organization_id,
    agent_id,
    version,
    is_active,
    config
  )
  select
    agent.organization_id,
    agent.id,
    1,
    true,
    '{
      "business_name": "Ahumada Detailing",
      "currency": "CLP",
      "services": [
        {
          "key": "lavado_basico",
          "name": "Lavado basico",
          "aliases": ["lavado basico", "basico"]
        },
        {
          "key": "lavado_premium",
          "name": "Lavado premium",
          "aliases": ["lavado premium", "premium"]
        },
        {
          "key": "encerado_full",
          "name": "Encerado full",
          "aliases": ["encerado", "encerado full"]
        }
      ],
      "coverage": {
        "districts": [
          "Huechuraba",
          "Vitacura",
          "Las Condes",
          "Providencia",
          "Lo Barnechea",
          "Santiago",
          "Nunoa",
          "Independencia",
          "Recoleta",
          "Quilicura",
          "Conchali",
          "Colina",
          "La Reina",
          "Penalolen",
          "Macul",
          "La Florida",
          "Maipu",
          "San Miguel",
          "La Cisterna",
          "Puente Alto",
          "Pudahuel",
          "Renca"
        ]
      },
      "booking": {
        "duration_minutes_default": 120,
        "requires_address_confirmation": true,
        "max_slots_default": 3,
        "timezone": "America/Santiago"
      },
      "pricing_policy": {
        "source": "legacy_pricing_workflow",
        "must_not_invent_prices": true
      }
    }'::jsonb
  from agent
  on conflict (agent_id, version) do update set
    organization_id = excluded.organization_id,
    config = excluded.config,
    is_active = excluded.is_active,
    updated_at = now()
  returning id
),
prompt_template as (
  insert into public.agent_prompt_templates (
    organization_id,
    agent_id,
    template_key,
    template_type,
    content,
    variables,
    version,
    is_active
  )
  select
    agent.organization_id,
    agent.id,
    'decision_prompt',
    'decision',
    'Eres la capa de decision de un AI Closer comercial. Debes devolver solo una decision JSON valida usando allowed_actions y respetando la configuracion del agente.',
    '["agent","business","state","conversation","allowed_actions"]'::jsonb,
    1,
    true
  from agent
  on conflict (agent_id, template_key, version) do update set
    content = excluded.content,
    variables = excluded.variables,
    is_active = excluded.is_active,
    updated_at = now()
  returning id
)
insert into public.agent_runtime_versions (
  organization_id,
  agent_id,
  version,
  business_config_version,
  prompt_version,
  rules_version,
  tools_version,
  status,
  metadata,
  activated_at
)
select
  agent.organization_id,
  agent.id,
  1,
  1,
  1,
  null,
  null,
  'active',
  '{"source":"ai_agents_foundation_seed"}'::jsonb,
  now()
from agent
on conflict (agent_id, version) do update set
  status = excluded.status,
  business_config_version = excluded.business_config_version,
  prompt_version = excluded.prompt_version,
  metadata = excluded.metadata,
  activated_at = coalesce(public.agent_runtime_versions.activated_at, excluded.activated_at);

-- Optional channel mapping for the currently registered Meta phone number used in local exports.
with org as (
  select id from public.organizations where slug = 'ahumada_detailing'
),
agent as (
  select a.id, a.organization_id
  from public.agents a
  join org on org.id = a.organization_id
  where a.slug = 'ahumada_detailing_closer'
)
insert into public.agent_channels (
  organization_id,
  agent_id,
  channel,
  provider,
  external_channel_id,
  display_name,
  is_active,
  config
)
select
  agent.organization_id,
  agent.id,
  'whatsapp',
  'meta_whatsapp_cloud_api',
  '1041798619026307',
  'Ahumada Detailing WhatsApp',
  true,
  '{"source":"legacy_inbound_router_phone_filter"}'::jsonb
from agent
on conflict (provider, external_channel_id) do update set
  organization_id = excluded.organization_id,
  agent_id = excluded.agent_id,
  channel = excluded.channel,
  display_name = excluded.display_name,
  is_active = excluded.is_active,
  config = excluded.config,
  updated_at = now();
