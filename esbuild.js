const esbuild = require("esbuild");

esbuild
  .build({
    entryPoints: [
      "./src/background.ts",
      "./src/content.ts",
      "./src/popup.tsx",
      "./src/options.tsx",
    ],
    bundle: true,
    sourcemap: process.env.NODE_ENV !== "production",
    target: ["chrome58", "firefox57"],
    outdir: "./public/build",
    define: {
      "process.env.NODE_ENV": `"${process.env.NODE_ENV}"`,
    },
    watch: process.env.NODE_ENV !== "production",
  })
  .catch(() => process.exit(1));
