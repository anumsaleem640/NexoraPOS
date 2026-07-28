# NexoraPOS Technology Stack

## Backend
- Framework: Next.js
- Router: App Router
- Language: TypeScript
- Runtime: Node.js
- API: Route Handlers
- Encryption: Node.js `crypto`
- Algorithm: AES-256-CBC
- Persistence: encrypted local file
- Validation: centralized schema validation

## Admin
- React
- TypeScript
- Vite
- Client-side SPA
- CSS Modules
- No external UI component library

## Website
- Next.js
- TypeScript
- SSR / SSG / Hybrid rendering
- Next.js Metadata API
- Project-defined CSS architecture

## Mobile
- React Native
- React Native CLI
- TypeScript
- Native iOS / Android
- No Expo

## Forbidden Infrastructure
PostgreSQL, MySQL, SQLite, MongoDB, Redis, Firebase, Supabase, DynamoDB, external databases, ORM-based persistence.

## Forbidden Admin UI Libraries
Material UI, Ant Design, Chakra UI, Shadcn UI, Bootstrap UI components, and other external component libraries.

## Dependency Policy
Add dependencies only when necessary, maintained, compatible with architecture, and justified by maintenance or bundle impact.
