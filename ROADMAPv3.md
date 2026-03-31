# ROADMAP v3 - ILG Foodgroup YMS Control Tower
*Versie: v3.10.1 — Bijgewerkt: 2026-03-31 door @System-Architect*

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
| **v3.9.0** | Intern Slot Management & Capaciteit | ✅ Gereleased |
| **v3.10.0** | RBAC Hardening & Synchronization | ✅ Gereleased |

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
