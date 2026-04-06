import { Delivery, Document } from '../types';

export interface Milestone {
  key: string;
  label: string;
  status: number;
}

export const CONTAINER_MILESTONES: Milestone[] = [
  { key: 'order', label: 'Order', status: 0 },
  { key: 'in_transit', label: 'In Transit', status: 25 },
  { key: 'customs', label: 'DOUANE', status: 40 },
  { key: 'on_route', label: 'Onderweg naar Magazijn', status: 50 },
  { key: 'arrival', label: 'Aangemeld bij Poort', status: 75 },
  { key: 'warehouse', label: 'Ingecheckt', status: 100 },
];

export const EXWORKS_MILESTONES: Milestone[] = [
  { key: 'order', label: 'Order', status: 0 },
  { key: 'transport', label: 'Transport Order', status: 25 },
  { key: 'in_transit', label: 'In Transit', status: 50 },
  { key: 'arrival', label: 'Aankomst Magazijn', status: 75 },
  { key: 'warehouse', label: 'Ingecheckt', status: 100 },
];

/**
 * Gatekeeper checks if a delivery can move to a target status based on document requirements.
 * Returns an error message if blocked, or null if allowed.
 */
export function gatekeeperCheck(delivery: Delivery, targetStatus: number): string | null {
  const docs = delivery.documents || [];

  // 1. Dynamic Milestone Check (Universal)
  const missingRequired = docs.filter(d => 
    d.required && 
    (d.blocksMilestone || 100) <= targetStatus && 
    d.status !== 'received'
  );

  if (missingRequired.length > 0) {
    const names = missingRequired.map(d => d.name).join(', ');
    return `Niet alle verplichte documenten voor deze stap zijn aanwezig: ${names}`;
  }

  // 2. Legacy / Special Pattern Checks (Optional Fallbacks)
  const isDocReceived = (namePatterns: string[]) => {
    return docs.some(d => 
      namePatterns.some(pattern => d.name.toLowerCase().includes(pattern.toLowerCase())) && 
      d.status === 'received'
    );
  };

  // Keep specific patterns for specialized logic not covered by simple naming
  if (delivery.type === 'container' && targetStatus >= 40 && targetStatus < 50) {
    if (!isDocReceived(['swb', 'bill of lading', 'bol', 'b/l'])) {
      // If we don't have a document specifically marked for 40, check for the pattern
      const hasSpecific40 = docs.some(d => d.blocksMilestone === 40);
      if (!hasSpecific40) return 'Een verplicht vervoersdocument (SWB of Bill of Lading) is vereist voor de DOUANE stap.';
    }
  }

  return null;
}

export function isRegisteredOnTime(delivery: Delivery): boolean {
  if (!delivery.createdAt || !delivery.etaWarehouse) return true; // Default to true if missing data
  
  const created = new Date(delivery.createdAt).getTime();
  const eta = new Date(delivery.etaWarehouse).getTime();
  const diffHours = (eta - created) / (1000 * 60 * 60);
  
  return diffHours >= 24;
}

export function getActiveMilestone(delivery: Delivery): Milestone | undefined {
  const milestones = delivery.type === 'container' ? CONTAINER_MILESTONES : EXWORKS_MILESTONES;
  return [...milestones].reverse().find(m => delivery.status >= m.status);
}

export function isAnomaly(delivery: Delivery): boolean {
  if (delivery.status >= 100) return false;
  if (!delivery.etaWarehouse) return false;
  
  const today = new Date();
  const eta = new Date(delivery.etaWarehouse);
  
  // If ETA has passed but status is not 'Warehouse Arrival'
  return today > eta;
}
