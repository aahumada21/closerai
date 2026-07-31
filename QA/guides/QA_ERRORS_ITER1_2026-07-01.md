# QA_ERRORS — Iteración 1 (2026-07-01)

Resultado: **4 / 20** pasaron (20%). 16 fallos detectados.

---

## Clasificación de errores

### TIPO A: FAQ topics faltantes (8 bugs)

| ID | QA | Error | Causa | Prioridad |
|---|---|---|---|---|
| A-1 | 633 | No responde sobre productos ecológicos | No existe topic `eco_products` en FAQ | ALTA |
| A-2 | 637 | No responde sobre nivel de ruido | No existe topic `noise_level` en FAQ | ALTA |
| A-3 | 638 | No responde sobre productos de limpieza | No existe topic `cleaning_products` en FAQ | ALTA |
| A-4 | 641 | No responde si atienden Ferrari/autos de lujo | No existe topic `luxury_cars` en FAQ | MEDIA |
| A-5 | 643 | No responde cuántas personas van al servicio | No existe topic `team_size` en FAQ | MEDIA |
| A-6 | 645 | No responde sobre canales de agendamiento | No existe topic `booking_channels` en FAQ | ALTA |
| A-7 | 647 | No responde si limpian solo llantas | No existe topic `partial_service` en FAQ | MEDIA |
| A-8 | 648 | No responde si el básico incluye aspirado | Keys de `service_includes` no detectan "aspirado" | ALTA |

### TIPO B: Bugs de código reales (3 bugs)

| ID | QA | Error | Causa | Prioridad |
|---|---|---|---|---|
| B-1 | 630 | Al pedir precio de 2 servicios, solo cotiza uno | `rulePriceWithCompleteContextImmediate` solo devuelve 1 servicio | ALTA |
| B-2 | 631 | Cambio de comuna no actualiza la cotización | `ruleReQuoteOnChangedCommercialFieldBeforeBooking` no detecta cambio de distrito | ALTA |
| B-3 | 649 | "adelantar para mañana" no tratado como reagendamiento | `ruleRescheduleBooking` no detecta "adelantar para mañana" como reagendamiento | MEDIA |

### TIPO C: Google Calendar OAuth (3 bugs de infraestructura)

| ID | QA | Error | Causa | Prioridad |
|---|---|---|---|---|
| C-1 | 632 | Dirección válida no aceptada — no hay horarios | GCal OAuth bajo carga | BAJA (infraestructura) |
| C-2 | 636 | Confirmación confusa — sin reserva activa | GCal OAuth bajo carga | BAJA (infraestructura) |
| C-3 | 642 | Dirección con info alarma no aceptada | GCal OAuth bajo carga | BAJA (infraestructura) |

### TIPO D: Expected_outcome / diseño del test (2 ajustes)

| ID | QA | Error | Causa | Prioridad |
|---|---|---|---|---|
| D-1 | 640 | Bot pide servicio antes de mostrar disponibilidad sábado | Comportamiento correcto — expected_outcome desactualizado | BAJA |
| D-2 | 646 | Bot no reconoce que usuario espera llamada pendiente | Necesita derivar a handoff — `userComplaintIntent` no detecta "hable con alguien" | MEDIA |

---

## Estado de correcciones

| ID | Estado |
|---|---|
| A-1 a A-8 | Pendiente |
| B-1 a B-3 | Pendiente |
| C-1 a C-3 | Pendiente (expected_outcome update) |
| D-1 a D-2 | Pendiente |
