# CI/CD Setup Guide

This project uses GitHub Actions for Continuous Integration (CI).

## What the CI Pipeline Does

Every time you push to `main` or open a Pull Request, GitHub Actions automatically:

1. **Checks out** your code
2. **Installs** Node.js 20 and dependencies
3. **Runs ESLint** to catch code style issues
4. **Runs TypeScript** type checking to catch type errors
5. **Builds** the Next.js project to verify it compiles
6. **Uploads** build artifacts (kept for 7 days)

If any step fails, the pipeline fails and you'll see a red ❌ on your commit/PR.

---

## Setting Up GitHub Secrets

The build step needs your Supabase credentials to compile environment-dependent code.

### Step 1: Go to GitHub Secrets
1. Open your repository on GitHub
2. Click **Settings** (top right tab)
3. Click **Secrets and variables** → **Actions** in the left sidebar
4. Click **New repository secret**

### Step 2: Add These Secrets

| Secret Name | Value |
|-------------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://bdvjidfkvypgipizwvnm.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkdmppZGZrdnlwZ2lwaXp3dm5tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3MjEzNjksImV4cCI6MjEwMDI5NzM2OX0.1AtvyJybX-zwvQsk0ZDdgVFboiJseMy_wFFIyBwcLBY` |

### Step 3: Save and Test
1. Click **Add secret** for each one
2. Push a new commit to `main` or open a PR
3. Go to the **Actions** tab in your repo to see the pipeline run

---

## Pipeline Triggers

| Event | Branches | What Happens |
|-------|----------|--------------|
| Push | `main` | Full CI pipeline runs |
| Pull Request opened | `main` | Full CI pipeline runs |
| Pull Request updated | `main` | Full CI pipeline runs |

---

## Reading CI Results

### ✅ All Green
Your code is good to merge! All checks passed.

###  Failed
Click on the failed job to see what went wrong:
- **ESLint failed** → Fix code style issues
- **TypeScript failed** → Fix type errors
- **Build failed** → Fix compilation errors

### ⏳ In Progress
The pipeline is running. Wait for it to complete.

---

## Customizing the Pipeline

### Skip ESLint (if too strict)
In `.github/workflows/ci.yml`, the ESLint step has `continue-on-error: true`, so it won't block the build. Remove that line if you want ESLint to fail the build.

### Add Tests Later
When you're ready to add tests:
1. Add a test script to `frontend/package.json`
2. Add a new step in the workflow:
   ```yaml
   - name: Run tests
     working-directory: ./frontend
     run: npm run test
   ```

### Change Node.js Version
In the workflow file, change `node-version: '20'` to whatever version you need.

---

## Troubleshooting

### "npm ci" fails
Make sure `package-lock.json` is committed to your repo. If it's missing, run `npm install` locally and commit the generated `package-lock.json`.

### Build fails with missing env vars
Make sure both secrets (`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`) are added in GitHub Settings → Secrets.

### Pipeline is slow
The first run caches dependencies. Subsequent runs will be faster due to the `cache: 'npm'` option.

### Want to skip CI for a commit
Add `[skip ci]` or `[ci skip]` to your commit message.

---

## Future: Continuous Deployment (CD)

When you're ready to add automatic deployments, we'll add:
- **Vercel deployment** on push to `main`
- **Preview deployments** for each PR
- **Database migrations** (if using Supabase migrations)

For now, this CI pipeline ensures your code is always buildable and type-safe.
