// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 2 lead_loader  (workflow id f5383ae7-dd2e-4177-9875-c6dcff27e3d5)
// Nodo:        code_build_output
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const prepared = $items("code_prepare_lookup", 0, 0)[0].json;
const lead = $items("db_upsert_lead", 0, 0)[0].json;
const leadState = $items("db_upsert_lead_state", 0, 0)[0].json;

let agentConfig = {};
try {
  agentConfig = $items("db_load_agent_config", 0, 0)[0].json || {};
} catch {
  agentConfig = {};
}

let activeAppointmentRow = {};
try {
  activeAppointmentRow = $items("db_load_active_appointment", 0, 0)[0].json || {};
} catch {
  activeAppointmentRow = {};
}

function buildLastAppointment(row) {
  if (!row || !row.id) return null;

  const serviceKey = String(row.summary || "").split(" - ")[0].trim() || null;

  return {
    id: row.id,
    status: row.status || null,
    start_at: row.start_at || null,
    service_key: serviceKey,
    cancelled_at: row.cancelled_at || null
  };
}

const lastAppointment = buildLastAppointment(activeAppointmentRow);

function parseJsonArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function parseJsonObject(value, fallback = null) {
  if (value && typeof value === "object" && !Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : fallback;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

function boolOrNull(value) {
  if (value === true) return true;
  if (value === false) return false;
  if (String(value).toLowerCase() === "true") return true;
  if (String(value).toLowerCase() === "false") return false;
  return null;
}

function boolOrFalse(value) {
  if (value === true) return true;
  if (value === false) return false;
  if (String(value).toLowerCase() === "true") return true;
  if (String(value).toLowerCase() === "false") return false;
  return false;
}

const organization = parseJsonObject(agentConfig.organization) || prepared.organization || null;
const agent = parseJsonObject(agentConfig.agent) || prepared.agent || null;
const agentBusinessConfig = parseJsonObject(agentConfig.agent_business_config);
const agentRules = parseJsonArray(agentConfig.agent_rules);
const agentTools = parseJsonArray(agentConfig.agent_tools);
const agentStaff = parseJsonArray(agentConfig.agent_staff);

return [{
  json: {
    event: prepared.event,
    lead: {
      id: lead.id,
      channel: lead.channel,
      external_id: lead.external_id,
      phone: lead.phone,
      name: lead.name,
      organization_id: lead.organization_id || prepared.lookup.organization_id || organization?.id || null,
      agent_id: lead.agent_id || prepared.lookup.agent_id || agent?.id || null,
      created_at: lead.created_at,
      updated_at: lead.updated_at
    },
    lead_state: {
      lead_id: leadState.lead_id,
      organization_id: leadState.organization_id || lead.organization_id || prepared.lookup.organization_id || organization?.id || null,
      agent_id: leadState.agent_id || lead.agent_id || prepared.lookup.agent_id || agent?.id || null,
      stage: leadState.stage,
      intent_last: leadState.intent_last,
      interest_score: leadState.interest_score,
      service_interest: leadState.service_interest,
      vehicle_type: leadState.vehicle_type,
      district: leadState.district,
      mentioned_vehicle_type: leadState.mentioned_vehicle_type || null,
      confirmed_vehicle_type: leadState.confirmed_vehicle_type || leadState.vehicle_type || null,
      mentioned_district: leadState.mentioned_district || null,
      confirmed_district: leadState.confirmed_district || leadState.district || null,
      missing_fields: parseJsonArray(leadState.missing_fields),
      last_bot_action: leadState.last_bot_action,
      next_goal: leadState.next_goal,
      human_handoff: boolOrFalse(leadState.human_handoff),
      booking_options: parseJsonArray(leadState.booking_options),
      booking_date: leadState.booking_date,
      booking_time: leadState.booking_time,
      slot_id: leadState.slot_id,
      availability_confirmed: boolOrNull(leadState.availability_confirmed),
      availability_window: leadState.availability_window,
      availability_label: leadState.availability_label,
      calendar_id: leadState.calendar_id,
      duration_minutes: leadState.duration_minutes ?? 120,
      days_ahead: leadState.days_ahead,
      start_offset_days: leadState.start_offset_days,
      max_slots: leadState.max_slots,
      service_address: leadState.service_address || null,
      address_reference: leadState.address_reference || null,
      address_confirmed: boolOrFalse(leadState.address_confirmed),
      address_confirmed_at: leadState.address_confirmed_at || null,
      cancellation_reason: leadState.cancellation_reason || null,
      reschedule_reason: leadState.reschedule_reason || null,
      last_appointment_event_id: leadState.last_appointment_event_id || null,
      staff_id: leadState.staff_id || null,
      staff_name: leadState.staff_name || null,
      address_collection_attempts: Number(leadState.address_collection_attempts) || 0,
      payment_preference: leadState.payment_preference || null,
      payment_status: leadState.payment_status || null,
      flow_order_id: leadState.flow_order_id || null,
      flow_payment_url: leadState.flow_payment_url || null,
      payment_mode: leadState.payment_mode || null,
      updated_at: leadState.updated_at
    },
    organization,
    agent,
    memory: {
      last_appointment: lastAppointment
    },
    agent_business_config: agentBusinessConfig,
    agent_rules: agentRules,
    agent_tools: agentTools,
    agent_staff: agentStaff,
    channel_config: prepared.channel_config || null,
    whatsapp_number: prepared.whatsapp_number || null,
    routing: {
      ...(prepared.routing || {}),
      organization_id: lead.organization_id || prepared.lookup.organization_id || organization?.id || null,
      agent_id: lead.agent_id || prepared.lookup.agent_id || agent?.id || null
    },
    meta: {
      ...prepared.meta,
      agent_context_loaded: agentConfig.agent_context_loaded === true || String(agentConfig.agent_context_loaded).toLowerCase() === "true",
      agent_rules_count: agentRules.length,
      agent_tools_count: agentTools.length,
      agent_staff_count: agentStaff.length
    }
  }
}];
