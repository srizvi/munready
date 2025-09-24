import baseConfig, { restrictEnvAccess } from "@momo/eslint-config/base";
import nextjsConfig from "@momo/eslint-config/nextjs";
import reactConfig from "@momo/eslint-config/react";

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: [".next/**"],
  },
  ...baseConfig,
  ...reactConfig,
  ...nextjsConfig,
  ...restrictEnvAccess,
];
