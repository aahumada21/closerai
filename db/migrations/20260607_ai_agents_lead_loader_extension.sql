-- AI Agents lead loader extension.
-- Adds nullable tenant/agent references without changing existing lead uniqueness.

alter table public.leads
add column if not exists organization_id uuid null references public.organizations(id),
add column if not exists agent_id uuid null references public.agents(id);

alter table public.lead_state
add column if not exists organization_id uuid null references public.organizations(id),
add column if not exists agent_id uuid null references public.agents(id);

create index if not exists idx_leads_organization_agent
on public.leads (organization_id, agent_id);

create index if not exists idx_lead_state_organization_agent
on public.lead_state (organization_id, agent_id);
