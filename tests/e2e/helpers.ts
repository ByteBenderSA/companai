import { expect, test, type Page, type Route } from '@playwright/test';

export const FAKE_KEY = 'AIzaFakeKeyForTests_0123456789';

export const IDEAS = {
  ideas: [1, 2, 3].map((n) => ({
    title: `StudyBuddy ${n}`,
    description: `Variation ${n}: helps students find study partners for the same course.`,
    features: ['Course matching', 'Study session booking', 'In-app chat', 'Shared calendar'],
    techStack: ['React', 'TypeScript', 'Tailwind CSS', 'Firebase'],
    difficulty: 'Beginner',
    timeEstimate: '2 weeks',
    learningObjectives: ['Authentication', 'Firestore data modelling'],
  })),
};

export const PROMPTS = {
  lovablePrompt: '# Build StudyBuddy\n\n---\n\nLOVABLE_MARKER: screens for matching and chat.',
  cursorPrompt: '# Backend for StudyBuddy\n\nCURSOR_MARKER: add Firebase auth and Firestore.',
};

/** Contains raw HTML that must render as text, never execute. */
export const MENTOR_REPLY =
  'Here is **bold advice**.\n\n<img src=x onerror="window.__xss = true">\n\n```bash\nnpm install\n```\n\nSee [docs](https://firebase.google.com) or [bad](javascript:alert(1)).';

type Behaviour = { failWith?: { status: number; message: string }; delayMs?: number };

/**
 * Mock the Gemini REST API. Every request is answered locally based on what was asked for.
 * Returns a handle to make the next call fail (e.g. to test error handling).
 */
export async function mockGemini(page: Page) {
  const behaviour: Behaviour = {};
  const calls: string[] = [];

  await page.route('https://generativelanguage.googleapis.com/**', async (route: Route) => {
    const url = route.request().url();
    const body = route.request().postData() ?? '';
    calls.push(url);
    if (behaviour.delayMs) {
      const ms = behaviour.delayMs;
      behaviour.delayMs = undefined;
      await new Promise((r) => setTimeout(r, ms));
    }

    const key = route.request().headers()['x-goog-api-key'] ?? new URL(url).searchParams.get('key');
    if (key !== FAKE_KEY) {
      return route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: { code: 400, message: 'API key not valid. Please pass a valid API key.', status: 'INVALID_ARGUMENT' } }),
      });
    }
    if (behaviour.failWith) {
      const { status, message } = behaviour.failWith;
      behaviour.failWith = undefined;
      return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify({ error: { code: status, message } }) });
    }

    const candidate = (text: string) => ({ candidates: [{ content: { role: 'model', parts: [{ text }] }, finishReason: 'STOP', index: 0 }] });

    if (url.includes(':streamGenerateContent')) {
      const pieces = [MENTOR_REPLY.slice(0, 20), MENTOR_REPLY.slice(20)];
      const sse = pieces.map((p) => `data: ${JSON.stringify(candidate(p))}\r\n\r\n`).join('');
      return route.fulfill({ status: 200, contentType: 'text/event-stream', body: sse });
    }

    let text = 'OK';
    // Prompts requests mention lovablePrompt; idea requests mention the ideas schema (as a field or inside the prompt text).
    if (body.includes('lovablePrompt')) text = JSON.stringify(PROMPTS);
    else if (body.includes('ideas')) text = JSON.stringify(IDEAS);
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(candidate(text)) });
  });

  return {
    calls,
    delayNext(ms: number) {
      behaviour.delayMs = ms;
    },
    failNext(status: number, message: string) {
      behaviour.failWith = { status, message };
    },
  };
}

let counter = 0;
export function uniqueEmail(prefix = 'student') {
  counter += 1;
  return `${prefix}-${Date.now()}-${counter}@example.com`;
}

export async function signUp(page: Page, name = 'Test Student', email = uniqueEmail()) {
  await page.goto('/signup');
  await page.getByLabel('Your name').fill(name);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  return email;
}

/** Put a key straight into localStorage (for tests that aren't about the Settings flow). */
export async function setKey(page: Page) {
  await page.evaluate((key) => localStorage.setItem('companai.settings.v1', JSON.stringify({ geminiApiKey: key, deepseekApiKey: '', geminiModel: '' })), FAKE_KEY);
}

export async function shot(page: Page, name: string) {
  await page.screenshot({ path: `test-results/screens/${test.info().project.name}-${name}.png`, fullPage: true });
}

export async function logOut(page: Page) {
  await expect(page.getByRole('link', { name: 'CompanAI dashboard' })).toBeVisible();
  const menu = page.getByRole('button', { name: 'Open menu' });
  if (await menu.isVisible()) await menu.click();
  await page.getByRole('button', { name: /Log out/ }).filter({ visible: true }).click();
  await expect(page).toHaveURL(/\/login$/);
}
