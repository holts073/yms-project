# YMS Control Tower: Skills & Playbooks (skills.md)
*Versie: 1.0.0 — Geregisseerd door het YMS Agent Team*

Dit document bevat de vastgelegde "Skills" (SOPs - Standard Operating Procedures) van het ontwikkelteam, voortkomend uit de overleggen tussen de agent-rollen zoals vastgelegd in `AGENTS.md`. Deze playbooks garanderen dat complexe, repetitieve taken consistent worden uitgevoerd, de Uni-directionele Dataflow behouden blijft, en het Nederlands correct wordt toegepast.

---

## Skill 1: `build_socket_feature`
**Betrokken Agents:** `@System-Architect`, `@Frontend-Specialist`, `@QA-Automator`
**Doel:** Een nieuwe real-time business feature toevoegen met perfecte Uni-directionele Dataflow.
**Stappen:**
1. **Frontend Trigger:** Definieer in de UI een interactie (`emit` naar Socket) en voorkom optimistische state updates.
2. **Type Safety:** Leg *alleen* gebruik van gedefinieerde interfaces uit `src/types.ts` vast (géén `any`).
3. **RBAC Guard (`@Security-Auditor`):** Controleer of de actor de juiste *capability* heeft en log falen in de Terminal en UI (`error_message` event).
4. **DB & Isolatie (`@Data-Specialist`):** Gebruik uitsluitend veilige, voorbereide queries. Filter strict op `warehouseId`.
5. **State Broadcast:** Beëindig met `buildStaticState` of gerichte emit, uitsluitend naar het correcte magazijn.

## Skill 2: `create_database_migration`
**Betrokken Agents:** `@Data-Specialist`, `@QA-Automator`, `@System-Architect`
**Doel:** Database tabellen wijzigen zonder dataverlies of foreign-key fouten.
**Stappen:**
1. **Backward-Compatibel Ontwerp:** Zorg voor default waarden en nullable velden bij nieuwe toevoegingen.
2. **Isolatie Integriteit:** Valideer `warehouseId` velden en hun verplichte scope in het schema.
3. **Trigger- & Audit-log Integratie:** Bij financiële of mutatie-gevoelige relaties (zoals slot-beheer of transacties), koppel direct aan de `audit_logs` trigger.
4. **Integrity Check:** Draai schemavalidaties na de migratie ter preventie van crashes door legacy-data.

## Skill 3: `build_ui_component`
**Betrokken Agents:** `@Frontend-Specialist`, `@UX-Visual-Director`, `@Text-Director`
**Doel:** Complexe, data-dense schermen bouwen voor React 19 met premium UX.
**Stappen:**
1. **Data Density:** Hanteer *Table-First Design* voor overzichten in plaats van bulky kaarten. Modulaire opbouw (`/shared` vs `/features`).
2. **Thema & Contrast:** Verifieer dat er geen hardcoded kleuren zijn gebruikt; laat alles terugvallen op CSS-variabelen ter ondersteuning van Dark/Light/Enterprise.
3. **Z-Index Cohesie:** Sluit "bleed" of overlap uit met Navigatie-zijbalken en Sonner-toasts (deze horen on-top).
4. **Copy & Terminologie:** Check alle Nederlandse termen (bv. 'Tijdslot' in plaats van 'Timeslot', 'Magazijn' i.p.v. 'Warehouse').

## Skill 4: `apply_rbac_permissions`
**Betrokken Agents:** `@Security-Auditor`, `@System-Architect`, `@UX-Visual-Director`
**Doel:** Acties op alle niveaus afschermen afhankelijk van Capability Matrix instellingen.
**Stappen:**
1. **Requirement Bepalen:** Koppel de actie aan een matrix-sleutel (bijv. `YMS_PRIORITY_OVERRIDE`).
2. **Backend Enforce:** Blokkeer de actie hard via pre-computation validation op de node server.
3. **UI Graceful Degradation:** Maak knoppen en paden onzichtbaar / disabled met heldere (tooltip) feedback.
4. **Upsell Hook (`@Growth-Strategist`):** Als de feature buiten de license/module ligt, toon een professioneel "Upgrade Required" design.

## Skill 5: `execute_financial_audit`
**Betrokken Agents:** `@Finance-Auditor`, `@Data-Specialist`
**Doel:** Controleren op en voorkomen van data-corruptie en berekeningsfouten in saldo's en Pallet-Ledgers.
**Stappen:**
1. **Orphans Zoeken:** Verifieer mutaties t.o.v. `address_book` en signaleer discrepanties door verwijderde leveranciers.
2. **Null-Safety Check:** Waarborg dat lege waarden voor `pallet_rate` correct als fallback 0 worden behandeld over de gehele calcualtie-lineair.
3. **Creditnota Verrekening:** Controleer of bij bulk-settlements de audit trail exact elke gekoppelde transactie heeft opgeslagen met timestamp & executor.

## Skill 6: `resolve_incident_or_crash`
**Betrokken Agents:** `@QA-Automator`, `@System-Architect`, `@Text-Director`
**Doel:** Veilig fouten oplossen zonder documentatie achter te laten bij het team.
**Stappen:**
1. **Logs Isolate:** Analyseer terminal outputs direct en reproduceer offline.
2. **Frontend Waarschuwing:** Verifieer dat crashes geisoleerd blijven (React Error Boundaries) en Sonner niet wordt geflood.
3. **Root Cause Analysis:** Beschrijf wat gebroken is en pas ten strengste architecturele richtlijnen toe voor reparatie (geen duct-tape).
4. **Sync (`npm run version:sync`):** Werk na fundamentele aanpassingen `ARCHITECTURE.md` of `AGENTS.md` direct bij.
