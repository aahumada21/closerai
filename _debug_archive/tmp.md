Ciclo QA en dos fases:

FASE 1 - GENERACIÓN MASIVA (una sola vez al inicio):
Genera 100 escenarios QA nuevos (o los que se indiquen) organizados en 5 bloques de 20.
Cada bloque debe cubrir aspectos distintos del sistema:
  - Bloque 1: Flujos de booking completos
  - Bloque 2: FAQ de precios y servicios
  - Bloque 3: Quejas, frustraciones y handoff
  - Bloque 4: Edge cases (zonas extremas, autos especiales, etc.)
  - Bloque 5: Flujos mixtos
Insertar todos en qa_test_scenarios_temp. Confirmar total insertado.

FASE 2 - EJECUCIÓN Y CORRECCIÓN POR BLOQUES (iterar de 20 en 20):
Para cada bloque de 20:
  A) EJECUTAR: Disparar los 20 QA del bloque (booking flows con 8s delay, max 4 booking flows; FAQ en batch-3 simultáneos con 2s entre grupos).
  B) ESPERAR: Aguardar ~7 minutos para que el evaluador LLM procese todos.
  C) ANALIZAR: Leer qa_test_results, calcular pass rate, identificar fallos.
  D) REPORTAR: Generar QA_ERRORS.md con fallos del bloque (escenario, error, causa probable, impacto, prioridad).
  E) CORREGIR: Aplicar fixes en el código (rules_engine u otros workflows n8n) para los errores encontrados.
  F) VALIDAR: Re-ejecutar solo los escenarios fallidos del bloque para confirmar correcciones.
  G) AVANZAR: Pasar al siguiente bloque de 20.

REGLAS:
- WA: el workflow n8n "QA Summary Every 5 Min" ya maneja las notificaciones automáticamente (NO enviar WA manualmente).
- GCal: limpiar appointments confirmados antes de cada bloque de booking.
- DB: psql SUPABASE_DB_URL para todas las operaciones.
- Runner: scripts/qa_run_webhook.ps1 para disparar escenarios.
- Tablas: qa_test_scenarios_temp (escenarios), qa_test_results (resultados del juez LLM).
- Container n8n actualizado: 3.5 CPUs / 4GB RAM / runner max-concurrency=10.
- Próximo batch desde key: [INDICAR KEY ACTUAL].



## FINAL
en el evaluador de los qa quiero que agreges un conexion a un nuevo fujo, que lo que hace es evaluar con score de 0-100 puntos la conversacion que tuvo el bot y la naturaleza y fluides ( para esto decido tu los parametros para esto) de las respuestas del bot, para esto, se lee pasa solo las respuestas y mensajes del bot y recibidos del qa, estev va despues del evaluador del qa openai, para esto crea una nueva fila en la tabal d los resultados para insertar el score, la idea de esto es podee revaluar que partes estan fluidas y que no 




Datos de prueba sandbox oficiales de Flow.cl (Chile):

Tarjeta de crédito: 4051 8856 0044 6623
Vencimiento: 11/27
CVV: 123
RUT (simulación banco): 11.111.111-1
Clave: 123
Usá esos datos en el checkout de sandbox que abriste.

quiero que uses las credenciales sandbox por ahora en grupo aahumada, ahumada detailing pormientras hare las pruebas manualmente dde pagos 

