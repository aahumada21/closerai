# Bugs pendientes — batch 2026-06-30 cierre (Ronda 4)

Resultado del batch definitivo con leads limpios: **55 / 60 (92%)**.
Esta guia cubre los 5 fallos restantes.

Arnes: `scripts/qa_fix_bugs_2026_06_30_r4.ps1 -Bug "BUG-512"`

---

## Clasificacion por tipo de fix

| Escenario | Titulo | Tipo | Prioridad |
|---|---|---|---|
| 512 | Reagendar sin reserva previa | Rediseño de escenario | P1 |
| 547 | Vehiculo ambiguo "mediano" | Fix de codigo (rules) | P1 |
| 550 | Conversacion larga incompleta | Rediseño de escenario | P2 |
| 558 | Medios de pago | Solo verificar (expected_outcome ya actualizado) | P3 |
| 559 | Encoding + duracion FAQ | Fix de codigo (encoding) | P1 |

---

## P1 — Bugs con fix inmediato

### [ ] BUG-512: escenario de reagendamiento sin reserva activa previa

- **Escenario**: `569900512`
- **Pasos actuales**: solo 1 — "necesito cambiar la hora de mi reserva"
- **Comportamiento real**: bot responde "No encontre una reserva activa...
  Si quieres, puedo ayudarte a agendar una nueva" → correcto, pero el
  juez espera que HAYA una reserva que reagendar.
- **Causa raiz**: el escenario asume una reserva existente pero no la crea.
  El bot hace exactamente lo correcto (dice que no hay reserva), pero el
  objetivo del escenario ("reagendar una reserva activa") no se puede cumplir
  sin los pasos previos de booking.
- **Fix**: redisenar el escenario agregando los pasos de cotizacion + horarios
  + direccion + confirmacion ANTES del paso de reagendamiento. Patron ya
  establecido en 538 (10 pasos: 5 booking + 3 buffers + reagendar + horarios).
- **Verificacion**: ver `messages` — si el bot ofrece horarios alternativos
  cuando existe una reserva activa → PASS.
- **Archivos**: `qa_test_scenarios_temp` WHERE scenario_key='569900512'.

---

### [ ] BUG-547: vehiculo descrito como "mediano" no se mapea a tipo exacto

- **Escenario**: `569900547`
- **Pasos**: "cuanto sale lavar mi auto, es como mediano nomas"
- **Comportamiento real**: bot pregunta "Que vehiculo tienes: auto, SUV o
  camioneta?" — correcto genericamente, pero no ayuda al usuario saber si
  "mediano" es un "auto" o algo mas.
- **Causa raiz**: `ruleVehicleRuralNeedsClarification` y
  `ruleMissingRequiredFields` no detectan "mediano" como descriptor de
  vehiculo. El termino queda sin resolver y el bot hace una pregunta
  generica en vez de una mas especifica.
- **Fix sugerido**: en `ruleVehicleRuralNeedsClarification` (o en
  `ruleMissingRequiredFields`), detectar palabras como "mediano", "grande",
  "chico", "pequeno", "compacto" y enriquecer el mensaje de aclaracion:
  "Por ejemplo, si tu auto es de tamano normal (sedan, hatchback, station
  wagon), seria la categoria 'auto'. Si es mas voluminoso (SUV, jeep,
  minivan), seria 'SUV'. Si es camioneta pickup, seria 'camioneta'. Cual
  corresponde al tuyo?"
- **Verificacion**: ver `messages` — si el bot da opciones que ayudan al
  usuario a identificar "mediano" → PASS.
- **Archivos**: `3 rules_engine` / `rules_evaluation` /
  `ruleVehicleRuralNeedsClarification`.

---

### [ ] BUG-559: encoding de tildes en respuestas FAQ + duracion no verificable

- **Escenario**: `569900559`
- **Pasos**: "cuanto se demoran en hacer el lavado premium?"
- **Comportamiento real**: bot responde "Lavado premium toma aproximadamente
  120 minutos. Para orientarte mejor, dime qu servicio te interesa, qu tipo
  de vehculo tienes..." — "qué" → "qu", "vehículo" → "vehculo".
- **Causa raiz**: hay DOS problemas distintos:
  1. **Encoding**: las tildes del texto generado por el LLM se pierden en el
     mensaje concatenado posterior. El bot usa `action_executor` →
     `6.9 answer_question` → `6.1 send_outbound_message`. Revisar si
     `6.1 send_outbound_message` hace alguna sanitizacion que elimine caracteres
     especiales, o si el nodo de Code que concatena el mensaje tiene una
     expresion regex que los quita.
  2. **Duracion no configurable**: el bot inventa "120 minutos" sin leerlo
     desde `agent_config`. La duracion deberia venir de
     `agentBusinessConfig.config.services[service_key].duration_minutes`.
     Si el LLM responde la pregunta, no tiene acceso al valor real.
- **Fix parte 1 (encoding)**: buscar en `6.1 send_outbound_message` o en
  `6.9 answer_question` donde se construye el mensaje final y verificar que
  no haya un `.replace(/[^\x00-\x7F]/g, '')` u otra expresion que elimine
  Unicode. Si el texto llega bien al nodo de Code pero sale sin tildes, el
  problema esta en ese nodo.
- **Fix parte 2 (duracion)**: agregar en `ruleBusinessFaqRouter` (o una nueva
  regla `ruleDurationQuestion`) deteccion de preguntas de duracion
  ("cuanto demora", "cuanto tarda", "cuanto tiempo") y responder con el
  valor real de `ctx.agentBusinessConfig.config.services[key].duration_minutes`
  si existe, en vez de delegar al LLM.
- **Verificacion**: ver `messages` — si la respuesta tiene tildes correctas Y
  menciona un tiempo que coincide con la config → PASS.
- **Archivos**: `6.1 send_outbound_message`, `6.9 answer_question`,
  `3 rules_engine` / `rules_evaluation`.

---

## P2 — Bugs de rediseño de escenario

### [ ] BUG-550: conversacion de 7 turnos no completa el booking

- **Escenario**: `569900550`
- **Pasos actuales (7)**: hola → quiero cotizar → es premium → tengo un suv
  → vivo en huechuraba → dale mandame los horarios → la primera que ofreciste
- **Comportamiento real**: el bot llega correctamente hasta pedir la direccion
  exacta despues de "la primera que ofreciste" (slot seleccionado, falta
  direccion). El flujo es CORRECTO — el juez marca FAIL porque el escenario
  termina ahí y "no confirma el horario".
- **Causa raiz**: el expected_outcome dice "confirmar el horario seleccionado"
  pero el escenario no tiene un paso 8 (dar la direccion) ni paso 9
  (confirmar). El bot no puede confirmar sin la direccion.
- **Fix**: agregar 2 pasos finales al escenario: paso 8 = "Av Providencia 1234"
  (direccion) y paso 9 = "si, confirma". Actualizar expected_outcome para
  reflejar el flujo completo de 9 pasos.
- **Verificacion**: ver `messages` — si el bot confirma la reserva con
  servicio/vehiculo/comuna/fecha/hora → PASS.
- **Archivos**: `qa_test_scenarios_temp` WHERE scenario_key='569900550'.

---

## P3 — Solo verificar (sin fix de codigo)

### [ ] VERIFY-558: medios de pago — confirmar que el expected_outcome actualizado pasa

- **Escenario**: `569900558`
- **Pasos**: "puedo pagar con tarjeta?"
- **Estado**: expected_outcome ya actualizado para aceptar respuesta del tipo
  "los medios de pago se confirman al coordinar el servicio".
- **Verificacion**: resetear lead, correr, ver si el juez ahora pasa.
- **Si sigue fallando**: el bot esta pidiendo servicio/vehiculo/comuna al
  final de la respuesta de pagos — este "call to action" innecesario puede
  estar molestando al juez. Fix: en la regla de FAQ de medios de pago, no
  agregar el call to action si el usuario solo pregunto sobre pagos.

---

## Como verificar sin codigo

Para cada escenario, el patron es:
```powershell
# Reset
$lid = (psql $env:SUPABASE_DB_URL -t -A -c "SELECT id FROM leads WHERE phone='56990XXXX' ORDER BY created_at DESC LIMIT 1;").Trim()
psql $env:SUPABASE_DB_URL -c "UPDATE lead_state SET stage='new_lead', human_handoff=false, intent_last=NULL, next_goal=NULL, last_bot_action=NULL, address_collection_attempts=0, service_interest=NULL, vehicle_type=NULL, district=NULL, booking_options='[]', booking_date=NULL, booking_time=NULL, slot_id=NULL, service_address=NULL WHERE lead_id='$lid';"

# Correr
scripts/qa_run_webhook.ps1 -ScenarioKey "56990XXXX" -BatchWaitSeconds 10

# Esperar y ver mensajes
Start-Sleep 90
psql $env:SUPABASE_DB_URL -c "SELECT direction, content FROM messages WHERE lead_id='$lid' ORDER BY created_at ASC;"
psql $env:SUPABASE_DB_URL -c "SELECT llm_passed, llm_notes FROM qa_test_results WHERE scenario_id='56990XXXX' ORDER BY created_at DESC LIMIT 1;"
```

**Criterio de PASS**: mensajes reales correctos segun expected_outcome. El
veredicto del juez es complementario, no definitivo.
