// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6 action_executor  (workflow id 80e7685e-2690-4d1e-a5e7-5ccb7d0e8a13)
// Nodo:        build_action_requirements
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const decision = $json.decision || {};
const ctx = $json.execution_context || {};
const toolRegistry = $json.tool_registry || {};
const action = decision.action || ctx.action || null;

const priceListMode =
  action === "send_quote" &&
  (
    decision?.state_update?.intent_last === "price_list_ready" ||
    ctx?.intent_last === "price_list_ready" ||
    ctx?.next_goal === "send_price_list"
  );

const requiredByAction = {
  ask_missing_data: ["lead_id", "channel", "message"],
  send_quote: priceListMode
    ? ["lead_id", "channel", "vehicle_type", "district"]
    : ["lead_id", "channel", "service_interest", "vehicle_type", "district"],
  answer_question: ["lead_id", "channel", "message"],
  send_service_menu: ["lead_id", "channel"],
  recommend_service: ["lead_id", "channel"],
  ask_payment_preference: ["lead_id", "channel"],
  answer_objection: ["lead_id", "channel", "message"],
  offer_booking: ["lead_id", "channel", "message", "service_interest"],cancel_booking: ["lead_id", "channel"],

reschedule_booking: ["lead_id", "channel"],

collect_address: ["lead_id", "channel"],

confirm_address: ["lead_id", "channel", "address"],

send_pre_service_instructions: ["lead_id", "channel"],

notify_on_the_way: ["lead_id", "channel"],

request_review: ["lead_id", "channel"],

request_referral: ["lead_id", "channel"],
  

  offer_available_slots: [
    "lead_id",
    "channel",
    "service_interest",
    "vehicle_type",
    "district"
  ],

 confirm_booking: [
  "lead_id",
  "channel",
  "service_interest",
  "vehicle_type",
  "district",
  "booking_date",
  "booking_time",
  "availability_confirmed"
],

  schedule_followup: ["lead_id", "followup_type", "scheduled_for"],
  handoff_human: ["lead_id", "handoff_reason"]
};

const toolRequiredFields = Array.isArray(toolRegistry.required_fields)
  ? toolRegistry.required_fields.filter((field) => typeof field === "string" && field.trim())
  : [];

const required_fields = toolRequiredFields.length > 0
  ? toolRequiredFields
  : (requiredByAction[action] || []);

return [
  {
    json: {
      ...$json,
      validation: {
        ...($json.validation || {}),
        action,
        required_fields,
        tool_name: ctx.tool_name || toolRegistry.tool_name || (Array.isArray(toolRegistry.mapped_tool_names) ? toolRegistry.mapped_tool_names[0] : null) || null,
        executor_ref: ctx.executor_ref || toolRegistry.executor_ref || null,
        agent_id: ctx.agent_id || toolRegistry.agent_id || null,
        tool_resolution_mode: ctx.tool_resolution_mode || toolRegistry.mode || "legacy"
      }
    }
  }
];
