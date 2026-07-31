-- Per-organization payment provider credentials (Flow.cl y futuros proveedores).
-- Hoy toda la plataforma comparte $env.FLOW_API_KEY/FLOW_SECRET_KEY (una sola cuenta
-- merchant para todos los tenants). Esta tabla permite que una organizacion nueva
-- traiga su propia cuenta Flow.cl sin tocar codigo -- si no tiene fila activa, los
-- workflows caen al env global (comportamiento actual, cero regresion).
--
-- Sin RLS expuesta al panel: son secretos (api_key/secret_key), analogos a por que
-- ONBOARDING_API_TOKEN nunca vive en el cliente. Solo el rol de servicio que ya usa
-- n8n (bypassa RLS) puede leer/escribir esta tabla.

create table if not exists public.organization_payment_credentials (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  provider text not null,
  api_key text not null,
  secret_key text not null,
  api_url text null,
  environment text not null default 'production',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists uq_org_payment_credentials_active
on public.organization_payment_credentials (organization_id, provider)
where is_active = true;

create index if not exists idx_org_payment_credentials_org
on public.organization_payment_credentials (organization_id);

alter table public.organization_payment_credentials enable row level security;
-- Sin policies: authenticated/anon no tienen ningun acceso. Solo service_role.
