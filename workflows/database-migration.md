# Workflow: Database Migration

**Objective:** Safely add or modify database schema in Supabase.

**⚠️ HIGH RISK:** Always get Michael and Curt's approval before running a migration on the production database.

---

## Required Inputs
- Clear description of schema change needed
- Michael has reviewed the migration SQL
- Backup confirmed (or acknowledged as safe to proceed without)

## Steps

### 1. Write the migration file
Create a new file in `supabase/migrations/` with this naming pattern:
```
YYYYMMDDHHMMSS_description_of_change.sql
```
Example: `20260601120000_add_deed_quantity_column.sql`

### 2. Write safe SQL only
```sql
-- Always use IF NOT EXISTS / IF EXISTS guards
ALTER TABLE good_deeds ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 1;

-- Never DROP without explicit instruction from Curt or Michael
-- Never truncate or delete data without explicit instruction
```

### 3. Test locally first
```bash
supabase db reset   # resets local DB and replays all migrations
```
Verify the migration runs without error.

### 4. Verify application still works
Start the local dev server and test any feature that touches the changed table.

### 5. Get approval before applying to production
Write a summary of:
- What the migration adds/changes
- Why it is needed
- Whether it is reversible

Wait for explicit "go ahead" from Michael AND Curt.

### 6. Apply to production (only after approval)
```bash
supabase db push
```
Monitor for errors.

### 7. Verify production
Test the live feature that depends on the migration.

---

## Edge Cases
- If a migration involves removing a column or dropping a table, confirm twice with both Michael and Curt. Destructive migrations can cause data loss.
- The Supabase public schema grant change (effective October 30, 2026): any new table must have explicit grants added. Template:
  ```sql
  GRANT SELECT, INSERT, UPDATE, DELETE ON your_new_table TO anon, authenticated;
  ```
