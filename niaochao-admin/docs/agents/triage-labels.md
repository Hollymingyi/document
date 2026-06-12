# Triage Labels

Five canonical roles used by the `triage` skill when processing incoming issues.

| Role | Label | Meaning |
|------|-------|---------|
| needs-triage | `needs-triage` | Maintainer needs to evaluate |
| needs-info | `needs-info` | Waiting on reporter for more details |
| ready-for-agent | `ready-for-agent` | Fully specified, AFK agent can pick it up |
| ready-for-human | `ready-for-human` | Needs human implementation |
| wontfix | `wontfix` | Will not be actioned |

## Creating labels

If labels don't exist yet in the GitLab project, create them via `glab label create`.

## State machine

```
new issue → needs-triage
  → needs-info (clarification needed)
  → ready-for-agent (spec complete, agent can do it)
  → ready-for-human (needs a person)
  → wontfix (closed, won't act)
```
