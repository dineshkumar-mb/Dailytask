# Development Guide

## Getting Started
1. Install Node.js LTS
2. Clone repository
3. Run `npm install`
4. Run `npm run start`

## Coding Standards
- **Strict TypeScript**: Always type your props and returns. No `any`.
- **Functional Components**: Use Hooks and functional components exclusively.
- **Small Files**: Keep components focused. If a file exceeds 150 lines, consider breaking it down.
- **No Duplication**: Extract common logic to `/hooks` or `/utils`.

## State Management
- UI state: React `useState`
- Global domain state: Zustand `/store`
- Server/Async data: TanStack Query (Future)
