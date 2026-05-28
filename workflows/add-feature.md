# Workflow: Add a New Feature

**Objective:** Implement a new feature cleanly, verify it, and push to GitHub.

---

## Required Inputs
- Clear task description from Michael or Curt
- All ambiguities resolved before writing code (see CLAUDE.md §2.3)
- Confirmation of which files are in scope

## Steps

### 1. Understand the task fully
Before touching any file, confirm:
- [ ] What exactly needs to change (specific component/page/function)
- [ ] What the expected behaviour looks like
- [ ] Whether any backend (Supabase Edge Function) changes are needed
- [ ] Whether any database schema changes are needed

If anything is unclear, write the message for Curt using the template in CLAUDE.md §11.

### 2. Check existing tools and components
Before building anything new:
- Check `frontend/src/components/` for reusable UI already built
- Check `frontend/src/lib/` for existing utilities
- Check `supabase/functions/` for existing edge function logic
- Do not duplicate logic that already exists

### 3. Implement — in scope only
- Edit ONLY the files required for this task
- If you notice something else that needs fixing, flag it — do not fix it (CLAUDE.md §2.2)
- Follow the existing code style (TypeScript, Tailwind classes, shadcn/ui components)

### 4. Test locally
```bash
cd frontend
pnpm dev
```
Test the specific feature end-to-end:
- [ ] Happy path works
- [ ] Edge cases handled (empty state, error state, invalid input)
- [ ] Mobile view looks correct
- [ ] No TypeScript errors (`pnpm tsc --noEmit`)
- [ ] No console errors

### 5. Verify nothing else broke
Smoke test the adjacent pages/features:
- [ ] Homepage still loads
- [ ] Game board still works
- [ ] Login/logout still works

### 6. Get confirmation
Report what was built and how it was tested. Wait for Michael and Curt to confirm before pushing.

### 7. Push to GitHub (only after confirmation)
Follow `workflows/deploy.md` from Step 3 onward.

---

## Edge Cases
- If a feature requires a new database table or column, create a migration in `supabase/migrations/` and flag to Michael for review before applying to production.
- If Stripe, email, or any paid API is involved, confirm with Curt before running any test that might incur charges.
