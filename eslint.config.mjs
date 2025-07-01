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
      // Disable rules that might conflict with TypeScript
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      // Allow console in development
      "no-console": process.env.NODE_ENV === "production" ? "error" : "warn",
    },
  },
];

export default eslintConfig;
