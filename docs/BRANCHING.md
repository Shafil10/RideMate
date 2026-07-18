# RideMate — Branching & Integration Workflow

Three members, three devices, one repo: `github.com/Shafil10/RideMate`.

## Branches

| Branch | Owner |
|---|---|
| `main` | protected — always the working, CI-passing version of the app |
| `shafil` | Shafil |
| `sadid` | Sadid |
| `shafin` | Shafin |

## Branch isolation — how this actually works

All branches started as an identical copy of `main`, so right after creation they look the same — that's expected, not a bug. A branch only diverges once its owner commits on it. As long as each person stays checked out on **their own branch** before committing, their commits appear only on that branch; the other two branches and `main` are untouched until a PR is merged.

**Before every commit, double-check which branch you're on:**
```
git branch
```
The one with `*` next to it is where your commit will go. If it's not your branch, run `git checkout <your-name>` first.

## Daily workflow (each member, on their own device)

1. Sync before starting work:
   ```
   git checkout <your-branch>
   git pull origin <your-branch>
   ```
2. Make changes, then commit:
   ```
   git add .
   git commit -m "short description of what you did"
   ```
3. Push:
   ```
   git push
   ```
4. When a chunk of work is ready to join `main`, open a **Pull Request** on GitHub from `<your-branch>` into `main`.

## Integration rule: only error-free code reaches `main`

Every push and every PR automatically runs `.github/workflows/ci.yml` (lint + typecheck + build, for both `server/` and the frontend). A PR can only be merged once:
- The CI check shows a green ✅, and
- At least one teammate has reviewed it (recommended, optional to enforce)

See branch protection setup steps below — once enabled, GitHub physically blocks merging a PR whose CI is red.

## Keeping your branch up to date with `main`

After someone else's PR is merged into `main`, bring those changes into your own branch before continuing:
```
git checkout <your-branch>
git fetch origin
git merge origin/main
```
Fix any conflicts locally, commit, then `git push`.
