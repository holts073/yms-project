export type GlossaryCategory = 'Financieel & Kosten' | 'Yard & Magazijn' | 'Documenten & Zeevracht' | 'Incoterms';

export interface GlossaryEntry {
  id: string;
  term: string;
  definition: string;
  category: GlossaryCategory;
}

export const GLOSSARY: GlossaryEntry[] = [
  // Financieel & Kosten
  {
    id: 'demurrage',
    term: 'Demurrage (Kosten)',
    definition: 'Kosten die de rederij in rekening brengt als een container langer op de terminal blijft staan dan de afgesproken Free Time.',
    category: 'Financieel & Kosten'
  },
  {
    id: 'free_time',
    term: 'Free Time (Vrije Dagen)',
    definition: 'Het aantal dagen dat een container kosteloos op de terminal mag staan voordat er Demurrage kosten in rekening worden gebracht.',
    category: 'Financieel & Kosten'
  },
  {
    id: 'thc',
    term: 'THC (Terminal Handling Charges)',
    definition: 'De administratie- en handlingskosten voor het verplaatsen van de container op de haven/terminal.',
    category: 'Financieel & Kosten'
  },
  {
    id: 'standing_time',
    term: 'Standing Time Cost (Staangeld)',
    definition: 'Kosten die een transporteur doorberekent als een vrachtwagen te lang moet wachten op de yard voordat deze gelost kan worden.',
    category: 'Financieel & Kosten'
  },
  
  // Yard & Magazijn
  {
    id: 'reefer',
    term: 'Reefer (Koelcontainer)',
    definition: 'Een "Refrigerated Container". Dit is een actieve koel- of vriescontainer die stroom nodig heeft en vaak prioriteit krijgt bij het aandocken om temperatuurverschillen te voorkomen.',
    category: 'Yard & Magazijn'
  },
  {
    id: 'gate_in',
    term: 'Gate-In',
    definition: 'Het moment waarop een vrachtwagen zich officieel aanmeldt en het terrein (de Yard) oprijdt.',
    category: 'Yard & Magazijn'
  },
  {
    id: 'pallet_reconciliation',
    term: 'Pallet Reconciliatie',
    definition: 'Het proces waarbij de werkelijk binnengekomen pallets worden afgestemd (verrekend) met de vooraf geplande pallets om financiële verschillen bij te houden.',
    category: 'Yard & Magazijn'
  },
  
  // Documenten & Zeevracht
  {
    id: 'bol',
    term: 'Bill of Lading (B/L)',
    definition: 'Het zeevrachtdocument. Dit is het eigendomsbewijs en vervoerscontract van de container.',
    category: 'Documenten & Zeevracht'
  },
  {
    id: 'telex',
    term: 'Telex Release',
    definition: 'Een elektronische vrijgave van de vracht door de rederij. Hierdoor hoeft de originele (papieren) Bill of Lading niet meer fysiek overhandigd te worden om de container op te halen.',
    category: 'Documenten & Zeevracht'
  },
  {
    id: 'pod',
    term: 'Port of Discharge',
    definition: 'De lossingshaven (bijv. Rotterdam of Antwerpen) waar de container van het schip wordt gehaald.',
    category: 'Documenten & Zeevracht'
  },
  {
    id: 'customs_cleared',
    term: 'Customs Cleared (Ingeklaard)',
    definition: 'De status die aangeeft dat de douane de goederen heeft vrijgegeven voor het vrije verkeer binnen de EU.',
    category: 'Documenten & Zeevracht'
  },
  {
    id: 'cmr',
    term: 'CMR (Vrachtbrief)',
    definition: 'Het internationaal gestandaardiseerde vervoersdocument voor wegtransport.',
    category: 'Documenten & Zeevracht'
  },
  
  // Incoterms
  {
    id: 'incoterm',
    term: 'Incoterm',
    definition: 'Internationale leveringsvoorwaarden die bepalen wie (koper of verkoper) verantwoordelijk is voor transportkosten en risico\'s.',
    category: 'Incoterms'
  },
  {
    id: 'exw',
    term: 'EXW (Ex-Works)',
    definition: 'Incoterm waarbij de koper (ILG) verantwoordelijk is voor het ophalen van de goederen bij de fabriek van de leverancier, inclusief alle transportkosten en risico\'s.',
    category: 'Incoterms'
  },
  {
    id: 'fob',
    term: 'FOB (Free on Board)',
    definition: 'Incoterm waarbij de verkoper de goederen aan boord van het schip brengt. Vanaf dat moment draagt de koper de kosten en risico\'s.',
    category: 'Incoterms'
  },
  {
    id: 'cif',
    term: 'CIF (Cost, Insurance and Freight)',
    definition: 'Incoterm waarbij de verkoper de transportkosten en verzekering naar de bestemmingshaven betaalt, maar het risico overgaat zodra goederen op het schip zijn geladen.',
    category: 'Incoterms'
  },
  {
    id: 'ddp',
    term: 'DDP (Delivered Duty Paid)',
    definition: 'Incoterm waarbij de verkoper alle kosten (inclusief invoerrechten en belastingen) en risico\'s draagt tot de aflevering op de eindbestemming.',
    category: 'Incoterms'
  }
];

export const getGlossaryTerm = (id: string): GlossaryEntry | undefined => {
  return GLOSSARY.find(entry => entry.id === id);
};
