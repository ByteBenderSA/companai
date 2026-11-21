// System prompt for the chat mentor. Pure — no Firebase imports.
import { featureLabels } from './build-report-model';
import { BUILD_STEPS } from './build-steps';
import type { Project } from './project-model';

const BASE = `You are CompanAI's coding mentor, helping a student on a bootcamp build a real web app with AI tools (Lovable for the UI, GitHub, Cursor for the backend, Firebase for data and hosting).

How to answer:
- Be encouraging and concrete. Prefer short numbered steps the student can follow right now.
- Assume they are a beginner unless they show otherwise. Explain jargon in one line the first time you use it.
- Use Markdown. Put commands and code in fenced code blocks with a language tag.
- When they are stuck on an error, ask for the exact error message and what they did just before, then explain the likely cause and the fix.
- Suggest prompts they can paste into Lovable or Cursor when that is the fastest route.
- Never ask for or repeat secret keys or passwords.`;

export function buildMentorSystemPrompt(project?: Project | null): string {
  if (!project) return BASE;
  const nextStep = BUILD_STEPS.find((s) => !project.completedSteps.includes(s.id));
  const lines = [
    BASE,
    '',
    'The student is currently working on this project:',
    `- Title: ${project.title}`,
    `- Description: ${project.description}`,
  ];
  const labels = featureLabels(project.features);
  if (labels.length) lines.push(`- Features: ${labels.join('; ')}`);
  if (project.techStack.length) lines.push(`- Tech: ${project.techStack.join(', ')}`);
  lines.push(
    `- Build progress: ${project.completedSteps.length} of ${BUILD_STEPS.length} stages done` +
      (nextStep ? `; next stage is "${nextStep.title}" (${nextStep.summary})` : '; all stages done')
  );
  return lines.join('\n');
}

export function starterQuestions(project?: Project | null): string[] {
  if (!project) {
    return ['How does the Lovable → GitHub → Cursor workflow fit together?', 'What is Firebase and why do I need it?', 'How do I describe my app idea well?'];
  }
  const next = BUILD_STEPS.find((s) => !project.completedSteps.includes(s.id))?.id;
  switch (next) {
    case 'lovable':
      return [`What should I ask Lovable for first when building ${project.title}?`, 'How do I make my design look more polished?', 'Lovable broke something — how do I undo it?'];
    case 'github':
      return ['Walk me through connecting Lovable to GitHub', 'git clone says "permission denied" — what do I do?', 'What does npm install actually do?'];
    case 'cursor':
      return [`What Firestore collections does ${project.title} need?`, 'How do I write Firestore security rules?', 'Cursor changed a lot of files — how do I review them?'];
    case 'deploy':
      return ['How do I deploy with Firebase Hosting?', 'Login works locally but not on my live site — why?', 'What should my project README include?'];
    default:
      return [`What feature should I add next to ${project.title}?`, 'How do I get feedback from real users?', 'How do I present this project in my portfolio?'];
  }
}
