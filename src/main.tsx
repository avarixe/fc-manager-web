import ReactDOM from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { Provider as JotaiProvider } from "jotai";
import router from "./router";

import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/charts/styles.css";
import "virtual:uno.css";
import { createTheme, MantineProvider, Switch } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
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

const theme = createTheme({
  components: {
    Switch: Switch.extend({
      defaultProps: {
        withThumbIndicator: false,
      },
    }),
    DatePickerInput: DatePickerInput.extend({
      defaultProps: {
        firstDayOfWeek: 0,
      },
    }),
  },
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <JotaiProvider>
    <MantineProvider defaultColorScheme="dark" theme={theme}>
      <ModalsProvider>
        <RouterProvider router={router} />
      </ModalsProvider>
    </MantineProvider>
  </JotaiProvider>,
);
