# PrayPray Website Development Guide

## Commands
- Development: `npm run dev` (runs frontend + backend concurrently)
- Frontend only: `npm run frontend`
- Backend only: `npm run backend`
- Build: `npm run build`
- Production: `npm run start`
- Lint: `npm run lint`
- Type Check: `npx tsc --noEmit`
- Test Component: `npx jest src/components/ComponentName.test.tsx`
- Test Page: `npx jest src/app/path/page.test.tsx`

## Code Style
- **Imports**: Order - React, third-party libraries, UI components, hooks, utilities, types
- **Components**: Use TypeScript interfaces for props; functional components with React hooks
- **Naming**: PascalCase for components/interfaces; camelCase for variables/functions
- **Types**: Always define explicit types; use Zod for validation; avoid `any`
- **Error Handling**: Use try/catch with specific error messages; log errors with context
- **State Management**: Prefer React hooks (useState, useReducer) for component state
- **CSS**: Use Tailwind with shadcn/ui components; follow design system tokens
- **Formatting**: 2-space indentation; 80-char line limit; trailing commas for multi-line
- **Data Fetching**: Use axios; implement loading/error states; handle request timeouts

## Architecture
- **Frontend**: Next.js 14 (App Router) with TypeScript and React 18
- **Backend**: Express server with Supabase integration
- **UI Components**: shadcn/ui with Radix UI primitives and Tailwind CSS
- **Data Flow**: Server components → Client islands → API endpoints
- **Internationalization**: Supports Chinese (zh-Hant) and English (en)