# Módulo 6.2 — `check_calendar_slot`

## Qué hace este módulo

El módulo `6.2 check_calendar_slot` valida si un horario específico sigue disponible en Google Calendar justo antes de confirmar una reserva.

Su función es evitar que el sistema confirme una cita usando un horario que ya fue ocupado entre el momento en que se ofreció el slot y el momento en que el cliente lo confirmó.

---

## Objetivo principal

Responder una sola pregunta:

**¿Este horario sigue libre o ya está ocupado?**

---

## Responsabilidad dentro del sistema

Este módulo:

- recibe los datos del horario que se quiere confirmar
- construye el rango real de tiempo de la cita
- consulta Google Calendar en ese rango
- detecta si existe algún evento que choque con ese bloque
- devuelve un resultado estructurado indicando si el slot está disponible o no

---

## Qué datos recibe

Debe recibir al menos:

```json
{
  "lead_id": "uuid_o_identificador_del_lead",
  "booking_date": "2026-04-24",
  "booking_time": "09:00",
  "slot_id": "2026-04-24_09:00",
  "duration_minutes": 120,
  "calendar_id": "primary"
}
```

---

## Qué hace paso a paso

### 1. Valida datos mínimos

Verifica que existan los campos necesarios para revisar el horario:

- `booking_date`
- `booking_time`
- `slot_id`

Sin esos datos no puede construir el rango real a consultar.

### 2. Construye el rango horario real

A partir de la fecha, hora y duración:

- calcula `slot_start_at`
- calcula `slot_end_at`

Ejemplo:

- fecha: `2026-04-24`
- hora: `09:00`
- duración: `120`

Resultado:

- inicio: `2026-04-24T09:00:00-04:00`
- fin: `2026-04-24T11:00:00-04:00`

### 3. Consulta Google Calendar

Busca eventos en el calendario configurado dentro de ese rango horario.

### 4. Detecta conflictos

Revisa si existe algún evento que se superponga con el bloque consultado.

- si no hay conflictos, el horario está libre
- si hay uno o más eventos, el horario está ocupado

### 5. Devuelve una respuesta normalizada

Entrega un JSON corto y claro para que el flujo principal pueda decidir qué hacer después.

---

## Qué devuelve

### Si el horario está libre

```json
{
  "slot_available": true,
  "slot_start_at": "2026-04-24T13:00:00.000Z",
  "slot_end_at": "2026-04-24T15:00:00.000Z",
  "slot_id": "2026-04-24_09:00",
  "calendar_id": "primary",
  "conflicting_events_count": 0,
  "conflicting_events": []
}
```

### Si el horario está ocupado

```json
{
  "slot_available": false,
  "slot_start_at": "2026-04-24T13:00:00.000Z",
  "slot_end_at": "2026-04-24T15:00:00.000Z",
  "slot_id": "2026-04-24_09:00",
  "calendar_id": "primary",
  "conflicting_events_count": 1,
  "conflicting_events": [
    {
      "id": "google_event_id",
      "summary": "Otro servicio",
      "start": "2026-04-24T09:00:00-04:00",
      "end": "2026-04-24T11:00:00-04:00"
    }
  ]
}
```

---

## Qué no hace este módulo

Este módulo **no**:

- crea eventos en Google Calendar
- inserta registros en la base de datos
- actualiza `lead_state`
- envía mensajes al usuario
- decide acciones comerciales
- confirma la reserva final

Su única tarea es validar disponibilidad real.

---

## Lugar que ocupa en `action_executor`

Este módulo se ejecuta solo cuando:

- la acción es `confirm_booking`
- no existe una cita activa previa para el lead

Secuencia:

```text
confirm_booking
 -> check_appointment
 -> IF appointment_exists
    -> true  -> ya tiene cita activa
    -> false -> Call 6.2 check_calendar_slot
                -> IF slot_available
                   -> false -> horario ya no disponible
                   -> true  -> Call 6.3 create_calendar_booking
```

---

## Decisión que habilita

Después de ejecutar este módulo, el flujo principal puede tomar una decisión segura:

- `slot_available = true` → seguir a `6.3 create_calendar_booking`
- `slot_available = false` → informar que el horario ya no está disponible

---

## Estructura recomendada en n8n

Este módulo puede construirse con estos nodos:

- `Execute Sub-workflow Trigger`
- `Code` para validar y construir el rango
- `Google Calendar` para consultar eventos
- `Code` para devolver el resultado normalizado

---

## Resumen corto

`6.2 check_calendar_slot` es el módulo que valida si el horario sigue libre justo antes de reservar.

No agenda.
No guarda en base de datos.
No responde al cliente.

Solo verifica disponibilidad real y devuelve un resultado confiable para que el sistema decida si puede continuar con la reserva.
