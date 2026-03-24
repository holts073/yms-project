# Analyse van Code Kwaliteit & Verbeterpunten (YMS Project)

Dit document bevat een overzicht van de geïdentificeerde 'dead code', dubbele functies en suggesties voor structurele verbeteringen in het YMS project.

## 1. Dead Code & Verouderde Bestanden

*   **`src/db/migrate.ts`**: Dit bestand verwijst naar `yms.db`, terwijl het actieve project gebruik maakt van `database.sqlite`. Dit lijkt een legacy script dat niet meer relevant is voor de huidige database-structuur.
*   **`server_test.log`**: Een tijdelijk logbestand in de root dat verwijderd kan worden.
*   **`.env.example`**: Bevat mogelijk verouderde variabelen die niet volledig overeenkomen met de implementatie in `server.ts` (bijv. SMTP instellingen worden vaak uit de database gehaald via `companySettings`).
*   **`seed.ts`**: Hoewel nuttig voor development, wordt dit bestand niet aangeroepen in het build-proces en kan het leiden tot inconsistenties als de schema's wijzigen zonder dat de seed wordt bijgewerkt.

## 2. Dubbele Functies & Redundantie

*   **`cn` Utility**: De functie voor het samenvoegen van Tailwind classes (`cn`) is in bijna elk component opnieuw gedefinieerd (o.a. in `App.tsx`, `AuditLog.tsx`, `Dashboard.tsx`, `DeliveryManager.tsx`).
    *   *Advies*: Importeer deze centraal vanuit `src/lib/utils.ts`.
*   **`getStatusLabel`**: Deze logica is dubbel uitgevoerd in:
    1.  `server.ts` (regels 258-271)
    2.  `src/lib/ymsRules.ts` (regels 34-47)
    *   *Advies*: Centraliseer alle status-labels in `ymsRules.ts`.
*   **Database Queries**: In `server.ts` staan veel directe aanroepen naar database functies die bijna identiek zijn aan elkaar voor verschillende entiteiten (zoals de `DELETE` acties).
    *   *Advies*: Maak gebruik van een meer generieke query-handler of centraliseer de logica in `src/db/queries.ts`.

## 3. Structurele Verbeterpunten

### Architectuur
*   **`server.ts` Refactoring**: De `switch(type)` in de Socket.io handler is gegroeid tot meer dan 500 regels. Dit maakt het bestand onoverzichtelijk en lastig te testen.
    *   *Advies*: Splits de acties op in aparte "handlers" of "services" (bijv. `deliveryHandlers.ts`, `userHandlers.ts`).
*   **Error Handling**: Veel acties in de backend gebruiken `console.error` maar sturen geen foutmelding terug naar de frontend. Gebruikers zien hierdoor soms niet waarom een actie is mislukt.

### Beveiliging & Hardcoding
*   **Default Passwords**: Het wachtwoord `welkom123` staat hardcoded als fallback in `server.ts` en `migrate.ts`.
    *   *Advies*: Verwijder hardcoded credentials en dwing het gebruik van omgevingsvariabelen of een initiële setup-flow af.
*   **JWT Secret**: De `fallback_secret_key_for_dev_only` in `server.ts` is een veiligheidsrisico als deze per ongeluk in productie wordt gebruikt.

### Type Safety
*   **Gebruik van `any`**: Er wordt veelvuldig gebruik gemaakt van `any` in zowel de frontend als backend (vooral bij Socket actions en database resultaten).
    *   *Advies*: Gebruik de gedefinieerde interfaces in `src/types.ts` consequenter om runtime fouten te voorkomen.

### UX / UI
*   **Inconsistente Naamgeving**: De termen 'Deliveries' (SCM) en 'YMS Deliveries' worden soms door elkaar gebruikt, wat verwarrend kan zijn voor nieuwe ontwikkelaars of gebruikers.
*   **Real-time redundante updates**: Sommige acties triggeren zowel `DELIVERY_UPDATED` als `state_update`, wat kan leiden tot dubbele renders in de frontend.

---
*Dit overzicht is bedoeld ter informatie. Er zijn geen wijzigingen direct in de broncode aangebracht.*
