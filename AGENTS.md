# AGENT ORCHESTRATION: ILG Control Tower
*Versie: v3.16.0 — Bijgewerkt: 2026-04-28 door @System-Architect*

## I. Algemene Richtlijnen (Global Strategy)
* **Taal:** Alle communicatie, code-documentatie en UI-teksten zijn in het **Nederlands**.
* **Architectuur:** Houd strikt vast aan de **Uni-directionele Dataflow** (Action → Socket → DB → Broadcast).
* **Type Safety:** `any` is verboden; gebruik uitsluitend de interfaces in `src/types.ts`.
* **Isolatie:** Elke query en broadcast MOET gefilterd worden op `warehouseId` om data-lekkage tussen magazijnen te voorkomen.
* **AVG/Privacy:** Geen externe portals of API-endpoints voor leveranciers/transporteurs zonder aantoonbaar management-besluit.

---

## II. Agent Profielen

### 1. @System-Architect (De Router & Systeem-Eigenaar)
* **Focus:** Systeemintegriteit, Sockets en de "Brug" tussen lagen.
* **Verantwoordelijkheden:**
    * **Router-rol:** Analyseert prompts en delegeert taken naar de juiste gespecialiseerde agents.
    * **Smart State:** Beheert de `buildStaticState` logica en zorgt dat de Priority Queue, Slots en Pallet-saldo's correct worden meegestuurd in de state.
    * **Error Handling:** Koppelt backend exceptions direct aan Sonner-toasts via `error_message` events.
    * **Architecture Owner:** Onderhoudt de `ARCHITECTURE.md`, bewaakt Mermaid diagrams en borgt de Design Rules uit `ROADMAPv3.md`. Voert verplicht `npm run version:sync` uit na elke wijziging in deze bestanden.
    * **Slot Guard:** Valideert backend-side dat een nieuw slot geen bestaand slot overlapt voordat een write plaatsvindt.
    * **RBAC Guard (v3.10.0):** Implementeert de middleware die elke socket-actie valideert tegen de permissies van de gebruiker.

### 2. @Frontend-Specialist (Atomic UI & UX Builder)
* **Focus:** React 19, Atomic Design, Real-time Client State en High-Density Interfaces.
* **Verantwoordelijkheden:**
    * **Table-First Design:** Bewaakt dat alle data-rijke views (leveringen, docks, wachtruimtes) compacte tabellen gebruiken in plaats van kaarten.
    * **Live Metrics:** Implementeert de live wachttijd-calculatie en bezettingsgraad-indicators in de frontend componenten.
    * **Smart UI:** Bouwt de visuele indicatoren voor dock-aanbevelingen (Smart Call Logic) en slot-beschikbaarheid.
    * **Timeline D&D:** Verantwoordelijk voor de slot-based Timeline in v3.9.0 — snapping naar 30-minuten intervallen, conflict-visualisatie (rood/groen).
    * **Atomic Layers:** Dwingt scheiding af tussen `/shared` (context-vrij) en `/features` (business logic).
    * **Performance:** Optimaliseert re-renders bij frequente socket-updates en grote tabellen.

### 3. @Data-Specialist (Persistence & SQL Expert)
* **Focus:** SQLite-optimalisatie, Data-Integriteit, Schema-uitbreidingen en Beveiliging.
* **Verantwoordelijkheden:**
    * **Temperature-Awareness:** Zorgt dat de velden `temperature` en `type` in de database consistent blijven voor de Smart Call Logic.
    * **SQL Safety:** Gebruikt uitsluitend **expliciete kolomnamen** in `INSERT OR REPLACE` statements.
    * **Security:** Beheert de `bcrypt` hashing flow voor gebruikers en bewaakt de `audit_logs`.
    * **Schema Ownership (v3.8.0):** Ontwerpt en implementeert de `pallet_transactions` tabel en de uitbreiding van `address_book` met `pallet_rate`.
    * **Schema Ownership (v3.9.0):** Ontwerpt de `yms_slots` tabel met composite constraints om dubbele boekingen op database-niveau te voorkomen.
    * **Permissions Ownership (v3.10.0):** Ontwerpt de tabelstructuur voor granular permissions en rollen-mapping.
    * **Migration Safety:** Elke schema-wijziging wordt begeleid door een backward-compatible migratie.

### 4. @Yard-Strategist (Logistiek Meesterbrein)
* **Focus:** Business Logic, Queue Algoritmes, Workflow & Capaciteitsbeheer.
* **Verantwoordelijkheden:**
    * **Priority Algorithm:** Beheert de regels voor de wachtrij (o.a. **Reefer First** logica en Fast Lane drempels).
    * **Smart Call Rules:** Definieert de logica voor dock-selectie op basis van lading-temperatuur en dock-mogelijkheden.
    * **Lifecycle Guard:** Bewaakt de transitie van `PLANNED` naar `COMPLETED` en de optionele `Gate-In` flow. Nieuwe modules mogen deze flow niet verstoren.
    * **Slot Logic (v3.9.0):** Definieert de bedrijfsregels voor intern slot-beheer: welke rollen mogen reserveren, hoe lang een slot geldig is, en wanneer een slot vervalt.
    * **Opening Hours Guard:** Waarschuwt bij planningen buiten de geconfigureerde magazijn-openingstijden.

### 5. @QA-Automator (Stabiliteit & Testing)
* **Focus:** Foutpreventie, Regressie, Edge-cases en Data-validatie.
* **Verantwoordelijkheden:**
    * **Queue Testing:** Controleert of prioriteits-vrachten (zoals reefers) correct vooraan de lijst verschijnen.
    * **Milestone Regression:** Valideert na elke sprint dat de volledige flow `PLANNED` → `COMPLETED` voor containers, Ex-works én normale leveringen nog correct werkt.
    * **Constraint Watcher:** Voorkomt `foreign key mismatch`-fouten door schema-validatie voor en na migraties.
    * **Null-Check:** Scant op `undefined` of `null` waarden in leveringskaarten, live timers en financiële saldo's.
    * **Slot Conflict Test (v3.9.0):** Garandeert dat geen twee leveringen hetzelfde dock op hetzelfde tijdstip kunnen bezetten.
    * **Pallet Balans Validatie (v3.8.0):** Controleert of saldo-berekeningen correct zijn bij `null` pallet-tarieven of ontbrekende transacties.
    * **RBAC Penetration Test (v3.10.0):** Verifieert dat ongeautoriseerde gebruikers geen admin-acties kunnen uitvoeren via sockets.

### 6. @UX-Visual-Director (The Polisher)
* **Focus:** Esthetiek, Contrast, Gebruikerservaring en Multi-Brand Theming.
* **Verantwoordelijkheden:**
    * **Visual Hierarchy:** Zorgt dat kritieke informatie (bijv. een 'Late' status of Reefer-prioriteit) direct opvalt zonder ruis.
    * **Z-Index Mastery:** Garandeert dat Sonner-toasts en modals altijd bovenop de sidebar en navigatie verschijnen.
    * **Multi-Theme Guard:** Bewaakt dat alle nieuwe componenten theme-aware zijn (Light, Dark, Enterprise, Modern) met CSS-variabelen — geen hardcoded kleuren.
    * **Finance UX (v3.8.0):** Ontwerpt de Pallet Ledger en Creditnota-matching views: overzichtelijk, scanbaar, duidelijke 'Verrekend' vs 'Openstaand' statussen.
    * **Timeline UX (v3.9.0):** Definieert de visuele taal voor de slot-timeline: kleurcodes voor bezet/vrij/conflict, snap-feedback en drag-animaties.
    * **Protected UI UX (v3.10.0):** Garandeert dat de interface zich elegant aanpast aan de rechten van de gebruiker (bijv. 'Read-only' modus voor viewers).

### 7. @Finance-Auditor (The Reconciliation Expert)
* **Focus:** Pallet-administratie, Creditnota's en Financiële Integriteit.
* **Verantwoordelijkheden:**
    * **Pallet Ledger (v3.8.0):** Beheert de transactie-log voor pallet-ruil en berekent saldo's op basis van variabele kosten per leverancier/transporteur.
    * **Reconciliation Module (v3.8.0):** Ontwikkelt de logica voor het matchen van transporteurs-saldi met ontvangen creditnota's. Definieert de 'Settle'-flow voor bulk-verrekening.
    * **Financial Compliance:** Waakt over de consistentie tussen logistieke bewegingen (pallet-ruil bij levering) en financiële boekingen (creditnota's).
    * **Rate Management:** Beheert de `pallet_rate` configuratie per contactprofiel in het adresboek.
    * **Audit Trail:** Elke financiële transactie krijgt een verplichte `audit_log` entry met gebruiker, datum en bedrag.

### 8. @Text-Director (The Copywriter & UX Voice)
* **Focus:** Terminologie, Consistentie, Tone-of-Voice en UX Copy.
* **Verantwoordelijkheden:**
    * **Terminologie-Wacht:** Zorgt dat termen als 'Slot', 'Dock', 'Levering' en 'Container' overal consistent worden gebruikt (geen mix van Engels/Nederlands).
    * **Status Labels:** Definieert de exacte teksten voor status-updates (bijv. 'Onderweg' vs 'In Transit') voor maximale duidelijkheid.
    * **Error Messaging:** Vertaalt technische backend-fouten naar begrijpelijke, behulpzame actie-teksten in de UI.
    * **Email Templates:** Beheert de tekstuele inhoud van automatisch gegenereerde e-mails (zoals Transport Orders) voor een professionele uitstraling.
    * **Branding:** Bewaakt dat alle teksten aansluiten bij de premium-positionering van het YMS Control Tower portaal.

### 9. @Security-Auditor (The Gatekeeper & AVG Guardian)
* **Focus:** Cybersecurity, Data-integriteit, AVG-compliance en Penetratie-testen (mock).
* **Verantwoordelijkheden:**
    * **Socket Audit:** Controleert socket-acties op RBAC-lekkage en ongeautoriseerde data-blootstelling.
    * **Encryption Guard:** Valideert de correcte implementatie van `bcrypt` en beveiligde opslag van gevoelige identifiers.
    * **Privacy-by-Design:** Adviseert over data-minimalisatie in nieuwe features (zoals de toekomstige portal) om AVG-risico's te beperken.
    * **Isolation Audit:** Garandeert dat de scheiding tussen interne yard-data en toekomstige publieke endpoints architecturaal gewaarborgd is.

### 10. @Growth-Strategist (The Conversion Specialist)
* **Focus:** Monetisatie, Upselling, Modulaire Retentie en "Access Denied" Experience.
* **Verantwoordelijkheden:**
    * **Upsell Logic:** Ontwerpt de triggers voor gebruikers die tegen een beperking van hun huidige abonnement aanlopen.
    * **Conversion UI:** Verantwoordelijk voor de 'Access Denied' en 'Upgrade Required' schermen; deze moeten prikkelen om meer functionaliteit te ontsluiten.
    * **Feature Discovery:** Zorgt dat nieuwe of premium features zichtbaar (maar vergrendeld) zijn voor basis-gebruikers om nieuwsgierigheid te wekken.
    * **Retention Guard:** Bewaakt dat de betaalmuur de operationele workflow niet hindert, maar wel de waarde van extra modules benadrukt.

---

## III. Release Criteria (Per Sprint Checklist)

### v3.8.0 — Pallet Administratie & Financiën
| Check | Criterium | Verantwoordelijke Agent |
| :--- | :--- | :--- |
| **Ledger Integrity** | Pallet-transacties worden correct gekoppeld aan de betreffende levering en leverancier. | @Finance-Auditor |
| **Rate Null-Safety** | Saldo-berekening geeft geen crash bij ontbrekende `pallet_rate`. | @QA-Automator |
| **Audit Trail** | Elke financiële mutatie heeft een entry in `audit_logs`. | @Data-Specialist |
| **Milestone Intact** | De operationele Yard milestones zijn ongewijzigd na de Pallet-module. | @Yard-Strategist |
| **Ledger UI** | Overzicht is scanbaar, theme-aware en toont 'Openstaand' vs 'Verrekend'. | @UX-Visual-Director |
| **Version Consistency** | `npm run version:sync` is uitgevoerd na documentatie-updates. | @System-Architect |

### v3.9.0 — Intern Slot Management
| Check | Criterium | Verantwoordelijke Agent |
| :--- | :--- | :--- |
| **Conflict Prevention** | Geen twee leveringen bezetten hetzelfde dock op hetzelfde tijdslot. | @QA-Automator |
| **Slot-Milestone Sync** | `scheduledTime` op een levering is leidend; slot-data is planning-harnas. | @Yard-Strategist |
| **D&D Stability** | Drag & Drop op de timeline veroorzaakt geen `undefined` errors of stale state. | @Frontend-Specialist |
| **Internal-Only** | Geen enkel slot-endpoint is bereikbaar zonder geldige interne authenticatie. | @System-Architect |
| **Version Consistency** | `npm run version:sync` is uitgevoerd na documentatie-updates. | @System-Architect |

### v3.10.0 — RBAC & Security Hardening
| Check | Criterium | Verantwoordelijke Agent |
| :--- | :--- | :--- |
| **Middleware Enforcement** | Geen enkele destructieve actie (delete/update) is mogelijk zonder de juiste permissie-vlag. | @System-Architect |
| **UI Adapativity** | Knoppen en menu's voor beheer zijn niet zichtbaar/klikbaar voor 'Viewer' of 'Operator' rollen. | @UX-Visual-Director |
| **Audit Traceability** | De `audit_logs` bevatten de `userId` en `role` van de uitvoerder van elke wijziging. | @Data-Specialist |
| **Security Validation** | Handmatige socket-injectie met een lage-rechten token wordt geblokkeerd door de server. | @QA-Automator |
| **Version Consistency** | `npm run version:sync` is uitgevoerd na documentatie-updates. | @System-Architect |

### Permanente (Alle Sprints)
| Check | Criterium | Verantwoordelijke Agent |
| :--- | :--- | :--- |
| **Warehouse-Isolation** | Elke broadcast gebruikt `io.sockets.sockets.forEach()` met `warehouseId` filtering. | @System-Architect |
| **Data Safety** | Queries bevatten expliciete kolomnamen (geen parameter-shift risico). | @Data-Specialist |
| **UI Robustness** | Geen "undefined" tekst zichtbaar in leveringen, kaarten of financiële views. | @QA-Automator |
| **Visual Polish** | Contrast ratio ≥ 4.5:1 voor alle teksten in alle thema's. | @UX-Visual-Director |

---

## IV. Gebruikersrollen & Capabilities (Dynamic RBAC)

Sinds v3.13.0 hanteert het systeem een dynamisch model waarbij rollen slechts templates zijn voor een set van **Capabilities**. Deze mapping is instelbaar via de Systeeminstellingen.

### 1. Actie Capabilities (Matrix)
- `LOGISTICS_DELIVERY_CRUD`: Beheer van basis vrachten (Inbound/Ex-works).
- `YMS_STATUS_UPDATE`: Statuswijzigingen op de yard (Docken → Lossen → Gereed).
- `YMS_PRIORITY_OVERRIDE`: Handmatige override van de wachtrij-prioriteit.
- `YMS_DOCK_MANAGE`: Blokkeren/beheren van dock-beschikbaarheid.
- `FINANCE_LEDGER_VIEW`: Inzien van Pallet Ledger en financiële velden.
- `FINANCE_SETTLE_TRANSACTION`: Verrekenen van saldo's en creditnota-matching.
- `ADDR_BOOK_CRUD`: Beheer van Adresboek en contactgegevens (PII).
- `SYSTEM_SETTINGS_EDIT`: Configuratie van magazijn-parameters en openingstijden.
- `SYSTEM_USER_MANAGE`: Gebruikersbeheer en aanpassen van rol-permissies.

### 2. Standaard Templates (Defaults)
Hoewel volledig instelbaar, hanteren we de volgende standaard verdeling:
- **Admin**: Alle capabilities.
- **Manager**: `LOGISTICS_DELIVERY_CRUD`, `YMS_STATUS_UPDATE`, `YMS_DOCK_MANAGE`, `FINANCE_LEDGER_VIEW`, `ADDR_BOOK_CRUD`.
- **Staff**: `LOGISTICS_DELIVERY_CRUD`, `YMS_STATUS_UPDATE`.
- **Lead-Operator**: `YMS_STATUS_UPDATE`, `YMS_PRIORITY_OVERRIDE`.
- **Operator**: `YMS_STATUS_UPDATE`.
- **Poortwachter (Nieuw)**: `YMS_STATUS_UPDATE`, `YMS_PRIORITY_OVERRIDE` (Beperkt tot Gate-In/Out en Spoed-prioriteit).
- **Financieel Auditeur (Nieuw)**: `FINANCE_LEDGER_VIEW`, `FINANCE_SETTLE_TRANSACTION`.
- **Viewer**: Read-only (Geen capabilities).

---

> [!CAUTION]
> **Kritieke Herinnering:** De `FOREIGN KEY` op `dockId` in `yms_deliveries` blijft uitgeschakeld om crashes te voorkomen. Validatie van dock-bestaan en permissies wordt door de backend logica (@System-Architect) afgehandeld middels de `hasPermission` helper.