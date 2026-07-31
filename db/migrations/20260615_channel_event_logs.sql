-- Omnichannel channel event logs.
-- Common normalized event/debug log for WhatsApp, Instagram, webchat and future channels.

create table if not exists public.channel_event_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid null references public.organizations(id),
  agent_id uuid null references public.agents(id),
  channel text not null,
  provider text not null,
  external_channel_id text null,
  event_type text not null,
  message_id text null,
  lead_id text null,
  idempotency_key text not null unique,
  normalized_ok boolean not null default false,
  error text null,
  normalized_event jsonb not null default '{}'::jsonb,
  raw jsonb not null default '{}'::jsonb,
  event_received_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_channel_event_logs_org_agent_received
on public.channel_event_logs (organization_id, agent_id, event_received_at desc);

create index if not exists idx_channel_event_logs_channel_provider_received
on public.channel_event_logs (channel, provider, event_received_at desc);

create index if not exists idx_channel_event_logs_external_channel
on public.channel_event_logs (provider, external_channel_id, event_received_at desc);

create index if not exists idx_channel_event_logs_message
on public.channel_event_logs (message_id)
where message_id is not null;

create index if not exists idx_channel_event_logs_lead
on public.channel_event_logs (lead_id, event_received_at desc)
where lead_id is not null;

create index if not exists idx_channel_event_logs_error
on public.channel_event_logs (normalized_ok, event_received_at desc)
where normalized_ok = false;

comment on table public.channel_event_logs is
  'Common omnichannel event log for normalized inbound/status events before they enter the AI Closer core.';

comment on column public.channel_event_logs.external_channel_id is
  'Provider-specific channel id: WhatsApp phone_number_id, Instagram business account id, webchat widget_id/site_id, etc.';

comment on column public.channel_event_logs.idempotency_key is
  'Stable unique key per provider event to prevent duplicate processing/logging.';

comment on column public.channel_event_logs.normalized_event is
  'Channel-agnostic normalized event emitted by inbound adapters.';
