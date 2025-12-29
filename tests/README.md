# Playwright E2E Tests

## Overview

This directory contains End-to-End (E2E) tests for the SaaS application using Playwright.

## Test Coverage

- **Auth Flow** (`auth.spec.ts`): Sign up, login, logout
- **Dashboard** (`dashboard.spec.ts`): Task CRUD operations
- **Calendar** (`calendar.spec.ts`): Calendar view, day panel, inline creation
- **Free Plan** (`free-plan.spec.ts`): Task limit enforcement

## Prerequisites

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Create `.env.local` with:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Install Playwright Browsers** (if not already done)
   ```bash
   npx playwright install chromium
   ```

## Running Tests

### Run All Tests
```bash
npx playwright test
```

### Run Specific Test File
```bash
npx playwright test tests/auth.spec.ts
```

### Run in Headed Mode (See Browser)
```bash
npx playwright test --headed
```

### Run in UI Mode (Interactive)
```bash
npx playwright test --ui
```

### Run in Debug Mode
```bash
npx playwright test --debug
```

### Run Specific Test by Name
```bash
npx playwright test -g "should create a new task"
```

## Debugging Failed Tests

### 1. View Test Report
After tests run, open the HTML report:
```bash
npx playwright show-report
```

### 2. View Screenshots
Failed tests automatically capture screenshots in `test-results/`

### 3. View Videos
Videos are recorded on failure and saved in `test-results/`

### 4. View Traces
Traces are captured on first retry. View with:
```bash
npx playwright show-trace test-results/.../trace.zip
```

### 5. Run Single Test in Debug Mode
```bash
npx playwright test tests/auth.spec.ts --debug
```

## Test Structure

```
tests/
├── auth.spec.ts          # Authentication flows
├── dashboard.spec.ts     # Dashboard CRUD
├── calendar.spec.ts      # Calendar interactions
├── free-plan.spec.ts     # Free plan limits
└── helpers/
    ├── auth.ts           # Auth helper functions
    ├── date.ts           # Date utilities
    └── test-data.ts      # Test data generators
```

## Configuration

See `playwright.config.ts` for:
- Base URL configuration
- Browser settings
- Screenshot/video settings
- Parallel execution settings

## Best Practices

1. **Unique Test Data**: Each test generates unique emails/tasks using timestamps
2. **Idempotent Tests**: Tests clean up after themselves when possible
3. **No Hardcoded Secrets**: Use environment variables
4. **Reliable Selectors**: Use text content and semantic selectors
5. **Wait Strategies**: Use `waitForURL`, `waitForSelector` instead of arbitrary timeouts

## Troubleshooting

### Tests Hang or Timeout
- Ensure dev server is running (`npm run dev`)
- Check `playwright.config.ts` webServer configuration
- Increase timeout in specific tests if needed

### Authentication Fails
- Verify Supabase credentials in `.env.local`
- Check that Supabase project is accessible
- Ensure email confirmation is disabled for test environment

### Element Not Found
- Run in headed mode to see what's happening: `--headed`
- Use debug mode to step through: `--debug`
- Check if selectors match your actual HTML

### Flaky Tests
- Add explicit waits: `await page.waitForSelector(...)`
- Use `waitForLoadState('networkidle')` if needed
- Increase retries in `playwright.config.ts`

## CI/CD Integration

### GitHub Actions Example
```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npx playwright test
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## Additional Resources

- [Playwright Documentation](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug)
