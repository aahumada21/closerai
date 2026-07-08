# RULE.md — Reglas operativas del repo (n8n + Agentes IA por prompt)

## Propósito
Este repositorio existe para **diseñar, construir y mantener flujos de trabajo en n8n** (y “agentes” compuestos por múltiples workflows) **usando únicamente instrucciones por prompt**, apoyándonos en:

- **Skills de n8n** (playbooks/patrones reutilizables).
- **MCP de n8n** (herramientas para leer/crear/editar/ejecutar workflows directamente en la instancia).

El resultado esperado es la **generación de workflows avanzados, eficientes, idempotentes y observables**, listos para operar en producción.

## Alcance
Estas reglas aplican a:
- Nuevos workflows, sub-workflows (Execute Workflow), y refactors.
- Integraciones con DB (Postgres/Supabase), WhatsApp, calendarios, CRM, etc.
- Módulos del sistema (ej.: `whatsapp_inbound_router`, `lead_loader`, `rules_engine`, `context_builder`, `llm_decision`, `action_executor`).

## Principios no negociables
1. **DB como fuente de verdad**: el estado vive en base de datos; n8n orquesta.
2. **IA acotada**: el LLM decide solo cuando corresponde; las reglas duras resuelven lo determinístico.
3. **Separación de responsabilidades**: cada workflow tiene un propósito único y contratos claros.
4. **Idempotencia por defecto**: reintentos no deben duplicar acciones (mensajes, citas, cotizaciones).
5. **Observabilidad primero**: logs/trace y auditoría deben existir antes de “feature”.
6. **Eficiencia**: minimizar nodos, llamadas externas y tokens; cachear/evitar fetch redundante.
7. **Seguridad y privacidad**: nunca exponer secretos; no registrar PII sensible en texto plano.

## Estándar de entrega (lo que debe producirse en cada cambio)
Para cada workflow creado/actualizado, entregar:
- **Nombre del workflow** y propósito (1–2 líneas).
- **Contrato de entrada/salida** (JSON ejemplo) y supuestos.
- **Lista de nodos** (orden lógico) y por qué existen.
- **Mecanismo de idempotencia** (qué clave se usa y dónde se persiste/verifica).
- **Persistencia/auditoría** (tablas/eventos/registro).
- **Manejo de errores** (qué se reintenta, qué se corta, qué se deriva a humano).
- **Validación**: cómo se prueba (manual o ejecución controlada) y qué casos cubre.

## Convenciones de arquitectura (AI Closer / sistemas modulares)
### Contratos entre workflows (Execute Workflow)
- Pasar objetos estructurados (`event`, `lead`, `lead_state`, `memory`, etc.).
- **No** pasar payloads crudos “gigantes” si no son necesarios.
- Cada workflow agrega su resultado en una clave nueva (ej.: `rule_result`, `context_packet`, `decision`, `execution_result`).

### Reglas por módulo (resumen)
- `whatsapp_inbound_router`: recibe/valida/normaliza; **no decide**; **no LLM**.
- `lead_loader`: upsert + carga estado; **no responde**; **no LLM**.
- `rules_engine`: lógica determinística; decide “rule-based” vs “send_to_llm”.
- `context_builder`: arma paquete de contexto mínimo y útil; elimina ruido.
- `llm_decision`: decide acción + mensaje + `state_update`; salida estricta (JSON).
- `action_executor`: **no decide**; solo ejecuta, persiste, audita, envía.

## Convenciones n8n (diseño)
### Nombres
- Workflows: `snake_case` y verbos claros (ej.: `rules_engine`, `followup_scheduler`).
- Nodos: prefijos por tipo cuando aporte claridad:
  - `IF: ...`, `SW: ...`, `DB: ...`, `HTTP: ...`, `CODE: ...`, `LLM: ...`, `WF: ...`.

### Variables/credenciales
- Secretos únicamente en **Credentials** o variables de entorno; nunca hardcode.
- Config por ambiente (dev/stg/prod) vía parámetros/variables, no duplicando lógica.

### Code node
- Preferir code pequeño y puro (transformaciones/validaciones).
- Si el código crece, mover a sub-workflow especializado o a un patrón/skill.

### Datos y tipos
- Normalizar fechas a ISO 8601.
- Estandarizar IDs (`lead_id`, `message_id`, `appointment_id`) y mantenerlos de punta a punta.
- No depender de campos opcionales sin validación previa.

## Idempotencia (patrón obligatorio)
Antes de ejecutar acciones con side-effects (enviar WhatsApp, crear cita, insertar oferta):
- Definir **idempotency_key** (por ejemplo: `lead_id + inbound_message_id + action`).
- Verificar si ya se ejecutó (tabla `audit_logs`, `messages`, o tabla específica).
- Si ya existe: retornar `already_processed: true` y cortar.

## Observabilidad y auditoría (mínimo)
Cada workflow crítico debe:
- Registrar eventos clave (entrada normalizada, decisión, ejecución) con `trace_id`/`correlation_id`.
- Escribir auditoría en `audit_logs` (o equivalente) con: `lead_id`, `action`, `result`, `reason`, timestamps.
- Incluir “reason codes” (ej.: `MISSING_FIELD_DISTRICT`, `OUT_OF_HOURS`, `HUMAN_HANDOFF`).

## Uso de IA (LLM) — reglas
- **No** llamar LLM si una regla determinística resuelve el caso.
- Entrada al LLM: contexto mínimo + objetivo claro + formato de salida obligatorio.
- Salida del LLM: JSON estricto con `action`, `message`, `state_update` (sin texto extra).
- Siempre validar salida (schema/guardrails) antes de ejecutar.

## Protocolo para construir workflows “por prompt” (cuando trabajemos con MCP)
Cuando se solicite un workflow nuevo o un cambio:
1. **Aclarar objetivo y contrato**: inputs, outputs, tablas afectadas, y “done”.
2. **Seleccionar skills/patrones** aplicables (los “skills de n8n” del repo).
3. **Diseñar el flujo**: nodos, rutas, errores, idempotencia, auditoría.
4. **Implementar en n8n vía MCP**:
   - Leer workflow existente (si aplica).
   - Crear/actualizar nodos con nombres y contratos estandarizados.
   - Ajustar credenciales/variables sin exponer secretos.
5. **Validar**:
   - Ejecutar con payloads de prueba (si está permitido).
   - Revisar que no haya duplicaciones, loops, ni side-effects sin control.
6. **Entregar artefactos**:
   - Export/JSON del workflow (o referencia/ID si el MCP lo soporta).
   - Nota de cambios y checklist de despliegue.

## Reglas de calidad (anti-patrones)
- No “mega workflows” con responsabilidades mezcladas.
- No lógica comercial dentro del router de entrada.
- No side-effects sin persistencia/auditoría.
- No usar LLM para parseos simples o decisiones binarias evidentes.
- No strings mágicos repetidos: centralizar en constantes (Code node) o en DB/config.

## Encoding
Todo documento `.md` en este repo debe mantenerse en **UTF-8** (para evitar caracteres corruptos).

Regla adicional (workflows/export JSON):
- Los exports en `workflows/` deben escribirse en **UTF-8** (PowerShell: `Set-Content -Encoding UTF8`).
- En `Code` nodes (`parameters.jsCode`), **evitar caracteres no-ASCII** en strings “visibles” (tildes/`ñ`) porque algunos caminos de export/import pueden degradarlos a `�` y romper reglas/QA. Preferir mensajes sin tildes (`manana`, `ningun`, `aca`).
- Antes de subir a n8n, correr: `powershell -ExecutionPolicy Bypass -File scripts\\check_workflow_exports.ps1` (falla si detecta `�` o JSON inválido).

---

## Patrones QA descubiertos — `3 rules_engine` (FASE 3, 2026-07-08)

### Afirmativas reconocidas por `isAffirmativeReply` (extracto relevante)
Palabras y frases que el bot interpreta como "aceptar / proceder con agendamiento":
- Exactas (t ===): `si`, `ok`, `dale`, `bueno`, `perfecto`, `ya`, `agendemos`, `agendar`, `agenda`, `claro`, `listo`, `genial`, `excelente`, `joya`, `chevere`, `bacano`, `adelante`, `confirmo`, `trato`, `va`
- Includes: `quiero agendar`, `me interesa`, `dale perfecto`, `vamos pa eso`, `me parece bien`, `arranquemos`, `mandame una hora`, `me decido`, `me anoto`, `esta re bien`, `me apunto`, `de acuerdo`, `sin problema`, `pero va`, `igual va`, `pero si`, `pero dale`, `me quedo con ese/eso`, `me convence`, `es perfecto`, `esta perfecto`, etc.

### Guard anti-re-cotización (cheaper-alt)
Cuando el usuario menciona "precio" + keywords de alternativa, las siguientes reglas deben retornar `null` (no re-cotizar):
- `rulePriceWithCompleteContextImmediate` → guard `_pciAsksCheaper`
- `ruleBusinessFaqRouter` → guard `_asksCheaper`
- `ruleQuoteRequest` → guard `_rqAsksCheaper`
- `ruleSendQuoteWhenCommercialContextComplete` → guard `_sqAsksCheaper`
- Keywords: `mas barato`, `mas economico/a`, `mas accesible`, `menor precio`, `alternativa`, `no puedo pagar`, `elevado`, `se me va del presupuesto`, `muy caro`, `esta caro`, etc.

### Guard anti-re-cotización (booking signal en PCI)
`_pciIsBookingSignal` ahora incluye `isAffirmativeReply(ctx.text)` — cualquier frase afirmativa + "precio" no dispara re-cotización sino que deja pasar a `ruleQuoteAcceptedOfferSlots`.

### FAQ `payment_methods` — keys clave
`"pago"`, `"pagar"`, `"paga"`, `"se paga"`, `"transferencia"`, `"transferir"`, `"tarjeta"`, `"efectivo"`, `"debito"`, `"credito"`, `"medio de pago"`, `"metodo de pago"`.

### FAQ `home_service` — keys clave
Añadir siempre: `"domicilio"`, `"van a la casa"`, `"pueden venir"`, `"local"`, `"tienen local"`, `"tienen sede"`, `"donde atienden"`, `"donde quedan"`.

### Deploy correcto de `3 rules_engine`
CRÍTICO: nunca buscar "primer nodo con jsCode" — devuelve `extract_context` (no `rules_evaluation`). Siempre patchear **por nombre**:
```powershell
$resp = Invoke-RestMethod -Uri "$env:N8N_API_URL/api/v1/workflows/$wfId" -Headers @{"X-N8N-API-KEY"=$env:N8N_API_KEY}
$origExtractCtx = ($resp.nodes | Where-Object { $_.name -eq "extract_context" } | Select-Object -First 1).parameters.jsCode
foreach ($nodeSet in @($wf.nodes, $wf.activeVersion.nodes)) {
  ($nodeSet | Where-Object { $_.name -eq "extract_context" } | Select-Object -First 1).parameters.jsCode = $origExtractCtx
  ($nodeSet | Where-Object { $_.name -eq "rules_evaluation" } | Select-Object -First 1).parameters.jsCode = $jsCode
}
```

---

## Pendiente de integrar (cuando me lo compartas)
- Especificación exacta de tus **skills de n8n** (estructura, nombres, cómo invocarlos).
- Especificación exacta del **MCP de n8n** (herramientas disponibles, ejemplos, permisos).

## MCP requerido (modo “full configuration”)
Para poder **crear/editar/validar/ejecutar workflows en tu instancia**, el MCP debe estar configurado con:
- `N8N_API_URL` (URL base de n8n, sin `/api/v1`)
- `N8N_API_KEY` (API key de n8n)

Guía rápida: `docs/MCP_FULL_CONFIGURATION.md`
