-- Meta WhatsApp Cloud API multi-number support.
-- Run this in Supabase/Postgres before enabling whatsapp_webhook_meta.

create table if not exists public.whatsapp_numbers (
  phone_number_id text primary key,
  waba_id text null,
  display_phone_number text null,
  business_name text null,
  environment text not null default 'production'
    check (environment in ('testing', 'production')),
  is_active boolean not null default true,
  default_agent text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_whatsapp_numbers_waba_id
on public.whatsapp_numbers (waba_id);

create index if not exists idx_whatsapp_numbers_active
on public.whatsapp_numbers (is_active, environment);

create table if not exists public.whatsapp_webhook_logs (
  id uuid primary key default gen_random_uuid(),
  event_received_at timestamptz not null default now(),
  event_type text not null,
  phone_number_id text null,
  message_id text null,
  lead_id text null,
  idempotency_key text null,
  normalized_ok boolean not null default false,
  error text null,
  raw jsonb not null default '{}'::jsonb,
  normalized_event jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists uq_whatsapp_webhook_logs_idempotency_key
on public.whatsapp_webhook_logs (idempotency_key)
where idempotency_key is not null;

create index if not exists idx_whatsapp_webhook_logs_phone_number
on public.whatsapp_webhook_logs (phone_number_id, created_at desc);

create index if not exists idx_whatsapp_webhook_logs_message
on public.whatsapp_webhook_logs (message_id);
