import baseConfig, { restrictEnvAccess } from "@momo/eslint-config/base";

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: ["script/**"],
  },
  ...baseConfig,
  ...restrictEnvAccess,
];
