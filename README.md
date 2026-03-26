# ILG Foodgroup — Supply Chain Control Tower (YMS)
*Versie: v3.2.3.3*

Het ILG Yard Management Systeem (YMS) orkestreert de volledige supply chain flow: van de initiële ex-works order bij de leverancier tot het moment dat de vrachtwagen de yard verlaat.

## 🚀 De Drie Kernmodules

1. **Global Pipeline (Inbound):** Volledig inzicht in `Containers` (haven-data, douanevrijgave) en `Ex-works` orders. ETA-bewaking en documentstroom vóór aankomst.
2. **Active Yard (Operationeel):** Real-time beheer van actieve docks, wachtruimtes en de visuele **Dock-Timeline** voor vlekkeloze afhandeling van trucks.
3. **Outbound Planning:** Strategische toewijzing van docks voor klantzendingen.

## ⚙️ Quick Start

```bash
# 1. Installeer afhankelijkheden
npm install

# 2. Start de development server
npm run dev
```

De applicatie is beschikbaar op `http://localhost:3000`.

**Standaard inloggegevens:**
- Admin: `admin@ilg.nl` / `Admin1234!`

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

## 🤖 Het Ontwikkelteam (AI-Agenten)

| Agent | Verantwoordelijkheid |
|---|---|
| [System-Architect] | Sockets, routing, architectuurbewaking |
| [Frontend-Specialist] | UI/UX, React-componenten |
| [Data-Specialist] | SQLite, queries, REST-endpoints |
| @Yard-Strategist | Logistieke flow & statusovergangen |
| @QA-Automator | Bug-preventie & build-stabiliteit |
| @UX-Visual-Director | Dark Mode, visuele hiërarchie |
| @Integration-Specialist | Externe API's & Webhooks |

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
