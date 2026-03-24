# Project Architectuur - Yard Management System (YMS)

Dit document beschrijft de technische architectuur van het YMS-project na de succesvolle modularisatie en het verwijderen van AI-componenten.

## Overzicht

Het systeem is een moderne webapplicatie bestaande uit een **React-frontend** en een **Node.js/Express-backend**. De architectuur is ontworpen voor maximale stabiliteit en real-time inzicht in een handmatig beheerde logistieke omgeving.

## Componenten & Mappenstructuur

### 1. Frontend (Client-side)
*   **Locatie**: `src/`
*   **Technologie**: React 19, Vite, Tailwind CSS, Framer Motion.
*   **State**: `SocketContext.tsx` fungeert als de "Single Source of Truth", gesynchroniseerd via Socket.io.

### 2. Backend (Server-side)
De server is opgedeeld in gespecialiseerde modules:
- **`/server/routes/`**: RESTful API endpoints voor authenticatie en data-export.
- **`/server/sockets/`**: Real-time action handlers (de "Command" zijde van de applicatie).
- **`/server/workers/`**: Autonome achtergrondtaken (zoals Reefer monitoring) die status-alerts genereren.
- **`/server/services/`**: Gedeelde business logica die door zowel routes als sockets wordt gebruikt.

### 3. Data Layer
*   **Locatie**: `src/db/`
*   **Database**: SQLite (`better-sqlite3`) in WAL-modus.
*   **Toegang**: `queries.ts` bevat alle SQL-voorbereide statements.

## Datastroom (Uni-directioneel)

Het systeem volgt een strikte flow om inconsistenties te voorkomen:

```mermaid
graph TD
    subgraph "Client Layer (Frontend)"
        UI[React Components]
        SC[SocketContext]
    end

    subgraph "Integration Layer (Sockets/API)"
        SH[Socket Handlers]
        RT[API Routes]
    end

    subgraph "Logic Layer (Workers/Services)"
        BW[Inventory Worker]
        SV[Services]
    end

    subgraph "Persistence Layer (SQL)"
        QU[Prepared Queries]
        DB[(SQLite DB)]
    end

    %% Flow
    UI -- "dispatch(Action)" --> SC
    SC -- "Socket.emit('action')" --> SH
    SH -- "Call" --> QU
    SH -- "Broadcast" --> SC
    
    BW -- "Monitor & Alert" --> QU
    BW -- "IO.emit('state_update')" --> SC
    
    QU <--> DB
    RT -- "REST" --> UI
    SH -- "Use" --> SV
    RT -- "Use" --> SV
```

## Belangrijke Kenmerken (Post-AI)
1.  **Voorspelbaarheid**: Geen automatische verschuivingen in de planning; de gebruiker heeft volledige controle.
2.  **Prestaties**: Door AI-berekeningen te verwijderen is de server-load aanzienlijk verminderd.
3.  **Real-time Alerts**: De `inventory-worker` bewaakt nu alleen harde limieten (zoals dwell-time), wat meer transparantie geeft.
