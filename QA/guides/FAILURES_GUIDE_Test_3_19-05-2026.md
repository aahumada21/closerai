# QA/Test 3 (2026-05-19) — Lista de fallas

Fuente de datos:
- Resultados crudos (SQL): `QA/Test/Test_3_19-05-2026.sql`

Resumen:
- Scenarios ejecutados: **10**
- Fallas detectadas (`passed=false` o `errors != []`): **0**

---

## Fallas

No se detectaron fallas en este set: todos los pasos vienen con `passed=true` y `errors=[]` en `QA/Test/Test_3_19-05-2026.sql`.

---

## Ejecuciones (referencia)

| Scenario ID | Nombre | Step | Texto |
|---:|---|---:|---|
| 569900040 | QA040: saludo => pregunta servicio | 1 | Hola |
| 569900041 | QA041: pedir servicio basico => pregunta comuna | 1 | Quiero lavado basico |
| 569900042 | QA042: comuna+vehiculo sin servicio => pregunta servicio | 1 | Las Condes, SUV |
| 569900043 | QA043: solo comuna => pregunta servicio | 1 | Estoy en Las Condes |
| 569900044 | QA044: solo vehiculo => pregunta servicio o comuna | 1 | Tengo un hatchback |
| 569900045 | QA045: pedir precio sin contexto => pide datos (no silencio) | 1 | Cuanto sale? |
| 569900046 | QA046: pedir agendar sin contexto => pide servicio | 1 | Quiero agendar |
| 569900047 | QA047: cancelar sin reserva (1er mensaje) => responde + audita | 1 | Quiero cancelar mi reserva |
| 569900048 | QA048: pedir humano (1er mensaje) => handoff | 1 | Quiero hablar con un humano |
| 569900049 | QA049: auto muy sucio (1er mensaje) => recomienda premium + pide 1 dato | 1 | Mi auto esta muy sucio por dentro y por fuera |

---

## Referencias (puntos abordados)

Estos smoke tests cubren casos de inicio de conversación. Para triage/correcciones históricas y evidencia de fixes, ver:
- `QA/GUide/FAILURES_GUIDE_Test_1_12-05-2026__triage_16-05-2026.md`

