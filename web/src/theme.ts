import { type MantineColorsTuple, createTheme } from "@mantine/core";

const teal: MantineColorsTuple = [
  "#e6fafa",
  "#d0f2f2",
  "#a1e5e4",
  "#6fd7d6",
  "#45cbca",
  "#2cc4c3",
  "#0ea5a0",
  "#0d918d",
  "#0b7d79",
  "#096966",
];

export const theme = createTheme({
  primaryColor: "teal",
  colors: {
    teal,
  },
  fontFamily: "Inter, system-ui, sans-serif",
  defaultRadius: "md",
});
