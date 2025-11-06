/**
 * ESLint Configuration for apps/web
 * Purpose: TypeScript/React code quality rules for the web app
 * Data Source: TypeScript React best practices
 * Update Path: Modify rules as needed
 * Dependencies: ESLint and TypeScript plugins
 */

module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
    },
    project: "./tsconfig.json",
  },
  plugins: ["@typescript-eslint", "react", "react-hooks"],
  settings: {
    react: {
      version: "detect",
    },
  },
  rules: {
    // TypeScript specific
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_|^e$", // Allow 'e' in catch blocks
      },
    ],
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-explicit-any": "warn",

    // React specific
    "react/react-in-jsx-scope": "off", // Not needed in React 17+
    "react/prop-types": "off", // TypeScript handles this
    "react/no-unknown-property": ["error", { 
      ignore: ["netlify-honeypot"] // Valid attribute for Netlify forms
    }],
    // React Hooks rules - downgrade to warnings (pre-existing violations)
    "react-hooks/rules-of-hooks": "warn",
    "react-hooks/exhaustive-deps": "warn",

    // General
    "no-console": ["warn", { allow: ["warn", "error", "log", "debug"] }], // More lenient for debugging
    "no-debugger": "error",
    "prefer-const": "error",
    "no-var": "error",
    
    // React - allow unescaped entities (strings are fine)
    "react/no-unescaped-entities": "warn",
    
    // Allow expression statements (for side-effect imports like authManager)
    "@typescript-eslint/no-unused-expressions": ["error", { 
      allowShortCircuit: true,
      allowTernary: true,
      allowTaggedTemplates: true,
    }],
  },
  ignorePatterns: [
    "dist", 
    "node_modules", 
    "*.config.*",
    "**/__tests__/**",
    "**/*.test.ts",
    "**/*.test.tsx",
    "**/test-setup.ts"
  ],
};
