# ROADMAP v3 - YMS Control Tower

Deze roadmap bevat punten die geen directe prioriteit hebben voor de fundamentele werking van het systeem, maar gepland staan voor toekomstige sprints.

## Gebruikerservaring & UI
- [x] **Pipeline View Toggle:** Zorg voor een naadloze overgang tussen tabel- en kaartweergave in de pipeline (inkomend).
- [x] **v3.7.2**: UI Flow & Responsiviteit (Milestones & Stepper fix)
- [x] **v3.7.3**: Theme & UI Polish (Branding & Sidebar fix)
- [x] **v3.7.4**: Layout Consolidation (Table-Design & Stuck Fix)
- [ ] **v3.8.0**: Advanced Analytics & Forecasting (Einde sprint)
- [x] **Geavanceerde Filtering:** Uitgebreidere zoekopties in het archief.
- [x] **Real-time Notificaties:** Visuele signalen (popups) bij statuswijzigingen of nieuwe aankomsten.

## Data & Opschoning
- [x] **Demo Data Opschoning:** Verwijderen van oude "archief demo" leveringen uit de database.
- [x] **Database Optimalisatie:** Indexering van veelgebruikte kolommen zoals `reference` en `etaWarehouse`. Toegevoegd: `openingTime`, `closingTime` in `yms_warehouses`.

## Logistieke Uitbreidingen
- [ ] **Automatische Slot-Toewijzing:** Algoritme suggesties voor docks op basis van drukte en temperatuur.
