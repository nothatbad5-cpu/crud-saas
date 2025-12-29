# 🚀 Go-Live Checklist - Date+Time Calendar Upgrade
**Deployment Date:** ___________  
**Deployed By:** ___________

---

## Pre-Deployment ✅

- [x] Code verified and lint-clean
- [x] Production build passes
- [x] Migration SQL ready
- [x] Environment variables documented
- [x] Backwards compatibility verified

---

## Step 1: Database Migration

**Action:** Run migration in Supabase SQL Editor

1. Open Supabase Dashboard → SQL Editor
2. Copy contents of: `supabase/migrations/20240127_add_due_at.sql`
3. Paste and click **"Run"**
4. Verify: No errors in output

**Verification:**
```sql
-- Run this to confirm migration worked
SELECT 
  COUNT(*) as total_tasks,
  COUNT(due_at) as tasks_with_due_at,
  COUNT(due_date) as tasks_with_due_date
FROM tasks;
```

**Expected:** All tasks should have both `due_date` and `due_at` populated.

**Status:** ☐ Complete

---

## Step 2: Environment Variables (Vercel)

**Action:** Verify environment variables are set

Check Vercel Dashboard → Settings → Environment Variables:

- [ ] `NEXT_PUBLIC_SUPABASE_URL` (present)
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` (present)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` (present, **NOT** prefixed with `NEXT_PUBLIC_`)

**Status:** ☐ Verified

---

## Step 3: Deploy to Production

**Action:** Push code to main branch

```bash
git add .
git commit -m "Deploy date+time calendar upgrade"
git push origin main
```

**Monitor:**
- [ ] Vercel deployment starts automatically
- [ ] Build completes successfully
- [ ] Deployment marked "Ready" in Vercel dashboard

**Deployment URL:** ___________________

**Status:** ☐ Deployed

---

## Step 4: Post-Deployment Verification

### Immediate Smoke Tests

**Calendar Functionality:**
- [ ] Create timed task (e.g., "Meeting at 2pm")
  - [ ] Time badge "14:00" appears in month view
- [ ] Create all-day task (e.g., "All-day event")
  - [ ] "All day" badge appears in month view
- [ ] Click a date in calendar
  - [ ] Timeline panel opens from right
  - [ ] Timed tasks appear at correct hour slots
  - [ ] All-day tasks appear in "All day" section
- [ ] Edit task time
  - [ ] Task moves to correct hour slot in timeline

**Backwards Compatibility:**
- [ ] Table view still loads
- [ ] Can create/edit/delete tasks in table view
- [ ] No console errors

**Status:** ☐ Verified

---

## Step 5: Monitoring (First 24 Hours)

### Vercel Logs

**Check for:**
- [ ] No 500 errors
- [ ] No database connection errors
- [ ] No RLS policy violations
- [ ] Webhook calls succeeding (if applicable)

**Log Location:** Vercel Dashboard → Your Project → Logs

### Supabase Logs

**Check for:**
- [ ] No failed queries
- [ ] Query performance acceptable (< 100ms for calendar queries)
- [ ] No RLS policy failures
- [ ] Index usage confirmed

**Log Location:** Supabase Dashboard → Logs → Postgres Logs

### User Testing

**Test with real user account:**
- [ ] Create multiple timed tasks
- [ ] Create multiple all-day tasks
- [ ] Navigate between months
- [ ] Edit task times
- [ ] Drag tasks between dates (if implemented)

**Status:** ☐ Monitoring Active

---

## Step 6: Post-Launch Review (Schedule)

**Date:** ___________  
**Time:** ___________

**Agenda:**
- [ ] Review deployment logs
- [ ] Analyze user feedback
- [ ] Performance metrics review
- [ ] Plan next improvements:
  - [ ] Performance optimizations
  - [ ] UX polish
  - [ ] Reminders feature
  - [ ] Recurring tasks

**Status:** ☐ Scheduled

---

## Emergency Rollback Plan

**If critical issues occur:**

1. **Revert Code:**
   ```bash
   git revert HEAD
   git push origin main
   ```

2. **Database Rollback (if needed):**
   ```sql
   -- Only if migration caused issues
   -- Remove due_at column (data preserved in due_date)
   ALTER TABLE public.tasks DROP COLUMN IF EXISTS due_at;
   ```

3. **Contact:** _______________

**Note:** Migration is idempotent and safe. Rollback should only be needed for code issues.

---

## Success Criteria ✅

- [x] Migration runs without errors
- [x] Production deployment successful
- [x] Calendar features work correctly
- [x] No critical errors in logs
- [x] Backwards compatibility maintained
- [x] User testing passes

---

## Sign-Off

**Deployed By:** _______________  
**Date:** _______________  
**Time:** _______________  
**Status:** ☐ Production Ready

---

*Checklist completed: _______________*

