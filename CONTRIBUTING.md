# Contributing to CompanAI

Thanks for considering a contribution! This project is small and informal — here's how to help without surprises.

## Before you start

- **Big features**: open an issue first to discuss the approach. Don't sink time into a 1,000-line PR without a green light.
- **Small fixes** (bugs, typos, dependency bumps, docs): just open a PR.
- **Security issues**: do NOT open a public issue. See [SECURITY.md](SECURITY.md).

## Development setup

```bash
git clone https://github.com/ByteBenderSA/companai.git
cd companai
npm install
npm run emulators        # terminal 1 — local Auth + Firestore (needs Java 11+)
npm run dev:emulators    # terminal 2 — the app, pointed at the emulators
```

No Firebase project is needed for development. Add your own Gemini key in the app's Settings to try the AI features.

## Before you push

```bash
npm run check            # strict type-check + lint + unit tests + build
npm run test:rules       # if you touched firestore.rules or data access
npm run test:e2e         # if you touched a user-facing flow
```

CI runs all of these on every PR. We don't merge red builds. Keep pure logic in `src/lib` without Firebase imports so it can be unit-tested, and pair any change to `firestore.rules` with a test in `tests/rules`.

## PR guidelines

- One concern per PR. Don't bundle refactors with feature work.
- Conventional-ish commit messages: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`.
- Keep diffs small. If a PR is over ~500 lines of code change, the review is going to suggest splitting it.
- Update docs in the same PR as the code change.

## What we won't merge

- Hardcoded API keys, even in tests
- Code that re-introduces payment integrations into the OSS branch (those belong on the private hosted branch)
- New dependencies without a justification in the PR description
- Features that require new env vars without documenting them in `.env.example`

## License of contributions

By contributing, you agree your changes are released under the project's [AGPL-3.0-or-later](LICENSE) license.
