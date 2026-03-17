# ILG Foodgroup - Supply Chain Portal

Welkom bij het ILG Foodgroup Supply Chain Portal (voorheen Yard Management System / YMS). Dit project wordt gebruikt voor het naadloos beheren en volgen van Ex-Works en Container leveringen, met een overzichtelijk dashboard, on-time in-full (OTIF) berekeningen en documentbeheer.

## 🛠️ Technologie Stack
- **Frontend**: React, TypeScript, Tailwind CSS, Framer Motion, Lucide React
- **Backend**: Node.js, Express, Socket.IO (voor real-time updates)
- **Database**: SQLite (via `better-sqlite3`)
- **Build Tool**: Vite

## 🚀 Systeemvereisten
- [Node.js](https://nodejs.org/) (versie 18 of hoger aanbevolen)
- npm (wordt standaard bij Node.js geïnstalleerd)

## 📦 Installatie & Setup

Volg deze stappen om het project lokaal te installeren en uit te voeren:

1. **Clone de repository**
   ```bash
   git clone <jouw-repository-url>
   cd yms-project
   ```

2. **Installeer de afhankelijkheden**
   Installeer alle benodigde pakketten voor zowel de frontend als de backend:
   ```bash
   npm install
   ```

3. **Omgevingsvariabelen (Optioneel)**
   Het project gebruikt standaard fallbacks voor development, maar voor productie kun je een `.env` bestand aanmaken:
   ```env
   JWT_SECRET=jouw_super_geheime_key_hier
   ```

4. **Start de applicatie (Development Mode)**
   Start zowel de Vite development server als de Node.js Express/Socket backend tegelijk:
   ```bash
   npm run dev
   ```
   *De applicatie zal nu lokaal draaien, typisch bereikbaar via `http://localhost:3000` of de poort aangegeven in de terminal.*

   > **Let op:** De eerste keer dat de server start, wordt er automatisch een `yms.db` (SQLite database) aangemaakt en gevuld met demo data (leveranciers, transporteurs en voorbeeldleveringen). Als je met een schone lei wilt beginnen zonder oude conflicterende data, kun je simpelweg het bestand `yms.db` verwijderen en de server herstarten.

## 🏗️ Productie (Build)

Om de applicatie te bouwen voor productie:
```bash
npm run build
```
Start de productie server:
```bash
npm start
```

## nl Structuur & Belangrijkste Functies

- `/src/components/Dashboard.tsx`: KPI's, OTIF resultaten, overzichtelijk actiepuntenscherm.
- `/src/components/DeliveryManager.tsx`: Logica voor Ex-Works (1 document vereist) en Containers (5 documenten). Inclusief status transitions.
- `/src/components/AddressBook.tsx`: Beheer van leveranciers & expediteurs (automatisch alfabetisch gesorteerd).
- `/server.ts`: Bevat de Express routes, SQLite initialisatie, JWT authenticatie, configuratie van demo-data en Socket.io state integratie.

## 🔐 Standaard Login (Demo)
Bij de eerste opstart worden de volgende demo-gebruikers aangemaakt (Wachtwoord voor allen: `welkom123`):
- `admin@example.com` (Admin User)
- `staff@example.com` (Warehouse Staff)
- `ElmerHoltslag@gmail.com` (Admin)

---
*Gemaakt voor ILG Foodgroup Supply Chain Management.*
