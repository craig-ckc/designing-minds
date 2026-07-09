# Agent Instructions

Be concise. Be explicit. Do not leave ambiguous decisions hidden in implementation.

## Working Model

- Gather only the context needed for the task.
- Start from the user's request and the directly affected files.
- Expand into tests, docs, wider code search, or GitHub context only when ambiguity, risk, or task size justifies it.
- Avoid loading unrelated context just because it exists.
- Combine the user's request with the project context you intentionally gathered.
- If the objective is not at least 95% clear, ask the user before implementing.
- If the objective is clear but details are discoverable, proceed and learn from the codebase.
- Stop and ask when a decision has high architectural, security, data, or product impact.
- Take initiative on clear, low-risk issues found while working.
- Ask before fixing issues that may be intentional, disputed, broad, architectural, security-sensitive, or data-sensitive.
- Tell the user when you fix an adjacent issue.

## Git And GitHub

- Never create a branch unless the user explicitly asks for one.
- Never commit, push, open a PR, merge, or close issues without explicit permission.
- Reconfirm before each branch, commit, push, PR, merge, or issue-closing action unless the user clearly grants autonomous control for that work.
- Create or update GitHub issues intentionally when a bug, deferred decision, missing spec, or follow-up is worth tracking outside the current change.
- Before creating an issue, weigh severity, likelihood, project direction, duplication, and whether the current task should fix it instead.
- If the user says to ignore or drop something, do not track or fix it.
- If the user says to skip something for now, track it only when it is still worth doing later.

## Tests

- Add or update tests for every behavior change.
- Cover normal behavior, failure cases, boundaries, and regressions that could plausibly break.
- Prefer focused tests near the changed behavior, then broaden only when shared contracts are affected.
- Run the relevant tests before finishing. If you cannot run them, say why.

## Docs

- Keep docs thin and useful.
- Do not create large local specs, phase plans, or roadmap documents for unresolved work.
- Use GitHub issues for unresolved work that should be tracked.
- Update docs only when behavior, architecture, commands, or contracts actually change.
