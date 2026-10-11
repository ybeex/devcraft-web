# Checkpoint 38 — Frontend: Engine Choice Made Explicit in the Lesson Editor

Frontend side of checkpoint 38 — see `devcraft-api`'s own
`CHECKPOINT_38_CHANGELOG.md` for the real-SQL-execution side this
supports.

## What shipped

`LessonEditorForm`'s Language field already offered `sql` alongside
`javascript`/`typescript`/`python` (since checkpoint 28) — the raw
ability to pick either was never missing. What was missing was making
that choice *legible*: nothing in the form explained that, for a
SQL-topic lesson, "JavaScript" and "SQL" represent two genuinely
different grading strategies (simulate the logic vs. run a real query
against SQLite), not just a syntax-highlighting preference.

Added a contextual note that appears under the language row, specific to
whichever of `sql`/`javascript` is currently selected:

- **SQL selected**: explains it runs as real SQL against SQLite via
  Judge0, describes the `CREATE VIEW` + `SELECT CASE WHEN ... END`
  pattern a "write a query" exercise needs, and points at the Joins &
  Aggregates lesson (`be-sql`, now real SQL as of this checkpoint) as a
  working example.
- **JavaScript selected**: explains when simulating logic in JS is the
  right call instead — when standing up the real engine isn't practical
  for grading, or the exercise is really a decision/classification task
  rather than "write a query" — and points at Schema Design / Indexes &
  EXPLAIN (`be-sql`) and REST API Design (`be-rest-apis`) as examples of
  that pattern.

No new field, no schema change — `language` already was the mechanism;
this makes picking between the two an informed decision instead of
whichever one a content author happens to reach for out of habit.

## Verification

```
tsc --noEmit: clean
next build:   clean — no new routes (this is additive UI on the
              existing lesson editor), everything else unchanged,
              including /interview/system-design/[slug] from
              checkpoint 31.
```
