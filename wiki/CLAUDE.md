# BATC Wiki — Schema & Maintenance Rules

This wiki is a persistent, LLM-maintained knowledge base for two domains:
- **Project knowledge** — BATC codebase architecture, decisions, and session notes
- **Agricultural research** — Philippine agriculture programs, DA policy, RSBSA, and domain concepts

Claude Code maintains all wiki pages. Humans write raw sources. Humans read; Claude writes.

Working directory: `C:\Users\User\Desktop\agri_sys_next_ver`
Wiki root: `wiki/`
Raw sources: `raw/`

---

## Directory Contract

| Path | What goes here |
|---|---|
| `wiki/project/overview.md` | High-level BATC system summary — kept current as the system evolves |
| `wiki/project/decisions/` | One page per architectural or design decision (`YYYY-MM-DD-<topic>.md`) |
| `wiki/project/sessions/` | One page per notable build session (`YYYY-MM-DD-<what-was-done>.md`) |
| `wiki/research/overview.md` | Evolving synthesis of the Philippine agriculture domain |
| `wiki/research/entities/` | Named things: agencies (DA, NFA), programs (RSA, RSBSA), laws — lowercase kebab-case |
| `wiki/research/concepts/` | Ideas: RSBSA, FEFO, DPA, 4Ps, eligibility criteria — lowercase kebab-case |
| `wiki/sources/` | One summary page per ingested raw source (`YYYY-MM-DD-<slug>.md`) |
| `wiki/index.md` | Catalog of all pages — updated on every ingest |
| `wiki/log.md` | Append-only operation record |

Raw sources in `raw/` are NEVER modified by Claude.

---

## Page Frontmatter

Every wiki page (except `index.md` and `log.md`) MUST start with:

```yaml
---
title: <Page Title>
domain: project | research | source
type: overview | concept | entity | decision | session | source-summary
tags: [tag1, tag2]
sources: [sources/YYYY-MM-DD-slug.md]   # omit if none
updated: YYYY-MM-DD
---
```

---

## Workflow A: Ingest — Web Article

**Trigger:** User drops a clipped `.md` file into `raw/` and says "ingest raw/<filename>".

1. Read the raw source file in full
2. Surface 3–5 key takeaways; ask the user: "Anything to add or correct before I file this?"
3. Write `wiki/sources/YYYY-MM-DD-<slug>.md` with:
   - **Context:** what this source is, who produced it, why it matters to BATC
   - **Key facts:** bullet list of the most important claims
   - **Notable quotes:** direct quotes worth preserving (cite section if available)
   - **Gaps & uncertainties:** what's unclear or not covered
4. Identify affected `research/entities/` and `research/concepts/` pages:
   - Create pages that don't exist yet
   - Update existing pages — append new information, note any contradictions with prior sources inline as `> ⚠️ Contradiction: [prior claim] — [new claim] (source: [[sources/...]])`
5. If any `project/` page is affected (e.g., a research finding validates or challenges a BATC decision), update it
6. Update `wiki/index.md` — add new source row and any new/updated pages
7. Append to `wiki/log.md`:
   `## [YYYY-MM-DD] ingest | <Source Title>`

---

## Workflow B: Ingest — Session Note

**Trigger:** User describes a completed BATC build session or decision.

1. Ask: "What was the key architectural outcome, if any?"
2. Write `wiki/project/sessions/YYYY-MM-DD-<what-was-done>.md`:
   - **What was built:** feature or phase summary
   - **Why:** rationale, constraints considered
   - **Trade-offs made:** what was rejected and why
   - **Current state:** where the system stands after this session
3. If a durable architectural decision emerged, ALSO write:
   `wiki/project/decisions/YYYY-MM-DD-<decision-topic>.md` with:
   - **Decision:** one sentence stating the choice
   - **Context:** why this decision needed to be made
   - **Options considered:** what alternatives were evaluated
   - **Rationale:** why this option was chosen
   - **Consequences:** what this decision constrains or enables going forward
4. Update `wiki/project/overview.md` if the system-level picture changed
5. Update `wiki/index.md` and append to `wiki/log.md`:
   `## [YYYY-MM-DD] session | <Session Description>`

---

## Workflow C: Query

**Trigger:** User asks a question against the wiki.

1. Read `wiki/index.md` to identify relevant pages
2. Read the identified pages in full
3. Synthesize an answer with `[[wiki-link]]` citations (Obsidian-compatible)
4. If the answer is novel and worth preserving, offer to file it:
   - As a `research/concepts/` page if it's a domain insight
   - As a `project/decisions/` page if it clarifies an architectural choice
5. Append to `wiki/log.md`:
   `## [YYYY-MM-DD] query | <Question Summary>`

---

## Workflow D: Lint

**Trigger:** User says "lint the wiki" or requests a health check.

1. Read `wiki/index.md` as the manifest; read every listed page
2. Check for and report:
   - Contradictions between pages (flag both)
   - Stale claims superseded by newer sources
   - Orphan pages (no inbound `[[links]]` from any other page)
   - Concepts mentioned in page bodies but lacking their own `research/concepts/` page
   - Pages missing `sources:` frontmatter when they cite external data
3. Report as a numbered list: `[ISSUE TYPE] page-path: description`
4. Fix on user approval; update affected pages
5. Append to `wiki/log.md`:
   `## [YYYY-MM-DD] lint | Full wiki health check`

---

## Cross-Domain Linking Rules

- When a session note or decision references a domain concept (e.g., FEFO, DPA), add `[[research/concepts/fefo]]`
- When a research concept page has a direct implementation counterpart, add `[[project/decisions/...]]`
- Always use relative `[[wiki-link]]` syntax (Obsidian-compatible); never use absolute file paths in links
- Link text may differ from page title: `[[research/concepts/fefo|FEFO batch selection]]`

---

## Index Entry Format

```markdown
| [[path/to/page]] | One-line summary | domain | YYYY-MM-DD |
```

## Log Entry Format

```
## [YYYY-MM-DD] <operation> | <description>
```

Valid operations: `init`, `ingest`, `session`, `query`, `lint`
