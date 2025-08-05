import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // TypeScript specific rules for Next.js 14+
      "@typescript-eslint/no-explicit-any": "error", // Prefer proper types
      "@typescript-eslint/prefer-interface": "error", // Use interfaces over types
      "@typescript-eslint/no-unused-vars": "error", // Remove unused variables
      "@typescript-eslint/explicit-function-return-type": "warn", // Explicit return types
      "@typescript-eslint/prefer-const-assertions": "warn", // Use const assertions
      
      // JavaScript rules (minimal usage in FarmSmart AI)
      "no-console": "off", // Allow console.log for debugging
      "prefer-const": "error", // Use const over let
      "no-var": "error", // No var declarations
      "prefer-arrow-callback": "error", // Use arrow functions
      
      // React specific rules for Next.js 14+
      "react-hooks/rules-of-hooks": "error", // Follow React hooks rules
      "jsx-a11y/alt-text": "error", // Accessibility in JSX
      "react/function-component-definition": ["error", { "namedComponents": "arrow-function" }], // Use functional components
      "react/no-danger": "error", // Avoid XSS
      "react/prefer-destructuring": "error", // Use destructuring
      
      // Next.js 14+ specific rules
      "next/no-img-element": "error", // Use Next.js Image component
      "next/no-html-link-for-pages": "error", // Use Next.js Link component
      "next/no-unwanted-polyfillio": "error", // Avoid unwanted polyfills
      
      // Tailwind CSS specific rules
      "tailwindcss/classnames-order": "warn", // Consistent class ordering
      "tailwindcss/no-custom-classname": "warn", // Prefer Tailwind classes
      "tailwindcss/no-contradicting-classname": "error", // No contradicting classes
    },
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
  },
];

export default eslintConfig;
