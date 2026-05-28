# Workflow: GitHub Push Checklist

**Objective:** Ensure every push to GitHub is clean, intentional, and verified.

**Rule:** Never push unless this checklist is fully complete.

---

## Pre-Push Checklist

### Code
- [ ] The feature/fix works as described
- [ ] No debug logs, console.logs, or TODO comments left in
- [ ] No hardcoded credentials, passwords, or API keys in any file
- [ ] TypeScript compiles clean (`pnpm tsc --noEmit`)
- [ ] Only the files for this task are modified (`git diff --stat` to verify)

### Testing
- [ ] Feature tested end-to-end locally
- [ ] Adjacent features smoke-tested (nothing broke)
- [ ] Mobile view checked if frontend was changed

### Approval
- [ ] Michael has confirmed task is complete
- [ ] Curt has confirmed task is complete
- [ ] Both confirmed in the current conversation (not assumed from a previous session)

### Git
- [ ] `git status` shows only expected files
- [ ] `git diff --stat` reviewed — no surprise files included
- [ ] Commit message is clear and specific (e.g. `fix: enforce centre square as REFER A PLAYER`)
- [ ] No force-push to main — ever

## Push Commands
```bash
git status                    # confirm only expected files
git diff --stat               # review what changed
git add [specific files]      # add only what was worked on
git commit -m "type: message" # clear, specific message
git push origin main          # push
```

## After Push
- [ ] Confirm push succeeded on GitHub
- [ ] Report to Michael and Curt with: what was pushed, commit link
