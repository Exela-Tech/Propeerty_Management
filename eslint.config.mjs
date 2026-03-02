import next from "eslint-config-next";

const config = [
  ...next,
  {
    rules: {
      // CSP: avoid eval and string-based code execution (issue #83)
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
      // Allow some common patterns that are safe
      "react-hooks/exhaustive-deps": "warn", // Make it a warning instead of error
      "react/no-unescaped-entities": "error", // Keep as error but we'll fix them
      "react-hooks/set-state-in-effect": "warn", // Make it a warning
      "react-hooks/error-boundaries": "warn", // Make it a warning
      "react-hooks/immutability": "warn", // Make it a warning
      "react-hooks/purity": "warn", // Make it a warning
      "import/no-anonymous-default-export": "warn", // Make it a warning
    },
  },
];

export default config;
