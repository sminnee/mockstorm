# UI Design Skill

## Wireframe Principle

Mockstorm operates at wireframe level. Application code (`web/src/`) uses components from the
pattern library as high-level building blocks. No custom colours, spacing tweaks, or inline
styles in app files. All visual polish lives in the pattern library (Ladle stories + Mantine
theme/component wrappers in `web/src/components/`).

## Feedback Workflow

When proposing UI changes:

1. Create or update Ladle stories first
2. Check the Ladle port: `mael env status`
3. Share `http://localhost:<LADLE_PORT>` with the user for review
4. Wait for approval before wiring into the real application

This keeps design decisions visible and reversible.

## Design Tokens

| Token | Light | Dark |
|-------|-------|------|
| Background | `#f8fafc` | `#0f0f12` |
| Surface | `#ffffff` | `#1a1a24` |
| Accent (primary) | `#0ea5a0` (teal) | `#0ea5a0` |
| Text | `#1e293b` | `#e8e8f0` |

Tokens are implemented via `web/src/theme.ts` and the Mantine CSS variable system.

## Typography

- Font family: `Inter, system-ui, sans-serif`
- Scale: use Mantine's built-in `Text`, `Title`, and `rem()`/`em()` utilities
- Avoid hardcoded `px` font sizes

## Component Authoring Conventions

- Every component in `web/src/components/` must have a `.stories.tsx` file alongside it
- Component wrappers enforce project defaults (e.g., `size="sm"` for Button)
- Export named components (not default exports)
- Props interface should extend the underlying Mantine component's props where applicable

### Example structure

```
web/src/components/
  Button/
    Button.tsx          ← thin Mantine wrapper with project defaults
    Button.stories.tsx  ← Ladle CSF stories for all states
```

## Mantine Component Guide

| Use case | Component |
|----------|-----------|
| Page layout | `AppShell`, `Container` |
| Content grouping | `Stack`, `Group`, `SimpleGrid` |
| Text content | `Title`, `Text` |
| Actions | `Button`, `ActionIcon` |
| Status/labels | `Badge` |
| Data display | `Table`, `Card`, `Paper` |
| Forms | `TextInput`, `Select`, `Checkbox` |
| Feedback | `Notification`, `Alert` |
| Navigation | `NavLink`, `Tabs`, `Breadcrumbs` |

## Theming

- Theme config lives in `web/src/theme.ts`
- To add a new colour: add a `MantineColorsTuple` (10 shades) and register in `createTheme({ colors: { ... } })`
- To override a component's default styles: use `createTheme({ components: { ComponentName: { defaultProps, styles } } })`
- Never use hardcoded hex values in component files — reference Mantine CSS vars or theme keys

## Colour Scheme

- `defaultColorScheme="auto"` in `MantineProvider` — follows OS preference
- No manual toggle needed or wanted
- Test both schemes by toggling OS appearance settings

## Ladle Stories

Stories use CSF (Component Story Format):

```tsx
import type { Story } from '@ladle/react';
import { Button } from './Button';

export const Primary: Story = () => <Button>Primary</Button>;
export const Loading: Story = () => <Button loading>Loading</Button>;
```

- Stories are auto-wrapped in `MantineProvider` via `web/.ladle/components.tsx`
- Cover all meaningful states: default, hover-able, disabled, loading, error, etc.
- Story file naming: `ComponentName.stories.tsx`

## Accessibility Notes

- Mantine components include ARIA roles by default for common patterns
- Always pass `aria-label` on icon-only `ActionIcon` buttons
- Ensure colour contrast meets WCAG AA (Mantine's teal palette is designed for this)
- Use semantic HTML via `component` prop when needed (e.g., `<Title component="h2">`)
