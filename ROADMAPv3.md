# ROADMAP v3 - ILG Foodgroup YMS Control Tower
*Versie: v3.16.0 — Bijgewerkt: 2026-04-28 door @System-Architect*

> [!IMPORTANT]
> Dit bestand is onderdeel van de automatische versie-synchronisatie. Voer na elke wijziging in dit bestand verplicht `npm run version:sync` uit om project-brede consistentie te borgen.

> [!NOTE]
> Dit document is de strategische leidraad voor het team. Elke sprint is afgestemd met alle agent-profielen uit `AGENTS.md`. Nieuwe sprints starten NIET voordat de vorige sprint volledig getest en gedocumenteerd is.

---

## ✅ Voltooide Sprints

| Versie | Naam | Status |
|---|---|---|
| **v3.5.0** | Unified Pipeline & Milestone Gatekeeper | ✅ Gereleased |
| **v3.6.0** | Real-time Notificaties & Compact Archief | ✅ Gereleased |
| **v3.6.1** | Security Baseline (bcrypt, forced reset) | ✅ Gereleased |
| **v3.7.0** | Infrastructuur Beheer (Dock & WA verwijderen) | ✅ Gereleased |
| **v3.7.1** | Container Milestones & Magazijn Openingstijden | ✅ Gereleased |
| **v3.7.2** | UI Flow & Responsiviteit (MilestoneStepper) | ✅ Gereleased |
| **v3.7.3** | Theme & UI Polish (Branding Enterprise/Modern) | ✅ Gereleased |
| **v3.7.4** | Layout Consolidation (Tabellen & Stuck Fix) | ✅ Gereleased |
| **v3.7.5** | Type-Safety Audit & Documentation Update | ✅ Gereleased |
| **v3.8.0** | Pallet Administratie & Financiën | ✅ Gereleased |
| **v3.9.0** | Intern Slot Management & Capaciteit | ✅ Gereleased |
| **v3.10.0** | RBAC Hardening & Synchronization | ✅ Gereleased |
| **v3.10.2** | UI/UX & Navigation Refactor | ✅ Gereleased |
| **v3.10.4** | Logistics Analytics & Performance | ✅ Gereleased |
| **v3.10.5** | Document Milestone Enforcement | ✅ Gereleased |
| **v3.12.0** | Modular Finance & Incoterm History | ✅ Gereleased |
| **v3.13.0** | Predictive Yard Analytics | ✅ Gereleased |
| **v3.14.0** | Security & AVG Hardening | ✅ Gereleased |
| **v3.15.0** | Inkomend Pipeline & Telex Release | ✅ Gereleased |
| **v3.16.0** | Geavanceerde Systeeminstellingen | ✅ Gereleased |

---

## ✅ Voltooide Sprint: v3.10.0 — RBAC Hardening & Synchronization
*Verantwoordelijke agent: @System-Architect, @Data-Specialist, @QA-Automator*

### Scope
- [x] **Granular Permissions Matrix**: Toewijzen van permissies (bijv. `viewer` rol) aan gebruikers.
- [x] **RBAC Middleware**: Backend validatie op elk socket-actie (`checkRole`).
- [x] **Protected UI**: Componenten die knoppen en menu-opties verbergen op basis van de ingelogde gebruiker.
- [x] **Dock Occupancy Sync**: Real-time vrijgeven van docks na statuswijzigingen (`broadcastState`).
- [x] **Audit Trail 2.0**: Logging van de rol van de uitvoerder voor volledige traceerbaarheid.

### Design Rule
- Geen "hardcoded" admin-checks in de operationele flow. Gebruik `checkRole` in de backend en `canEdit` vlaggen in de frontend.

---

## ✅ Voltooide Sprint: v3.10.2 — UI/UX & Navigation Refactor
*Verantwoordelijke agent: @UX-Visual-Director, @Frontend-Specialist*

### Scope
- [x] **Shared Modal Pattern**: Introductie `DeliveryDetailModal` voor uniforme CRUD.
- [x] **Sidebar Polish**: Kleurgecodeerde iconen per categorie en "Overig" restauratie.
- [x] **Settings Centralization**: Capaciteitsinstellingen naar een eigen tab in `YmsSettings`.
- [x] **QA Inspection Flag**: Integratie in operationele flows.

---

## ✅ Voltooide Sprint: v3.10.4 — Logistics Analytics & Performance
*Verantwoordelijke agent: @Yard-Strategist, @UX-Visual-Director*

### Scope
- [x] **Carrier Reliability Index**: Berekening van stiptheid (ETA vs ATA) en efficiëntie (gepland vs daadwerkelijk lossen).
- [x] **Performance Dashboard**: Nieuwe module in Statistieken voor transporteur- en leverancier-beoordeling.
- [x] **Delay Risk Analysis**: Automatische herkenning van vertragingsrisico's op basis van historische data.

---

- [x] **Inline Document Settings**: Gecentraliseerd beheer van document-templates met milestone-koppeling.

---

## ✅ Voltooide Sprint: v3.12.0 — Modular Finance & Incoterm History
*Verantwoordelijke agent: @System-Architect, @Finance-Auditor, @Yard-Strategist*

### Scope
- [x] **Feature Flag `enable_finance`**: Centrale schakelaar in de instellingen om de financiële module (palletruil, kosten) volledig te verbergen.
- [x] **Incoterm History Logic**: Automatisch ophalen van de laatst gebruikte Incoterm per leverancier (`GET_LAST_INCOTERM`) om data-invoer te versnellen.
- [x] **Advanced Logistics Costs**: Toevoegen van velden voor Demurrage Daily Rate, Standing Time (€/u), THC en Douanekosten.
- [x] **Conditional Finance UI**: Financiële velden in de `DeliveryDetailModal` worden alleen getoond als `enable_finance` actief is.
- [x] **Persistence Layer Update**: Database schema uitbreiding (`010_add_advanced_logistics_costs.sql`) met volledige ondersteuning in `queries.ts`.

### Design Rule
- Financiële data is optioneel voor de operatie. De yard-planning (slots, alerts) blijft altijd functioneel, ongeacht de financiële status-vlag.

---

## ✅ Voltooide Sprint: v3.14.0 — Security & AVG Hardening
*Verantwoordelijke agent: @Security-Auditor, @System-Architect*

### Scope
- [x] **Socket Isolation**: Handhaving van `warehouseId` op alle real-time broadcasts.
- [x] **Two-Factor Authentication (TOTP)**: Implementatie van 2FA via Google Authenticator/Authpoint.
- [x] **PII Redaction**: Contextuele gegevensminimalisatie in `buildStaticState` (GDPR-compliant).
- [x] **Admin Recovery**: Mogelijkheid voor beheerders om 2FA van gebruikers te resetten.
- [x] **Security Audit Table**: Uitbreiding Audit Log met Magazijn-isolatie en PII-bewaking.

---

## ✅ Voltooide Sprint: v3.15.0 — Inkomend Pipeline & Telex Release Uitbreiding
*Verantwoordelijke agent: @System-Architect, @Data-Specialist, @Frontend-Specialist, @UX-Visual-Director, @Yard-Strategist*

### Aanleiding
Sea Waybills (SWB) en Telex Release workflows zijn volledig geïntegreerd in de "Inkomend (pipeline)" module.

### Scope

#### 1. Documenttype: Seaway Bill (SWB) vs. Bill of Lading (B/L)
- [x] **Veld `documentType`**: Keuze tussen `'B/L'` (origineel cognossement) en `'SWB'` (Sea Waybill).
- [x] **UI Schakelaar**: Selector in `DeliveryDetailModal` voor container-type.
- [x] **Database Migratie**: `014_add_swb_and_telex_fields.sql` — alle kolommen toegevoegd.

#### 2. Telex Release Workflow
- [x] **Status-veld `telexReleaseStatus`**: Enum `'Niet van toepassing' | 'In aanvraag' | 'Vrijgegeven'`.
- [x] **Telex Release Actie**: Knop in de pipeline-kaart voor statuswijziging.
- [x] **Datum & Referentie logging**: `telexReleaseDate`, referentienummer en `telexReleasedBy`.
- [x] **Milestone Koppeling**: Telex Release `'Vrijgegeven'` triggert milestone-sprong configureerbaar via Document Instellingen.
- [x] **Visuele Indicator**: Badge met amber (In aanvraag) en groen (Vrijgegeven).
- [x] **Audit Trail**: Elke wijziging gelogd met gebruiker, datum en referentie.

#### 3. Container Pipeline Verrijking
- [x] Alle velden toegevoegd: `dischargeTerminal`, `portOfDischarge`, `shippingLine`, `vesselName`, `voyageNumber`, `containerSealNumber`.
- [x] **Incoterms Uitbreiding**: CIP, CFR, DPU toegevoegd.

#### 4. Customs (Douane) Module Uitbreiding
- [x] **Veld `customsDeclarationNumber`**: MRN — optioneel veld.
- [x] **Veld `customsClearedDate`**: Automatisch gezet bij `Cleared` status.
- [x] **Automatische Milestone**: Sprong naar milestone 75 bij `Cleared`.

#### 5. Pipeline Tabelweergave Verbeteringen
- [x] Kolommen "Doc / Telex", rederij en quick-action "Telex Bevestigen" geïmplementeerd.

---

## ✅ Voltooide Sprint: v3.16.0 — Geavanceerde Systeeminstellingen
*Verantwoordelijke agent: @System-Architect, @Data-Specialist, @UX-Visual-Director, @Text-Director*

### Scope

#### 1. Bedrijfsprofiel & Branding
- [x] **Bedrijfsgegevens**: KvK-nummer, BTW-nummer — geconfigureerd via Organisatie tab.
- [x] **Standaard Incoterm per Leveringstype**: Per type (container/exworks) een standaard Incoterm.

#### 2. Documentsjablonen & Milestone Configuratie
- [x] **Per-type Document Templates**: `shipment_settings` uitgebreid met `container_swb` naast `container` en `exworks`.

#### 3. Notificaties & Alerting (In-App)
- [x] **In-App Toast Triggers**: Configureerbaar welke events een in-app notificatie triggeren (Gate-In, Telex Release, Douane-clearance).
- [x] **Drempelwaardes voor Alerts**: Instelbare drempelwaardes voor wachttijd-alerts en demurrage.
- [x] **Email Triggers Uitgesteld**: SMTP/e-mail notificaties gedeactiveerd; vervangen door in-app toasts. E-mail wordt in een later stadium heroverwogen.

#### 4. Gebruikers & Rollen Uitbreiding
- [x] **Rol-specifieke Standaardweergave**: Standaard landingspagina per rol (Dashboard/Pipeline/YMS).
- [x] **Sessiebeheer**: Inactiviteits-timeout instelbaar per rol.
- [x] **IP Allowlist**: Buiten scope — wordt afgehandeld op firewall-niveau.

#### 5. Douane & Container Configuratie
- [x] **Instelling `requireMrnForClearance`**: Schakelaar met backend-validatie die MRN verplicht stelt voor 'Cleared' status.
- [x] **Instelling `enableContainerImportFields`**: Schakelaar die container-specifieke velden (scheepsnaam, voyage, rederij, terminal, havens) toont/verbergt.

#### 6. Operationele Configuratie
- [x] **Priority Queue Gewichten**: Instelbaar via de "Operatie" tab in YMS Settings (Reefer, Outbound).
- [x] **Archivering-termijn**: Instelbaar hoelang voltooide leveringen zichtbaar blijven.
- [x] **Transport Order PDF**: E-mail flow vervangen door directe PDF-download in nieuw venster.
- [x] **Backend**: Nieuwe handler `UPDATE_COMPANY_SETTINGS` voor bedrijfsgegevens, MRN-validatie en notificatie-dispatching geïmplementeerd.

### Design Rules (Sprint-specifiek)
- Alle instellingen opgeslagen via `SAVE_SETTING` + `settings`-mechanisme.
- Geen nieuwe database-tabellen — uitbreiding van bestaande JSON-instellingswaarden.

---

## 🛠️ Toekomstige Backlog / Lage Prioriteit (Toekomstdromen)
*Deze items zijn geparteerd tot de AVG-compliance volledig gewaarborgd is.*

### Professional GUI Reconstructie (High-Density)
- [ ] **Full Screen Optimization**: Optimalisatie van de interface voor standaard (niet-curved) monitoren; eliminatie van "whitespace" bij hoge resoluties.
- [ ] **Compact Mode Toggle**: Mogelijkheid voor gevorderde gebruikers om te schakelen naar een extra compacte weergave voor data-intensieve taken.
- [ ] **Modern Professional Aesthetics**: Verfijning van contrast, typografie en spacing voor een meer industriële en minder speelse uitstraling.

### Enterprise Integraties (SAP Readiness)
- [ ] **Bi-directional API Framework**: Ondersteuning voor zowel *Inbound* (SAP stuurt data) als *Outbound* (YMS haalt data) patronen.
- [ ] **Encrypted Secret Storage**: Veilig beheer van externe API sleutels en OAuth2 credentials in de kluis.
- [ ] **Integration Dashboard**: Centraal paneel voor het monitoren van synchronisaties en API-gezondheid.
- [ ] **Unified Data Mapping**: Universele transformatie-laag om SAP-velden te vertalen naar YMS-leveringen.

### Geavanceerde Automatisering
- [ ] **Drones for Automated Inventory**: Periodieke scans van het terrein om trailerlocaties te verifiëren zonder menselijke tussenkomst.
- [ ] **Computer Vision (Seal & Damage)**: AI-camera's bij de gate die automatisch controleren of containerzegels intact zijn en schades detecteren.
- [ ] **Ambient IoT / BLE High-Accuracy Tracking**: Real-time locatiebepaling van trailers op 1 meter nauwkeurig via sensoren.
- [ ] **Task Interleaving**: Algoritme dat yard-bewegingen koppelt aan magazijn-orders voor maximale efficiëntie.
- [ ] **Voice-Guided Terminal**: Chauffeurs en medewerkers aansturen via voice-to-text (AVG-gevoelig).

### Externe Koppelingen
- [ ] **Driver Self-Service Portal**: Aanmeldportaal voor externe transporteurs.
- [ ] **Mobile App (Carrier)**: Native app voor real-time status-updates door chauffeurs.
- [ ] **LPR Integration**: AI-gedreven kentekenherkenning aan de gate.

### Advanced Seeding
- [ ] **Stress Testing (1000+ Records)**: Validatie van de state-manager bij zeer grote datasets.
- [ ] **Willekeurige Lifecycle Simulatie**: Volledig geautomatiseerde flow-simulatie in `seed.ts`.
*Verantwoordelijke agent: Alle agents*

- [x] **Leveranciers-prestatierapport**: (Geïmplementeerd in v3.10.4)
- [ ] Bezettingsprognose op basis van historische data
- [x] **Automatische slot-suggesties**: (Geïmplementeerd in eerdere optimalisaties)
- [ ] Export naar Excel/PDF voor management-rapportages

---

## 💰 Strategische Cost Control (v4.0.0+)
*Verantwoordelijke agent: @Yard-Strategist, @Finance-Auditor*

> [!NOTE]
> Het doel van deze module is het elimineren van 'logistieke lekkage'. Dit project blijft gefocust op de Yard; overuren en personele bezetting worden buiten beschouwing gelaten (magazijn-specifiek).

- [ ] **Demurrage & Detention Clock**: Real-time countdown per container om staangelden te voorkomen.
- [ ] **Wait-Time Analytics**: Automatische kostenberekening bij overschrijding van het 'vrije' wachttijd-venster van vervoerders.
- [ ] **No-Show Tracking & Reliability**: Score per transporteur/leverancier op basis van aankomststiptheid én de afwijking tussen geplande vs. daadwerkelijke lostijd.
- [ ] **Reefer Fuel Monitor**: Prioritering en kosten-logging voor gekoelde containers (brandstof/stroom).

---

## 📊 Geavanceerde Statistieken & KPI's (v4.0.0+)
*Verantwoordelijke agent: @Yard-Strategist, @UX-Visual-Director*

- [x] **Carrier Reliability Index**: Interactieve grafiek die stiptheid afzet tegen lostijd-afwijking per vervoerder. (Geïmplementeerd in v3.10.4)
- [ ] **Dock Efficiency Heatmap**: Visualisatie van bezettingsgraad versus gemiddelde afhandelingstijd per dock.
- [ ] **Inbound Volume Forecast**: 7-daagse werklastprognose op basis van pipeline data (ETA's).
- [x] **Pallet Balance Ledger**: Financiële weergave van uitstaand palletsaldo per relatie, vertaald naar eurowaarde. (Geïmplementeerd in v3.8.0 / v3.12.0)
- [ ] **Demurrage Risk Board**: Monitor voor containers die hun 'free time' naderen met geprojecteerde boetekosten.

---

## 🛠️ Systeem Integriteit & Design Rules

> [!CAUTION]
> Dit zijn harde architectuurregels. Iedere pull request of sprint die één van deze regels schendt wordt geblokkeerd.

| Regel | Beschrijving |
|---|---|
| **Milestone Protection** | Nieuwe features mogen de `PLANNED` → `COMPLETED` flow niet breken of vertragen |
| **Warehouse Isolatie** | Elke query en broadcast is gefilterd op `warehouseId` |
| **Async Finance** | Financiële pallet-logica bevindt zich in een aparte module, nooit in de operationele kern |
| **Internal-Only** | Geen externe portal of API-endpoint voor leveranciers zonder management-audit (AVG) |
| **Type Safety** | `any` is verboden. Gebruik uitsluitend de interfaces in `src/types.ts` |
| **SQL Safety** | Gebruik altijd expliciete kolomnamen in `INSERT OR REPLACE` statements |

---

## 📦 Opgeloste Backlog

- [x] **Demo Data Opschoning**: Archief opgeschoond van test-leveringen
- [x] **Database Optimalisatie**: Indexering op `reference`, `etaWarehouse`. Velden `openingTime`/`closingTime` in `yms_warehouses`
- [x] **Automatische Slot-Toewijzing**: Algoritme-suggesties voor docks op basis van temperatuur en drukte
- [x] **Pipeline View Toggle**: Naadloze overgang tussen tabel- en kaartweergave
- [x] **Geavanceerde Filtering**: Zoekopties in het archief (referentie, leverancier, status, datum)
- [x] **Real-time Notificaties**: Sonner-toasts bij statuswijzigingen en kritieke events
