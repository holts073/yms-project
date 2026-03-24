# REFACTOR_ADVICE: Optimalisatie van het Manual YMS

Na de succesvolle modularisatie en het verwijderen van AI-logica, focussen we ons nu op de stabiliteit, prestaties en gebruiksvriendelijkheid van de handmatige workflow.

## 1. Database & Performance (@Data-Specialist)

### N+1 Query Probleem
In `src/db/queries.ts` worden voor elke delivery per-stuk documenten en audit-logs opgehaald.
- **Advies**: Gebruik een `LEFT JOIN` met `GROUP_CONCAT` voor documenten, of haal alle documenten in één sweep op voor de huidige pagina (`WHERE deliveryId IN (...)`). Dit vermindert het aantal database calls van ~30 naar 2 per pagina.

### Indexering
Met de groei van het aantal (handmatige) transacties is indexering cruciaal.
- **Advies**: Voeg indices toe op:
  - `documents(deliveryId)`
  - `audit_logs(deliveryId)`
  - `deliveries(reference, status, etaWarehouse)`
  - `yms_deliveries(reference, status, dockId)`

### Prepared Statements Cache
Zorg dat de statements in de modules één keer worden geprepared (buiten de functies) voor maximale snelheid bij frequente updates zoals dock-swaps.

---

## 2. Background Workers (@Worker-Specialist)

### Robuuste Reefer Monitoring
De huidige `inventory-worker.ts` gebruikt `setInterval` en broadcast de volledige state bij elke alert.
- **Advies**: 
  - Stap over naar een meer robuuste scheduling library indien het aantal taken groeit.
  - **Delta-updates**: Stuur alleen de nieuwe alert via `io.emit("NEW_ALERT", ...)` in plaats van `buildStaticState()`. Dit bespaart bandbreedte.
  - **Auto-Resolution**: Implementeer logica die `DWELL_TIME` alerts automatisch op `resolved: true` zet zodra de status van de delivery verandert naar `DOCKED` of `GATE_OUT`.

---

## 3. Security & Modulariteit (@System-Architect)

### Route Beveiliging
Nu de routes zijn opgesplitst in `/server/routes/`, is consistente authenticatie key.
- **Advies**: Implementeer een centrale `authMiddleware` die op alle `/api/*` routes wordt toegepast, behalve op `/api/login`.

### Socket Validatie
- **Advies**: Valideer elke binnenkomende socket actie tegen de permissies van de gebruiker (bijv. `currentUser.role === 'admin'` voor het verwijderen van leveringen).

---

## 4. Manual Workflow & UX (@Frontend-Specialist)

### Dashboard Optimalisatie
Nu de gebruiker alles zelf moet doen, moet de interface sneller reageren.
- **Advies**:
  - **Quick-Assign**: Voeg een zijbalk toe aan de `YmsDashboard` met "Wachtende Trucks" die direct naar een vrij dock gesleept kunnen worden.
  - **Smart Filters**: Voeg knoppen toe voor "Mijn acties vandaag" (bijv. "Toon alleen reefers met alerts").
  - **Drag-and-Drop Verbetering**: Maak de timeline blocks resizable om de geschatte lostijd (duration) direct aan te passen.

### Error Handling
Stap over van `alert()` en `console.error()` naar een UI-notificatie systeem (toasts) voor een premium ervaring.
