import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

// For Next.js 15+ and ESLint 9+, we need to use the flat config standard
const eslintConfig = [
  ...compat.extends("next/core-web-vitals"),
  {
    rules: {
      // Allow console statements (warn instead of error to allow build)
      "no-console": "warn",
      // Disable TypeScript-specific rules if plugin not available
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      // Allow unescaped entities in JSX (apostrophes, quotes)
      "react/no-unescaped-entities": "warn",
      // Allow <a> tags for navigation (some cases are needed)
      "@next/next/no-html-link-for-pages": "warn",
      // Allow <img> tags (some cases are needed)
      "@next/next/no-img-element": "warn",
    },
  },
];

export default eslintConfig;
