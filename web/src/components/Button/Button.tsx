import { type ButtonProps, Button as MantineButton } from "@mantine/core";
import type { ReactNode } from "react";

interface Props extends ButtonProps {
  children: ReactNode;
}

export function Button({ children, ...props }: Props) {
  return (
    <MantineButton size="sm" {...props}>
      {children}
    </MantineButton>
  );
}
