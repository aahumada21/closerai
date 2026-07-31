-- QA rerun post-fix (clona escenarios existentes a keys nuevas)
-- Base:
-- 569900252 -> 569900330
-- 569900256 -> 569900331
-- 569900257 -> 569900332

INSERT INTO public.qa_test_scenarios_temp
(id, scenario_key, name, suite, enabled, priority, tags, steps, created_at, updated_at)
SELECT
  gen_random_uuid(),
  v.new_key,
  s.name || ' (rerun post-fix)',
  s.suite,
  true,
  s.priority,
  s.tags || ARRAY['rerun','post_fix'],
  s.steps,
  now(),
  now()
FROM public.qa_test_scenarios_temp s
JOIN (
  VALUES
    ('569900252','569900330'),
    ('569900256','569900331'),
    ('569900257','569900332')
) AS v(old_key, new_key)
  ON s.scenario_key = v.old_key
ON CONFLICT (scenario_key) DO UPDATE
SET
  name       = EXCLUDED.name,
  suite      = EXCLUDED.suite,
  enabled    = true,
  priority   = EXCLUDED.priority,
  tags       = EXCLUDED.tags,
  steps      = EXCLUDED.steps,
  updated_at = now();

-- Verificación
SELECT scenario_key, enabled, name, updated_at
FROM public.qa_test_scenarios_temp
WHERE scenario_key IN ('569900330','569900331','569900332')
ORDER BY scenario_key;
