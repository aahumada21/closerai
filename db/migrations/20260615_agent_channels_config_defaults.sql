-- Omnichannel agent channel config defaults.
-- Normalizes public.agent_channels.config without changing the table shape.
-- Existing config keys win over defaults.

create index if not exists idx_agent_channels_provider_external_active
on public.agent_channels (provider, external_channel_id, is_active);

comment on table public.agent_channels is
  'Maps an external channel identifier (WhatsApp phone_number_id, Instagram business account id, webchat widget id) to an organization/agent.';

comment on column public.agent_channels.external_channel_id is
  'Provider-specific channel id: WhatsApp phone_number_id, Instagram business account id, webchat widget_id/site_id, etc.';

comment on column public.agent_channels.config is
  'JSON config for omnichannel runtime: environment, inbound/outbound flags, credentials reference, rate limits and fallback policy.';

update public.agent_channels ac
set
  config =
    jsonb_build_object(
      'environment', coalesce(ac.config->>'environment', 'production'),
      'inbound_enabled',
        case
          when ac.config ? 'inbound_enabled' then (ac.config->>'inbound_enabled')::boolean
          else true
        end,
      'outbound_enabled',
        case
          when ac.config ? 'outbound_enabled' then (ac.config->>'outbound_enabled')::boolean
          else true
        end,
      'display_name', coalesce(ac.config->>'display_name', ac.display_name, ''),
      'default_language', coalesce(ac.config->>'default_language', 'es-CL'),
      'provider_credentials_ref', coalesce(ac.config->>'provider_credentials_ref', ''),
      'rate_limit',
        jsonb_build_object(
          'messages_per_minute',
          coalesce(nullif(ac.config #>> '{rate_limit,messages_per_minute}', '')::integer, 60)
        ) || coalesce(ac.config->'rate_limit', '{}'::jsonb),
      'fallback_policy',
        jsonb_build_object(
          'on_error',
          coalesce(ac.config #>> '{fallback_policy,on_error}', 'handoff_or_retry')
        ) || coalesce(ac.config->'fallback_policy', '{}'::jsonb)
    )
    || ac.config
where ac.config is not null;

-- Ensure future inserts that still pass NULL do not break downstream JSON access.
alter table public.agent_channels
alter column config set default '{}'::jsonb;
