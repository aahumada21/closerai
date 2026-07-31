# Hallazgos QA Fase 5 (QA252–QA261) — 2026-05-27

## Resumen ejecutivo
- Escenarios analizados: `569900252` a `569900261`.
- Resultado global: **0 escenarios completos exitosos**.
- Patrón dominante: respuestas nulas y auditoría vacía en todos los steps de la mayoría de escenarios.

## Resultado por escenario
- `569900252`: 8/8 steps fallidos (audit vacío en todos).
- `569900253`: 8/8 steps fallidos (audit vacío en todos).
- `569900254`: 2/2 steps fallidos (audit vacío en todos).
- `569900255`: 3/3 steps fallidos (audit vacío en todos).
- `569900256`: 4/4 steps fallidos (audit vacío en todos).
- `569900257`: 4/4 steps fallidos (audit vacío en todos).
- `569900258`: 8/8 steps fallidos (audit vacío en todos).
- `569900259`: 2/2 steps fallidos (audit vacío en todos).
- `569900260`: 2/2 steps fallidos (audit vacío en todos).
- `569900261`: 6/6 steps fallidos (audit vacío en todos).

## Inconsistencias críticas detectadas

## 1) Falla sistémica de ejecución QA (P0)
- Error repetido en resultados:
  - `bot es null o vacío`
  - `audit vacío: no hay flow_name, decision ni idempotency_key`
  - `No hubo respuesta, acción ni cambio de estado`
- Impacto: no se están validando reglas de negocio reales; la corrida QA no está atravesando correctamente el pipeline `action_executor -> persist_and_audit`.

## 2) Integridad de auditoría rota en 252–261 (P0)
- `flow_name`, `decision_action`, `idempotency_key` nulos en la totalidad de steps fallidos.
- Impacto: sin trazabilidad operativa ni evidencia confiable para aceptación/rechazo del fix.

## 3) Bloqueo comercial (P1) no verificable aún
- Se creó cobertura para validar lock tras fallo de cotización (`569900256`, `569900257`), pero al no haber respuesta útil no se pudo confirmar comportamiento.
- Estado: **pendiente de verificación** por falla sistémica previa.

## Hipótesis técnicas probables (ordenadas)
1. Workflow activo en n8n no corresponde al export actualizado (desalineación de IDs/versiones tras cambio Docker).
2. Webhook runner ejecuta, pero el subflujo principal retorna error silencioso y no emite payload auditado.
3. Enrutamiento de `qa_conversation_test_runner` no está resolviendo bien escenarios `enabled=true` recién cargados.
4. Error de credenciales/conectividad intermitente en nodos de persistencia (DB/message provider), generando salida vacía.

## Acciones correctivas recomendadas (inmediatas)
1. Re-sincronizar workflows activos y validar IDs efectivos en n8n:
   - `6 action_executor`
   - `6.24 persist_and_audit`
   - `9.1 qa_conversation_test_runner`
2. Ejecutar un smoke test mínimo (1 step) y confirmar que retorna:
   - `bot_response` no nulo
   - `flow_name`
   - `decision_action`
   - `idempotency_key`
3. Re-ejecutar primero `569900254` (2 pasos) como prueba corta.
4. Solo si ese smoke pasa, re-ejecutar lote `252–261`.

## Mejores prácticas para próximos lotes
- Separar corrida en:
  - **Lote A (smoke):** 2–3 escenarios cortos.
  - **Lote B (full):** escenarios largos booking/cancel/reschedule.
- No deshabilitar escenarios automáticamente cuando `audit` venga vacío (evita perder repetibilidad de diagnóstico).
- Agregar chequeo previo en runner: si `flow_name/decision/idempotency_key` faltan en step 1, abortar corrida y marcar causa “infra/pipe”.
