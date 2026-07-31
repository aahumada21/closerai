INSERT INTO public.qa_test_scenarios_temp
  (scenario_key, name, suite, enabled, priority, tags, steps, expected_outcome)
VALUES
  ('569900500', 'BASE QA500: cotizar lavado basico con datos completos en un mensaje', 'temp', true, 10, ARRAY['base','quote','happy_path']::text[], '[{"text":"hola, cuanto sale el lavado basico para un sedan en providencia","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}}]'::jsonb, 'El bot debe entregar el precio del lavado basico para sedan en Providencia en la primera respuesta, sin pedir datos que ya se dieron, y sin inventar el valor.')
ON CONFLICT (scenario_key) DO UPDATE SET
  name = EXCLUDED.name,
  suite = EXCLUDED.suite,
  priority = EXCLUDED.priority,
  tags = EXCLUDED.tags,
  steps = EXCLUDED.steps,
  expected_outcome = EXCLUDED.expected_outcome,
  updated_at = now();

INSERT INTO public.qa_test_scenarios_temp
  (scenario_key, name, suite, enabled, priority, tags, steps, expected_outcome)
VALUES
  ('569900501', 'BASE QA501: cotizar pidiendo vehiculo y comuna por separado', 'temp', true, 10, ARRAY['base','quote','happy_path']::text[], '[{"text":"cuanto cuesta el lavado premium?","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}},{"text":"tengo un suv y estoy en huechuraba","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}}]'::jsonb, 'El bot debe pedir el vehiculo y la comuna que faltan en el primer turno, y en el segundo turno entregar el precio correcto del lavado premium para SUV en Huechuraba.')
ON CONFLICT (scenario_key) DO UPDATE SET
  name = EXCLUDED.name,
  suite = EXCLUDED.suite,
  priority = EXCLUDED.priority,
  tags = EXCLUDED.tags,
  steps = EXCLUDED.steps,
  expected_outcome = EXCLUDED.expected_outcome,
  updated_at = now();

INSERT INTO public.qa_test_scenarios_temp
  (scenario_key, name, suite, enabled, priority, tags, steps, expected_outcome)
VALUES
  ('569900502', 'BASE QA502: pedir lista general de precios', 'temp', true, 10, ARRAY['base','quote','happy_path']::text[], '[{"text":"que precios tienen?","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}},{"text":"tengo un sedan en las condes","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}}]'::jsonb, 'El bot debe mostrar los 3 servicios disponibles (lavado basico, lavado premium, encerado full) con sus precios para sedan en Las Condes, sin quedarse pidiendo un servicio especifico cuando el usuario pidio la lista general.')
ON CONFLICT (scenario_key) DO UPDATE SET
  name = EXCLUDED.name,
  suite = EXCLUDED.suite,
  priority = EXCLUDED.priority,
  tags = EXCLUDED.tags,
  steps = EXCLUDED.steps,
  expected_outcome = EXCLUDED.expected_outcome,
  updated_at = now();

INSERT INTO public.qa_test_scenarios_temp
  (scenario_key, name, suite, enabled, priority, tags, steps, expected_outcome)
VALUES
  ('569900503', 'BASE QA503: pedir recomendacion de servicio sin saber cual elegir', 'temp', true, 10, ARRAY['base','recommendation','happy_path']::text[], '[{"text":"no se cual servicio elegir, mi auto esta bien sucio por dentro y por fuera","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}}]'::jsonb, 'El bot debe recomendar un servicio coherente con la descripcion (algo mas completo, como lavado premium o encerado full), explicando brevemente por que, sin inventar caracteristicas que no existan en el catalogo real.')
ON CONFLICT (scenario_key) DO UPDATE SET
  name = EXCLUDED.name,
  suite = EXCLUDED.suite,
  priority = EXCLUDED.priority,
  tags = EXCLUDED.tags,
  steps = EXCLUDED.steps,
  expected_outcome = EXCLUDED.expected_outcome,
  updated_at = now();

INSERT INTO public.qa_test_scenarios_temp
  (scenario_key, name, suite, enabled, priority, tags, steps, expected_outcome)
VALUES
  ('569900504', 'BASE QA504: preguntar cobertura de una comuna soportada', 'temp', true, 10, ARRAY['base','coverage','happy_path']::text[], '[{"text":"trabajan en providencia?","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}}]'::jsonb, 'El bot debe confirmar que si cubren Providencia (es una comuna real de cobertura) y puede invitar a seguir cotizando, sin decir que no cubren esa zona.')
ON CONFLICT (scenario_key) DO UPDATE SET
  name = EXCLUDED.name,
  suite = EXCLUDED.suite,
  priority = EXCLUDED.priority,
  tags = EXCLUDED.tags,
  steps = EXCLUDED.steps,
  expected_outcome = EXCLUDED.expected_outcome,
  updated_at = now();

INSERT INTO public.qa_test_scenarios_temp
  (scenario_key, name, suite, enabled, priority, tags, steps, expected_outcome)
VALUES
  ('569900505', 'BASE QA505: preguntar cobertura de una comuna NO soportada', 'temp', true, 10, ARRAY['base','coverage','happy_path']::text[], '[{"text":"hacen servicios en antofagasta?","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}}]'::jsonb, 'El bot debe indicar que esa comuna no esta dentro de su zona de cobertura actual (es de otra region, fuera de la Region Metropolitana), sin ofrecer agendar ahi ni inventar que si cubren esa zona.')
ON CONFLICT (scenario_key) DO UPDATE SET
  name = EXCLUDED.name,
  suite = EXCLUDED.suite,
  priority = EXCLUDED.priority,
  tags = EXCLUDED.tags,
  steps = EXCLUDED.steps,
  expected_outcome = EXCLUDED.expected_outcome,
  updated_at = now();

INSERT INTO public.qa_test_scenarios_temp
  (scenario_key, name, suite, enabled, priority, tags, steps, expected_outcome)
VALUES
  ('569900506', 'BASE QA506: pedir horarios disponibles tras cotizar', 'temp', true, 10, ARRAY['base','availability','happy_path']::text[], '[{"text":"cuanto sale el lavado basico para un sedan en providencia","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}},{"text":"si, mandame los horarios","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}}]'::jsonb, 'Despues de cotizar, cuando el usuario pide horarios, el bot debe ofrecer una lista concreta de horarios disponibles (no debe repetir la cotizacion ni pedir datos que ya tiene).')
ON CONFLICT (scenario_key) DO UPDATE SET
  name = EXCLUDED.name,
  suite = EXCLUDED.suite,
  priority = EXCLUDED.priority,
  tags = EXCLUDED.tags,
  steps = EXCLUDED.steps,
  expected_outcome = EXCLUDED.expected_outcome,
  updated_at = now();

INSERT INTO public.qa_test_scenarios_temp
  (scenario_key, name, suite, enabled, priority, tags, steps, expected_outcome)
VALUES
  ('569900507', 'BASE QA507: seleccionar horario por numero', 'temp', true, 10, ARRAY['base','booking_selection','happy_path']::text[], '[{"text":"cuanto sale el lavado basico para un sedan en providencia","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}},{"text":"si, mandame los horarios","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}},{"text":"la 1","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}}]'::jsonb, 'Cuando el usuario responde con el numero de una opcion ofrecida (ej. ''la 1''), el bot debe reconocer exactamente ese horario y avanzar a confirmar/pedir direccion, no debe pedir que aclare ni ofrecer otros horarios distintos.')
ON CONFLICT (scenario_key) DO UPDATE SET
  name = EXCLUDED.name,
  suite = EXCLUDED.suite,
  priority = EXCLUDED.priority,
  tags = EXCLUDED.tags,
  steps = EXCLUDED.steps,
  expected_outcome = EXCLUDED.expected_outcome,
  updated_at = now();

INSERT INTO public.qa_test_scenarios_temp
  (scenario_key, name, suite, enabled, priority, tags, steps, expected_outcome)
VALUES
  ('569900508', 'BASE QA508: seleccionar horario por fecha y hora explicita', 'temp', true, 10, ARRAY['base','booking_selection','happy_path']::text[], '[{"text":"cuanto sale el lavado basico para un sedan en providencia","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}},{"text":"si, mandame los horarios","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}},{"text":"el domingo a las 9 de la manana","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}}]'::jsonb, 'Si la fecha/hora mencionada coincide con un horario ofrecido, el bot debe tomarlo como la seleccion del usuario y avanzar; si hay ambiguedad (mas de una opcion ese dia), debe preguntar cual especificamente, sin inventar un horario que no fue ofrecido.')
ON CONFLICT (scenario_key) DO UPDATE SET
  name = EXCLUDED.name,
  suite = EXCLUDED.suite,
  priority = EXCLUDED.priority,
  tags = EXCLUDED.tags,
  steps = EXCLUDED.steps,
  expected_outcome = EXCLUDED.expected_outcome,
  updated_at = now();

INSERT INTO public.qa_test_scenarios_temp
  (scenario_key, name, suite, enabled, priority, tags, steps, expected_outcome)
VALUES
  ('569900509', 'BASE QA509: dar direccion y confirmar reserva completa', 'temp', true, 10, ARRAY['base','address','confirm_booking','happy_path']::text[], '[{"text":"cuanto sale el lavado basico para un sedan en providencia","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}},{"text":"si, mandame los horarios","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}},{"text":"la 1","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}},{"text":"Av Providencia 1234, depto 56","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}},{"text":"si, confirma","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}}]'::jsonb, 'El flujo completo debe terminar con una reserva confirmada: el bot pide la direccion, la registra correctamente, pide confirmacion final, y al confirmar entrega un mensaje claro de reserva agendada con fecha, hora, servicio, comuna y direccion correctos. No debe perderse ningun dato a lo largo de la conversacion.')
ON CONFLICT (scenario_key) DO UPDATE SET
  name = EXCLUDED.name,
  suite = EXCLUDED.suite,
  priority = EXCLUDED.priority,
  tags = EXCLUDED.tags,
  steps = EXCLUDED.steps,
  expected_outcome = EXCLUDED.expected_outcome,
  updated_at = now();

INSERT INTO public.qa_test_scenarios_temp
  (scenario_key, name, suite, enabled, priority, tags, steps, expected_outcome)
VALUES
  ('569900510', 'BASE QA510: flujo completo end-to-end con mensajes naturales', 'temp', true, 10, ARRAY['base','end_to_end','happy_path']::text[], '[{"text":"hola que tal","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}},{"text":"quiero saber precios de lavado","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}},{"text":"es un encerado full, tengo una camioneta y vivo en vitacura","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}},{"text":"dale, mandame horarios","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}},{"text":"la segunda opcion","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}},{"text":"camino el alba 500","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}},{"text":"confirmo","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}}]'::jsonb, 'Una conversacion natural de principio a fin (saludo, cotizacion, agendamiento, direccion, confirmacion) debe terminar exitosamente con una reserva confirmada para encerado full, camioneta, Vitacura, sin que el bot se pierda, repita preguntas ya respondidas, o invente datos.')
ON CONFLICT (scenario_key) DO UPDATE SET
  name = EXCLUDED.name,
  suite = EXCLUDED.suite,
  priority = EXCLUDED.priority,
  tags = EXCLUDED.tags,
  steps = EXCLUDED.steps,
  expected_outcome = EXCLUDED.expected_outcome,
  updated_at = now();

INSERT INTO public.qa_test_scenarios_temp
  (scenario_key, name, suite, enabled, priority, tags, steps, expected_outcome)
VALUES
  ('569900511', 'BASE QA511: cancelar una reserva activa', 'temp', true, 10, ARRAY['base','cancel','happy_path']::text[], '[{"text":"quiero cancelar mi hora","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}}]'::jsonb, 'Si el lead tiene una reserva activa, el bot debe cancelarla y confirmarlo claramente. Si no tiene ninguna reserva activa, debe decirlo con claridad y ofrecer agendar una nueva, sin generar errores ni mensajes confusos.')
ON CONFLICT (scenario_key) DO UPDATE SET
  name = EXCLUDED.name,
  suite = EXCLUDED.suite,
  priority = EXCLUDED.priority,
  tags = EXCLUDED.tags,
  steps = EXCLUDED.steps,
  expected_outcome = EXCLUDED.expected_outcome,
  updated_at = now();

INSERT INTO public.qa_test_scenarios_temp
  (scenario_key, name, suite, enabled, priority, tags, steps, expected_outcome)
VALUES
  ('569900512', 'BASE QA512: reagendar una reserva activa', 'temp', true, 10, ARRAY['base','reschedule','happy_path']::text[], '[{"text":"necesito cambiar la hora de mi reserva","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}}]'::jsonb, 'Si el lead tiene una reserva activa, el bot debe iniciar el flujo de reagendamiento (ofrecer nuevos horarios). Si no tiene reserva activa, debe decirlo claramente y ofrecer agendar una nueva.')
ON CONFLICT (scenario_key) DO UPDATE SET
  name = EXCLUDED.name,
  suite = EXCLUDED.suite,
  priority = EXCLUDED.priority,
  tags = EXCLUDED.tags,
  steps = EXCLUDED.steps,
  expected_outcome = EXCLUDED.expected_outcome,
  updated_at = now();

INSERT INTO public.qa_test_scenarios_temp
  (scenario_key, name, suite, enabled, priority, tags, steps, expected_outcome)
VALUES
  ('569900513', 'BASE QA513: pedir hablar con un humano explicitamente', 'temp', true, 10, ARRAY['base','handoff','happy_path']::text[], '[{"text":"quiero hablar con una persona de verdad","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}}]'::jsonb, 'El bot debe reconocer el pedido de hablar con un humano y derivar (handoff), sin insistir en seguir el flujo automatico de cotizacion/agendamiento.')
ON CONFLICT (scenario_key) DO UPDATE SET
  name = EXCLUDED.name,
  suite = EXCLUDED.suite,
  priority = EXCLUDED.priority,
  tags = EXCLUDED.tags,
  steps = EXCLUDED.steps,
  expected_outcome = EXCLUDED.expected_outcome,
  updated_at = now();

INSERT INTO public.qa_test_scenarios_temp
  (scenario_key, name, suite, enabled, priority, tags, steps, expected_outcome)
VALUES
  ('569900514', 'BASE QA514: pregunta general (FAQ) sobre el servicio', 'temp', true, 10, ARRAY['base','faq','happy_path']::text[], '[{"text":"que incluye el lavado premium?","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}}]'::jsonb, 'El bot debe responder con el detalle real del servicio (lo que incluye, segun la configuracion del negocio), sin inventar caracteristicas que no esten definidas, y sin desviarse a pedir datos de agendamiento si no corresponde aun.')
ON CONFLICT (scenario_key) DO UPDATE SET
  name = EXCLUDED.name,
  suite = EXCLUDED.suite,
  priority = EXCLUDED.priority,
  tags = EXCLUDED.tags,
  steps = EXCLUDED.steps,
  expected_outcome = EXCLUDED.expected_outcome,
  updated_at = now();

INSERT INTO public.qa_test_scenarios_temp
  (scenario_key, name, suite, enabled, priority, tags, steps, expected_outcome)
VALUES
  ('569900515', 'BASE QA515: objecion de precio', 'temp', true, 10, ARRAY['base','objection','happy_path']::text[], '[{"text":"cuanto sale el encerado full para una camioneta en vitacura","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}},{"text":"esta muy caro","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}}]'::jsonb, 'El bot debe responder a la objecion de precio de forma razonable (explicando valor, ofreciendo una alternativa mas economica si corresponde, o manteniendo el precio con seguridad), sin inventar descuentos que no existen y sin perder el contexto de servicio/vehiculo/comuna ya dado.')
ON CONFLICT (scenario_key) DO UPDATE SET
  name = EXCLUDED.name,
  suite = EXCLUDED.suite,
  priority = EXCLUDED.priority,
  tags = EXCLUDED.tags,
  steps = EXCLUDED.steps,
  expected_outcome = EXCLUDED.expected_outcome,
  updated_at = now();

INSERT INTO public.qa_test_scenarios_temp
  (scenario_key, name, suite, enabled, priority, tags, steps, expected_outcome)
VALUES
  ('569900516', 'BASE QA516: mensaje con errores de tipeo pero reconocible', 'temp', true, 10, ARRAY['base','typo_tolerance','happy_path']::text[], '[{"text":"cuanto saleel lavdo basico pra un sedn en provicencia","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}}]'::jsonb, 'El bot debe entender el mensaje pese a los errores de tipeo (lavado basico, sedan, providencia) y responder con el precio correcto, sin pedir que repita el mensaje por no entenderlo.')
ON CONFLICT (scenario_key) DO UPDATE SET
  name = EXCLUDED.name,
  suite = EXCLUDED.suite,
  priority = EXCLUDED.priority,
  tags = EXCLUDED.tags,
  steps = EXCLUDED.steps,
  expected_outcome = EXCLUDED.expected_outcome,
  updated_at = now();

INSERT INTO public.qa_test_scenarios_temp
  (scenario_key, name, suite, enabled, priority, tags, steps, expected_outcome)
VALUES
  ('569900517', 'BASE QA517: confirmar con si/ok tras pedir direccion', 'temp', true, 10, ARRAY['base','address','happy_path']::text[], '[{"text":"cuanto sale el lavado basico para un sedan en providencia","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}},{"text":"si, mandame los horarios","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}},{"text":"la 1","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}},{"text":"ok","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}}]'::jsonb, 'Cuando el bot pide la direccion exacta y el usuario responde solo ''ok'' (no una direccion real), el bot debe volver a pedir la direccion especifica en vez de aceptar ''ok'' como direccion valida.')
ON CONFLICT (scenario_key) DO UPDATE SET
  name = EXCLUDED.name,
  suite = EXCLUDED.suite,
  priority = EXCLUDED.priority,
  tags = EXCLUDED.tags,
  steps = EXCLUDED.steps,
  expected_outcome = EXCLUDED.expected_outcome,
  updated_at = now();

INSERT INTO public.qa_test_scenarios_temp
  (scenario_key, name, suite, enabled, priority, tags, steps, expected_outcome)
VALUES
  ('569900518', 'BASE QA518: pedir un servicio que no existe en el catalogo', 'temp', true, 10, ARRAY['base','out_of_catalog','happy_path']::text[], '[{"text":"hacen pulido de motor?","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}}]'::jsonb, 'El bot debe indicar con claridad que ese servicio no esta dentro de su catalogo actual (lavado basico, lavado premium, encerado full) y ofrecer informacion sobre los servicios reales que si tienen, sin inventar que si lo ofrecen.')
ON CONFLICT (scenario_key) DO UPDATE SET
  name = EXCLUDED.name,
  suite = EXCLUDED.suite,
  priority = EXCLUDED.priority,
  tags = EXCLUDED.tags,
  steps = EXCLUDED.steps,
  expected_outcome = EXCLUDED.expected_outcome,
  updated_at = now();

INSERT INTO public.qa_test_scenarios_temp
  (scenario_key, name, suite, enabled, priority, tags, steps, expected_outcome)
VALUES
  ('569900519', 'BASE QA519: retomar conversacion despues de cotizar (volver mas tarde)', 'temp', true, 10, ARRAY['base','context_memory','happy_path']::text[], '[{"text":"cuanto sale el lavado premium para un suv en huechuraba","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}},{"text":"ya volvi, quiero agendar","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}}]'::jsonb, 'El bot debe recordar el servicio/vehiculo/comuna ya cotizados y avanzar directo a ofrecer horarios, sin volver a pedir esos datos desde cero.')
ON CONFLICT (scenario_key) DO UPDATE SET
  name = EXCLUDED.name,
  suite = EXCLUDED.suite,
  priority = EXCLUDED.priority,
  tags = EXCLUDED.tags,
  steps = EXCLUDED.steps,
  expected_outcome = EXCLUDED.expected_outcome,
  updated_at = now();

INSERT INTO public.qa_test_scenarios_temp
  (scenario_key, name, suite, enabled, priority, tags, steps, expected_outcome)
VALUES
  ('569900520', 'EXT QA520: decir ''no quiero'' durante recoleccion de direccion', 'temp', true, 30, ARRAY['ext','regression','address_loop']::text[], '[{"text":"cuanto sale el lavado basico para un sedan en providencia","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}},{"text":"si, mandame los horarios","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}},{"text":"la 1","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}},{"text":"no quiero","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}}]'::jsonb, 'Cuando el usuario dice que no quiere seguir mientras el bot le pide la direccion, el bot debe reconocerlo y ofrecer derivar a una persona o detener el flujo amablemente, sin repetir la misma pregunta de direccion.')
ON CONFLICT (scenario_key) DO UPDATE SET
  name = EXCLUDED.name,
  suite = EXCLUDED.suite,
  priority = EXCLUDED.priority,
  tags = EXCLUDED.tags,
  steps = EXCLUDED.steps,
  expected_outcome = EXCLUDED.expected_outcome,
  updated_at = now();

INSERT INTO public.qa_test_scenarios_temp
  (scenario_key, name, suite, enabled, priority, tags, steps, expected_outcome)
VALUES
  ('569900521', 'EXT QA521: decir ''bye''/''adios'' durante recoleccion de direccion', 'temp', true, 30, ARRAY['ext','regression','address_loop']::text[], '[{"text":"cuanto sale el lavado premium para un suv en huechuraba","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}},{"text":"si, mandame los horarios","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}},{"text":"la 1","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}},{"text":"bye","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}}]'::jsonb, 'Cuando el usuario se despide mientras el bot pide la direccion, el bot no debe insistir con la misma pregunta; debe cerrar la conversacion de forma amable o derivar a un humano.')
ON CONFLICT (scenario_key) DO UPDATE SET
  name = EXCLUDED.name,
  suite = EXCLUDED.suite,
  priority = EXCLUDED.priority,
  tags = EXCLUDED.tags,
  steps = EXCLUDED.steps,
  expected_outcome = EXCLUDED.expected_outcome,
  updated_at = now();

INSERT INTO public.qa_test_scenarios_temp
  (scenario_key, name, suite, enabled, priority, tags, steps, expected_outcome)
VALUES
  ('569900522', 'EXT QA522: pedir hablar con ''tu jefe'' durante recoleccion de direccion', 'temp', true, 30, ARRAY['ext','regression','handoff','address_loop']::text[], '[{"text":"cuanto sale el encerado full para una camioneta en las condes","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}},{"text":"si, mandame los horarios","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}},{"text":"la 1","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}},{"text":"quiero hablar con tu jefe","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}}]'::jsonb, 'Aunque el bot este a mitad del flujo de recoleccion de direccion, un pedido explicito de hablar con el jefe/encargado/supervisor debe derivar a un humano de inmediato, no debe repetir la pregunta de direccion.')
ON CONFLICT (scenario_key) DO UPDATE SET
  name = EXCLUDED.name,
  suite = EXCLUDED.suite,
  priority = EXCLUDED.priority,
  tags = EXCLUDED.tags,
  steps = EXCLUDED.steps,
  expected_outcome = EXCLUDED.expected_outcome,
  updated_at = now();

INSERT INTO public.qa_test_scenarios_temp
  (scenario_key, name, suite, enabled, priority, tags, steps, expected_outcome)
VALUES
  ('569900523', 'EXT QA523: respuestas no-direccion repetidas (circuito de seguridad)', 'temp', true, 30, ARRAY['ext','regression','address_loop','circuit_breaker']::text[], '[{"text":"cuanto sale el lavado basico para un sedan en providencia","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}},{"text":"si, mandame los horarios","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}},{"text":"la 1","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}},{"text":"antofagasta","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}},{"text":"no se","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}},{"text":"mmm","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}}]'::jsonb, 'Despues de varias respuestas que claramente no son una direccion (3 o mas intentos), el bot debe dejar de repetir la misma pregunta exactamente igual y ofrecer derivar a un humano en vez de entrar en un loop sin salida.')
ON CONFLICT (scenario_key) DO UPDATE SET
  name = EXCLUDED.name,
  suite = EXCLUDED.suite,
  priority = EXCLUDED.priority,
  tags = EXCLUDED.tags,
  steps = EXCLUDED.steps,
  expected_outcome = EXCLUDED.expected_outcome,
  updated_at = now();

INSERT INTO public.qa_test_scenarios_temp
  (scenario_key, name, suite, enabled, priority, tags, steps, expected_outcome)
VALUES
  ('569900524', 'EXT QA524: dar una direccion valida despues de un intento fallido', 'temp', true, 40, ARRAY['ext','address']::text[], '[{"text":"cuanto sale el lavado basico para un sedan en providencia","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}},{"text":"si, mandame los horarios","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}},{"text":"la 1","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}},{"text":"no se la direccion exacta","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}},{"text":"Av Providencia 2222","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}}]'::jsonb, 'Tras un primer intento fallido, si el usuario despues SI da una direccion valida, el bot debe reconocerla correctamente y avanzar a confirmar la reserva, no debe seguir penalizando ni desconfiando de la direccion buena.')
ON CONFLICT (scenario_key) DO UPDATE SET
  name = EXCLUDED.name,
  suite = EXCLUDED.suite,
  priority = EXCLUDED.priority,
  tags = EXCLUDED.tags,
  steps = EXCLUDED.steps,
  expected_outcome = EXCLUDED.expected_outcome,
  updated_at = now();

INSERT INTO public.qa_test_scenarios_temp
  (scenario_key, name, suite, enabled, priority, tags, steps, expected_outcome)
VALUES
  ('569900525', 'EXT QA525: cambiar de servicio antes de confirmar', 'temp', true, 40, ARRAY['ext','service_change']::text[], '[{"text":"cuanto sale el lavado basico para un sedan en providencia","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}},{"text":"mejor quiero el lavado premium","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}}]'::jsonb, 'Cuando el usuario cambia de servicio antes de confirmar nada, el bot debe re-cotizar con el nuevo servicio (lavado premium) manteniendo el vehiculo y comuna ya dados, sin mezclar precios de ambos servicios.')
ON CONFLICT (scenario_key) DO UPDATE SET
  name = EXCLUDED.name,
  suite = EXCLUDED.suite,
  priority = EXCLUDED.priority,
  tags = EXCLUDED.tags,
  steps = EXCLUDED.steps,
  expected_outcome = EXCLUDED.expected_outcome,
  updated_at = now();

INSERT INTO public.qa_test_scenarios_temp
  (scenario_key, name, suite, enabled, priority, tags, steps, expected_outcome)
VALUES
  ('569900526', 'EXT QA526: cambiar de comuna a mitad de conversacion', 'temp', true, 40, ARRAY['ext','context_change']::text[], '[{"text":"cuanto sale el lavado basico para un sedan en providencia","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}},{"text":"en realidad es en huechuraba","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}}]'::jsonb, 'El bot debe actualizar la comuna a Huechuraba y volver a cotizar correctamente con la comuna nueva, sin quedarse con el precio de Providencia.')
ON CONFLICT (scenario_key) DO UPDATE SET
  name = EXCLUDED.name,
  suite = EXCLUDED.suite,
  priority = EXCLUDED.priority,
  tags = EXCLUDED.tags,
  steps = EXCLUDED.steps,
  expected_outcome = EXCLUDED.expected_outcome,
  updated_at = now();

INSERT INTO public.qa_test_scenarios_temp
  (scenario_key, name, suite, enabled, priority, tags, steps, expected_outcome)
VALUES
  ('569900527', 'EXT QA527: cambiar de tipo de vehiculo a mitad de conversacion', 'temp', true, 40, ARRAY['ext','context_change']::text[], '[{"text":"cuanto sale el lavado premium para un sedan en vitacura","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}},{"text":"perdon, es para una camioneta","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}}]'::jsonb, 'El bot debe actualizar el tipo de vehiculo a camioneta y volver a cotizar con el precio correcto para camioneta, sin quedarse con el precio de sedan.')
ON CONFLICT (scenario_key) DO UPDATE SET
  name = EXCLUDED.name,
  suite = EXCLUDED.suite,
  priority = EXCLUDED.priority,
  tags = EXCLUDED.tags,
  steps = EXCLUDED.steps,
  expected_outcome = EXCLUDED.expected_outcome,
  updated_at = now();

INSERT INTO public.qa_test_scenarios_temp
  (scenario_key, name, suite, enabled, priority, tags, steps, expected_outcome)
VALUES
  ('569900528', 'EXT QA528: pedir cotizacion de 2 servicios distintos en la misma conversacion', 'temp', true, 40, ARRAY['ext','multi_service']::text[], '[{"text":"cuanto sale el lavado basico para un sedan en providencia","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}},{"text":"y el encerado full cuanto seria?","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}}]'::jsonb, 'El bot debe cotizar el segundo servicio (encerado full) manteniendo el mismo vehiculo y comuna ya dados, entregando el precio correcto sin tener que volver a preguntar vehiculo/comuna.')
ON CONFLICT (scenario_key) DO UPDATE SET
  name = EXCLUDED.name,
  suite = EXCLUDED.suite,
  priority = EXCLUDED.priority,
  tags = EXCLUDED.tags,
  steps = EXCLUDED.steps,
  expected_outcome = EXCLUDED.expected_outcome,
  updated_at = now();

INSERT INTO public.qa_test_scenarios_temp
  (scenario_key, name, suite, enabled, priority, tags, steps, expected_outcome)
VALUES
  ('569900529', 'EXT QA529: cambiar de opinion sobre el horario antes de confirmar', 'temp', true, 40, ARRAY['ext','booking_selection']::text[], '[{"text":"cuanto sale el lavado basico para un sedan en providencia","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}},{"text":"si, mandame los horarios","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}},{"text":"la 1","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}},{"text":"mejor la 2","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}}]'::jsonb, 'Si el usuario cambia de horario antes de confirmar la reserva, el bot debe tomar el nuevo horario seleccionado y avanzar con ese, no debe quedarse con el primero ni confundir ambos.')
ON CONFLICT (scenario_key) DO UPDATE SET
  name = EXCLUDED.name,
  suite = EXCLUDED.suite,
  priority = EXCLUDED.priority,
  tags = EXCLUDED.tags,
  steps = EXCLUDED.steps,
  expected_outcome = EXCLUDED.expected_outcome,
  updated_at = now();

INSERT INTO public.qa_test_scenarios_temp
  (scenario_key, name, suite, enabled, priority, tags, steps, expected_outcome)
VALUES
  ('569900530', 'EXT QA530: mandar el mismo mensaje dos veces (idempotencia)', 'temp', true, 40, ARRAY['ext','idempotency']::text[], '[{"text":"cuanto sale el lavado basico para un sedan en providencia","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}},{"text":"cuanto sale el lavado basico para un sedan en providencia","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}}]'::jsonb, 'El sistema no debe duplicar ni confundirse al recibir un mensaje repetido; debe responder de forma coherente a ambos turnos sin generar dos reservas o dos cotizaciones contradictorias.')
ON CONFLICT (scenario_key) DO UPDATE SET
  name = EXCLUDED.name,
  suite = EXCLUDED.suite,
  priority = EXCLUDED.priority,
  tags = EXCLUDED.tags,
  steps = EXCLUDED.steps,
  expected_outcome = EXCLUDED.expected_outcome,
  updated_at = now();

INSERT INTO public.qa_test_scenarios_temp
  (scenario_key, name, suite, enabled, priority, tags, steps, expected_outcome)
VALUES
  ('569900531', 'EXT QA531: responder con un solo emoji', 'temp', true, 50, ARRAY['ext','edge_case']::text[], '[{"text":"cuanto sale el lavado basico para un sedan en providencia","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}},{"text":"👍","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}}]'::jsonb, 'El bot debe interpretar el emoji como una confirmacion/aceptacion razonable en contexto (por ejemplo, avanzar a ofrecer horarios) o pedir aclaracion de forma amable, sin generar un error o respuesta vacia.')
ON CONFLICT (scenario_key) DO UPDATE SET
  name = EXCLUDED.name,
  suite = EXCLUDED.suite,
  priority = EXCLUDED.priority,
  tags = EXCLUDED.tags,
  steps = EXCLUDED.steps,
  expected_outcome = EXCLUDED.expected_outcome,
  updated_at = now();

INSERT INTO public.qa_test_scenarios_temp
  (scenario_key, name, suite, enabled, priority, tags, steps, expected_outcome)
VALUES
  ('569900532', 'EXT QA532: mandar un mensaje vacio o solo espacios', 'temp', true, 50, ARRAY['ext','edge_case']::text[], '[{"text":"   ","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}}]'::jsonb, 'El sistema debe manejar un mensaje vacio o solo espacios sin generar un error visible para el usuario; puede no responder nada o pedir que repita el mensaje, pero no debe romperse.')
ON CONFLICT (scenario_key) DO UPDATE SET
  name = EXCLUDED.name,
  suite = EXCLUDED.suite,
  priority = EXCLUDED.priority,
  tags = EXCLUDED.tags,
  steps = EXCLUDED.steps,
  expected_outcome = EXCLUDED.expected_outcome,
  updated_at = now();

INSERT INTO public.qa_test_scenarios_temp
  (scenario_key, name, suite, enabled, priority, tags, steps, expected_outcome)
VALUES
  ('569900533', 'EXT QA533: mensaje muy largo con multiples preguntas', 'temp', true, 50, ARRAY['ext','edge_case']::text[], '[{"text":"hola, queria preguntar varias cosas: cuanto sale el lavado premium, tambien quiero saber si trabajan en huechuraba, y de paso si pueden ir un domingo en la tarde, tengo un suv","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}}]'::jsonb, 'El bot debe identificar y responder al menos la pregunta principal (precio del lavado premium para SUV en Huechuraba) de forma util, sin ignorar el mensaje completo ni responder algo generico que no aproveche los datos ya dados.')
ON CONFLICT (scenario_key) DO UPDATE SET
  name = EXCLUDED.name,
  suite = EXCLUDED.suite,
  priority = EXCLUDED.priority,
  tags = EXCLUDED.tags,
  steps = EXCLUDED.steps,
  expected_outcome = EXCLUDED.expected_outcome,
  updated_at = now();

INSERT INTO public.qa_test_scenarios_temp
  (scenario_key, name, suite, enabled, priority, tags, steps, expected_outcome)
VALUES
  ('569900534', 'EXT QA534: reintentar confirmar una reserva ya confirmada', 'temp', true, 50, ARRAY['ext','idempotency','confirm_booking']::text[], '[{"text":"cuanto sale el lavado basico para un sedan en providencia","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}},{"text":"si, mandame los horarios","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}},{"text":"la 1","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}},{"text":"Av Providencia 1234","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}},{"text":"si, confirma","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}},{"text":"confirma de nuevo","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}}]'::jsonb, 'Si el usuario intenta confirmar otra vez una reserva que ya quedo confirmada, el bot debe indicar que ya esta confirmada (no debe crear una segunda reserva duplicada ni dar un error).')
ON CONFLICT (scenario_key) DO UPDATE SET
  name = EXCLUDED.name,
  suite = EXCLUDED.suite,
  priority = EXCLUDED.priority,
  tags = EXCLUDED.tags,
  steps = EXCLUDED.steps,
  expected_outcome = EXCLUDED.expected_outcome,
  updated_at = now();

INSERT INTO public.qa_test_scenarios_temp
  (scenario_key, name, suite, enabled, priority, tags, steps, expected_outcome)
VALUES
  ('569900535', 'EXT QA535: cancelar sin tener ninguna reserva activa', 'temp', true, 40, ARRAY['ext','cancel','edge_case']::text[], '[{"text":"cancela mi reserva","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}}]'::jsonb, 'Si el lead no tiene ninguna reserva activa, el bot debe decirlo con claridad (''no encontre una reserva activa'') y ofrecer agendar una nueva, sin generar un error tecnico.')
ON CONFLICT (scenario_key) DO UPDATE SET
  name = EXCLUDED.name,
  suite = EXCLUDED.suite,
  priority = EXCLUDED.priority,
  tags = EXCLUDED.tags,
  steps = EXCLUDED.steps,
  expected_outcome = EXCLUDED.expected_outcome,
  updated_at = now();

INSERT INTO public.qa_test_scenarios_temp
  (scenario_key, name, suite, enabled, priority, tags, steps, expected_outcome)
VALUES
  ('569900536', 'EXT QA536: reagendar sin tener ninguna reserva activa', 'temp', true, 40, ARRAY['ext','reschedule','edge_case']::text[], '[{"text":"quiero reagendar mi hora","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}}]'::jsonb, 'Si el lead no tiene ninguna reserva activa, el bot debe decirlo con claridad y ofrecer agendar una nueva, sin generar un error tecnico ni confundir con un reagendamiento real.')
ON CONFLICT (scenario_key) DO UPDATE SET
  name = EXCLUDED.name,
  suite = EXCLUDED.suite,
  priority = EXCLUDED.priority,
  tags = EXCLUDED.tags,
  steps = EXCLUDED.steps,
  expected_outcome = EXCLUDED.expected_outcome,
  updated_at = now();

INSERT INTO public.qa_test_scenarios_temp
  (scenario_key, name, suite, enabled, priority, tags, steps, expected_outcome)
VALUES
  ('569900537', 'EXT QA537: cancelar y luego pedir agendar de nuevo', 'temp', true, 40, ARRAY['ext','cancel','rebook']::text[], '[{"text":"cuanto sale el lavado basico para un sedan en providencia","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}},{"text":"si, mandame los horarios","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}},{"text":"la 1","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}},{"text":"Av Providencia 1234","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}},{"text":"si, confirma","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}},{"text":"en realidad cancela esa hora","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}},{"text":"quiero agendar otra hora","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}}]'::jsonb, 'Despues de cancelar una reserva confirmada, si el usuario pide agendar una nueva hora en la misma conversacion, el bot debe poder iniciar un nuevo flujo de agendamiento limpio (sin arrastrar la hora cancelada ni confundirla con la nueva).')
ON CONFLICT (scenario_key) DO UPDATE SET
  name = EXCLUDED.name,
  suite = EXCLUDED.suite,
  priority = EXCLUDED.priority,
  tags = EXCLUDED.tags,
  steps = EXCLUDED.steps,
  expected_outcome = EXCLUDED.expected_outcome,
  updated_at = now();

INSERT INTO public.qa_test_scenarios_temp
  (scenario_key, name, suite, enabled, priority, tags, steps, expected_outcome)
VALUES
  ('569900538', 'EXT QA538: reagendar a un horario que ya esta ocupado', 'temp', true, 50, ARRAY['ext','reschedule','edge_case']::text[], '[{"text":"quiero reagendar mi hora","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}},{"text":"a las 9 de la manana del mismo dia que tenia","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}}]'::jsonb, 'Si el horario pedido para reagendar coincide con uno ya ocupado, el bot debe avisar que ese horario no esta disponible y ofrecer alternativas, sin agendar igual sobre un horario ocupado.')
ON CONFLICT (scenario_key) DO UPDATE SET
  name = EXCLUDED.name,
  suite = EXCLUDED.suite,
  priority = EXCLUDED.priority,
  tags = EXCLUDED.tags,
  steps = EXCLUDED.steps,
  expected_outcome = EXCLUDED.expected_outcome,
  updated_at = now();

INSERT INTO public.qa_test_scenarios_temp
  (scenario_key, name, suite, enabled, priority, tags, steps, expected_outcome)
VALUES
  ('569900539', 'EXT QA539: confirmar cancelacion con un ''si'' despues de pedirla', 'temp', true, 40, ARRAY['ext','cancel']::text[], '[{"text":"cuanto sale el lavado basico para un sedan en providencia","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}},{"text":"si, mandame los horarios","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}},{"text":"la 1","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}},{"text":"Av Providencia 1234","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}},{"text":"si, confirma","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}},{"text":"quiero cancelar","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}},{"text":"si","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}}]'::jsonb, 'Si el bot pide confirmacion antes de cancelar definitivamente, un ''si'' del usuario debe ejecutar la cancelacion real (no debe quedarse pidiendo confirmacion en loop, ni reactivar la reserva por error).')
ON CONFLICT (scenario_key) DO UPDATE SET
  name = EXCLUDED.name,
  suite = EXCLUDED.suite,
  priority = EXCLUDED.priority,
  tags = EXCLUDED.tags,
  steps = EXCLUDED.steps,
  expected_outcome = EXCLUDED.expected_outcome,
  updated_at = now();

INSERT INTO public.qa_test_scenarios_temp
  (scenario_key, name, suite, enabled, priority, tags, steps, expected_outcome)
VALUES
  ('569900540', 'EXT QA540: direccion con numero y referencia completa', 'temp', true, 50, ARRAY['ext','address']::text[], '[{"text":"cuanto sale el lavado basico para un sedan en providencia","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}},{"text":"si, mandame los horarios","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}},{"text":"la 1","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}},{"text":"Av Providencia 1234, depto 56, portera azul, dejar auto en el estacionamiento de visitas","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}}]'::jsonb, 'El bot debe reconocer una direccion completa con numero y referencias adicionales como valida de inmediato, sin pedir que la repita ni descartar la referencia extra.')
ON CONFLICT (scenario_key) DO UPDATE SET
  name = EXCLUDED.name,
  suite = EXCLUDED.suite,
  priority = EXCLUDED.priority,
  tags = EXCLUDED.tags,
  steps = EXCLUDED.steps,
  expected_outcome = EXCLUDED.expected_outcome,
  updated_at = now();

INSERT INTO public.qa_test_scenarios_temp
  (scenario_key, name, suite, enabled, priority, tags, steps, expected_outcome)
VALUES
  ('569900541', 'EXT QA541: direccion ambigua (solo nombre de calle, sin numero)', 'temp', true, 50, ARRAY['ext','address','edge_case']::text[], '[{"text":"cuanto sale el lavado basico para un sedan en providencia","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}},{"text":"si, mandame los horarios","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}},{"text":"la 1","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}},{"text":"Avenida Providencia","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}}]'::jsonb, 'Si la direccion no tiene numero, el bot deberia pedir el numero exacto para completar la direccion en vez de aceptarla como esta o repetir la pregunta generica sin explicar que falta el numero.')
ON CONFLICT (scenario_key) DO UPDATE SET
  name = EXCLUDED.name,
  suite = EXCLUDED.suite,
  priority = EXCLUDED.priority,
  tags = EXCLUDED.tags,
  steps = EXCLUDED.steps,
  expected_outcome = EXCLUDED.expected_outcome,
  updated_at = now();

INSERT INTO public.qa_test_scenarios_temp
  (scenario_key, name, suite, enabled, priority, tags, steps, expected_outcome)
VALUES
  ('569900542', 'EXT QA542: pedir servicio en una comuna real de cobertura menos comun', 'temp', true, 50, ARRAY['ext','coverage']::text[], '[{"text":"cuanto sale el lavado premium para un sedan en puente alto","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}}]'::jsonb, 'El bot debe cotizar correctamente para Puente Alto si es una comuna de cobertura real, aplicando cualquier recargo configurado para esa comuna, sin usar un valor generico ni de otra comuna.')
ON CONFLICT (scenario_key) DO UPDATE SET
  name = EXCLUDED.name,
  suite = EXCLUDED.suite,
  priority = EXCLUDED.priority,
  tags = EXCLUDED.tags,
  steps = EXCLUDED.steps,
  expected_outcome = EXCLUDED.expected_outcome,
  updated_at = now();

INSERT INTO public.qa_test_scenarios_temp
  (scenario_key, name, suite, enabled, priority, tags, steps, expected_outcome)
VALUES
  ('569900543', 'EXT QA543: cambiar la direccion despues de haberla confirmado', 'temp', true, 50, ARRAY['ext','address','context_change']::text[], '[{"text":"cuanto sale el lavado basico para un sedan en providencia","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}},{"text":"si, mandame los horarios","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}},{"text":"la 1","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}},{"text":"Av Providencia 1234","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}},{"text":"en realidad es Av Providencia 1500","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}}]'::jsonb, 'El bot debe actualizar la direccion al nuevo valor antes de confirmar la reserva final, no debe quedarse con la direccion anterior ni confirmar con la direccion equivocada.')
ON CONFLICT (scenario_key) DO UPDATE SET
  name = EXCLUDED.name,
  suite = EXCLUDED.suite,
  priority = EXCLUDED.priority,
  tags = EXCLUDED.tags,
  steps = EXCLUDED.steps,
  expected_outcome = EXCLUDED.expected_outcome,
  updated_at = now();

INSERT INTO public.qa_test_scenarios_temp
  (scenario_key, name, suite, enabled, priority, tags, steps, expected_outcome)
VALUES
  ('569900544', 'EXT QA544: confirmar reserva sin dar direccion cuando se pide explicitamente', 'temp', true, 50, ARRAY['ext','address','edge_case']::text[], '[{"text":"cuanto sale el lavado basico para un sedan en providencia","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}},{"text":"si, mandame los horarios","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}},{"text":"la 1","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}},{"text":"solo confirma, no necesito decir la direccion","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}}]'::jsonb, 'El bot no debe confirmar la reserva sin una direccion real (es un requisito del negocio); debe insistir amablemente en pedir la direccion antes de avanzar.')
ON CONFLICT (scenario_key) DO UPDATE SET
  name = EXCLUDED.name,
  suite = EXCLUDED.suite,
  priority = EXCLUDED.priority,
  tags = EXCLUDED.tags,
  steps = EXCLUDED.steps,
  expected_outcome = EXCLUDED.expected_outcome,
  updated_at = now();

INSERT INTO public.qa_test_scenarios_temp
  (scenario_key, name, suite, enabled, priority, tags, steps, expected_outcome)
VALUES
  ('569900545', 'EXT QA545: cotizar para una moto', 'temp', true, 50, ARRAY['ext','vehicle_type']::text[], '[{"text":"cuanto sale lavar una moto en nunoa","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}}]'::jsonb, 'El bot debe cotizar correctamente para el tipo de vehiculo moto si esta soportado en el catalogo, o indicar claramente si ese tipo de vehiculo no esta cubierto, sin inventar un precio de otro tipo de vehiculo.')
ON CONFLICT (scenario_key) DO UPDATE SET
  name = EXCLUDED.name,
  suite = EXCLUDED.suite,
  priority = EXCLUDED.priority,
  tags = EXCLUDED.tags,
  steps = EXCLUDED.steps,
  expected_outcome = EXCLUDED.expected_outcome,
  updated_at = now();

INSERT INTO public.qa_test_scenarios_temp
  (scenario_key, name, suite, enabled, priority, tags, steps, expected_outcome)
VALUES
  ('569900546', 'EXT QA546: cotizar para un furgon', 'temp', true, 50, ARRAY['ext','vehicle_type']::text[], '[{"text":"tengo un furgon, cuanto sale el lavado premium en macul","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}}]'::jsonb, 'El bot debe cotizar correctamente para furgon si esta soportado, o explicar con claridad si no hay precio definido para ese tipo de vehiculo, sin asumir el precio de un sedan o SUV.')
ON CONFLICT (scenario_key) DO UPDATE SET
  name = EXCLUDED.name,
  suite = EXCLUDED.suite,
  priority = EXCLUDED.priority,
  tags = EXCLUDED.tags,
  steps = EXCLUDED.steps,
  expected_outcome = EXCLUDED.expected_outcome,
  updated_at = now();

INSERT INTO public.qa_test_scenarios_temp
  (scenario_key, name, suite, enabled, priority, tags, steps, expected_outcome)
VALUES
  ('569900547', 'EXT QA547: cotizar para un vehiculo no reconocido (texto ambiguo)', 'temp', true, 50, ARRAY['ext','vehicle_type','edge_case']::text[], '[{"text":"cuanto sale lavar mi auto, es como mediano nomas","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}}]'::jsonb, 'Si el bot no puede determinar el tipo de vehiculo exacto a partir de una descripcion ambigua, debe preguntar especificamente que tipo de vehiculo es (de las opciones reales: sedan, SUV, camioneta, etc.), sin asumir uno al azar.')
ON CONFLICT (scenario_key) DO UPDATE SET
  name = EXCLUDED.name,
  suite = EXCLUDED.suite,
  priority = EXCLUDED.priority,
  tags = EXCLUDED.tags,
  steps = EXCLUDED.steps,
  expected_outcome = EXCLUDED.expected_outcome,
  updated_at = now();

INSERT INTO public.qa_test_scenarios_temp
  (scenario_key, name, suite, enabled, priority, tags, steps, expected_outcome)
VALUES
  ('569900548', 'EXT QA548: mencionar vehiculo y luego corregirlo', 'temp', true, 50, ARRAY['ext','vehicle_type','context_change']::text[], '[{"text":"tengo un sedan, cuanto sale el lavado basico en providencia","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}},{"text":"ah no, perdon, es una camioneta","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}}]'::jsonb, 'El bot debe corregir el tipo de vehiculo a camioneta y entregar el precio correcto actualizado, sin quedarse con el precio de sedan.')
ON CONFLICT (scenario_key) DO UPDATE SET
  name = EXCLUDED.name,
  suite = EXCLUDED.suite,
  priority = EXCLUDED.priority,
  tags = EXCLUDED.tags,
  steps = EXCLUDED.steps,
  expected_outcome = EXCLUDED.expected_outcome,
  updated_at = now();

INSERT INTO public.qa_test_scenarios_temp
  (scenario_key, name, suite, enabled, priority, tags, steps, expected_outcome)
VALUES
  ('569900549', 'EXT QA549: confirmar tipo de vehiculo cuando el bot pregunta para validar', 'temp', true, 50, ARRAY['ext','vehicle_type']::text[], '[{"text":"tengo una rural","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}}]'::jsonb, 'Si ''rural'' es un tipo de vehiculo ambiguo no estandar, el bot deberia confirmar a que categoria real corresponde (ej. si se trata como SUV o como sedan grande) antes de cotizar, en vez de asumirlo silenciosamente.')
ON CONFLICT (scenario_key) DO UPDATE SET
  name = EXCLUDED.name,
  suite = EXCLUDED.suite,
  priority = EXCLUDED.priority,
  tags = EXCLUDED.tags,
  steps = EXCLUDED.steps,
  expected_outcome = EXCLUDED.expected_outcome,
  updated_at = now();

INSERT INTO public.qa_test_scenarios_temp
  (scenario_key, name, suite, enabled, priority, tags, steps, expected_outcome)
VALUES
  ('569900550', 'EXT QA550: conversacion larga sin perder contexto', 'temp', true, 30, ARRAY['ext','context_memory','long_conversation']::text[], '[{"text":"hola","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}},{"text":"quiero cotizar un lavado","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}},{"text":"es premium","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}},{"text":"tengo un suv","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}},{"text":"vivo en huechuraba","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}},{"text":"dale, mandame los horarios","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}},{"text":"la primera que ofreciste","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}}]'::jsonb, 'A lo largo de 7 turnos dando los datos de a poco, el bot no debe perder ningun dato ya entregado (servicio, vehiculo, comuna) ni volver a preguntar algo ya respondido; debe llegar a ofrecer y confirmar el horario seleccionado con todo el contexto correcto.')
ON CONFLICT (scenario_key) DO UPDATE SET
  name = EXCLUDED.name,
  suite = EXCLUDED.suite,
  priority = EXCLUDED.priority,
  tags = EXCLUDED.tags,
  steps = EXCLUDED.steps,
  expected_outcome = EXCLUDED.expected_outcome,
  updated_at = now();

INSERT INTO public.qa_test_scenarios_temp
  (scenario_key, name, suite, enabled, priority, tags, steps, expected_outcome)
VALUES
  ('569900551', 'EXT QA551: pregunta no relacionada a mitad del flujo de agendamiento', 'temp', true, 50, ARRAY['ext','context_switch']::text[], '[{"text":"cuanto sale el lavado basico para un sedan en providencia","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}},{"text":"si, mandame los horarios","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}},{"text":"oye, y atienden los domingos?","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}}]'::jsonb, 'El bot debe responder la pregunta sobre horario de atencion de forma util, y despues poder retomar el flujo de agendamiento sin perder el contexto de lo cotizado previamente (no debe reiniciar desde cero).')
ON CONFLICT (scenario_key) DO UPDATE SET
  name = EXCLUDED.name,
  suite = EXCLUDED.suite,
  priority = EXCLUDED.priority,
  tags = EXCLUDED.tags,
  steps = EXCLUDED.steps,
  expected_outcome = EXCLUDED.expected_outcome,
  updated_at = now();

INSERT INTO public.qa_test_scenarios_temp
  (scenario_key, name, suite, enabled, priority, tags, steps, expected_outcome)
VALUES
  ('569900552', 'EXT QA552: saludo repetido a mitad de conversacion', 'temp', true, 50, ARRAY['ext','context_switch']::text[], '[{"text":"cuanto sale el lavado basico para un sedan en providencia","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}},{"text":"hola","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}}]'::jsonb, 'Un saludo a mitad de la conversacion no debe reiniciar el contexto ya construido (servicio/vehiculo/comuna); el bot puede responder el saludo brevemente pero debe seguir teniendo presente lo ya cotizado.')
ON CONFLICT (scenario_key) DO UPDATE SET
  name = EXCLUDED.name,
  suite = EXCLUDED.suite,
  priority = EXCLUDED.priority,
  tags = EXCLUDED.tags,
  steps = EXCLUDED.steps,
  expected_outcome = EXCLUDED.expected_outcome,
  updated_at = now();

INSERT INTO public.qa_test_scenarios_temp
  (scenario_key, name, suite, enabled, priority, tags, steps, expected_outcome)
VALUES
  ('569900553', 'EXT QA553: agradecimiento despues de confirmar la reserva', 'temp', true, 50, ARRAY['ext','post_booking']::text[], '[{"text":"cuanto sale el lavado basico para un sedan en providencia","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}},{"text":"si, mandame los horarios","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}},{"text":"la 1","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}},{"text":"Av Providencia 1234","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}},{"text":"si, confirma","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}},{"text":"muchas gracias!","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}}]'::jsonb, 'Despues de confirmar la reserva, un agradecimiento del usuario debe recibir una respuesta breve y cordial, sin volver a pedir datos de agendamiento ni repetir la confirmacion completa de nuevo.')
ON CONFLICT (scenario_key) DO UPDATE SET
  name = EXCLUDED.name,
  suite = EXCLUDED.suite,
  priority = EXCLUDED.priority,
  tags = EXCLUDED.tags,
  steps = EXCLUDED.steps,
  expected_outcome = EXCLUDED.expected_outcome,
  updated_at = now();

INSERT INTO public.qa_test_scenarios_temp
  (scenario_key, name, suite, enabled, priority, tags, steps, expected_outcome)
VALUES
  ('569900554', 'EXT QA554: pedir resena o referido despues del servicio', 'temp', true, 50, ARRAY['ext','post_service']::text[], '[{"text":"quedo buenisimo el lavado, muy contento","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}}]'::jsonb, 'Ante un comentario positivo post-servicio, el bot puede aprovechar para pedir una resena o referido de forma natural y breve, sin sonar forzado ni iniciar un flujo de cotizacion nuevo sin sentido.')
ON CONFLICT (scenario_key) DO UPDATE SET
  name = EXCLUDED.name,
  suite = EXCLUDED.suite,
  priority = EXCLUDED.priority,
  tags = EXCLUDED.tags,
  steps = EXCLUDED.steps,
  expected_outcome = EXCLUDED.expected_outcome,
  updated_at = now();

INSERT INTO public.qa_test_scenarios_temp
  (scenario_key, name, suite, enabled, priority, tags, steps, expected_outcome)
VALUES
  ('569900555', 'EXT QA555: consistencia del flujo de cotizacion via webchat', 'temp', true, 40, ARRAY['ext','channel_consistency','webchat']::text[], '[{"text":"cuanto sale el lavado basico para un sedan en providencia","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}}]'::jsonb, 'Corriendo este mismo escenario por el canal webchat, el resultado (precio, tono, formato del mensaje) debe ser equivalente al que se obtiene por WhatsApp para la misma pregunta.')
ON CONFLICT (scenario_key) DO UPDATE SET
  name = EXCLUDED.name,
  suite = EXCLUDED.suite,
  priority = EXCLUDED.priority,
  tags = EXCLUDED.tags,
  steps = EXCLUDED.steps,
  expected_outcome = EXCLUDED.expected_outcome,
  updated_at = now();

INSERT INTO public.qa_test_scenarios_temp
  (scenario_key, name, suite, enabled, priority, tags, steps, expected_outcome)
VALUES
  ('569900556', 'EXT QA556: consistencia del flujo de cotizacion via WhatsApp', 'temp', true, 40, ARRAY['ext','channel_consistency','whatsapp']::text[], '[{"text":"cuanto sale el lavado basico para un sedan en providencia","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}}]'::jsonb, 'Corriendo este mismo escenario por WhatsApp, el resultado (precio, tono, formato del mensaje) debe ser equivalente al que se obtiene por webchat para la misma pregunta.')
ON CONFLICT (scenario_key) DO UPDATE SET
  name = EXCLUDED.name,
  suite = EXCLUDED.suite,
  priority = EXCLUDED.priority,
  tags = EXCLUDED.tags,
  steps = EXCLUDED.steps,
  expected_outcome = EXCLUDED.expected_outcome,
  updated_at = now();

INSERT INTO public.qa_test_scenarios_temp
  (scenario_key, name, suite, enabled, priority, tags, steps, expected_outcome)
VALUES
  ('569900557', 'EXT QA557: mensaje con adjunto no soportado', 'temp', true, 50, ARRAY['ext','edge_case','attachments']::text[], '[{"text":"mira mi auto","attachments":[{"type":"image","url":"https://example.com/fake.jpg"}],"source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}}]'::jsonb, 'Si el usuario manda una imagen u otro adjunto que el bot no puede procesar, debe responder con gracia explicando que no puede ver imagenes y pedir que describa lo que necesita en texto, sin generar un error visible.')
ON CONFLICT (scenario_key) DO UPDATE SET
  name = EXCLUDED.name,
  suite = EXCLUDED.suite,
  priority = EXCLUDED.priority,
  tags = EXCLUDED.tags,
  steps = EXCLUDED.steps,
  expected_outcome = EXCLUDED.expected_outcome,
  updated_at = now();

INSERT INTO public.qa_test_scenarios_temp
  (scenario_key, name, suite, enabled, priority, tags, steps, expected_outcome)
VALUES
  ('569900558', 'EXT QA558: pregunta sobre metodos de pago', 'temp', true, 50, ARRAY['ext','faq']::text[], '[{"text":"puedo pagar con tarjeta?","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}}]'::jsonb, 'El bot debe responder sobre metodos de pago solo si esa informacion existe en su configuracion real; si no la tiene, debe decir que no tiene esa informacion y ofrecer derivar a alguien que pueda confirmarlo, sin inventar metodos de pago.')
ON CONFLICT (scenario_key) DO UPDATE SET
  name = EXCLUDED.name,
  suite = EXCLUDED.suite,
  priority = EXCLUDED.priority,
  tags = EXCLUDED.tags,
  steps = EXCLUDED.steps,
  expected_outcome = EXCLUDED.expected_outcome,
  updated_at = now();

INSERT INTO public.qa_test_scenarios_temp
  (scenario_key, name, suite, enabled, priority, tags, steps, expected_outcome)
VALUES
  ('569900559', 'EXT QA559: pregunta sobre cuanto demora el servicio', 'temp', true, 50, ARRAY['ext','faq']::text[], '[{"text":"cuanto se demoran en hacer el lavado premium?","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}}]'::jsonb, 'El bot debe responder con la duracion configurada real del servicio (duration_minutes del lavado premium) si esta disponible, sin inventar un tiempo distinto al configurado.')
ON CONFLICT (scenario_key) DO UPDATE SET
  name = EXCLUDED.name,
  suite = EXCLUDED.suite,
  priority = EXCLUDED.priority,
  tags = EXCLUDED.tags,
  steps = EXCLUDED.steps,
  expected_outcome = EXCLUDED.expected_outcome,
  updated_at = now();
