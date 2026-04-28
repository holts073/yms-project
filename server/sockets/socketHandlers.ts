import { Server, Socket } from "socket.io";
import { 
  insertDelivery, getAllDeliveries, deleteDelivery, saveUser, getUsers, 
  saveAddressBookEntry, deleteAddressEntry, getAddressBook, saveYmsDock, saveYmsWaitingArea, 
  getYmsDeliveries, saveYmsDelivery, deleteYmsDelivery, deleteYmsDock, deleteYmsWaitingArea, saveYmsWarehouse, getYmsWarehouses, 
  deleteYmsWarehouse, saveYmsDockOverride, deleteYmsDockOverride, 
  saveYmsAlert, deleteYmsAlert, resolveYmsAlert, saveLog, getYmsDocks, getYmsAlerts, savePalletTransaction, addAuditEntry,
  getYmsSlots, saveYmsSlot, deleteYmsSlotByDelivery, initializeWarehouseInfrastructure
} from '../../src/db/queries';
import { saveSetting, getSetting } from '../../src/db/sqlite';
import { isValidTransition } from '../../src/lib/ymsRules';
import { buildStaticState } from '../routes/deliveries';
import { YmsDeliveryStatus, YmsDelivery, YmsTemperature, AppCapability } from '../../src/types';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_for_dev_only';

export interface YmsAssignmentModalProps {
  onAssignDock: (dockId: number, scheduledTime: string) => void;
  onAssignWaitingArea: (waId: number) => void;
}

const broadcastState = (io: any) => {
  io.sockets.sockets.forEach((s: any) => {
    s.emit("state_update", buildStaticState(io, s.data.selectedWarehouseId));
  });
};

const broadcastDelta = (io: any, type: string, payload: any, warehouseId?: string) => {
  if (warehouseId) {
    io.sockets.sockets.forEach((s: any) => {
      if (s.data.selectedWarehouseId === warehouseId) {
        s.emit("state_patch", { type, payload });
      }
    });
  } else {
    io.emit("state_patch", { type, payload });
  }
};

export const setupSocketHandlers = (io: Server) => {
  // Middleware to verify JWT on connection
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.data.user = decoded;
      next();
    } catch (err) {
      next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket: Socket) => {
    console.log(`[YMS SOCKET] Nieuwe verbinding: ${socket.id} van ${socket.handshake.address} (Transport: ${socket.conn.transport.name})`);
    
    socket.conn.on("upgrade", () => {
      console.log(`[YMS SOCKET] Transport upgrade naar ${socket.conn.transport.name} voor ${socket.id}`);
    });

    const syncDockStatus = (deliveryId: string, dockId: number | null, status: string, warehouseId: string) => {
      const docks = getYmsDocks(warehouseId);
      let changed = false;
      
      // If moving to a dock-active status
      if (dockId && ['DOCKED', 'UNLOADING', 'LOADING'].includes(status)) {
        const dock = docks.find(d => d.id === dockId);
        if (dock && (dock.status !== 'Occupied' || dock.currentDeliveryId !== deliveryId)) {
          saveYmsDock({ ...dock, status: 'Occupied', currentDeliveryId: deliveryId });
          changed = true;
        }
      } 
      // If moving to a non-dock status or unassigning
      else {
        // Find if this delivery was occupying ANY dock in ANY warehouse and free it
        // This is safer than just searching in the provided warehouseId
        const allDocks = getYmsDocks(); 
        const dockTrapped = allDocks.find(d => d.currentDeliveryId === deliveryId);
        if (dockTrapped) {
          saveYmsDock({ ...dockTrapped, status: 'Available', currentDeliveryId: null });
          changed = true;
          console.log(`[YMS SOCKET] Freed trapped dock ${dockTrapped.id} in warehouse ${dockTrapped.warehouseId} for delivery ${deliveryId}`);
        }
      }

      if (changed) {
        console.log(`[YMS SOCKET] Dock status changed for warehouse ${warehouseId}. Broadcasting...`);
        broadcastState(io);
      }
    };

    socket.emit("init", buildStaticState(io, socket.data.selectedWarehouseId, socket.data.user));

    socket.on("action", (data) => {
      const { type, payload } = data;
      const user = socket.data.user; // Securely get user from socket data
      if (!user) {
        socket.emit("error", { message: "Internal Auth Error: User not found in socket session" });
        return;
      }
      const timestamp = new Date().toISOString();

      const hasPermission = (required: AppCapability) => {
        if (user.role === 'admin') return true;
        
        // 1. Check individual user overrides
        if (user.permissions && user.permissions[required] === true) return true;
        if (user.permissions && user.permissions[required] === false) return false;

        // 2. Check role-based templates from settings
        const settings = getSetting('settings');
        const roleTemplates: Record<string, AppCapability[]> = settings?.role_permissions || {
          'manager': ['LOGISTICS_DELIVERY_CRUD', 'YMS_STATUS_UPDATE', 'YMS_DOCK_MANAGE', 'FINANCE_LEDGER_VIEW', 'ADDR_BOOK_CRUD'],
          'staff': ['LOGISTICS_DELIVERY_CRUD', 'YMS_STATUS_UPDATE'],
          'lead_operator': ['YMS_STATUS_UPDATE', 'YMS_PRIORITY_OVERRIDE'],
          'operator': ['YMS_STATUS_UPDATE'],
          'gate_guard': ['YMS_STATUS_UPDATE', 'YMS_PRIORITY_OVERRIDE'],
          'finance_auditor': ['FINANCE_LEDGER_VIEW', 'FINANCE_SETTLE_TRANSACTION'],
          'viewer': []
        };

        const capabilities = roleTemplates[user.role] || [];
        return capabilities.includes(required);
      };

      const isAdmin = user.role === 'admin';

      const processPalletTransaction = (delivery: any, prevStatus: number) => {
        if (delivery.status === 100 && prevStatus !== 100 && delivery.isPalletExchangeConfirmed) {
          const settings = getSetting('feature_flags', { enableFinance: true });
          if (settings.enableFinance) {
            const entityId = delivery.supplierId || delivery.transporterId || delivery.customerId;
            if (entityId) {
              const isOutbound = delivery?.type === 'exworks' || delivery?.direction === 'OUTBOUND';
              const sign = isOutbound ? -1 : 1;
              const actualCount = delivery.palletsExchanged ?? delivery.palletCount ?? 0;
              
              if (actualCount !== 0) {
                savePalletTransaction({
                  entityId,
                  entityType: delivery.supplierId ? 'supplier' : (delivery.transporterId ? 'transporter' : 'customer'),
                  deliveryId: delivery.id,
                  balanceChange: actualCount * sign,
                  palletType: delivery.palletType,
                  palletRate: delivery.palletRate
                });
                return ` | Palletruil bevestigd: ${actualCount * sign} pallets (${delivery.palletType || 'EUR'} @ €${delivery.palletRate || 0}).`;
              }
            }
          }
        }
        return "";
      };

      const logEntry: any = {
        id: "",
        timestamp,
        user: user.name,
        action: "",
        details: "",
        reference: ""
      };

      try {
        switch (type) {
          case "ADD_DELIVERY": {
            if (!hasPermission('LOGISTICS_DELIVERY_CRUD')) throw new Error("Onvoldoende rechten");
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
            addAuditEntry(newDelivery.id, user.name, "Aangemaakt", `Levering ${payload.reference} aangemaakt via system dashboard`);
            
            logEntry.action = "Created Delivery";
            logEntry.details = `Added ${payload.type} delivery: ${payload.reference}`;
            logEntry.reference = payload.reference;
            logEntry.warehouseId = newDelivery.warehouseId || socket.data.selectedWarehouseId;
            
            broadcastState(io); 
            io.emit('notification', { 
              message: `Nieuwe vracht aangemaakt: ${payload.reference}`, 
              type: 'info',
              timestamp
            });
            break;
          }
          case "UPDATE_DELIVERY": {
            if (!hasPermission('LOGISTICS_DELIVERY_CRUD')) throw new Error("Onvoldoende rechten");
            const { deliveries: allDels } = getAllDeliveries();
            const existing = allDels.find(d => d.id === payload.id);
            
            let newPayload = { ...existing, ...payload, updatedAt: timestamp };

            // AUTO-MILESTONE LOGIC: Check if received documents trigger a status jump
            if (newPayload.status < 100) {
              const settings = getSetting('shipment_settings');
              if (settings && settings[newPayload.type]) {
                const docRules = settings[newPayload.type];
                const triggerDocs = docRules.filter((r: any) => r.triggers_status_jump);
                
                let highestJump = 0;
                newPayload.documents?.forEach((doc: any) => {
                   const rule = triggerDocs.find((r: any) => r.name.toLowerCase() === doc.name.toLowerCase() || doc.name.toLowerCase().includes(r.name.toLowerCase()));
                   if (rule && doc.status === 'received') {
                      highestJump = Math.max(highestJump, rule.triggers_status_value || 0);
                   }
                });

                if (highestJump > newPayload.status) {
                  newPayload.status = highestJump; // Use highestJump here
                  if (!logEntry.details) logEntry.details = "";
                  logEntry.details += ` | Auto-milestone jump to ${highestJump} based on received documents.`; // Use highestJump here
                  io.emit('notification', { 
                    message: `Status sprong voor ${newPayload.reference}: Milestone bereikt via documenten.`, 
                    type: 'success',
                    timestamp
                  });
                }
              }
            }
            
            if (!existing && (!payload.type || !payload.reference)) {
               throw new Error(`Validatiefout: Kan levering ${payload.id} niet bijwerken. Record bestaat niet en payload is incompleet (mis type/reference).`);
            }
            
            // MRN Clearance Validation & Toast Notification
            if (newPayload.type === 'container' && newPayload.customsStatus === 'Cleared') {
               const settings = getSetting('settings', {});
               if (settings.requireMrnForClearance && !newPayload.customsDeclarationNumber) {
                 throw new Error("MRN nummer (Douane) is verplicht voordat de status naar 'Cleared' mag.");
               }
               
               if (settings.notification_triggers?.customsClearance && existing?.customsStatus !== 'Cleared') {
                  io.emit('notification', { 
                    message: `Douane Inklaring voltooid voor ${newPayload.reference}`, 
                    type: 'success',
                    timestamp
                  });
               }
               
               if (existing?.customsStatus !== 'Cleared') {
                 newPayload.customsClearedDate = new Date().toISOString();
               }
            }

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

            // Pallet Exchange Logic (v3.8.1: Requirement for explicit confirmation)
            const palletLog = processPalletTransaction(newPayload, existing?.status ?? 0);
            if (palletLog) {
              logEntry.details += palletLog;
            }

            insertDelivery(newPayload);
            addAuditEntry(newPayload.id, user.name, logEntry.action || "Bijgewerkt", logEntry.details || `Details bijgewerkt voor ${newPayload.reference}`);
            
            logEntry.reference = newPayload.reference;
            broadcastState(io);

            // Auto-YMS Creation Logic
            const isAtLastStep = (newPayload.type === 'container' && newPayload.status >= 75 && newPayload.status < 100) ||
                                 (newPayload.type === 'exworks' && newPayload.status >= 50 && newPayload.status < 100);

            if (isAtLastStep) {
              const ymsDeliveries = getYmsDeliveries();
              const existingYms = ymsDeliveries.find(yd => yd.mainDeliveryId === newPayload.id || yd.reference === newPayload.reference);
              
              if (!existingYms) {
                const suppliers = getAddressBook().suppliers;
                const supplier = suppliers.find(s => s.id === newPayload.supplierId);
                
                const warehouseId = newPayload.warehouseId || socket.data.selectedWarehouseId || 'W01';
                let scheduledTime = newPayload.etaWarehouse || newPayload.eta || new Date().toISOString();
                
                // Ensure full ISO string with time for timeline rendering
                if (scheduledTime.length === 10) { // If only YYYY-MM-DD
                  scheduledTime += 'T09:00:00.000Z';
                }
                
                const tempMap: Record<string, string> = {
                  'Dry': 'Droog',
                  'Cool': 'Koel',
                  'Frozen': 'Vries'
                };
                
                const newYmsDelivery = {
                  id: Math.random().toString(36).substr(2, 9),
                  mainDeliveryId: newPayload.id,
                  warehouseId,
                  reference: newPayload.reference,
                  licensePlate: newPayload.containerNumber || 'NR ONBEKEND',
                  supplier: supplier?.name || 'Onbekend',
                  temperature: (tempMap[newPayload.cargoType] || 'Droog') as YmsTemperature,
                  isReefer: newPayload.type === 'container',
                  scheduledTime,
                  status: 'EXPECTED',
                  transporterId: newPayload.transporterId || null,
                  direction: newPayload.type === 'exworks' ? 'OUTBOUND' : 'INBOUND',
                  palletCount: newPayload.palletCount || 0,
                  palletType: newPayload.palletType || 'EUR',
                  palletRate: newPayload.palletRate || 0,
                  incoterm: newPayload.incoterm || 'EXW',
                  demurrageDailyRate: newPayload.demurrageDailyRate || 0,
                  standingTimeCost: newPayload.standingTimeCost || 0,
                  thcCost: newPayload.thcCost || 0,
                  customsCost: newPayload.customsCost || 0,
                  statusTimestamps: { 'EXPECTED': timestamp }
                };
                saveYmsDelivery(newYmsDelivery as YmsDelivery);
                broadcastState(io);
              }
            }
            break;
          }
          case "YMS_SAVE_DELIVERY": {
            if (!hasPermission('YMS_STATUS_UPDATE')) throw new Error("Onvoldoende rechten");
            const current = payload;
            const ymsDeliveries = getYmsDeliveries();
            const existing = ymsDeliveries.find(d => d.id === current.id);
            
            if (existing && current.status && existing.status !== current.status) {
              if (isValidTransition(existing.status, current.status)) {
                // Priority Lock (v3.13.1): Use hasPermission for override
                if (current.priority !== undefined && current.priority !== existing.priority) {
                  if (!hasPermission('YMS_PRIORITY_OVERRIDE')) {
                    throw new Error("Alleen gebruikers met de 'YMS_PRIORITY_OVERRIDE' capability kunnen de prioriteit handmatig wijzigen");
                  }
                }

                current.statusTimestamps = {
                  ...(existing.statusTimestamps || {}),
                  [current.status]: timestamp
                };
                if (current.status === 'GATE_IN') {
                  current.registrationTime = timestamp;
                  current.arrivalTime = timestamp;
                }

                // Auto-resolve alerts when moving out of waiting/yard
                if (current.status === 'DOCKED' || current.status === 'GATE_OUT') {
                  const alerts = getYmsAlerts(current.warehouseId);
                  const activeAlerts = alerts.filter(a => a.deliveryId === current.id && !a.resolved);
                  activeAlerts.forEach(a => resolveYmsAlert(a.id));
                }

                // Sync with Main Delivery (v3.10.x Fix)
                if (current.mainDeliveryId && (current.status === 'COMPLETED' || current.status === 'GATE_OUT')) {
                  const { deliveries: allDels } = getAllDeliveries();
                  const mainDel = allDels.find(d => d.id === current.mainDeliveryId);
                  if (mainDel) {
                    const updatedMain = { 
                      ...mainDel, 
                      status: 100, 
                      updatedAt: timestamp,
                      palletsExchanged: current.palletsExchanged,
                      isPalletExchangeConfirmed: current.isPalletExchangeConfirmed,
                      palletType: current.palletType,
                      palletRate: current.palletRate
                    };
                    insertDelivery(updatedMain);
                    const palletLog = processPalletTransaction(updatedMain, mainDel.status);
                    addAuditEntry(mainDel.id, user.name, "Systeem Voltooid", `Levering automatisch gearchiveerd via YMS status: ${current.status}${palletLog}`);
                    broadcastDelta(io, 'DELIVERY_UPDATED', updatedMain);
                  }
                }
              }
            }
            saveYmsDelivery(current);
            syncDockStatus(current.id, current.dockId || null, current.status, current.warehouseId);
            if (current.mainDeliveryId) {
              addAuditEntry(current.mainDeliveryId, user.name, "YMS Status Update", `YMS Status gewijzigd naar ${current.status}`);
            }

            logEntry.action = "YMS Status Update";
            logEntry.details = `Status voor ${current.reference} gewijzigd naar ${current.status}`;
            logEntry.reference = current.reference;
            
            broadcastState(io); // Need full state for slots and synchronized lists
            break;
          }
          
          case "YMS_ASSIGN_DOCK": {
            if (!hasPermission('YMS_DOCK_MANAGE')) throw new Error("Onvoldoende rechten");
            const { deliveryId, dockId, scheduledTime } = payload;
            
            console.log(`[YMS_ASSIGN_DOCK] Assigning delivery ${deliveryId} to dock ${dockId} at ${scheduledTime}`);
            
            const ymsDeliveries = getYmsDeliveries();
            const delivery = ymsDeliveries.find(d => d.id === deliveryId);
            if (!delivery) throw new Error("Levering niet gevonden");
            
            // If the warehouse has NO gate, or we are assigning to a dock for "now", 
            // the intention is often to move straight to DOCKED.
            const currentStatus = delivery.status;
            let newStatus = currentStatus;
            let regTime = delivery.registrationTime;
            
            if (currentStatus === 'EXPECTED' || currentStatus === 'PLANNED' || currentStatus === 'GATE_IN' || currentStatus === 'IN_YARD') {
              newStatus = 'DOCKED';
              if (!regTime) regTime = timestamp; // Register arrival if not already done
            }

            let finalScheduledTime = scheduledTime || delivery.scheduledTime;
            
            // Ensure full ISO string for timeline rendering
            if (finalScheduledTime && finalScheduledTime.length === 10) {
              finalScheduledTime += 'T10:00:00.000Z';
            }

            // v3.9.0 Smart Slot Calculation
            const warehouseId = delivery.warehouseId || 'W01';
            const warehouses = getYmsWarehouses();
            const warehouse = warehouses.find(w => w.id === warehouseId);
            
            const baseTime = warehouse?.baseUnloadingTime || 15;
            const minPerPallet = warehouse?.minutesPerPallet || 2;
            const palletCount = delivery.palletCount || 0;
            
            // Formula: Base + (Pallets * Min/Pallet)
            let duration = baseTime + (palletCount * minPerPallet);
            
            // Round to nearest 15 or 30 for cleaner grid visualization if desired, 
            // but let's keep it exact for now and let the grid handle it.
            duration = Math.max(30, duration); // Minimum 30 min slot
            
            const startTime = new Date(finalScheduledTime);
            const endTime = new Date(startTime.getTime() + duration * 60000);
            
            // Fast Lane Validation
            const dock = getYmsDocks(warehouseId).find(d => d.id === dockId);
            if (dock?.isFastLane && warehouse?.fastLaneThreshold) {
              if (palletCount > warehouse.fastLaneThreshold && !isAdmin) {
                throw new Error(`Conflict: Dock ${dockId} is een Fast Lane (Max ${warehouse.fastLaneThreshold} pallets). Deze levering heeft ${palletCount} pallets.`);
              }
            }

            const existingSlots = getYmsSlots(warehouseId);
            const conflict = existingSlots.find(s => {
              if (s.dockId !== dockId) return false;
              if (s.deliveryId === deliveryId) return false; // Ignore own slot if moving
              
              const sStart = new Date(s.startTime);
              const sEnd = new Date(s.endTime);
              
              // Overlap check: (start1 < end2) && (end1 > start2)
              return (startTime < sEnd) && (endTime > sStart);
            });

            if (conflict && !isAdmin) {
              throw new Error(`Conflict: Dock ${dockId} is al bezet tussen ${new Date(conflict.startTime).toLocaleTimeString()} en ${new Date(conflict.endTime).toLocaleTimeString()} door ${conflict.deliveryId}.`);
            }

            const updated = {
              ...delivery,
              dockId,
              status: newStatus as YmsDeliveryStatus,
              registrationTime: regTime,
              scheduledTime: finalScheduledTime,
              estimatedDuration: duration,
              statusTimestamps: {
                ...(delivery.statusTimestamps || {}),
                [newStatus]: timestamp,
                ...(!delivery.registrationTime ? { GATE_IN: timestamp } : {}) 
              }
            };

            console.log(`[YMS_ASSIGN_DOCK] Saving updated delivery:`, { id: updated.id, dockId: updated.dockId, status: updated.status, duration: updated.estimatedDuration });
            saveYmsDelivery(updated);
            
            // Sync yms_slots table
            deleteYmsSlotByDelivery(deliveryId);
            saveYmsSlot({
               id: Math.random().toString(36).substr(2, 9),
               warehouseId,
               dockId,
               deliveryId,
               startTime: startTime.toISOString(),
               endTime: endTime.toISOString()
            });

            syncDockStatus(updated.id, updated.dockId, updated.status, updated.warehouseId);
            if (updated.mainDeliveryId) {
              addAuditEntry(updated.mainDeliveryId, user.name, "Dock Toegewezen", `Levering ${delivery.reference} toegewezen aan Dock ${dockId} (Slot: ${startTime.toLocaleTimeString()} - ${endTime.toLocaleTimeString()}, Duur: ${duration}m)`);
            }

            logEntry.action = "Dock Toegewezen";
            logEntry.details = `Levering ${delivery.reference} toegewezen aan Dock ${dockId} (Slot: ${startTime.toLocaleTimeString()} - ${endTime.toLocaleTimeString()})`;
            logEntry.reference = delivery.reference;
            
            broadcastState(io); // Need full state for slots
            break;
          }

          case "YMS_REGISTER_ARRIVAL": {
            if (!hasPermission('YMS_STATUS_UPDATE')) throw new Error("Onvoldoende rechten");
            const ymsDeliveries = getYmsDeliveries();
            const delivery = ymsDeliveries.find(d => d.id === payload);
            if (!delivery) throw new Error("Levering niet gevonden");
            
            const warehouses = getYmsWarehouses();
            const warehouse = warehouses.find(w => w.id === delivery.warehouseId);
            const hasGate = warehouse ? warehouse.hasGate !== false : true;
            
            // Task 10: If no gate, skip GATE_IN and go to DOCKED (if planned) or IN_YARD
            const newStatus: YmsDeliveryStatus = hasGate ? 'GATE_IN' : (delivery.dockId ? 'DOCKED' : 'IN_YARD');
            const statusKey = hasGate ? 'GATE_IN' : (delivery.dockId ? 'DOCKED' : 'IN_YARD');

            const updated = {
              ...delivery,
              status: newStatus,
              registrationTime: timestamp,
              arrivalTime: timestamp,
              statusTimestamps: {
                ...(delivery.statusTimestamps || {}),
                [statusKey]: timestamp
              }
            };
            saveYmsDelivery(updated);
            syncDockStatus(updated.id, updated.dockId || null, updated.status, updated.warehouseId);
            
            const settings = getSetting('settings', {});
            if (settings.notification_triggers?.gateIn && hasGate) {
               io.emit('notification', { 
                 message: `Gate-In voltooid voor vracht ${delivery.reference}`, 
                 type: 'info',
                 timestamp
               });
            }

            logEntry.action = "Aankomst Geregistreerd";
            logEntry.details = hasGate 
              ? `Levering ${delivery.reference} is aangemeld bij de gate.`
              : `Levering ${delivery.reference} is direct aangemeld (Geen Gate). Status: ${newStatus}`;
            broadcastState(io);
            io.emit('notification', { 
              message: hasGate ? `Chauffeur aangemeld bij de gate: ${delivery.reference}` : `Direct door naar dock/yard: ${delivery.reference}`, 
              type: 'success',
              timestamp
            });
            break;
          }
          case "SELECT_WAREHOUSE": {
            socket.data.selectedWarehouseId = payload;
            // Only emit back to the requesting socket to confirm selection, 
            // or broadcast if selection should be global (usually not).
            // Here we emit back to keep the client in sync.
            socket.emit("state_update", buildStaticState(io, payload, user));
            break;
          }
          case "DELETE_DELIVERY":
            if (!isAdmin) throw new Error("Alleen admins kunnen leveringen verwijderen");
            
            // Check if there is a linked YMS delivery that needs a dock sync before deletion
            const ymsDeliveries = getYmsDeliveries();
            const linkedYms = ymsDeliveries.find(d => d.mainDeliveryId === payload);
            if (linkedYms) {
              syncDockStatus(linkedYms.id, null, 'DELETED', linkedYms.warehouseId);
              deleteYmsSlotByDelivery(linkedYms.id);
            }
            
            deleteDelivery(payload);
            logEntry.action = "Deleted Delivery";
            logEntry.details = `Removed delivery ID: ${payload}`;
            broadcastDelta(io, 'DELIVERY_DELETED', payload);
            break;

          case "ADD_ADDRESS":
          case "UPDATE_ADDRESS":
            if (!hasPermission('ADDR_BOOK_CRUD')) throw new Error("Onvoldoende rechten");
            saveAddressBookEntry(payload.entry);
            logEntry.action = type === "ADD_ADDRESS" ? "Toegevoegd Adres" : "Gewijzigd Adres";
            logEntry.details = `Adres ${payload.entry.name} succesvol ${type === "ADD_ADDRESS" ? "toegevoegd" : "gewijzigd"} in ${payload.category}.`;
            broadcastDelta(io, 'ADDRESS_UPDATED', payload.entry);
            break;

          case "DELETE_ADDRESS":
            if (!isAdmin) throw new Error("Alleen admins kunnen adressen verwijderen");
            // Check for dependent deliveries
            const { deliveries: allDelsForAddr } = getAllDeliveries();
            const hasDependents = allDelsForAddr.some(d => d.supplierId === payload.id || d.transporterId === payload.id || d.forwarderId === payload.id);
            if (hasDependents) {
              throw new Error("Kan adres niet verwijderen: er zijn nog actieve of gearchiveerde leveringen gekoppeld aan dit adres. Wis eerst de leveringen.");
            }
            deleteAddressEntry(payload.id);
            logEntry.action = "Verwijderd Adres";
            logEntry.details = `Adres verwijderd uit ${payload.category}.`;
            broadcastState(io);
            break;

          case "BULK_UPDATE_DELIVERIES":
            if (!isAdmin) throw new Error("Alleen admins kunnen bulk updates uitvoeren");
            const { deliveries: allDelListRaw } = getAllDeliveries();
            const allDelList = allDelListRaw.filter(d => payload.ids.includes(d.id));
            for (const d of allDelList) {
              const updated = { ...d, ...payload.updates, updatedAt: timestamp };
              insertDelivery(updated);
            }
            logEntry.action = "Bulk Updated Deliveries";
            logEntry.details = `Updated ${payload.ids.length} deliveries`;
            broadcastState(io);
            break;


          case "YMS_INITIALIZE_INFRASTRUCTURE": {
            if (!isAdmin) throw new Error("Alleen admins kunnen infrastructuur herstellen");
            initializeWarehouseInfrastructure(payload);
            broadcastState(io);
            logEntry.action = "Infrastructuur Hersteld";
            logEntry.details = `Standaard docks/wachtruimtes aangemaakt voor magazijn ${payload}`;
            break;
          }
          case "GET_LAST_INCOTERM": {
            const { supplierId } = payload;
            const { deliveries } = getAllDeliveries(1, 10, '', 'all', 'createdAt', false);
            const last = deliveries
              .filter(d => d.supplierId === supplierId && d.incoterm)
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
            
            socket.emit("last_incoterm_result", { 
              supplierId, 
              incoterm: last?.incoterm || 'EXW' 
            });
            break;
          }
          case "SAVE_SETTING":
            if (!isAdmin) throw new Error("Alleen admins kunnen instellingen wijzigen");
            saveSetting(payload.key, payload.value);
            logEntry.action = "Systeeminstelling Opgeslagen";
            logEntry.details = `Instelling ${payload.key} bijgewerkt`;
            broadcastState(io);
            break;

          case "UPDATE_COMPANY_SETTINGS":
            if (!isAdmin) throw new Error("Alleen admins kunnen instellingen wijzigen");
            saveSetting('companySettings', payload);
            logEntry.action = "Systeeminstelling Opgeslagen";
            logEntry.details = `Bedrijfsgegevens bijgewerkt`;
            broadcastState(io);
            break;

          case "UPGRADE_REQUEST":
            logEntry.action = "Upgrade Aangevraagd";
            logEntry.details = `Gebruiker heeft interesse getoond in upgrade voor feature: ${payload?.feature || 'Onbekend'}`;
            // Voorlopig alleen loggen, geen verdere actie vereist
            break;

          case "TELEX_RELEASE_UPDATE": {
            const userRole = socket.data.userRole;
            const userName = socket.data.userName;
            
            if (userRole !== 'admin' && userRole !== 'manager')
              throw new Error("Onvoldoende rechten voor Telex Release update");

            const { deliveryId, status, reference, releasedBy } = payload;
            const { deliveries: allDels } = getAllDeliveries();
            const delivery = allDels.find(d => d.id === deliveryId);
            if (!delivery) throw new Error("Levering niet gevonden");

            const updated = {
              ...delivery,
              telexReleaseStatus: status,
              telexReleaseDate: status === 'Vrijgegeven' ? new Date().toISOString() : delivery.telexReleaseDate,
              telexReleaseReference: reference || delivery.telexReleaseReference,
              telexReleasedBy: status === 'Vrijgegeven' ? (releasedBy || userName) : delivery.telexReleasedBy,
              updatedAt: new Date().toISOString()
            };

            // Milestone sprong: Telex 'Vrijgegeven' = zelfde effect als B/L ontvangen
            if (status === 'Vrijgegeven') {
              const settings = getSetting('settings', {});
              const shipmentSettings = settings.shipment_settings || {};
              const containerSettings = shipmentSettings.container || [];
              
              // Zoek de regel die B/L of SWB afhandelt
              const triggerValue = containerSettings.find(
                (r: any) => r.name.toLowerCase().includes('seaway') || r.name.toLowerCase().includes('b/l')
              )?.triggers_status_value;

              if (triggerValue && triggerValue > (updated.status || 0)) {
                updated.status = triggerValue;
              }
            }

            insertDelivery(updated);
            
            const notificationSettings = getSetting('settings', {});
            if (notificationSettings.notification_triggers?.telexRelease && status === 'Vrijgegeven' && delivery.telexReleaseStatus !== 'Vrijgegeven') {
                io.emit('notification', { 
                  message: `Telex Vrijgave verleend voor B/L ${updated.billOfLading || updated.reference}`, 
                  type: 'success',
                  timestamp: new Date().toISOString()
                });
            }
            
            addAuditEntry(deliveryId, userName || 'Systeem', `Telex Release: ${status}`,
              `Telex status bijgewerkt naar "${status}" (ref: ${reference || 'geen'})`);
            broadcastState(io);
            break;
          }

          case "YMS_RESOLVE_ALERT":
            resolveYmsAlert(payload);
            broadcastState(io);
            break;

          default:
            // Generic save actions that don't need complex logic
            if (type.startsWith("YMS_SAVE_")) {
              if (!isAdmin) throw new Error("Alleen admins kunnen configuraties wijzigen");
              const table = type.replace("YMS_SAVE_", "").toLowerCase();
              switch (table) {
                case "dock": saveYmsDock(payload); logEntry.details = `Dock ${payload.name} opgeslagen`; break;
                case "waitingarea": saveYmsWaitingArea(payload); logEntry.details = `Wachtruimte ${payload.name} opgeslagen`; break;
                case "warehouse": saveYmsWarehouse(payload); logEntry.details = `Magazijn ${payload.name} opgeslagen`; break;
                case "dockoverride": saveYmsDockOverride(payload); logEntry.details = `Dock override opgeslagen`; break;
                case "alert": saveYmsAlert(payload); logEntry.details = `Systeemwaarschuwing opgeslagen`; break;
                case "delivery": 
                  saveYmsDelivery(payload); 
                  syncDockStatus(payload.id, payload.dockId || null, payload.status, payload.warehouseId);
                  logEntry.details = `YMS Levering ${payload.reference} opgeslagen`; 
                  break;
              }
              broadcastState(io);
              logEntry.action = `Systeemconfiguratie: ${table} opgeslagen`;
            } else if (type.startsWith("YMS_DELETE_")) {
              if (!isAdmin) throw new Error("Alleen admins kunnen gegevens verwijderen");
              const table = type.replace("YMS_DELETE_", "").toLowerCase();
              switch (table) {
                case "delivery": 
                  const ymsToDelete = getYmsDeliveries().find(d => d.id === payload);
                  if (ymsToDelete) {
                    syncDockStatus(ymsToDelete.id, null, 'DELETED', ymsToDelete.warehouseId);
                    deleteYmsSlotByDelivery(ymsToDelete.id);
                  }
                  deleteYmsDelivery(payload); 
                  logEntry.details = `YMS Levering ${payload} verwijderd`; 
                  break;
                case "dock": deleteYmsDock(payload.id, payload.warehouseId); logEntry.details = `Dock ${payload.id} verwijderd`; break;
                case "waitingarea": deleteYmsWaitingArea(payload.id, payload.warehouseId); logEntry.details = `Wachtplaats ${payload.id} verwijderd`; break;
                case "warehouse": deleteYmsWarehouse(payload); logEntry.details = `Magazijn ${payload} verwijderd`; break;
                case "dockoverride": deleteYmsDockOverride(payload); logEntry.details = `Dock override ${payload} verwijderd`; break;
                case "alert": deleteYmsAlert(payload); logEntry.details = `Waarschuwing ${payload} verwijderd`; break;
              }
              broadcastState(io);
              logEntry.action = `Systeemconfiguratie: ${table} verwijderd`;
            } else {
              console.warn(`[YMS SOCKET] Onbekend actie type ontvangen: ${type}`);
            }
            break;
        }


        if (logEntry.action) {
          if (!logEntry.id) logEntry.id = Math.random().toString(36).substr(2, 9);
          saveLog(logEntry);
        }
      } catch (error: any) {
        console.error("Action error:", error);
        socket.emit("error_message", error.message || "Er is een fout opgetreden");
      }
    });

    socket.on("disconnect", () => {});
  });
};
