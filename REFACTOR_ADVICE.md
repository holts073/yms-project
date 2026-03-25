# REFACTOR_ADVICE: Kwaliteit & Stabiliteit

Dit document dient als de "strafexpeditie-lijst" voor het ontwikkelteam. Voordat nieuwe functionele epics worden gestart, moeten onderstaande punten zijn geadresseerd om de technische integriteit van de Control Tower te waarborgen.

## 1. Technical Debt (Code & Architectuur)
- **Prop-drilling in YmsDashboard**: De `YmsDashboard.tsx` geeft momenteel teveel props door naar sub-componenten zoals `YmsDeliveryList`. Advies: Gebruik de bestaande `useYmsData` hook dieper in de boom of introduceer een specifiek `DeliveryContext`.
- **Z-Index Management**: Hoewel we Sonner en Modals gebruiken, zijn er incidentele conflicten tussen de Sidebar en de Timeline tooltips. Centraliseer Z-index variabelen in `index.css`.
- **Error Boundaries**: Implementeer React Error Boundaries rondom de `YmsTimeline` om te voorkomen dat een enkele render-error de hele Control Tower platlegt.

## 2. Visual Consistency (@UX-Visual-Director)
- **Dark Mode Contrast**: Controleer het contrast van grijze teksten (`text-slate-500`) op de donkere kaart-achtergronden. Sommige elementen vallen weg bij lage schermhelderheid.
- **Padding & Margins**: De transitie tussen de `Global Pipeline` cards en de `Active Yard` grid vertoont inconsistente tussenruimtes (margins). Trek dit recht naar een standaard `gap-8` of `gap-10`.
- **Loading States**: Vervang de generieke spinners door 'skeletons' die passen bij de vorm van de kaarten/tabelregels voor een rustiger laadbeeld.

## 3. Performance & Schaalbaarheid
- **Asset Optimalisatie**: De `logo.jfif` en andere beelden moeten omgezet worden naar `.webp` voor snellere initiële laadtijden.
