import { defineConfig, configDefaults } from "vitest/config";
import { createRequire } from "module";

const tsconfigJson = createRequire(import.meta.url)("./tsconfig.json");

process.env.STAGE = "test";

export default defineConfig({
  test: {
    root: "./",
    include: ["{src,test}/**/*.{unit,test}.ts"],
    exclude: [...configDefaults.exclude, ...tsconfigJson.exclude],
    globals: true,
    setupFiles: ["dotenv/config"],
  },
  plugins: [],
});
