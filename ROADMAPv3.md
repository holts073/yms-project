# ROADMAP v3 - ILG Foodgroup YMS Control Tower
*Versie: v3.15.0 — Bijgewerkt: 2026-04-18 door @System-Architect*

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

## 🔮 Geplande Sprint: v3.15.0 — Inkomend Pipeline & Telex Release Uitbreiding
*Verantwoordelijke agent: @System-Architect, @Data-Specialist, @Frontend-Specialist, @UX-Visual-Director, @Yard-Strategist*
*Geschatte doorlooptijd: 1–2 sprints*

> [!IMPORTANT]
> Deze sprint bouwt voort op de bestaande "Inkomend (pipeline)" module voor container-leveringen. Het doel is de module operationeel compleet te maken voor alle gangbare import-scenario's in de voedingsmiddelenlogistiek.

### Aanleiding
In de huidige praktijk worden Sea Waybills (SWB) gebruikt als alternatief voor de traditionele Bill of Lading (B/L). Een SWB kan via een **Telex Release** vrijgegeven worden, waarbij de rederij per telex de agent instrueert de lading zonder origineel papier af te geven. Dit proces moet volledig beheerst kunnen worden vanuit de YMS Control Tower.

### Scope

#### 1. Documenttype: Seaway Bill (SWB) vs. Bill of Lading (B/L)
- [ ] **Veld `documentType`**: Toevoegen aan het `Delivery` type — keuze tussen `'B/L'` (origineel cognossement) en `'SWB'` (Sea Waybill).
- [ ] **UI Schakelaar**: In de `DeliveryDetailModal` bij container-type een selector voor `B/L` vs `SWB` (bepaalt welk documentenflow actief is).
- [ ] **Database Migratie**: `014_add_swb_and_telex_fields.sql` — kolommen `documentType`, `telexReleaseStatus`, `telexReleaseDate`, `telexReleaseReference`, `telexReleasedBy`.

#### 2. Telex Release Workflow
- [ ] **Status-veld `telexReleaseStatus`**: Enum `'Niet van toepassing' | 'In aanvraag' | 'Vrijgegeven'`.
- [ ] **Telex Release Actie**: Knop in de pipeline-kaart (alleen bij `documentType === 'SWB'`) om de status te wijzigen naar `'In aanvraag'` of te bevestigen als `'Vrijgegeven'`.
- [ ] **Datum & Referentie logging**: Vastleggen van `telexReleaseDate` (ISO timestamp), telex-referentienummer en de naam van de bevestiger (`telexReleasedBy`).
- [ ] **Milestone Koppeling**: Telex Release `'Vrijgegeven'` triggert dezelfde milestone-sprong als het ontvangen van het originele B/L — configureerbaar via de Document Instellingen.
- [ ] **Visuele Indicator**: Badge/statuslabel in de pipeline-tabel die de Telex-status toont (Kleur: amber bij 'In aanvraag', groen bij 'Vrijgegeven').
- [ ] **Audit Trail**: Elke wijziging in de Telex Release status wordt gelogd met gebruiker, datum en referentie.

#### 3. Container Pipeline Verrijking
- [ ] **Veld `dischargeTerminal`**: Al aanwezig in de types maar ontbreekt in de UI — toevoegen aan de container-formulierveld in `DeliveryDetailModal`.
- [ ] **Veld `portOfDischarge`**: Nieuw veld voor de loshaven (los van `portOfArrival`), relevant bij transshipments.
- [ ] **Veld `shippingLine`**: Rederij (bijv. MSC, Maersk, CMA-CGM) — nuttig voor Telex Release tracking en demurrage-contact.
- [ ] **Veld `vesselName`**: Naam van het schip — standaard in import-administratie.
- [ ] **Veld `voyageNumber`**: Voyage/vaart-nummer voor tracing bij de terminal.
- [ ] **Veld `containerSealNumber`**: Zegel-nummer — relevant voor gate-in controle en QA.
- [ ] **Incoterms Uitbreiding**: Toevoegen van CIP, CFR, DPU aan de dropdownlijst (ontbreken nu).

#### 4. Customs (Douane) Module Uitbreiding
- [ ] **Veld `customsDeclarationNumber`**: MRN (Movement Reference Number) uit de douaneaangifte — **optioneel veld**, niet verplicht voor de operatie.
- [ ] **Veld `customsClearedDate`**: Datum en tijd waarop de douanestatus op 'Cleared' is gezet.
- [ ] **Automatische Milestone**: Wanneer `customsStatus` wijzigt naar `'Cleared'`, springt de levering automatisch naar milestone 75 (Onderweg naar Magazijn). Het invullen van een MRN is hiervoor **niet vereist** tenzij de instelling `requireMrnForClearance` actief is (zie v3.16.0).

> [!NOTE]
> Op locaties waar containerimports (nog) niet centraal staan, blijven alle douane-velden volledig optioneel. De operatie loopt via `customsStatus` (Pending/Cleared/Inspection) zonder dat een MRN nodig is.

#### 5. Pipeline Tabelweergave Verbeteringen
- [ ] **Kolom "SWB/B/L"**: Toon het documenttype compact in de pipeline-tabel.
- [ ] **Kolom "Telex Status"**: Toon de telex-statusbadge naast het documenttype.
- [ ] **Kolom "Rederij"**: Toon de `shippingLine` in de compacte tabelweergave.
- [ ] **Quick-action "Telex Bevestigen"**: Inline actie-knop in de tabelrij voor snelle statuswijziging.

### Design Rules (Sprint-specifiek)
- De telex-workflow is **uitsluitend zichtbaar** bij `type === 'container'` en `documentType === 'SWB'`.
- `telexReleaseStatus` is **nooit verplicht** bij `documentType === 'B/L'` — de logica schakelt automatisch.
- Alle nieuwe velden zijn nullable in de DB en worden gracefully afgehandeld bij `null`.

---

## 🔮 Geplande Sprint: v3.16.0 — Geavanceerde Systeeminstellingen
*Verantwoordelijke agent: @System-Architect, @Data-Specialist, @UX-Visual-Director, @Text-Director*
*Geschatte doorlooptijd: 1 sprint*

> [!NOTE]
> Het doel van deze sprint is de "Instellingen"-sectie te transformeren van een basis-configuratiePanel naar een volwaardig, operationeel beheercentrum. Elke instelling dient een directe impact te hebben op de dagelijkse operatie.

### Scope

#### 1. Bedrijfsprofiel & Branding
- [ ] **Logo Upload**: Mogelijkheid om een eigen bedrijfslogo te uploaden (wordt gebruikt in Transport Orders en eventueel de header).
- [ ] **Bedrijfsgegevens**: KvK-nummer, BTW-nummer — relevant voor door het systeem gegenereerde documenten.
- [ ] **Standaard Incoterm per Leveringstype**: Per type (container/exworks) een standaard Incoterm instellen die automatisch wordt vooringevuld.

#### 2. Documentsjablonen & Milestone Configuratie
- [ ] **Per-type Document Templates**: De huidige `shipment_settings` uitbreiden zodat per `documentType` (SWB vs B/L) een aparte documentenlijst geconfigureerd kan worden.
- [ ] **Telex Release Sjabloon**: Configureerbaar e-mailsjabloon voor de Telex Release aanvraag (naar rederij of agent).
- [ ] **Milestone Labels aanpassen**: Mogelijkheid om de stap-labels (bijv. "In Transit" → "Op zee") per leverings-type aan te passen via de UI.

#### 3. Notificaties & Alerting
- [ ] **E-mail Triggers instellen**: Configureerbaar welke events een e-mailnotificatie triggeren (bijv. bij Telex Release, bij douane-clearance, bij Gate-In).
- [ ] **Drempelwaardes voor Alerts**: Instelbare drempelwaardes voor wachttijd-alerts (bijv. "Waarschuw na X minuten wachten in de wachtrij").
- [ ] **Demurrage Waarschuwingstermijn**: Instelling voor hoeveel dagen vóór de vrije-termijn-einddatum een demurrage-alert verzonden wordt.

#### 4. Gebruikers & Rollen Uitbreiding
- [ ] **Rol-specifieke Standaardweergave**: Configureren welke module (Dashboard, Pipeline, YMS) de standaard landingspagina is per rol.
- [ ] **Sessiebeheer**: Instellen van de inactiviteits-timeout (standaard 60 min) per rol.
- [ ] **IP Allowlist (Optioneel)**: Whitelisting van IP-ranges voor extra beveiliging (Enterprise-feature).

#### 5. Douane & Container Configuratie
- [ ] **Instelling `requireMrnForClearance`**: Schakelaar die bepaalt of een MRN (douane-aangifte nummer) verplicht is voordat de douanestatus op 'Cleared' gezet kan worden. Standaard: **uitgeschakeld** (optioneel).
- [ ] **Instelling `enableContainerImportFields`**: Schakelaar om container-specifieke velden (scheepsnaam, voyage, rederij, zegelnummer) zichtbaar/verplicht te maken. Handig voor locaties die (nog) weinig met containerimports werken — standaard: **uitgeschakeld**.

#### 6. Operationele Configuratie
- [ ] **Standaard Lading Types configureren**: De `cargoType`-opties (Droog/Koel/Vries) uitbreiden met eigen labels (bijv. "Diepvries" als extra optie).
- [ ] **Priority Queue Gewichten**: Instellen van de gewichten in het prioriteitsalgoritme (bijv. verhoging bij reefer, verlaging bij OUTBOUND).
- [ ] **Wachtrij-regels zichtbaar maken**: Een uitleg/samenvatting van de actieve prioriteitsregels tonen in de instellingen, zodat operationeel personeel begrijpt wat de prioriteit bepaalt.
- [ ] **Archivering-termijn**: Instellen hoelang afgeronde leveringen (`status: 100`) zichtbaar blijven voor het dagelijks overzicht.

### Design Rules (Sprint-specifiek)
- Alle nieuwe instellingen worden opgeslagen via het bestaande `SAVE_SETTING` + `settings`-mechanisme.
- Geen nieuwe database-tabellen — uitbreiding van bestaande JSON-instellingswaarden.
- Elke instelling heeft een duidelijke standaardwaarde en een reset-knop per sectie.

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

- [ ] Leveranciers-prestatierapport (stiptheid, afwijkingen, pallet-gedrag)
- [ ] Bezettingsprognose op basis van historische data
- [ ] Automatische slot-suggesties op basis van type lading en historische lostijden
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

- [ ] **Carrier Reliability Index**: Interactieve grafiek die stiptheid afzet tegen lostijd-afwijking per vervoerder.
- [ ] **Dock Efficiency Heatmap**: Visualisatie van bezettingsgraad versus gemiddelde afhandelingstijd per dock.
- [ ] **Inbound Volume Forecast**: 7-daagse werklastprognose op basis van pipeline data (ETA's).
- [ ] **Pallet Balance Ledger**: Financiële weergave van uitstaand palletsaldo per relatie, vertaald naar eurowaarde.
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
