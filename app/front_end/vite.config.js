import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
	plugins: [react(), tailwindcss()],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
	server: {
		proxy: {
			// Whenever Axios hits a path starting with /api, forward it to your GCP server
			"/api": {
				target: "http://35.238.33.237",
				changeOrigin: true,
				secure: false,
			},
		},
	},
});
