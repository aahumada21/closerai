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

## 5. Por qué no se implementó todavía

El cambio no es de una línea: hay que agregar nodos y una arista de retorno (bucle)
en un workflow de 31 nodos, y equivocarse ahí vuelve el QA poco confiable — lo que
contamina todo lo que se valide con él después. Además, verificarlo requiere correr
un ciclo real de QA, que hoy tarda ~8 min por escenario justamente por el problema
que se quiere arreglar.

**Requiere aprobación antes de tocar `9.1.1`.**

## 6. Lo que este diagnóstico NO resuelve

El otro punto del gap #2 sigue en pie y es independiente de la velocidad: de los 7
criterios de validación, solo 2 se comprueban de forma determinística (acción y
estado esperados, y son opt-in por escenario). Los otros 5 —intención, reglas de
negocio, no-alucinación, contexto, avance a conversión— los evalúa un juez LLM que
es **el mismo modelo de producción evaluándose a sí mismo**. Correr 5.000 escenarios
más rápido no arregla que el juez no sea independiente.
