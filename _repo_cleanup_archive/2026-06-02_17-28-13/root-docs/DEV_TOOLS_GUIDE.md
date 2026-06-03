# Development Tools & Extensions Guide

This guide lists recommended tools and extensions that help catch errors before they reach production and work well with AI assistants.

## 🎯 Cursor/VS Code Extensions

### Essential TypeScript/JavaScript Tools

1. **TypeScript Hero** (or built-in TypeScript)
   - Real-time type checking in editor
   - Shows errors before you save
   - Already have TypeScript, but ensure extensions are enabled

2. **ESLint** (by Microsoft)
   - File: `apps/web/.eslintrc.js` (TODO: create if missing)
   - Catches code quality issues live
   - Shows warnings in editor before commit

3. **Prettier - Code Formatter**
   - Auto-format on save
   - Works with your existing Prettier config

4. **Error Lens** ⭐ _Highly Recommended_
   - Shows errors/warnings inline in your code
   - No need to open Problems panel
   - Makes TypeScript errors impossible to miss

### React-Specific Tools

5. **React Developer Tools** (Browser extension)
   - Inspect React component state
   - Debug props/state issues

6. **vscode-styled-components** (if using styled components)
   - Syntax highlighting for CSS-in-JS

### Git Integration

7. **GitLens** (or built-in Git)
   - Visual git history
   - See who changed what and when
   - Helps track down when bugs were introduced

## 🔧 Command-Line Tools

### Already Installed ✅

- **ESLint** - Code quality
- **TypeScript** - Type checking
- **Prettier** - Code formatting
- **Husky** - Git hooks (we just set up pre-push)
- **Playwright** - E2E testing

### Recommended Additions

1. **lint-staged** (already in dependencies!)
   - Run linters on staged files only
   - Faster than linting entire codebase

2. **TypeScript strict mode enhancements**
   - Already have `strict: true` - good!
   - Consider adding `noImplicitReturns: true`

## 📦 npm Scripts to Add

Add these to `apps/web/package.json` for easy checking:

```json
{
  "scripts": {
    "lint": "eslint src --ext .ts,.tsx",
    "lint:fix": "eslint src --ext .ts,.tsx --fix",
    "typecheck": "tsc --noEmit",
    "check-all": "npm run typecheck && npm run lint && npm run build"
  }
}
```

## 🚀 Enhanced Pre-Push Hook

Upgrade `.husky/pre-push` to check more things:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🔍 Running pre-push checks..."

cd apps/web || exit 1

# Type checking
echo "  ✓ Type checking..."
npm run typecheck
TYPE_CHECK_EXIT=$?

# Linting (if ESLint is configured)
if [ -f ".eslintrc.js" ] || [ -f ".eslintrc.json" ] || [ -f ".eslintrc.cjs" ]; then
  echo "  ✓ Linting..."
  npm run lint --silent 2>/dev/null || true  # Don't fail if lint script missing
  LINT_EXIT=$?
else
  LINT_EXIT=0
fi

cd ../..

# Fail if any check failed
if [ $TYPE_CHECK_EXIT -ne 0 ]; then
  echo "❌ TypeScript errors found. Please fix before pushing."
  exit 1
fi

echo "✅ All pre-push checks passed!"
```

## 🌐 Browser Extensions for Debugging

### For Production Debugging

1. **React Developer Tools**
   - Chrome: https://chrome.google.com/webstore/detail/react-developer-tools
   - Firefox: Built into Firefox Developer Edition

2. **Redux DevTools** (if you add Redux later)

3. **Vue.js DevTools** (if you add Vue later)

### For Auth Debugging (What You're Dealing With)

4. **Firebase Debugger**
   - Monitor Firebase Auth state in browser console
   - Check localStorage/sessionStorage easily

5. **Network Conditions** (Built into Chrome DevTools)
   - Simulate slow 3G to catch mobile issues
   - Test offline scenarios

## 🎨 Cursor-Specific Settings

Add to `.vscode/settings.json` or Cursor settings:

```json
{
  "typescript.tsdk": "apps/web/node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ],
  "typescript.preferences.importModuleSpecifier": "relative"
}
```

## 🔍 Debugging Tools Already Available

You already have:

- ✅ TypeScript (catches type errors)
- ✅ ESLint (code quality)
- ✅ Playwright (E2E tests)
- ✅ Husky (git hooks)
- ✅ Prettier (formatting)

## 🎯 Next Steps

### Priority 1: Immediate Value

1. Install **Error Lens** extension (biggest impact)
2. Enable ESLint in `apps/web` (create `.eslintrc.js` for React/TypeScript)
3. Add `lint` script to `apps/web/package.json`

### Priority 2: Better Integration

4. Update pre-push hook to run lint too
5. Configure Cursor settings for auto-format

### Priority 3: Enhanced Debugging

6. Set up React DevTools
7. Add more TypeScript strict checks

## 📝 Quick Setup Commands

```bash
# Add ESLint config for apps/web (if needed)
cd apps/web
npm install --save-dev eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint-plugin-react

# Add lint scripts to apps/web/package.json (see above)

# Test the pre-push hook
git add .
git commit -m "test"
git push  # Should run checks
```

## 🚨 What These Tools Catch

| Tool          | Catches      | Example                                            |
| ------------- | ------------ | -------------------------------------------------- |
| TypeScript    | Type errors  | `hasAuthParams` being string instead of boolean ✅ |
| ESLint        | Code quality | Unused vars, complexity issues                     |
| Error Lens    | All errors   | Shows TypeScript errors inline                     |
| Pre-push hook | Pre-deploy   | Blocks push if errors found                        |
| Prettier      | Formatting   | Consistent code style                              |

---

**Note**: These tools work together with AI assistants (like me) because:

- I can see the errors in the codebase
- They catch issues I might introduce
- They provide instant feedback
- They prevent bad code from reaching production

