import { Server } from 'socket.io';
import { getYmsDeliveries, getYmsAlerts, saveYmsAlert, getYmsDocks, resolveYmsAlert } from '../../src/db/queries';
import { buildStaticState } from '../routes/deliveries';

export const startInventoryWorker = (io: Server) => {
  setInterval(() => {
    const allDeliveries = getYmsDeliveries();
    const now = new Date();
    
    allDeliveries.forEach(d => {
        // Auto-Resolution of resolved alerts
        const activeAlerts = getYmsAlerts(d.warehouseId).filter(a => a.deliveryId === d.id && !a.resolved);
        
        if (d.status === 'GATE_OUT' || d.status === 'COMPLETED') {
            activeAlerts.forEach(a => resolveYmsAlert(a.id));
        }

        // Direction Validation (Truck Direction vs Dock Capability)
        if (d.dockId && d.status === 'DOCKED') {
            const allDocks = getYmsDocks(d.warehouseId);
            const dock = allDocks.find(dk => dk.id === d.dockId);
            if (dock && dock.direction_capability !== 'BOTH' && dock.direction_capability !== d.direction) {
                const alreadyAlerted = activeAlerts.find(a => a.type === 'DIRECTION_MISMATCH');
                if (!alreadyAlerted) {
                    const newAlert = {
                        id: Math.random().toString(36).substr(2, 9),
                        deliveryId: d.id,
                        warehouseId: d.warehouseId,
                        type: 'DIRECTION_MISMATCH',
                        severity: 'medium',
                        timestamp: now.toISOString(),
                        message: `DIRECTION MISMATCH: ${d.reference} (${d.direction}) staat aan ${dock.name} (${dock.direction_capability})!`,
                        resolved: false
                    };
                    saveYmsAlert(newAlert);
                    io.emit("NEW_ALERT", newAlert);
                }
            }
        }

        if (!d.isReefer) return;

        // Dwell Time in Yard
        if (d.status === 'IN_YARD' && d.statusTimestamps?.IN_YARD) {
            const dwellMins = (now.getTime() - new Date(d.statusTimestamps.IN_YARD).getTime()) / 60000;
            const limit = 60;
            
            if (dwellMins > limit) {
                const existingAlerts = getYmsAlerts(d.warehouseId);
                const alreadyAlerted = existingAlerts.find(a => a.deliveryId === d.id && a.type === 'DWELL_TIME' && !a.resolved);
                
                if (!alreadyAlerted) {
                    const newAlert = {
                        id: Math.random().toString(36).substr(2, 9),
                        deliveryId: d.id,
                        warehouseId: d.warehouseId,
                        type: 'DWELL_TIME',
                        severity: 'high',
                        timestamp: now.toISOString(),
                        message: `REEFER DWELL ALERT: ${d.reference} wacht al >${limit}m in de yard!`,
                        resolved: false
                    };
                    saveYmsAlert(newAlert);
                    io.emit("NEW_ALERT", newAlert); // Delta update
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
                    const newAlert = {
                        id: Math.random().toString(36).substr(2, 9),
                        deliveryId: d.id,
                        warehouseId: d.warehouseId,
                        type: 'WAIT_TIME',
                        severity: waitedMins > threshold * 2 ? 'high' : 'medium',
                        timestamp: now.toISOString(),
                        message: `REEFER WAIT ALERT: ${d.licensePlate} (${d.reference}) wacht al ${Math.round(waitedMins)} minuten!`,
                        resolved: false
                    };
                    saveYmsAlert(newAlert);
                    io.emit("NEW_ALERT", newAlert); // Delta update
                }
            }
        }
    });
  }, 60000); // Check every minute
};
