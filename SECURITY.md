# Security Policy

## Reporting a vulnerability

If you discover a security vulnerability in CompanAI, **do not open a public issue**.

Email a description to the repository maintainer via the contact link on the GitHub profile [@ByteBenderSA](https://github.com/ByteBenderSA), or open a private security advisory:
<https://github.com/ByteBenderSA/companai/security/advisories/new>

Please include:

- A description of the issue and its potential impact
- Steps to reproduce (proof-of-concept code is welcome)
- Affected versions / commits if known

You can expect an acknowledgment within 72 hours and a fix or mitigation plan within 14 days for high-severity issues.

## Scope

In scope:
- The OSS application code in this repository (`src/`, `firestore.rules`, build config)
- The included Firestore security rules

Out of scope:
- Vulnerabilities in third-party dependencies (report those upstream)
- Issues that require an attacker to already control the victim's browser
- Self-XSS via user-supplied API keys (the user is trusting their own input)

## API key handling reminder

CompanAI is bring-your-own-key. Keys are stored in the user's browser via `localStorage` and sent directly to the AI provider. They never reach any server controlled by this project.

If you fork CompanAI and run a hosted version, **do not** put your own API keys in client-side code. Move AI calls to a backend.
