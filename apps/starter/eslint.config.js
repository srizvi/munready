import baseConfig, { restrictEnvAccess } from "@momo/eslint-config/base";
import reactConfig from "@momo/eslint-config/react";

/** @type {import('typescript-eslint').Config} */
export default [...baseConfig, ...reactConfig, ...restrictEnvAccess];
