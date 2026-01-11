import next from "eslint-config-next";

const config = [
  ...next,
  {
    rules: {
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
