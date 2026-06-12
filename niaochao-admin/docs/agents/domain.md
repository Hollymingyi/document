# Domain Docs

## Layout

Multi-context. The monorepo root has a `CONTEXT-MAP.md` that points to per-context glossaries.

```
niaochao-admin/
├── CONTEXT-MAP.md
├── docs/adr/              ← system-wide decisions (if any)
├── gt-niaochao/
│   ├── CONTEXT.md         ← backend domain glossary
│   └── docs/adr/          ← backend architecture decisions
└── my-project/
    ├── CONTEXT.md         ← frontend domain glossary
    └── docs/adr/          ← frontend architecture decisions
```

## Reading rules

1. Always read `CONTEXT-MAP.md` first to discover available contexts.
2. Before working in a sub-repo, read its `CONTEXT.md` for domain language.
3. Check `docs/adr/` for architecture decisions that should not be re-litigated.
4. When a new term is resolved during a `/grill-with-docs` session, update the relevant `CONTEXT.md`.

## CONTEXT.md format

See `.claude/skills/grill-with-docs/CONTEXT-FORMAT.md` for the canonical format. Each `CONTEXT.md` is a glossary only — no implementation details.
