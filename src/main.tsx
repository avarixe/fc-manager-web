import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { Provider as JotaiProvider } from "jotai";
import router from "./router";

import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/charts/styles.css";
import "virtual:uno.css";
import { MantineProvider } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";

import "@tanstack/react-table";
import { RowData } from "@tanstack/react-table";

import duration from "dayjs/plugin/duration";
import relativeTime from "dayjs/plugin/relativeTime";

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    align?: "start" | "center" | "end";
    sortable?: boolean;
  }
}

dayjs.extend(duration);
dayjs.extend(relativeTime);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <JotaiProvider>
      <MantineProvider defaultColorScheme="dark">
        <ModalsProvider>
          <RouterProvider router={router} />
        </ModalsProvider>
      </MantineProvider>
    </JotaiProvider>
  </React.StrictMode>,
);
