# PrayPray Website Development Guide

## Commands
- Development: `npm run dev` (runs frontend + backend concurrently)
- Frontend only: `npm run frontend`
- Backend only: `npm run backend`
- Build: `npm run build`
- Production: `npm run start`
- Lint: `npm run lint`

## Code Style
- **Imports**: Group related imports together; React first, then third-party libraries, then local components/utilities
- **Components**: Use TypeScript interfaces for props; functional components with React hooks
- **Naming**: PascalCase for components/interfaces; camelCase for variables/functions
- **Types**: Always define types for props, state, and function parameters/returns
- **Error Handling**: Use try/catch with specific error messages; avoid generic error handling
- **CSS**: Use Tailwind CSS classes; maintain consistent spacing patterns
- **Data Fetching**: Use axios for API calls; handle loading/error states
- **Internationalization**: Support both Chinese (zh-Hant) and English

## Architecture
PrayPray is a Next.js application with Express backend, using Supabase for data storage.