# ARCHITECTURE: ILG Foodgroup Control Tower
*Versie: v3.5.1 — Bijgewerkt: 2026-03-26 door @System-Architect*

> [!NOTE]
> Bijgewerkt na sessie 2026-03-17: Gebruikersbeheer (password hashing), Dynamische Documentinstellingen en Vite `allowedHosts`.

Dit document beschrijft de technische blauwdruk van het ILG Foodgroup YMS, ontworpen voor maximale schaalbaarheid, data-integriteit en een superieure gebruikerservaring.

## 1. Atomic Design & Mappenstructuur

We hanteren een **Atomic Design** methodiek voor maximale herbruikbaarheid en logische isolatie:

| Laag | Pad | Inhoud |
|---|---|---|
| Atoms & Molecules | `/src/components/shared` | Button, Modal, Badge, Card — volledig context-vrij |
| Organisms | `/src/components/features` | YmsTimeline, DockGrid, DeliveryTable — bevatten bedrijfslogica |
| Templates & Pages | `/src/components/` | YmsDashboard, Settings — brengen features samen |
| Hooks | `/src/hooks/` | `useYmsData`, `useDeliveries` — isoleren state-access |

## 2. Logistieke State Machine

De levenscyclus van een vracht is strikt gedefinieerd om data-inconsistenties te voorkomen:

```mermaid
stateDiagram-v2
    [*] --> PLANNED : Ex-works / Container aangemeld
    PLANNED --> EXPECTED : ETA bevestigd
    EXPECTED --> GATE_IN : Aangemeld bij YMS (opt. Gate)
    GATE_IN --> IN_YARD : Naar wachtruimte gereden
    IN_YARD --> DOCKED : Dock toegewezen
    GATE_IN --> DOCKED : Direct (magazijn zonder gate)
    DOCKED --> UNLOADING : Lossen gestart
    DOCKED --> LOADING : Laden gestart
    UNLOADING --> COMPLETED : Gereed
    LOADING --> COMPLETED : Gereed
    COMPLETED --> [*] : Gearchiveerd
```

## 3. Uni-directionele Dataflow (Kern-Architectuur)

Het systeem hanteert een strikte uni-directionele dataflow om race-conditions en stale state te vermijden:

```
[Gebruiker] → [UI Action] → [SocketContext.dispatch()]
    → [socket.emit('action', {type, payload})]
    → [Server: socketHandlers.ts — try/catch per case]
    → [Database: queries.ts — INSERT OR REPLACE]
    → [buildStaticState(warehouseId)]
    → [io.sockets.forEach → s.emit('state_update', ...)]
    → [SocketContext setState()] → [React re-render]
```

**Kritische bevindingen (v3.5.0):**
- **Queue Management (Phase 3.5)**: De wachtrij gebruikt nu een prioriteitsalgoritme (Reefer first) en live wachttijd-calculatie in de frontend.
- **Smart Call Logic**: Dock-selectie is nu 'temperature-aware'; docks worden aanbevolen op basis van de lading.
- Alle `io.emit()` globale broadcasts zijn vervangen door `io.sockets.sockets.forEach()` met warehouse-filtering om data-lekkage tussen magazijnen te voorkomen.
- Backend `error_message` events zijn gekoppeld aan Sonner-toasts voor directe UI-feedback bij server-exceptions.

## 4. Database Architectuur (SQLite via better-sqlite3)

### Tabelstructuur — Kern (Global Pipeline)
```
users          (id PK, name, email, passwordHash, role, permissions JSON)
deliveries     (id PK, type, reference, supplierId, status, eta, ...)
documents      (id PK, deliveryId FK, name, status, required)
address_book   (id PK, type, name, contact, email, ...)
logs           (id PK, timestamp, user, action, details)
audit_logs     (id PK, deliveryId FK, timestamp, user, action, details)
settings       (key PK, value JSON)
```

### Tabelstructuur — YMS-kern
```
yms_warehouses (id PK, name, hasGate)
yms_docks      (id, warehouseId — composite PK)
yms_waiting_areas (id, warehouseId — composite PK)
yms_deliveries (id PK, warehouseId, dockId, status, scheduledTime, ...)
```

> [!IMPORTANT]
> **v3.2.3.3 Kritieke Fix**: De `FOREIGN KEY(dockId, warehouseId) REFERENCES yms_docks` compound-constraint in `yms_deliveries` is verwijderd uit `sqlite.ts`. Deze constraint werd ongeldig na schema-wijzigingen, waardoor **elke write naar yms_deliveries** met een `foreign key mismatch`-error faalde — dit was de definitieve root cause van de onzichtbare dock-planning.

### `settings`-tabel: Dynamische Configuratie
De `settings`-tabel slaat JSON-blobs op per sleutel. Bekende sleutels:

| Key | Inhoud |
|---|---|
| `companySettings` | Bedrijfsnaam, email, transportTemplate, SMTP-config |
| `settings` | Terminologie-instellingen |
| `shipment_settings` | Verplichte/optionele documenten per type (`container` / `exworks`) |

Het `shipment_settings`-object wordt bij opstart geseeded als het nog niet bestaat (`sqlite.ts`). Wijzigingen via de UI (`UPDATE_SETTINGS` socket-event) persisteren direct.

### Prepared Statements (queries.ts)
Alle SQL-operaties verlopen via **expliciete kolomnamen** in `INSERT OR REPLACE`-statements om parameter-volgorde-fouten te elimineren:
```sql
INSERT OR REPLACE INTO yms_deliveries (
  id, warehouseId, reference, licensePlate, supplier, supplierId,
  mainDeliveryId, temperature, scheduledTime, arrivalTime,
  registrationTime, isLate, dockId, ...
) VALUES (?, ?, ?, ...)
```

## 5. Multi-Warehouse State Isolatie

Elk socket-verbinding draagt een `socket.data.selectedWarehouseId`. Bij elke `buildStaticState`-aanroep wordt `getYmsDeliveries(warehouseId)` en `getYmsDocks(warehouseId)` doorgegeven zodat elke gebruiker alleen de data van zijn eigen magazijn ziet.

## 6. Optionele Gate-In Flow

Magazijnen configureren via `yms_warehouses.hasGate`:
- **hasGate = true**: `EXPECTED → GATE_IN → DOCKED` (volledige flow)
- **hasGate = false**: `PLANNED/EXPECTED → DOCKED` (direct toewijzen, geen gate-stap)

De `YMS_ASSIGN_DOCK` handler detecteert dit automatisch op basis van de huidige levering-status.

## 7. Sessiebeheer, Authenticatie & Gebruikersbeheer

| Rol | JWT-duur | Inactiviteits-timer |
|---|---|---|
| `admin` / `staff` | 8 uur | 60 minuten |
| `tablet` | 365 dagen | Uitgeschakeld (Always-On) |

### Wachtwoord-flow (bcrypt)
Wachtwoorden worden **nooit** in plaintext opgeslagen. De volledige flow:
```
[Admin maalt nieuw/gewijzigd wachtwoord] → socket.emit('ADD_USER' | 'UPDATE_USER', { password })
    → server.ts: bcrypt.genSaltSync(10) + bcrypt.hashSync(password, salt)
    → saveUser({ ...userData, passwordHash }) → INSERT OR REPLACE INTO users
    → Bij login: bcrypt.compareSync(password, user.passwordHash)
```
- Nieuwe gebruikers zonder wachtwoord krijgen **`welkom123`** als default (hash).
- Bij updaten van een gebruiker **zonder** wachtwoord in de payload blijft de bestaande `passwordHash` ongewijzigd.

### Vite Deployment Config
`vite.config.ts` bevat `server.allowedHosts: ['ship.holtslag.me']` voor productie-deploy op het custome domein.

## 8. Kwaliteitsbewaking (Automated Validation Suite)

Sinds v3.5.1 hanteert het platform een volledig geautomatiseerde validatie-suite die handmatige browser-interactie overbodig maakt:

| Laag | Tool | Scope |
|---|---|---|
| **E2E Testing** | Playwright | Kritieke user-flows zoals de Priority Queue en Dock-toewijzing. |
| **Integration** | Vitest | Uni-directionele dataflow validatie (Action → Socket → DB). |
| **Integrity** | tsx script | Database health checks (`db-health.ts`) op inconsistenties. |

### 8.1 Headless E2E Standard
Alle kritieke UI-flows worden gevalideerd in een headless browser omgeving. Hiervoor worden componenten geïnstrumenteerd met `data-testid` attributen. Een harde vereiste is dat alle shared Atoms (`Card`, `Badge`, `Button`) hun props spreaden naar het onderliggende DOM-element om te voorkomen dat test-identifiers verloren gaan.

### 8.2 Release Criteria
Zie `AGENTS.md` voor de volledige release-criteria-checklist. Kernpunten:
- ✅ `npm run test:full` slaagt 100%
- ✅ Geen console-errors in de browser
- ✅ Container-kaarten tonen correcte data
- ✅ Sonner-toasts voor alle backend-fouten
- ✅ Z-index: toasts > modals > sidebar
