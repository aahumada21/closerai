# Análisis QA Fase 3 (569900232–569900241)

Fecha de análisis: 2026-05-27  
Fuente: `QA/results/qa_phase3_batch_232_241_results_20260527_132847.json`

## Resultado general

- 10/10 escenarios con `all_passed=true`.
- 10/10 escenarios con `audit_ok_all_steps=true`.
- Flujo funcional completo: `send_quote` → `offer_available_slots` → `collect_address` → `confirm_address` → `confirm_booking`.

## Inconsistencias detectadas (aunque el QA pase)

1. **Problema de encoding (mojibake) en respuestas**
   - Ejemplos observados: `�Cu�l`, `direcci�n`, `ser�a`.
   - Impacto: baja percepción de calidad y confianza del usuario final.
   - Prioridad: **Alta (UX)**.

2. **Normalización visible poco natural en texto al usuario**
   - Ejemplo: `las_condes` en respuestas de cotización.
   - Impacto: tono “técnico” en lugar de conversacional.
   - Prioridad: **Media**.

3. **Campos de validación no consistentes en steps intermedios**
   - En varios `collect_address`/`confirm_address`, `requirements_ok` viene `null`.
   - `execution_success=true`, pero falta consistencia de telemetría.
   - Impacto: dificulta análisis automático y dashboards de calidad.
   - Prioridad: **Media-Alta (observabilidad)**.

4. **Formato de fecha/hora en confirmación mezcla técnico y natural**
   - Ejemplo en una etapa: `2026-06-09 a las 09:00` (ISO parcial).
   - En confirmación final sí aparece natural (`martes, 16 de junio...`).
   - Impacto: experiencia inconsistente entre pasos.
   - Prioridad: **Media**.

## Mejoras simples (quick wins)

1. **Forzar UTF-8 extremo a extremo**
   - Asegurar UTF-8 en nodos de construcción de mensaje y persistencia.
   - En scripts PowerShell: mantener `Out-File -Encoding utf8`.
   - Agregar test QA automático que falle si detecta `�`.

2. **Aplicar “presentación amigable” para comuna/vehículo**
   - Mantener normalización interna (`las_condes`) solo para lógica.
   - Convertir a formato display antes de responder (`Las Condes`).

3. **Completar `meta.validation` en todas las acciones**
   - Regla simple: siempre enviar `requirements_ok` booleano (nunca `null`).
   - Para acciones sin validación compleja, setear `requirements_ok=true`.

4. **Unificar template de fecha/hora en respuestas**
   - Siempre formato humano: `domingo, 07 de junio a las 09:00`.
   - Evitar fechas ISO en mensajes al cliente.

5. **QA guardrail de calidad de copy**
   - Añadir checks automáticos por step:
     - no contiene `�`
     - no contiene `_` en comunas
     - contiene signos `¿?` correctos

## Mejoras de producto (bajo esfuerzo / alto impacto)

1. **Mensaje de resumen más accionable tras confirmar dirección**
   - Actual: pregunta si confirma reserva.
   - Mejora: incluir slot + comuna + costo en una sola línea antes de pedir confirmación.

2. **Confirmación final con CTA adicional**
   - Además del texto de confirmación, añadir:
     - “¿Quieres que te recuerde 1 hora antes?”
   - Mejora percepción de acompañamiento y reduce no-shows.

3. **Bloque de claridad comercial**
   - En quote y pre-confirmación, agregar mini detalle:
     - duración estimada
     - método de pago
   - Reduce fricción en siguientes turnos.

4. **Métrica de calidad conversacional por corrida**
   - `% pasos con encoding correcto`
   - `% pasos con validación completa`
   - `% respuestas con formato de localidad amigable`
   - Publicar en `QA/results` junto al resumen técnico.

## Recomendación de implementación inmediata

Orden sugerido:
1) Fix de encoding UTF-8  
2) Display formatter para comuna/vehículo  
3) Completar `requirements_ok` en todas las acciones  
4) QA checks de copy (fail-fast)

Con esos 4 cambios, sube notablemente la calidad percibida sin tocar la lógica core de negocio.
