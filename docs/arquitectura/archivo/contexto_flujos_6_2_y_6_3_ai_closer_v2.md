# Contexto de flujos 6.2 y 6.3 para AI Closer en n8n

## Objetivo general

Estos dos subflujos existen para completar correctamente la rama `confirm_booking` dentro de `action_executor`.

Actualmente, `action_executor` ya:

- valida la acción `confirm_booking`
- exige `booking_date`, `booking_time`, `slot_id` y `availability_confirmed`
- arma `booking_request`
- revisa si ya existe una cita activa futura para el lead

Lo que faltaba separar correctamente era:

1. la validación real del horario antes de reservar
2. la creación real del evento en Google Calendar

Por eso se definen dos subflujos distintos:

- `6.2 check_calendar_slot`
- `6.3 create_calendar_booking`

---

## 6.2 `check_calendar_slot`

### Propósito

Validar si un horario específico sigue disponible en Google Calendar justo antes de intentar confirmar una reserva.

### Rol dentro del sistema

Este flujo **no crea reservas**.

Su única responsabilidad es responder si el slot solicitado está libre o no.

Debe existir porque en `confirm_booking` no basta con confiar en `availability_confirmed` guardado antes en estado. Entre la propuesta del horario y la confirmación final, el slot pudo haberse ocupado.

### Qué debe recibir

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

### Qué debe hacer

1. Validar que existan `booking_date`, `booking_time` y `slot_id`.
2. Construir un rango real:
   - `slot_start_at`
   - `slot_end_at`
3. Consultar Google Calendar en ese rango.
4. Detectar si existe algún evento que choque con ese bloque.
5. Devolver un JSON limpio y corto.

### Qué no debe hacer

- no debe crear eventos
- no debe escribir en DB
- no debe enviar mensajes al usuario
- no debe actualizar `lead_state`
- no debe decidir acciones comerciales

### Salida esperada

Si el horario está libre:

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

Si está ocupado:

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
      "start": "...",
      "end": "..."
    }
  ]
}
```

### Estructura recomendada en n8n

- `Execute Workflow Trigger`
- `Code` para validar y construir rango
- `Google Calendar` para consultar eventos
- `Code` para devolver resultado normalizado

### Uso desde `action_executor`

Este flujo debe llamarse solo cuando:

- la acción es `confirm_booking`
- no existe una cita activa previa para el lead

En la rama false de `IF appointment_exists`, el flujo principal debe llamar `6.2 check_calendar_slot`.

Después, un `IF slot_available` decide si seguir a crear la reserva real o responder que el horario ya no está disponible.

---

## 6.3 `create_calendar_booking`

### Propósito

Crear el evento real en Google Calendar cuando el slot ya fue validado como disponible.

### Rol dentro del sistema

Este flujo sí ejecuta la reserva real.

Debe ser el único responsable de crear el evento en Calendar y devolver los datos reales de esa reserva.

### Qué debe recibir

Debe recibir los datos del slot ya validados y los datos comerciales mínimos de la cita:

```json
{
  "lead_id": "uuid_o_identificador_del_lead",
  "slot_id": "2026-04-24_09:00",
  "slot_start_at": "2026-04-24T13:00:00.000Z",
  "slot_end_at": "2026-04-24T15:00:00.000Z",
  "service_interest": "lavado_premium",
  "vehicle_type": "suv",
  "district": "huechuraba",
  "customer_name": "Pedro",
  "phone": "56949186386",
  "calendar_id": "primary"
}
```

### Qué debe hacer

1. Validar que existan:
   - `slot_start_at`
   - `slot_end_at`
   - `service_interest`
   - `lead_id`
2. Construir:
   - `summary`
   - `description`
3. Crear el evento real en Google Calendar.
4. Devolver el evento real creado.
5. No tomar decisiones comerciales adicionales.

### Qué no debe hacer

- no debe enviar mensaje al usuario
- no debe insertar en `appointments`
- no debe actualizar `lead_state`
- no debe calcular followups
- no debe decidir si el slot está libre o no

Eso lo hace `6.2`.

### Qué debería incluir el evento

#### Summary sugerido

- `lavado_premium - Pedro`

#### Description sugerida

- Lead ID
- nombre del cliente
- teléfono
- servicio
- tipo de vehículo
- comuna
- `slot_id`

### Salida esperada

Debe devolver algo basado en el evento real de Calendar, por ejemplo:

```json
{
  "calendar_event": {
    "id": "abc123realgoogleevent",
    "summary": "lavado_premium - Pedro",
    "description": "Lead ID: ...",
    "start": {
      "dateTime": "2026-04-24T09:00:00-04:00"
    },
    "end": {
      "dateTime": "2026-04-24T11:00:00-04:00"
    },
    "status": "confirmed",
    "htmlLink": "https://calendar.google.com/..."
  }
}
```

### Estructura recomendada en n8n

- `Execute Workflow Trigger`
- `Code` para validar inputs y construir payload del evento
- `Google Calendar` para crear evento
- `Code` opcional para normalizar salida

### Uso desde `action_executor`

Este flujo debe llamarse solo cuando:

- `6.2 check_calendar_slot` devolvió `slot_available = true`

Después de `6.3 create_calendar_booking`, el flujo principal debe:

1. transformar la respuesta en `appointment_payload`
2. insertar en `appointments`
3. construir mensaje real de confirmación
4. actualizar `lead_state` a `booked`

---

## Relación entre ambos flujos

### `6.2 check_calendar_slot`

Pregunta:

- “¿este horario sigue libre?”

### `6.3 create_calendar_booking`

Ejecuta:

- “como está libre, creo la reserva real”

Separarlos así es correcto porque mantiene responsabilidades limpias y sigue la arquitectura modular: validación por un lado, ejecución real por otro.

---

## Secuencia ideal dentro de `confirm_booking`

```text
confirm_booking
 -> check_appointment
 -> IF appointment_exists
    -> true  -> ya tiene cita activa
    -> false -> Call 6.2 check_calendar_slot
                -> IF slot_available
                   -> false -> horario ya no disponible
                   -> true  -> Call 6.3 create_calendar_booking
                              -> build_real_appointment_payload
                              -> insert_appointment
                              -> build_booking_confirmation_message
                              -> send_outbound_message
                              -> update_lead_state
```

---

## Resumen corto

### 6.2

Valida disponibilidad real del horario.

No crea nada.

### 6.3

Crea el evento real en Calendar.

No decide disponibilidad.
