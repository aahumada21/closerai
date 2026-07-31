UPDATE public.qa_test_scenarios_temp
SET enabled = false,
    updated_at = now()
WHERE scenario_key >= '569900242'
  AND scenario_key <= '569900261';
