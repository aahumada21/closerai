# Contexto 6.3 — `create_calendar_booking`

## Objetivo

El flujo **`6.3 create_calendar_booking`** existe para crear la **reserva real en Google Calendar** una vez que el horario ya fue validado como disponible por el flujo **`6.2 check_calendar_slot`**.

Este módulo **no decide disponibilidad** y **no ejecuta lógica comercial adicional**. Su única responsabilidad es:

- recibir un slot ya validado
- construir el evento real
- crear el evento en Google Calendar
- devolver los datos reales del evento creado

---

## Rol dentro del sistema

Dentro de la rama `confirm_booking` del `action_executor`, este subflujo entra **solo después** de que:

1. se revisó que el lead no tenga una cita activa previa
2. `6.2 check_calendar_slot` respondió `slot_available = true`

Es decir:

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

## Qué debe recibir

Debe recibir los datos del horario ya validado y los datos mínimos necesarios para crear la cita.

Ejemplo:

```json
{
  "lead_id": "76329124-66ae-497b-a2a0-e45250ae56cf",
  "slot_id": "2026-04-24_09:00",
  "slot_start_at": "2026-04-24T13:00:00.000Z",
  "slot_end_at": "2026-04-24T15:00:00.000Z",
  "service_interest": "lavado_premium",
  "vehicle_type": "suv",
  "district": "Huechuraba",
  "customer_name": "Pedro",
  "phone": "56949186386",
  "calendar_id": "primary"
}
```

---

## Validaciones mínimas

Antes de crear el evento, el flujo debe validar que existan al menos:

- `lead_id`
- `slot_start_at`
- `slot_end_at`
- `service_interest`

También conviene validar que:

- `slot_start_at` y `slot_end_at` tengan formato ISO válido
- `slot_end_at` sea mayor que `slot_start_at`
- `calendar_id` tenga un valor por defecto (`primary`) si no viene informado

---

## Qué debe hacer

### 1. Recibir el slot validado
No debe recalcular disponibilidad.

### 2. Construir el evento comercial
Debe generar:

- `summary`
- `description`
- opcionalmente `location`

### 3. Crear el evento real en Google Calendar
Debe crear un evento real usando el calendario configurado.

### 4. Devolver el resultado normalizado
Debe devolver el evento creado en un JSON limpio para que el flujo principal pueda usarlo después.

---

## Qué NO debe hacer

Este módulo **no debe**:

- enviar mensajes al usuario
- insertar registros en `appointments`
- actualizar `lead_state`
- programar followups
- decidir si el horario está libre o no
- manejar objeciones o lógica comercial

Todo eso ocurre en otros módulos.

---

## Summary sugerido

Formato recomendado:

```text
lavado_premium - Pedro
```

Regla simple:

```text
{service_interest} - {customer_name}
```

Si no existe `customer_name`, puede usarse:

```text
{service_interest} - Cliente
```

---

## Description sugerida

Debe contener contexto útil para operación.

Ejemplo:

```text
Lead ID: 76329124-66ae-497b-a2a0-e45250ae56cf
Cliente: Pedro
Teléfono: 56949186386
Servicio: lavado_premium
Vehículo: suv
Comuna: Huechuraba
Slot ID: 2026-04-24_09:00
```

Esto ayuda a que el evento en Calendar sea entendible sin tener que entrar al sistema.

---

## Estructura recomendada en n8n

```text
Execute Sub-workflow Trigger
 -> Code - build_calendar_event_payload
 -> Google Calendar - create_event
 -> Code - normalize_calendar_booking
```

### Nodos

#### 1. `Execute Sub-workflow Trigger`
Recibe el payload desde `action_executor`.

#### 2. `Code - build_calendar_event_payload`
Valida inputs y construye:

- `summary`
- `description`
- `location`
- `calendar_id`
- `slot_start_at`
- `slot_end_at`

#### 3. `Google Calendar - create_event`
Crea el evento real.

#### 4. `Code - normalize_calendar_booking`
Devuelve una respuesta limpia y reutilizable para el flujo principal.

---

## Salida esperada

Debe devolver algo basado en el evento real creado en Google Calendar.

Ejemplo:

```json
{
  "calendar_event": {
    "id": "abc123realgoogleevent",
    "summary": "lavado_premium - Pedro",
    "description": "Lead ID: 76329124-66ae-497b-a2a0-e45250ae56cf\nCliente: Pedro\nTeléfono: 56949186386\nServicio: lavado_premium\nVehículo: suv\nComuna: Huechuraba\nSlot ID: 2026-04-24_09:00",
    "start": {
      "dateTime": "2026-04-24T09:00:00-04:00"
    },
    "end": {
      "dateTime": "2026-04-24T11:00:00-04:00"
    },
    "status": "confirmed",
    "htmlLink": "https://calendar.google.com/..."
  },
  "booking_context": {
    "lead_id": "76329124-66ae-497b-a2a0-e45250ae56cf",
    "slot_id": "2026-04-24_09:00",
    "calendar_id": "primary",
    "service_interest": "lavado_premium",
    "vehicle_type": "suv",
    "district": "Huechuraba",
    "customer_name": "Pedro",
    "phone": "56949186386"
  }
}
```

---

## Uso desde `action_executor`

Este flujo debe llamarse **solo cuando**:

- la acción es `confirm_booking`
- no existe una cita activa previa
- `6.2 check_calendar_slot` devolvió `slot_available = true`

Después de ejecutar `6.3 create_calendar_booking`, el flujo principal debe encargarse de:

1. construir `appointment_payload`
2. insertar en la tabla `appointments`
3. construir el mensaje real de confirmación
4. enviar el mensaje outbound
5. actualizar `lead_state` a `booked`

---

## Relación con la tabla `appointments`

Este módulo **no inserta** directamente en DB.

Pero su salida debe permitir al flujo principal construir algo como esto:

```json
{
  "event_id": "abc123realgoogleevent",
  "conversation_id": "76329124-66ae-497b-a2a0-e45250ae56cf",
  "start_at": "2026-04-24T09:00:00-04:00",
  "end_at": "2026-04-24T11:00:00-04:00",
  "summary": "lavado_premium - Pedro",
  "description": "Lead ID: ...",
  "status": "confirmed"
}
```

---

## Responsabilidad exacta del módulo

La responsabilidad correcta de `6.3 create_calendar_booking` es:

> “Como el horario ya fue validado como libre, ahora creo la reserva real en Google Calendar y devuelvo el evento creado.”

No más que eso.

---

## Resumen corto

### `6.2 check_calendar_slot`
Pregunta:

- “¿este horario sigue libre?”

### `6.3 create_calendar_booking`
Ejecuta:

- “como está libre, creo la reserva real”

Separar ambos módulos así mantiene la arquitectura limpia, modular y fácil de debuggear.
