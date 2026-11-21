// The "Build Report" prompt appendix. Pure — no Firebase or network imports.
//
// The appendix goes at the end of the Lovable prompt the student copies. It
// asks Lovable to emit a fenced JSON report with the project's feature ids
// filled in. On the paste back, we look for that fence first; the parser is
// then plain JSON.parse — no fuzzy string matching. The student's own feature
// ids live in Companai, not in Lovable's output, so a hallucinated feature
// can't corrupt the project.

import { BUILD_REPORT_FENCE, type ProjectFeature } from './build-report-model';
import type { BuildPrompts } from './prompts';

/**
 * Minimal view of a project the appendix needs. Taking a narrow type keeps the
 * appendix testable without pulling in the whole Project.
 */
export interface AppendixProject {
  id: string;
  features: readonly ProjectFeature[];
}

export function buildPromptAppendix(project: AppendixProject): string {
  if (project.features.length === 0) return '';
  const rows = project.features
    .map(
      (f) =>
        `    { "id": "${f.id}", "label": ${JSON.stringify(f.label)}, "status": "" }`
    )
    .join(',\n');

  return `
---

## 📋 Completion report (required)

After you finish building, append a completion report to your response inside
the exact fenced block below. Do not modify the \`id\` or \`label\` fields.
Fill in each feature's \`status\`.

- \`built\` — fully implemented and visible in the preview
- \`partial\` — started but not complete (explain in \`note\`)
- \`missing\` — not built yet
- \`blocked\` — attempted but failed (explain in \`note\`)

\`\`\`${BUILD_REPORT_FENCE}
{
  "projectId": "${project.id}",
  "features": [
${rows}
  ],
  "blockers": [],
  "filesChanged": []
}
\`\`\`
`;
}

/**
 * Convenience: attach the appendix to the lovable half of a BuildPrompts pair.
 * The cursor prompt is left alone — Lovable is what reads the appendix.
 */
export function withLovableAppendix(prompts: BuildPrompts, project: AppendixProject): BuildPrompts {
  const appendix = buildPromptAppendix(project);
  if (!appendix) return prompts;
  return { ...prompts, lovable: `${prompts.lovable.trimEnd()}\n${appendix}` };
}
