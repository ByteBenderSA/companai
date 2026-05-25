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
cp .env.example .env.local   # fill in your Firebase values
npm run dev
```

Add your own Gemini / DeepSeek API key via the Settings modal in the running app.

## Before you push

```bash
npm run lint     # must pass
npm run build    # must succeed
```

CI runs both on every PR. We don't merge red builds.

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
