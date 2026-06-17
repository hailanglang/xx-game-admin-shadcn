# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start Vite dev server
pnpm build        # TypeScript check + Vite build (tsc -b && vite build)
pnpm lint         # ESLint check (eslint .)
pnpm format       # Prettier format
pnpm format:check # Prettier check
pnpm test         # Run tests in headless browser (vitest run --browser.headless)
pnpm test:ui      # Run tests with Vitest UI
pnpm test:watch   # Run tests in watch mode
pnpm test:coverage # Run tests with coverage
pnpm knip         # Find unused files/exports
```

## Tech Stack

- **UI**: React 19 + shadcn/ui (Tailwind CSS v4 + Radix UI primitives)
- **Build**: Vite 8 + TypeScript 6
- **Routing**: TanStack Router (file-based, auto-generated `routeTree.gen.ts`)
- **Data Tables**: TanStack Table (headless, wrapped in `src/components/data-table/`)
- **Forms**: react-hook-form + Zod validation
- **Data Fetching**: TanStack Query + Axios (QueryClient in `src/main.tsx`)
- **State**: Zustand (auth store)
- **Auth**: Custom auth (Zustand + cookies) + optional Clerk integration
- **Mock Data**: @faker-js/faker (seeded for deterministic data)
- **Testing**: Vitest + Playwright browser runner
- **Linting**: ESLint + Prettier (no `no-console` allowed)

## Architecture

### Route Structure (TanStack Router file-based)

```
src/routes/
├── __root.tsx              # Root layout: NavigationProgress, Toaster, devtools
├── _authenticated/         # Layout route (underscore prefix = no URL segment)
│   ├── route.tsx           # AuthenticatedLayout (sidebar + header wrapper)
│   ├── index.tsx           # Dashboard (/)
│   ├── users/index.tsx     # User management (/users)
│   ├── tasks/index.tsx     # Task management (/tasks)
│   ├── apps/index.tsx      # Apps page (/apps)
│   ├── chats/index.tsx     # Chat page (/chats)
│   ├── help-center/index.tsx
│   ├── errors/$error.tsx   # Dynamic error route
│   └── settings/           # Settings subpages
├── (auth)/                 # Route group (parentheses = no URL segment)
│   ├── sign-in.tsx         # Custom sign-in (/sign-in)
│   └── sign-up.tsx         # Custom sign-up (/sign-up)
├── (errors)/               # Static error pages
│   └── 401.tsx, 403.tsx, 404.tsx, 500.tsx, 503.tsx
└── clerk/                  # Isolated Clerk auth demo (modular, removable)
    ├── route.tsx           # ClerkProvider wrapper + missing-key guide
    ├── (auth)/sign-in.tsx, sign-up.tsx
    └── _authenticated/user-management.tsx
```

### Feature Module Pattern (CRUD Example)

Each business feature lives under `src/features/<name>/`. The canonical CRUD pattern is:

```
src/features/users/
├── index.tsx               # Page component (Provider > Header > Main > Table > Dialogs)
├── data/
│   ├── schema.ts           # Zod schemas + inferred TypeScript types
│   ├── data.ts             # Constants / lookup enums (e.g. role labels)
│   └── users.ts            # Mock data (faker-generated)
├── components/
│   ├── users-table.tsx      # TanStack Table setup with useTableUrlState
│   ├── users-columns.tsx    # Column definitions
│   ├── users-dialogs.tsx    # Dialog router (opens correct dialog based on state)
│   ├── users-provider.tsx   # Context provider (manages which dialog is open + currentRow)
│   ├── users-action-dialog.tsx  # Add/Edit form dialog
│   ├── users-delete-dialog.tsx  # Confirm delete dialog
│   ├── users-primary-buttons.tsx # "Add User", "Invite" buttons
│   └── data-table-bulk-actions.tsx  # Bulk operations toolbar
```

### Shared Data Table Layer

`src/components/data-table/` provides reusable TanStack Table wrappers:

- `DataTableToolbar` — search input + column filter dropdowns
- `DataTablePagination` — page nav with page size selector
- `DataTableColumnHeader` — sortable column header
- `DataTableBulkActions` — bulk delete/action bar
- `DataTableFacetedFilter` — multi-select column filter (checkbox-based)
- `DataTableViewOptions` — toggle column visibility

### State Management Pattern for Dialogs

A `useDialogState<T>` hook manages which dialog is open using a simple toggle pattern (clicking the same button again closes it). Each feature wraps its dialogs in a Context Provider that exposes `{ open, setOpen, currentRow, setCurrentRow }`. The Provider and Dialogs are always co-located in the feature's `components/` directory.

### URL-Synced Table State

`useTableUrlState` hook synchronizes TanStack Table's pagination, column filters, and global filter with URL search params via `route.useSearch()` / `route.useNavigate()`. This makes table state shareable via URL.

### Auth Flow

- **Custom auth**: Zustand store (`useAuthStore`) with cookies (token stored in cookie). On 401, auto-clears session and redirects to `/sign-in`.
- **Clerk auth**: Isolated under `/clerk/` route — optional, removable by deleting `src/routes/clerk/` and `@clerk/react` dependency.

### Global Context Hierarchy (from `src/main.tsx`)

```
QueryClientProvider
  └── ThemeProvider
      └── FontProvider
          └── DirectionProvider (RTL support)
              └── RouterProvider
                  └── __root (Toaster, NavigationProgress, devtools)
                      └── _authenticated (SearchProvider > LayoutProvider > SidebarProvider)
```

## Key Conventions

- **Imports**: Prefer `@/` path alias (`@/components/ui/button`)
- **Type imports**: Use `import { type X }` inline style (enforced by ESLint)
- **CSS**: Tailwind CSS v4 (no `@apply`/`@layer` unless necessary)
- **Unused vars**: prefix with `_` (enforced by ESLint)
- **Console**: `console.log` is an error (`no-console` rule) — use `import.meta.env.DEV && console.log(...)` if debugging in dev
- **shadcn/ui updates**: Some components are customized for RTL — see README "Customized Components" section before running `npx shadcn@latest add`
- **Route file naming**: Underscore prefix (`_authenticated`) = layout route (no URL segment). Parentheses (`(auth)`) = route group (organizational, no URL effect). Both are TanStack Router conventions.
