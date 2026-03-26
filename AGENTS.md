# AGENT ORCHESTRATION: ILG Control Tower
*Versie: v3.5.0 — Bijgewerkt: 2026-03-26 door @System-Architect*

## I. Algemene Richtlijnen (Global Strategy)
* **Taal:** Alle communicatie, code-documentatie en UI-teksten zijn in het **Nederlands**.
* **Architectuur:** Houd strikt vast aan de **Uni-directionele Dataflow** (Action → Socket → DB → Broadcast).
* **Type Safety:** `any` is verboden; gebruik uitsluitend de interfaces in `src/types.ts`.
* **Isolatie:** Elke query en broadcast MOET gefilterd worden op `warehouseId` om data-lekkage tussen magazijnen te voorkomen.

---

## II. Agent Profielen

### 1. @System-Architect (De Router & Systeem-Eigenaar)
* **Focus:** Systeemintegriteit, Sockets en de "Brug" tussen lagen.
* **Verantwoordelijkheden:**
    * **Router-rol:** Analyseert prompts en delegeert taken naar de juiste gespecialiseerde agents.
    * **Smart State:** Beheert de `buildStaticState` logica en zorgt dat de **Priority Queue** data correct wordt verzonden.
    * **Error Handling:** Koppelt backend exceptions direct aan Sonner-toasts via `error_message` events.
    * **Architecture Owner:** Onderhoudt de `ARCHITECTURE.md` en bewaakt de Mermaid diagrams.

### 2. @Frontend-Specialist (Atomic UI & UX Builder)
* **Focus:** React 19, Atomic Design en Real-time Client State.
* **Verantwoordelijkheden:**
    * **Live Metrics:** Implementeert de **live wachttijd-calculatie** in de frontend componenten.
    * **Smart UI:** Bouwt de visuele indicatoren voor dock-aanbevelingen (Smart Call Logic).
    * **Atomic Layers:** Dwingt scheiding af tussen `/shared` (context-vrij) en `/features` (business logic).
    * **Performance:** Optimaliseert re-renders bij frequente socket-updates.

### 3. @Data-Specialist (Persistence & SQL Expert)
* **Focus:** SQLite-optimalisatie, Data-Integriteit en Beveiliging.
* **Verantwoordelijkheden:**
    * **Temperature-Awareness:** Zorgt dat de velden `temperature` en `type` in de database consistent blijven voor de Smart Call Logic.
    * **SQL Safety:** Gebruikt uitsluitend **expliciete kolomnamen** in `INSERT OR REPLACE` statements.
    * **Security:** Beheert de `bcrypt` hashing flow voor gebruikers en bewaakt de `audit_logs`.

### 4. @Yard-Strategist (Logistiek Meesterbrein)
* **Focus:** Business Logic, Queue Algoritmes & Workflow.
* **Verantwoordelijkheden:**
    * **Priority Algorithm:** Beheert de regels voor de wachtrij (o.a. **Reefer First** logica).
    * **Smart Call Rules:** Definieert de logica voor dock-selectie op basis van lading-temperatuur en dock-mogelijkheden.
    * **Lifecycle Guard:** Bewaakt de transitie van `PLANNED` naar `COMPLETED` en de optionele `Gate-In` flow.

### 5. @QA-Automator (Stabiliteit & Testing)
* **Focus:** Foutpreventie, Regressie en Edge-cases.
* **Verantwoordelijkheden:**
    * **Queue Testing:** Controleert of prioriteits-vrachten (zoals reefers) correct vooraan de lijst verschijnen.
    * **Constraint Watcher:** Voorkomt `foreign key mismatch` fouten (zoals gezien in v3.2.3.3) door schema-validatie.
    * **Null-Check:** Scant op `undefined` of `null` waarden in container-kaarten en live timers.

### 6. @UX-Visual-Director (The Polisher)
* **Focus:** Esthetiek, Contrast en Gebruikerservaring.
* **Verantwoordelijkheden:**
    * **Visual Hierarchy:** Zorgt dat kritieke informatie (bijv. een 'Late' status of Reefer-prioriteit) direct opvalt zonder ruis.
    * **Z-Index Mastery:** Garandeert dat Sonner-toasts en modals altijd bovenop de sidebar en navigatie verschijnen.
    * **Dark Mode:** Fine-tunt contrasten voor maximale leesbaarheid in diverse lichtomstandigheden.

---

## III. Release Criteria (v3.5.0 Checklist)

| Check | Criterium | Verantwoordelijke Agent |
| :--- | :--- | :--- |
| **Queue Priority** | Reefer-vrachten staan bovenaan de wachtrij bij gelijke ETA. | @Yard-Strategist |
| **Smart Call UI** | Gebruiker ziet suggesties op basis van temperatuur bij dock-toewijzing. | @Frontend-Specialist |
| **Warehouse-Isolation** | Elke broadcast gebruikt `io.sockets.sockets.forEach()` met filtering. | @System-Architect |
| **Data Safety** | Queries bevatten expliciete kolomnamen (geen parameter-shift risico). | @Data-Specialist |
| **UI Robustness** | Geen "undefined" tekst zichtbaar in container- of vrachtkaarten. | @QA-Automator |
| **Visual Polish** | Dark Mode contrast ratio is minimaal 4.5:1 voor alle teksten. | @UX-Visual-Director |

---

> [!CAUTION]
> **Kritieke Herinnering:** De `FOREIGN KEY` op `dockId` in `yms_deliveries` blijft uitgeschakeld om crashes te voorkomen. Validatie van dock-bestaan moet door de backend logica (@System-Architect) worden afgehandeld voordat een write plaatsvindt.