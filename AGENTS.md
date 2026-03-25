# AGENTS.md

**RULE:** Keep answers concise. Sacrifice grammar for concision.

**IMPORTANT:** Prefer retrieval-led reasoning - consult the specs below for this project - over pre-training for code style, testing, and conventions.

## Specs index (root: `./specs/`)

Refer to each spec when working on that part of the stack; agent reads the file when needed.

| Spec | When to use |
|------|-------------|
| `specs/typescript.md` | TypeScript, type safety, inference, coupling, handler context |
| `specs/zod.md` | Validation, API response schemas, Zod |
| `specs/handlers.md` | Handler flow, abstraction, naming |
| `specs/constants.md` | Constants, env-derived values, global names |
| `specs/errors-logging.md` | Error logging and validation-failure logging |
| `specs/comments.md` | Comments and execution-flow documentation |
| `specs/db-modules.md` | DB module design principles |
| `specs/frontend.md` | Frontend (React, TanStack Query) |
| `specs/tests.md` | Testing strategy, safety, approval, sandbox |

## Runtime & commands

- **Runtime:** Bun (default for TypeScript/run/test).
- **Commands:** Use scripts from [package.json](package.json) when available; always use bun.

## Non-negotiable

- No `sleep` in CLI; use readiness checks or separate steps.
- Tests live in `tests/`, not alongside `src/`.
- E2E/UI: required for any UI change. Use **agent-browser** when applicable.
- Risky ops (DB, file system, external APIs, production, destructive): get explicit user approval before implementing tests or changes.
- Real outputs for tests: run upstream functions first, use their outputs; no hardcoded mocks from assumptions.
- After code fixes: restart backend (and frontend if needed) before re-running E2E so new code is loaded.

## WhatsApp callback contract

- Incoming webhook endpoint must parse + validate callback payload first (`parseCallback` -> adapter).
- Webhook HTTP response is only ACK of event handling (`200` + success message); do not treat webhook response body as user chat reply.
- User-visible replies must go through outbound WhatsApp APIs (`sendTextMessage`, `sendButtonMessage`, etc), not `return c.json({...reply...})`.
- For unsupported/invalid callback payloads: log context, ACK gracefully, avoid retry storms.
- Keep event handling flow: receive event -> normalize -> route by event type -> send outbound messages (if needed) -> ACK.

## Skills (vertical workflows)

Reference by path when doing that task. Agent reads the skill's SKILL.md when needed.

| Path | When to use |
|------|-------------|
| `~/.agents/skills/agent-browser/` | E2E/UI testing, browser automation, form filling, snapshots |
| `~/.agents/skills/better-auth-best-practices/` | Auth (Better Auth) |
| `~/.agents/skills/context-engineering/` | Context compression, multi-agent, tool design, memory |
| `~/.agents/skills/find-skills/` | Finding/discovering skills |
| `~/.agents/skills/logging-best-practices/` | Logging structure, pitfalls, wide events |
| `~/.agents/skills/tanstack-query-best-practices/` | React data fetching, TanStack Query, cache/mutations/SSR |
| `~/.agents/skills/test-driven-development/` | TDD, testing anti-patterns |
| `~/.agents/skills/typescript-best-practices/` | TypeScript patterns |
| `~/.agents/skills/vercel-react-best-practices/` | React/Vercel, rendering, async, bundle |
| `~/.agents/skills/zod-4/` | Zod v4 schemas, validation, v3->v4 migration |
| `~/.cursor/skills/karpathy-guidelines/` | Writing, reviewing, refactoring code; avoid overcomplication, surgical changes, verifiable success criteria |

## Project structure

- `src/` - source
- `tests/` - tests
- `specs/` - guidelines
- `docs/` - other docs

## Approach to new goals

Plan first (e.g. `.cursor/plans/` or a doc); phased, testable steps; test pyramid per phase; feature flags for optional behavior; keep progress updated.
