# REFACTOR_ADVICE: De "Strafexpeditie-lijst"

Opgesteld door de @QA-Automator en de @System-Architect ten behoeve van de shift van morgenochtend. Voordat nieuwe features (zoals de AI Fast-Lane) worden gebouwd, moet onderstaande lijst 100% leeg zijn. Dit garandeert een onbreekbare fundering.

## 1. Visuele "Drama" Punten (Nog niet 100% Pixel-Perfect)
-   [ ] **Modals op Mobiel:** Controleer of de `YmsAssignmentModal` op smalle schermen breed genoeg uitschaalt zonder de achterliggende content te clippen (test grid layouts in Tailwind).
-   [ ] **Badges Overflow:** Bij extreem lange referentienummers of leveranciersnamen in de Pipeline Cards breekt de text soms uit het kader. Voeg `truncate` of `line-clamp-1` overal consequent toe.
-   [ ] **Whitespace Balans:** De YMS Timeline (DockGrid) heeft in verhouding met de luchtige Pipeline cards nog een vrij "dense" tabelstructuur. Dit vloekt lichtelijk met de vernieuwde UI.

## 2. Console-Errors & Code Smells (Backend & Frontend)
-   [ ] **Undefined Keys in Lijsten:** Sommige sublijsten wachten nog op unieke `key={item.id}` waarden waardoor React in de console blijft waarschuwen.
-   [ ] **Node/SQLite Memory:** De `getLogs()` en `getDeliveries()` in `queries.ts` laden momenteel *alle* rows in de memory. Oplossing vereist: Offset/Limit of infinite scroll.
-   [ ] **Socket Disconnects:** Bij HMR (Hot Module Reloading) raakt de UI de context kwijt en laat deze verouderde statussen zien totdat men refresht. Fix de Socket reconnect logic in `SocketContext.tsx`.

## 3. Prioriteitenlijst voor Morgenochtend
1.  **Fix de Console!** Alle React warnings oplossen is **Prioriteit #1**.
2.  **Visueel Herstel.** Trek de laatste kaders recht.
3.  Pas daarna krijgt de @QA-Automator toestemming om de Fast-Lane feature ticket of andere Logistieke epics in ontvangst te nemen.
