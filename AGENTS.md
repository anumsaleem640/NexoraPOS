# AGENTS.md

## NexoraPOS AI Agent Development Instructions

### Read Before Coding
Read `README.md`, `PRD.md`, `ARCHITECTURE.md`, `TECH_STACK.md`, relevant domain documentation, and `TASKS.md`.

### Source of Truth
`PRD.md` → `ARCHITECTURE.md` → `TECH_STACK.md` → `API.md` / `DATABASE.md` → implementation.

### Never Introduce
- SQL or NoSQL databases
- SQLite
- Redis
- Firebase
- Supabase
- External cloud persistence
- Material UI
- Ant Design
- Chakra UI
- Shadcn UI
- Bootstrap UI components
- Expo

### Backend
All business logic belongs in the backend. Frontends never read or write `data.enc` and never make authoritative inventory, order, tax, discount, or authorization decisions.

### Persistence
Use the persistence abstraction. Provide mutex protection, atomic writes, encryption, decryption, schema validation, and corruption handling.

### Security
Never hardcode, log, expose, or commit secrets. Validate all API input. Authenticate and authorize protected operations server-side.

### Coding
Prefer TypeScript, small focused modules, explicit types, reusable functions, early validation, and clear error handling. Avoid unrelated refactoring and unnecessary dependencies.

### API
Every endpoint must define method, authentication, authorization, validation, response, and error behavior.

### Change Process
Check requirements, architecture, and decisions. Make the smallest correct change. Run relevant tests. Update documentation when behavior changes.

### Completion Checklist
- Requirements satisfied
- TypeScript compiles
- Validation implemented
- Authorization implemented
- Error handling implemented
- Tests updated
- Documentation updated
- No prohibited technology
- No secrets committed
- Git diff reviewed
