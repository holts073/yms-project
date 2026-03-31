# REFACTOR_ADVICE: Kwaliteit & Stabiliteit
*Versie: v3.10.1 — Bijgewerkt: 2026-03-31 door @System-Architect*

Dit document is de "strafexpeditie-lijst" van het team. Onderstaande punten moeten worden geadresseerd voordat nieuwe epics starten.

## 🛠️ Nieuwe Adviezen: Real-time & Synchronization (v3.11.0)

### 1. Delta Event Optimization
Momenteel gebruikt de `syncDockStatus` een volledige `broadcastState`. Bij extreem grote magazijnen (> 100 docks) is het raadzaam om over te stappen op een specifiek `DOCK_UPDATED` delta-event om client-side re-renders te minimaliseren.

### 2. Form State Persistence
Onderzoek of we de edit-form state in de `DeliveryManager` kunnen bufferen in `localStorage` om dataverlies bij incidentele socket-disconnects te voorkomen.

## ✅ Opgelost in v3.10.0 (Hardening & Synchronization)
- **Role-Based Access Control (RBAC)** ✅: Middleware (`checkRole`) en Protected UI vangen nu ongeautoriseerde acties af. Getest met de nieuwe `rbac_security.spec.ts`.
- **Dock Occupancy Sync** ✅: `syncDockStatus` broadcast nu direct een state-update bij statuswijzigingen, waardoor docks real-time vrijkomen.
- **Stuck Popup Fix** ✅: `DeliveryManager` auto-open is nu idempotent per ID, wat recursieve popups na een save voorkomt.
- **Environment Isolation & Reset** ✅: `reset-db.ts` herstelt nu de volledige database-integriteit inclusief test-gebruikers.
- **Async Socket Synchronization** ✅: `window.YMS_READY` garantie in alle E2E tests via `helpers.ts`.

## ✅ Opgelost in v3.9.x (Quality Assurance Breakthrough)
- **100% E2E Pass Rate** ✅: De volledige Playwright suite is nu operationeel. Geen timeouts meer door 'Hidden Sidebar' of ontbrekende velden.
- **Socket State Upsert** ✅: Voorkomt 'ghost data' in de UI door real-time incorporatie van nieuwe leveringen.
- **Database Constraint Enforcement** ✅: Alle flows gevalideerd tegen `NOT NULL` constraints van SQLite.

## ✅ Opgelost in v3.7.5 (Type-Safety)
- **Massive Type-Safety Fix** ✅: 18 kritieke type-fouten in `StatCard`, `Statistics` en `DashboardKPIs` zijn opgelost. Het project is nu 100% lint-free (`tsc --noEmit`).
- **StatCard Component Refactor** ✅: Ondersteunt nu `variant`, `active`, `onClick`, `description` en `compact` props voor betere dashboard-integratie.
- **Legacy Cleanup** ✅: Verwijdering van `inspect.ts` en `inspect2.ts` om de IDE "Problems" lijst schoon te houden.

## ✅ Opgelost in v3.7.0 - v3.7.4
- **Table-First Design** ✅: Alle core YMS lijsten zijn omgezet naar compacte tabellen voor maximaal overzicht.
- **Compact Archief & Filters** ✅: Bruikbaar voor grote datasets door minder witruimte en krachtige zoekopties.
- **Infrastructuur Beheer** ✅: Docks en Wachtplaatsen kunnen door Admins worden verwijderd.
- **Full Theme Synchronization** ✅: 100% theme-aware voor alle brand-thema's (ILG, Meledi).
- **Delta-Updates (Performance Refactor)** ✅: Staat pakt nu alleen wijzigingen op (`state_patch`) in plaats van volledige state-diffs.

## 🟡 Prioriteit 1: Optimalisatie & Cleanup
- **SMTP Setup**: Geef een duidelijke foutmelding in de UI als credentials ontbreken voor de transport-mail.
- **Asset Optimalisatie**: `logo.jfif` en andere afbeeldingen omzetten naar `.webp`.
