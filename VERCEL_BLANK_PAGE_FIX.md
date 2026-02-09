# Vercel Blank Page Fix

## Problem
Your app shows a blank page on Vercel with the error: `getApp/ng-split is not a function`

This is a Firebase v12 + Vite bundling issue.

## Solution

### Option 1: Downgrade Firebase (Recommended - Quick Fix)

1. **Downgrade Firebase to v11**:
```bash
npm install firebase@^11.0.0
```

2. **Commit and push**:
```bash
git add package.json package-lock.json
git commit -m "Downgrade Firebase to v11 for Vercel compatibility"
git push
```

3. **Redeploy on Vercel** - It will automatically redeploy

### Option 2: Fix Vite Config (If you want to keep Firebase v12)

1. **Update vite.config.ts** to optimize Firebase dependencies:

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
        },
      },
    },
  },
  optimizeDeps: {
    include: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
  },
}));
```

2. **Commit and push**:
```bash
git add vite.config.ts
git commit -m "Fix Firebase bundling for Vercel"
git push
```

## Additional Checks

### 1. Remove Quotes from Vercel Environment Variables
In Vercel Dashboard → Settings → Environment Variables:
- Remove single quotes from all values
- Example: Change `'4401280:web:...'` to `4401280:web:...`

### 2. Add Vercel Domain to Firebase
In Firebase Console → Authentication → Settings → Authorized domains:
- Add: `letsdoit-tau.vercel.app`
- Add: `*.vercel.app` (for preview deployments)

### 3. Check Firestore Rules
Make sure your Firestore rules allow read access for authenticated users.

## Testing

After deploying:
1. Open: https://letsdoit-tau.vercel.app
2. Press F12 to open DevTools
3. Check Console for errors
4. If you see the error boundary, it will show the exact error

## Why This Happens

Firebase v12 introduced new module splitting that doesn't work well with Vite's default bundling strategy. The error "getApp/ng-split is not a function" indicates that Firebase modules aren't being properly bundled together.

Downgrading to v11 is the quickest fix, or you can configure Vite to handle Firebase modules correctly.
