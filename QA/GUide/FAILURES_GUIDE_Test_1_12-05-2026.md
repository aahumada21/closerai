# Fallas detectadas — QA `Test_1_12-05-2026.md`

Resumen:
- Total pasos evaluados: 127
- Fallas: 7
- Escenarios: 50

## 1) Flujos que no responden / auditoría vacía (crítico)
Escenarios afectados:
- `cancelar_sin_reserva` (step 1)
- `cancelar_reserva_conversacion_nueva` (step 1)
- `selecciona_horario_opcion_2` (step 4)

Síntomas:
- `bot_response` nulo o vacío.
- `audit_snapshot` vacío (no hay `flow_name`, `decision`, `idempotency_key`).
- `last_bot_action` nulo.

Guía de diagnóstico:
- Verificar que el workflow principal esté ejecutando `llm_decision`/`action_executor` y no esté cortando antes (IF/Switch/return vacío).
- Verificar manejo de intents de “cancelación” y “agendar” cuando la conversación/estado no tiene reserva previa.
- Asegurar que **siempre** se escribe auditoría mínima en cada turno (aunque haya fallback/handoff).

Fix esperado:
- Implementar/fijar rama de `cancel_booking` (o `handoff_human` / `answer_question`) para casos sin reserva.
- En `action_executor`, asegurar que cualquier acción crítica setee `idempotency_key` + registro en `audit_logs`.

Estado:
- `[SIN TEST]` Corregido `6.6 cancel_booking` para que sus nodos `Code` devuelvan items válidos (wrapper `json:`) en ambas ramas (con/sin reserva).
  - Export actualizado: `workflows/exports/closer/6.6 - 6.6 cancel_booking__id-HG7Wzxf3eRUQ8Cck.json`
  - Para aplicar en n8n: `powershell -ExecutionPolicy Bypass -File scripts/n8n_update_workflow_from_export.ps1 -ExportPath "workflows/exports/closer/6.6 - 6.6 cancel_booking__id-HG7Wzxf3eRUQ8Cck.json"`

## 2) Acción incorrecta frente a “después te aviso”
Escenario:
- `cliente_desaparece_despues_cotizacion` (step 4)

Síntoma:
- `last_bot_action` esperado: `schedule_followup` (o `answer_question` / `answer_objection`)
- recibido: `offer_booking`

Hipótesis:
- El intent “post-cotización / indecisión / followup” está siendo clasificado como invitación a agendar.

Fix esperado:
- Ajustar reglas/decisión para que “después te aviso” dispare `schedule_followup` con ventana y mensaje amable.

Estado:
- `[SIN TEST]` Agregada regla determinística en `rules_engine` para que, si ya se envió cotización y el cliente dice “después te aviso / lo veo / lo voy a pensar…”, se ejecute `schedule_followup` (con `followup_type` + `scheduled_for`).
  - Export actualizado: `workflows/exports/closer-main/3 - 3 rules_engine__id-18wQ5p9YxUW7tHRX.json`
  - Para aplicar en n8n: `powershell -ExecutionPolicy Bypass -File scripts/n8n_update_workflow_from_export.ps1 -ExportPath "workflows/exports/closer-main/3 - 3 rules_engine__id-18wQ5p9YxUW7tHRX.json"`

## 3) Respuesta débil ante objeción “lo voy a pensar”
Escenario:
- `objecion_lo_pensare` (step 4)

Síntoma:
- La respuesta no incluye cierres esperados (ej.: “perfecto”, “cualquier cosa”, “te puedo ayudar”, “horario”).

Fix esperado:
- Mejorar plantilla de `answer_objection` para este caso: cierre + oferta de ayuda + call-to-action suave.

Estado:
- `[SIN TEST]` Mejorado `answer_objection` en `action_executor` para el caso “lo voy a pensar”, asegurando que la respuesta incluya cierres tipo “Perfecto / Cualquier cosa / te ayudo” y un CTA suave.
  - Export actualizado: `workflows/exports/closer-main/6 - 6 action_executor__id-ze9SfDhb6PvlRFks.json`
  - Para aplicar en n8n: `powershell -ExecutionPolicy Bypass -File scripts/n8n_update_workflow_from_export.ps1 -ExportPath "workflows/exports/closer-main/6 - 6 action_executor__id-ze9SfDhb6PvlRFks.json"`

Alternativa por API (recomendada si `action_executor` falla al actualizar):
- `[SIN TEST]` Agregada regla determinística en `rules_engine` que responde esta objeción con `answer_objection` y copy de cierre (evita depender de cambiar el workflow grande).
  - Export actualizado: `workflows/exports/closer-main/3 - 3 rules_engine__id-18wQ5p9YxUW7tHRX.json`
  - Para aplicar en n8n: `powershell -ExecutionPolicy Bypass -File scripts/n8n_update_workflow_from_export.ps1 -ExportPath "workflows/exports/closer-main/3 - 3 rules_engine__id-18wQ5p9YxUW7tHRX.json"`

Import manual (si quieres actualizar `action_executor` sin API):
- Archivo listo para importar en n8n: `workflows/exports/manual/6 - 6 action_executor__manual_import_patched.json`

Refactor para achicar `action_executor` (manual import):
- Archivo listo para importar en n8n (reemplaza varias ramas del `action_router` por sub-workflows `6.X`): `workflows/exports/manual/6 - 6 action_executor__manual_import_refactor_subworkflows.json`

## 4) No recomienda “premium” cuando el usuario dice que el auto está muy sucio
Escenario:
- `auto_muy_sucio_recomienda_premium` (step 1)

Síntoma:
- Respuesta no menciona “premium”/“lavado premium”/“completo”/“detallada”.
- Acción tomada: `ask_missing_data` (con `next_goal=collect_service_interest`).

Fix esperado:
- Reglas/LLM: si hay señales claras de “muy sucio por dentro y por fuera”, sugerir `lavado_premium` y luego pedir 1 dato faltante (vehículo/comuna) para cotizar.

## 5) Cotización básica hatchback: mensaje no incluye precio / falla regla de pricing
Escenario:
- `cotizacion_basico_hatchback` (step 3)

Síntomas:
- Respuesta no incluye “lavado básico / valor / $ / agendar”.
- Nota de auditoría: `pricing_rule_not_found`.

Fix esperado:
- Corregir lookup/tabla/reglas de pricing para `lavado_basico` + `hatchback`.
- Definir fallback: si no hay regla, responder “no tengo el valor exacto, te lo confirmo” + `handoff_human` o `answer_question` con captura de datos.

---

## Prioridad sugerida de arreglo
1. Fallas de no-respuesta / auditoría vacía (rompen el sistema y el QA).
2. Pricing rule not found (impacta conversión y confiabilidad).
3. Corrección de intents (followup vs booking).
4. Calidad de copy para objeciones + recomendación premium.
