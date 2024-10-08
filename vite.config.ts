import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import AutoImport from "unplugin-auto-import/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import jotaiDebugLabel from "jotai/babel/plugin-debug-label";
import jotaiReactRefresh from "jotai/babel/plugin-react-refresh";
import UnoCSS from "unocss/vite";
import path from "path";

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
    AutoImport({
      imports: [
        "react",
        "jotai",
        {
          "@tanstack/react-router": [
            "createRootRoute",
            "createLazyFileRoute",
            "Link",
            "useNavigate",
            "useParams",
          ],
          "@tanstack/react-table": ["createColumnHelper"],
          dayjs: [["default", "dayjs"]],
          "react-usestateref": [["default", "useStateRef"]],
          "@mantine/core": [["Text", "MText"]],
        },
        {
          from: "src/hooks",
          imports: ["StateSetter"],
          type: true,
        },
      ],
      dirs: [
        "src/atoms",
        "src/components/*",
        "src/constants",
        "src/hooks",
        "src/utils",
      ],
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
