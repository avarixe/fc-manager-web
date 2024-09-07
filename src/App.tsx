import "@mantine/core/styles.css";
import { theme } from "./theme";

export default function App() {
  return <MantineProvider theme={theme} forceColorScheme="dark">App</MantineProvider>;
}
