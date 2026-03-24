import { getYmsDeliveries, getYmsDocks, saveYmsDelivery, saveYmsDock } from '../../src/db/queries';

export const calculateRisk = (delivery: any) => {
  if (delivery.status === 100) return { risk: 'low', reason: 'Voltooid' };
  
  const now = new Date();
  const eta = delivery.etaWarehouse ? new Date(delivery.etaWarehouse) : (delivery.eta ? new Date(delivery.eta) : null);
  const missingRequired = delivery.documents?.filter((d: any) => d.required && d.status === 'missing').length || 0;
  
  if (missingRequired > 0) return { risk: 'high', reason: 'Kritieke documenten ontbreken' };
  
  if (eta) {
    const daysToEta = Math.ceil((eta.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysToEta < 3 && delivery.status < 80) return { risk: 'high', reason: 'Deadline nadert, actie vereist' };
    if (daysToEta < 7 && delivery.status < 50) return { risk: 'medium', reason: 'Voortgang loopt achter op schema' };
  }
  
  return { risk: 'low', reason: 'Op schema' };
};

export const performAutoScheduling = (warehouseId: string, io: any, buildStaticState: Function) => {
  const dels = getYmsDeliveries(warehouseId).filter(d => d.status === 'GATE_IN' || d.status === 'IN_YARD' || d.status === 'PLANNED');
  const availableDocks = getYmsDocks(warehouseId).filter(d => d.status === 'Available');

  if (availableDocks.length === 0 || dels.length === 0) return;

  // Calculate Priority Scores
  const scoredDels = dels.map(d => {
    let score = 0;
    // Temperature Bonus
    if (d.temperature === 'Vries') score += 50;
    else if (d.temperature === 'Koel') score += 30;
    
    // Reefer Bonus
    if (d.isReefer) score += 20;

    // Urgency (earlier is more urgent)
    const schedTime = new Date(d.scheduledTime).getTime();
    const now = new Date().getTime();
    const diffMins = (schedTime - now) / 60000;
    
    if (diffMins < 0) score += 40; // Overdue
    else if (diffMins < 60) score += 20; // Within hour

    // Wait Time Penalty (for arrived trucks)
    if ((d.status === 'GATE_IN' || d.status === 'IN_YARD') && d.registrationTime) {
      const waitedMins = (now - new Date(d.registrationTime).getTime()) / 60000;
      score += waitedMins * 0.5; // +0.5 pts per minute waiting
    }

    return { ...d, priorityScore: Math.round(score) };
  }).sort((a, b) => b.priorityScore - a.priorityScore);

  // Assign to docks
  scoredDels.forEach((d, idx) => {
    if (idx < availableDocks.length && (d.status === 'GATE_IN' || d.status === 'IN_YARD' || d.status === 'PLANNED')) {
      const dock = availableDocks[idx];
      // Check compatibility
      const allowed = JSON.parse(dock.allowedTemperatures || '[]');
      if (allowed.includes(d.temperature) || (d.temperature === 'Droog' && dock.isFastLane)) {
        d.dockId = dock.id;
        d.status = 'DOCKED';
        dock.status = 'Occupied';
        dock.currentDeliveryId = d.id;
        saveYmsDelivery(d);
        saveYmsDock(dock);
      }
    }
  });

  io.emit("state_update", buildStaticState());
};
