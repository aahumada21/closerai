// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: health_check_agents  (workflow id ZgKBBYK2ZUyNIM7r)
// Nodo:        build_notifications
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const rows = $input.all().map((item) => item.json);

const needsNotification = rows.filter((r) => r.prior_status && r.prior_status !== "open" && r.id);

const byOrg = {};
for (const r of needsNotification) {
  const key = r.organization_id;
  if (!byOrg[key]) {
    byOrg[key] = {
      organization_id: r.organization_id,
      organization_name: r.organization_name || "",
      whatsapp_to: r.alert_whatsapp_number || null,
      email_to: r.alert_email || null,
      alert_ids: [],
      lines: []
    };
  }
  byOrg[key].alert_ids.push(r.id);
  byOrg[key].lines.push("- " + r.message);
}

const results = Object.values(byOrg).map((org) => {
  const header = "Alerta AI Closer (" + org.organization_name + "):";
  const body = header + "\n" + org.lines.join("\n");
  return {
    organization_id: org.organization_id,
    organization_name: org.organization_name,
    whatsapp_to: org.whatsapp_to,
    email_to: org.email_to,
    alert_ids: org.alert_ids,
    message_text: body,
    alert_count: org.alert_ids.length
  };
});

return results.map((r) => ({ json: r }));
