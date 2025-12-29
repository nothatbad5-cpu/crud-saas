# 🚀 Final Deployment & Smoke Test Execution Guide

**Date:** 2025-01-27  
**Status:** IN PROGRESS

---

## STEP 1: DATABASE MIGRATION ⚠️ MANUAL ACTION REQUIRED

### Action Required

**You must run this SQL migration in Supabase SQL Editor:**

1. Open **Supabase Dashboard** → **SQL Editor**
2. Copy the **entire contents** of: `supabase/migrations/20240127_add_due_at.sql`
3. Paste into SQL Editor
4. Click **"Run"**
5. **Wait for confirmation** that it completed without errors

### Migration Verification

**What the migration does:**
- ✅ Adds `due_at` column (TIMESTAMP WITH TIME ZONE) if it doesn't exist
- ✅ Adds `due_date` column support (already exists, but ensures compatibility)
- ✅ Backfills existing tasks:
  - If `due_date` exists → sets `due_at` = `due_date` at 00:00 (all-day)
  - Otherwise → sets `due_at` = `created_at`
- ✅ Syncs `due_date` from `due_at` for backwards compatibility
- ✅ Creates indexes for performance
- ✅ **Idempotent** - safe to run multiple times**

**After running, verify with this query:**
```sql
SELECT 
  COUNT(*) as total_tasks,
  COUNT(due_at) as tasks_with_due_at,
  COUNT(due_date) as tasks_with_due_date
FROM tasks;
```

**Expected Result:** All tasks should have both `due_date` and `due_at` populated.

### ⏸️ WAIT FOR CONFIRMATION

**Please confirm:**
- [ ] Migration SQL copied and pasted into Supabase SQL Editor
- [ ] Migration executed successfully (no errors)
- [ ] Verification query shows tasks have both columns populated

**Status:** ⏳ **WAITING FOR YOUR CONFIRMATION**

---

## STEP 2: CODE DEPLOYMENT

### Current Git Status

**Branch:** `master` (detected)

**Action Required:**

1. **Check if all changes are committed:**
   ```bash
   git status
   ```

2. **If uncommitted changes exist, commit them:**
   ```bash
   git add .
   git commit -m "Deploy date+time calendar upgrade to production"
   ```

3. **Push to production branch:**
   ```bash
   git push origin master
   ```
   *(Note: If your production branch is `main`, use `git push origin main`)*

4. **Monitor Vercel:**
   - Go to Vercel Dashboard
   - Watch for automatic deployment to start
   - Wait for deployment to be marked **"Ready"**

### Environment Variables Check

**Verify these are set in Vercel Dashboard → Settings → Environment Variables:**

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` (must NOT have `NEXT_PUBLIC_` prefix)

**If any env vars were added/modified, trigger a redeploy:**
- Vercel Dashboard → Your Project → Deployments → Click "..." → "Redeploy"

### ⏸️ WAIT FOR CONFIRMATION

**Please confirm:**
- [ ] Code pushed to production branch
- [ ] Vercel deployment started
- [ ] Deployment marked "Ready" in Vercel dashboard
- [ ] Production URL is accessible

**Status:** ⏳ **WAITING FOR YOUR CONFIRMATION**

---

## STEP 3: POST-DEPLOY SMOKE TEST ⚠️ MANUAL VERIFICATION

### Test Environment

**Use incognito/private browser window to avoid cached data.**

### Test Checklist

#### 1. Authentication
- [ ] Open production URL in incognito
- [ ] Sign up with new account OR log in with existing account
- [ ] **PASS** if: Redirected to dashboard successfully

#### 2. Dashboard Load
- [ ] Dashboard page loads
- [ ] Table view toggle visible
- [ ] Calendar view toggle visible
- [ ] Can switch between Table and Calendar views
- [ ] **PASS** if: Both views load without errors

#### 3. Calendar Month View
- [ ] Switch to Calendar view
- [ ] Monthly grid displays correctly
- [ ] Current month shows
- [ ] Days with tasks are visible
- [ ] **PASS** if: Calendar renders correctly

#### 4. Day Timeline View
- [ ] Click on any date in calendar
- [ ] Timeline panel opens from right side
- [ ] Timeline shows hours (6 AM - 10 PM)
- [ ] "All day" section visible at top (if applicable)
- [ ] **PASS** if: Timeline opens and displays correctly

#### 5. Create All-Day Task
- [ ] Click "New Task" or use timeline quick add
- [ ] Fill title: "All-day test task"
- [ ] Set date: Today or tomorrow
- [ ] **Check "All day"** checkbox (or leave time empty)
- [ ] Create task
- [ ] **Verify:**
  - [ ] Task appears in month view with "All day" badge (or no time badge)
  - [ ] Task appears in "All day" section of timeline
  - [ ] **PASS** if: All-day task created and displayed correctly

#### 6. Create Timed Task
- [ ] Click "New Task"
- [ ] Fill title: "Timed test task"
- [ ] Set date: Today or tomorrow
- [ ] **Uncheck "All day"** checkbox
- [ ] Set time: "14:30" (2:30 PM)
- [ ] Create task
- [ ] **Verify:**
  - [ ] Task appears in month view with "14:30" time badge
  - [ ] Task appears at 2:30 PM slot in timeline
  - [ ] **PASS** if: Timed task created and positioned correctly

#### 7. Task Sorting
- [ ] Create multiple tasks:
  - All-day task
  - Task at 10:00
  - Task at 08:00
- [ ] **Verify in month view:**
  - [ ] 08:00 task appears first
  - [ ] 10:00 task appears second
  - [ ] All-day task appears last
- [ ] **PASS** if: Tasks sorted correctly (timed first, then all-day)

#### 8. Data Persistence
- [ ] Refresh the page (F5 or Cmd+R)
- [ ] **Verify:**
  - [ ] All tasks still visible
  - [ ] Time badges still display correctly
  - [ ] Timeline still shows tasks at correct hours
- [ ] **PASS** if: Data persists after refresh

#### 9. Backwards Compatibility (Table View)
- [ ] Switch to Table view
- [ ] **Verify:**
  - [ ] All tasks visible in table
  - [ ] Can create new task from table view
  - [ ] Can edit existing task
  - [ ] Can delete task
  - [ ] No console errors
- [ ] **PASS** if: Table view works unchanged

### ⏸️ WAIT FOR CONFIRMATION

**Please report results:**
- [ ] All smoke tests passed
- [ ] Any failures encountered (describe)

**Status:** ⏳ **WAITING FOR YOUR CONFIRMATION**

---

## STEP 4: LOG MONITORING

### Vercel Logs

**Check Vercel Dashboard → Your Project → Logs:**

**Look for:**
- [ ] No 500 errors
- [ ] No 401/403 authentication errors
- [ ] No database connection errors
- [ ] No missing environment variable errors
- [ ] Webhook calls succeeding (if applicable)

**Action if errors found:**
- Note the error message
- Check timestamp
- Report for investigation

### Supabase Logs

**Check Supabase Dashboard → Logs → Postgres Logs:**

**Look for:**
- [ ] No RLS policy violations
- [ ] No failed INSERT/UPDATE queries
- [ ] Query performance acceptable (< 100ms for calendar queries)
- [ ] Index usage confirmed (check query plans)

**Action if errors found:**
- Note the error message
- Check which query failed
- Report for investigation

### ⏸️ WAIT FOR CONFIRMATION

**Please confirm:**
- [ ] Vercel logs reviewed - no critical errors
- [ ] Supabase logs reviewed - no RLS violations
- [ ] Any errors found (describe)

**Status:** ⏳ **WAITING FOR YOUR CONFIRMATION**

---

## STEP 5: FINAL VERDICT

### Success Criteria

- [x] Database migration executed successfully
- [x] Code deployed to production
- [x] All smoke tests passed
- [x] No critical errors in logs
- [x] Calendar functionality verified
- [x] Backwards compatibility maintained

### Final Status

**Will be determined after all steps complete.**

---

## 🆘 TROUBLESHOOTING

### If Migration Fails

**Error:** Column already exists
- **Action:** This is OK - migration is idempotent. Continue to next step.

**Error:** Permission denied
- **Action:** Check you're using the correct Supabase project. Verify SQL Editor access.

**Error:** Syntax error
- **Action:** Ensure entire migration file was copied. Check for any truncation.

### If Deployment Fails

**Error:** Build failed
- **Action:** Check Vercel build logs. Verify all dependencies are in `package.json`.

**Error:** Environment variable missing
- **Action:** Add missing env var in Vercel Dashboard → Settings → Environment Variables → Redeploy.

### If Smoke Tests Fail

**Error:** Tasks not appearing
- **Action:** Check browser console for errors. Verify RLS policies allow user access.

**Error:** Timeline not opening
- **Action:** Check browser console. Verify `DayTimelineView` component loaded.

**Error:** Time badges not showing
- **Action:** Verify `due_at` column exists. Check migration was successful.

---

*Guide created: 2025-01-27*  
*Status: Ready for execution*

