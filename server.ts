import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  const PORT = 3000;

  // In-memory state (for demo purposes, since Firebase was declined)
  let state = {
    deliveries: [],
    addressBook: {
      suppliers: [
        { id: '1', name: 'Global Tech Solutions', contact: 'John Doe', email: 'john@globaltech.com', address: '123 Tech Lane', type: 'supplier' },
        { id: '2', name: 'Euro Logistics', contact: 'Jane Smith', email: 'jane@eurolog.com', address: '456 Port Road', type: 'transporter' }
      ],
      transporters: [
        { id: '3', name: 'Swift Shipping', contact: 'Mike Ross', email: 'mike@swift.com', address: '789 Ocean Ave', type: 'transporter' }
      ]
    },
    logs: [],
    users: [
      { id: 'admin', name: 'Admin User', role: 'admin', email: 'admin@example.com' },
      { id: 'user1', name: 'Warehouse Staff', role: 'staff', email: 'staff@example.com' }
    ]
  };

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
        details: ""
      };

      switch (type) {
        case "ADD_DELIVERY":
          state.deliveries.push(payload);
          logEntry.action = "Created Delivery";
          logEntry.details = `Added ${payload.type} delivery: ${payload.reference}`;
          break;
        case "UPDATE_DELIVERY":
          state.deliveries = state.deliveries.map(d => d.id === payload.id ? payload : d);
          logEntry.action = "Updated Delivery";
          logEntry.details = `Updated delivery: ${payload.reference}`;
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
      }

      state.logs.unshift(logEntry);
      if (state.logs.length > 100) state.logs.pop();

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
