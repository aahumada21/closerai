// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 5 llm_decision  (workflow id 8e8b11be-4a3d-4804-80ec-30582eeb5384)
// Nodo:        parse_or_extract_structured_output
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const raw = $json;

function tryParseJSON(str) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

function cleanText(str) {
  if (typeof str !== 'string') return '';
  return str
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

function extractJsonSubstring(str) {
  if (typeof str !== 'string') return null;
  const start = str.indexOf('{');
  const end = str.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  return str.slice(start, end + 1);
}

function extractCandidate(obj) {
  if (!obj) return { parsed: null, source: 'empty' };

  if (typeof obj === 'object' && obj.action && obj.state_update) {
    return { parsed: obj, source: 'root_object' };
  }

  const content = obj?.choices?.[0]?.message?.content;

  if (typeof content === 'string') {
    const cleaned = cleanText(content);
    return {
      parsed: tryParseJSON(cleaned) || tryParseJSON(extractJsonSubstring(cleaned)),
      source: 'choices_message_content',
      raw_content: content
    };
  }

  if (typeof obj.output_text === 'string') {
    const cleaned = cleanText(obj.output_text);
    return {
      parsed: tryParseJSON(cleaned) || tryParseJSON(extractJsonSubstring(cleaned)),
      source: 'output_text',
      raw_content: obj.output_text
    };
  }

  if (Array.isArray(content)) {
    for (const part of content) {
      if (typeof part?.text === 'string') {
        const cleaned = cleanText(part.text);
        const parsed = tryParseJSON(cleaned) || tryParseJSON(extractJsonSubstring(cleaned));
        if (parsed) {
          return {
            parsed,
            source: 'content_array_text',
            raw_content: part.text
          };
        }
      }
    }
  }

  return { parsed: null, source: 'not_found' };
}

const result = extractCandidate(raw);

return [{
  json: {
    raw_response: raw,
    raw_content: result.raw_content || null,
    parsed_output: result.parsed,
    parse_ok: !!result.parsed,
    parse_source: result.source
  }
}];
