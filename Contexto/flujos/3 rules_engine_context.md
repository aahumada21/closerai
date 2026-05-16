# 🧠 CONTEXTO PROYECTO: RULES ENGINE (AI CLOSER n8n)

## 📌 Descripción del sistema

Estoy construyendo un sistema AI Closer modular en n8n para automatización comercial por WhatsApp.

Arquitectura:
- n8n = orquestador
- Base de datos = fuente de verdad
- IA = decisión acotada
- Reglas duras = lógica determinística

---

## 🧱 Estado actual

### ✅ lead_loader (terminado)

Hace:
- upsert leads
- upsert lead_state
- devuelve event + lead + lead_state

---

## 📥 Input

```json
{
  "event": {},
  "lead": {},
  "lead_state": {}
}
```

---

## 📤 Output esperado

```json
{
  "event": {},
  "lead": {},
  "lead_state": {},
  "rule_result": {
    "action": "ask_missing_data | continue | ignore | handoff",
    "reason": "",
    "missing_fields": [],
    "should_call_llm": false
  }
}
```

---

## 🧠 Reglas base

1. Human handoff
- action: handoff
- should_call_llm: false

2. Datos faltantes
- district
- vehicle_type

3. Mensaje vacío
- ignore

4. Default
- continue
- should_call_llm: true

---

## 🏗️ Flujo esperado

```text
lead_loader
↓
rules_engine
↓
context_builder
↓
llm_decision
↓
action_executor
```

---

## 🎯 Objetivo

- No usar IA innecesariamente
- Controlar flujo comercial
- Detectar datos faltantes
- Preparar contexto limpio

---

## 🟢 Estado del proyecto

```text
inbound_router ✅
lead_loader ✅
rules_engine ⏳
context_builder 🔜
llm_decision 🔜
action_executor 🔜
```

---

FIN CONTEXTO
