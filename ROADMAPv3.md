# ROADMAP v3 - ILG Foodgroup YMS Control Tower
*Versie: v3.7.5 — Bijgewerkt: 2026-03-29 door @System-Architect*

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
| **v3.7.3** | Theme & UI Polish (Branding ILG/Meledi) | ✅ Gereleased |
| **v3.7.4** | Layout Consolidation (Tabellen & Stuck Fix) | ✅ Gereleased |
| **v3.7.5** | Type-Safety Audit & Documentation Update | ✅ Gereleased |
| **v3.8.0** | Pallet Administratie & Financiën | ✅ Gereleased |

---

## 🟡 Volgende Sprint: v3.9.0 — Intern Slot Management & Capaciteit
*Verantwoordelijke agent: @Finance-Auditor, @Data-Specialist*

> [!IMPORTANT]
> Pallet-reconciliatie is een **aparte, async module**. De bestaande Yard milestones worden niet aangeraakt.

### Scope
- [x] **Pallet Ledger**: Nieuwe `pallet_transactions` tabel voor elke ruil (in/uit per levering)
- [x] **Kosten per Leverancier**: Uitbreiding `address_book` met `pallet_rate` (€/pallet)
- [x] **Saldo-overzicht**: Per transporteur een actueel saldo (hoeveel pallets schuld/tegoed)
- [x] **Creditnota Matching**: Mogelijkheid om ontvangen creditnota te koppelen aan openstaande transacties
- [x] **Bulk Verrekening**: Een 'Settle'-actie om een reeks transacties als afgehandeld te markeren

### Niet in scope
- Automatische import van creditnota's (PDF/EDI) → v4.x
- Koppeling met extern boekhoudpakket → na management-besluit

---

## 🔵 Geplande Sprint: v3.9.0 — Intern Slot Management & Capaciteit
*Verantwoordelijke agent: @Yard-Strategist, @Frontend-Specialist, @System-Architect*

> [!IMPORTANT]
> Geen externe portal. Alle slot-logica is intern en voor back-office medewerkers only (AVG/GDPR compliant).

### Scope
- [ ] **Slot-based Timeline**: Dockplanning op 30-minuten intervallen, visueel zichtbaar
- [ ] **`yms_slots` tabel**: Vervangt de huidige vrije D&D met een gestructureerde reservering
- [ ] **Conflict-detectie**: Automatisch weigeren van dubbele boekingen op hetzelfde dock/slot
- [ ] **Drag & Drop Refactor**: D&D 'snapt' naar dichtstbijzijnde vrije slot (intern gebruik)
- [ ] **Overzicht Bezettingsgraad**: Per dag/week zichtbaar hoeveel % van de dockcapaciteit benut is

### Design Rule
- `scheduledTime` op de levering blijft de primaire bron voor milestones. Een slot-reservering is een planning-harnas; het vervangt geen operationele data.

---

## 🔵 Geplande Sprint: v3.10.0 — Role-Based Access Control (RBAC) & Security Hardening
*Verantwoordelijke agent: @System-Architect, @Data-Specialist, @UX-Visual-Director*

> [!IMPORTANT]
> Dit is een "breaking" fundamentele aanpassing. Elke actie in het systeem moet vanaf nu gevalideerd worden tegen de rechten van de gebruiker.

### Scope
- [ ] **Granular Permissions Matrix**: Toewijzen van permissies (bijv. `CAN_DELETE`, `CAN_EDIT_FINANCE`) aan rollen.
- [ ] **RBAC Middleware**: Backend validatie op elk socket-event en API request.
- [ ] **Protected UI**: Componenten die knoppen en menu-opties verbergen op basis van de ingelogde gebruiker.
- [ ] **Enforced Warehouse Isolation**: Gebruikers beperken tot één of meerdere specifieke `warehouseId`'s.
- [ ] **Audit Trail 2.0**: Logging van *wie* (welke rol) een actie uitvoert voor volledige traceerbaarheid.

### Design Rule
- Geen "hardcoded" admin-checks. Gebruik een permissie-gebaseerd systeem (bijv. `if (user.hasPermission('EDIT_SLOTS'))`).

---

## 🔮 Langetermijn: v4.0.0 — Advanced Analytics & Forecasting
*Verantwoordelijke agent: Alle agents*

- [ ] Leveranciers-prestatierapport (stiptheid, afwijkingen, pallet-gedrag)
- [ ] Bezettingsprognose op basis van historische data
- [ ] Automatische slot-suggesties op basis van type lading en historische lostijden
- [ ] Export naar Excel/PDF voor management-rapportages

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
