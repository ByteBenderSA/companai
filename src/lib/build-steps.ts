// The four-stage build guide shown on a project page. Pure content — no imports from Firebase.
import type { BuildStepId } from './project-model';

export interface BuildStep {
  id: BuildStepId;
  title: string;
  summary: string;
  /** Which saved prompt (if any) the student needs for this step. */
  usesPrompt?: 'lovable' | 'cursor';
  /** Markdown instructions. */
  guide: (projectTitle: string) => string;
  links: { label: string; url: string }[];
}

export function slugify(title: string): string {
  const slug = title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/g, '');
  return slug || 'my-app';
}

export const BUILD_STEPS: BuildStep[] = [
  {
    id: 'lovable',
    title: 'Build the UI in Lovable',
    summary: 'Paste your Lovable prompt and let it build the screens.',
    usesPrompt: 'lovable',
    guide: (title) => `**Goal:** a clickable version of **${title}** with sample data, running in Lovable.

1. Copy the **Lovable prompt** above.
2. Open [lovable.dev](https://lovable.dev), sign in, and paste the prompt into the box on the home page.
3. Wait for the first version to build (a few minutes), then click around the preview.
4. Ask Lovable for changes in plain English, one at a time — for example *"make the header sticky"* or *"add an empty state to the list"*.

**Tips**
- Small, specific requests work better than one giant request.
- If something breaks, ask Lovable to *"revert the last change"* or use the version history.

**You're done when** every main screen exists and looks right on both desktop and phone preview.`,
    links: [
      { label: 'Lovable', url: 'https://lovable.dev' },
      { label: 'Lovable docs', url: 'https://docs.lovable.dev' },
    ],
  },
  {
    id: 'github',
    title: 'Connect GitHub',
    summary: 'Sync the Lovable project to GitHub and download it.',
    guide: (title) => {
      const slug = slugify(title);
      return `**Goal:** your code lives in a GitHub repository and on your computer.

1. In Lovable, open the **GitHub** menu and choose **Connect to GitHub**. Approve access.
2. Create the repository — a name like \`${slug}\` works well.
3. On the new repository's GitHub page, click **Code** and copy the HTTPS URL.
4. In a terminal, clone it:

\`\`\`bash
git clone https://github.com/YOUR-USERNAME/${slug}.git
cd ${slug}
npm install
npm run dev
\`\`\`

5. Open the address it prints (usually http://localhost:8080 or :5173) and check the app runs locally.

**Good to know:** Lovable and GitHub stay in sync both ways. Changes you push from your computer show up in Lovable, and changes made in Lovable appear in GitHub — run \`git pull\` before you start working.

**You're done when** \`npm run dev\` shows your app on your own computer.`;
    },
    links: [
      { label: 'Install Git', url: 'https://git-scm.com/downloads' },
      { label: 'Install Node.js (LTS)', url: 'https://nodejs.org/en/download' },
      { label: 'GitHub', url: 'https://github.com' },
    ],
  },
  {
    id: 'cursor',
    title: 'Add the backend with Cursor',
    summary: 'Open the project in Cursor and work through the Cursor prompt.',
    usesPrompt: 'cursor',
    guide: (title) => `**Goal:** **${title}** saves real data and has working accounts.

1. Install [Cursor](https://cursor.com) and open your project folder (**File → Open Folder**).
2. Create a free [Firebase](https://console.firebase.google.com) project. Enable **Authentication → Email/Password** and **Firestore Database**.
3. Open Cursor's chat panel, paste the **Cursor prompt** above, and ask it to start with step 1 only.
4. After each step: run the app, test what changed, then commit:

\`\`\`bash
git add .
git commit -m "Describe what you just added"
git push
\`\`\`

5. Repeat until every step in the prompt is done.

**Tips**
- Read what Cursor changes before you accept it. Ask *"explain this change"* if you're unsure.
- Never paste secret keys into public code. Firebase web config is fine; anything labelled *secret* or *private* is not.

**You're done when** you can sign up, create data, refresh the page, and still see it.`,
    links: [
      { label: 'Cursor', url: 'https://cursor.com' },
      { label: 'Firebase console', url: 'https://console.firebase.google.com' },
      { label: 'Firestore security rules', url: 'https://firebase.google.com/docs/firestore/security/get-started' },
    ],
  },
  {
    id: 'deploy',
    title: 'Deploy and share',
    summary: 'Put the app online and share the link.',
    guide: (title) => `**Goal:** **${title}** has a public link you can share.

**Easiest:** in Lovable click **Publish** — your app gets a \`lovable.app\` link straight away.

**Or deploy with Firebase Hosting** from your computer:

\`\`\`bash
npm install -g firebase-tools
firebase login
firebase init hosting   # public directory: dist, single-page app: yes
npm run build
firebase deploy
\`\`\`

**Before you share**
- If you use Firebase Authentication, add your live domain under **Authentication → Settings → Authorized domains**.
- Test sign-up and the main feature on your phone.
- Add a short README to your GitHub repo with a screenshot and the live link.

**You're done when** a friend can open the link and use the app.`,
    links: [
      { label: 'Firebase Hosting quickstart', url: 'https://firebase.google.com/docs/hosting/quickstart' },
      { label: 'Lovable publishing', url: 'https://docs.lovable.dev' },
    ],
  },
];
