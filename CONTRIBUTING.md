# Contributing aan YMS

Welkom in het ILG Foodgroup YMS (Yard Management System) ontwikkelaarsteam. 

Om onze software-architectuur zuiver, modulaire en visueel professioneel te houden, hanteren wij onverbiddelijke en strikte "spelregels" bij iedere code uitbreiding of refactor. Het niet naleven van deze regels stagneert pull-requests en vertroebelt het ecosysteem.

## 🛠️ De Spelregels voor Front-end & Logica

### 1. Gebruik ALTIJD componenten uit `shared/`
Zelfgebouwde `<button>` of `<input>` of soortgelijke abstracte HTML-gebaseerde elementen die bezaaid liggen met rondslingerende Tailwind-CSS classes worden **categorisch niet geaccepteerd** in feature of page componenten. 
- Gebruik exclusief de wrappers: `Button`, `Input`, `Badge`, `Modal`, `Card` en `Table` te vinden onder de `src/components/shared/` directory.
- Uniformiteit staat op nummer één. Hier verblijven de definities voor hovers, interactieve stijlen, en vormgeving. 

### 2. Decompositie: Ontleed nieuwe functies tot sub-componenten
Bestaande pagina's (zoals Dashboards en Settings) fungeren uitsluitend om componenten te 'orkestreren'. 
- Bestaat je nieuwe toevoeging uit meer dan pure layout (zoals een iteratieve tabel of een formulieren-wizard)? Knip deze op in de logische feature. 
- Al je gerichte business logica-weergaven horen in de `src/components/features/` map, waarna ze ingeladen worden en 'aangezet' worden door de Dashboard UI.

### 3. Test álle UI wijzigingen in Light én Dark Mode
We bieden compromisloze compatibiliteit voor Theming.
- Een UI block die goed leesbaar is in the lichte variant mag niet plots de "Dark Mode" onleesbaar maken doordat hard-code `bg-slate-200` niet goed rendert over de donkere achtergrond.
- Gebruik ten allen tijde **semantische thema-variabelen** (b.v. `bg-[var(--muted)]`, `border-border`, en `text-foreground`). Dit zorgt dat acties en kaders uniform inkleuren via de definities uit `index.css`.

### 4. Houd de Frontend 'Dom' (Separation of Concerns)
Aanhakend op prestatie-en state logica: prop React view-componenten NIET vol met complexe iteraties of state transformaties.
- **Logica scheiden**: Delegeer transformaties en map loops voor grote arrays naar Custom Hooks (zoals te zien is in `useYmsData.ts` of `useDeliveries.ts`). Dit bundelt filtering en opschoning, waardoor `views` enkel de props doorgeven aan renderers.
- **Overhevelen naar Back-end**: Diep-mathematische validaties (zoals prestatiedoeleinden als OTIF scores, ETA vertragingsrisico's) horen te leven en verwerkt te worden binnenin de `Services/Backend` / `Workers` scope, waarna geabstraheerde data via sockets in simpele interfaces bij de frontend arriveert.

*Happy Coding en bij twijfel: vraag de System-Architect.*
