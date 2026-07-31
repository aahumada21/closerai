# Diagnóstico de inconsistencias del bot comercial — Ahumada Detailing

## Contexto

Se revisó una conversación de prueba del bot con el cliente. El flujo ya logra conversar, pedir datos, cotizar, ofrecer horarios, pedir dirección y confirmar reserva. Sin embargo, todavía existen inconsistencias comerciales y técnicas que pueden afectar la confianza del cliente y generar errores en la cotización.

Conversación revisada:

```text
Cliente: hola
Bot: Perfecto. ¿Qué servicio te interesa?

Cliente: que servicios tiene disponible
Bot: Estos son los servicios que ofrecemos en Ahumada Detailing:
- Lavado de mantención
- Lavado profundo
- Lavado premium

Cliente: me interesa lavado profundo
Bot: Perfecto. Para ayudarte bien, ¿en qué comuna estás?

Cliente: huechuraba
Bot: Perfecto. ¿Qué tipo de vehículo tienes?

Cliente: suv
Bot: Para tu SUV en Huechuraba, te recomendaría el lavado profundo...

Cliente: dame el valor
Bot: No pude calcular la cotización en este momento...

Cliente: cual era el valor?
Bot: Claro, el valor que te compartí corresponde al servicio...

Cliente: valor
Bot: El valor del servicio es $40000. ¿Te gustaría agendar?

Cliente: si
Bot: Perfecto. Si quieres, te ayudo a agendar...

Cliente: ayudame a agendar
Bot: Tengo estos horarios disponibles...

Cliente: 1
Bot: Perfecto. Para dejar la reserva bien registrada...

Cliente: camino del roble 1251 casa 34
Bot: Perfecto, dejo registrada la dirección...

Cliente: listo reserva
Bot: Perfecto, tu reserva quedó confirmada...
```

---

# 1. Problema principal: catálogo inconsistente

## Qué ocurre

El bot ofrece y usa:

```text
Lavado profundo
lavado_profundo
```

Pero la tabla real de precios usa:

```text
lavado_basico
lavado_premium
encerado_full
```

Por eso el bot inicialmente no puede cotizar. Cuando el cotizador recibe:

```json
{
  "service_code": "lavado_profundo",
  "vehicle_type": "suv",
  "district_key": "huechuraba"
}
```

no encuentra precio, porque `lavado_profundo` no existe en `service_vehicle_prices`.

## Impacto

- El cliente pide un valor y el bot falla.
- El bot parece no saber sus propios precios.
- Se genera desconfianza.
- El sistema termina usando códigos internos distintos en cada módulo.

## Corrección recomendada

Definir catálogo oficial único:

| Nombre para cliente | Código interno |
|---|---|
| Lavado básico / mantención | `lavado_basico` |
| Lavado premium / profundo | `lavado_premium` |
| Encerado full | `encerado_full` |

Regla clave:

```text
lavado_profundo → lavado_premium
lavado_esencial → lavado_basico
```

---

# 2. El bot ofrece “lavado profundo” como servicio separado

## Qué ocurre

Cuando el cliente pregunta:

```text
¿Qué servicios tiene disponible?
```

El bot responde:

```text
Lavado de mantención
Lavado profundo
Lavado premium
```

Eso crea una categoría intermedia que no existe en pricing.

## Corrección

El menú comercial debe mostrar solo servicios oficiales:

```text
Estos son los servicios disponibles en Ahumada Detailing:

1. Lavado básico
Ideal para mantener el auto limpio por dentro y por fuera.

2. Lavado premium
Opción más completa de limpieza interior y exterior. Recomendado si quieres una limpieza más detallada.

3. Encerado full
Servicio enfocado en brillo y protección de pintura.

Para darte el valor exacto, dime qué tipo de vehículo tienes y en qué comuna sería el servicio.
```

## Dónde corregir

Workflow:

```text
6.17 send_service_menu
```

También revisar:

```text
5 llm_decision
4 context_builder
3 rules_engine
```

---

# 3. El bot recomienda un servicio que el cliente ya eligió (COMPELTADO) 03-05-2026

## Qué ocurre

El cliente dice:

```text
me interesa lavado profundo
```

Luego entrega comuna y vehículo:

```text
Huechuraba
SUV
```

Después el bot responde:

```text
Para tu SUV en Huechuraba, te recomendaría el lavado profundo...
```

Eso es inconsistente porque el cliente ya eligió el servicio.

## Qué debería hacer

Cuando ya tiene:

```text
service_interest
vehicle_type
district
```

y el cliente ya eligió un servicio, la acción correcta es:

```text
send_quote
```

No:

```text
recommend_service
```

## Respuesta ideal

```text
Perfecto. Para tu SUV en Huechuraba, el lavado premium tiene un valor de $40.000. ¿Te gustaría agendar?
```

---

# 4. El bot dice “el valor que te compartí” aunque nunca lo compartió  (COMPELTADO) 03-05-2026

## Qué ocurre

Después de fallar la cotización, el cliente pregunta:

```text
¿Cuál era el valor?
```

El bot responde:

```text
Claro, el valor que te compartí corresponde al servicio...
```

Pero antes no compartió ningún valor. Había respondido:

```text
No pude calcular la cotización en este momento.
```

## Impacto

El bot parece inventar memoria o asumir información que no existe.

## Corrección

Agregar regla en el LLM:

```text
No digas “como te comenté”, “el valor que te compartí”, “el precio anterior” o frases similares si no existe `commercial_memory.last_quote` o una cotización enviada exitosamente.
```

## Respuesta correcta

```text
Todavía no te había entregado el valor. Déjame calcularlo con el servicio, vehículo y comuna.
```

Luego debe ejecutar:

```text
send_quote
```

---

# 5. El bot falla varias veces antes de cotizar correctamente (COMPELTADO) 03-05-2026

## Qué ocurre

El bot responde varias veces:

```text
No pude calcular la cotización...
```

Luego más adelante sí responde:

```text
El valor del servicio es $40000.
```

Esto indica que el estado cambió o que el cotizador empezó a mapear correctamente `lavado_profundo → lavado_premium`.

## Corrección obligatoria

En el workflow:

```text
6.0 resolve_pricing_from_db
```

Nodo:

```text
normalize_pricing_keys
```

Debe existir un mapeo defensivo final:

```js
function canonicalService(value) {
  const service = norm(value);

  const map = {
    lavado_profundo: "lavado_premium",
    profundo: "lavado_premium",
    interior_full: "lavado_premium",
    limpieza_completa: "lavado_premium",

    lavado_esencial: "lavado_basico",
    esencial: "lavado_basico",
    basico: "lavado_basico",

    lavado_basico: "lavado_basico",
    lavado_premium: "lavado_premium",
    encerado_full: "encerado_full",
    encerado: "encerado_full"
  };

  return map[service] || service;
}
```

Esto protege la cotización aunque el LLM o un estado antiguo mande un código no oficial.

---

# 6. El bot responde genérico aunque ya tiene los datos

## Qué ocurre

El cliente pide:

```text
dame el valor
```

Y el bot responde:

```text
El valor depende del servicio exacto...
```

Pero el sistema ya tenía:

```text
service_interest = lavado_profundo
vehicle_type = SUV
district = Huechuraba
```

## Corrección

Regla obligatoria:

```text
Si el usuario pide precio/valor/cotización y existen service_interest, vehicle_type y district, la acción debe ser send_quote.
```

Nunca responder genérico si ya están los datos mínimos.

---

# 7. Después del precio, el “sí” no avanza directo a horarios

## Qué ocurre

Bot:

```text
El valor del servicio es $40000. ¿Te gustaría agendar?
```

Cliente:

```text
si
```

Bot:

```text
Perfecto. Si quieres, te ayudo a agendar...
```

Eso es débil comercialmente. El cliente ya aceptó.

## Qué debería hacer

Después del “sí”, el bot debe ejecutar:

```text
offer_available_slots
```

## Respuesta ideal

```text
Perfecto. Te muestro los horarios disponibles para agendar.
```

Luego listar horarios.

## Regla recomendada

```text
Si last_bot_action = send_quote y next_goal = book_appointment, y el usuario responde sí/dale/ok/agendemos, ejecutar offer_available_slots.
```

---

# 8. La lista de horarios no aparece numerada

## Qué ocurre

El bot dice:

```text
Tengo estos horarios disponibles:

domingo...
martes...
jueves...

¿Cuál te acomoda? Puedes responder con 1, 2, 3.
```

Pero no muestra:

```text
1.
2.
3.
```

## Corrección

El mensaje debe ser:

```text
Tengo estos horarios disponibles para lavado premium durante los próximos días:

1. domingo, 03 de mayo a las 03:00 p. m.
2. martes, 05 de mayo a las 09:00 a. m.
3. jueves, 07 de mayo a las 09:00 a. m.

¿Cuál te acomoda? Puedes responder con 1, 2 o 3.
```

## Dónde revisar

Workflow:

```text
6.4 list_available_slots
6 action_executor → build_available_slots_message
```

El código ya debería numerar, pero hay que revisar si el formato se pierde al pasar por algún subworkflow o al devolver al Chat de n8n.

---

# 9. El bot muestra códigos técnicos al cliente

## Qué ocurre

Al confirmar la reserva dice:

```text
Servicio: lavado_profundo.
```

Eso no debe mostrarse al cliente.

## Corrección

Crear función estándar de label:

```js
function serviceLabel(service) {
  const map = {
    lavado_basico: "lavado básico",
    lavado_premium: "lavado premium",
    encerado_full: "encerado full",
    lavado_profundo: "lavado premium",
    lavado_esencial: "lavado básico",
  };

  return map[service] || "el servicio";
}
```

Usarla en todos los mensajes al cliente.

## Dónde corregir

```text
6.5 confirm_booking_executor
6.10 reschedule_booking
6.12 confirm_address
6.13 send_pre_service_instruction
6.14 notify_on_the_way
6.15 request_review
6.16 request_referral
```

Especialmente en cualquier mensaje final de reserva confirmada.

---

# 10. La dirección queda en un paso ambiguo

## Qué ocurre

Cliente entrega dirección:

```text
camino del roble 1251 casa 34
```

Bot responde:

```text
Perfecto, dejo registrada la dirección... Con eso ya puedo continuar con la reserva.
```

Luego el cliente tiene que decir:

```text
listo reserva
```

Recién ahí confirma.

## Problema

El cliente no sabe si la reserva ya quedó lista o si falta algo.

## Mejor flujo

Después de recibir dirección, el bot debería avanzar con una confirmación clara:

```text
Perfecto, dejo registrada la dirección: camino del roble 1251 casa 34.

Confirmo entonces la reserva para el domingo 03 de mayo a las 15:00, lavado premium para SUV en Huechuraba. ¿Está correcto?
```

O si tu sistema permite confirmar directo:

```text
Perfecto, con esa dirección ya dejo confirmada tu reserva para el domingo 03 de mayo a las 15:00.
```

## Dónde revisar

```text
6.12 confirm_address
3 rules_engine → ruleConfirmAddressIfWaitingAddress
6.5 confirm_booking_executor
```

---

# 11. Prioridad de corrección

## Prioridad 1 — Crítica

Corregir catálogo oficial:

```text
lavado_profundo → lavado_premium
lavado_esencial → lavado_basico
```

Aplicar en:

```text
3 rules_engine
6.0 resolve_pricing_from_db
5 llm_decision
4 context_builder
6.17 send_service_menu
6.18 recommend_service
```

---

## Prioridad 2 — Cotización

Regla obligatoria:

```text
Si el usuario pide valor/precio/cotización y ya existen service_interest, vehicle_type y district, ejecutar send_quote.
```

Evitar respuestas genéricas como:

```text
depende del servicio exacto
```

si el servicio ya está definido.

---

## Prioridad 3 — Avance comercial después del precio

Cuando el bot pregunta:

```text
¿Te gustaría agendar?
```

y el cliente responde:

```text
sí
```

debe ejecutar:

```text
offer_available_slots
```

No debe responder:

```text
Si quieres, te ayudo a agendar.
```

---

## Prioridad 4 — Labels humanos

Nunca mostrar códigos internos como:

```text
lavado_profundo
lavado_premium
lavado_basico
```

Mostrar siempre:

```text
lavado premium
lavado básico
encerado full
```

---

## Prioridad 5 — Confirmación de dirección/reserva

Después de recibir dirección, el bot debe dejar claro qué falta o confirmar la reserva.

---

# 12. Cambios recomendados por módulo

## 3 rules_engine

Cambiar:

```text
lavado_profundo → lavado_premium
lavado_esencial → lavado_basico
```

Agregar regla para que si el usuario pide valor y ya hay datos completos, vaya a `send_quote`.

Agregar regla para que si el usuario dice “sí” después de una cotización, vaya a `offer_available_slots`.

---

## 4 context_builder

Enviar catálogo oficial al LLM:

```json
[
  {
    "code": "lavado_basico",
    "name": "Lavado básico"
  },
  {
    "code": "lavado_premium",
    "name": "Lavado premium"
  },
  {
    "code": "encerado_full",
    "name": "Encerado full"
  }
]
```

---

## 5 llm_decision

Agregar regla dura:

```text
Usa únicamente estos service_interest:
- lavado_basico
- lavado_premium
- encerado_full

No uses nunca:
- lavado_profundo
- lavado_esencial

Si el usuario dice "lavado profundo", interprétalo como lavado_premium.
Si el usuario dice "lavado esencial", interprétalo como lavado_basico.
```

---

## 6.0 resolve_pricing_from_db

Agregar mapeo defensivo en `normalize_pricing_keys`.

Este módulo debe ser el último filtro para evitar que códigos antiguos rompan la cotización.

---

## 6.17 send_service_menu

Reemplazar menú actual por catálogo oficial.

No ofrecer `lavado_profundo` como servicio separado.

---

## 6.18 recommend_service

Si recomienda limpieza más completa o punto medio, debe usar:

```text
lavado_premium
```

No:

```text
lavado_profundo
```

---

## 6.5 confirm_booking_executor

En mensaje final, usar label humano:

```text
Servicio: lavado premium
```

No:

```text
Servicio: lavado_profundo
```

---

# 13. Veredicto final

El bot ya tiene la estructura base funcionando, pero todavía hay inconsistencias que afectan el cierre comercial:

```text
1. Ofrece servicios que no existen en pricing.
2. Usa códigos internos no oficiales.
3. Repite recomendaciones cuando debería cotizar.
4. Dice que ya entregó valores cuando no lo hizo.
5. Falla varias veces antes de cotizar.
6. No avanza directo a agendar después del “sí”.
7. Muestra horarios sin numeración.
8. Muestra códigos técnicos al cliente.
9. La dirección queda como paso ambiguo antes de confirmar.
```

La raíz principal es:

```text
No existe un catálogo oficial único compartido por todos los módulos.
```

La solución es alinear todos los workflows con esta estructura:

```text
Cliente dice: lavado profundo
Sistema guarda: lavado_premium
Pricing busca: lavado_premium
Cliente ve: lavado premium
```

Con eso el bot se vuelve más consistente, más confiable y más comercial.
