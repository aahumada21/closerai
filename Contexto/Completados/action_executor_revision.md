# Revisión del workflow `action_executor`

## Veredicto general

No lo daría por cerrado todavía.

Está bien encaminado y ya cumple la columna vertebral del `action_executor`: valida input, whitelist de acciones, requisitos básicos, arma `execution_context`, hace chequeo de idempotencia, enruta por acción, envía mensajes, persiste y audita.

En otras palabras:

- como base **MVP**, sí está armado
- como versión **confiable para producción**, todavía no

---

## Qué ya cumple bien

El workflow ya resuelve correctamente estas partes base:

- validación de input
- validación de acción soportada
- validación mínima de requisitos
- construcción de `execution_context`
- control básico de idempotencia
- ruteo por acción
- envío de mensaje outbound
- persistencia de mensajes
- actualización de estado
- auditoría general

Esto significa que la estructura del flujo está bien pensada y sí se parece al rol esperado de un `action_executor`.

---

## Qué le falta para estar realmente listo

### 1. Validación dinámica de acciones permitidas por estado 19-04-2026

Hoy validas la acción contra una whitelist fija:

- `ask_missing_data`
- `send_quote`
- `answer_question`
- `answer_objection`
- `offer_booking`
- `confirm_booking`
- `schedule_followup`
- `handoff_human`

Pero no validas si esa acción está realmente permitida para ese lead en ese momento.

### Qué debería pasar
Además de la whitelist global, deberías validar contra:

- `context_packet.allowed_actions`

Ejemplo:
Si el contexto permite solo:

```json
["answer_objection", "offer_booking", "handoff_human"]
```

y el LLM devuelve `confirm_booking`, el executor debería rechazarla.

### Falta actual
- no se está cruzando la decisión con `allowed_actions`
- una acción válida en abstracto puede ser inválida en ese estado real

---

### 2. Validaciones por acción todavía muy débiles  (COMPLETADO) 19-04-2026

Actualmente hay validación básica, pero no suficiente para varias acciones.

#### `send_quote`
Hoy solo exige:

- `service_interest`

Pero para cotizar bien normalmente también necesitas:

- `vehicle_type`
- `district`

#### `confirm_booking`
Hoy solo revisa contexto general, pero no exige explícitamente:

- fecha
- hora
- slot
- disponibilidad confirmada
- identificador de evento o reserva

### Falta actual
Las validaciones todavía no están alineadas con una ejecución real de negocio.

---

### 3. `confirm_booking` todavía no confirma una reserva real (COMPLETADO) 20-04-2026

Este es uno de los puntos más importantes.

Hoy el flujo:

- revisa si ya existe una cita
- si no existe, construye un payload artificial
- crea una cita con valores dummy

Ejemplo actual:

- `start_at = now`
- `end_at = now + 1 hora`
- `summary = "Lavado vehicular"`
- `description = "Servicio agendado automáticamente"`

### Problema
Eso sirve para pruebas, pero no para producción.

### Qué falta
Debería:

- usar un slot real ya validado
- consultar disponibilidad real
- crear el evento real en Calendar
- guardar el `event_id` real
- enviar confirmación basada en datos reales

---

### 4. Actualización de `lead_state` incompleta (COMPLETADO) 21-04-2026

Este es otro punto crítico.

Tu nodo `update_lead_state` hoy guarda solo parte del estado y además fuerza:

```json
"interest_score": 0
```

### Problemas
1. puedes borrar información comercial útil
2. no se están preservando varios campos relevantes
3. el estado puede quedar inconsistente respecto al contexto previo

### Campos que deberían preservarse o actualizarse correctamente
- `intent_last`
- `interest_score`
- `service_interest`
- `vehicle_type`
- `district`
- `missing_fields`
- `last_bot_action`
- `next_goal`
- `human_handoff`
- `updated_at`

### Falta actual
El update está demasiado parcial y puede degradar la memoria operativa del lead.

---

### 5. La cotización se guarda como `sent` antes de confirmar envío  (COMPLETADO)  21-04-2026

En `offers_or_quotes` estás insertando con:

```json
"status": "sent"
```

antes de saber si el mensaje realmente fue enviado por WhatsApp.

### Problema
Si falla el outbound:

- la BD dirá que la cotización fue enviada
- pero el cliente nunca la recibió

### Qué debería pasar
Flujo más correcto:

1. generar cotización
2. guardar como `generated` o `pending_send`
3. enviar mensaje
4. si envío ok → cambiar a `sent`
5. si falla → marcar `failed`

---

### 6. Pricing hardcodeado dentro del executor  (COMPLETADO) 21-04-2026

El pricing actual vive dentro de `resolve_pricing` como tabla hardcodeada.

### Problema
Esto rompe uno de los principios que definiste para la arquitectura:

- la base de datos debe ser la fuente de verdad
- las reglas del negocio no deberían quedar enterradas dentro del workflow

### Qué falta
Mover a DB o configuración externa:

- tabla de precios
- recargos por comuna
- reglas por tipo de vehículo
- vigencia de precios

Así el sistema queda más mantenible y comercialmente editable.

---

### 7. `handoff_human` está incompleto (COMPLETADO) 23-04-2026

Hoy el flujo hace principalmente:

- marcar `human_handoff = true`
- enviar mensaje al lead

### Pero falta
- notificar al humano responsable
- enviar resumen del caso
- pausar automatización real del lead
- dejar trazabilidad operativa de quién tomó el caso

### Problema
Hoy el handoff existe a nivel de estado, pero no como operación completa.

---

### 8. `schedule_followup` demasiado básico (COMPLETADO) 26-04-2026

Actualmente agenda algo como:

- `+24h`

### Problema
Eso es muy sim	ple para un closer real.

### Qué debería contemplar
- no agendar follow-up si ya respondió
- no agendar follow-up si ya reservó
- no agendar follow-up si está en `human_handoff`
- respetar ventanas horarias
- usar tipo de seguimiento
- permitir reglas distintas según etapa

Ejemplo:
- cotización sin respuesta → follow-up comercial
- cita cercana → recordatorio
- post-servicio → solicitud de reseña

---

### 9. Auditoría todavía parcial

Sí existe auditoría, lo cual está bien.

Pero para debugging serio todavía faltan campos importantes.

### Sería ideal registrar también
- `stage_before`
- `latest_user_message`
- `allowed_actions`
- decisión completa del LLM
- resultado técnico de integraciones
- error exacto si falló DB / Calendar / WhatsApp

### Problema
Hoy hay trazabilidad básica, pero no auditoría realmente rica para operar y depurar a escala.

---

### 10. Robustez técnica y manejo de errores

Faltan endurecimientos importantes.

### Riesgos actuales
- error en DB corta flujo
- error en outbound puede dejar persistencia inconsistente
- error en Calendar puede dejar cita parcial
- el contexto puede perderse después de ciertos nodos
- la idempotencia depende de `no_message_id` como fallback

### Qué falta
- ramas explícitas de error técnico
- manejo consistente de fallos por integración
- outputs de error homogéneos
- mejor idempotency key
- chequeos para no romper el contexto tras inserts/selects

---

## Veredicto final

### Sí está listo como MVP técnico para pruebas controladas
Especialmente para estas acciones:

- `ask_missing_data`
- `answer_question`
- `answer_objection`
- `offer_booking`
- `send_quote` simple

### No está listo todavía para producción
Principalmente por estos puntos:

- `confirm_booking` aún no agenda de verdad
- `lead_state` se actualiza de forma incompleta
- falta validación por `allowed_actions`
- handoff y followups aún están muy básicos
- persistencia y envío todavía pueden quedar inconsistentes

---

## Prioridad recomendada de mejoras

### Prioridad 1 — crítica
1. corregir `confirm_booking`
2. corregir `update_lead_state`
3. validar contra `allowed_actions`

### Prioridad 2 — importante
4. mejorar validaciones por acción
5. corregir ciclo de cotización (`generated` → `sent`)
6. endurecer manejo de errores

### Prioridad 3 — escalabilidad
7. mover pricing a DB
8. completar `handoff_human`
9. sofisticar `schedule_followup`
10. enriquecer auditoría

---

## Conclusión resumida

El `action_executor`:

- **sí está bien diseñado como base**
- **sí sirve para pruebas MVP**
- **todavía no está cerrado como workflow productivo confiable**

Si quieres dejarlo realmente sólido, el siguiente paso correcto es reforzar primero:

- `confirm_booking`
- `lead_state`
- validación por acciones permitidas


# PRUEBAS ACTION EXECUTER:

## 4. send_quote con falta de tipo de vehículo
{
  "decision": {
    "action": "send_quote",
    "message": "Te cotizo enseguida"
  },
  "context_packet": {
    "lead": {
      "id": "76329124-66ae-497b-a2a0-e45250ae56cf",
      "phone": "56949186386",
      "channel": "whatsapp"
    },
    "state": {
      "stage": "qualified",
      "service_interest": "lavado_premium",
      "district": "huechuraba",
      "interest_score": 72
    },
    "conversation": {
      "last_message_id": "wamid_test_missing_vehicle_001",
      "latest_user_message": "cuanto sale"
    },
    "allowed_actions": [
      "send_quote",
      "ask_missing_data"
    ]
  }
}

Resultado esperado:

missing_fields = ["vehicle_type"]
## 5. send_quote completo X
{
  "decision": {
    "action": "send_quote",
    "message": "Te cotizo enseguida",
    "state_update": {
      "stage": "quoted",
      "next_goal": "book_appointment"
    }
  },
  "context_packet": {
    "lead": {
      "id": "76329124-66ae-497b-a2a0-e45250ae56cf",
      "phone": "56949186386",
      "channel": "whatsapp"
    },
    "state": {
      "stage": "qualified",
      "service_interest": "lavado_premium",
      "vehicle_type": "suv",
      "district": "huechuraba",
      "interest_score": 80
    },
    "conversation": {
      "last_message_id": "wamid_test_send_quote_ok_001",
      "latest_user_message": "quiero cotizar"
    },
    "allowed_actions": [
      "send_quote",
      "ask_missing_data"
    ]
  }
}

Resultado esperado:

pasa validaciones
entra a resolve_pricing
inserta quote
envía mensaje
## 6. confirm_booking con faltantes X
{
  "decision": {
    "action": "confirm_booking",
    "message": "Tu reserva está confirmada"
  },
  "context_packet": {
    "lead": {
      "id": "76329124-66ae-497b-a2a0-e45250ae56cf",
      "phone": "56949186386",
      "channel": "whatsapp"
    },
    "state": {
      "stage": "closing",
      "service_interest": "lavado_premium",
      "district": "huechuraba"
    },
    "conversation": {
      "last_message_id": "wamid_test_booking_missing_001",
      "latest_user_message": "ya quiero reservar"
    },
    "allowed_actions": [
      "confirm_booking",
      "ask_missing_data"
    ]
  }
}

Resultado esperado:

faltan booking_date, booking_time, slot_id, availability_confirmed
## 7. confirm_booking completo X
{
  "decision": {
    "action": "confirm_booking",
    "message": "Tu reserva está confirmada",
    "state_update": {
      "stage": "booked",
      "next_goal": "post_service"
    }
  },
  "context_packet": {
    "lead": {
      "id": "76329124-66ae-497b-a2a0-e45250ae56cf",
      "phone": "56949186386",
      "channel": "whatsapp"
    },
    "state": {
      "stage": "closing",
      "service_interest": "lavado_premium",
      "vehicle_type": "suv",
      "district": "huechuraba",
      "booking_date": "2026-04-21",
      "booking_time": "10:00",
      "slot_id": "slot_2026_04_21_10_00",
      "availability_confirmed": true,
      "interest_score": 90
    },
    "conversation": {
      "last_message_id": "wamid_test_booking_ok_001",
      "latest_user_message": "confirmemos"
    },
    "allowed_actions": [
      "confirm_booking",
      "ask_missing_data"
    ]
  }
}

Resultado esperado:

pasa validaciones
entra a confirm_booking
revisa appointment
crea appointment dummy
envía confirmación
## 8. schedule_followup con faltantes X
{
  "decision": {
    "action": "schedule_followup"
  },
  "context_packet": {
    "lead": {
      "id": "76329124-66ae-497b-a2a0-e45250ae56cf",
      "phone": "56949186386",
      "channel": "whatsapp"
    },
    "state": {
      "stage": "quoted"
    },
    "conversation": {
      "last_message_id": "wamid_test_followup_missing_001",
      "latest_user_message": "lo voy a pensar"
    },
    "allowed_actions": [
      "schedule_followup",
      "ask_missing_data"
    ]
  }
}

Resultado esperado:

faltan followup_type y scheduled_for
## 9. schedule_followup completo X
{
  "decision": {
    "action": "schedule_followup",
    "state_update": {
      "next_goal": "reactivate_lead"
    }
  },
  "context_packet": {
    "lead": {
      "id": "76329124-66ae-497b-a2a0-e45250ae56cf",
      "phone": "56949186386",
      "channel": "whatsapp"
    },
    "state": {
      "stage": "quoted",
      "followup_type": "quote_followup",
      "scheduled_for": "2026-04-21T15:00:00.000Z"
    },
    "conversation": {
      "last_message_id": "wamid_test_followup_ok_001",
      "latest_user_message": "lo veo mañana"
    },
    "allowed_actions": [
      "schedule_followup",
      "ask_missing_data"
    ]
  }
}

Resultado esperado:

pasa validaciones
inserta followup
## 10. handoff_human completo X
{
  "decision": {
    "action": "handoff_human",
    "message": "Te voy a derivar con una persona para ayudarte mejor.",
    "reason": "cliente pide atención humana",
    "state_update": {
      "human_handoff": true
    }
  },
  "context_packet": {
    "lead": {
      "id": "76329124-66ae-497b-a2a0-e45250ae56cf",
      "phone": "56949186386",
      "channel": "whatsapp"
    },
    "state": {
      "stage": "closing"
    },
    "conversation": {
      "last_message_id": "wamid_test_handoff_ok_001",
      "latest_user_message": "quiero hablar con una persona"
    },
    "allowed_actions": [
      "handoff_human"
    ]
  }
}

Resultado esperado:

pasa validaciones
envía mensaje
marca human_handoff = true
## 11. Prueba de idempotencia X

Usa dos veces exactamente este mismo input:

{
  "decision": {
    "action": "offer_booking",
    "message": "Tengo horarios disponibles esta semana."
  },
  "context_packet": {
    "lead": {
      "id": "76329124-66ae-497b-a2a0-e45250ae56cf",
      "phone": "56949186386",
      "channel": "whatsapp"
    },
    "state": {
      "stage": "quoted",
      "service_interest": "lavado_premium"
    },
    "conversation": {
      "last_message_id": "wamid_same_idempotency_001",
      "latest_user_message": "me interesa"
    },
    "allowed_actions": [
      "offer_booking"
    ]
  }
}

Resultado esperado:

primera vez: ejecuta normal
segunda vez: skipped due to idempotency
	

