import { expect, test } from '@playwright/test';
import { FAKE_KEY, logOut, mockGemini, setKey, shot, signUp, uniqueEmail } from './helpers';

test.describe('student journey', () => {
  test('sign up → add key → idea → prompts → project → build stage → mentor', async ({ page }) => {
    const gemini = await mockGemini(page);

    // Landing → sign up
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('ready-to-paste AI prompts');
    await expect(page.getByText('Sarah Chen')).toHaveCount(0);
    await shot(page, '01-landing');
    await signUp(page, 'Ada Student');

    // Dashboard: greeting, key banner, getting-started checklist
    await expect(page.getByRole('heading', { name: 'Welcome, Ada!' })).toBeVisible();
    await expect(page.getByText('One-time setup:')).toBeVisible();
    await expect(page.getByTestId('getting-started')).toContainText('0 of 4 done');
    await shot(page, '02-dashboard-new');

    // Workshop without a key → a clear error pointing to Settings
    await page.goto('/idea-workshop');
    await page.getByLabel('App name *').fill('StudyBuddy');
    await page.getByLabel('What does it do? *').fill('Helps students find study partners for the same course.');
    await page.getByLabel('Who is it for?').fill('First-year university students');
    await page.getByRole('button', { name: 'Generate 3 project ideas' }).click();
    const alert = page.getByRole('alert').filter({ hasText: 'Add your Gemini API key' });
    await expect(alert).toBeVisible();
    // The error must be on screen, not above the fold where a phone user would miss it.
    await expect(alert).toBeInViewport();
    await shot(page, '03-workshop-no-key');

    // Fix it from the error: open Settings, paste a wrong key, test, then the right key
    await alert.getByRole('button', { name: 'Open Settings' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Google Gemini API key').fill('AIzaWRONG');
    await dialog.getByRole('button', { name: 'Test key' }).click();
    await expect(dialog.getByRole('alert')).toContainText('rejected');
    await dialog.getByLabel('Google Gemini API key').fill(FAKE_KEY);
    await dialog.getByRole('button', { name: 'Test key' }).click();
    await expect(dialog.getByText('Key works')).toBeVisible();
    await shot(page, '04-settings-key-ok');
    await dialog.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('One-time setup:')).toHaveCount(0);

    // Retry → three ideas
    await page.getByRole('button', { name: 'Try again' }).click();
    await expect(page.getByTestId('idea-card')).toHaveCount(3);
    await shot(page, '05-ideas');

    // Refresh keeps the draft
    await page.reload();
    await expect(page.getByTestId('idea-card')).toHaveCount(3);

    // Choose → customise → prompts
    await page.getByTestId('idea-card').first().getByRole('button', { name: 'Choose & customise' }).click();
    await expect(page.getByRole('heading', { name: /Customise “StudyBuddy 1”/ })).toBeVisible();
    await page.getByRole('radio', { name: /Mobile-first/ }).click();
    await page.getByLabel('Dark mode').check();
    await shot(page, '06-customise');
    await page.getByRole('button', { name: 'Generate my prompts' }).click();
    await expect(page.getByTestId('lovable-prompt')).toContainText('LOVABLE_MARKER');
    // The '---' inside the prompt must not have split it.
    await expect(page.getByTestId('lovable-prompt')).toContainText('# Build StudyBuddy');
    await shot(page, '07-prompts');

    // Save → project page
    await page.getByRole('button', { name: 'Save project & start building' }).click();
    await expect(page).toHaveURL(/\/projects\/[\w-]+$/);
    await expect(page.getByRole('heading', { level: 1, name: 'StudyBuddy 1' })).toBeVisible();
    await expect(page).toHaveTitle('StudyBuddy 1 · CompanAI');
    // A new page starts at the top, not at the old scroll position.
    expect(await page.evaluate(() => window.scrollY)).toBeLessThan(50);
    // The next action is spelled out, with the right prompt one click away.
    const nextUp = page.getByTestId('next-up');
    await expect(nextUp).toContainText('Stage 1 of 4');
    await expect(nextUp).toContainText('Build the UI in Lovable');
    await expect(nextUp.getByRole('button', { name: 'Copy Lovable prompt' })).toBeVisible();
    await expect(page.getByTestId('lovable-prompt')).toContainText('LOVABLE_MARKER');
    await page.getByRole('tab', { name: /Cursor/ }).click();
    await expect(page.getByTestId('cursor-prompt')).toContainText('CURSOR_MARKER');
    await shot(page, '08-project');

    // Tick the first build stage; it persists across reloads
    await page.getByRole('checkbox', { name: /Build the UI in Lovable/ }).click();
    await expect(page.getByText('1 / 4 stages')).toBeVisible();
    // Ticking a stage moves on: the next card updates and the GitHub stage opens.
    await expect(nextUp).toContainText('Connect GitHub');
    await expect(page.getByTestId('step-github').getByText('git clone', { exact: false })).toBeVisible();
    await page.reload();
    await expect(page.getByText('1 / 4 stages')).toBeVisible();

    // Mentor: markdown renders, raw HTML is inert, unsafe links are not links
    await page.getByRole('button', { name: 'Open AI mentor' }).click();
    const sheet = page.getByRole('dialog');
    await expect(sheet).toContainText('Helping with “StudyBuddy 1”');
    await sheet.getByLabel('Message').fill('How do I start?');
    await sheet.getByRole('button', { name: 'Send' }).click();
    await expect(sheet.locator('strong', { hasText: 'bold advice' })).toBeVisible();
    await expect(sheet.getByText('<img src=x onerror="window.__xss = true">')).toBeVisible();
    await expect(sheet.locator('img')).toHaveCount(0);
    expect(await page.evaluate(() => (window as unknown as { __xss?: boolean }).__xss)).toBeUndefined();
    await expect(sheet.getByRole('link', { name: 'docs' })).toHaveAttribute('href', 'https://firebase.google.com');
    await expect(sheet.getByRole('link', { name: 'bad' })).toHaveCount(0);
    await expect(sheet.getByText('npm install')).toBeVisible();
    await shot(page, '09-mentor');
    await page.keyboard.press('Escape');

    // Dashboard reflects real progress
    await page.goto('/dashboard');
    await expect(page.getByTestId('getting-started')).toContainText('3 of 4 done');
    await expect(page.getByText('Next stage: Connect GitHub')).toBeVisible();
    await shot(page, '10-dashboard-progress');

    // Lessons: complete one → checklist done → it disappears
    await page.goto('/lessons');
    await page.getByTestId('lesson-card').first().click();
    await expect(page).toHaveTitle(/Lovable/);
    await page.getByRole('button', { name: 'Complete & next lesson' }).click();
    await expect(page).toHaveURL(/lesson=github/);
    await page.getByRole('button', { name: 'Previous' }).click();
    await expect(page.getByText("You've completed this lesson.")).toBeVisible();
    await shot(page, '11-lesson');
    await page.goto('/dashboard');
    await expect(page.getByTestId('getting-started')).toHaveCount(0);

    expect(gemini.calls.length).toBeGreaterThanOrEqual(4);
  });
});

test.describe('errors and edge cases', () => {
  test('rate-limit errors are explained and retry works', async ({ page }) => {
    const gemini = await mockGemini(page);
    await signUp(page);
    await setKey(page);
    await page.goto('/idea-workshop');
    await page.getByLabel('App name *').fill('Budget Buddy');
    await page.getByLabel('What does it do? *').fill('Tracks shared expenses between flatmates.');
    gemini.failNext(429, 'Resource has been exhausted (e.g. check quota).');
    await page.getByRole('button', { name: 'Generate 3 project ideas' }).click();
    await expect(page.getByRole('alert')).toContainText('usage limit');
    await page.getByRole('button', { name: 'Try again' }).click();
    await expect(page.getByTestId('idea-card')).toHaveCount(3);
  });

  test('a progress panel is shown while the AI works', async ({ page }) => {
    const gemini = await mockGemini(page);
    await signUp(page);
    await setKey(page);
    await page.goto('/idea-workshop');
    await page.getByLabel('App name *').fill('Slow');
    await page.getByLabel('What does it do? *').fill('Checks the waiting state.');
    gemini.delayNext(3000);
    await page.getByRole('button', { name: 'Generate 3 project ideas' }).click();
    const panel = page.getByTestId('generating');
    await expect(panel).toContainText('Generating your project ideas');
    await expect(panel).toBeInViewport();
    await shot(page, '12-generating');
    await expect(page.getByTestId('idea-card')).toHaveCount(3);
    await expect(panel).toHaveCount(0);
  });

  test('a schema rejection falls back to plain JSON mode', async ({ page }) => {
    const gemini = await mockGemini(page);
    await signUp(page);
    await setKey(page);
    await page.goto('/idea-workshop');
    await page.getByLabel('App name *').fill('Fallback');
    await page.getByLabel('What does it do? *').fill('Checks the schema fallback.');
    gemini.failNext(400, 'Invalid JSON payload received. Unknown name "minItems"');
    await page.getByRole('button', { name: 'Generate 3 project ideas' }).click();
    await expect(page.getByTestId('idea-card')).toHaveCount(3);
  });

  test('a retired model gets a helpful message', async ({ page }) => {
    const gemini = await mockGemini(page);
    await signUp(page);
    await setKey(page);
    await page.goto('/idea-workshop');
    await page.getByLabel('App name *').fill('Old model');
    await page.getByLabel('What does it do? *').fill('Checks the model-unavailable message.');
    gemini.failNext(404, 'models/gemini-old is not found for API version v1beta');
    await page.getByRole('button', { name: 'Generate 3 project ideas' }).click();
    await expect(page.getByRole('alert')).toContainText("model isn't available");
  });

  test('quick save creates a project with starter prompts', async ({ page }) => {
    await mockGemini(page);
    await signUp(page);
    await setKey(page);
    await page.goto('/idea-workshop');
    await page.getByLabel('App name *').fill('QuickSave');
    await page.getByLabel('What does it do? *').fill('Tests the quick save path.');
    await page.getByRole('button', { name: 'Generate 3 project ideas' }).click();
    await page.getByTestId('idea-card').nth(1).getByRole('button', { name: /Quick save/ }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'StudyBuddy 2' })).toBeVisible();
    await expect(page.getByText('These are starter prompts.')).toBeVisible();
    await expect(page.getByTestId('lovable-prompt')).toContainText('Course matching');
  });

  test("one student cannot open another student's project", async ({ page, browser }) => {
    await mockGemini(page);
    await signUp(page);
    await setKey(page);
    await page.goto('/idea-workshop');
    await page.getByLabel('App name *').fill('Private');
    await page.getByLabel('What does it do? *').fill('Belongs to the first student.');
    await page.getByRole('button', { name: 'Generate 3 project ideas' }).click();
    await page.getByTestId('idea-card').first().getByRole('button', { name: /Quick save/ }).click();
    await expect(page).toHaveURL(/\/projects\/[\w-]+$/);
    const url = page.url();

    const other = await browser.newPage();
    await signUp(other, 'Other Student', uniqueEmail('other'));
    await other.goto(url);
    await expect(other.getByRole('heading', { name: 'Project not found' })).toBeVisible();
    await other.close();
  });

  test('deleting a project removes it from the list', async ({ page }) => {
    await mockGemini(page);
    await signUp(page);
    await setKey(page);
    await page.goto('/idea-workshop');
    await page.getByLabel('App name *').fill('Doomed');
    await page.getByLabel('What does it do? *').fill('Will be deleted.');
    await page.getByRole('button', { name: 'Generate 3 project ideas' }).click();
    await page.getByTestId('idea-card').first().getByRole('button', { name: /Quick save/ }).click();
    await page.getByRole('button', { name: 'Delete project' }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click();
    await expect(page).toHaveURL(/\/projects$/);
    await expect(page.getByText('No projects yet')).toBeVisible();
  });

  test('protected pages redirect to login and come back', async ({ page }) => {
    await page.goto('/lessons');
    await expect(page).toHaveURL(/\/login$/);
    const email = uniqueEmail();
    // Create the account in a throwaway page, then log in here.
    const tmp = await page.context().newPage();
    await signUp(tmp, 'Returning', email);
    await logOut(tmp);
    await tmp.close();
    await page.reload();
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill('wrong-password');
    await page.getByRole('button', { name: 'Log in' }).click();
    await expect(page.getByRole('alert')).toContainText("don't match");
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Log in' }).click();
    await expect(page).toHaveURL(/\/lessons$/);
  });
});

test.describe('build report', () => {
  test('paste → feature diff → copy fix-the-gaps prompt (clean fence, no Gemini call)', async ({ page, context }) => {
    const gemini = await mockGemini(page);
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    // Set up a project through the usual workshop flow (uses the mocked Gemini for ideas + prompts).
    await signUp(page, 'Build Report Student');
    await setKey(page);
    await page.goto('/idea-workshop');
    await page.getByLabel('App name *').fill('StudyBuddy');
    await page.getByLabel('What does it do? *').fill('Reports progress against generated features.');
    await page.getByRole('button', { name: 'Generate 3 project ideas' }).click();
    await page.getByTestId('idea-card').first().getByRole('button', { name: /Quick save/ }).click();
    await expect(page).toHaveURL(/\/projects\/[\w-]+$/);

    // The Lovable prompt the student copies should include the appendix with the project's feature ids.
    await expect(page.getByTestId('lovable-prompt')).toContainText('companai-report-v1');
    await expect(page.getByTestId('lovable-prompt')).toContainText('"id": "f1"');

    // Four features from the fixture: f1-f4. Two built, two missing.
    const paste = [
      'Build complete. Here is my report:',
      '',
      '```companai-report-v1',
      JSON.stringify({
        features: [
          { id: 'f1', status: 'built' },
          { id: 'f2', status: 'built' },
          { id: 'f3', status: 'missing' },
          { id: 'f4', status: 'blocked', note: 'needs Firebase configured first' },
        ],
        blockers: ['Firebase project not yet connected'],
        filesChanged: ['src/pages/Dashboard.tsx'],
      }),
      '```',
    ].join('\n');

    const geminiCallsBefore = gemini.calls.length;
    await page.getByTestId('build-report-paste').fill(paste);
    await page.getByTestId('build-report-submit').click();

    // After analysing, the completion % reflects 2 built out of 4 = 50 (blocked and missing both count as 0).
    await expect(page.getByTestId('build-report-completion')).toHaveText('50%');

    // Each feature row carries the right status data attribute for mobile-friendly colour semantics in tests.
    const row = (id: string) => page.locator(`[data-testid="build-report-feature"][data-feature-id="${id}"]`);
    await expect(row('f1')).toHaveAttribute('data-status', 'built');
    await expect(row('f2')).toHaveAttribute('data-status', 'built');
    await expect(row('f3')).toHaveAttribute('data-status', 'missing');
    await expect(row('f4')).toHaveAttribute('data-status', 'blocked');
    await expect(row('f4')).toContainText('needs Firebase configured first');

    // The follow-up prompt only mentions the gaps, with the same fence token asked for again.
    const next = page.getByTestId('build-report-next-prompt');
    await expect(next).toBeVisible();
    await expect(next).toContainText('In-app chat');
    await expect(next).toContainText('Shared calendar');
    await expect(next).not.toContainText('Course matching');
    await expect(next).toContainText('companai-report-v1');

    // Copy the follow-up prompt and verify it actually landed in the clipboard.
    await next.getByRole('button', { name: /Copy prompt/ }).click();
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(copied).toContain('Follow-up build prompt');
    expect(copied).toContain('In-app chat');

    // The fence path must not have called Gemini — the extractor was pure.
    expect(gemini.calls.length).toBe(geminiCallsBefore);

    // Round-trip: reloading the page keeps the new statuses and shows one history entry.
    await page.reload();
    await expect(page.getByTestId('build-report-completion')).toHaveText('50%');
    await expect(row('f1')).toHaveAttribute('data-status', 'built');
    await expect(page.getByRole('button', { name: /^Previous reports/i }).or(page.getByText(/Previous reports/))).toBeVisible();
  });
});
