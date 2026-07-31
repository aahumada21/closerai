// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: google_calendar_oauth_callback  (workflow id ulUOTFazrMcE2BdJ)
// Nodo:        build_upsert_query
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const ctx = .first().json;
const tokens = .first().json;
const userInfo = .first().json;
const calendarId = .calendar_id;

function sqlText(value) {
  if (value === undefined || value === null || value === '') return 'NULL';
  return "'" + String(value).replace(/'/g, "''") + "'";
}
function sqlUuid(value) {
  const text = String(value || '').trim();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(text);
  if (!isUuid) throw new Error('Invalid uuid: ' + text);
  return "'" + text + "'::uuid";
}
if (!calendarId) throw new Error('Missing resolved calendar_id before upsert');
if (!tokens.refresh_token) throw new Error('Google no devolvio refresh_token. La URL de autorizacion debe incluir access_type=offline y prompt=consent.');

const expiresAt = new Date(Date.now() + (Number(tokens.expires_in || 3600) * 1000)).toISOString();

const query = ;
return [{ json: { ...ctx, upsert_query: query, google_email: userInfo.email } }];
