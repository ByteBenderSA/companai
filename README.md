# CompanAI

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://react.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-11-ffa000.svg)](https://firebase.google.com/)

An open-source AI development accelerator. Turn rough app ideas into structured, copy-paste-ready prompts for **[Lovable](https://lovable.dev)**, **[Cursor](https://cursor.com)**, and other AI dev tools. Built with React, TypeScript, Tailwind, Firebase, and Gemini / DeepSeek.

> **Bring your own API key.** CompanAI never stores or proxies your keys — they live in your browser and go directly to the AI provider.

---

## Features

- **Idea Workshop** — describe an app vision in plain English, get three concrete project variations with feature lists, tech stacks, and a starter roadmap
- **Refined Prompts** — pick a variation, customize colour scheme / layout / features, and get matched Lovable + Cursor prompts
- **AI Chat Assistant** — context-aware mentor that knows your active project; uses Gemini by default, DeepSeek if you supply a key
- **Lessons** — short modules covering the AI-development workflow (tools, prompting patterns, deploying)
- **Project Workspace** — track ideas you're building, save generated prompts, see progress

---

## Quickstart

You need: Node 18+ and a Firebase project (free tier is fine).

```bash
git clone https://github.com/ByteBenderSA/companai.git
cd companai
npm install
cp .env.example .env.local
# fill in .env.local with your Firebase web app config
npm run dev
```

Open <http://localhost:8080>, sign up, click **Settings** in the dashboard header, and paste a free [Gemini API key](https://aistudio.google.com/apikey). That's it.

### Firebase setup

1. Create a project at <https://console.firebase.google.com/>
2. Enable **Authentication** → Email/Password and Google
3. Enable **Firestore Database** in production mode
4. Deploy the included rules: `firebase deploy --only firestore:rules,firestore:indexes`
5. In Project Settings → General, register a Web app and copy the config into `.env.local`

### Production build

```bash
npm run build         # outputs to dist/
npm run preview       # local preview of the production build
firebase deploy --only hosting   # optional: deploy to Firebase Hosting
```

---

## How it works

```
┌───────────────────────────────────────────────────────────────┐
│                          Your browser                          │
│  ┌───────────────┐    ┌────────────────┐    ┌──────────────┐ │
│  │ React UI      │ ─▶ │ Settings store │    │ Local key    │ │
│  │ (Vite + TS)   │    │ (localStorage) │ ─▶ │ → Gemini /   │ │
│  └───────┬───────┘    └────────────────┘    │   DeepSeek   │ │
│          │                                   └──────────────┘ │
│          ▼                                                    │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              Firebase (your own project)                │  │
│  │   Auth · Firestore (projects, conversations, progress)  │  │
│  └────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────┘
```

There is no CompanAI server. You self-host the static frontend and connect it to your own Firebase project and your own AI provider keys.

---

## Roadmap

- [ ] OpenAI / Anthropic / OpenRouter provider support
- [ ] Export prompts as `.md` / `.prompt` files
- [ ] Project templates beyond the default 3 variations
- [ ] Self-hostable Docker image
- [ ] Plugin system for custom prompt templates

Open an [issue](https://github.com/ByteBenderSA/companai/issues) to discuss or propose features.

---

## Contributing

PRs welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for the workflow and what we're looking for.

## Security

If you find a security issue, please follow the responsible disclosure process in [SECURITY.md](SECURITY.md).

## License

[AGPL-3.0-or-later](LICENSE). If you run a modified version as a network service, you must release your modifications under the same license.

## Hosted version

Don't want to set up Firebase or manage API keys? A managed version is in the works — drop a star on the repo to be notified.
