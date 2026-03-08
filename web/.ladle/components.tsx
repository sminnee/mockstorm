import type { GlobalProvider } from "@ladle/react";
import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import { theme } from "../src/theme";

export const Provider: GlobalProvider = ({ children }) => (
  <MantineProvider theme={theme} defaultColorScheme="auto">
    {children}
  </MantineProvider>
);
