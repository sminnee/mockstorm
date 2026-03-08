import type { Story } from "@ladle/react";
import { Button } from "./Button";

export const Primary: Story = () => <Button>Primary</Button>;

export const Secondary: Story = () => <Button variant="outline">Secondary</Button>;

export const Disabled: Story = () => <Button disabled>Disabled</Button>;

export const Loading: Story = () => <Button loading>Loading</Button>;
