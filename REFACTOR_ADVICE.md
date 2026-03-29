# REFACTOR_ADVICE: Kwaliteit & Stabiliteit
*Versie: v3.7.4 — Bijgewerkt: 2026-03-27*

Dit document is de "strafexpeditie-lijst" van het team. Onderstaande punten moeten worden geadresseerd voordat nieuwe epics starten.

## ✅ Opgelost in v3.7.0
- **Compact Archief & Filters** ✅: Het archief is nu bruikbaar voor grote datasets door minder witruimte en krachtige zoekopties.
- **Infrastructuur Beheer** ✅: Docks en Wachtplaatsen kunnen nu door Admins worden verwijderd. Dit voorkomt vervuiling van de UI bij wijzigingen in het magazijn.
- **Real-time Feedback** ✅: Introductie van het `notification` event om gebruikers direct op de hoogte te stellen van kritieke events (zonder full state diffs).
- **Zwak standaardwachtwoord Flow** ✅: `requiresReset` logic dwingt gebruikers tot een veilig wachtwoord.
- **High-Density Table Design (v3.7.4)** ✅: Alle core YMS lijsten (Leveringen, Docks, Wachtruimtes) zijn omgezet van kaarten naar compacte tabellen voor maximaal overzicht.
- **Full Theme Synchronization (v3.7.4)** ✅: Hardcoded CSS tokens zijn gesaneerd; de UI is nu 100% theme-aware voor alle brand-thema's (ILG, Meledi).
- **Audit Trail Coverage & Consistency (Refactor)** ✅: Gecentraliseerde auditing in de DB-laag; elke `UPDATE` wordt nu consistent vastgelegd.
- **Delta-Updates (Performance Refactor)** ✅: Staat pakt nu alleen wijzigingen op (`state_patch`) in plaats van volledige state-diffs, wat de schaalbaarheid verbetert.

## ✅ Opgelost in v3.6.0 / v3.6.1
- **Partial Update Crash (v3.5.4)** ✅: `socketHandlers.ts` implementeert nu server-side merging van data.
- **Security Baseline (v3.6.1)** ✅: Bcrypt resilience en forced reset operationeel.
- **Prop-drilling (v3.6.1)** ✅: `YmsDashboard` gesaneerd via `useYmsData`.

## 🟡 Prioriteit 2: Operationele Configuratie
- **SMTP Setup**: Geef een duidelijke foutmelding in de UI als credentials ontbreken.
- **Asset Optimalisatie**: `logo.jfif` en andere afbeeldingen omzetten naar `.webp`.
