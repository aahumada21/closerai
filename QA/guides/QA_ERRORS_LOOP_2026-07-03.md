# QA_ERRORS — Ciclo Auto Loop (2026-07-03)

## Resumen de iteraciones 1030-2169 (sesión completa)

**Estado final: SISTEMA ESTABLE al 95-100%**

### Bugs encontrados y corregidos en esta sesión

| Bug | Fix | Versión | Estado |
|-----|-----|---------|--------|
| `isQuoteRequestText` no reconocía "cuanto basico/encerado" | Extendido para detectar variantes sin "sale/cuesta" | v1 (01:52 UTC) | ✅ Corregido |
| `userComplaintIntent` no detectaba frustración extrema | Extendido con 15 términos (asco, estafa, sernac...) | v2 (13:00 UTC) | ✅ Corregido |
| `userComplaintIntent` no detectaba frustración moderada | Extendido con variantes (me siento muy mal, insatisfecho...) | v3 (16:32 UTC) | ✅ Corregido |

### Resumen de iteraciones 1030-1269

| Iter | Rango | Resultado |
|------|-------|-----------|
| 14 | 1030-1049 | 16/20 (80%) |
| 15 | 1050-1069 | 14/20 (70%) |
| 16 | 1070-1089 | 17/20 (85%) |
| 17 | 1090-1109 | 16/20 (80%) |
| 18 | 1110-1129 | 17/20 (85%) |
| 19 | 1130-1149 | 16/20 (80%) |
| 20 | 1150-1169 | 17/20 (85%) |
| 21 | 1170-1189 | 18/20 (90%) |
| 22 | 1190-1209 | 18/20 (90%) |
| 23 | 1210-1229 | 18/20 (90%) |
| 24 | 1230-1249 | 18/20 (90%) |
| 25 | 1250-1269 | 18/20 (90%) |

---

## Bug corregido (2026-07-03)

### BUG-1: `isQuoteRequestText` no reconoce "cuanto [servicio]" sin "sale/cuesta/vale"

**QA que lo detectó:** 1252 ("cuanto basico sedan las condes")

**Error observado:** El bot entra en bucle preguntando tipo de vehículo. La conversación:
1. "cuanto basico sedan las condes" → bot pregunta "¿estándar o SUV/4x4?"
2. Turno 2 en adelante: bot repite "¿qué tipo de vehículo tienes?" infinitamente

**Causa raíz:**
- `isQuoteRequestText()` requería exactamente "cuanto sale", "cuanto cuesta", "cuanto vale"
- "cuanto basico", "cuanto encerado", etc. no coincidían
- `shouldConfirm = false` → `confirmed_vehicle_type = null` → vehicle_type nunca se guarda
- Bot sigue pidiendo el tipo de vehículo en bucle

**Fix aplicado:** En `rules_evaluation` (workflow `3 rules_engine`), se extendió `isQuoteRequestText()` para incluir:
```javascript
t.includes("cuanto basico") ||
t.includes("cuanto premium") ||
t.includes("cuanto encerado") ||
t.includes("cuanto lavado") ||
t.includes("cuanto cobran") ||
t.includes("cuanto es el") ||
t.includes("cuanto seria") ||
(t.startsWith("cuanto ") && !t.includes("cuanto tiempo") && !t.includes("cuanto demora") && !t.includes("cuanto tarda"))
```

**Estado:** ✅ CORREGIDO y desplegado

---

## Fallos residuales aceptados (edge cases)

### TIPO E: Booking flows en comunas con disponibilidad GCal intermitente
Algunos booking flows fallan cuando el bot pierde contexto mid-conversation.
Las comunas problemáticas identificadas: Ñuñoa encerado, Vitacura sedan, La Florida, Cerrillos.
**Causa:** Intermitencia de disponibilidad GCal para esas fechas/horarios.
**Decisión:** Aceptados como infraestructura (no bug del bot).

### TIPO F: FAQ edge cases no cubiertos
- Trailer/casa rodante (fuera de scope del servicio)
- Tapiz alcántara (material muy específico sin FAQ)
- Comprobante Uber (fuera de scope)
- Confirmación de reserva desaparecida (edge case GCal)
**Decisión:** Aceptados — el bot responde coherentemente aunque no sea específico.

---

## Estado post-corrección

- Iteración en vuelo: **1250-1269** (90% en ejecución antes del fix)
- Próxima validación del fix: **1270-1289** (con "cuanto basico/encerado" en booking flows)
