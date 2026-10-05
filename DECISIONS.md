# Decisions

Reversible calls made during the bootcamp-readiness cleanup (October 2026), with the reasoning. Change any of them freely.

## AI

- **Default model `gemini-3.8-flash`, overridable in Settings → Advanced.** The previous `gemini-2.0-flash` was shut down by Google on 2026-06-01, which broke idea generation entirely. 3.8 Flash is Google's current recommended Flash model and is on the free tier; 2.5 models are restricted to existing users. The override exists so the next retirement doesn't need a redeploy.
- **Switched SDK to `@google/genai`** (the maintained Google SDK) from the deprecated `@google/generative-ai`.
- **Structured JSON output with a JSON Schema** for ideas and prompts instead of parsing free text split on `---` / `## CURSOR PROMPT`. The old splitting cut prompts apart whenever the AI wrote a horizontal rule. If a model rejects the schema (HTTP 400), we retry once in plain JSON mode with the schema in the prompt.
- **DeepSeek kept as an optional chat provider**, now called with `fetch` (no `openai` SDK) and the current `deepseek-flash` model (`deepseek-chat` is retired). Not verified live — needs a DeepSeek key and depends on DeepSeek allowing browser (CORS) requests. Gemini remains the default and the only provider for idea/prompt generation.
- **Errors are classified** (missing key, invalid key, rate limit, model unavailable, blocked, network) into plain-English messages with an "Open Settings" shortcut where relevant. Previously most failures were silent.

## Security

- **AI output is rendered with `react-markdown` without raw HTML** (HTML becomes text; only http(s)/mailto links are clickable). The old renderer injected AI output with `dangerouslySetInnerHTML`, which could run scripts and read API keys from localStorage.
- **Firestore rules rewritten** around the four collections the app actually uses (`users`, `projects`, `ideaDrafts`, `userProgress`), each owner-only, with type/size caps and `ownerId` immutability. The old rules covered six unused collections but not `ideaWorkflows`, so every workshop autosave was being denied. Everything else is closed. Locked in by `tests/rules`.
- **Emulator mode always uses the `demo-companai` project ID**, so local/e2e runs can never write to a real project even if `.env.local` is present.
- **Removed fabricated landing-page content** (a stock-photo "Sarah Chen, 1,000+ users" testimonial and the "working app in 24 hours" claim).

## Data model

- **Workshop draft = one document per user (`ideaDrafts/{uid}`)** instead of a queried `ideaWorkflows` collection. No index needed, simpler rules, and no duplicate drafts from racing autosaves.
- **Lesson progress = `userProgress/{uid}.completedLessons`** (lesson ids). Lesson content lives in code (`src/lib/lessons.ts`); the client no longer seeds a `learning-paths` document.
- **Chat history is kept in memory for the session only.** The old code created a new Firestore conversation every time the chat opened and never reloaded it, so nothing was lost; this removes a collection and its rules.
- **Projects store `completedSteps` as stage ids** (`lovable`, `github`, `cursor`, `deploy`). `normalizeProject` reads older documents (numbered `progress.completedSteps`, `generatedPrompts`), and the old numbered field is dropped the first time a stage is toggled.
- **One composite index** (`projects: ownerId ↑, updatedAt ↓`). The previous index file didn't match any query the app ran.

## Product / UX

- **Removed the beginner/experienced/"both" modes, product tour, XP, levels and streaks.** XP/level/streak were never updated (always 0), the mode switch reloaded the page, and several cards had dead buttons. Replaced with a real **Getting started checklist** (key → project → first stage → first lesson) and a "continue building" card.
- **Workspace (one 1,700-line page that only ever showed your latest project) became `/projects` + `/projects/:id`.** Students can open and delete any project. Clicking a stage no longer marks it complete; there's an explicit checkbox. `/workspace` redirects.
- **One build guide** (four stages, Markdown content in `src/lib/build-steps.ts`) replaces three overlapping, partly contradictory guides.
- **Quick save** from an idea card stores clearly-labelled starter prompts; students can generate tailored ones later from the project page.
- **Mobile:** collapsible nav, errors scroll into view, toasts at the bottom, page padding so the floating mentor button never covers content. E2E tests run on a Pixel 7 viewport as well as desktop.
- **Login redirects back** to the page a student was trying to open; signed-in users skip the login/signup pages; password reset added.

## Engineering

- **Strict TypeScript** on; lint rules back to errors.
- **Upgraded** Vite 5 → 7 and Firebase 11 → 12 (required by the test tooling). Removed ~30 unused dependencies and ~28 unused shadcn components.
- **Code-split routes**; Gemini SDK, Markdown renderer and Firebase each load in their own chunks. First-load app code is ~35 kB gzipped plus cached vendor chunks.
- **Tests:** 54 unit tests (pure logic), 18 Firestore rules tests (emulator), 16 Playwright e2e runs (8 journeys × phone + desktop, Gemini mocked at the network layer).
