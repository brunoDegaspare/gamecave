## What is GameCave?

GameCave is a personal video game collection manager designed to help players organize, track, and revisit their game libraries across multiple platforms.

The app is being built as a personal product and learning project, with a strong emphasis on UX quality, performance, and clean, maintainable architecture.

## Current features

- Add games to one or multiple collections
- Manage collection contents (cartridge, box, manual)
- Mobile-first layout approach

## Tech stack

- Framework: Next.js 15 (App Router)
- UI: React 19 + TypeScript
- Styling: Tailwind CSS 4, DaisyUI
- Components & accessibility: HeroUI (@heroui/react, React Aria)
- Animation: Framer Motion
- Command palette: cmdk
- Icons & SVG: SVGR + custom `build:icons` script (tsx)
- Linting: ESLint
- Package manager: pnpm

## How to run locally

```bash
pnpm install
pnpm dev
```

Then open `http://localhost:3000`.

## Project status

In progress (building the Front End components).
