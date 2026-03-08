import { MantineProvider } from "@mantine/core";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { App } from "./App";
import { theme } from "./theme";

describe("App", () => {
  it("renders the home page heading", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <MantineProvider theme={theme}>
          <App />
        </MantineProvider>
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { name: /mockstorm/i })).toBeInTheDocument();
  });
});
