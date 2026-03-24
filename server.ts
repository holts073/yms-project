import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";

// Modular Imports
import authRoutes from './server/routes/auth';
import deliveryRoutes from './server/routes/deliveries';
import { setupSocketHandlers } from './server/sockets/socketHandlers';
import { startInventoryWorker } from './server/workers/inventory-worker';

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: "*" },
  });

  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.use("/api", authRoutes);
  app.use("/api", deliveryRoutes);

  // Socket.io Handlers
  setupSocketHandlers(io);

  // Background Workers
  startInventoryWorker(io);

  // Vite middleware for development or Static files for production
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
    console.log(`[YMS SERVER] Modulaire server draait op http://localhost:${PORT}`);
  });
}

startServer();
