# Arnes y guia para generar QA: 20 base + 40 extendidos

Fecha: 2026-06-26

Este documento explica como seguir generando escenarios de QA usando el nuevo
sistema de evaluacion por OpenAI (ver `QA/GUide/QA_TEMP_SCENARIO_EXAMPLE.md`
para el detalle tecnico de `expected_outcome`), y deja ya cargados 60
escenarios (20 base + 40 extendidos) como punto de partida real, probado.

## El arnes: `scripts/qa_generate_scenarios.ps1`

En vez de escribir 60 `INSERT` a mano, el arnes toma un archivo JSON con un
array de escenarios y los sube todos de una vez a `qa_test_scenarios_temp`.

```powershell
scripts/qa_generate_scenarios.ps1 -JsonFile "QA/Test/mi_batch.json" -EnableAfterUpload
```

Cada escenario en el JSON tiene esta forma:

```json
{
  "scenario_key": "569900560",
  "name": "Descripcion corta del escenario",
  "tags": ["categoria1", "categoria2"],
  "priority": 30,
  "steps": [
    { "text": "mensaje del usuario, paso 1" },
    { "text": "mensaje del usuario, paso 2" }
  ],
  "expected_outcome": "Descripcion en texto libre de lo que el bot deberia lograr en esta conversacion completa."
}
```

Reglas importantes (aprendidas mientras se armaba este batch, para no repetir
los mismos errores):

1. **`scenario_key` debe ser solo numeros** y empezar con `56990` para que el
   runner lo use directamente como numero de telefono de prueba. Si tiene
   letras (ej. `56990judgeXX`), el numero de telefono queda invalido y la
   conversacion nunca arranca.
2. **Cada `step` necesita `source_metadata` con `phone_number_id`** apuntando
   a un canal real registrado en `agent_channels`, si no el lead nunca
   resuelve a un agente y el bot no responde nada. Para Ahumada Detailing, el
   harness ya inyecta esto automaticamente en los 60 escenarios de este batch:
   ```json
   "source_metadata": { "provider": "meta_whatsapp_cloud_api", "phone_number_id": "qa-phone-ahumada-agent-aware" }
   ```
   Si vas a probar OTRO agente, usa el `external_channel_id` correspondiente
   de ese agente en `agent_channels` (ej. `qa-phone-agent-lavado`,
   `qa-phone-agent-polarizado`).
3. **No reutilices un `scenario_key` ya usado** (este batch ocupo el rango
   `569900500`-`569900559`). Antes de elegir keys nuevas, revisa el maximo
   actual:
   ```sql
   SELECT max(scenario_key::bigint) FROM qa_test_scenarios_temp WHERE scenario_key ~ '^[0-9]+$';
   ```

## Como correrlos

Uno por uno:
```powershell
scripts/qa_run_webhook.ps1 -ScenarioKey "569900500"
```

En lote (todos los que empiecen con un prefijo):
```powershell
scripts/qa_run_webhook.ps1 -BatchMode -TempPrefix "569900" -BatchWaitSeconds 30
```

## Como leer los resultados

```sql
SELECT scenario_id, step_index, passed, llm_passed, llm_notes, llm_inconsistencies, llm_problems
FROM qa_test_results
WHERE scenario_id BETWEEN '569900500' AND '569900559'
ORDER BY scenario_id, step_index;
```

`llm_notes` trae el resumen en espanol de OpenAI explicando por que paso o no
paso. `llm_inconsistencies`/`llm_problems` son arrays con el detalle especifico
(citando el paso, ej. "en el paso 3...").

## Bloqueo conocido al momento de escribir esto (2026-06-26)

La credencial nativa de Google Calendar en n8n ("Google Calendar account")
tiene el refresh token vencido (ver `docs/GOOGLE_CALENDAR_OAUTH_2026-06-22.md`).
Esto significa que **cualquier escenario que pida horarios disponibles**
(accion `offer_available_slots`) puede demorarse mas de lo normal o no
responder dentro de la ventana de espera del runner, y el resultado va a salir
`passed=false` por una falla tecnica que **no es un bug nuevo**, es ese
problema ya conocido. Los escenarios que NO requieren calendario (cotizar,
preguntas, cobertura, etc.) funcionan bien hoy. Reconecta la credencial o el
calendario OAuth dedicado de un agente antes de correr el batch completo, o
vas a ver fallas masivas en los escenarios de agendamiento que no reflejan
bugs reales del bot.

## Los 60 escenarios ya cargados (rango 569900500-569900559)

Archivo fuente: `QA/Test/qa_scenarios_batch_2026-06-26.json` (el JSON completo,
listo para subir de nuevo si se borran o para usar de plantilla).

### 20 BASE (happy path — deben funcionar siempre)

| Key | Categoria | Que prueba |
|---|---|---|
| 569900500 | Cotizar | Datos completos en un solo mensaje |
| 569900501 | Cotizar | Pedir vehiculo/comuna por separado |
| 569900502 | Cotizar | Lista general de precios |
| 569900503 | Recomendacion | Sugerir servicio sin saber cual elegir |
| 569900504 | Cobertura | Comuna soportada |
| 569900505 | Cobertura | Comuna NO soportada |
| 569900506 | Horarios | Ofrecer horarios tras cotizar |
| 569900507 | Seleccion | Elegir horario por numero |
| 569900508 | Seleccion | Elegir horario por fecha/hora explicita |
| 569900509 | Direccion | Dar direccion y confirmar reserva |
| 569900510 | End-to-end | Flujo completo natural de principio a fin |
| 569900511 | Cancelar | Cancelar reserva activa |
| 569900512 | Reagendar | Reagendar reserva activa |
| 569900513 | Handoff | Pedir hablar con un humano |
| 569900514 | FAQ | Pregunta general sobre el servicio |
| 569900515 | Objecion | "esta muy caro" |
| 569900516 | Typos | Mensaje con errores de tipeo |
| 569900517 | Direccion | "ok" no es una direccion valida |
| 569900518 | Catalogo | Servicio que no existe |
| 569900519 | Memoria | Retomar conversacion despues de cotizar |

### 40 EXTENDIDOS (regresion, edge cases, multi-tenant)

| Rango de keys | Categoria | Que prueba |
|---|---|---|
| 569900520-524 | Loop/abandono | Regresion del bug de loop en recoleccion de direccion (no quiero, bye, "tu jefe", circuito de seguridad) |
| 569900525-529 | Cambio de contexto | Cambiar servicio/comuna/vehiculo/horario a mitad de conversacion |
| 569900530-534 | Idempotencia/edge | Mensaje duplicado, emoji solo, mensaje vacio, mensaje muy largo, doble confirmacion |
| 569900535-539 | Cancelar/reagendar avanzado | Cancelar sin reserva, reagendar sin reserva, cancelar+reagendar, horario ocupado |
| 569900540-544 | Direcciones | Direccion completa, ambigua, recargo por comuna, cambio de direccion, sin direccion |
| 569900545-549 | Tipos de vehiculo | Moto, furgon, vehiculo ambiguo, correccion de vehiculo |
| 569900550-554 | Memoria/contexto largo | Conversacion de 7 turnos, pregunta fuera de tema, saludo repetido, post-venta |
| 569900555-559 | Canal/varios | Webchat vs WhatsApp, adjuntos no soportados, FAQs de pago y duracion |

## Arnes para APLICAR fixes sin romper nada: `scripts/qa_fix_harness.ps1`

Mientras el arnes de arriba sirve para GENERAR y CORRER escenarios, este otro
sirve para el otro lado del ciclo: cuando ya tienes el fix de un bug listo en
un export de workflow (ej. `3 rules_engine`), lo sube, lo valida contra el
escenario puntual del bug Y contra los 20 BASE (regresion), y si algo del set
de regresion se rompe, **revierte solo automaticamente**.

```powershell
scripts/qa_fix_harness.ps1 `
  -ExportPath "workflows/exports/uncategorized/3 - 3 rules_engine__id-e88adaaf-dfed-46af-8f5f-4dd73f2cb5c5.json" `
  -BugScenarioKeys @("569900507","569900509","569900510") `
  -BugId "BUG-06"
```

Que hace, en orden:
1. Respalda el workflow EN VIVO (`workflows/backups/<id>_pre_<BugId>_<fecha>.json`)
   antes de tocar nada.
2. Sube el export con el fix ya aplicado (`n8n_update_workflow_from_export.ps1`,
   que ya valida JSON/mojibake antes de subir).
3. Corre, uno por uno, los escenarios del bug + los 20 BASE (o el set de
   regresion que le pases con `-RegressionScenarioKeys`).
4. Espera el veredicto de OpenAI (`llm_passed`) de cada uno con timeout.
5. Si **cualquier** escenario BASE deja de pasar → rollback automatico al
   backup del paso 1 y termina con error (exit 1). Si solo el escenario del
   bug puntual sigue fallando (pero nada de regresion) → NO revierte, reporta
   y termina con exit 2 para que se itere de nuevo. Si todo pasa → exit 0.

Por defecto el set de regresion es `569900500`-`569900519` (los 20 BASE
happy-path, que "deben funcionar siempre"). Pasale `-RegressionScenarioKeys`
si quieres un set distinto.

Este arnes asume que TU ya hiciste el cambio en el archivo del export (no
escribe codigo por ti) — su trabajo es: subir, probar, y revertir solo si algo
sale mal, para poder iterar fix por fix de
`QA/GUide/QA_BUGS_FOUND_2026-06-26_FIX_CHECKLIST.md` sin dejar la instancia
productiva rota.

## Como seguir agregando mas (proximo batch)

1. Copia `QA/Test/qa_scenarios_batch_2026-06-26.json` como plantilla.
2. Define el rango de `scenario_key` nuevo (consulta el maximo actual primero).
3. Escribe cada escenario con: `name`, `tags`, `steps` (mensajes de usuario en
   orden), y sobre todo un buen `expected_outcome` — se especifico y verificable
   (que datos debe usar el bot, que NO debe inventar, que accion final se
   espera), porque eso es lo que OpenAI va a leer para decidir si paso o no.
4. Sube con el arnes: `scripts/qa_generate_scenarios.ps1 -JsonFile <tu archivo> -EnableAfterUpload`.
5. Corre con `qa_run_webhook.ps1 -BatchMode -TempPrefix <tu prefijo>`.
6. Lee resultados con la consulta SQL de la seccion anterior.
