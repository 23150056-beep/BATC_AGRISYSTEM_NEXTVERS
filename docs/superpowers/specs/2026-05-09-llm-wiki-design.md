# LLM Wiki — Design Spec
**Date:** 2026-05-09
**Status:** Approved

---

## Purpose

A persistent, LLM-maintained knowledge base living inside the BATC project repository. It accumulates and cross-references knowledge across two domains:

- **Project knowledge** — BATC architecture decisions, session notes, what was built and why
- **Agricultural domain research** — Philippine agriculture programs, RSBSA, DA initiatives, barangay governance, and domain concepts that inform BATC design

The wiki compiles knowledge incrementally. When a new source is ingested, Claude integrates it into existing pages — updating cross-references, flagging contradictions, strengthening the synthesis — rather than re-deriving everything from scratch on every query.

---

## Location

```
C:\Users\User\Desktop\agri_sys_next_ver\
├── wiki/          ← LLM-maintained wiki (this system)
└── raw/           ← immutable raw sources (clipped articles, pastes, notes)
```

Lives inside the BATC git repo. Wiki commits alongside code. `raw/` can be gitignored if sources are large; `wiki/` is always committed.

---

## Directory Structure

```
wiki/
├── CLAUDE.md              ← schema: rules, workflows, conventions
├── index.md               ← catalog of all pages (updated every ingest)
├── log.md                 ← append-only chronological operation record
│
├── project/               ← BATC codebase knowledge
│   ├── overview.md        ← high-level system summary (kept current)
│   ├── decisions/         ← one page per architectural/design decision
│   └── sessions/          ← one page per notable build session
│
├── research/              ← Philippine agriculture domain knowledge
│   ├── overview.md        ← evolving domain synthesis
│   ├── entities/          ← named things: agencies, programs, laws
│   └── concepts/          ← ideas: RSBSA, DPA, FEFO, 4Ps, eligibility criteria
│
└── sources/               ← one summary page per ingested raw source
    └── YYYY-MM-DD-<slug>.md
```

### Page naming conventions

| Location | Convention | Example |
|---|---|---|
| `project/decisions/` | `YYYY-MM-DD-<topic>.md` | `2026-05-09-fefo-batch-selection.md` |
| `project/sessions/` | `YYYY-MM-DD-<what-was-done>.md` | `2026-05-09-phase-4-distribution.md` |
| `research/entities/` | lowercase kebab-case | `department-of-agriculture.md` |
| `research/concepts/` | lowercase kebab-case | `rsbsa.md`, `4ps-program.md` |
| `sources/` | `YYYY-MM-DD-<slug>.md` | `2026-05-09-da-rice-program.md` |

---

## Schema (`wiki/CLAUDE.md`)

The schema file is the most important artifact. It tells any Claude session — cold, with no prior context — how to maintain this wiki. It contains:

### 1. Identity & purpose
One paragraph: what this wiki is, who maintains it, the two domains.

### 2. Directory contract
A table mapping page types to directories (mirrors the structure above).

### 3. Page frontmatter anatomy

Every wiki page includes a YAML frontmatter block:

```yaml
---
title: RSBSA
domain: research          # project | research | source
type: concept             # concept | entity | decision | session | source-summary
tags: [rsbsa, registration, farmer-id]
sources: [sources/2026-05-09-rsbsa-overview.md]
updated: 2026-05-09
---
```

This enables:
- Obsidian Dataview queries (dynamic tables by tag, domain, date)
- Claude to build index entries programmatically
- Graph view edges in Obsidian

### 4. Workflow recipes

Three numbered step sequences Claude follows:

**Ingest** — read source → discuss key takeaways → write `sources/` summary → update/create affected `research/` or `project/` pages → update `index.md` → append to `log.md`

**Query** — read `index.md` → identify relevant pages → read them → synthesize answer with `[[wiki-link]]` citations → optionally file the answer as a new page

**Lint** — scan for contradictions, orphan pages, stale claims, missing cross-references → report findings → fix on request

---

## Ingest Workflows

### Path A — Web article (clipped via Obsidian Web Clipper)

1. Drop clipped `.md` file into `raw/` and tell Claude: *"ingest raw/2026-05-09-da-rice-program.md"*
2. Claude reads it, surfaces key takeaways for brief discussion
3. Claude writes `wiki/sources/YYYY-MM-DD-<slug>.md` — structured summary (context, key facts, notable quotes, gaps/uncertainties)
4. Claude identifies affected `research/entities/` and `research/concepts/` pages — creates missing ones, updates existing ones, notes contradictions
5. Claude updates `wiki/index.md` (new source row + any new/updated pages)
6. Claude appends one log entry to `wiki/log.md`

### Path B — Session note (BATC build session)

1. You describe what happened: *"We finished Phase 4 — here's what was decided about the distribution service"*
2. Claude writes `wiki/project/sessions/YYYY-MM-DD-<topic>.md` — what was built, why, trade-offs made
3. If a durable architectural decision emerged, Claude also writes `wiki/project/decisions/YYYY-MM-DD-<topic>.md`
4. Claude updates `wiki/project/overview.md` if the system-level picture changed
5. `index.md` and `log.md` updated as above

### Cross-domain linking

When a session note references a domain concept (e.g., FEFO, DPA consent), Claude adds `[[research/concepts/fefo]]` links. When a research page has implementation implications, it links back to `[[project/decisions/...]]`. Obsidian renders these as graph edges.

---

## Index & Log Format

### `index.md` — content-oriented catalog

Organized by category. Each row: link, one-line summary, domain, last updated.

```markdown
## Project — Decisions
| Page | Summary | Updated |
|---|---|---|
| [[project/decisions/2026-05-09-fefo-batch-selection]] | Why FEFO was chosen over manual batch pick | 2026-05-09 |

## Research — Concepts
| Page | Summary | Updated |
|---|---|---|
| [[research/concepts/rsbsa]] | Registry System for Basic Sectors in Agriculture | 2026-05-09 |

## Sources
| Page | Summary | Updated |
|---|---|---|
| [[sources/2026-05-09-da-rice-program]] | DA certified rice seeds distribution guidelines | 2026-05-09 |
```

### `log.md` — chronological operation record

Append-only. Each entry starts with a parseable prefix:

```markdown
## [2026-05-09] ingest | DA Certified Rice Seeds Distribution Guidelines
## [2026-05-09] session | Phase 4 complete — distribution service + delivery lifecycle
## [2026-05-09] query   | What barangays qualify for RSA-2026-Q1?
## [2026-05-09] lint    | Full wiki health check
```

Grep-friendly: `grep "^## \[" wiki/log.md | tail -5` gives the last 5 operations.

---

## Future Evolution

- **Search:** If the wiki grows past ~100 pages, add `qmd` (local BM25/vector search with MCP server). The index-file approach is enough until then.
- **Split:** When project and research feel like separate concerns, move `wiki/project/` and `wiki/research/` into separate repos. The frontmatter `domain:` field makes migration mechanical.
- **Obsidian plugins to consider:** Dataview (frontmatter queries), Marp (slide decks from wiki content), Web Clipper (already assumed).

---

## What Is Out of Scope (for now)

- Search engine / CLI tooling
- PDF or image-heavy source handling
- Automated ingest (all ingests are human-initiated)
- Separate wikis (start unified, split later)
- Any wiki page written by hand (Claude writes all wiki content; humans write raw sources)
