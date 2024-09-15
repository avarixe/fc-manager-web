import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { Provider as JotaiProvider } from "jotai";
import router from "./router";

import '@unocss/reset/tailwind-compat.css'
import 'virtual:uno.css'

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <JotaiProvider>
      <RouterProvider router={router} />
    </JotaiProvider>
  </React.StrictMode>
);
