# QA_ERRORS — Ciclo Auto Loop (2026-07-02)

Resultado inicial: **7 / 20** pasaron (35%). 12 fallos + 1 pendiente GCal.

---

## Errores por tipo

### TIPO A: FAQ topics faltantes (5 bugs)
| ID | QA | Error | Prioridad |
|---|---|---|---|
| A-1 | 731 | Bot no admite que no tiene memoria de conversaciones previas | ALTA |
| A-2 | 737 | Bot no responde sobre facturación para empresa | ALTA |
| A-3 | 738 | Bot no admite que no tiene historial de servicios del usuario | ALTA |
| A-4 | 741 | `damage_insurance` FAQ no disparó para "ralladuras" → key issue | ALTA |
| A-5 | 743 | Bot no responde sobre nombre del técnico asignado | MEDIA |

### TIPO B: Bugs de lógica / complaint detection (2 bugs)
| ID | QA | Error | Prioridad |
|---|---|---|---|
| B-1 | 744 | Queja post-servicio sobre calidad no activa handoff | ALTA |
| B-2 | 739 | Emojis en mensaje bloquean extracción de datos → cotización genérica | MEDIA |

### TIPO C: Expected_outcome (5 ajustes)
| ID | QA | Error | Prioridad |
|---|---|---|---|
| C-1 | 732 | Bot no pidió número de calle (probable GCal issue en pasos previos) | MEDIA |
| C-2 | 736 | Bot ofreció opciones pero no "tomó la decisión" de recomendar premium | BAJA |
| C-3 | 742 | Bot pidió datos antes de verificar disponibilidad del día | BAJA |
| C-4 | 745 | Bot pidió datos ya provistos en mensaje formal | BAJA |
| C-5 | 749 | Bot no mostró horarios disponibles (GCal) | BAJA |
