import { createTheme } from "@mantine/core";
import { generatePalette } from "./lib/color-palette";

const navy = generatePalette("#262e56");
const azure = generatePalette("#1437e3");
const emerald = generatePalette("#16944f");
const amber = generatePalette("#e09500");
const crimson = generatePalette("#c41e3a");

export const theme = createTheme({
  primaryColor: "navy",
  primaryShade: { light: 6, dark: 4 },
  colors: {
    navy,
    azure,
    emerald,
    amber,
    crimson,
  },
  fontFamily: "Inter, system-ui, sans-serif",
  defaultRadius: "md",
});
