-- === ARCHIVO GENERADO -- NO EDITAR ===
-- Extraido de: 2 lead_loader  (workflow id f5383ae7-dd2e-4177-9875-c6dcff27e3d5)
-- Nodo:        db_upsert_lead
--
-- La fuente de verdad es el JSON del workflow en workflows/exports/.
-- Regenerar con: node scripts/extract_workflow_code.js
-- =====================================

insert into leads (
  channel,
  external_id,
  phone,
  name,
  organization_id,
  agent_id,
  created_at,
  updated_at
)
values (
  '{{ String($json.lookup.channel || "").replace(/'/g, "''") }}',
  '{{ String($json.lookup.external_id || "").replace(/'/g, "''") }}',
  nullif('{{ String($json.lookup.phone || "").replace(/'/g, "''") }}', ''),
  nullif('{{ String($json.lookup.name || "").replace(/'/g, "''") }}', ''),
  nullif('{{ String($json.lookup.organization_id || "").replace(/'/g, "''") }}', '')::uuid,
  nullif('{{ String($json.lookup.agent_id || "").replace(/'/g, "''") }}', '')::uuid,
  now(),
  now()
)
on conflict (channel, external_id)
do update set
  phone = coalesce(excluded.phone, leads.phone),
  name = coalesce(excluded.name, leads.name),
  organization_id = coalesce(excluded.organization_id, leads.organization_id),
  agent_id = coalesce(excluded.agent_id, leads.agent_id),
  updated_at = now()
returning
  id,
  channel,
  external_id,
  phone,
  name,
  organization_id,
  agent_id,
  created_at,
  updated_at;
