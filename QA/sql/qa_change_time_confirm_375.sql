-- QA375: confirmar cambio de hora despues de una reserva confirmada.
-- Objetivo: reservar, pedir cambio de hora, recibir opciones nuevas y confirmar el cambio seleccionando una opcion.

INSERT INTO public.qa_test_scenarios_temp
(
  id,
  scenario_key,
  name,
  suite,
  enabled,
  priority,
  tags,
  steps,
  created_at,
  updated_at
)
VALUES
(
  gen_random_uuid(),
  '569900375',
  'TEMP QA375: cambiar hora y confirmar nueva opcion',
  'temp',
  true,
  1,
  ARRAY['temp','QA375','booking','confirm_booking','reschedule','change_time','confirm_change','audit','critical'],
  '[
    {
        "role": "user",
        "text": "Hola",
        "expect": {
            "must_have_audit": true
        }
    },
    {
        "role": "user",
        "text": "Quiero cotizar lavado premium",
        "expect": {
            "must_have_audit": true
        }
    },
    {
        "role": "user",
        "text": "SUV, Huechuraba",
        "expect": {
            "must_have_audit": true,
            "last_bot_action_any": [
                "send_quote"
            ]
        }
    },
    {
        "role": "user",
        "text": "Agendar",
        "expect": {
            "must_have_audit": true,
            "last_bot_action_any": ["offer_available_slots"], "response_includes": ["proximos dias"], "response_not_includes": ["prximos", "das", "┬", "├", "�"]
        }
    },
    {
        "role": "user",
        "text": "3",
        "expect": {
            "must_have_audit": true,
            "last_bot_action_any": [
                "collect_address"
            ]
        }
    },
    {
        "role": "user",
        "text": "camino del roble 1251 casa 34",
        "expect": {
            "must_have_audit": true,
            "last_bot_action_any": [
                "confirm_address"
            ]
        }
    },
    {
        "role": "user",
        "text": "Si, confirmar",
        "expect": {
            "must_have_audit": true,
            "last_bot_action_any": [
                "confirm_booking"
            ]
        }
    },
    {
        "role": "user",
        "text": "Quiero cambiar la hora",
        "expect": {
            "must_have_audit": true,
            "last_bot_action_any": [
                "offer_reschedule_slots",
                "reschedule_booking"
            ]
        }
    },
    {
        "role": "user",
        "text": "1",
        "expect": {
            "must_have_audit": true,
            "last_bot_action_any": [
                "reschedule_booking"
            ]
        }
    }
]'::jsonb,
  now(),
  now()
)
ON CONFLICT (scenario_key) DO UPDATE
SET
  name = EXCLUDED.name,
  suite = EXCLUDED.suite,
  enabled = true,
  priority = EXCLUDED.priority,
  tags = EXCLUDED.tags,
  steps = EXCLUDED.steps,
  updated_at = now();

SELECT
  scenario_key,
  enabled,
  name,
  updated_at
FROM public.qa_test_scenarios_temp
WHERE scenario_key = '569900375';










