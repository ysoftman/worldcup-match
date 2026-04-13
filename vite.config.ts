import { execSync } from "node:child_process";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

function git(cmd: string): string {
	try {
		return execSync(`git ${cmd}`, { encoding: "utf-8" }).trim();
	} catch {
		return "";
	}
}

// https://vite.dev/config/
export default defineConfig({
	plugins: [react()],
	base: "/worldcup-match/",
	define: {
		__APP_VERSION__: JSON.stringify(git("describe --tags --abbrev=0") || "develop"),
		__APP_COMMIT__: JSON.stringify(git("rev-parse --short HEAD")),
		__APP_BUILD_TIME__: JSON.stringify(new Date().toISOString()),
	},
});
