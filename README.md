# ILG Foodgroup — Supply Chain# YMS Control Tower v3.7.4
*Versie: v3.7.4 — Bijgewerkt: 2026-03-27*

Het ILG Yard Management Systeem (YMS) orkestreert de volledige supply chain flow: van de initiële ex-works order bij de leverancier tot het moment dat de vrachtwagen de yard verlaat.

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
| Testing | Vitest |

## 📐 Architectuur in het kort

Het systeem hanteert een strikte **uni-directionele dataflow**:

```
UI Action → socket.emit('action') → Server validatie → SQLite write
    → buildStaticState(warehouseId) → socket.emit('state_update') → React re-render
```

Zie `ARCHITECTURE.md` voor de volledige blauwdruk.

## 🆕 Changelog v3.7.4 (Layout Consolidation & Density)

### UI & UX (Snelheid & Overzicht)
- **✅ Table-First Design**: De kaarten in "Actieve Leveringen", "Dock Status" en "Wachtruimtes" zijn vervangen door compacte, professionele tabellen.
- **✅ Vertical Dock List**: Docks worden nu in een verticale lijst onder elkaar weergegeven, waardoor het volledige yard-overzicht in één oogopslag zichtbaar is zonder horizontaal te scrollen.
- **✅ Stuck Delivery Fix**: Statusovergangen voor `IN_YARD` en manual progressions zijn toegevoegd, inclusief een directe verwijder-optie voor beheer.
- **✅ High Density**: De grid-indeling (xl:grid-cols-4) zorgt voor een optimale benutting van moderne breedbeeldmonitoren.

## 🆕 Changelog v3.7.3 (Theme & UI Polish)

### UI & UX (Styling & Consistentie)
- **✅ Sidebar Optimalisatie**: Sidebar is compacter gemaakt (py-2.5) en spacing tussen items is verfijnd.
- **✅ Versie Sync**: App versie in de sidebar bijgewerkt naar `v3.7.3`.
- **✅ Theme-Aware Toggles**: De Tabel/Kaarten schakelaar en andere UI-toggles respecteren nu alle thema's (Light, Dark, ILG, Meledi).
- **✅ YMS Theme Integration**: Yard Management pagina's maken nu volledig gebruik van CSS variabelen (`--background`, `--muted`), waardoor ze correct meekleuren met de geselecteerde brand-thema's.

## 🆕 Changelog v3.7.2 (UI Flow & Responsiviteit)

### UI & UX (Brede Schermen)
- **✅ Responsive Milestones**: De MilestoneStepper is nu dynamisch breder op grote schermen, waardoor labels en stappen niet meer krap ("cramped") overkomen.
- **✅ Verhoogde Breedte in Lijstweergave**: De kolombreedte voor mijlpalen in de tabel-weergave is verdubbeld om overlapping te voorkomen.

### Operational Flow (Logistiek Lifecycle)
- **✅ Schoon Dashboard**: Geloste leveringen (`COMPLETED` / `GATE_OUT`) worden nu direct uit de "Actieve Leveringen" telling en lijst gefilterd voor een actueel operationeel overzicht.
- **✅ updatedAt Sync**: Elke statuswijziging ververst nu de `updatedAt` timestamp, waardoor het archief altijd de meest recente en accurate data toont per datum.
- **✅ Terminale Status**: Verbeterde afhandeling van de volledige lifecycle (van Inbound tot Gate-Out) voor alle vrachttypes.

## 🆕 Changelog v3.7.1 (Optimalisatie & Stabiliteit)

### UI & UX (Dichtheid & Contrast)
- **✅ Compacte Tabellen**: Padding en lettergroottes in alle overzichten verkleind voor maximale informatiedichtheid zonder verlies van leesbaarheid. High-Density mode is nu de standaard.
- **✅ Toggle Refinement**: De Grid/Lijst toggle knop in de Pipeline heeft nu een verbeterd contrast en premium 'glassmorphism' effect in Dark Mode.
- **✅ Verfijnde Container Milestones**: De flow is uitgebreid naar 6 stappen (Order -> In Transit [SWB] -> Douane -> Onderweg [NOA] -> Arrival -> Ingecheckt).

### Operationele Controle
- **✅ Magazijn Openingstijden**: Configuratie van openingstijden (standaard 07:00 - 15:00) per magazijn.
- **✅ Timeline Validatie**: Visuele "OUTSIDE HOURS" waarschuwingen op de timeline wanneer zendingen buiten operationele uren worden gepland.
- **✅ Kritieke Bug Fix**: "Lossen" en "Gereed" acties in de leverlijst hersteld (fix voor de `undefined` validation error).

## 🆕 Changelog v3.7.0 (UX & Infrastructure Polish)

### Gebruikerservaring & UI
- **✅ Interactieve Milestones**: Handmatige overrides voor container-milestones direct vanuit de tabel.
- **✅ Auto-Milestone Progression**: Automatische status-sprongen op basis van document-ontvangst (SWB/NOA/NOE/NOI).
- **✅ Compact Archief**: Geoptimaliseerde weergave in het archief met minder witruimte en krachtigere filters (Type & Leverancier).
- **✅ Real-time Notificaties**: Visuele toasts voor nieuwe zendingen, aankomsten bij de gate en statuswijzigingen.

### Infrastructuur Beheer
- **✅ Dock & Wachtplaats Beheer**: Admins kunnen nu docks en wachtplaatsen verwijderen en wijzigen.
- **✅ Stabiele Sortering**: Docks en wachtruimtes verspringen niet meer bij status-updates dankzij stabiele `useMemo` sortering.
- **✅ Data Cleanup**: Verwijdering van legacy demo-data voor een schone productie-omgeving.

---

## 🆕 Changelog v3.6.1 (Stabiliteits Sprint)
### UI & UX Enhancements
- **✅ Directe Navigatie**: Dashboard-acties ("Lossen") navigeren nu direct naar de detail-modal van de zending.
- **✅ Pipeline View Toggle**: Gebruikers kunnen nu schakelen tussen een **Grid** en **Lijst** weergave voor optimaal overzicht.
- **✅ Document Tooltips**: Opmerkingen bij zendingen zijn direct leesbaar via hover-tooltips in alle tabellen.

### Logistieke Tools & Compliance
- **✅ Transport Mail Interface**: Verstuur direct transportopdrachten op basis van Ex-Works data met een druk op de knop.
- **✅ Bill of Lading (B/L)**: Integratie van het B/L veld voor container-zendingen in alle overzichten.
- **✅ Audit Logbook**: Per zending in het archief is een volledig historie-overzicht (wie-wat-wanneer) beschikbaar.

### Stabiliteit & Infrastructuur (v3.5.4)
- **✅ Server-Side State Merge**: Voorkomt database crashes bij partiële updates door bestaande velden te behouden.
- **✅ Functional UI Fix**: Runtime fouten in het Dashboard segment zijn geëlimineerd door refactoring naar moderne React patronen.

## 🆕 Changelog v3.2.3.3

### YMS & Infrastructuur
- **🔴 Kritieke Fix**: `FOREIGN KEY(dockId, warehouseId)` compound-constraint verwijderd uit `yms_deliveries`. Dit blokkeerde alle dock-toewijzingen.
- **🔴 SQL Fix**: Parameter-volgorde in `saveYmsDelivery` gerectificeerd — dockId werd eerder als scheduledTime opgeslagen.
- **✅ Dock Upsert**: `saveYmsDock` gebruikt nu `INSERT OR REPLACE` waardoor nieuwe docks correct worden opgeslagen.
- **✅ Optionele Gate**: Magazijnen zonder gate (`hasGate = false`) sturen trucks direct van aanmelding naar dock.
- **✅ Warehouse Isolatie**: State-updates zijn nu strikt per magazijn gefilterd.
- **✅ Error Toasts**: Backend-exceptions zijn zichtbaar als Sonner-toasts in de UI.

### Global Pipeline (sessie 2026-03-17)
- **✅ Gebruikersbeheer**: Admins kunnen nu wachtwoorden instellen en wijzigen vanuit de UI. Hashing via `bcrypt` op de server.
- **✅ Dynamische Documentinstellingen**: Nieuwe pagina `/instellingen/documenten` waarmee verplichte en optionele documenten per zendingtype (`container` / `ex-works`) beheerd worden zonder code-wijzigingen.
- **✅ Vite `allowedHosts`**: Productiedeploy op `ship.holtslag.me` geconfigureerd in `vite.config.ts`.

## 🤖 Automated Validation Framework (@QA-Automator)

Sinds v3.5.1 beschikt het systeem over een volledig geautomatiseerde test-suite om de stabiliteit van de v3.5.0 architectuur te garanderen:

*   **`npm run test:full`**: Voert achtereenvolgens de Socket de Integratietests, Database Health Check en Playwright E2E tests uit.
*   **Headless E2E**: Playwright tests draaien 'headless' voor snelle validatie van de Priority Queue en dock-flows.
*   **CI/CD Ready**: De suite is geoptimaliseerd voor headless omgevingen en vereist geen handmatige browser-interactie.

## 🔐 Beveiliging

- JWT-authenticatie op alle socket-verbindingen en API-endpoints
- Role-based access control (admin / staff / tablet)
- Tablet-accounts: JWT 365 dagen, geen inactiviteits-timeout
- Wachtwoorden opgeslagen als `bcrypt`-hash (cost factor 10) — nooit in plaintext
- Alle gebruikersacties worden gelogd in `audit_logs`

> [!CAUTION]
> Zorg dat `JWT_SECRET` als omgevingsvariabele is ingesteld in productie (`.env`). De hardcoded fallback is **uitsluitend** voor lokale ontwikkeling.

## 📁 Projectstructuur

```
/src
  /components
    /shared       # Atoms: Button, Modal, Badge, Card
    /features     # Organisms: YmsTimeline, DockGrid, DeliveryTable
  /hooks          # useYmsData, useDeliveries
  /db             # queries.ts, sqlite.ts
  /types.ts       # Centrale TypeScript-interfaces
/server
  /routes         # Express-endpoints + buildStaticState
  /sockets        # socketHandlers.ts — centrale actie-router
  /services       # pdfService, etc.
database.sqlite   # Lokale SQLite data
```
