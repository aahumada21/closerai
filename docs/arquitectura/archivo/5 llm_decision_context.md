# 🧠 CONTEXTO PROYECTO: LLM_DECISION (AI Closer n8n)

## 🧠 CONTEXTO DEL SISTEMA

Estoy construyendo un AI Closer modular en n8n.

Arquitectura:

- n8n = orquestador
- DB = estado (source of truth)
- Rules Engine = lógica determinística
- LLM = decisión controlada (NO agente libre)

Ya tengo implementado:

- inbound_router ✅
- lead_loader ✅
- rules_engine ✅
- context_builder ✅

Ahora necesito:

👉 **llm_decision**

---

## 🎯 OBJETIVO DEL LLM_DECISION

Este workflow debe:

1. Recibir un `context_packet`
2. Llamar al modelo (OpenAI u otro)
3. Hacer que el modelo:
   - elija **UNA acción válida**
   - genere respuesta al usuario
   - proponga actualización de estado
4. Devolver JSON estructurado

---

## 📥 INPUT

```json
{
  "context_packet": {
    "lead": {},
    "state": {},
    "conversation": {},
    "business": {},
    "rule_context": {},
    "context_hints": {},
    "allowed_actions": []
  }
}
```

---

## 📤 OUTPUT ESPERADO

```json
{
  "action": "answer_question",
  "reason": "El usuario está preguntando por el precio del servicio.",
  "message": "El lavado premium tiene un valor desde $40.000 dependiendo del vehículo. ¿Qué tipo de auto tienes?",
  "state_update": {
    "stage": "qualified",
    "next_goal": "collect_vehicle_type"
  },
  "confidence": 0.92
}
```

---

## ⚠️ REGLAS CRÍTICAS

El modelo:

❌ NO puede inventar acciones  
❌ NO puede ejecutar lógica fuera de `allowed_actions`  
❌ NO puede devolver texto libre  

✔ DEBE responder SOLO JSON válido  
✔ DEBE elegir SOLO UNA acción  
✔ DEBE usar `allowed_actions` como whitelist  

---

## 🧠 PROMPT QUE NECESITO

### 1. System Prompt

Debe:
- explicar rol (AI Closer)
- explicar contexto
- obligar a elegir acción válida
- obligar a JSON estricto
- prohibir texto fuera del JSON

---

### 2. Input Prompt

Debe incluir:
- el `context_packet`
- instrucciones claras
- formato de salida

---

## 🧱 ESTRUCTURA DEL WORKFLOW

```text
input_context
-> prepare_prompt
-> call_llm
-> parse_json
-> validate_output
-> output_decision
```

---

## 🔍 VALIDACIONES IMPORTANTES

Después del LLM:

1. Validar JSON
2. Validar que `action` ∈ allowed_actions
3. Validar que exista `message`
4. Validar que `state_update` tenga sentido
5. Manejar fallback si falla

---

## 🧠 LÓGICA DE DECISIÓN

El modelo debe decidir entre acciones como:

```json
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

---

## 🚀 LO QUE NECESITO DE TI

Quiero que me entregues:

1. Diseño completo del workflow en n8n
2. Código de los nodos Code
3. System prompt optimizado
4. Prompt de entrada
5. Ejemplo real de llamada al modelo
6. Validación robusta del output
7. Manejo de errores / fallback

---

## 🟢 PRIORIDAD

El `llm_decision` debe ser:

- determinístico
- robusto
- fácil de debuggear
- seguro (sin decisiones locas)
- alineado con `allowed_actions`

---

## 🎯 OBJETIVO FINAL

El modelo no debe "pensar libremente".

Debe:
👉 elegir acción  
👉 redactar mensaje  
👉 proponer siguiente paso  

Todo dentro de un marco controlado.

---

Construye esto como si fuera un sistema profesional listo para producción.
