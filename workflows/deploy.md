# Workflow: Deploy to Live Site

**Objective:** Deploy a tested build of the frontend to havagr8day.com (cPanel).

**⚠️ APPROVAL REQUIRED:** Do not start this workflow until both Curt AND Michael have explicitly confirmed the task is complete and working.

---

## Required Inputs
- Confirmed task working in local/staging environment
- Both Curt and Michael have signed off
- Clean git commit ready

## Steps

### 1. Build the frontend
```bash
cd frontend
pnpm install
pnpm build
```
Verify `frontend/dist/` was generated and `frontend/dist/index.html` exists.

### 2. Smoke test the build locally
```bash
pnpm preview
```
Open the local preview URL and verify:
- [ ] Homepage loads correctly
- [ ] Game board works (mark a cell, quantity counter, confirmation flow)
- [ ] Login / registration works
- [ ] Admin panel loads
- [ ] Wallet page loads
- [ ] No console errors

### 3. Commit to GitHub FIRST
```bash
cd .. # back to project root
git add -A
git commit -m "feat: [describe what was built]"
git push origin main
```
Verify push succeeded on GitHub before touching the live server.

### 4. Deploy to cPanel
```bash
python tools/deploy_to_cpanel.py
```
Confirm all files uploaded successfully (0 failures).

### 5. Verify live site
Open https://havagr8day.com and confirm:
- [ ] Page title is correct
- [ ] The new feature works as expected
- [ ] Nothing else broke (homepage, game, login)

### 6. Report
Tell Michael and Curt:
- What was deployed
- What was verified
- Any anomalies noticed

---

## Edge Cases
- If `deploy_to_cpanel.py` reports failures, do NOT consider the deployment done. Re-run or fix manually via cPanel file manager.
- If the live site looks broken after deploy, use `tools/check_server.py` to diagnose the server state.
- Never deploy partially built code. If `pnpm build` fails, fix the build before proceeding.
