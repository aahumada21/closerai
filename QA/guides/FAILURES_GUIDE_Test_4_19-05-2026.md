# QA/Test 4 (2026-05-19) — Lista de fallas

Fuente de datos:
- Resultados crudos (SQL): `QA/Test/Test_4_19-05-2026.sql`

Resumen:
- Scenarios ejecutados: **10**
- Filas parseadas: **40**
- Fallas detectadas (`passed=false` o `errors != []`): **3**

---

## Fallas detectadas

### 1) `audit vacío` (sin `flow_name/decision/idempotency_key`)

**Síntoma**
- `errors`: `audit vacío: no hay flow_name, decision ni idempotency_key`

**Ocurre en**
- `569900053` — `QA053: auto muy sucio => premium + pide comuna` (step 1, texto: `Hola`)
- `569900056` — `QA056: cancelar sin reserva (multi) => audit` (step 2, texto: `Quiero cancelar mi reserva`)
- `569900057` — `QA057: pedir humano => handoff y audit` (step 3, texto: `Es urgente`)

**Interpretación**
- El bot respondió, pero el pipeline terminó devolviendo un `audit_snapshot` vacío (o nulo). Esto normalmente indica que el flujo **no pasó por el armado final** (ej: `build_output`) o que se cortó antes de persistir/auditar.

**Dónde mirar (probable)**
- `workflows/exports/uncategorized/6 - 6 action_executor__id-ze9SfDhb6PvlRFks.json`
  - ramas donde se hace short-circuit / idempotencia
  - `insert_audit_log` (ON CONFLICT / RETURNING)
  - conexión `build_skip_output` -> `build_output`
- `workflows/exports/uncategorized/6.24 - 6.24 persist_and_audit__id-5kcYOeYHLlcAFtf9.json`
  - si el flujo se queda sin items antes de persistir

**Fix aplicado (repo)**
- `action_executor` (`build_audit_payload`): se agregó fallback robusto para `inbound_message_id/idempotency_key` usando `execution_meta.execution_id`/timestamp, y fallback de `decision` (si por merge/executeWorkflow se pierde) para que **nunca** se caiga el insert de auditoría por campos faltantes.
- Archivo: `workflows/exports/uncategorized/6 - 6 action_executor__id-ze9SfDhb6PvlRFks.json`
- Nota: el export contenía **2 copias** del nodo/query (`build_audit_payload` / `insert_audit_log`) con comportamientos distintos; se normalizaron ambas para evitar intermitencias (una copia aún tenía `ON CONFLICT DO NOTHING`).

**Estado**
- `[CORREGIDO]` (evidencia: escenarios `569900060`, `569900061`, `569900062` en `2026-05-19` con `audit_snapshot` no vacío en todos los steps).
- Si reaparece, re-ejecutar `569900053/056/057` y adjuntar el `qa_test_results` del step fallido.

---

## Referencias

- Triage histórico y fixes aplicados: `QA/GUide/FAILURES_GUIDE_Test_1_12-05-2026__triage_16-05-2026.md`
