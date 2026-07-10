import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    // Pure unit tests only (no DB / Next runtime needed) so CI stays hermetic.
    include: ["lib/**/*.test.ts"],
  },
});
