# REFACTOR_ADVICE: Kwaliteit & Stabiliteit
*Versie: v3.14.0 — Bijgewerkt: 2026-04-08 door @System-Architect*

Dit document is de "strafexpeditie-lijst" van het team. Onderstaande punten moeten worden geadresseerd voordat nieuwe epics starten.

## ✅ Opgelost in v3.12.0 (Modular Finance & Incoterm History)
- **Financial Modularization** ✅: Introductie van de `enable_finance` vlag in `AppSettings`. Alle financiële UI en backend transacties zijn nu conditioneel.
- **Incoterm UX** ✅: Automatische geschiedenis-ondersteuning (`GET_LAST_INCOTERM`) verwijdert handmatige invoer-frictie voor herhalende leveranciers.
- **Advanced Cost Tracking** ✅: Database ondersteunt nu Demurrage, Standgeld en THC zonder de operationele kern te belasten.

## 🛠️ Prioriteit: Security & AVG Compliance (v3.12.x)
*Verantwoordelijke agent: @Security-Auditor*

- **Socket Handler Audit**: Handmatige controle van alle socket acties op RBAC-doorbraken. 
- **Data Minimalisatie**: Inspecteer `deliveries` en `address_book` op overbodige BSN of andere privacy-gevoelige data.
- **Port Isolation**: Garanderen dat de API-endpoints niet direct van buitenaf bereikbaar zijn zonder proxy/firewall (voorbereiding op portal).
- **Audit Logs Encryption**: Onderzoek de haalbaarheid van versleutelde opslag voor de `audit_logs` tabel.

## ✅ Opgelost in v3.10.5 (Document Milestone Enforcement)
- **Dynamic Document Blocking** ✅: Gebruik van `blocksMilestone` in de `documents` tabel vervangt hardcoded logica in `logistics.ts`.
- **Red-Alert UI** ✅: `DeliveryDetailModal` toont nu rode waarschuwingen voor ontbrekende documenten die de *huidige* volgende stap blokkeren.
- **High-Fidelity Seed** ✅: `seed.ts` bevat nu realistische document-trajecten (ATR, EUR1, NOA).

## ✅ Opgelost in v3.10.4 (Logistics Analytics)
- **Carrier Performance Monitoring** ✅: `getYmsPerformance` query en `CarrierPerformance.tsx` component voor real-time stiptheidsmeting.
- **Reliability Scoring** ✅: Automatische 0-100 score op basis van ETA-afwijkingen.

## 🛠️ Nieuwe Adviezen: UI & UX Consistency (v3.11.0)

### 1. Dynamic Sidebar Themes ✅
Nu de sidebar iconen kleurgecodeerd zijn, gebruiken we `motion` om de actieve achtergrondkleur (de "glow") dynamisch te laten matchen met de kleur van het icoon in plaats van altijd indigo. Toegevoegd in v3.11.0.

### 2. Form State Persistence
Onderzoek of we de edit-form state in de `DeliveryDetailModal` kunnen bufferen in `localStorage` om dataverlies bij incidentele socket-disconnects te voorkomen.

## ✅ Opgelost in v3.10.2 (UI/UX & Navigation Refactor)
- **Redundant Modals** ✅: Introductie van `DeliveryDetailModal.tsx` als centrale single-source-of-truth voor leveringsbeheer. 
- **Navigation Friction** ✅: Direct dashboard editing verwijdert de noodzaak om naar de pipeline te switchen voor kleine wijzigingen.
- **Settings Centralization** ✅: Magazijncapaciteit is verplaatst naar een eigen tab in de instellingen, weg van het operationele dashboard.

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
