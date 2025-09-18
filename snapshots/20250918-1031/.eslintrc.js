/**
 * ESLint Configuration
 * Purpose: Code quality and consistency rules
 * Data Source: Project requirements and best practices
 * Update Path: Modify rules as needed
 * Dependencies: ESLint and plugins
 */

module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:unicorn/recommended",
    "plugin:sonarjs/recommended",
    "plugin:import/recommended",
  ],
  plugins: ["unicorn", "sonarjs", "import"],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  rules: {
    // Code quality rules
    complexity: ["error", 10],
    "max-depth": ["error", 4],
    "max-params": ["error", 4],
    "max-lines": ["error", 300],
    "max-lines-per-function": ["error", 50],

    // SonarJS rules
    "sonarjs/cognitive-complexity": ["error", 15],
    "sonarjs/no-duplicate-string": ["error", 3],
    "sonarjs/no-identical-functions": "error",
    "sonarjs/no-redundant-boolean": "error",
    "sonarjs/no-unused-collection": "error",
    "sonarjs/prefer-immediate-return": "error",
    "sonarjs/prefer-single-boolean-return": "error",

    // Unicorn rules
    "unicorn/prefer-module": "off",
    "unicorn/no-null": "off",
    "unicorn/prefer-node-protocol": "off",

    // Import rules
    "import/no-unresolved": "off",
    "import/no-extraneous-dependencies": "error",

    // General rules
    "no-console": "warn",
    "no-debugger": "error",
    "no-unused-vars": "error",
    "prefer-const": "error",
    "no-var": "error",
  },
  overrides: [
    {
      files: ["*.html"],
      rules: {
        "no-undef": "off",
      },
    },
  ],
};
