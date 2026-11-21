// Gemini fallback for extracting a build report when the Lovable/Cursor paste
// doesn't contain the companai-report-v1 fence. Uses the student's own key via
// the existing geminiJson wrapper.

import { BUILD_REPORT_FENCE, type ProjectFeature } from '../build-report-model';
import { validateParsedReport, type ParsedReport } from '../build-report-parse';
import { geminiJson } from './gemini';

const EXTRACTION_SCHEMA = {
  type: 'object',
  properties: {
    features: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          status: { type: 'string', enum: ['built', 'partial', 'missing', 'blocked'] },
          note: { type: 'string' },
        },
        required: ['id', 'status'],
      },
    },
    blockers: { type: 'array', items: { type: 'string' } },
    filesChanged: { type: 'array', items: { type: 'string' } },
  },
  required: ['features'],
} as const;

/**
 * Ask Gemini (with the student's own key) to extract the per-feature status
 * from a raw paste. Caller should prefer `extractFromFence` first — this is
 * the fallback. Throws `AIError` via `geminiJson` (missing-key, rate-limit, …);
 * the UI maps those to plain-English messages via auth-errors / data-errors.
 */
export async function extractBuildReportViaGemini(
  rawPaste: string,
  features: readonly ProjectFeature[]
): Promise<ParsedReport> {
  const featureList = features.map((f) => `- ${f.id}: ${f.label}`).join('\n');
  const prompt = `You are extracting a build-report from a response an AI builder (Lovable or Cursor) produced after attempting to build a project.

The project has these features (id: label):
${featureList}

The AI builder's response:
<<<PASTE_START
${rawPaste.slice(0, 20000)}
PASTE_END>>>

Return JSON matching this shape — do NOT invent feature ids, only use the ones above:
{
  "features": [{ "id": "<one of the ids above>", "status": "built"|"partial"|"missing"|"blocked", "note": "<short reason, optional>" }],
  "blockers": ["<short string per blocker>"],
  "filesChanged": ["<file paths mentioned in the paste>"]
}

Rules:
- Include an entry for every feature id above.
- Use "built" only when the paste explicitly confirms the feature works in the preview.
- Use "partial" when started but incomplete.
- Use "missing" when the paste doesn't mention the feature or says it wasn't built.
- Use "blocked" when the builder tried and failed.
- note: at most one short sentence.
- blockers: at most 10 entries.
- filesChanged: file paths only.

If the paste already contains a \`${BUILD_REPORT_FENCE}\` block, read it and copy its values.`;

  const text = await geminiJson(prompt, EXTRACTION_SCHEMA, 0.1);
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    // Some providers wrap JSON in a fence despite the mime-type request.
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    raw = fenced ? JSON.parse(fenced[1]) : null;
  }
  const knownIds = new Set(features.map((f) => f.id));
  return validateParsedReport(raw, knownIds);
}
