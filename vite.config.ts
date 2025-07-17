import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import jotaiDebugLabel from "jotai/babel/plugin-debug-label";
import jotaiReactRefresh from "jotai/babel/plugin-react-refresh";
import path from "path";
import UnoCSS from "unocss/vite";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [jotaiDebugLabel, jotaiReactRefresh],
      },
    }),
    UnoCSS(),
    TanStackRouterVite(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
