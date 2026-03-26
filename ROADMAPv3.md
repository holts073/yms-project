# ROADMAP v3: De Toekomst van de ILG Control Tower

Dit document schetst de strategische visie en de actuele status van het YMS Platform.

## ✅ Voltooid in v3.2.3.3 (Huidige Versie)

### Core Infrastructure
- **Active Session Management**: Role-based JWT (Tablet: 365d, Staff: 8u) met inactiviteits-timer bypass voor tablet-accounts.
- **Live Monitoring**: 'Active Users' counter in Sidebar, real-time socket-inzicht.
- **Data Verrijking**: `supplier_number` en `customer_number` in Adressenboek.
- **PDF Infrastructure**: PDFkit engine + e-mail service voor Transport Orders.

### YMS Dock Planning (v3.2.3.3 Stabilisatie)
- **FK-Mismatch Opgelost**: De `FOREIGN KEY(dockId, warehouseId)` compound-constraint is verwijderd uit `sqlite.ts`. Dit was de root cause van alle failende dock-toewijzingen.
- **SQL Parameter-Orde Fix**: `saveYmsDelivery` en `saveYmsDock` gebruiken nu expliciete kolomnamen in `INSERT OR REPLACE`-statements.
- **Upsert-Logica**: Docks en wachtruimtes kunnen nu correct worden toegevoegd én bijgewerkt vanuit de UI.
- **Warehouse-Specifieke Sync**: Globale broadcasts vervangen door per-warehouse filtering om data-lekkage te elimineren.
- **Optionele Gate-In**: `hasGate`-instelling per magazijn; zonder gate gaan leveringen direct van `PLANNED` naar `DOCKED`.
- **Timeline Zichtbaarheid**: Alle toegewezen ritten (`PLANNED`, `GATE_IN`, `DOCKED`) zijn zichtbaar op het dockschema.
- **Error Feedback**: Backend-exceptions worden via `error_message` socket-event getoond als Sonner-toasts.
- **Database Schema Reset**: Docks en wachtruimtes hebben nu een correcte composite `PRIMARY KEY(id, warehouseId)`.

### UI Verbeteringen
- **Sidebar Dropdowns**: Yard Operational als dropdown in de sidebar, losse menu-items verwijderd.
- **DockManager Upsert**: `+ Dock Toevoegen` gebruikt warehouse-specifieke ID-generatie om PK-conflicten te voorkomen.

### Global Pipeline — Sessie 2026-03-17
- **Gebruikersbeheer met Wachtwoorden**: Wachtwoorden instelbaar via de UI; server-side bcrypt hashing per `ADD_USER` / `UPDATE_USER`.
- **Dynamische Documentinstellingen**: Documentvereisten per zendingtype beheerbaar via `Instellingen > Documentinstellingen` zonder code-wijzigingen. Seeded in `sqlite.ts`.
- **Vite `allowedHosts`**: Productiedeploy op custom domein `ship.holtslag.me` geconfigureerd.

## ✅ Voltooid in v3.5.1 (Huidige Versie)
- **Automated Validation Framework**: Volledige test-suite met Vitest (Integration), DB-Health monitor en Playwright (E2E).
- **Headless Testing Foundation**: Infrastructuur voor geautomatiseerde validatie zonder browser-interactie.
- **Atoms Prop-Spreading Fix**: Architecturale fix voor `Card` en `Badge` componenten voor robuuste `data-testid` support.

## ✅ Voltooid in v3.4.2
- **State Reconciliation**: Heartbeat-mechanisme in `SocketContext` (30s sync interval).
- **Unit Testing Foundation**: Vitest setup met logistieke test-suites.
- **Architectural Cleanup**: Prop-drilling gereduceerd; Z-index management gecentraliseerd.

## 🕒 Next Up: Fase 3.2 — Live Dock Status (v3.5.2)
*Focus op backend-automatisering van dock-bezetting.*
- [ ] **Auto-Occupancy**: Docks automatisch op 'Occupied' zetten bij `DOCKED` status.
- [ ] **Auto-Release**: Docks automatisch vrijgeven bij `GATE_OUT`.
- [ ] **Conflict Detection**: Waarschuwingen bij dubbele dock-reserveringen.

## 🕒 Fase 3.3: Drag & Drop Timeline
- [ ] **Drag & Drop**: Leveringen verplaatsen tussen docks via drag-and-drop op de YmsTimeline.

---
*Status: v3.5.1 — Automated Validation Framework Operationeel*
*Regie: @System-Architect & @QA-Automator*
*Laatst bijgewerkt: 2026-03-26*
