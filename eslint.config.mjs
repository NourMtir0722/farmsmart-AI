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
      // TypeScript specific rules - more lenient for development
      "@typescript-eslint/no-explicit-any": "warn", // Warn about any types
      "@typescript-eslint/no-unused-vars": "warn", // Warn about unused variables
      "@typescript-eslint/explicit-function-return-type": "off", // Allow implicit return types
      
      // JavaScript rules
      "no-console": "off", // Allow console.log for debugging
      "prefer-const": "error", // Use const over let
      "no-var": "error", // No var declarations
      
      // React specific rules - more lenient
      "react-hooks/rules-of-hooks": "error", // Follow React hooks rules
      "jsx-a11y/alt-text": "warn", // Accessibility in JSX
      "react/function-component-definition": "off", // Allow both function and arrow components
      "react/no-danger": "warn", // Warn about XSS
      "react/no-unescaped-entities": "off", // Allow apostrophes
      
      // Next.js specific rules - more lenient
      "@next/next/no-img-element": "warn", // Warn about img vs Image
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
