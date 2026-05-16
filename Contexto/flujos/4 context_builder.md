# 🧠 CONTEXTO PROYECTO: CONTEXT BUILDER (AI CLOSER n8n)

## 📌 Descripción del sistema

Estoy construyendo un sistema AI Closer modular en n8n para
automatización comercial por WhatsApp.

La arquitectura sigue esta separación:

-   n8n = orquestador
-   Base de datos = fuente de verdad (estado)
-   LLM = motor de decisión acotado
-   Reglas duras = lógica determinística sin IA

El sistema NO es un chatbot simple. Es un closer digital estructurado.

------------------------------------------------------------------------

## 🧱 Estado actual del sistema

Ya tengo implementados:

-   inbound_router ✅
-   lead_loader ✅
-   rules_engine ✅

Ahora voy a construir:

-   context_builder ⏳

------------------------------------------------------------------------

## 🎯 Objetivo del context_builder

Construir un workflow en n8n que:

-   reciba:
    -   event
    -   lead
    -   lead_state
    -   rule_result
-   construya un `context_packet` limpio, corto y útil para el LLM
-   elimine ruido y datos innecesarios
-   defina claramente:
    -   qué está pasando
    -   qué se sabe del lead
    -   cuál es el objetivo comercial
    -   qué puede hacer el modelo

------------------------------------------------------------------------

## ⚠️ Restricciones importantes

El `context_builder`:

-   ❌ NO llama al LLM

-   ❌ NO responde al usuario

-   ❌ NO ejecuta acciones

-   ❌ NO modifica la base de datos

-   ✔ SOLO construye contexto

-   ✔ SOLO organiza información

-   ✔ SOLO prepara datos para el LLM

------------------------------------------------------------------------

## 📥 Input esperado

``` json
{
  "event": {},
  "lead": {},
  "lead_state": {},
  "rule_result": {}
}
```

------------------------------------------------------------------------

## 📤 Output esperado

``` json
{
  "context_packet": {
    "lead": {},
    "state": {},
    "conversation": {},
    "business": {},
    "allowed_actions": []
  }
}
```

------------------------------------------------------------------------

## 🧠 Estructura del context_packet

### 1. lead

``` json
{
  "name": "Pedro",
  "channel": "whatsapp"
}
```

------------------------------------------------------------------------

### 2. state

``` json
{
  "stage": "new_lead",
  "intent_last": null,
  "interest_score": 0,
  "next_goal": "identify_intent",
  "service_interest": null,
  "vehicle_type": null,
  "district": null
}
```

------------------------------------------------------------------------

### 3. conversation

``` json
{
  "latest_user_message": "Hola",
  "message_type": "text"
}
```

------------------------------------------------------------------------

### 4. business

``` json
{
  "services": [
    "lavado_basico",
    "lavado_premium",
    "detailing_full"
  ],
  "pricing_policy": "usar tabla de precios",
  "district_policy": "recargo fuera de zona",
  "currency": "CLP"
}
```

------------------------------------------------------------------------

### 5. allowed_actions

``` json
[
  "ask_missing_data",
  "send_quote",
  "answer_question",
  "answer_objection",
  "offer_booking",
  "confirm_booking",
  "schedule_followup",
  "handoff_human"
]
```

------------------------------------------------------------------------

## 🧠 Lógica importante

El context_builder debe:

-   NO incluir datos innecesarios
-   NO incluir historial completo
-   NO incluir campos vacíos irrelevantes
-   mantener el payload lo más pequeño posible
-   estructurar todo para que el LLM solo decida

------------------------------------------------------------------------

## 🏗️ Estructura del workflow

    in_context_input
    -> extract_relevant_data
    -> build_context_packet
    -> output_context

------------------------------------------------------------------------

## 🎯 Objetivo final

El LLM debe:

-   entender rápido la situación
-   elegir acción correcta
-   generar respuesta coherente
-   proponer actualización de estado

SIN prompts largos ni historial completo

------------------------------------------------------------------------

FIN CONTEXTO
