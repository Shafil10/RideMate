# RideMate — Branching & Integration Workflow

Three members, three devices, one repo: `github.com/Shafil10/RideMate`.

## Branches

| Branch | Owner |
|---|---|
| `main` | protected — always the working, CI-passing version of the app |
| `member1-work` | rename to the actual person's name/feature when assigned |
| `member2-work` | rename to the actual person's name/feature when assigned |
| `member3-work` | rename to the actual person's name/feature when assigned |

To rename a branch (do this once, then tell the other two to re-fetch):
```
git branch -m member1-work <new-name>
git push origin -u <new-name>
git push origin --delete member1-work
```

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
