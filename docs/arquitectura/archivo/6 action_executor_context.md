# 🧠 Contexto del Workflow: action_executor

## 📌 Descripción general
El workflow action_executor es el módulo encargado de ejecutar la decisión tomada por el sistema (LLM + reglas), asegurando validación, ejecución, persistencia, envío de mensajes y auditoría.

## 🎯 Objetivo
decisión → ejecución → persistencia → comunicación → auditoría

## 📥 Input
{
  "decision": {
    "action": "send_quote",
    "message": "texto opcional",
    "state_update": {}
  },
  "context_packet": {
    "lead": {},
    "state": {},
    "conversation": {}
  }
}

## ⚙️ Flujo interno
1. Validación de input
2. Validación de requisitos
3. Construcción de execution_context
4. Idempotencia
5. Enrutamiento de acción

## 🧱 Acciones
- ask_missing_data
- send_quote
- answer_question
- answer_objection
- offer_booking
- confirm_booking
- schedule_followup
- handoff_human

## 📤 Envío de mensajes
IF message_to_send → send_outbound_message → insert_message

## 💾 Persistencia
messages, offers_or_quotes, appointments, followups

## 🔄 Estado
Actualiza lead_state

## 📊 Auditoría
Registra en audit_logs

## 📦 Output
{
  "execution_result": {
    "success": true
  }
}

## 🔒 Reglas
- Validación previa
- Idempotencia
- Persistencia obligatoria
- Auditoría completa

## 🧠 Rol
NO decide
NO interpreta
SOLO ejecuta
