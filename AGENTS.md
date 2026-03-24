# YMS Project: Agent Orchestration Rules

## Algemene Richtlijnen (Global)
- **Taal:** Communicatie en code-comments zijn in het Nederlands (tenzij libraries Engels vereisen).
- **Architectuur:** Respecteer de uni-directionele datastroom (Action -> Socket -> DB -> Broadcast).
- **TypeScript:** Geen `any` types; gebruik strikte interfaces uit `src/types.ts`.

## Agent Profielen

### 1. [Frontend-Specialist] (Agent A)
- **Focus:** UI, UX en Client-state.
- **Scope:** `src/components/**`, `src/App.tsx`, `src/index.css`, `public/**`.
- **Expertise:** React 19, Framer Motion, Tailwind CSS.
- **Instructie:** Zorg voor vloeiende overgangen in het YMS Dashboard.

### 2. [System-Architect] (Agent B)
- **Focus:** De "Brug" (Sockets & Integratie).
- **Scope:** `server/sockets/**`, `src/SocketContext.tsx`, `server.ts`, `src/types.ts`, `server/workers/**`.
- **Expertise:** Socket.io, State Management, Event-handling.
- **Taak:** Bewaak de consistentie tussen frontend dispatchers en backend listeners. Jij bent de eigenaar van de `ARCHITECTUUR.md` en het Mermaid-diagram. Nu ook verantwoordelijk voor de Background Workers (zonder AI).

### 3. [Data-Specialist] (Agent C)
- **Focus:** Persistentie & API.
- **Scope:** `server/routes/**`, `src/db/**` (Queries & SQLite), `database.sqlite`, `server/services/**`.
- **Expertise:** Node.js, Express, SQLite (better-sqlite3), SQL Optimalisatie.
- **Instructie:** Alle database wijzigingen worden geaudit in `audit_logs`. Jij beheert de REST endpoints en data-integriteit.