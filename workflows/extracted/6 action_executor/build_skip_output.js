// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6 action_executor  (workflow id 80e7685e-2690-4d1e-a5e7-5ccb7d0e8a13)
// Nodo:        build_skip_output
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const action =
  $json.execution_context?.action ||
  $json.decision?.action ||
  $json.action ||
  null;

// When idempotency hits, we still return a complete audit snapshot
// so QA/integrity checks never see an empty audit.
const auditMeta = $json.meta || $json.audit_meta || {};

return [
  {
    json: {
      ...$json,

      // Make sure these fields exist for build_output()
      message_sent: true,
      outbound_message_saved: true,

      flow_name: $json.flow_name || "action_executor",
      audit_id: $json.id || $json.audit_id || null,
      audit_decision: $json.decision || $json.audit_decision || null,
      idempotency_key:
        $json.idempotency_key ||
        $json.execution_context?.idempotency_key ||
        null,
      inbound_message_id:
        $json.inbound_message_id ||
        $json.execution_context?.inbound_message_id ||
        null,
      outbound_message_id:
        $json.outbound_message_id ||
        $json.audit_outbound_message_id ||
        auditMeta.outbound_message_id ||
        null,

      // Ensure bot text exists
      meta: {
        ...auditMeta,
        bot:
          auditMeta.bot ||
          $json.message ||
          $json.message_to_send ||
          null,
        notes: Array.isArray(auditMeta.notes)
          ? Array.from(new Set([...auditMeta.notes, "idempotency_hit"]))
          : ["idempotency_hit"],
      },

      notes: Array.isArray($json.notes)
        ? Array.from(new Set([...$json.notes, "skipped_due_to_idempotency"]))
        : ["skipped_due_to_idempotency"],

      // Preserve action for reporting
      action,
    },
  },
];
