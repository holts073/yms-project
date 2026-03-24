# ILG Foodgroup - Supply Chain & Yard Management System (YMS)

Een samenhangend, full-stack logistiek platform ontworpen om de operaties van warehouses, dock planningen, externe deliveries en de fysieke "yard" flow te orkestreren met maximale efficiëntie. Voorzien van een op maat gemaakte frontend design library.

## 🛠️ Stack & Technologie
Onze volledig gemoderniseerde stack focust op snelheid, voorspelbaarheid en stijl:
- **React 19 & Vite**: Voor bloedsnelle component rendering en HMR development cycli.
- **Tailwind CSS v4**: Gestileerd met een fundering aan Vanilla CSS (op maat gemaakte `index.css`).
- **UI Elementen**: *Lucide Icons* voor strakke vector iconografie, *Sonner Toasts* voor soepele en non-intrusieve systeemalerts, en *Framer Motion* voor vloeiende micro-animaties (waaronder in modals en sidebars).
- **Socket.io & Node.js**: Naadloze pushbased integratie en actieregeling over het netwerk.
- **SQLite (better-sqlite3)**: ACID-compliant opslag, perfect geoptimaliseerd voor lokale netwerkomgevingen via de WAL modus.

## 📂 Project Structuur (Atomic UI)
Het systeem volgt een strakke domeinscheiding om schaalbaarheid te garanderen:
- `/src/components/shared/` - *De Design System Primitives:* Buttons, Cards, Inputs, Modals en Badges. Deze elementen zijn blind in te zetten en gegarandeerd Dark Mode-proof.
- `/src/components/features/` - *De Bedrijfslogica:* Samengestelde componenten zoals `DeliveryTable` (Pipeline Kaarten), `YmsDeliveryList` (Yard Kaarten) en de `YmsTimeline`.
- `/src/components/pages/` - *Hoofdviews:* (De algemene containers, in dit geval gebundeld via `App.tsx` en `YmsDashboard.tsx`).

## 🚀 Logistiek Proces Overzicht
Onze supply chain is opgesplitst in drie naadloze hoofdmodules:
1. **Fase 1: Global Pipeline (Inkomend)**
   Vrachtbeheer voor `Containers` op zee en `Ex-works` leveringen bij leveranciers (FCA/FOB). Focus op verwachte tijden, douanevrijgaves en orderverantwoordelijkheid.
2. **Fase 2: Active Yard (Operationeel)**
   Het hart van de terminal: Trucks checken in via de Gate, ontvangen automatische wachtruimtes via de `YmsAssignmentModal`, en worden visueel op de Dock-Timeline gepland.
3. **Fase 3: History & Archive**
   Afgehandelde leveringen (`GATE_OUT`) worden voor altijd weggeschreven voor On-Time-In-Full (OTIF) analyses.

## 🎨 Visual Identity & Theme
- **Design System:** We bouwen louter op de eigen componenten in `shared/` om third-party chaos te vermijden. Elke knop en form gebruikt Tailwind CSS in symbiose met een strak CSS-variabelen fundament (`index.css`).
- **Dark Mode:** De React `ThemeProvider` verzorgt een realtime toggle. De kleuren (zachte indigo-tinten, transparante borders `border-border/50` en diepe slate-achtergronden) garanderen optimale leesbaarheid voor medewerkers tijdens nachtdiensten of in donkere loodskantoren.

## ⚙️ Installation & Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Database Initialization**
   Het systeem detecteert en migreert automatisch schema's naar `database.sqlite` bij het ontbreken ervan (via `src/db/sqlite.ts` schema's). Ook kun je basisdata forceren via `ts-node seed.ts`.

3. **Development Mode**
   Start express en vite concurrent:
   ```bash
   npm run dev
   ```

4. **Production Build**
   Controleer en bouw via tsc en vite build:
   ```bash
   npm run build
   ```

## 🔐 Security & Access
Bevat robuuste password throttling (`bcryptjs`) en sessie verificatie. Elke socket connectie handshaket via op JWT-berijkte payloads, wat niet-geauthoriseerde toegang per data-laag stolt.
