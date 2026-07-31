-- AI Agents knowledge base v1.
-- Adds per-agent knowledge chunks and seeds Ahumada Detailing service knowledge.

create table if not exists public.agent_knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  agent_id uuid not null references public.agents(id),
  source_id uuid not null references public.agent_knowledge_sources(id) on delete cascade,
  chunk_index integer not null default 1,
  title text not null,
  content text not null,
  tags text[] not null default '{}'::text[],
  metadata jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_id, chunk_index)
);

create index if not exists idx_agent_knowledge_chunks_active
on public.agent_knowledge_chunks (agent_id, is_active, chunk_index);

create index if not exists idx_agent_knowledge_chunks_source
on public.agent_knowledge_chunks (source_id, is_active);

create index if not exists idx_agent_knowledge_chunks_tags
on public.agent_knowledge_chunks using gin (tags);

with base_agent as (
  select
    o.id as organization_id,
    a.id as agent_id
  from public.organizations o
  join public.agents a on a.organization_id = o.id
  where o.slug = 'ahumada_detailing'
    and a.slug = 'ahumada_detailing_closer'
  limit 1
),
source_seed as (
  select
    base_agent.organization_id,
    base_agent.agent_id,
    item.source_key,
    item.source_type,
    item.title,
    item.content,
    item.metadata
  from base_agent
  cross join (
    values
      (
        'ahumada_service_catalog',
        'manual',
        'Catalogo de servicios Ahumada Detailing',
        'Servicios disponibles: lavado premium, detailing interior, detailing exterior y servicio completo segun configuracion comercial vigente.',
        '{"category":"services","version":1}'::jsonb
      ),
      (
        'ahumada_booking_policy',
        'manual',
        'Politica de agenda Ahumada Detailing',
        'Para agendar se requiere servicio, tipo de vehiculo, comuna, horario disponible, direccion exacta y confirmacion del cliente.',
        '{"category":"booking","version":1}'::jsonb
      ),
      (
        'ahumada_pricing_policy',
        'manual',
        'Politica de precios Ahumada Detailing',
        'El agente no debe inventar precios. Debe cotizar solo con configuracion o herramienta de pricing disponible. Si falta informacion debe pedirla.',
        '{"category":"pricing","version":1}'::jsonb
      )
  ) as item(source_key, source_type, title, content, metadata)
),
upsert_sources as (
  insert into public.agent_knowledge_sources (
    organization_id,
    agent_id,
    source_key,
    source_type,
    title,
    content,
    metadata,
    is_active
  )
  select
    organization_id,
    agent_id,
    source_key,
    source_type,
    title,
    content,
    metadata,
    true
  from source_seed
  on conflict (agent_id, source_key) do update set
    source_type = excluded.source_type,
    title = excluded.title,
    content = excluded.content,
    metadata = excluded.metadata,
    is_active = true,
    updated_at = now()
  returning id, organization_id, agent_id, source_key
),
chunk_seed as (
  select
    s.organization_id,
    s.agent_id,
    s.id as source_id,
    item.chunk_index,
    item.title,
    item.content,
    item.tags,
    item.metadata
  from upsert_sources s
  join (
    values
      (
        'ahumada_service_catalog',
        1,
        'Servicios disponibles',
        'Ahumada Detailing ofrece servicios como lavado premium, detailing interior, detailing exterior y servicio completo. Si el usuario pregunta que incluye un servicio, explicar de forma breve y no agregar servicios que no esten en configuracion.',
        array['services','faq','service_menu']::text[],
        '{"answer_policy":"use_business_config_first"}'::jsonb
      ),
      (
        'ahumada_service_catalog',
        2,
        'Lavado premium',
        'Lavado premium: limpieza exterior e interior base, enfoque en dejar el vehiculo presentable y cuidado. Confirmar tipo de vehiculo y comuna antes de cotizar o agendar.',
        array['services','lavado_premium','faq']::text[],
        '{"service_interest":"lavado_premium"}'::jsonb
      ),
      (
        'ahumada_service_catalog',
        3,
        'Detailing interior',
        'Detailing interior: limpieza profunda del interior segun alcance configurado, orientado a tapices, superficies internas y terminaciones. No prometer procesos especificos no configurados.',
        array['services','detailing_interior','faq']::text[],
        '{"service_interest":"detailing_interior"}'::jsonb
      ),
      (
        'ahumada_service_catalog',
        4,
        'Detailing exterior',
        'Detailing exterior: trabajo enfocado en exterior del vehiculo segun alcance configurado. No prometer pulidos, sellados o tratamientos si no estan en la configuracion de negocio.',
        array['services','detailing_exterior','faq']::text[],
        '{"service_interest":"detailing_exterior"}'::jsonb
      ),
      (
        'ahumada_booking_policy',
        1,
        'Requisitos para agendar',
        'Antes de confirmar una reserva el agente debe tener servicio, tipo de vehiculo, comuna, fecha, hora disponible, direccion exacta y confirmacion explicita del cliente.',
        array['booking','guardrail','requirements']::text[],
        '{"required_before_booking":true}'::jsonb
      ),
      (
        'ahumada_pricing_policy',
        1,
        'No inventar precios',
        'Si el usuario pide precio y falta informacion, pedir los datos faltantes. Si la herramienta de cotizacion falla, bloquear booking automatico o derivar a humano.',
        array['pricing','guardrail','quote']::text[],
        '{"must_not_invent_prices":true}'::jsonb
      )
  ) as item(source_key, chunk_index, title, content, tags, metadata)
    on item.source_key = s.source_key
)
insert into public.agent_knowledge_chunks (
  organization_id,
  agent_id,
  source_id,
  chunk_index,
  title,
  content,
  tags,
  metadata,
  is_active
)
select
  organization_id,
  agent_id,
  source_id,
  chunk_index,
  title,
  content,
  tags,
  metadata,
  true
from chunk_seed
on conflict (source_id, chunk_index) do update set
  title = excluded.title,
  content = excluded.content,
  tags = excluded.tags,
  metadata = excluded.metadata,
  is_active = true,
  updated_at = now();

update public.agent_runtime_versions arv
set
  metadata = coalesce(arv.metadata, '{}'::jsonb) || '{"knowledge_version":1}'::jsonb,
  activated_at = coalesce(arv.activated_at, now())
from public.organizations o
join public.agents a on a.organization_id = o.id
where arv.agent_id = a.id
  and o.slug = 'ahumada_detailing'
  and a.slug = 'ahumada_detailing_closer'
  and arv.status = 'active';
