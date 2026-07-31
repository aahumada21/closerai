# Análisis final QA Fase 5 (569900242–569900251)

Fecha: 2026-05-27  
Fuente: `QA/results/qa_phase5_batch_242_251_results_20260527_135709.json`

## Resumen ejecutivo

- Escenarios completos: **10**
- Escenarios OK: **5** (`242, 243, 248, 249, 250`)
- Escenarios con fallas: **5** (`244, 245, 246, 247, 251`)
- Hallazgo crítico repetido: **audit vacío** + **bot vacío** en varios pasos.

## Inconsistencias y problemas detectados

## 1) Auditoría vacía en pasos críticos (P0)

Casos:
- `569900244` step 8 (`reagendar`)
- `569900245` step 8 (`reagendar`)
- `569900246` steps 1 y 2 (`handoff humano`)
- `569900247` step 2 (`urgente posterior`)
- `569900251` steps 6, 7 y 8 (dirección/confirmación/reagendar)

Síntoma:
- `flow_name`, `decision`, `idempotency_key` ausentes.
- En algunos pasos también `bot_response` vacío.

Impacto:
- Rompe trazabilidad y observabilidad.
- El QA falla por integridad de auditoría, aunque la intención de negocio sea correcta.

## 2) Flujo handoff inestable (P0)

Casos:
- `569900246` falló ambos pasos.
- `569900247` falló en el segundo mensaje (“urgente”).

Síntoma:
- No se emite respuesta.
- No hay acción ni snapshot de auditoría.

Impacto:
- Riesgo alto en casos sensibles (derivación humana/urgencia).

## 3) Reagendar después de reserva no consistente (P1)

Casos:
- `569900244`, `569900245`, `569900251`.

Síntoma:
- Mensaje final: “No encontré una reserva activa para reprogramar”.
- Esto ocurre incluso cuando el escenario venía de ruta de booking.

Impacto:
- El estado reservado no se está preservando/leyendo correctamente para `reschedule_booking`.

## 4) Selección de slot inválida en diseño de escenario (P2 de QA)

Casos:
- `569900242` y `569900244`: se envía opción `2` o `3` cuando solo existe opción `1`.

Síntoma:
- Bot corrige: “esa opción no está disponible”.

Impacto:
- No es bug de producto necesariamente; ensucia el objetivo del test crítico.

## 5) Mojibake persiste en runtime (P1 UX)

Ejemplos:
- `�Qué`, `pr�ximos`, `opci�n`, `cotizaci�n`.

Impacto:
- Baja percepción de calidad del producto.
- Inconsistencia con correcciones realizadas en exports locales.

## 6) Bloqueo comercial ausente tras error de cotización (P1)

Caso:
- `569900243` step 3: “No pude calcular la cotización...”, pero luego permite avanzar a booking y confirmar.

Impacto:
- Incoherencia de negocio: se agenda sin resolver pricing.

## Mejoras recomendadas

## P0 (hacer primero)
- Forzar `build_output` unificado en todas las ramas de `handoff_human` y `reschedule_booking` para garantizar `audit_snapshot` completo.
- Agregar guardrail en `action_executor`: si `bot` o `audit` vienen vacíos, generar fallback estructurado con `flow_name`, `decision` e `idempotency_key`.

## P1 (alta prioridad)
- Revisar persistencia de estado al confirmar reserva para que `reschedule_booking` encuentre booking activo.
- Si `send_quote` falla, bloquear transición a booking (pedir reintento o handoff humano).
- Corregir encoding en origen runtime (nodos que construyen copy), no solo en exports.

## P2 (mejora de QA)
- Ajustar escenarios críticos para elegir slot válido según oferta real (o fijar fixtures de disponibilidad).
- Endurecer criterios de éxito:
  - para handoff: `bot_response` no vacío + `audit_ok=true`;
  - para reagendar: existencia previa de reserva activa verificada.

## Quick wins de producto

- Homogeneizar copy en español neutro (sin mojibake, con tildes y signos correctos).
- Mostrar siempre resumen de estado antes de cancelar/reagendar:
  - fecha/hora actual reservada,
  - comuna,
  - siguiente acción sugerida.
- Agregar mensaje explícito cuando se invalida una opción de slot:
  - “Solo hay 1 opción disponible ahora: [detalle]”.

## Próxima corrida recomendada

1. Corregir `handoff_human` + `reschedule_booking` (auditoría obligatoria).  
2. Corregir persistencia de estado booking para reagendar.  
3. Re-ejecutar `569900244,245,246,247,251` solamente y validar:
- `audit_ok_all_steps=true`
- `bot_response` no vacío en todos los pasos
- objetivo semántico cumplido por escenario.
