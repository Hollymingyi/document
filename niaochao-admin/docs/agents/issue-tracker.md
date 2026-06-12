# Issue Tracker

GitLab (self-hosted): http://47.117.85.102:3001

## Repositories

- Backend: `sunbin/gt-niaochao`
- Frontend: `sunbin/my-project`

## Usage

Uses `glab` CLI. When working in `gt-niaochao/`, issues go to `sunbin/gt-niaochao`. When working in `my-project/`, issues go to `sunbin/my-project`.

## Working directory mapping

The monorepo root `niaochao-admin/` is not itself a git repo. Skills should detect which sub-repo they are operating in by checking for `.git/config` in the current file path:

- Path contains `gt-niaochao` → use backend repo
- Path contains `my-project` → use frontend repo
