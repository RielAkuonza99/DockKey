# DockKey design system

## Direction
Close to the supplied reference: playful, rounded, colorful, mobile-first, editorial dashboard composition. Preserve DockKey's own brand and avoid copying any reference screen exactly.

## Palette
- Cream: `#FFF9E9`
- Coral: `#F47791`
- Teal: `#278F7D`
- Orange: `#F6AA50`
- Lavender: `#A9A2F4`
- Ink: `#24232B`

Light surfaces: background `#FFF9E9`, surface `#FFFFFF`, text `#24232B`, muted `#77747C`.
Dark surfaces: background `#171923`, surface `#242633`, elevated `#303342`, text `#F7F5F0`, muted `#B6B5C0`.

## Typography
Prefer Plus Jakarta Sans with system fallback. Display 32/800, H1 28/800, H2 23/700, H3 19/700, body 14–16, caption 12.

## Geometry
Spacing scale: 4, 8, 12, 16, 20, 24, 32, 40. Radius: 12 small controls, 16 inputs, 20 small cards, 24 main cards, 28 hero cards. Use soft shadows sparingly.

## Navigation
Bottom tabs: Home, Tools, History, Profile. Detail screens are pushed on the stack, not added as tabs.

## Core components
Button, Card, SearchBar, CategoryCard, ToolCard, StatCard, StatusBadge, SectionHeader, EmptyState, Skeleton, ThemeToggle.

## UX rules
- Provide loading, empty, error, disabled, and success states.
- Respect safe areas and minimum touch target 44 pt.
- Use accessible labels and sufficient contrast.
- Do not rely on color alone to communicate request status.
