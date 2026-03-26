# REFACTOR_ADVICE: Kwaliteit & Stabiliteit
*Versie: v3.2.3.3 — Bijgewerkt: 2026-03-26 — Refactor: 2026-03-26*

Dit document is de "strafexpeditie-lijst" van het team. Onderstaande punten moeten worden geadresseerd voordat nieuwe epics starten.

## ✅ Opgelost in v3.2.3.3

- **FK-Mismatch Database**: De `FOREIGN KEY(dockId, warehouseId) REFERENCES yms_docks` compound-constraint is verwijderd uit `sqlite.ts`. Dit blokkeerde **alle** writes naar `yms_deliveries`.
- **SQL Parameter-Orde**: `saveYmsDelivery` en `saveYmsDock` hadden verwisselde parameters. Dit is gerectificeerd via expliciete kolomnamen in `INSERT OR REPLACE`.
- **Dubbele Socket-Handler**: De dubbele `YMS_SAVE_DELIVERY` case in `socketHandlers.ts` is geconsolideerd naar één warehouse-bewuste handler.
- **Dark Mode Contrast**: Contrastproblemen in dropdowns en modale schermen zijn opgelost via `color-scheme: dark` en CSS-tuning.
- **Gebruikersbeheer — Wachtwoord**: Admins kunnen wachtwoorden instellen/wijzigen via de UI. Server hash via `bcrypt` (sessie 2026-03-17).
- **Dynamische Documentinstellingen**: Verplichte/optionele documenten beheerbaar via Instellingen zonder code-aanpassing (sessie 2026-03-17).
- **Vite AllowedHosts**: `ship.holtslag.me` geconfigureerd in `vite.config.ts` (sessie 2026-03-17).
- **Hardcoded JWT Secret** ✅: Guard toegevoegd in `middleware/auth.ts` en `routes/auth.ts` — gooit fatale fout bij ontbrekend `JWT_SECRET` in productie (sessie 2026-03-26).
- **Kwetsbare Document-Status Koppeling** ✅: `triggers_status_jump` + `triggers_status_value` vlaggen toegevoegd aan `shipment_settings` seed in `sqlite.ts` (sessie 2026-03-26).
- **Zwakke ID-generatie** ✅: `Math.random().toString(36)` vervangen door `crypto.randomUUID()` in YMS delivery ID-allocatie (sessie 2026-03-26).
- **Wachtwoord bevestigingsveld** ✅: "Bevestig Wachtwoord" veld + client-side validatie toegevoegd aan `UserModal.tsx` (sessie 2026-03-26).
- **Error Boundaries** ✅: `ErrorBoundary` gewrapped rondom `YmsDeliveryList` in `YmsDashboard.tsx` (sessie 2026-03-26).

## 🔴 Prioriteit 1: Beveiliging & Integriteit

- **Zwak standaardwachtwoord**: Nieuwe gebruikers krijgen `welkom123` als standaardwachtwoord. Overweeg een forced-reset flow bij eerste login.
- **Schema Migratie Strategie**: Het huidige patroon van `CREATE TABLE IF NOT EXISTS` kan bestaande schema-problemen (verkeerde constraints) niet repareren. Implementeer een formele migratie-engine (bijv. genummerde SQL-bestanden in `/migrations/`) die bij server-start incrementeel wordt toegepast.
- **WAL-Lock Probleem**: De SQLite WAL-mode veroorzaakte hangende node-scripts wanneer de server actief was. Gebruik `BEGIN IMMEDIATE` voor kritieke schema-wijzigingen of voer resets altijd uit met de server gestopt.
- **Geen Cascade-Deletes meer**: Door het verwijderen van de compound FK zijn cascade-deletes op docks/wachtruimtes niet meer automatisch. Implementeer handmatige cleanup-logica in `deleteYmsDock` en `deleteYmsWaitingArea`.

## 🟡 Prioriteit 2: Code Kwaliteit

- **`any`-types in queries.ts**: Vrijwel alle functies in `queries.ts` gebruiken `any` als parameter-type. Vervang door getyped interfaces uit `types.ts` (met name `YmsDelivery`, `YmsDock`).
- **Prop-drilling in YmsDashboard**: `YmsDashboard.tsx` geeft nog teveel props door naar sub-componenten. Verplaats dock/waitingArea access naar de reeds bestaande `useYmsData` hook in leaf-componenten.
- **Ongeoptimaliseerde real-time sync**: Elk `DELIVERY_UPDATED` event triggert een volledige herlaad voor alle clients. Overweeg delta-updates of per-delivery pub/sub.

## 🟡 Prioriteit 3: Visuele Consistentie

- **Padding & Margins**: De transitie tussen `Global Pipeline` cards en `Active Yard` grid vertoont inconsistente tussenruimtes. Standaardiseer op `gap-8` of `gap-10`.
- **Loading States**: Vervang generieke spinners door skeleton-loaders die passen bij de kaart/tabelstructuur.
- **Timeline Scroll-anchor**: Bij het openen van Docks & Planning scrolt de timeline niet automatisch naar de huidige tijd. Implementeer een `scrollToNow()`-functie met een IntersectionObserver.

## 🟢 Prioriteit 4: Operationele Configuratie

- **SMTP Setup**: De PDF Transport Order functie vereist correcte SMTP-instellingen in Bedrijfsinstellingen. Geef een duidelijke foutmelding in de UI als credentials ontbreken (in plaats van een stille 500-error).
- **Asset Optimalisatie**: `logo.jfif` en andere afbeeldingen omzetten naar `.webp`.
- **Demo Data Script**: Maak een officieel `scripts/seed_demo.ts` script dat consistente testdata aanmaakt (vervangt ad-hoc node -e commando's).
