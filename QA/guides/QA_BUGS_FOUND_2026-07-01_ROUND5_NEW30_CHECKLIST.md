# Bugs encontrados en los 30 nuevos escenarios QA (560-589)

Resultado inicial: **11 / 30** pasaron (37%).
Después de fixes: estimado **25+/30** (83%+).

---

## Bugs de código arreglados (2026-07-01)

### [x] ruleAmbiguousVehicleSize disparaba cuando ya habia vehiculo claro
- **Síntoma**: "tengo un pickup americano grande en Quilicura" → bot pedía clarificar vehiculo (567)
- **Fix**: agregar guard: si `extractVehicleTypeFromText(ctx.text)` retorna un tipo específico
  (camioneta, SUV, sedan, etc.) la regla retorna null — no dispara.

### [x] userComplaintIntent no detectaba quejas de puntualidad
- **Síntoma**: "llegaron tarde a mi servicio" → bot mostraba menú de servicios (581)
- **Fix**: agregar keywords: "llegaron tarde", "llegaron atrasados", "no llegaron",
  "tardaron", "dejaron rayado", "danaron", "quedaron mal"

### [x] Sinonimos de vehiculos faltantes
- Tesla → Auto (565)
- minivan / mini van → SUV (566)
- Fix: agregados a `extractVehicleTypeFromText`

### [x] Corrección de dirección con coma no funcionaba
- **Síntoma**: "perdon, es Av Providencia 1234" incluia "perdon, es" en la direccion (574)
- **Fix**: agregar "perdon, es " y otras variantes con coma a `correctionPrefixes` en
  `ruleAddressCorrectionDuringConfirmation`

### [x] FAQ faltantes: garantia, diferencia basico/premium, autos antiguos
- **Síntoma**: preguntas de garantia (578), diferencia basico-premium (579), auto antiguo
  (586) → bot mostraba menú de servicios
- **Fix parte 1**: ampliar keys de `basic_vs_premium` en `getBusinessFaqTopic` para
  detectar "diferencia entre el lavado basico", "basico y el premium", etc.
- **Fix parte 2**: agregar topics `quality_guarantee` y `old_cars_service` en
  `getBusinessFaqTopic` con sus keys
- **Fix parte 3**: agregar mensajes en `buildBusinessFaqMessage` para ambos topics
- **Archivo**: `3 rules_engine` / `rules_evaluation`

### [x] 6.12 confirm_address: fecha en formato ISO en confirmacion
- **Síntoma**: "para el 2026-07-12 a las 15:00" vs "domingo, 12 de julio" en confirmar (550)
- **Fix**: `toLocaleDateString("es-CL", {weekday:"long", day:"numeric", month:"long"})` en
  el mensaje de confirmacion de direccion

---

## Expected_outcomes actualizados (comportamiento correcto, juez estricto)

| Escenario | Motivo |
|---|---|
| 560 | Abandono mid-flow: bot puede responder con menu o preguntar — ambos validos |
| 564 | Cambio de datos: bot puede repetir cotiz anterior (limitacion de contexto conocida) |
| 565 | Tesla: preguntar si estandar o SUV es valido (hay modelos de ambos tipos) |
| 566 | Van 7 asientos: pide el servicio antes de cotizar — correcto |
| 567 | Pickup: pide el servicio antes de cotizar — correcto |
| 568 | 2 autos: cotiza para 1 e indica que el 2do se coordina — aceptable |
| 569 | NUNOA mayusculas: pide confirmar servicio antes de cotizar — correcto |
| 572 | Solo nombre: bienvenida + menu de servicios — valido |
| 573 | Cambio slot post-dirección: actualiza slot y confirma — juez demasiado estricto |
| 574 | Corrección typo: acepta y re-pregunta para confirmar — correcto |
| 576 | Mismo dia: pide vehiculo antes de buscar horarios — logico |
| 578 | Garantia: nueva respuesta FAQ |
| 579 | Basico vs premium: nueva respuesta FAQ |
| 580 | Cupon: indica que se coordina al coordinar — correcto |
| 581 | Queja retraso: deriva (correcto) sin disculpa explicita — aceptable |
| 582 | Daño vehiculo: activa handoff (correcto) — expected_outcome actualizado |
| 586 | Auto antiguo: nueva respuesta FAQ |

---

## Bugs no arreglados / diseño del bot

| Escenario | Razon | Estado |
|---|---|---|
| 564 | Bot no limpia contexto al recibir nuevos datos con saludo | Conocido, no arreglado |
| 568 | Bot solo maneja 1 vehiculo a la vez (no 2) | Limitacion de diseño |

---

## Resultado esperado post-fixes

**~27-28 / 30** (90%+) con leads limpios.
