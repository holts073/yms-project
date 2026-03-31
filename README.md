# ILG Foodgroup — Supply Chain | YMS Control Tower v3.10.0
*Versie: v3.10.1 — Bijgewerkt: 2026-03-31 door @System-Architect*

Het ILG Yard Management Systeem (YMS) orkestreert de volledige supply chain flow: van de initiële ex-works order bij de leverancier tot het moment dat de vrachtwagen de yard verlaat. Sinds v3.7.5 is het systeem 100% type-safe en geoptimaliseerd voor high-density monitoring.

## 🚀 De Drie Kernmodules

1. **Global Pipeline (Inbound):** Volledig inzicht in `Containers` en `Ex-works` orders met ETA-bewaking en documentstroom.
2. **Active Yard (Operationeel):** Real-time beheer van actieve docks, wachtruimtes en de visuele **Dock-Timeline**.
3. **Outbound Planning:** Strategische toewijzing van docks voor klantzendingen.
4. **Archive & Audit (v3.6.0):** Historisch logboek (Audit Trail) van alle voltooide bewegingen voor compliance en analyse.

## ⚙️ Quick Start

```bash
# 1. Installeer afhankelijkheden
npm install

# 2. Start de development server
npm run dev

# 3. Voer de volledige validatie-suite uit (Headless)
npm run test:full

# 4. Voer de nieuwe E2E tests uit (v3.10.0)
npx playwright test tests/e2e/
```

De applicatie is beschikbaar op `http://localhost:3000`.

**Standaard inloggegevens:**
- Admin: `admin@ilgfood.com` / `welkom123`

## 🛠️ Stack & Technologie

| Laag | Technologie |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS v4, Framer Motion |
| Real-time | Socket.io (JWT-authenticatie per verbinding) |
| Backend | Node.js, Express |
| Database | Better-SQLite3 (WAL-mode) — bestand: `database.sqlite` |
| Testing | Vitest, Playwright |

## 📐 Architectuur in het kort

Het systeem hanteert een strikte **uni-directionele dataflow**:

```
UI Action → socket.emit('action') → Server validatie → SQLite write
    → buildStaticState(warehouseId) → socket.emit('state_update') → React re-render
```

Zie `ARCHITECTURE.md` voor de volledige blauwdruk, inclusief Folder Tree en Mermaid diagrammen.

## 🆕 Changelog v3.10.1 (Robustness & Sync Fixes)
- **✅ Global Dock Sync**: `syncDockStatus` zoekt nu in alle magazijnen om 'trapped' docks te voorkomen. 
- **✅ Automated Slot Cleanup**: Verwijderen van een levering ruimt nu direct de Timeline-slot op.
- **✅ Reliability Expansion**: `selectWarehouse` helper in E2E tests geforceerd om socket-state te synchroniseren.

## 🆕 Changelog v3.10.0 (Hardening & Synchronization)
- **✅ Role-Based Access Control (RBAC)**: Introductie van de `viewer` rol met read-only beperkingen in UI en Sockets.
- **✅ Dock Occupancy Sync**: Backend broadcast state-updates na statuswijzigingen (DOCKED/COMPLETED), waardoor docks real-time vrijkomen in de UI.
- **✅ Stuck Popup Fix**: DeliveryManager auto-open logic beperkt tot één trigger per ID om recursieve popups te voorkomen.
- **✅ Smart Slot Conflict Prevention**: Backend en UI blokkeren nu dubbele dock-reserveringen op hetzelfde tijdslot.
- **✅ E2E Expansion**: Nieuwe testsuites voor RBAC-isolatie, slot-conflicten en dock-synchronisatie.
- **✅ Environment Isolation**: Verbeterde test-stabiliteit door volledige database-resets inclusief gebruikers.

## 🆕 Changelog v3.9.x (E2E & Socket Stability)

## 🆕 Changelog v3.7.5 (UI Refresh)
- **✅ Massive Type-Safety Fix**: 18 kritieke type-fouten in `StatCard`, `Statistics` en `DashboardKPIs` zijn opgelost.
- **✅ StatCard Refactor**: Volledige ondersteuning voor `variant`, `active`, `description` en `compact` props.
- **✅ Documentation Update**: Nieuwe `ARCHITECTURE.md` met Folder Tree en Mermaid Blauwdrukken.

## 🆕 Changelog v3.7.4 (Layout Consolidation)
- **✅ Table-First Design**: Alle core YMS lijsten omgezet naar compacte tabellen.
- **✅ Vertical Dock List**: Volledig yard-overzicht in één oogopslag zichtbaar (Geen horizontaal scrollen).
- **✅ Stuck Delivery Fix**: Statusovergangen voor `IN_YARD` en manual progressions hersteld.

## 🤖 Automated Validation Framework (@QA-Automator)

Sinds v3.5.1 beschikt het systeem over een volledig geautomatiseerde test-suite om de stabiliteit van de v3.5.0 architectuur te garanderen:

*   **`npm run test/full`**: Voert Socket, Integratie, Database en Playwright tests uit.
*   **Headless E2E**: Playwright tests draaien 'headless' voor snelle validatie.

## 🔐 Beveiliging

- JWT-authenticatie op alle socket-verbindingen.
- Role-based access control (admin / staff / tablet).
- Wachtwoorden altijd gehasht via `bcrypt` (cost factor 10).
- Alle gebruikersacties worden gelogd in `audit_logs`.

---

## 📁 Projectstructuur

```text
.
├── src/                    # Frontend (React 19)
│   ├── components/         # Atomic Design: shared, features, ui
│   ├── hooks/              # Custom Data Hooks (useYmsData, useDeliveries)
│   ├── db/                 # Database queries & initialisatie v3.10.1
│   └── types.ts            # Centrale Interfaces
├── server/                 # Backend (Node.js)
│   ├── routes/             # REST API Router
│   ├── sockets/            # socketHandlers.ts (Action Router)
│   └── services/           # Logistieke Logica (pdf, queue)
├── database.sqlite         # SQLite database
└── server.ts               # Entry point
```
