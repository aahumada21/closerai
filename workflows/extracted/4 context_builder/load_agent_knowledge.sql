-- === ARCHIVO GENERADO -- NO EDITAR ===
-- Extraido de: 4 context_builder  (workflow id 5f5ef274-4b7a-4a1a-b463-ff22e5eae55e)
-- Nodo:        load_agent_knowledge
--
-- La fuente de verdad es el JSON del workflow en workflows/exports/.
-- Regenerar con: node scripts/extract_workflow_code.js
-- =====================================

WITH params AS (
  SELECT
    NULLIF('{{ String($json.routing?.agent_id || $json.agent?.id || $json.lead?.agent_id || $json.lead_state?.agent_id || $json.context_packet?.routing?.agent_id || $json.context_packet?.agent?.id || "").replace(/'/g, "''") }}', '')::uuid AS agent_id,
    LOWER('{{ String($json.event?.text || $json.context_packet?.conversation?.latest_user_message || "").replace(/'/g, "''").toLowerCase() }}') AS query_text
),
terms AS (
  SELECT
    agent_id,
    query_text,
    regexp_split_to_array(
      regexp_replace(query_text, '[^a-z0-9 ]', ' ', 'g'),
      '\s+'
    ) AS words
  FROM params
),
ranked AS (
  SELECT
    c.id AS chunk_id,
    c.source_id,
    s.source_key,
    c.title,
    c.content,
    c.tags,
    c.metadata,
    c.chunk_index,
    (
      CASE
        WHEN terms.query_text <> ''
         AND LOWER(c.title || ' ' || c.content) LIKE '%' || terms.query_text || '%'
        THEN 100
        ELSE 0
      END
      + (
        SELECT COUNT(*)::int * 10
        FROM unnest(terms.words) AS word
        WHERE length(word) >= 4
          AND LOWER(c.title || ' ' || c.content || ' ' || array_to_string(c.tags, ' ')) LIKE '%' || word || '%'
      )
    ) AS score
  FROM terms
  JOIN public.agent_knowledge_chunks c
    ON c.agent_id = terms.agent_id
   AND c.is_active = true
  JOIN public.agent_knowledge_sources s
    ON s.id = c.source_id
   AND s.is_active = true
  WHERE terms.agent_id IS NOT NULL
  ORDER BY score DESC, c.chunk_index ASC
  LIMIT 5
)
SELECT
  COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'chunk_id', chunk_id,
        'source_id', source_id,
        'source_key', source_key,
        'title', title,
        'content', content,
        'tags', tags,
        'metadata', metadata,
        'score', score
      )
      ORDER BY score DESC, chunk_index ASC
    ),
    '[]'::jsonb
  ) AS knowledge_chunks,
  COALESCE(jsonb_agg(DISTINCT source_id) FILTER (WHERE source_id IS NOT NULL), '[]'::jsonb) AS knowledge_source_ids,
  true AS retrieval_ok,
  (SELECT agent_id FROM params) AS knowledge_agent_id
FROM ranked;
