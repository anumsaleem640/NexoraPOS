# Changelog

All notable NexoraPOS documentation and architecture changes are recorded here.

## [1.0.0] — 2026-07-28

### Added
- Initialized monorepo structure with npm workspaces (`backend`, `admin`, `website`, `mobile`)
- Initialized Next.js App Router backend (`backend/`) with base `/api/v1/health` endpoint
- Initialized React + Vite Admin SPA (`admin/`) with CSS Modules design system shell
- Initialized Next.js customer storefront (`website/`) with Metadata API layout
- Initialized React Native CLI mobile application (`mobile/`) with TypeScript
- Configured root TypeScript `tsconfig.base.json`, `.gitignore`, `.env.example`, and `.env.local`
- Initialized Git repository and verified build and type checking across all workspaces
- Initial production PRD
- Centralized Next.js backend architecture
- React + Vite Admin Dashboard specification
- Next.js customer storefront specification
- React Native CLI mobile specification
- Encrypted `data.enc` persistence architecture
- AES-256-CBC encryption requirement
- `ENCRYPTION_KEY` requirement
- API versioning
- Repository abstraction
- Atomic persistence writes
- Mutex concurrency protection
- Authentication and authorization architecture
- UI guidelines
- API specification
- Persistence specification
- Testing strategy
- Task board
- Product roadmap
- Architecture decision records
- AI coding agent instructions

### Documentation Files
```text
README.md
PRD.md
AGENTS.md
ARCHITECTURE.md
TECH_STACK.md
UI_GUIDELINES.md
API.md
DATABASE.md
TESTING.md
TASKS.md
TODO.md
ROADMAP.md
DECISIONS.md
CHANGELOG.md
```
