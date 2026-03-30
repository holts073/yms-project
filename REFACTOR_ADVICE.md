# REFACTOR_ADVICE: Kwaliteit & Stabiliteit
*Versie: v3.7.5 — Bijgewerkt: 2026-03-29 door @System-Architect*

Dit document is de "strafexpeditie-lijst" van het team. Onderstaande punten moeten worden geadresseerd voordat nieuwe epics starten.

## ✅ Opgelost in v3.7.5 (Huidige Focus)
- **Massive Type-Safety Fix** ✅: 18 kritieke type-fouten in `StatCard`, `Statistics` en `DashboardKPIs` zijn opgelost. Het project is nu 100% lint-free (`tsc --noEmit`).
- **StatCard Component Refactor** ✅: Ondersteunt nu `variant`, `active`, `onClick`, `description` en `compact` props voor betere dashboard-integratie.
- **Legacy Cleanup** ✅: Verwijdering van `inspect.ts` en `inspect2.ts` om de IDE "Problems" lijst schoon te houden.

## ✅ Opgelost in v3.7.0 - v3.7.4
- **Table-First Design** ✅: Alle core YMS lijsten zijn omgezet naar compacte tabellen voor maximaal overzicht.
- **Compact Archief & Filters** ✅: Bruikbaar voor grote datasets door minder witruimte en krachtige zoekopties.
- **Infrastructuur Beheer** ✅: Docks en Wachtplaatsen kunnen door Admins worden verwijderd.
- **Full Theme Synchronization** ✅: 100% theme-aware voor alle brand-thema's (ILG, Meledi).
- **Delta-Updates (Performance Refactor)** ✅: Staat pakt nu alleen wijzigingen op (`state_patch`) in plaats van volledige state-diffs.

## 🟡 Prioriteit 1: Systeem Integriteit
- **RBAC Enforcement (v3.10.0)**: Middleware implementeren die elke destructieve actie valideert tegen de permissies van de gebruiker.
- **SMTP Setup**: Geef een duidelijke foutmelding in de UI als credentials ontbreken voor de transport-mail.

## 🟡 Prioriteit 2: Optimalisatie
- **Asset Optimalisatie**: `logo.jfif` en andere afbeeldingen omzetten naar `.webp`.
- **E2E Opschaling**: Uitbreiden van Playwright tests naar alle kritieke flows (Archive, Settings).
