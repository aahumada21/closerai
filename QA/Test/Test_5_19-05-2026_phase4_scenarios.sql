-- TEMP scenarios — Fase 4 (Post-cotización / Seguimiento)
-- Nota: estos QAs asumen que ya existe cotización (contexto comercial completo)
-- antes de validar `schedule_followup` / `answer_objection`.

INSERT INTO "public"."qa_test_scenarios_temp"
("id","scenario_key","name","suite","enabled","priority","tags","steps","created_at","updated_at")
VALUES
(
  gen_random_uuid(),
  '569900100',
  'TEMP QA100: post-cotización \"después te aviso\" => schedule_followup (no offer_booking)',
  'temp',
  true,
  1,
  ARRAY['temp','qa100','phase4','followup','audit','critical'],
  '[
    {"role":"user","text":"Hola","expect":{"must_have_audit":true}},
    {"role":"user","text":"Quiero cotizar lavado premium","expect":{"must_have_audit":true}},
    {"role":"user","text":"SUV, Las Condes","expect":{"must_have_audit":true}},
    {"role":"user","text":"Ya, después te aviso","expect":{"must_have_audit":true,"allowed_last_bot_action":["schedule_followup"]}}
  ]'::jsonb,
  now(),
  now()
)
ON CONFLICT ("scenario_key") DO UPDATE
SET
  "name" = EXCLUDED."name",
  "suite" = EXCLUDED."suite",
  "enabled" = EXCLUDED."enabled",
  "priority" = EXCLUDED."priority",
  "tags" = EXCLUDED."tags",
  "steps" = EXCLUDED."steps",
  "updated_at" = now();

INSERT INTO "public"."qa_test_scenarios_temp"
("id","scenario_key","name","suite","enabled","priority","tags","steps","created_at","updated_at")
VALUES
(
  gen_random_uuid(),
  '569900101',
  'TEMP QA101: objeción post-cotización \"Está caro\" => answer_objection',
  'temp',
  true,
  1,
  ARRAY['temp','qa101','phase4','objection','audit','critical'],
  '[
    {"role":"user","text":"Hola","expect":{"must_have_audit":true}},
    {"role":"user","text":"Quiero cotizar lavado premium","expect":{"must_have_audit":true}},
    {"role":"user","text":"SUV, Las Condes","expect":{"must_have_audit":true}},
    {"role":"user","text":"Está caro","expect":{"must_have_audit":true,"allowed_last_bot_action":["answer_objection"]}}
  ]'::jsonb,
  now(),
  now()
)
ON CONFLICT ("scenario_key") DO UPDATE
SET
  "name" = EXCLUDED."name",
  "suite" = EXCLUDED."suite",
  "enabled" = EXCLUDED."enabled",
  "priority" = EXCLUDED."priority",
  "tags" = EXCLUDED."tags",
  "steps" = EXCLUDED."steps",
  "updated_at" = now();

INSERT INTO "public"."qa_test_scenarios_temp"
("id","scenario_key","name","suite","enabled","priority","tags","steps","created_at","updated_at")
VALUES
(
  gen_random_uuid(),
  '569900102',
  'TEMP QA102: objeción post-cotización \"Lo voy a pensar\" => answer_objection (cierre completo)',
  'temp',
  true,
  1,
  ARRAY['temp','qa102','phase4','objection','audit','critical'],
  '[
    {"role":"user","text":"Hola","expect":{"must_have_audit":true}},
    {"role":"user","text":"Quiero cotizar lavado premium","expect":{"must_have_audit":true}},
    {"role":"user","text":"SUV, Las Condes","expect":{"must_have_audit":true}},
    {"role":"user","text":"Lo voy a pensar","expect":{"must_have_audit":true,"allowed_last_bot_action":["answer_objection"]}}
  ]'::jsonb,
  now(),
  now()
)
ON CONFLICT ("scenario_key") DO UPDATE
SET
  "name" = EXCLUDED."name",
  "suite" = EXCLUDED."suite",
  "enabled" = EXCLUDED."enabled",
  "priority" = EXCLUDED."priority",
  "tags" = EXCLUDED."tags",
  "steps" = EXCLUDED."steps",
  "updated_at" = now();

