/** @type {import("eslint").Linter.Config} */
const config = {
  extends: [
    "eslint:recommended",
    "airbnb-typescript",
    "plugin:@typescript-eslint/stylistic-type-checked",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-type-checked",
    "prettier",
    "plugin:prettier/recommended",
    "plugin:import/recommended",
  ],
  env: {
    es2022: true,
    node: true,
    browser: true,
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: './tsconfig.json',
    ecmaVersion: 2022,
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
    }
  },
  plugins: ["@typescript-eslint"],
  rules: {
    "import/no-unresolved": "off",

    "react/jsx-filename-extension": "off",
    // we support hoisting dependencies that need to be controlled at the monorepo level
    // all of these dependencies will trip this rule.
    "import/no-extraneous-dependencies": "off",

    "import/extensions": "off",
    "@typescript-eslint/no-unused-vars": [
      "error",
      { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
    ],
    "@typescript-eslint/consistent-type-imports": [
      "warn",
      { prefer: "type-imports", fixStyle: "separate-type-imports" },
    ],
    "@typescript-eslint/no-misused-promises": [
      2,
      { checksVoidReturn: { attributes: false } },
    ],
    "import/consistent-type-specifier-style": [
      "error",
      "prefer-top-level"
    ],
    "linebreak-style": "off",
    // Configure prettier
    "prettier/prettier": [
      "error",
      {
        "printWidth": 80,
        "endOfLine": "lf",
        "singleQuote": true,
        "tabWidth": 2,
        "indentStyle": "space",
        "useTabs": false,
        "trailingComma": "es5"
      }
    ],
    "object-shorthand": "error",
    "no-console": "warn",
  },
  ignorePatterns: [
    "**/.eslintrc.cjs",
    "**/*.config.js",
    "**/*.config.cjs",
    "packages/tailwind/**",
    "packages/eslint/**",
    "mocks/**",
    ".next",
    "dist",
    "pnpm-lock.yaml",
    "package-lock.json",
  ],
  reportUnusedDisableDirectives: true,
  settings: {
    "import/parsers": {
      "@typescript-eslint/parser": [".ts", ".tsx"],
    },
    "import/resolver": {
      "typescript": {
        // "project": ["packages/*/tsconfig.json", "tsconfig.json", "apps/tsconfig.json"]
        "project": ["./tsconfig.json"],
        "alwaysTryTypes": true,
      },
      "node": {
        "extensions": [".ts", ".tsx"],
        "moduleDirectory": ["src", "node_modules"]
      }
    }
  }
};

module.exports = config;
