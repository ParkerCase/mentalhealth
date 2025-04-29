import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

// For Next.js 15+, we need to use the flat config standard
const eslintConfig = [
  ...compat.extends("next/core-web-vitals"),
];

export default eslintConfig;
