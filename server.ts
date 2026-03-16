import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import { getState, saveState } from "./db";

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
      { id: '1', name: 'Global Tech Solutions', contact: 'John Doe', email: 'john@globaltech.com', address: '123 Tech Lane, Shenzhen, China', type: 'supplier', otif: 94, pickupAddress: 'Warehouse A, Shenzhen Port' },
      { id: '2', name: 'Euro Logistics', contact: 'Jane Smith', email: 'jane@eurolog.com', address: '456 Port Road, Rotterdam, NL', type: 'supplier', otif: 88, pickupAddress: 'Distribution Center West, Rotterdam' },
      { id: 's3', name: 'Nordic Manufacturing', contact: 'Sven G.', email: 'sven@nordic.se', address: 'Industrial Way 12, Stockholm', type: 'supplier', otif: 97, pickupAddress: 'Stockholm North Industrial Park' },
      { id: 's4', name: 'Mediterranean Foods', contact: 'Marco R.', email: 'marco@medfoods.it', address: 'Via Roma 45, Naples', type: 'supplier', otif: 91, pickupAddress: 'Naples Export Hub' },
      { id: 's5', name: 'Alpine Dairy', contact: 'Heidi M.', email: 'heidi@alpinedairy.ch', address: 'Milk Street 1, Zurich', type: 'supplier', otif: 99, pickupAddress: 'Zurich Cold Storage' }
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
          { id: 'd1', name: 'Factuur', status: Math.random() > 0.3 ? 'received' : 'missing', required: true },
          { id: 'd2', name: 'Packing List', status: Math.random() > 0.4 ? 'received' : 'missing', required: true },
          { id: 'd3', name: 'Pickup Confirmation', status: Math.random() > 0.5 ? 'received' : 'missing', required: type === 'exworks' },
          { id: 'd4', name: 'Transport Order', status: status >= 50 ? 'received' : 'missing', required: type === 'exworks' }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        etaWarehouse: eta,
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
        { id: 'admin', name: 'Admin User', role: 'admin', email: 'admin@example.com' },
        { id: 'user1', name: 'Warehouse Staff', role: 'staff', email: 'staff@example.com' },
        { id: 'elmer', name: 'Elmer Holtslag', role: 'admin', email: 'ElmerHoltslag@gmail.com' }
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
        case "ADD_DELIVERY":
          const riskInfo = calculateRisk(payload);
          state.deliveries.push({ 
            ...payload, 
            delayRisk: riskInfo.risk, 
            predictionReason: riskInfo.reason,
            statusHistory: payload.statusHistory || []
          });
          logEntry.action = "Created Delivery";
          logEntry.details = `Added ${payload.type} delivery: ${payload.reference}`;
          break;
        case "UPDATE_DELIVERY":
          const updatedRisk = calculateRisk(payload);
          state.deliveries = state.deliveries.map(d => d.id === payload.id ? { ...payload, delayRisk: updatedRisk.risk, predictionReason: updatedRisk.reason } : d);
          logEntry.action = "Updated Delivery";
          logEntry.details = `Updated delivery: ${payload.reference}`;
          break;
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
