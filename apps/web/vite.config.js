import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
  esbuild: {
    jsxFactory: "h",
    jsxFragment: "Fragment",
    jsxInject: `import { h, Fragment } from '@harvest/core'`,
  },
  resolve: {
    alias: {
      "@harvest/core": path.resolve(__dirname, "../../packages/core/src"),
    },
  },
  define: {
    global: "globalThis",
  },
});
