# REFACTOR_ADVICE: Kwaliteit & Stabiliteit
*Versie: v3.6.1 — Bijgewerkt: 2026-03-26*

Dit document is de "strafexpeditie-lijst" van het team. Onderstaande punten moeten worden geadresseerd voordat nieuwe epics starten.

## ✅ Opgelost in v3.6.0
- **Partial Update Crash (v3.5.4)** ✅: `socketHandlers.ts` implementeert nu server-side merging van data. Dit voorkomt dat `NOT NULL` constraints (zoals `type`) falen bij updates die niet alle velden bevatten. 
- **Functional Component 'this' Context** ✅: Refactored `YmsDashboard.tsx` handlers om `this` context issues in functional components te voorkomen.
- **Pipeline View Consistency** ✅: De nieuwe Grid/List toggle in de pipeline zorgt voor een flexibele UI die past bij de werklast.
- **Navigation Flow** ✅: Dashboard deep-linking via `initialSelectedId`.
- **Security Baseline (v3.6.1)** ✅: `requiresReset` flag en Bcrypt resilience geïmplementeerd. De login flow is nu crash-proof.
- **Prop-drilling (v3.6.1)** ✅: `YmsDashboard` gesaneerd; sub-componenten praten nu direct met `useYmsData`.
- **Loading UX (v3.6.1)** ✅: Skeleton loaders en Shell-First rendering operationeel.

## ✅ Opgelost in v3.2.3.3 (Selectie)
- **FK-Mismatch Database**: De `FOREIGN KEY(dockId, warehouseId) REFERENCES yms_docks` compound-constraint is verwijderd.
- **Broken Data-TestID in Atoms**: Shared components (`Card`, `Badge`) spreaden nu props naar DOM-elementen.
- **E2E Testing Foundation**: Playwright framework operationeel.

## 🔴 Prioriteit 1: Beveiliging & Integriteit

- **Zwak standaardwachtwoord**: Nieuwe gebruikers krijgen `welkom123`. Overweeg een forced-reset flow.
- **Schema Migratie Strategie**: Implementeer een formele migratie-engine (bijv. genummerde SQL-bestanden in `/migrations/`).
- **Audit Trail Coverage**: Zorg dat alle `UPDATE` acties in de database een overeenkomstige regel in `audit_logs` schrijven (niet alleen via socket-events).

## 🟡 Prioriteit 1: Code Kwaliteit & Resilience
- **Null-Safety bij Async Sync**: Nu we "Shell-First" renderen, moeten alle nieuwe componenten standaard optional chaining (`?.`) gebruiken bij property-access op de globale state.
- **Ongeoptimaliseerde real-time sync**: Elk `DELIVERY_UPDATED` event triggert een volledige herlaad voor alle clients. Overweeg delta-updates (Phase 3.7).

## 🟢 Prioriteit 2: Operationele Configuratie
- **SMTP Setup**: Geef een duidelijke foutmelding in de UI als credentials ontbreken.
- **Asset Optimalisatie**: `logo.jfif` en andere afbeeldingen omzetten naar `.webp`.
