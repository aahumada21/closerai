#!/usr/bin/env node
// Regression harness for the "3 rules_engine" workflow's rules_evaluation
// Code node. Runs the actual jsCode straight out of the workflow JSON
// against a set of scenarios and asserts the deterministic outcome.
//
// Why this exists: two real production bugs (2026-07-17) reached
// customers because a rule silently fell through to the LLM instead of
// resolving deterministically. Both were only found by manually replaying
// the WhatsApp transcript. This harness pins those two cases (and a few
// adjacent non-regression checks) so a future edit to rules_evaluation.js
// can't reintroduce them unnoticed.
//
// Usage: node scripts/rules_engine_regression_harness.js
// Exit code 0 = all scenarios passed, 1 = at least one failed.

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.join(__dirname, '..');
const RULES_ENGINE_WORKFLOW_ID = 'e88adaaf-dfed-46af-8f5f-4dd73f2cb5c5';
const SEARCH_DIRS = [
  path.join(REPO_ROOT, 'workflows', 'exports', 'manual'),
  path.join(REPO_ROOT, 'workflows', 'exports', 'uncategorized'),
];

function findRulesEngineWorkflowFile() {
  const candidates = [];

  for (const dir of SEARCH_DIRS) {
    if (!fs.existsSync(dir)) continue;

    for (const fileName of fs.readdirSync(dir)) {
      if (!fileName.endsWith('.json')) continue;

      const fullPath = path.join(dir, fileName);
      let parsed;
      try {
        parsed = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
      } catch {
        continue;
      }

      if (parsed && parsed.id === RULES_ENGINE_WORKFLOW_ID) {
        candidates.push({ path: fullPath, updatedAt: parsed.updatedAt || '', dir });
      }
    }
  }

  if (candidates.length === 0) {
    throw new Error(
      `No workflow file found with id ${RULES_ENGINE_WORKFLOW_ID} under workflows/exports/{manual,uncategorized}.`
    );
  }

  if (candidates.length > 1) {
    console.warn(
      `WARN: found ${candidates.length} files for rules_engine (id ${RULES_ENGINE_WORKFLOW_ID}) ` +
        `-- picking the most recently updated one. Consider deduplicating (see scripts/rules_engine_regression_harness.js).`
    );
    for (const c of candidates) console.warn(`  - ${path.relative(REPO_ROOT, c.path)} (updatedAt=${c.updatedAt})`);
  }

  // `manual/` is the hand-curated working copy that local fixes land in;
  // `uncategorized/` is just the raw mirror written by n8n_sync_workflows.ps1
  // and can legitimately lag behind until the next sync+deploy. Prefer
  // manual/, and only fall back to updatedAt as a tiebreaker within the
  // same directory.
  candidates.sort((a, b) => {
    const aIsManual = a.dir.endsWith(path.join('exports', 'manual'));
    const bIsManual = b.dir.endsWith(path.join('exports', 'manual'));
    if (aIsManual !== bIsManual) return aIsManual ? -1 : 1;
    return a.updatedAt < b.updatedAt ? 1 : -1;
  });
  return candidates[0].path;
}

function loadRulesEvaluationFn() {
  const workflowPath = findRulesEngineWorkflowFile();
  const workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));
  const node = workflow.nodes.find((n) => n.name === 'rules_evaluation');

  if (!node) {
    throw new Error(`rules_evaluation node not found in ${workflowPath}`);
  }

  const fn = new Function('$json', node.parameters.jsCode + '\n//# end');
  return { fn, workflowPath };
}

function evaluate(fn, { text, lead_state = {}, memory = {}, lead = {}, agent_business_config = {}, agent_staff = [] }) {
  const result = fn({
    event: { text, channel: 'whatsapp' },
    lead,
    lead_state,
    memory,
    agent_business_config,
    agent_staff,
  });
  return result[0].json.rule_result;
}

// ---- scenarios ----
// Each `check` receives the rule_result (snake_case fields, as produced by
// build_output further down the same Code node) and returns a string
// describing the failure, or null if it passed.

const scenarios = [
  {
    name: 'BUG1 (horarios) — "Hola quiero agendar" with full context, no payment_preference set',
    input: {
      text: 'Hola quiero agendar',
      lead_state: { service_interest: 'lavado_premium', vehicle_type: 'suv', district: 'Huechuraba' },
    },
    check(r) {
      if (r.should_call_llm !== false) return `expected should_call_llm=false, got ${r.should_call_llm} (fell through to the LLM again)`;
      if (r.action !== 'ask_payment_preference') return `expected action=ask_payment_preference, got ${r.action}`;
      return null;
    },
  },
  {
    name: 'BUG1 follow-up — customer answers "efectivo" after being asked payment preference',
    input: {
      text: 'efectivo',
      lead_state: {
        service_interest: 'lavado_premium',
        vehicle_type: 'suv',
        district: 'Huechuraba',
        last_bot_action: 'ask_payment_preference',
        next_goal: 'collect_payment_preference',
      },
    },
    check(r) {
      if (r.action !== 'offer_available_slots') return `expected action=offer_available_slots, got ${r.action}`;
      if (r.state_update.payment_preference !== 'postpago') return `expected payment_preference=postpago, got ${r.state_update.payment_preference}`;
      return null;
    },
  },
  {
    name: 'BUG1 non-regression — payment_preference already set: should go straight to slots',
    input: {
      text: 'Hola quiero agendar',
      lead_state: {
        service_interest: 'lavado_premium',
        vehicle_type: 'suv',
        district: 'Huechuraba',
        payment_preference: 'postpago',
      },
    },
    check(r) {
      if (r.should_call_llm !== false) return `expected should_call_llm=false, got ${r.should_call_llm}`;
      if (r.action !== 'offer_available_slots') return `expected action=offer_available_slots, got ${r.action}`;
      if (r.rule_name !== 'rule_availability_request') return `expected rule_name=rule_availability_request, got ${r.rule_name}`;
      return null;
    },
  },
  {
    name: 'BUG1 non-regression — missing commercial context still asks for the missing field',
    input: { text: 'Hola quiero agendar', lead_state: {} },
    check(r) {
      if (r.action !== 'ask_missing_data') return `expected action=ask_missing_data, got ${r.action}`;
      return null;
    },
  },
  {
    name: 'BUG2 (informacion adicional) — special access note after pre-service instructions sent',
    input: {
      text: 'Tengo indicacion especial, el conserje digale que viene de parte de daniel',
      lead_state: {
        service_interest: 'lavado_premium',
        vehicle_type: 'suv',
        district: 'Huechuraba',
        stage: 'booked',
        last_bot_action: 'send_pre_service_instructions',
        next_goal: 'service_prepared',
      },
      memory: { last_appointment: { id: 'abc', status: 'confirmed' } },
    },
    check(r) {
      if (r.should_call_llm !== false) return `expected should_call_llm=false, got ${r.should_call_llm} (fell through to the LLM, which resends the full instructions template)`;
      if (r.action !== 'answer_question') return `expected action=answer_question, got ${r.action}`;
      if (!r.message || r.message.includes('Antes del servicio')) {
        return `expected a short acknowledgment, got the full pre-service instructions template repeated: "${r.message}"`;
      }
      return null;
    },
  },
  {
    name: 'BUG2 non-regression — pure acknowledgment ("ok gracias") after instructions still deterministic',
    input: {
      text: 'ok gracias',
      lead_state: { stage: 'booked', last_bot_action: 'send_pre_service_instructions', next_goal: 'service_prepared' },
    },
    check(r) {
      if (r.should_call_llm !== false) return `expected should_call_llm=false, got ${r.should_call_llm}`;
      if (r.message && r.message.includes('Antes del servicio')) {
        return `pure acknowledgment should not repeat the full instructions template, got: "${r.message}"`;
      }
      return null;
    },
  },
  {
    name: 'BUG2 non-regression — a genuine question after instructions is NOT swallowed by the new note-acknowledgment rule',
    input: {
      text: 'a que hora llegan mas o menos',
      lead_state: { stage: 'booked', last_bot_action: 'send_pre_service_instructions', next_goal: 'service_prepared' },
    },
    check(r) {
      if (r.rule_name === 'rule_acknowledge_additional_note_after_pre_service_instructions') {
        return `a real question should not match the access-note rule (too broad a trigger)`;
      }
      return null;
    },
  },
  // ---- Fase A: consolidacion multi-vertical (classification_dimension + catalogo de servicios) ----
  // Estos 4 escenarios prueban dos cosas a la vez: (1) sin config nuevo, detailing
  // se comporta exactamente igual que antes (camino LEGACY_*), y (2) cuando SI hay
  // config, el camino nuevo realmente se toma (no solo "el fallback tapa todo").
  {
    name: 'Fase A non-regression — vehicle vocabulary with NO classification_dimension config (LEGACY path)',
    input: { text: 'hola quiero lavado premium, tengo una camioneta', lead_state: {} },
    check(r) {
      if (r.state_update?.vehicle_type !== 'Camioneta') {
        return `expected vehicle_type=Camioneta via legacy vocabulary, got ${r.state_update?.vehicle_type}`;
      }
      return null;
    },
  },
  {
    name: 'Fase A non-regression — service vocabulary with NO services[] config (LEGACY_SERVICE_CATALOG path)',
    input: { text: 'hola quiero algo de brillo y proteccion pintura', lead_state: {} },
    check(r) {
      if (r.state_update?.service_interest !== 'encerado_full') {
        return `expected service_interest=encerado_full via legacy "brillo"/"proteccion pintura" keywords, got ${r.state_update?.service_interest}`;
      }
      return null;
    },
  },
  {
    name: 'Fase A — classification_dimension config path is actually taken (synthetic salon-like override)',
    input: {
      text: 'hola quiero agendar con la senior',
      lead_state: {},
      agent_business_config: {
        config: {
          classification_dimension: {
            field: 'vehicle_type',
            label: 'categoria de estilista',
            generic_labels: ['estilista', 'cualquiera'],
            values: [
              { key: 'Junior', keywords: ['junior'] },
              { key: 'Senior', keywords: ['senior'] },
            ],
          },
        },
      },
    },
    check(r) {
      if (r.state_update?.vehicle_type !== 'Senior') {
        return `expected vehicle_type=Senior via classification_dimension config override, got ${r.state_update?.vehicle_type} (config path not being used?)`;
      }
      return null;
    },
  },
  {
    name: 'Fase A — services[] config path is actually taken (synthetic salon-like override, no legacy overlap)',
    input: {
      text: 'hola quiero un corte de pelo',
      lead_state: {},
      agent_business_config: {
        config: {
          services: [{ key: 'corte', name: 'Corte', aliases: ['corte', 'corte de pelo'] }],
        },
      },
    },
    check(r) {
      if (r.state_update?.service_interest !== 'corte') {
        return `expected service_interest=corte via services[] config override, got ${r.state_update?.service_interest} (config path not being used?)`;
      }
      return null;
    },
  },
  // ---- Fase B: vocabulario de mensajes (ruleIsBot + enumeraciones dinamicas) ----
  {
    name: 'Fase B — ruleIsBot uses organization.name when business_name is absent',
    input: {
      text: 'eres un bot?',
      lead_state: {},
      lead: {},
    },
    check(r) {
      // El harness no manda organization/agent hoy (evaluate() no los pasa) -- sin
      // ninguno de los 3, debe caer al generico "nuestro negocio", nunca al literal
      // "Ahumada Detailing" hardcodeado de antes (eso probaria que el fallback viejo
      // sigue vivo en vez del nuevo).
      if (!r.message || !r.message.includes('nuestro negocio')) {
        return `expected the generic "nuestro negocio" fallback when no business_name/organization/agent is present, got: "${r.message}"`;
      }
      if (r.message.includes('Ahumada Detailing')) {
        return `ruleIsBot should not hardcode "Ahumada Detailing" anymore, got: "${r.message}"`;
      }
      return null;
    },
  },
  {
    name: 'Fase B — ruleIsBot uses agent_business_config.config.business_name when present',
    input: {
      text: 'hablo con un bot?',
      lead_state: {},
      agent_business_config: { config: { business_name: 'Salon Bella (Test)' } },
    },
    check(r) {
      if (!r.message || !r.message.includes('Salon Bella (Test)')) {
        return `expected the configured business_name in the message, got: "${r.message}"`;
      }
      return null;
    },
  },
  {
    name: 'Fase B non-regression — service enumeration message with NO services[] config keeps the legacy 3-service text',
    input: { text: 'hola quiero cotizar', lead_state: {} },
    check(r) {
      if (!r.message || !r.message.includes('lavado basico, lavado premium y encerado full')) {
        return `expected the legacy 3-service enumeration text unchanged, got: "${r.message}"`;
      }
      return null;
    },
  },
  {
    name: 'Fase B — service enumeration message uses services[] config when present (synthetic salon-like override)',
    input: {
      text: 'hola quiero cotizar',
      lead_state: {},
      agent_business_config: {
        config: {
          services: [
            { key: 'corte', name: 'Corte' },
            { key: 'manicure', name: 'Manicure' },
          ],
        },
      },
    },
    check(r) {
      if (!r.message || !r.message.includes('corte o manicure')) {
        return `expected the dynamic 2-service enumeration ("corte o manicure"), got: "${r.message}"`;
      }
      if (r.message.includes('lavado basico')) {
        return `should not fall back to the legacy detailing text when services[] is configured, got: "${r.message}"`;
      }
      return null;
    },
  },
  // ---- Fase C: FAQ de negocio (payment_methods/home_service derivados de config, temas extra) ----
  {
    name: 'Fase C — payment_methods FAQ derives from payment_mode=prepago_required (no longer says "no aceptamos tarjeta")',
    input: {
      text: 'aceptan tarjeta?',
      lead_state: {},
      agent_business_config: { config: { payment_mode: 'prepago_required' } },
    },
    check(r) {
      if (!r.message || !r.message.toLowerCase().includes('flow')) {
        return `expected the prepago_required payment_methods answer to mention Flow, got: "${r.message}"`;
      }
      if (r.message.includes('No aceptamos tarjeta')) {
        return `stale "no aceptamos tarjeta" text should be gone for prepago_required, got: "${r.message}"`;
      }
      return null;
    },
  },
  {
    name: 'Fase C non-regression — payment_methods FAQ with NO payment_mode config falls back to "both" wording',
    input: { text: 'como puedo pagar?', lead_state: {} },
    check(r) {
      if (!r.message || !r.message.toLowerCase().includes('efectivo')) {
        return `expected the default "both" payment_methods answer to mention efectivo, got: "${r.message}"`;
      }
      return null;
    },
  },
  {
    name: 'Fase C — home_service FAQ says "atendemos en nuestro local" when service_location.mode=at_business_location',
    input: {
      text: 'atienden a domicilio?',
      lead_state: {},
      agent_business_config: { config: { service_location: { mode: 'at_business_location' } } },
    },
    check(r) {
      if (!r.message || !r.message.includes('atendemos en nuestro local')) {
        return `expected the at_business_location home_service answer, got: "${r.message}"`;
      }
      return null;
    },
  },
  {
    name: 'Fase C non-regression — home_service FAQ with NO service_location config keeps the legacy "a domicilio" answer',
    input: { text: 'atienden a domicilio?', lead_state: {} },
    check(r) {
      if (!r.message || !r.message.includes('el servicio es a domicilio')) {
        return `expected the legacy "a domicilio" answer unchanged, got: "${r.message}"`;
      }
      return null;
    },
  },
  {
    name: 'Fase C non-regression — motorcycle_service extra topic (LEGACY_FAQ_EXTRA_TOPICS) still answers exactly as before',
    input: { text: 'lavan motos?', lead_state: {} },
    check(r) {
      if (!r.message || !r.message.includes('Por ahora el foco principal esta en autos')) {
        return `expected the legacy motorcycle_service answer unchanged, got: "${r.message}"`;
      }
      return null;
    },
  },
  {
    name: 'Fase C — faq_extra_topics config path is actually taken (synthetic salon-like override)',
    input: {
      text: 'hacen depilacion?',
      lead_state: {},
      agent_business_config: {
        config: {
          faq_extra_topics: [
            { topic: 'waxing_service', keywords: ['depilacion', 'cejas', 'pestanas'], answer: 'Si, hacemos depilacion. {{closing_question}}' },
          ],
        },
      },
    },
    check(r) {
      if (!r.message || !r.message.startsWith('Si, hacemos depilacion.')) {
        return `expected the configured faq_extra_topics answer to be used, got: "${r.message}"`;
      }
      if (r.message.includes('{{closing_question}}')) {
        return `the {{closing_question}} placeholder should have been substituted, got: "${r.message}"`;
      }
      return null;
    },
  },
  // ---- Fase D+E: ruleAdditionalServiceRequestWhileBooked promovida de salon a compartida ----
  {
    name: 'Fase D — ruleAdditionalServiceRequestWhileBooked (promoted from salon) fires for detailing with generic vehicle wording',
    input: {
      text: 'quiero agendar tambien un encerado full aparte',
      lead_state: { stage: 'booked', service_interest: 'lavado_premium' },
      memory: { last_appointment: { id: 'abc', status: 'confirmed' } },
    },
    check(r) {
      if (r.rule_name !== 'rule_additional_service_request_while_booked') {
        return `expected rule_additional_service_request_while_booked to fire, got rule=${r.rule_name} action=${r.action}`;
      }
      if (!r.message || !r.message.includes('sedan, SUV o camioneta')) {
        return `expected the generic vehicle-category wording (no config), got: "${r.message}"`;
      }
      if (r.message.includes('Junior') || r.message.includes('Senior')) {
        return `should not hardcode salon's Junior/Senior wording for detailing, got: "${r.message}"`;
      }
      return null;
    },
  },
  // ---- Fase D+E urgent fixes: found live when a brand-new "barberia" vertical was
  // onboarded onto the consolidated engine and got detailing's hardcoded messages ----
  {
    name: 'Fase D urgent fix — single-location auto-fill (district/service_address) only applies when requires_service_vehicle_district===false',
    input: {
      // service_interest+vehicle_type already known so district is the only thing
      // that could still be "missing" -- this isolates whether the auto-fill
      // satisfied ruleMissingRequiredFields's isMissingField("district", ...)
      // check during THIS turn's evaluation (what actually matters -- the
      // auto-fill mutates ctx.leadState in place, it doesn't necessarily echo
      // into this turn's state_update, same as salon's original, already-proven
      // snippet this was ported from).
      text: 'hola quiero un corte',
      lead_state: { service_interest: 'corte', vehicle_type: 'Clasico' },
      agent_business_config: { config: { pricing_policy: { requires_service_vehicle_district: false }, coverage: { districts: ['Local'] } } },
    },
    check(r) {
      if (Array.isArray(r.missing_fields) && r.missing_fields.includes('district')) {
        return `expected district to be auto-filled and NOT reported missing for a single-location vertical, got missing_fields=${JSON.stringify(r.missing_fields)}`;
      }
      return null;
    },
  },
  {
    name: 'Fase D urgent fix non-regression — single-location auto-fill does NOT apply to detailing (real coverage.districts must never leak in as a silent default)',
    input: {
      text: 'hola quiero lavado premium',
      lead_state: {},
      agent_business_config: { config: { coverage: { districts: ['Huechuraba', 'Vitacura'] } } },
    },
    check(r) {
      if (r.state_update?.district === 'Huechuraba') {
        return `district must NOT silently auto-fill from coverage.districts for detailing (requires_service_vehicle_district defaults true) — this would break the real "ask which comuna" flow, got: ${r.state_update?.district}`;
      }
      return null;
    },
  },
  {
    name: 'Fase D urgent fix — LEGACY_MISSING_FIELD_MESSAGES.vehicle_type uses classification_dimension when configured',
    input: {
      text: 'hola',
      lead_state: { service_interest: 'corte_caballero', district: 'Local' },
      agent_business_config: {
        config: {
          classification_dimension: { label: 'estilo de barbero', values: [{ key: 'Clasico' }, { key: 'Moderno' }] },
          services: [{ key: 'corte_caballero', name: 'Corte caballero' }],
        },
      },
    },
    check(r) {
      if (!r.message || !r.message.includes('estilo de barbero') || !r.message.includes('Clasico o Moderno')) {
        return `expected the dynamic vehicle_type missing-field message using classification_dimension, got: "${r.message}"`;
      }
      return null;
    },
  },
  {
    name: 'Fase D urgent fix non-regression — LEGACY_MISSING_FIELD_MESSAGES.vehicle_type keeps detailing exact wording with no config',
    input: { text: 'hola', lead_state: { service_interest: 'lavado_basico', district: 'Huechuraba' } },
    check(r) {
      if (!r.message || !r.message.includes('SUV, camioneta, hatchback, sedan, city car, moto o furgon')) {
        return `expected the exact legacy detailing vehicle_type message unchanged, got: "${r.message}"`;
      }
      return null;
    },
  },
  {
    name: 'Fase D urgent fix — LEGACY_MISSING_FIELD_MESSAGES.service_interest builds from services[] with descriptions when configured',
    input: {
      text: 'hola',
      lead_state: {},
      agent_business_config: {
        config: {
          services: [
            { key: 'corte_caballero', name: 'Corte caballero', description: 'Corte de cabello para hombre.' },
            { key: 'afeitado', name: 'Afeitado clasico', description: 'Afeitado a la antigua.' },
          ],
        },
      },
    },
    check(r) {
      if (!r.message || !r.message.includes('Corte caballero: Corte de cabello para hombre.') || !r.message.includes('Afeitado clasico: Afeitado a la antigua.')) {
        return `expected the dynamic service_interest message built from services[] with descriptions, got: "${r.message}"`;
      }
      return null;
    },
  },
  {
    name: 'Fase D urgent fix non-regression — LEGACY_MISSING_FIELD_MESSAGES.service_interest keeps detailing exact wording with no services[] config',
    input: { text: 'hola', lead_state: {} },
    check(r) {
      if (!r.message || !r.message.includes('Lavado basico: mantencion rapida')) {
        return `expected the exact legacy detailing service_interest message unchanged, got: "${r.message}"`;
      }
      return null;
    },
  },

  // ---- Seleccion de personal / multi-recurso (2026-07-31) ----
  // El mecanismo completo ya existia pero nunca se habia activado en ningun
  // agente, asi que estos caminos jamas se ejercitaron con trafico real. Al
  // probarlos aparecio un bug: el match exigia que el cliente escribiera el
  // nombre COMPLETO tal cual sale en el menu ("Camila (Junior)"), asi que la
  // respuesta natural ("Camila") no se reconocia y el bot volvia a preguntar
  // en loop. Estos escenarios fijan el comportamiento corregido.
  ...(() => {
    const STAFF = [
      { id: 'staff-camila', name: 'Camila (Junior)', calendar_id: 'camila@salon.cl', is_active: true, display_order: 1, services: [] },
      { id: 'staff-valentina', name: 'Valentina (Senior)', calendar_id: 'valentina@salon.cl', is_active: true, display_order: 2, services: [] },
    ];
    const salonConfig = (staff_selection_mode) => ({
      config: {
        staff_selection_mode,
        pricing_policy: { requires_service_vehicle_district: false },
        coverage: { districts: ['Local'] },
        service_location: { mode: 'at_business_location' },
        services: [{ key: 'corte', name: 'Corte', aliases: ['corte'] }],
      },
    });
    const READY = {
      service_interest: 'corte', vehicle_type: 'Junior', district: 'Local',
      payment_preference: 'efectivo', address_confirmed: true,
    };
    const PENDING = { ...READY, intent_last: 'staff_selection_pending' };

    const picks = (text, expectedName, staff = STAFF) => ({
      name: `Staff selection — "${text}" selecciona a ${expectedName}`,
      input: { text, lead_state: PENDING, agent_business_config: salonConfig('ask_customer'), agent_staff: staff },
      check(r) {
        if (r.action !== 'offer_available_slots') return `expected action=offer_available_slots, got ${r.action} (rule=${r.rule_name})`;
        const got = r.state_update?.staff_name;
        if (got !== expectedName) return `expected staff_name="${expectedName}", got "${got}"`;
        return null;
      },
    });
    const reasks = (text, why, staff = STAFF) => ({
      name: `Staff selection — ${why}`,
      input: { text, lead_state: PENDING, agent_business_config: salonConfig('ask_customer'), agent_staff: staff },
      check(r) {
        if (r.action !== 'answer_question') return `expected action=answer_question (volver a preguntar), got ${r.action}`;
        if (r.state_update?.intent_last !== 'staff_selection_pending') return `expected intent_last to stay staff_selection_pending, got ${r.state_update?.intent_last}`;
        return null;
      },
    });

    const DUP = [
      { id: 'a', name: 'Camila Rojas', calendar_id: 'a@x.cl', is_active: true, display_order: 1, services: [] },
      { id: 'b', name: 'Camila Soto', calendar_id: 'b@x.cl', is_active: true, display_order: 2, services: [] },
    ];

    return [
      // El bug principal: responder solo el nombre de pila.
      picks('Camila', 'Camila (Junior)'),
      picks('con Valentina porfa', 'Valentina (Senior)'),
      // Lo que ya funcionaba antes del fix, no debe romperse.
      picks('2', 'Valentina (Senior)'),
      picks('Camila (Junior)', 'Camila (Junior)'),
      // "cualquiera" delega la eleccion en vez de loopear preguntando.
      {
        name: 'Staff selection — "cualquiera" delega la eleccion en vez de volver a preguntar',
        input: { text: 'cualquiera', lead_state: PENDING, agent_business_config: salonConfig('ask_customer'), agent_staff: STAFF },
        check(r) {
          if (r.action !== 'offer_available_slots') return `expected action=offer_available_slots (auto-asignar), got ${r.action} (rule=${r.rule_name})`;
          if (!r.state_update?.staff_id) return 'expected a staff_id to be auto-assigned';
          return null;
        },
      },
      // Sigue rechazando lo genuinamente no reconocible.
      reasks('Rodrigo', 'un nombre que no esta en la lista vuelve a preguntar'),
      // Ambiguedad: no adivinar entre dos personas del mismo nombre.
      reasks('Camila', 'dos personas llamadas Camila -> no adivina, vuelve a preguntar', DUP),
      picks('Camila Soto', 'Camila Soto', DUP),
      // No regresion de los dos modos y del caso sin staff (detailing).
      {
        name: 'Staff selection — con >1 staff y mode=ask_customer se pregunta antes de ofrecer horarios',
        input: { text: 'que horarios tienen?', lead_state: READY, agent_business_config: salonConfig('ask_customer'), agent_staff: STAFF },
        check(r) {
          if (r.action !== 'answer_question') return `expected action=answer_question (preguntar por persona), got ${r.action}`;
          if (!r.message || !r.message.includes('Con quien prefieres agendar?')) return `expected the staff options message, got: "${r.message}"`;
          return null;
        },
      },
      {
        name: 'Staff selection non-regression — mode=auto asigna sin preguntar',
        input: { text: 'que horarios tienen?', lead_state: READY, agent_business_config: salonConfig('auto'), agent_staff: STAFF },
        check(r) {
          if (r.action !== 'offer_available_slots') return `expected action=offer_available_slots, got ${r.action}`;
          if (!r.state_update?.staff_id) return 'expected a staff_id to be auto-assigned in auto mode';
          return null;
        },
      },
      {
        name: 'Staff selection non-regression — sin filas de agent_staff (detailing) el flujo queda intacto',
        input: { text: 'que horarios tienen?', lead_state: READY, agent_business_config: salonConfig('auto'), agent_staff: [] },
        check(r) {
          if (r.action !== 'offer_available_slots') return `expected action=offer_available_slots, got ${r.action}`;
          if (r.state_update?.staff_id) return `expected NO staff_id when the business has no staff rows, got ${r.state_update.staff_id}`;
          return null;
        },
      },
    ];
  })(),
];

function main() {
  const { fn, workflowPath } = loadRulesEvaluationFn();
  console.log(`Using rules_evaluation from: ${path.relative(REPO_ROOT, workflowPath)}\n`);

  let failures = 0;

  for (const scenario of scenarios) {
    let failureReason = null;
    let ruleResult = null;

    try {
      ruleResult = evaluate(fn, scenario.input);
      failureReason = scenario.check(ruleResult);
    } catch (err) {
      failureReason = `threw an error: ${err.message}`;
    }

    if (failureReason) {
      failures += 1;
      console.log(`FAIL  ${scenario.name}`);
      console.log(`      ${failureReason}`);
      if (ruleResult) {
        console.log(`      actual: action=${ruleResult.action} rule=${ruleResult.rule_name} should_call_llm=${ruleResult.should_call_llm}`);
      }
    } else {
      console.log(`PASS  ${scenario.name}`);
    }
  }

  console.log(`\n${scenarios.length - failures}/${scenarios.length} passed`);
  process.exit(failures > 0 ? 1 : 0);
}

main();
