# 📦 Workflow: lead_loader

## 🧠 Contexto General

El workflow `lead_loader` es parte de la arquitectura modular del sistema **AI Closer en n8n**.

Su responsabilidad es exclusivamente:

- Resolver identidad del lead
- Cargar o inicializar su estado (`lead_state`)
- Devolver un objeto consolidado listo para las siguientes capas

### Principios clave

- ❗ No usa IA
- ❗ No responde al usuario
- ❗ No contiene lógica de negocio
- ❗ La base de datos es la única fuente de verdad
- ❗ Es completamente determinístico

---

## 📥 Input

Evento normalizado proveniente de `whatsapp_inbound_router`.

---

## 🎯 Objetivo del Workflow

1. Buscar el lead en base de datos
2. Crear el lead si no existe
3. Buscar el estado del lead (`lead_state`)
4. Crear el estado si no existe
5. Retornar objeto consolidado

---

## 🏗️ Arquitectura del Workflow (n8n)

in_event → normalize → find_lead → if_lead_exists → create_lead → merge → find_state → if_state → create_state → merge → output

---

## 🔄 Lógica Paso a Paso

1. Recibir evento
2. Validar campos mínimos
3. Derivar claves de lookup
4. Buscar lead en DB
5. Si existe → usarlo
6. Si no existe → crearlo
7. Buscar lead_state
8. Si existe → usarlo
9. Si no existe → crearlo
10. Construir output final
11. Retornar resultado

---

## 📤 Output Final

{
  "event": {},
  "lead": {},
  "lead_state": {}
}

---

## 🚀 Principio clave

El `lead_loader` transforma un webhook en un sistema con memoria estructurada.
