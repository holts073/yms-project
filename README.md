# ILG Foodgroup — Supply Chain# YMS Control Tower v3.6.0
*Versie: v3.6.0 — Bijgewerkt: 2026-03-26*

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

## 🆕 Changelog v3.6.0

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
