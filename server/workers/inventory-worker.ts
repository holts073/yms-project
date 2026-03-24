import { Server } from 'socket.io';
import { getYmsDeliveries, getYmsAlerts, saveYmsAlert } from '../../src/db/queries';
import { buildStaticState } from '../routes/deliveries';

export const startInventoryWorker = (io: Server) => {
  setInterval(() => {
    const allDeliveries = getYmsDeliveries();
    const now = new Date();
    
    allDeliveries.forEach(d => {
        if (!d.isReefer) return;

        // Dwell Time in Yard
        if (d.status === 'IN_YARD' && d.statusTimestamps?.IN_YARD) {
            const dwellMins = (now.getTime() - new Date(d.statusTimestamps.IN_YARD).getTime()) / 60000;
            const limit = 60;
            
            if (dwellMins > limit) {
                const existingAlerts = getYmsAlerts(d.warehouseId);
                const alreadyAlerted = existingAlerts.find(a => a.deliveryId === d.id && a.type === 'DWELL_TIME' && !a.resolved);
                
                if (!alreadyAlerted) {
                    saveYmsAlert({
                        id: Math.random().toString(36).substr(2, 9),
                        deliveryId: d.id,
                        warehouseId: d.warehouseId,
                        type: 'DWELL_TIME',
                        severity: 'high',
                        timestamp: now.toISOString(),
                        message: `REEFER DWELL ALERT: ${d.reference} wacht al >${limit}m in de yard!`,
                        resolved: false
                    });
                    io.emit("state_update", buildStaticState());
                }
            }
        }

        // Wait Time Logic
        if (d.status === 'GATE_IN' && d.statusTimestamps?.GATE_IN) {
            const waitedMins = (now.getTime() - new Date(d.statusTimestamps.GATE_IN).getTime()) / 60000;
            const threshold = d.tempAlertThreshold || 30;
            
            if (waitedMins > threshold) {
                const existingAlerts = getYmsAlerts(d.warehouseId);
                const alreadyAlerted = existingAlerts.find(a => a.deliveryId === d.id && a.type === 'WAIT_TIME' && !a.resolved);
                
                if (!alreadyAlerted) {
                    saveYmsAlert({
                        id: Math.random().toString(36).substr(2, 9),
                        deliveryId: d.id,
                        warehouseId: d.warehouseId,
                        type: 'WAIT_TIME',
                        severity: waitedMins > threshold * 2 ? 'high' : 'medium',
                        timestamp: now.toISOString(),
                        message: `REEFER WAIT ALERT: ${d.licensePlate} (${d.reference}) wacht al ${Math.round(waitedMins)} minuten!`,
                        resolved: false
                    });
                    io.emit("state_update", buildStaticState());
                }
            }
        }
    });
  }, 60000); // Check every minute
};
