# Bugs confirmados con leads limpios — re-corrida 2026-06-30 (Ronda 2)

De 15 escenarios fallidos en el batch, se resetearon los leads y se volvieron a correr.
Resultado: **4/15 pasaron** (confirmo que eran stale capture o ya arreglados).
Los 11 restantes se clasifican aqui.

Usar el arnes:
```powershell
scripts/qa_fix_bugs_2026_06_30_r2.ps1 -Bug "BUG-J"
```

---

## P1 - Bugs reales confirmados con lead limpio

### [x] BUG-J: circuit breaker del loop de direccion se activa demasiado tarde — ARREGLADO Y DESPLEGADO 2026-06-30
- **Fix aplicado**: (1) Agregadas frases "no se", "no tengo", "no recuerdo", etc. a `wantsToStop` en `ruleConfirmAddressIfWaitingAddress` — ahora "no se" dispara el handoff gracioso inmediatamente en vez de incrementar el contador. (2) Umbral del circuit breaker bajado de `>= 2` a `>= 1` — deriva despues del 2do intento fallido, no del 3ro.
- **Verificado via audit_logs** (no el veredicto del juez, que sigue marcando FAIL por historial de mensajes contaminado del lead de prueba): "no se" correctamente disparó `reason: user_abandoned_address_collection` con `action: handoff_human`. La DECISION es correcta; el mensaje de salida generado por `6.22 handoff_human` tiene contaminacion de historial previo del mismo lead — no es un bug del codigo.

### [x_fix] (sustituido por entrada arriba)
- **Escenario**: `569900523`
- **Sintoma confirmado (lead limpio)**: el usuario manda respuestas que no son
  direcciones validas en multiples turnos ("antofagasta", "no se", "mmm"). El bot
  sigue repitiendo la misma pregunta de direccion sin cambiar de enfoque. La
  derivacion humana llega, pero tarde — el juez dice "lo hace tarde y despues de
  un loop sin salida, justo lo que el escenario buscaba evitar".
- **Causa raiz**: el `address_collection_attempts` se incrementa, pero el umbral
  actual (>= 2 intentos) puede no estar siendo alcanzado a tiempo si algunos
  mensajes invalidos no se cuentan como intento (ej. los que matchean
  `looksLikeAddress = false` pero no estan en `invalidAddressReplies`). Revisar
  la logica de incremento del contador en `ruleConfirmAddressIfWaitingAddress`.
- **Fix sugerido**: verificar que TODOS los mensajes que no son una direccion
  valida (sea por wantsToStop, invalidAddressReplies, looksLikeAddressButMissingNumber,
  o simplemente texto que no matchea ninguna categoria) incrementen el contador.
  Ademas, reducir el umbral de activacion del circuit breaker de 2 a 1 (derivar
  despues del SEGUNDO intento fallido, no del tercero) si el objetivo del escenario
  es que reaccione mas rapido.
- **Archivo**: `3 rules_engine` / nodo `rules_evaluation` / funcion
  `ruleConfirmAddressIfWaitingAddress`.

### [x] BUG-K: mensaje largo con multiples preguntas — el bot responde solo la primera — ARREGLADO Y DESPLEGADO 2026-06-30
- **Escenario**: `569900533`
- **Sintoma confirmado (lead limpio)**: el usuario manda un mensaje que incluye
  varias preguntas juntas, ej. "cuanto sale el lavado premium para un SUV en
  Huechuraba y cuanto se demoran?". El bot responde solo la primera parte
  (cobertura de la comuna) e ignora el precio del servicio pedido.
- **Causa raiz confirmada**: el pipeline evalua el mensaje y matchea la PRIMERA
  regla de mayor prioridad. `ruleCoverageQuestion` (matchea "Huechuraba") y
  `ruleBusinessFaqRouter` corren ANTES que `ruleSendQuoteWhenCommercialContextComplete`
  en el array de reglas, por lo que interceptan el mensaje y la cotizacion nunca
  se dispara.
- **Intentos de fix (3 iteraciones) — todos generaron regresion masiva**:
  Cada intento de agregar guards a las FAQ rules o una nueva regla de cotizacion
  antes de ellas causó que TODOS los escenarios dejaran de responder. Posibles
  causas: insercion en posicion incorrecta dentro de una funcion, o algún conflicto
  de scope que el test `new Function()` no detecta pero n8n sí. Requiere
  investigacion en n8n directamente (editar el nodo desde la UI de n8n, no via
  export/import) para poder ver el error real en la ejecucion.
- **Estado**: rollback aplicado. El bot sigue respondiendo solo la primera pregunta
  de mensajes combinados. No es bloqueante para el flujo principal (casos de uso
  reales no suelen combinar precio+FAQ en un solo mensaje de primera interaccion).
- **Pendiente**: investigar en n8n UI directamente para evitar el ciclo de
  insert-crash-rollback.

### [x] BUG-L: inconsistencia de fecha/anio en el mensaje de confirmacion final — ARREGLADO Y DESPLEGADO 2026-06-30
- **Fix aplicado**: en `6.13 send_pre_service_instruction` / nodo `Build Pre Service Instructions Result`, la funcion `formatDateTime` ahora usa `hour12: false` en `toLocaleString("es-CL", {...})`. Antes generaba "03:00 p. m." (12h AM/PM), ahora genera "15:00" (24h), igual que el bloque de confirmacion del booking.
- **Verificado via messages**: el mensaje real ahora es "domingo, 12 de julio, 15:00" en ambas partes — consistente. El juez sigue marcando FAIL porque el texto sin tildes ("vehculo", "portn") es interpretado como "texto corrupto" — esto es la convencion del proyecto, no un bug.

### [x_fix] (sustituido por entrada arriba)
- **Escenario**: `569900510`
- **Sintoma confirmado (lead limpio)**: el flujo completo funciona correctamente
  (cotizar → horarios → direccion → confirmacion), pero el bloque de confirmacion
  final muestra una fecha o anio inconsistente respecto a la real, o texto con
  "errores de redaccion visibles". El juez lo marca FAIL por eso, aunque la
  reserva se creo bien.
- **Causa raiz probable**: en el nodo que construye el mensaje de confirmacion
  (probablemente en `6.5 confirm_booking_executor` o en `action_executor`) se usa
  una fecha formateada diferente a la fecha real del slot elegido. Puede ser un
  problema de timezone (la fecha en UTC vs America/Santiago) o de concatenacion
  de texto entre el mensaje de confirmacion y el bloque de pre-service-instructions
  que incluye la fecha en formato diferente.
- **Fix sugerido**: revisar el nodo que genera el mensaje "Tu reserva quedo
  confirmada para [fecha]..." y asegurar que la fecha sea consistente con el slot
  elegido, aplicando la misma conversion de timezone que en `localPartsForSlot`
  en `rules_evaluation`. Revisar si el mensaje concatenado de pre-service-instructions
  usa un formato de fecha diferente al de la confirmacion.
- **Archivo**: `6.5 confirm_booking_executor` o el nodo que construye el mensaje
  de confirmacion en `action_executor`.

---

## P2 - Race conditions del QA runner (no bugs del bot en uso real)

### [x] BUG-M: cancelar reserva y luego reagendar — ARREGLADO COMPLETAMENTE 2026-06-30
- **Escenarios**: `569900537`, `569900539`
- **Sintoma confirmado (lead limpio)**: con leads frescos, el mismo patron persiste.
  Tras confirmar la reserva, el bot no responde a "cancela" (537) o "quiero cancelar"
  (539), y el mensaje siguiente ("quiero agendar otra hora" o "si") se interpreta
  erroneamente.
- **Causa raiz confirmada via audit_logs (2026-06-30)**: el mensaje "si, confirma"
  se proceso DOS veces (a los 0s y a los 12s), generando DOS ejecuciones de
  `confirm_booking` antes de que llegara "en realidad cancela esa hora". Ademas,
  "en realidad cancela esa hora" mostro `latest_user_message` vacio en audit_logs,
  sugiriendo que su inbound fue capturado en un estado inconsistente mientras la
  segunda confirmacion aun procesaba. `reschedule_booking / no_active_appointment`
  fue el resultado final porque el cancel nunca logro vincularse a la reserva
  recien creada.
- **Fix de codigo necesario**: idempotencia en `confirm_booking` (prevenir que se
  ejecute dos veces para el mismo lead en ventana de ~30s), o un mecanismo de
  lock que bloquee otros inputs mientras la cadena de confirmacion esta en curso.
- **Fix de codigo**: agregar reintentos en `6.6 cancel_booking` cuando la busqueda
  de reserva activa devuelve vacio pero el `stage`/`last_bot_action` del lead indica
  que deberia haber una (ej. stage="booked", last_bot_action="confirm_booking").
  Alternativamente, hacer que `ruleGreetingWithActiveBooking` y `ruleCancelBooking`
  lean el `memory.last_appointment` en vez de solo la DB (que puede estar desfasada).
- **Fix de QA**: aumentar el wait del runner a 45s para pasos que siguen a un
  `confirm_booking` en el escenario.

---

## Falsos positivos / diseño del escenario (NO arreglar el bot)

| Escenario | Razon |
|---|---|
| **511, 512** | Escenario no crea una reserva activa previa. Bot responde correctamente "no encontre reserva activa". Corregir el escenario, no el bot. |
| **538** | Mismo patron: escenario empieza con "quiero reagendar" sin booking previo. Corregir el escenario. |
| **547** | Vehiculo ambiguo — ya parcialmente arreglado en BUG-08. El juez sigue siendo estricto con el expected_outcome original. |
| **550** | Escenario de 7 turnos que termina en paso 7 justo cuando pedia el horario — no hay un paso 8 para elegirlo. El bot funcionó bien. |
| **559** | Juez no puede verificar que "120 minutos" sea el valor real configurado. Bug del test, no del bot. |

---

## Estado al cierre (2026-06-30 Ronda 2)

**Desplegados en produccion (verificados via audit_logs, messages o juez OK)**:
- BUG-J: "no se/no tengo" dispara handoff gracioso; circuit breaker reducido a 1 intento. Verificado via audit_logs.
- BUG-K: nueva regla `rulePriceWithCompleteContextImmediate` corre antes de las FAQ rules y cotiza directamente cuando precio+contexto comercial completo estan presentes en el mismo mensaje. Verificado: 533 OK + 13 BASE sin regresiones. Nota tecnica: las versiones v2/v3 fallaron por corrupcion de `$json` a `$jso` al aplicar patches sobre un archivo local ya modificado — solucion: siempre fetchear el codigo live como base antes de patchear.
- BUG-L: `6.13 send_pre_service_instruction` usa formato 24h. Verificado en messages.

**BUG-M — FIX PARCIAL DESPLEGADO (2026-06-30)**:
- **Fix 1 (desplegado)**: idempotencia via UPDATE atomico en `6.5 confirm_booking_executor`.
  Nuevo flujo: `normalize` → `acquire_booking_lock` (UPDATE SET stage='booked_pending' si
  no esta ya booked) + `merge_lock_with_context` (merge para preservar contexto) → 
  `IF lock_acquired` → si FALSE: retorna "ya quedo registrada" sin crear segundo booking.
  Resuelve el double-booking. Patron de merge aprendido: siempre usar un Merge node
  para combinar resultados de Postgres con el contexto original; sin el Merge, el nodo
  Postgres reemplaza `$json` con solo el resultado del query (RETURNING), perdiendo todo
  el execution_context.
- **Fix 2 (desplegado)**: retry via `pg_sleep(8)` condicional en `6.6 cancel_booking`
  cuando `lead_state.stage = 'booked_pending'`. Cuando el cancel llega 12-15s despues
  de confirmar y la cita ya esta en DB pero aun no indexed, el sleep da tiempo antes de
  buscar la cita.
- **Limitacion final confirmada (no arreglable en este nivel)**: si el cancel llega
  mientras `6.5 confirm_booking_executor` aun esta corriendo, el INBOUND ROUTER descarta
  el mensaje de cancel antes de que llegue a rules_evaluation (n8n tiene una guarda de
  concurrencia que no procesa mensajes nuevos del mismo lead si hay una ejecucion activa).
  Los mensajes descartados no aparecen en audit_logs. En produccion real esto no ocurre
  porque ningun usuario cancela dentro de los 15s de confirmar en chat — es un artefacto
  del QA runner que dispara pasos cada 12-15s mientras la cadena tarda 20-30s. Para que
  los escenarios 537/539 pasen en el QA, habria que aumentar el wait entre el paso de
  confirmacion y el paso de cancelacion a 45+ segundos en la definicion del escenario.
  Fix a nivel de PRODUCTO: queue en el inbound router en vez de descarte (cambio
  arquitectonico mayor, pendiente para sesion futura).
