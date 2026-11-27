# Codex workflow

## A. Session startup

- Start with [`AGENTS.md`](../AGENTS.md) and the affected entry point. Read the handoff when resuming relevant work. Check important claims against the current implementation before relying on them.
- Read only task-relevant files. Use targeted `rg` searches and line ranges. Reuse prior reads of unchanged code. Expand the scope when evidence points to another file or shared system. Skip unrelated repository audits.

## B. Task execution

- Inspect the existing implementation, investigate each problem once, then implement and verify in the same turn when possible. Carry forward established findings. When verification fails, diagnose that failure and resume from the last confirmed state.
- Make focused changes, reuse existing components, utilities, and assets, and preserve unrelated work. Change as many files as correctness requires. Avoid unrelated refactoring.
- Proceed when the task is clear. Keep progress updates brief and focused on material findings or blockers. Avoid repeating explanations or plans.

## C. Token efficiency

- Batch independent commands and combine related operations when practical. Skip empty calls, redundant searches, and diagnostics without a concrete question. Search the web only when the task requires it.
- Limit output at the source. Save full logs and intermediate captures on disk. Return exit status and concise excerpts or summaries.
- Reuse initialized tools, browser sessions, and loaded tabs. Initialize again only when the existing session is unavailable or unsuitable.

## D. Visual verification

- Inspect rendered output for UI changes. Use existing QA scripts and valid baseline screenshots. Capture new images only for affected states that need fresh evidence.
- Use contact sheets for multi-room comparisons and individual crops for defects. Observe motion live or compare frames. If browser capture fails, report which visual checks remain unverified.

## E. Completion criteria

- Implement the requested behavior and verify the smallest affected behavior first. Run relevant tests, typechecks, and UI checks. Broaden coverage when shared dependencies or regression risk warrant it. Repeat a passing check only after a relevant change or when its result is no longer valid.
- Stop once implementation and relevant verification are complete. Report what was completed, what remains partial or unverified, and which platforms were checked. A plan or passing typecheck alone cannot establish that the requested behavior works.

## F. Session handoff

- Use [`NEXT_SESSION.md`](../NEXT_SESSION.md) as the sole session handoff. Keep it under 250 words and update it at meaningful milestones. Preserve unrelated active notes.
- Record the objective, completed and remaining work, relevant paths, checks and results, known failures, and the next action.

## G. Fresh session rules

- Recommend a fresh session when accumulated history is mostly irrelevant or is slowing the next task. Use `/compact` when continuing an unfinished task would benefit from less context.
- Resume from the actual repository state. Never delete or reset project files to clear conversation context.

## H. Development priorities

1. Correctness
2. Completing the requested work
3. Visual quality
4. Preserving existing functionality
5. Token efficiency

Keep necessary debugging, testing, and visual iteration in scope. Avoid arbitrary tool-call limits.
