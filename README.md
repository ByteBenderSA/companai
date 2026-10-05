# CompanAI

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](LICENSE)

An open-source app that helps people **learn to build web apps with AI tools**. Students describe an idea, pick one of three AI-suggested versions, get ready-to-paste prompts for **[Lovable](https://lovable.dev)** (UI) and **[Cursor](https://cursor.com)** (backend), then follow a four-stage build guide — Lovable → GitHub → Cursor + Firebase → deploy — with an AI mentor on hand.

Built with React, TypeScript, Tailwind, Firebase and Google Gemini. Each student uses **their own free Gemini API key**, stored only in their browser — there is no CompanAI server and no shared AI bill.

- **Students:** see the [student guide](docs/STUDENT_GUIDE.md).
- **Running it for a class or bootcamp:** follow [Set up an instance](#set-up-an-instance-instructors) below (≈20 minutes).

---

## Features

| | |
|---|---|
| **Idea Workshop** | Describe an app → three concrete project variations sized to the student's experience → customise colours, layout, fonts and features → tailored Lovable + Cursor prompts. Progress is saved, so a refresh or closed tab loses nothing. |
| **Projects** | Every saved project keeps its prompts and a step-by-step build guide with per-stage progress. Prompts can be regenerated any time. |
| **AI mentor** | A chat panel that knows which project and stage the student is on. Renders Markdown safely (AI output can never run scripts). |
| **Lessons** | Six short lessons: Lovable, GitHub, Cursor, Firebase, TypeScript, Tailwind. |
| **Getting-started checklist** | Shows each student exactly what to do next on their dashboard. |

## How it works

```
Student's browser
 ├─ React app (static files on Firebase Hosting)
 ├─ Gemini API key in localStorage ──► Google Gemini API (direct)
 └─ Firebase Auth + Firestore (your project): profiles, projects, drafts, lesson progress
```

Firestore security rules ([`firestore.rules`](firestore.rules)) give each user access to their own documents only — this is covered by an automated test suite.

---

## Set up an instance (instructors)

You need **Node.js 20.19+**, a Google account, and about 20 minutes. Everything fits in Firebase's free Spark plan for a typical class.

### 1. Create the Firebase project

1. Go to the [Firebase console](https://console.firebase.google.com/) → **Add project**. Google Analytics is optional.
2. **Build → Authentication → Get started.** Enable **Email/Password** and **Google**.
3. **Build → Firestore Database → Create database.** Choose a location near your students and start in **production mode**.
4. **Project settings (⚙) → General → Your apps → Web (`</>`)**. Register an app (no need for Firebase Hosting setup there) and keep the config values handy.

### 2. Configure and run locally

```bash
git clone https://github.com/ByteBenderSA/companai.git
cd companai
npm install
cp .env.example .env.local      # paste the web app config values into .env.local
npx firebase login
npx firebase use --add          # pick your project
npm run deploy:rules            # security rules + the one index the app needs
npm run dev                     # http://localhost:8080
```

Sign up, open **Settings**, paste a Gemini key from [Google AI Studio](https://aistudio.google.com/apikey), and run through the Idea Workshop once.

### 3. Deploy

```bash
npm run deploy                  # builds, then deploys hosting + rules + indexes
```

Your app is live at `https://<project-id>.web.app`. If you use a custom domain, add it under **Authentication → Settings → Authorized domains** or Google sign-in will fail there.

### 4. Before the first session

- [ ] Sign up on the live site with a test account and complete the whole flow on a phone.
- [ ] Share the [student guide](docs/STUDENT_GUIDE.md) and the link to your instance.
- [ ] Remind students that each person needs their **own** Gemini key — a shared key hits rate limits quickly.
- [ ] If Google retires the default model (`gemini-3.8-flash`), students can set another one under **Settings → Advanced**; update `DEFAULT_GEMINI_MODEL` in `src/lib/settings.ts` and redeploy.

### Costs and limits

- **Firebase:** a class of ~50 active students stays well inside the free Spark plan (reads/writes are small and per-user).
- **Gemini:** free-tier keys have per-minute and per-day request limits. The app explains rate-limit errors and lets students retry.
- Anyone with your link can sign up. If you need to restrict access, use [Firebase Authentication blocking functions](https://firebase.google.com/docs/auth/extend-with-blocking-functions) or disable sign-up after the class has registered.

---

## Development

```bash
npm run dev              # app against your real Firebase project (.env.local)
npm run emulators        # local Auth + Firestore emulators (needs Java 11+)
npm run dev:emulators    # app against the emulators — no Firebase project needed
```

### Quality checks

| Command | What it runs |
|---|---|
| `npm run check` | type-check (strict) + lint + unit tests + production build |
| `npm test` | unit tests for the pure logic (`tests/unit`) |
| `npm run test:rules` | Firestore security-rules tests on the emulator (`tests/rules`) |
| `npm run test:e2e` | Playwright journeys on phone and desktop viewports against the emulators, with Gemini mocked (`tests/e2e`). First run: `npx playwright install chromium` |

CI runs all of them on every pull request.

### Project layout

```
src/
  lib/            pure logic (ideas, prompts, project model, build steps, mentor) + Firebase data access
  lib/ai/         Gemini / DeepSeek clients and error classification
  components/     app components (layout, prompt cards, mentor chat, settings…)
  components/ui/  shadcn/ui primitives
  pages/          routes
tests/            unit, rules and e2e tests
```

Design decisions and their reasons are recorded in [DECISIONS.md](DECISIONS.md).

## Contributing

PRs welcome — see [CONTRIBUTING.md](CONTRIBUTING.md). Security issues: [SECURITY.md](SECURITY.md).

## License

[AGPL-3.0-or-later](LICENSE). If you run a modified version as a network service, you must make your modified source available to its users under the same license.
