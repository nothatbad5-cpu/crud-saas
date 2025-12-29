# Date+Time Calendar Upgrade - Verification Checklist

**Use this checklist to verify the upgrade works correctly in local and production environments.**

---

## 🔧 Pre-Deployment (Local)

### 1. Database Migration
- [ ] Open Supabase Dashboard → SQL Editor
- [ ] Copy contents of `supabase/migrations/20240127_add_due_at.sql`
- [ ] Run the migration
- [ ] Verify no errors
- [ ] Run verification query:
  ```sql
  SELECT id, title, due_date, due_at, 
         CASE 
           WHEN due_at IS NOT NULL AND EXTRACT(HOUR FROM due_at) = 0 
           THEN 'All-day' 
           ELSE 'Timed' 
         END as task_type
  FROM tasks 
  LIMIT 10;
  ```
- [ ] Verify `due_at` column exists and is populated

### 2. Local Dev Server
- [ ] Run `npm run dev`
- [ ] Verify server starts without errors
- [ ] Check console for any warnings

### 3. Basic Functionality
- [ ] Sign up / Login works
- [ ] Dashboard loads
- [ ] Table view still works (unchanged)
- [ ] Calendar view loads

---

## 📅 Month View Testing

### Test 1: Time Badges
- [ ] Create a timed task (09:30)
- [ ] Verify task shows "09:30" badge in month view
- [ ] Create an all-day task
- [ ] Verify task shows "All day" badge (or no time) in month view

### Test 2: Task Sorting
- [ ] Create tasks:
  - All-day task
  - Task at 10:00
  - Task at 08:00
- [ ] Verify in month view: 08:00 appears first, then 10:00, then all-day

### Test 3: Task Display
- [ ] Verify task chips are clickable
- [ ] Verify time badges are visible
- [ ] Verify task count displays correctly

---

## 📆 Day Timeline View Testing

### Test 1: Open Timeline
- [ ] Click a date in calendar
- [ ] Verify timeline panel opens from right
- [ ] Verify timeline shows hours 6 AM - 10 PM
- [ ] Verify "All day" section at top (if all-day tasks exist)

### Test 2: Timed Tasks in Timeline
- [ ] Create task at 14:00 (2 PM)
- [ ] Click the date
- [ ] Verify task appears at 2 PM in timeline
- [ ] Verify task shows time "14:00" or "2 PM"

### Test 3: All-Day Tasks
- [ ] Create all-day task
- [ ] Click the date
- [ ] Verify task appears in "All day" section
- [ ] Verify task does NOT appear in hourly timeline

### Test 4: Multiple Tasks
- [ ] Create tasks at different times:
  - 08:00
  - 14:00
  - All-day
- [ ] Click the date
- [ ] Verify all tasks appear in correct locations
- [ ] Verify tasks are sorted correctly

### Test 5: Empty Hour Slots
- [ ] Click an empty hour slot (e.g., 15:00)
- [ ] Verify input field updates with "Add task at 3 PM..."
- [ ] Enter task title and submit
- [ ] Verify task created at 15:00
- [ ] Verify task appears at 3 PM in timeline

---

## ✏️ Create/Edit Modal Testing

### Test 1: Create Timed Task
- [ ] Click "New Task" button
- [ ] Fill title: "Test Timed"
- [ ] Uncheck "All day" checkbox
- [ ] Set time: "14:30"
- [ ] Click "Create"
- [ ] Verify task created with time
- [ ] Verify task shows time in calendar

### Test 2: Create All-Day Task
- [ ] Click "New Task"
- [ ] Fill title: "Test All-Day"
- [ ] Ensure "All day" is checked (default)
- [ ] Click "Create"
- [ ] Verify task created as all-day
- [ ] Verify task shows "All day" in calendar

### Test 3: Edit Task Time
- [ ] Click existing task → Edit
- [ ] Change from all-day to timed (09:00)
- [ ] Save
- [ ] Verify task shows "09:00" in month view
- [ ] Verify task appears at 9 AM in timeline

### Test 4: Edit Task to All-Day
- [ ] Click timed task → Edit
- [ ] Check "All day"
- [ ] Save
- [ ] Verify task shows "All day" in month view
- [ ] Verify task appears in "All day" section in timeline

### Test 5: Validation
- [ ] Try to create task with invalid time format
- [ ] Verify error message appears
- [ ] Try to create task without title
- [ ] Verify form doesn't submit

---

## 🔄 Drag & Drop Testing

### Test 1: Drag Between Dates
- [ ] Drag a timed task (e.g., 14:00) to different date
- [ ] Verify task moves to new date
- [ ] Verify time is preserved (still 14:00)
- [ ] Verify task appears at 2 PM on new date

### Test 2: Drag All-Day Task
- [ ] Drag an all-day task to different date
- [ ] Verify task moves
- [ ] Verify task remains all-day

---

## 🧪 Playwright Tests

### Run Tests
```bash
# Start dev server first
npm run dev

# In another terminal
npx playwright test tests/calendar.spec.ts
```

### Expected Results
- [ ] All existing calendar tests pass
- [ ] New timed task test passes
- [ ] Timeline view test passes
- [ ] All-day task test passes

---

## 🚀 Production (Vercel) Verification

### Pre-Deployment
- [ ] Run migration in production Supabase
- [ ] Verify migration completed successfully
- [ ] Check task counts: `SELECT COUNT(*) FROM tasks;`
- [ ] Verify no data loss

### Post-Deployment
- [ ] Deploy to Vercel
- [ ] Verify build succeeds
- [ ] Check Vercel logs for errors
- [ ] Test in production:
  - [ ] Create timed task
  - [ ] Create all-day task
  - [ ] Edit task time
  - [ ] View timeline
  - [ ] Drag & drop

### Monitoring
- [ ] Check error rates in Vercel
- [ ] Monitor Supabase query performance
- [ ] Check user reports (if any)

---

## 🔍 Edge Cases to Test

### Date/Time Edge Cases
- [ ] Create task at 00:00 (midnight) → should be all-day
- [ ] Create task at 23:59 (end of day)
- [ ] Create task on leap year date (Feb 29)
- [ ] Create task in different timezone (if applicable)

### UI Edge Cases
- [ ] Calendar with many tasks (10+ per day)
- [ ] Timeline with tasks at every hour
- [ ] Very long task titles
- [ ] Tasks spanning multiple days (if supported)

### Data Edge Cases
- [ ] Task with `due_at` but no `due_date` (should work)
- [ ] Task with `due_date` but no `due_at` (should fallback)
- [ ] Task with both `due_at` and legacy `start_time` (should prefer `due_at`)

---

## 📊 Performance Checks

### Load Times
- [ ] Calendar view loads in < 2 seconds
- [ ] Timeline view loads in < 1 second
- [ ] Task creation completes in < 1 second

### Database Queries
- [ ] Check Supabase dashboard → Logs
- [ ] Verify queries use indexes
- [ ] Check query execution times

---

## ✅ Final Sign-Off

### Local
- [ ] All tests pass
- [ ] All manual tests pass
- [ ] No console errors
- [ ] No TypeScript errors

### Production
- [ ] Migration successful
- [ ] Deployment successful
- [ ] All functionality works
- [ ] No user-facing errors
- [ ] Performance acceptable

---

## 🐛 If Issues Found

### Common Issues

**Issue:** Tasks not showing time badges
- **Fix:** Check `due_at` is populated in database
- **Fix:** Verify `formatTimeBadge()` function works

**Issue:** Timeline not showing tasks
- **Fix:** Check `groupTasksByDate()` uses `due_at`
- **Fix:** Verify tasks have valid `due_at` values

**Issue:** All-day tasks showing times
- **Fix:** Check `isAllDayTask()` logic
- **Fix:** Verify time == 00:00 for all-day tasks

**Issue:** Drag & drop not preserving time
- **Fix:** Check `updateTaskDate()` preserves time
- **Fix:** Verify `extractTimeFromDueAt()` works

---

**Checklist Complete!** ✅

Once all items are checked, the upgrade is ready for production use.

