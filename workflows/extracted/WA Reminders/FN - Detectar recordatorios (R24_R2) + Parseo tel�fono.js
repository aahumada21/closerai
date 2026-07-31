// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: WA Reminders  (workflow id 9c27f106-a2bc-455b-99cd-584486d0b735)
// Nodo:        FN - Detectar recordatorios (R24/R2) + Parseo tel�fono
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

// Function Node: Detectar recordatorios (R24 / R2) + Parseo tel�fono
// Output: solo los eventos que est�n dentro de la ventana de env�o.

const DEFAULTS = {
  lookaheadDays: 14,
  windowMinutes: 6,     // Cron cada 5 min -> 6 min de tolerancia
  r24HoursBefore: 24,
  r2HoursBefore: 2,
  debug: false,         // pon true para ver por qu� no sale nada
};

// Si este Function recibe tambi�n el Set Config en el mismo item,
// puedes leerlo desde $json. Si no, se usan defaults.
const cfg = {
  lookaheadDays: Number($json.lookaheadDays ?? DEFAULTS.lookaheadDays),
  windowMinutes: Number($json.windowMinutes ?? DEFAULTS.windowMinutes),
  r24HoursBefore: Number($json.r24HoursBefore ?? DEFAULTS.r24HoursBefore),
  r2HoursBefore: Number($json.r2HoursBefore ?? DEFAULTS.r2HoursBefore),
  debug: Boolean($json.debug ?? DEFAULTS.debug),
};

const now = new Date();
const maxDate = new Date(now.getTime() + cfg.lookaheadDays * 24 * 60 * 60 * 1000);

function parsePhoneFromDescription(desc) {
  if (!desc) return null;

  const m = desc.match(/Tel[e�]fono\s*:\s*([+0-9\s()-]+)/i);
  if (!m) return null;

  let raw = m[1].trim();
  raw = raw.replace(/[^\d+]/g, ''); // deja solo d�gitos y +

  if (raw.startsWith('+')) return raw;
  if (raw.startsWith('56')) return '+' + raw;
  if (/^9\d{8}$/.test(raw)) return '+56' + raw;  // 9XXXXXXXX -> +569XXXXXXXX
  if (/^\d{8}$/.test(raw)) return '+56' + raw;   // no inventa el 9

  return raw;
}

function withinWindow(targetDate, nowDate, windowMinutes) {
  const diffMs = Math.abs(targetDate.getTime() - nowDate.getTime());
  return diffMs <= windowMinutes * 60 * 1000;
}

const out = [];
const debugRows = [];

for (const item of items) {
  const ev = item.json;

  const startStr = ev?.start?.dateTime;
  if (!startStr) {
    if (cfg.debug) debugRows.push({ reason: 'no_start_datetime', id: ev?.id, summary: ev?.summary });
    continue;
  }

  const start = new Date(startStr);
  if (Number.isNaN(start.getTime())) {
    if (cfg.debug) debugRows.push({ reason: 'invalid_start_datetime', id: ev?.id, startStr });
    continue;
  }

  if (start < now) {
    if (cfg.debug) debugRows.push({ reason: 'start_in_past', id: ev?.id, startStr });
    continue;
  }

  if (start > maxDate) {
    if (cfg.debug) debugRows.push({ reason: 'beyond_lookahead', id: ev?.id, startStr });
    continue;
  }

  const description = ev.description ?? '';
  const phone = parsePhoneFromDescription(description);
  if (!phone) {
    if (cfg.debug) debugRows.push({ reason: 'no_phone', id: ev?.id, summary: ev?.summary });
    continue;
  }

  const triggerR24 = new Date(start.getTime() - cfg.r24HoursBefore * 60 * 60 * 1000);
  const triggerR2  = new Date(start.getTime() - cfg.r2HoursBefore  * 60 * 60 * 1000);

  let reminderType = null;
  if (withinWindow(triggerR24, now, cfg.windowMinutes)) reminderType = 'R24';
  else if (withinWindow(triggerR2, now, cfg.windowMinutes)) reminderType = 'R2';
  else {
    if (cfg.debug) debugRows.push({
      reason: 'not_in_window',
      id: ev?.id,
      startStr,
      triggerR24: triggerR24.toISOString(),
      triggerR2: triggerR2.toISOString(),
      now: now.toISOString(),
    });
    continue;
  }

  const eventId = ev.id;
  if (!eventId) {
    if (cfg.debug) debugRows.push({ reason: 'no_event_id', summary: ev?.summary });
    continue;
  }

  out.push({
    json: {
      eventId,
      reminderType,
      dedupeKey: `${eventId}_${reminderType}`,
      startDateTime: startStr,
      phone,
      summary: ev.summary ?? '',
      description,
    }
  });
}

// Si debug est� activo y no hubo salidas, devolvemos un item con diagn�stico
if (cfg.debug && out.length === 0) {
  return [{
    json: {
      debug: true,
      now: now.toISOString(),
      lookaheadMax: maxDate.toISOString(),
      eventsIn: items.length,
      reasonsSample: debugRows.slice(0, 20),
    }
  }];
}

return out;
