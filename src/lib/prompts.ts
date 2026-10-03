// Pure helpers for building the Lovable + Cursor prompts. No Firebase / network imports.
import type { Idea } from './ideas';

export interface BuildPrompts {
  /** Frontend prompt to paste into Lovable. */
  lovable: string;
  /** Backend / integration prompt to paste into Cursor's chat. */
  cursor: string;
}

export interface Customization {
  colorScheme: ColorSchemeId;
  customHexColor: string;
  layoutStyle: LayoutStyleId;
  fontVibe: FontVibeId;
  extraFeatures: string[];
  customFeatures: string;
  userFlow: string;
}

export const COLOR_SCHEMES = [
  { id: 'modern-purple', name: 'Modern Purple', description: 'purple and violet accents on a light background', swatch: 'from-purple-600 to-violet-600' },
  { id: 'ocean-blue', name: 'Ocean Blue', description: 'calm blues with crisp white surfaces', swatch: 'from-blue-600 to-cyan-600' },
  { id: 'forest-green', name: 'Forest Green', description: 'fresh greens and teals', swatch: 'from-green-600 to-teal-600' },
  { id: 'sunset-orange', name: 'Sunset Orange', description: 'warm orange-to-red energy', swatch: 'from-orange-500 to-red-600' },
  { id: 'monochrome', name: 'Monochrome', description: 'neutral greys with one strong accent', swatch: 'from-gray-600 to-gray-900' },
  { id: 'custom', name: 'Custom colour', description: 'your own brand colour', swatch: 'from-pink-500 to-violet-500' },
] as const;
export type ColorSchemeId = (typeof COLOR_SCHEMES)[number]['id'];

export const LAYOUT_STYLES = [
  { id: 'dashboard', name: 'Dashboard', description: 'sidebar navigation with an overview page' },
  { id: 'mobile-first', name: 'Mobile-first', description: 'bottom tab bar, designed for phones first' },
  { id: 'minimalist', name: 'Minimalist', description: 'clean single-column pages with lots of whitespace' },
  { id: 'social-feed', name: 'Social feed', description: 'scrolling feed of cards, like Instagram or X' },
  { id: 'grid-gallery', name: 'Grid gallery', description: 'Pinterest-style grid of cards' },
] as const;
export type LayoutStyleId = (typeof LAYOUT_STYLES)[number]['id'];

export const FONT_VIBES = [
  { id: 'modern', name: 'Modern', description: 'clean sans-serif such as Inter' },
  { id: 'playful', name: 'Playful', description: 'friendly rounded fonts' },
  { id: 'formal', name: 'Formal', description: 'professional serif headings' },
  { id: 'techy', name: 'Techy', description: 'monospace accents, developer feel' },
] as const;
export type FontVibeId = (typeof FONT_VIBES)[number]['id'];

export const COMMON_FEATURES = [
  'User accounts (sign up / log in)',
  'Profile page',
  'Search',
  'File or image upload',
  'Notifications',
  'Dark mode',
  'Admin dashboard',
  'Charts and analytics',
  'Sharing with other users',
  'Comments or reviews',
] as const;

export const DEFAULT_CUSTOMIZATION: Customization = {
  colorScheme: 'modern-purple',
  customHexColor: '',
  layoutStyle: 'dashboard',
  fontVibe: 'modern',
  extraFeatures: [],
  customFeatures: '',
  userFlow: '',
};

export const PROMPTS_JSON_SCHEMA = {
  type: 'object',
  properties: {
    lovablePrompt: { type: 'string', description: 'Complete frontend prompt for Lovable, in Markdown' },
    cursorPrompt: { type: 'string', description: 'Complete backend/integration prompt for Cursor, in Markdown' },
  },
  required: ['lovablePrompt', 'cursorPrompt'],
} as const;

const HEX = /^#?[0-9a-f]{6}$/i;

export function describeColors(c: Pick<Customization, 'colorScheme' | 'customHexColor'>): string {
  if (c.colorScheme === 'custom') {
    const hex = c.customHexColor.trim();
    if (HEX.test(hex)) return `custom brand colour ${hex.startsWith('#') ? hex : `#${hex}`} as the primary colour`;
    return 'a tasteful custom colour palette';
  }
  const scheme = COLOR_SCHEMES.find((s) => s.id === c.colorScheme) ?? COLOR_SCHEMES[0];
  return `${scheme.name} — ${scheme.description}`;
}

function label<T extends { id: string; name: string; description: string }>(list: readonly T[], id: string): string {
  const item = list.find((x) => x.id === id) ?? list[0];
  return `${item.name} (${item.description})`;
}

/** The instruction sent to the model to produce both prompts. */
export function buildPromptsRequest(idea: Idea, c: Customization): string {
  const features = [...idea.features, ...c.extraFeatures];
  const lines = [
    'You write prompts that a beginner pastes into AI coding tools to build a real app.',
    'Produce TWO prompts as JSON fields:',
    '',
    '1. lovablePrompt — pasted into Lovable (an AI app builder) to create the frontend.',
    '   - Describe every screen, the navigation between them, and what each screen shows.',
    '   - Use realistic sample data so the UI looks alive before a backend exists.',
    '   - Specify the visual design (colours, layout, fonts) and responsive/mobile behaviour.',
    '   - React + TypeScript + Tailwind CSS + shadcn/ui. No backend code in this prompt.',
    '',
    '2. cursorPrompt — pasted into Cursor\'s AI chat after the Lovable project is synced to GitHub and opened in Cursor.',
    '   - Refer to the screens the Lovable prompt created and replace the sample data with real data.',
    '   - Use Firebase (Authentication + Firestore). Describe the collections and their fields.',
    '   - Include Firestore security rules so users can only read and write their own data.',
    '   - Break the work into small numbered steps the student can ask Cursor to do one at a time, and say how to test each step.',
    '',
    'Both prompts: clear Markdown, specific to THIS app (never generic filler), and complete — do not stop mid-sentence.',
    '',
    `App title (use exactly): ${idea.title}`,
    `Description: ${idea.description}`,
    `Difficulty: ${idea.difficulty}`,
    `Features: ${features.join('; ')}`,
    `Suggested tech: ${idea.techStack.join(', ') || 'React, TypeScript, Tailwind CSS, Firebase'}`,
    `Colours: ${describeColors(c)}`,
    `Layout: ${label(LAYOUT_STYLES, c.layoutStyle)}`,
    `Fonts: ${label(FONT_VIBES, c.fontVibe)}`,
  ];
  if (c.customFeatures.trim()) lines.push(`Extra features requested: ${c.customFeatures.trim()}`);
  if (c.userFlow.trim()) lines.push(`Main user journey: ${c.userFlow.trim()}`);
  return lines.join('\n');
}

/** Read the model's JSON answer. Throws if either prompt is missing. */
export function parseBuildPrompts(raw: unknown): BuildPrompts {
  if (raw && typeof raw === 'object') {
    const r = raw as Record<string, unknown>;
    const lovable = typeof r.lovablePrompt === 'string' ? r.lovablePrompt.trim() : '';
    const cursor = typeof r.cursorPrompt === 'string' ? r.cursorPrompt.trim() : '';
    if (lovable && cursor) return { lovable, cursor };
  }
  throw new Error('The AI response did not contain both prompts.');
}

/** Offline template used when a student saves an idea without generating custom prompts. */
export function templatePrompts(idea: Idea): BuildPrompts {
  const bullet = (items: string[]) => items.map((i) => `- ${i}`).join('\n');
  const lovable = `Create "${idea.title}" — ${idea.description}

## Features
${bullet(idea.features)}

## Design
- Clean, modern UI using React, TypeScript, Tailwind CSS and shadcn/ui
- Responsive: works well on phones and desktops
- Include a landing page, sign-up / log-in screens, and a main dashboard
- Use realistic sample data on every screen so the app looks complete

Build the frontend only for now — no backend yet.`;

  const cursor = `This project is the "${idea.title}" frontend generated by Lovable. Help me add a real backend with Firebase, one step at a time.

## Steps
1. Add Firebase to the project (Authentication with email/password + Firestore). Put the config in environment variables.
2. Make sign-up, log-in and log-out work, and protect pages that need a logged-in user.
3. Design Firestore collections for these features and explain each field:
${idea.features.map((f) => `   - ${f}`).join('\n')}
4. Replace the sample data on each screen with real Firestore reads and writes.
5. Write Firestore security rules so users can only read and write their own data.
6. Add loading and error states everywhere data is fetched.

After each step, tell me how to test it before moving on.`;

  return { lovable, cursor };
}
