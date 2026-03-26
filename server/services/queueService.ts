import { YmsDelivery } from '../../src/types';

/**
 * QueueService implements the business logic for the YMS Priority Queue.
 * Managed by @Yard-Strategist & @System-Architect
 */

export interface QueueMetadata {
  waitMinutes: number;
}

export type YmsDeliveryWithMetadata = YmsDelivery & { metadata: QueueMetadata };

export const sortPriorityQueue = (deliveries: YmsDelivery[]): YmsDeliveryWithMetadata[] => {
  const now = new Date();

  return deliveries
    .filter(d => (d.status === 'GATE_IN' || d.status === 'IN_YARD') && !d.dockId)
    .map(d => {
      const startTime = new Date(d.registrationTime || d.arrivalTime || d.scheduledTime);
      const waitMinutes = Math.floor((now.getTime() - startTime.getTime()) / 60000);
      
      return {
        ...d,
        metadata: {
          waitMinutes: Math.max(0, waitMinutes)
        }
      };
    })
    .sort((a, b) => {
      // 1. Temperature Priority (Vries/Koel > Droog)
      const aTempPrio = (a.temperature === 'Vries' || a.temperature === 'Koel' || a.isReefer) ? 1 : 0;
      const bTempPrio = (b.temperature === 'Vries' || b.temperature === 'Koel' || b.isReefer) ? 1 : 0;

      if (aTempPrio !== bTempPrio) {
        return bTempPrio - aTempPrio; // Higher priority (1) comes first
      }

      // 2. Lateness Priority
      if (a.isLate && !b.isLate) return -1;
      if (!a.isLate && b.isLate) return 1;

      // 3. FIFO / Arrival Time (ETA)
      const aTime = new Date(a.scheduledTime || a.registrationTime || a.arrivalTime).getTime();
      const bTime = new Date(b.scheduledTime || b.registrationTime || b.arrivalTime).getTime();
      
      return aTime - bTime;
    });
};
