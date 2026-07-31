# Ejemplo: cómo formar un `qa_test_scenarios_temp`

Este repo usa `public.qa_test_scenarios_temp` para scenarios **TEMP** (iteración rápida de fixes). El runner evalúa los `steps` (jsonb) como una secuencia de mensajes; típicamente se usan **solo pasos `role: "user"`** y la validación va en `expect`.

## Actualizacion 2026-06-26: evaluacion por OpenAI (`expected_outcome`)

Ya no es obligatorio escribir `expect` por cada paso. Ahora cada escenario puede
tener una columna `expected_outcome` (texto libre) describiendo el objetivo de
la conversacion completa, y al terminar todos los pasos, el runner manda la
transcripcion completa (lo que escribio el usuario + lo que respondio el bot en
cada paso) a OpenAI, que decide si la conversacion cumplio el objetivo o no.

```sql
INSERT INTO public.qa_test_scenarios_temp (scenario_key, name, suite, priority, steps, expected_outcome)
VALUES (
  '569900099',
  'TEMP QA099: cotizar lavado premium para SUV en Huechuraba',
  'temp',
  10,
  '[
    {"text": "hola cuanto sale lavar un auto"},
    {"text": "estoy en huechuraba, tengo un suv"}
  ]'::jsonb,
  'El bot debe pedir vehiculo y comuna si faltan, y despues entregar los 3 precios (lavado basico, lavado premium, encerado full) para SUV en Huechuraba, sin inventar valores ni perder el contexto entre turnos.'
)
ON CONFLICT (scenario_key) DO UPDATE SET steps = EXCLUDED.steps, expected_outcome = EXCLUDED.expected_outcome;
```

Que pasa con el resultado:
- Si `expected_outcome` esta vacio/NULL, el escenario funciona exactamente como
  antes (rule-based, columna `passed` decidida por los `expect` de cada paso).
- Si `expected_outcome` tiene texto, al terminar el escenario el sistema:
  1. Junta la transcripcion completa desde `qa_test_results` (todos los pasos
     de ese `run_id`+`scenario_id`).
  2. Le pide a OpenAI (mismo modelo/credencial que usa el bot en produccion)
     que evalue si se cumplio el objetivo, citando pasos especificos.
  3. **Sobrescribe** la columna `passed` de todas las filas de ese run con el
     veredicto de OpenAI, y llena las columnas nuevas:
     - `llm_passed` (boolean, igual a `passed` en este caso)
     - `llm_inconsistencies` (jsonb, array de contradicciones/perdidas de contexto)
     - `llm_problems` (jsonb, array de fallas tecnicas evidentes)
     - `llm_notes` (texto, resumen de 2-3 frases)
     - `llm_raw_response` (jsonb, la respuesta cruda de OpenAI, para debug)

Workflows tocados: `9.1 qa_conversation_test_runner` y
`9.1.1 qa_run_single_conversation` (ambos en n8n). Si vas a escribir un
escenario nuevo y NO te importa la semantica fina paso por paso, usa
`expected_outcome` y omite los `expect` — es mas rapido de escribir y mas
robusto a cambios de redaccion del bot que no afectan el resultado real.

---

## Plantilla SQL (recomendado)

```sql
INSERT INTO "public"."qa_test_scenarios_temp"
("id","scenario_key","name","suite","enabled","priority","tags","steps","created_at","updated_at")
VALUES
(
  gen_random_uuid(),
  '5699000XX',
  'TEMP QA0XX: descripcion corta',
  'temp',
  false,
  1,
  ARRAY['temp','qa0xx','critical','audit'],
  '[
    {"role":"user","text":"Hola"},
    {"role":"user","text":"Quiero cancelar mi reserva","expect":{"must_have_audit":true,"allowed_last_bot_action":["cancel_booking","answer_question","handoff_human"]}}
  ]'::jsonb,
  now(),
  now()
)
ON CONFLICT ("scenario_key") DO UPDATE
SET
  "name" = EXCLUDED."name",
  "suite" = EXCLUDED."suite",
  "enabled" = EXCLUDED."enabled",
  "priority" = EXCLUDED."priority",
  "tags" = EXCLUDED."tags",
  "steps" = EXCLUDED."steps",
  "updated_at" = now();
```

Notas:
- Si los vas a ejecutar inmediatamente, usa `enabled=true`. Si quieres solo “dejarlos listos” sin correrlos aún, usa `enabled=false`.
- `scenario_key` es `text` pero en la práctica se usa como ID numérico (ej: `569900033`).

---

## Forma del JSON `steps`

Cada item es un paso:

```json
{"role":"user","text":"...","expect":{ ... }}
```

Convenciones observadas en el runner (ejemplos):
- `expect.must_have_audit: true`
- `expect.allowed_last_bot_action: ["cancel_booking", "ask_missing_data", ...]`
- `expect.expected_stage: "booked"` (nuevo recomendado)
- `expect.bot_must_include: ["confirmada", "reserva"]` (nuevo recomendado)
- `expect.requirements_ok: true` (nuevo recomendado)
- `expect.side_effects_must_include: ["appointments"]` (nuevo recomendado)

Regla práctica:
- Si el objetivo del QA es **integridad/observabilidad**, valida `must_have_audit`.
- Si el objetivo es **ruteo**, restringe `allowed_last_bot_action` (o el campo equivalente que use tu runner).
- Si el objetivo es **forzar un resultado** (ej: cotizar), arma el scenario con los pasos necesarios para completar contexto y en el último step deja `allowed_last_bot_action` **solo** con la acción esperada (ej: `["send_quote"]`).
- Si el objetivo es **negocio end-to-end**, agrega validación semántica: `expected_stage`, `bot_must_include`, `requirements_ok` y side-effects esperados.

---

## Enriquecimiento recomendado de `expect` (semántica de negocio)

Ejemplo para un flujo que debe terminar en confirmación de reserva:

```json
{
  "role": "user",
  "text": "Si, confirmar",
  "expect": {
    "must_have_audit": true,
    "allowed_last_bot_action": ["confirm_booking"],
    "expected_stage": "booked",
    "requirements_ok": true,
    "bot_must_include": ["reserva", "confirmada"],
    "side_effects_must_include": ["appointments"]
  }
}
```

Ejemplo para cancelación:

```json
{
  "role": "user",
  "text": "Cancela mi reserva",
  "expect": {
    "must_have_audit": true,
    "allowed_last_bot_action": ["cancel_booking"],
    "expected_stage": "cancelled",
    "requirements_ok": true,
    "bot_must_include": ["cancelada"],
    "side_effects_must_include": ["messages", "lead_state"]
  }
}
```

## Checklist mínimo por escenario crítico

- Acción final correcta (`allowed_last_bot_action`).
- `audit_snapshot` completo (`must_have_audit=true`).
- Estado final esperado (`expected_stage`).
- Mensaje final consistente (`bot_must_include`).
- Efecto de negocio validado (`side_effects_must_include`).
