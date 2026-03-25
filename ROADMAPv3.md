# ROADMAP v3: De Toekomst van de ILG Control Tower

Dit document schetst de strategische visie voor de verdere ontwikkeling van het YMS Platform.

## ✅ Voltooid in v3.4.2
- **State Reconciliation (v3.4.2)**: Heartbeat-mechanisme geïmplementeerd in `SocketContext`.
- **Unit Testing Foundation (v3.4.2)**: **Vitest** setup voltooid met de eerste logistieke test-suites.
- **Architectural Cleanup**: Prop-drilling geëlimineerd; Z-index management gecentraliseerd.

## 🕒 Fase 3: Automated QA & Stability
*Focus op regressie-preventie en robuuste browser-tests.*
- [ ] **E2E Testing**: Implementatie van **Playwright** voor de kritieke ritten-flow.
- [ ] **Visual Regression**: Automatische visuele controles om design-breaks te voorkomen.

## 🕒 Fase 4: Compliance & Reporting
*Voldoen aan audit-eisen en professionele documentatie.*
- [ ] **PDF Exports**: Genereren van laadlijsten en vrachtbrieven.
- [ ] **Power-User Archive**: Geavanceerde filters en analytics in het archief.
- [ ] **Advanced Audit Trails**: Diepere logging van status-wijzigingen.

## 🚀 Fase 5: Strategic Expansion (v3.5)
*Security, Carriers en Geavanceerd Yard Management.*
- [ ] **External Carrier Portal**: Nieuwe rol met afzonderlijke login en rate-limiting.
- [ ] **Smart Dock Planning**: Filtering op magazijn en actieve docks.
- [ ] **Active Session Management**: Counter en onderscheid Tablet vs. Office.
- [ ] **Data Verrijking**: Supplier/Customer nummers in adressenboek.
- [ ] **SAP CSV Import (Quick-Win)**: Semi-automatische import van dagelijkse SAP-lijsten.

## 🔗 Fase 6: Enterprise Integration (v3.6)
*Naadloze koppeling met de bron-systemen (SAP Business One).*
- [ ] **SAP Service Layer API**: Onderzoek naar directe REST-koppeling met SAP Business One voor real-time data flow.
- [ ] **Crystal Reports Bridge**: Ontwikkelen van een connector om data uit bestaande Crystal Reports rapportages automatisch in te laden in de YMS Pipeline.
- [ ] **EDI-Standaardisatie**: Voorbereiding op Electronic Data Interchange met externe transporteurs.

---
*Status: Roadmap v3.5 - Regie door @System-Architect & @Integration-Specialist*
*Laatst bijgewerkt: 2026-03-25*
