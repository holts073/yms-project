import { Server, Socket } from "socket.io";
import { 
  insertDelivery, getAllDeliveries, deleteDelivery, saveUser, getUsers, 
  saveAddressBookEntry, getAddressBook, saveYmsDock, saveYmsWaitingArea, 
  getYmsDeliveries, saveYmsDelivery, deleteYmsDelivery, saveYmsWarehouse, 
  deleteYmsWarehouse, saveYmsDockOverride, deleteYmsDockOverride, 
  saveYmsAlert, deleteYmsAlert, resolveYmsAlert, addLog, getYmsDocks
} from '../../src/db/queries';
import { saveSetting } from '../../src/db/sqlite';
import { isValidTransition } from '../../src/lib/ymsRules';
import { buildStaticState } from '../routes/deliveries';

export const setupSocketHandlers = (io: Server) => {
  io.on("connection", (socket: Socket) => {
    socket.emit("init", buildStaticState());

    socket.on("action", (data) => {
      const { type, payload, user } = data;
      const timestamp = new Date().toISOString();

      let logEntry = {
        timestamp,
        user: user.name,
        action: "",
        details: "",
        reference: ""
      };

      try {
        switch (type) {
          case "ADD_DELIVERY": {
            const newDelivery = { 
              ...payload, 
              auditTrail: [{
                timestamp,
                user: user.name,
                action: "Aangemaakt",
                details: `Levering ${payload.reference} aangemaakt`
              }]
            };
            
            insertDelivery(newDelivery);
            logEntry.action = "Created Delivery";
            logEntry.details = `Added ${payload.type} delivery: ${payload.reference}`;
            logEntry.reference = payload.reference;
            io.emit("DELIVERY_UPDATED");
            break;
          }
          case "UPDATE_DELIVERY": {
            const allDels = getAllDeliveries();
            const existing = allDels.find(d => d.id === payload.id);
            let newPayload = { ...payload };
            
            if (existing && existing.status !== newPayload.status) {
              const getStatusLabel = (p: any) => {
                if (p.status === 100) return 'Afgeleverd';
                if (p.type === 'container') {
                  if (p.status >= 75) return 'Onderweg naar Magazijn';
                  if (p.status >= 50) return 'Douane';
                  if (p.status >= 25) return 'In Transit';
                  return 'Besteld';
                } else {
                  if (p.status >= 50) return 'Onderweg naar Magazijn';
                  if (p.status >= 25) return 'Transport aangevraagd';
                  return 'Besteld';
                }
              };
              const oldLabel = getStatusLabel(existing);
              const newLabel = getStatusLabel(newPayload);
              logEntry.details = `Status gewijzigd van "${oldLabel}" naar "${newLabel}" voor ${newPayload.reference}`;
              logEntry.action = "Status Update";
            } else {
              logEntry.action = "Updated Delivery";
              logEntry.details = `Details bijgewerkt voor: ${newPayload.reference}`;
            }

            insertDelivery(newPayload);
            logEntry.reference = newPayload.reference;
            io.emit("DELIVERY_UPDATED");

            // Auto-YMS Creation Logic
            const isAtLastStep = (newPayload.type === 'container' && newPayload.status >= 75 && newPayload.status < 100) ||
                                 (newPayload.type === 'exworks' && newPayload.status >= 50 && newPayload.status < 100);

            if (isAtLastStep) {
              const ymsDeliveries = getYmsDeliveries();
              const existingYms = ymsDeliveries.find(yd => yd.reference === newPayload.reference);
              
              if (!existingYms) {
                const suppliers = getAddressBook().suppliers;
                const supplier = suppliers.find(s => s.id === newPayload.supplierId);
                
                const newYmsDelivery = {
                  id: Math.random().toString(36).substr(2, 9),
                  mainDeliveryId: newPayload.id,
                  reference: newPayload.reference,
                  licensePlate: newPayload.containerNumber || 'NR ONBEKEND',
                  supplier: supplier?.name || 'Onbekend',
                  temperature: newPayload.cargoType || 'Droog',
                  isReefer: newPayload.type === 'container' ? 1 : 0,
                  scheduledTime: newPayload.etaWarehouse || newPayload.eta || new Date().toISOString(),
                  status: 'PLANNED',
                  transporterId: newPayload.transporterId,
                  statusTimestamps: { 'PLANNED': timestamp }
                };
                saveYmsDelivery(newYmsDelivery);
                io.emit("state_update", buildStaticState());
              }
            }
            break;
          }
          case "DELETE_DELIVERY":
            deleteDelivery(payload);
            logEntry.action = "Deleted Delivery";
            logEntry.details = `Removed delivery ID: ${payload}`;
            io.emit("DELIVERY_UPDATED");
            break;

          case "BULK_UPDATE_DELIVERIES":
            const allDelList = getAllDeliveries().filter(d => payload.ids.includes(d.id));
            for (const d of allDelList) {
              const updated = { ...d, ...payload.updates, updatedAt: timestamp };
              insertDelivery(updated);
            }
            logEntry.action = "Bulk Updated Deliveries";
            logEntry.details = `Updated ${payload.ids.length} deliveries`;
            io.emit("DELIVERY_UPDATED");
            break;

          case "YMS_SAVE_DELIVERY": {
            const current = payload;
            const ymsDeliveries = getYmsDeliveries();
            const existing = ymsDeliveries.find(d => d.id === current.id);
            
            if (existing && current.status && existing.status !== current.status) {
              if (isValidTransition(existing.status, current.status)) {
                current.statusTimestamps = {
                  ...(existing.statusTimestamps || {}),
                  [current.status]: timestamp
                };
                if (current.status === 'GATE_IN') {
                  current.registrationTime = timestamp;
                  current.arrivalTime = timestamp;
                }
              }
            }
            saveYmsDelivery(current);
            io.emit("state_update", buildStaticState());
            break;
          }

          default:
            // Generic save actions that don't need complex logic
            if (type.startsWith("YMS_SAVE_")) {
              const table = type.replace("YMS_SAVE_", "").toLowerCase();
              switch (table) {
                case "dock": saveYmsDock(payload); break;
                case "waitingarea": saveYmsWaitingArea(payload); break;
                case "warehouse": saveYmsWarehouse(payload); break;
                case "dockoverride": saveYmsDockOverride(payload); break;
                case "alert": saveYmsAlert(payload); break;
              }
              io.emit("state_update", buildStaticState());
              logEntry.action = `Saved YMS ${table}`;
            } else if (type.startsWith("YMS_DELETE_")) {
              const table = type.replace("YMS_DELETE_", "").toLowerCase();
              switch (table) {
                case "delivery": deleteYmsDelivery(payload); break;
                case "warehouse": deleteYmsWarehouse(payload); break;
                case "dockoverride": deleteYmsDockOverride(payload); break;
                case "alert": deleteYmsAlert(payload); break;
              }
              io.emit("state_update", buildStaticState());
              logEntry.action = `Deleted YMS ${table}`;
            } else if (type === "YMS_RESOLVE_ALERT") {
              resolveYmsAlert(payload);
              io.emit("state_update", buildStaticState());
            }
        }

        if (logEntry.action) {
          addLog(logEntry);
        }
      } catch (error) {
        console.error("Action error:", error);
      }
    });

    socket.on("disconnect", () => {});
  });
};
