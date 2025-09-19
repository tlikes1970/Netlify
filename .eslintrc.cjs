/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  env: { es2023: true, browser: true, node: true, jest: true },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: false, // set to tsconfig.json path if you want type-aware rules later
    ecmaVersion: "latest",
    sourceType: "module",
  },
  plugins: ["@typescript-eslint"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier", // keeps ESLint from fighting Prettier
  ],
  ignorePatterns: ["dist/", "build/", "coverage/", "node_modules/"],
  rules: {
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    "@typescript-eslint/no-explicit-any": "off",
  },
};
If you use React, we can add eslint-plugin-react + eslint-plugin-react-hooks later, but this keeps it lean for now.

C) (Optional) Add a script to package.json
{
  "scripts": {
    "lint": "eslint . --ext .ts,.tsx,.js"
  }
}

