// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6 action_executor  (workflow id 80e7685e-2690-4d1e-a5e7-5ccb7d0e8a13)
// Nodo:        validate_action_requirements
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const execution_context = $json.execution_context || {};
const validation = $json.validation || {};
const required_fields = validation.required_fields || [];

function getValue(path, obj) {
  return path.split('.').reduce((acc, key) => {
    if (acc === undefined || acc === null) return undefined;
    return acc[key];
  }, obj);
}

const missing_fields = required_fields.filter((field) => {
  const value = getValue(field, execution_context);

  if (value === undefined || value === null) return true;
  if (typeof value === "string" && value.trim() === "") return true;
  if (Array.isArray(value) && value.length === 0) return true;

  if (field === "availability_confirmed") {
  return execution_context.availability_confirmed !== true;
}
  return false;
});

return [
  {
    json: {
      ...$json,
      validation: {
        ...validation,
        missing_fields,
        requirements_ok: missing_fields.length === 0
      }
    }
  }
];
