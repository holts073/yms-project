import { Delivery, Document } from '../types';

export interface Milestone {
  key: string;
  label: string;
  status: number;
}

export const CONTAINER_MILESTONES: Milestone[] = [
  { key: 'order', label: 'Order', status: 0 },
  { key: 'in_transit', label: 'In Transit', status: 25 },
  { key: 'customs', label: 'DOUANE', status: 50 },
  { key: 'on_route', label: 'Onderweg naar Magazijn', status: 75 },
  { key: 'warehouse', label: 'Warehouse Arrival', status: 100 },
];

export const EXWORKS_MILESTONES: Milestone[] = [
  { key: 'order', label: 'Order', status: 0 },
  { key: 'transport', label: 'Transport Order', status: 25 },
  { key: 'in_transit', label: 'In Transit', status: 50 },
  { key: 'warehouse', label: 'Warehouse Arrival', status: 100 },
];

/**
 * Gatekeeper checks if a delivery can move to a target status based on document requirements.
 * Returns an error message if blocked, or null if allowed.
 */
export function gatekeeperCheck(delivery: Delivery, targetStatus: number): string | null {
  const docs = delivery.documents || [];

  // Helper to check if a document is received by name (case-insensitive)
  const isDocReceived = (namePatterns: string[]) => {
    return docs.some(d => 
      namePatterns.some(pattern => d.name.toLowerCase().includes(pattern.toLowerCase())) && 
      d.status === 'received'
    );
  };

  // 1. Ex-works: Transport Order check for In Transit
  if (delivery.type === 'exworks' && targetStatus >= 50 && targetStatus < 100) {
    if (!isDocReceived(['transport order'])) {
      return 'Document "Transport Order" is verplicht om de status op "In Transit" te zetten.';
    }
  }

  // 2. Container: Milestone Specific Checks
  if (delivery.type === 'container') {
    // To move to DOUANE (50)
    if (targetStatus >= 50 && targetStatus < 75) {
      if (!isDocReceived(['swb', 'bill of lading', 'bol', 'b/l'])) {
        return 'Een verplicht vervoersdocument (SWB of Bill of Lading) is vereist om naar de DOUANE stap te gaan.';
      }
    }

    // To move to Onderweg naar Magazijn (75)
    if (targetStatus >= 75 && targetStatus < 100) {
      // Check for NOA
      if (!isDocReceived(['noa', 'notification of arrival'])) {
        return 'De NOA (Notification of Arrival) is verplicht om de container vrij te geven voor transport naar het magazijn.';
      }
      
      // NEW: Scan Logic check
      // We'll check if any document contains "Scan" and is required but not received
      const scanDoc = docs.find(d => d.name.toLowerCase().includes('scan') && d.required);
      if (scanDoc && scanDoc.status !== 'received') {
        return 'Deze container staat gemarkeerd voor een scan. "Scan Release" documentatie is verplicht voor vertrek naar het magazijn.';
      }
    }
  }

  // 3. Final Check: Warehouse Arrival (100)
  if (targetStatus >= 100) {
    const missingRequired = docs.filter(d => d.required && d.status !== 'received');
    if (missingRequired.length > 0) {
      return `Niet alle verplichte documenten zijn aanwezig: ${missingRequired.map(d => d.name).join(', ')}`;
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
