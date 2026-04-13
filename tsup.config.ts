import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    evm: "src/evm.ts",
    solana: "src/solana.ts",
    ton: "src/ton.ts",
  },
  format: ["cjs", "esm"],
  dts: true,
  clean: true,
  splitting: false,
  sourcemap: true,
  minify: true,
});
