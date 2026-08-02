# Escala del sistema de QA — diagnóstico

Fecha: 2026-08-01 · Estado: **diagnóstico cerrado, fix propuesto sin implementar**

Gap #2 de [`ARCHITECTURE.md`](../../ARCHITECTURE.md): *"el QA está acotado a decenas
de escenarios, no cientos ni miles"*. Se midió con datos reales en vez de leer los
parámetros por defecto, y **el diagnóstico original resultó equivocado**.

## 1. El sistema ya corrió miles de escenarios

| Métrica | Real |
|---|---:|
| Resultados registrados (`qa_test_results`) | **14.194** |
| Escenarios únicos | **5.665** |
| Corridas | 7.159 |
| Mejor día (2026-07-05) | **1.070 escenarios en 14,4 h** |
| Mejor hora | **212 escenarios** |

El `$MaxScenarios = 10` que la auditoría citó como tope es un **valor por defecto
de un parámetro**, no un límite del sistema. Con 212 escenarios en una hora, el
runner ya está corriendo ~25 en paralelo.

Así que el problema real no es *"no escala más allá de decenas"*. Es que **cada
escenario tarda ~7 minutos cuando debería tardar ~30 segundos**.

## 2. El 95% de ese tiempo es sleep, no trabajo

`9.1.1 qa_run_single_conversation` tiene tres nodos `Wait` con tiempos fijos
hardcodeados:

| Nodo | Espera |
|---|---:|
| `Wait 1` | 120 s |
| `Wait 2` | 120 s |
| `Wait 3` | 150 s |
| **Total fijo por escenario** | **390 s** |

Y la duración media medida de un escenario multi-paso es **411 s** (mediana 493 s,
4,2 pasos promedio). O sea: prácticamente todo el tiempo de una corrida de QA es
espera fija.

## 3. Cuánto tarda el bot de verdad

Medido sobre **4.012 turnos reales** de los últimos 14 días (`messages`, de mensaje
entrante a la primera respuesta saliente del mismo lead):

| Percentil | Latencia real |
|---|---:|
| p50 | **4,2 s** |
| p90 | **7,3 s** |
| p99 | **14,6 s** |

Consistente con las duraciones de ejecución en n8n (`3 rules_engine` 6,0 s p50;
`6 action_executor` 3,7 s; `6.24 persist_and_audit` 2,0 s).

**La espera de 120–150 s es ~29× el p50 y ~10× el p99.** Un timeout de 20 s cubriría
el p99 con margen de sobra.

## 4. Fix propuesto: esperar por condición, no por reloj

Reemplazar cada `Wait` de tiempo fijo por un **sondeo**: consultar cada 2 s si ya
apareció la respuesta del bot para ese lead, seguir apenas aparece, y abortar el
paso con error explícito si a los 30 s no llegó.

```
   [enviar turno]
        |
        v
   [Wait 2s] --> [SELECT respuesta outbound posterior al turno]
        ^                    |
        |          ¿hay respuesta?
        +--- no, y < 30s ----+
                             | sí
                             v
                       [siguiente paso]
```

Impacto esperado, con los números de arriba:

| | Hoy | Con sondeo |
|---|---:|---:|
| Duración de un escenario de 4 pasos | ~411 s | **~30 s** |
| Escenarios/hora (misma concurrencia) | 212 | **~1.800** |
| Corrida de 1.000 escenarios | ~5 h | **~35 min** |
| Corrida de 5.000 escenarios | ~24 h | **~3 h** |

Beneficio secundario, probablemente más valioso que la velocidad: **hoy un paso
que falla igual consume sus 150 s**, y si el bot tarda más de lo esperado el paso
se da por bueno con la respuesta anterior. Con sondeo, "no respondió en 30 s" pasa
a ser un fallo explícito en vez de un falso positivo silencioso.

## 5. Implementado 2026-08-02 — y no hizo falta reescribir el grafo

Al mapear `9.1.1` apareció algo que este diagnóstico no había visto: **la estructura
ya era un sondeo condicional de 3 intentos**, no una espera ciega.

```
send_to_bot_webhook → Wait1 → check → (no) → Wait2 → check → (no) → Wait3 → check
```

El problema nunca fue la forma, fue el reloj: esperaba **120 s antes de mirar por
primera vez**. Así que no se agregó ningún bucle — solo se ajustaron los tres
tiempos a la latencia real:

| | Antes | Ahora |
|---|---:|---:|
| `Wait 1` | 120 s | **8 s** (cubre ~p90) |
| `Wait 2` | 120 s | **12 s** (acumulado 20 s, > p99) |
| `Wait 3` | 150 s | **25 s** (acumulado 45 s, margen para carga) |
| **Peor caso** | **390 s** | **45 s** |

Cero cambios de topología: se verificó que los 31 nodos y todas las conexiones
quedaron idénticos, y que solo cambiaron los parámetros de esos 3 nodos. Eso
elimina el riesgo que hacía dudar de este cambio — romper el runner habría
contaminado todo lo que se valida con él.

**Medido en vivo** con el escenario `569900050` (4 pasos): los turnos avanzaron a
las 12:41:10, :20, :30 y :39 — **~10 s por paso contra los ~120 s de antes (~12×)**,
y 42 s la ejecución completa contra un mínimo teórico de 480 s.

## 5.1. El QA estaba roto: dos fallas pre-existentes encontradas al verificar

La verificación en vivo destapó que **el runner no podía correr ni un escenario**,
por dos motivos ajenos a este cambio. Coincide con que el último resultado en
`qa_test_results` era del 2026-07-10.

**(1) `prepare_qa_lead` — corregido.** Hacía `ON CONFLICT (channel, external_id)`,
pero el único índice único de `leads` es `(channel, external_id, agent_id)` — tres
columnas. Postgres exige que la especificación coincida con un índice existente, así
que abortaba en el primer nodo. Agregar `agent_id` al `ON CONFLICT` tampoco servía:
los leads de QA tienen `agent_id NULL` y en Postgres los NULL son distintos entre
sí, así que nunca matchearía y cada corrida crearía un lead nuevo (de hecho ya hay
pares duplicados por eso). Se reemplazó por buscar-y-si-no-existe-insertar con CTEs,
sin depender de la semántica del índice. Validado contra la base dentro de una
transacción con `ROLLBACK` antes de desplegarlo.

**(2) Ningún escenario definía `phone_number_id` — corregido.** `9.0
qa_whatsapp_normalized_router` resuelve el agente por
`source_metadata.phone_number_id` contra `agent_channels` — **no** por el teléfono
del lead. Ninguno de los 10 escenarios definía ese campo, así que el resolver recibía
`NULL`, devolvía `should_process = false` con `error_code =
missing_phone_number_id`, y **el pipeline se detenía en el router**: en la primera
corrida de prueba `audit_logs` solo registró `qa_whatsapp_normalized_router` y nada
más, y los 4 pasos fallaron con `"bot is null or empty"` — correctamente, porque el
bot nunca respondió. Ninguna espera, por larga que fuera, habría cambiado eso.

Como la resolución es por canal y no por teléfono, **no hacía falta una fila por cada
teléfono de escenario**: alcanzó con un canal y un default. Se registró
`qa-phone-agent-detailing-01` → agente **`Detailing 01-test`** (vía
`onboarding-add-channel`, siguiendo la convención de los `qa-phone-agent-*` que ya
existían) y se puso ese `phone_number_id` como default en `build_inbound_payload`. Un
escenario puede apuntar a otro agente definiendo su propio
`source_metadata.phone_number_id`: el default va antes del spread, así que lo del
escenario gana.

> **Los escenarios de booking también funcionan.** Durante esta misma sesión (hoy
> 12:41) `Detailing 01-test` recibió un `calendar_id` **propio** —
> `d2f5e77c…@group.calendar.google.com`, distinto al de Ahumada— en la versión 8 de
> su `agent_business_config`. Verificado ejecutando el código desplegado de
> `6.2`/`6.3`/`6.4` con ese valor: los tres resuelven a *su* calendario y ninguno
> corta con `calendar_not_configured`. Y comprobado end-to-end con el escenario
> `569900055` (5 pasos, incluye "Agendar"): **5/5 PASS**.
>
> Los otros 9 agentes siguen sin calendario y sí fallarían por diseño si se les
> apuntaran escenarios de booking.

### Resultado verificado

Corrida real del escenario `569900050` (4 pasos) después de los dos fixes:

| | Antes | Ahora |
|---|---|---|
| ¿Corría? | **no**, abortaba en el primer nodo | sí |
| Avance por paso | ~120 s | **~7,4 s** (~16×) |
| Escenario completo | ≥480 s solo de esperas | **80 s** (incluye el juez LLM) |
| Resultado | 4/4 FAIL (`bot is null or empty`) | **4/4 PASS** con cotizaciones reales |

## 5.2. Por qué no se hizo un bucle de sondeo con intervalos de 2 s

Era el plan original, y se descartó al ver la estructura real. Un bucle con sondeo
cada 2 s resolvería un paso en ~5 s en vez de ~10 s: la mitad, pero a costa de
agregar nodos y una arista de retorno en un workflow de 31 nodos que es la
herramienta con la que se valida todo lo demás. Ajustar tres números da la mayor
parte del beneficio (~12×) con riesgo estructural cero.

Si en el futuro los ~8 s por paso llegan a molestar, ahí sí conviene el bucle — pero
recién cuando el ahorro justifique el riesgo.

## 6. Lo que este diagnóstico NO resuelve

El otro punto del gap #2 sigue en pie y es independiente de la velocidad: de los 7
criterios de validación, solo 2 se comprueban de forma determinística (acción y
estado esperados, y son opt-in por escenario). Los otros 5 —intención, reglas de
negocio, no-alucinación, contexto, avance a conversión— los evalúa un juez LLM que
es **el mismo modelo de producción evaluándose a sí mismo**. Correr 5.000 escenarios
más rápido no arregla que el juez no sea independiente.
