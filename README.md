# ILG Foodgroup - Supply Chain Control Tower (YMS)

Het ILG Yard Management Systeem (YMS) is getransformeerd van een simpele planningstool naar een allesomvattende **Control Tower**. Het orkestreert de volledige supply chain flow, van de initiële ex-works order bij de leverancier tot het moment dat de vrachtwagen de yard verlaat (Gate-out).

## 🚀 De Drie Kernmodules
Ons systeem is modulair opgebouwd om elke fase van de logistieke keten te beheersen:

1. **Global Pipeline (Inbound):** Volledig inzicht in `Containers` (haven-data, douanevrijgave) en `Ex-works` orders. Hier bewaken we de 'Estimated Time of Arrival' (ETA) en de documentstroom voordat goederen de yard bereiken.
2. **Active Yard (Operationeel):** Het kloppend hart van de operatie. Real-time beheer van actieve docks, wachtruimtes (Waiting Areas) en de visuele Dock-Timeline voor een vlekkeloze afhandeling van trucks.
3. **Outbound Planning:** Strategische toewijzing van docks voor klantzendingen, waarbij we de doorloop van lege naar beladen trailers optimaliseren.

## 🤖 AI-Driven Development: Het Team
Dit project wordt ontwikkeld en bewaakt door een gespecialiseerd team van 8 AI-agenten/rollen, elk met hun eigen expertise:

- **[Frontend-Specialist]**: De architect van de UI/UX, verantwoordelijk voor de React 19 interface en vloeiende interacties.
- **[System-Architect]**: De bewaker van de "Brug" (Sockets & Integratie) en de routering van data tussen frontend en backend.
- **[Data-Specialist]**: Beheerder van de persistentielaag en API-integriteit via Node.js en SQLite.
- **@Yard-Strategist**: Bewaker van de end-to-end logistieke flow en de statusovergangen van vrachten.
- **@QA-Automator**: De laatste verdedigingslinie; scant op bugs, console-errors en waarborgt de build-stabiliteit.
- **@UX-Visual-Director**: Onze esthetische gids; fine-tunt de Dark Mode, visuele hiërarchie en witte ruimte.
- **@Integration-Specialist**: Bouwer van externe bruggen (API's, Webhooks) naar transporteurs en leveranciers.
- **System Orchestrator**: De coördinerende kracht die de samenhang tussen alle specialisten en de broncode beheert.

## 🛠️ Stack & Technologie
- **React 19 & Vite**: Voor een moderne, responsieve gebruikerservaring.
- **Tailwind CSS v4 & Framer Motion**: Voor een premium look-and-feel met vloeiende animaties.
- **Socket.io**: Voor real-time status-updates over de gehele Control Tower.
- **Better-SQLite3 (WAL Mode)**: Robuuste, lokale data-opslag geoptimaliseerd voor hoge performance.

## ⚙️ Quick Start (v3.2.3.3)
*Nieuw in v3.2.3.3: Live Active Users counter, PDF Transport Orders, Tablet Persistence en Adressenboek Data-Verrijking.*

1. **Installatie**
   ```bash
   npm install
   ```
2. **Database Reset (Schoon begin)**
   ```bash
   npx tsx scripts/reset_db.ts
   ```
3. **Start Development**
   ```bash
   npm run dev
   ```

## 🔐 Beveiliging & Toegang
Het systeem maakt gebruik van robuuste password throttling en JWT-beveiligde socket-communicatie. Elke actie wordt gelogd in de `audit_logs` voor volledige traceerbaarheid.

