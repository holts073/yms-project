import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import { getState, saveState } from "./db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  const PORT = 3000;

  // Initial state with seed data if DB is empty
  let state = getState();

  if (!state) {
    const suppliers = [
      { id: '1', name: 'Unilever Food Solutions', contact: 'Jan de Vries', email: 'jan.devries@unilever.com', address: 'Rotterdam, NL', type: 'supplier', otif: 94, pickupAddress: 'Rotterdam Port' },
      { id: '2', name: 'Sligro Food Group', contact: 'Karel Visser', email: 'karel@sligro.nl', address: 'Veghel, NL', type: 'supplier', otif: 88, pickupAddress: 'Veghel Distribution Center' },
      { id: 's3', name: 'Dr. Oetker', contact: 'Hans Müller', email: 'hans.mueller@oetker.de', address: 'Bielefeld, DE', type: 'supplier', otif: 97, pickupAddress: 'Bielefeld Factory' },
      { id: 's4', name: 'Südzucker AG', contact: 'Klaus Schmidt', email: 'klaus@suedzucker.de', address: 'Mannheim, DE', type: 'supplier', otif: 91, pickupAddress: 'Mannheim Hub' },
      { id: 's5', name: 'Dodoni S.A.', contact: 'Nikos P.', email: 'nikos@dodoni.gr', address: 'Ioannina, GR', type: 'supplier', otif: 99, pickupAddress: 'Ioannina Cold Storage' }
    ];
    const transporters = [
      { id: '3', name: 'Swift Shipping', contact: 'Mike Ross', email: 'mike@swift.com', address: '789 Ocean Ave, Hamburg', type: 'transporter' },
      { id: 't4', name: 'Maersk Line', contact: 'Lars P.', email: 'lars@maersk.com', address: 'Esplanaden 50, Copenhagen', type: 'transporter' },
      { id: 't5', name: 'Kuehne + Nagel', contact: 'Sarah W.', email: 'sarah@kn.com', address: 'Kuehne-Nagel-Platz 1, Bremen', type: 'transporter' }
    ];

    // Seed 20 deliveries
    const seedDeliveries = [];
    const types = ['container', 'exworks'];
    const cargoTypes = ['Dry', 'Cool', 'Frozen'];
    
    for (let i = 1; i <= 20; i++) {
      const type = types[i % 2];
      const ref = `${type === 'container' ? 'CONT' : 'EXW'}-2026-${String(i).padStart(3, '0')}`;
      const status = [0, 25, 50, 75, 100][i % 5];
      const daysOffset = Math.floor(Math.random() * 20) - 5;
      const etaDate = new Date();
      if (i <= 3) {
        // First 3 deliveries expected today
      } else {
        etaDate.setDate(etaDate.getDate() + daysOffset);
      }
      const eta = etaDate.toISOString().split('T')[0];

      seedDeliveries.push({
        id: Math.random().toString(36).substr(2, 9),
        type,
        reference: ref,
        supplierId: suppliers[i % suppliers.length].id,
        transporterId: transporters[i % transporters.length].id,
        status,
        documents: [
          ...(type === 'container' ? [
            { id: 'd1', name: 'Seaway Bill', status: status >= 25 ? 'received' : 'missing', required: true },
            { id: 'd2', name: 'Notification of Arrival', status: status >= 50 ? 'received' : 'missing', required: true },
            { id: 'd3', name: 'Factuur', status: Math.random() > 0.5 ? 'received' : 'missing', required: false },
            { id: 'd4', name: 'Packing List', status: Math.random() > 0.5 ? 'received' : 'missing', required: false },
            { id: 'd5', name: 'Certificate of Origin', status: Math.random() > 0.5 ? 'received' : 'missing', required: false }
          ] : [
            { id: 'd1', name: 'Transport Order', status: status >= 50 ? 'received' : 'missing', required: true }
          ])
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        etaWarehouse: eta,
        originalEtaWarehouse: eta,
        eta: eta,
        notes: `Seed delivery ${i} for demo purposes.`,
        containerNumber: type === 'container' ? `MSKU${Math.floor(1000000 + Math.random() * 9000000)}` : undefined,
        palletCount: type === 'exworks' ? Math.floor(1 + Math.random() * 33) : undefined,
        cargoType: type === 'exworks' ? cargoTypes[i % 3] : undefined,
        statusHistory: [Math.max(0, status - 20), Math.max(0, status - 10)]
      });
    }

    state = {
      deliveries: seedDeliveries,
      addressBook: {
        suppliers,
        transporters
      },
      logs: [
        { id: 'l1', timestamp: new Date().toISOString(), user: 'System', action: 'Database Seeded', details: 'Added 20 sample deliveries for demo.' }
      ],
      users: [
        { id: 'admin', name: 'Admin User', role: 'admin', email: 'admin@example.com', passwordHash: bcrypt.hashSync('welkom123', 10) },
        { id: 'user1', name: 'Warehouse Staff', role: 'staff', email: 'staff@example.com', passwordHash: bcrypt.hashSync('welkom123', 10) },
        { id: 'elmer', name: 'Elmer Holtslag', role: 'admin', email: 'ElmerHoltslag@gmail.com', passwordHash: bcrypt.hashSync('welkom123', 10) }
      ],
      settings: {
        terms: {
          ordered: 'Ordered',
          transportRequested: 'Transport Requested',
          enRouteToWarehouse: 'En Route to Warehouse',
          delivered: 'Delivered'
        }
      }
    };
    saveState(state);
  }

  app.use(express.json());

  // API Routes
  app.get("/api/state", (req, res) => {
    res.json(state);
  });

  const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_for_dev_only';

  app.post("/api/login", (req, res) => {
    const { email, password } = req.body;
    const user = state.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user || (!user.passwordHash && password !== 'welkom123')) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isValid = user.passwordHash 
      ? bcrypt.compareSync(password, user.passwordHash)
      : password === 'welkom123'; // Fallback for old unhashed users in case any exist

    if (!isValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    
    // Copy user to omit passwordHash in response
    const { passwordHash, ...safeUser } = user;
    res.json({ token, user: safeUser });
  });

  // Socket.io logic
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);
    socket.emit("init", state);

    socket.on("action", (data) => {
      const { type, payload, user } = data;
      const timestamp = new Date().toISOString();

      let logEntry = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp,
        user: user.name,
        action: "",
        details: "",
        reference: payload?.reference || ""
      };

      const calculateRisk = (delivery: any) => {
        if (delivery.status === 100) return { risk: 'low', reason: 'Voltooid' };
        
        const now = new Date();
        const eta = delivery.etaWarehouse ? new Date(delivery.etaWarehouse) : (delivery.eta ? new Date(delivery.eta) : null);
        const missingRequired = delivery.documents.filter((d: any) => d.required && d.status === 'missing').length;
        
        if (missingRequired > 0) return { risk: 'high', reason: 'Kritieke documenten ontbreken' };
        
        if (eta) {
          const daysToEta = Math.ceil((eta.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          if (daysToEta < 3 && delivery.status < 80) return { risk: 'high', reason: 'Deadline nadert, actie vereist' };
          if (daysToEta < 7 && delivery.status < 50) return { risk: 'medium', reason: 'Voortgang loopt achter op schema' };
        }
        
        return { risk: 'low', reason: 'Op schema' };
      };

      switch (type) {
        case "ADD_DELIVERY": {
          const riskInfo = calculateRisk(payload);
          const newDelivery = { 
            ...payload, 
            delayRisk: riskInfo.risk, 
            predictionReason: riskInfo.reason,
            statusHistory: payload.statusHistory || [],
            auditTrail: [{
              timestamp,
              user: user.name,
              action: "Aangemaakt",
              details: `Levering ${payload.reference} aangemaakt`
            }]
          };
          state.deliveries.push(newDelivery);
          logEntry.action = "Created Delivery";
          logEntry.details = `Added ${payload.type} delivery: ${payload.reference}`;
          break;
        }
        case "UPDATE_DELIVERY": {
          const updatedRisk = calculateRisk(payload);
          const oldDelivery = state.deliveries.find(d => d.id === payload.id);
          let newPayload = { ...payload, delayRisk: updatedRisk.risk, predictionReason: updatedRisk.reason };
          
          // Keep originalEtaWarehouse if not present in payload
          if (oldDelivery && oldDelivery.originalEtaWarehouse && !newPayload.originalEtaWarehouse) {
            newPayload.originalEtaWarehouse = oldDelivery.originalEtaWarehouse;
          }

          // OTIF calculation logic when changing to Delivered (100)
          if (oldDelivery && oldDelivery.status < 100 && newPayload.status === 100) {
            if (newPayload.originalEtaWarehouse) {
              const originalEta = new Date(newPayload.originalEtaWarehouse);
              originalEta.setHours(0,0,0,0);
              const actualDeliveryDate = new Date(); // Delivery is marked today
              actualDeliveryDate.setHours(0,0,0,0);
              
              const isOntime = actualDeliveryDate <= originalEta;
              const supplierId = newPayload.supplierId;
              const supplier = state.addressBook.suppliers.find((s: any) => s.id === supplierId);
              
              if (supplier) {
                // Determine new OTIF simple mock based on old value +1 or -1
                // For a more robust solution we'd track all historical deliveries of the supplier.
                let newOtif = supplier.otif || 90;
                if (isOntime) {
                  newOtif = Math.min(100, newOtif + 1);
                } else {
                  newOtif = Math.max(0, newOtif - 2);
                }
                
                state.addressBook.suppliers = state.addressBook.suppliers.map((s: any) => 
                  s.id === supplierId ? { ...s, otif: Number(newOtif.toFixed(1)) } : s
                );
                
                logEntry.details = `Updated delivery: ${newPayload.reference}. Supplier ${supplier.name} OTIF recalulated to ${newOtif}%.`;
              }
            }
          }

          if (oldDelivery && oldDelivery.status !== newPayload.status) {
             const auditEntry = {
                timestamp,
                user: user.name,
                action: "Status Gewijzigd",
                details: `Status veranderd van ${oldDelivery.status}% naar ${newPayload.status}%`
             };
             newPayload.auditTrail = [...(newPayload.auditTrail || []), auditEntry];
          } else if (oldDelivery && JSON.stringify(oldDelivery.documents) !== JSON.stringify(newPayload.documents)) {
             const auditEntry = {
                timestamp,
                user: user.name,
                action: "Documenten Gewijzigd",
                details: `Documenten voor levering ${newPayload.reference} gewijzigd via overzicht.`
             };
             newPayload.auditTrail = [...(newPayload.auditTrail || []), auditEntry];
          } else if (oldDelivery) {
             const auditEntry = {
                timestamp,
                user: user.name,
                action: "Aangepast",
                details: `Levering specificaties van ${newPayload.reference} aangepast.`
             };
             newPayload.auditTrail = [...(newPayload.auditTrail || []), auditEntry];
          }

          state.deliveries = state.deliveries.map(d => d.id === newPayload.id ? newPayload : d);
          logEntry.action = "Updated Delivery";
          if (!logEntry.details) logEntry.details = `Updated delivery: ${newPayload.reference}`;
          break;
        }
        case "UPDATE_USER":
          state.users = state.users.map(u => u.id === payload.id ? payload : u);
          logEntry.action = "Updated User Role";
          logEntry.details = `Updated role for ${payload.name} to ${payload.role}`;
          break;
        case "ADD_USER":
          state.users.push(payload);
          logEntry.action = "Added User";
          logEntry.details = `Added new user: ${payload.name}`;
          break;
        case "DELETE_DELIVERY":
          const del = state.deliveries.find(d => d.id === payload);
          state.deliveries = state.deliveries.filter(d => d.id !== payload);
          logEntry.action = "Deleted Delivery";
          logEntry.details = `Removed delivery: ${del?.reference || payload}`;
          break;
        case "UPDATE_ADDRESS":
          const { category, entry } = payload;
          state.addressBook[category] = state.addressBook[category].map(e => e.id === entry.id ? entry : e);
          logEntry.action = "Updated Address Book";
          logEntry.details = `Updated ${category}: ${entry.name}`;
          break;
        case "ADD_ADDRESS":
          state.addressBook[payload.category].push(payload.entry);
          logEntry.action = "Added to Address Book";
          logEntry.details = `Added ${payload.category}: ${payload.entry.name}`;
          break;
        case "UPDATE_SETTINGS":
          state.settings = payload;
          logEntry.action = "Updated Settings";
          logEntry.details = "Updated terminology settings";
          break;
        case "BULK_UPDATE_DELIVERIES":
          const { ids, updates } = payload;
          state.deliveries = state.deliveries.map(d => {
            if (ids.includes(d.id)) {
              const updated = { ...d, ...updates, updatedAt: timestamp };
              const risk = calculateRisk(updated);
              return { ...updated, delayRisk: risk.risk, predictionReason: risk.reason };
            }
            return d;
          });
          logEntry.action = "Bulk Updated Deliveries";
          logEntry.details = `Updated ${ids.length} deliveries: ${Object.keys(updates).join(', ')}`;
          break;
      }

      state.logs.unshift(logEntry);
      if (state.logs.length > 100) state.logs.pop();

      saveState(state);
      io.emit("state_update", state);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected");
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
