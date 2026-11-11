import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		environment: "jsdom",
		setupFiles: ["./test/setup.mjs"],
		include: ["test/**/*.test.mjs"],
		globals: false
	}
});
