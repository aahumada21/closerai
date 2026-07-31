# Análisis QA Fase 5 (242–251)

Fecha: 2026-05-27  
Fuente: `QA/results/qa_phase5_batch_242_251_results_20260527_134906.json`

## Estado real de ejecución

- El archivo reporta solo **3 escenarios ejecutados**:
  - `569900242` (8 pasos)
  - `569900243` (8 pasos)
  - `569900244` (4 pasos)
- Del rango `569900242–569900251` faltan `569900245–569900251`.
- Conclusión: el lote **no terminó completo** (timeout/interrupción en corrida batch).

## Inconsistencias detectadas (aunque marque passed)

1. **Mojibake sigue presente en respuestas**
   - Ejemplos: `�Qu�`, `�en qu�`, `pr�ximos`, `opci�n`, `est�`.
   - Impacto: UX degradada y baja confianza.
   - Acción: asegurar deploy de flujos corregidos y revisar codificación en nodos/subworkflows que siguen emitiendo texto con encoding roto.

2. **Escenario 242 no cumple objetivo “crear reserva y cancelar”**
   - Flujo observado:
     - Selección inválida (`2` cuando solo hay opción `1`) -> responde corrección.
     - Luego solicita dirección, pero no se confirma booking.
     - Finalmente `cancel_booking` responde “No encontré reserva activa”.
   - Impacto: el escenario pasó técnicamente, pero **no valida el caso crítico esperado**.
   - Acción: ajustar escenario para elegir opción válida y confirmar booking antes de cancelar.

3. **Escenario 243 permite avanzar tras falla de cotización**
   - En step 3: `send_quote` responde “No pude calcular la cotización...”.
   - Aun así el flujo permite agendar y confirmar reserva.
   - Impacto: inconsistencia lógica/comercial; se agenda sin precio correcto.
   - Acción: si `send_quote` falla, bloquear booking o derivar a `handoff_human`/reintento explícito.

4. **`requirements_ok` nulo en acciones intermedias**
   - En `collect_address`, `confirm_address`, `cancel_booking` aparece `requirements_ok: null`.
   - Impacto: observabilidad inconsistente para QA automático.
   - Acción: normalizar `meta.validation.requirements_ok` en todas las acciones (siempre boolean).

5. **Desalineación entre “passed” y verificación semántica del caso**
   - QA pasó por reglas mínimas (`must_have_audit` / `allowed_last_bot_action`) pero no por objetivo de negocio completo.
   - Acción: enriquecer expectativas por escenario:
     - validar `stage` final esperado,
     - validar mensajes clave,
     - validar side effects (booking creado/cancelado) cuando aplica.

## Mejoras recomendadas (prioridad)

## P0 (urgente)
- Re-ejecutar deploy de flujos con fix de encoding y validar en runtime.
- Re-correr lote Fase 5 completo (`242–251`) hasta tener 10/10 escenarios.
- Ajustar QA 242 para forzar ruta válida de confirmación antes de cancelar.

## P1 (alta)
- Agregar guardrail: `send_quote` fallido no debe permitir `offer_available_slots`.
- Forzar `requirements_ok` booleano en audit para atodas las acciones.

## P2 (media)
- Mejorar criterios de `passed` para casos críticos:
  - `confirm_booking` efectivamente ejecutado cuando el escenario lo exige.
  - `cancel_booking` sobre reserva activa cuando el escenario lo exige.

## Próximo paso sugerido

1. Subir flujos corregidos (encoding + guardrail de quote).  
2. Ejecutar nuevamente `569900242–569900251`.  
3. Generar un nuevo resumen y cerrar solo con:
- 10 escenarios ejecutados,
- 0 mojibake en respuestas,
- objetivos semánticos cumplidos por escenario.
