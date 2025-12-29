# Production Deployment Checklist
**Date:** 2025-01-27  
**Feature:** Date+Time Calendar Upgrade

---

## ✅ Pre-Deployment Verification

- [x] Code complete and lint-clean
- [x] Production build passes (`npm run build`)
- [x] TypeScript compilation successful
- [x] Database migration ready (`supabase/migrations/20240127_add_due_at.sql`)
- [x] RLS policies verified
- [x] Environment variables secure
- [x] Backwards compatibility maintained

---

## 🚀 Deployment Steps

### Step 1: Run Database Migration

1. Open **Supabase Dashboard** → **SQL Editor**
2. Copy entire contents of `supabase/migrations/20240127_add_due_at.sql`
3. Paste into SQL Editor
4. Click **"Run"**
5. Verify success (no errors)

**Verification Query:**
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

### Step 2: Verify Environment Variables (Vercel)

Ensure these are set in **Vercel Dashboard** → **Settings** → **Environment Variables**:

- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ `SUPABASE_SERVICE_ROLE_KEY` (server-only, not prefixed with `NEXT_PUBLIC_`)

### Step 3: Deploy to Vercel

```bash
git add .
git commit -m "Add date+time scheduling to calendar"
git push
# Vercel auto-deploys on push
```

### Step 4: Post-Deployment Verification

After deployment completes, manually test:

- [ ] Create timed task → verify "HH:mm" badge appears in month view
- [ ] Create all-day task → verify "All day" badge appears
- [ ] Click a date in calendar → verify timeline panel opens
- [ ] Verify timed tasks appear at correct hour in timeline
- [ ] Verify all-day tasks appear in "All day" section
- [ ] Edit task time → verify it moves to correct hour slot
- [ ] Table view still works (backwards compatibility)

---

## 📊 Post-Deployment Monitoring

### Immediate (First 24 Hours)

**Vercel Logs:**
- Monitor for 500 errors
- Check for database connection issues
- Verify no RLS policy violations

**Supabase Logs:**
- Check query performance
- Verify migration applied correctly
- Confirm indexes are being used

**Manual Testing:**
- Test all calendar features
- Verify time badges display correctly
- Test timeline view functionality

### Ongoing (First Week)

- [ ] Set up error logging (Sentry recommended)
- [ ] Monitor calendar view performance
- [ ] Track user feedback on timeline UX
- [ ] Monitor for any date/time parsing errors

---

## 🔍 Quick Reference

**Migration File:** `supabase/migrations/20240127_add_due_at.sql`  
**Full Report:** `FINAL_VERIFICATION_REPORT.md`  
**Implementation Guide:** `FINAL_DELIVERABLES.md`

**Key Features:**
- ✅ Month view with time badges ("HH:mm" or "All day")
- ✅ Day timeline view (hourly slots, 6 AM - 10 PM)
- ✅ All-day detection: `due_at` time == 00:00
- ✅ Backwards compatible: table view unchanged

**Design Decisions (Locked):**
- All-day = `due_at` time == 00:00 (no separate flag)
- Both `due_date` and `due_at` always populated
- Backfill: `due_date` → `due_at` at 00:00

---

## ✅ Sign-Off

**Status:** 🚀 **PRODUCTION READY**

All verification checks passed. Safe to deploy.

---

*Last updated: 2025-01-27*

