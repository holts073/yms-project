import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

// Use SQLite queries
import {
  getDeliveries,
  insertDelivery,
  getAllDeliveries,
  deleteDelivery,
  getUsers,
  saveUser,
  deleteUser,
  getAddressBook,
  saveAddressBookEntry,
  deleteAddressEntry,
  getLogs,
  addLog,
  getYmsDocks,
  saveYmsDock,
  getYmsWaitingAreas,
  saveYmsWaitingArea,
  getYmsDeliveries,
  saveYmsDelivery,
  deleteYmsDelivery,
  getYmsWarehouses,
  saveYmsWarehouse,
  deleteYmsWarehouse,
  getYmsDockOverrides,
  saveYmsDockOverride,
  deleteYmsDockOverride
} from './src/db/queries';
import { getSetting, saveSetting } from './src/db/sqlite';

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: "*" },
  });

  const PORT = 3000;
  const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_for_dev_only';

  app.use(express.json());

  // Function to build standard static state for Socket sync
  const buildStaticState = () => {
    return {
      addressBook: getAddressBook(),
      logs: getLogs(),
      users: getUsers().map((u: any) => {
        const { passwordHash, ...safeUser } = u;
        return safeUser;
      }),
      companySettings: getSetting('companySettings', {}),
      settings: getSetting('settings', {}),
      yms: {
        warehouses: getYmsWarehouses(),
        docks: getYmsDocks(),
        waitingAreas: getYmsWaitingAreas(),
        deliveries: getYmsDeliveries(),
        dockOverrides: getYmsDockOverrides()
      }
    };
  };

  // API Routes
  app.get("/api/state", (req, res) => {
    res.json(buildStaticState()); // No deliveries
  });

  // REST API for Deliveries (Server-Side Pagination)
  app.get("/api/deliveries", (req, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 15;
    const search = req.query.search as string || '';
    const type = req.query.type as string || 'all';
    const sort = req.query.sort as string || 'eta';
    const activeOnly = req.query.activeOnly === 'true';

    const data = getDeliveries(page, limit, search, type, sort, activeOnly);
    res.json(data);
  });

  app.get("/api/deliveries/all", (req, res) => {
    // Used for CSV Export
    const data = getAllDeliveries();
    res.json(data);
  });

  app.post("/api/login", (req, res) => {
    const { email, password } = req.body;
    if (!email || typeof email !== "string" || !password) {
      return res.status(400).json({ error: "Email en wachtwoord verplicht." });
    }
    const users = getUsers();
    const user = users.find((u: any) => u.email && u.email.toLowerCase() === email.toLowerCase());
    
    if (!user || (!user.passwordHash && password !== 'welkom123')) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isValid = user.passwordHash 
      ? bcrypt.compareSync(password, user.passwordHash)
      : password === 'welkom123';

    if (!isValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    const { passwordHash, ...safeUser } = user;

    addLog({
      timestamp: new Date().toISOString(),
      user: user.name,
      action: "Login Successful",
      details: `User logged in from ${req.ip}`
    });

    res.json({ token, user: safeUser });
  });

  app.post("/api/forgot-password", async (req, res) => {
    const { email } = req.body;
    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "Ongeldig e-mailadres." });
    }
    const users = getUsers();
    const user = users.find((u: any) => u.email && u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      // Return 200 even if not found to prevent email enumeration, but for MVP returning error is fine
      return res.status(404).json({ error: "Gebruiker niet gevonden" });
    }

    const companySettings = getSetting('companySettings', {});
    const mailServer = companySettings?.mailServer;

    if (!mailServer || !mailServer.host || !mailServer.port || !mailServer.user || !mailServer.pass) {
      return res.status(500).json({ error: "SMTP instellingen zijn niet geconfigureerd" });
    }

    try {
      const tempPassword = Math.random().toString(36).slice(-8);
      const salt = await bcrypt.genSalt(10);
      const newHash = await bcrypt.hash(tempPassword, salt);
      
      saveUser({ ...user, passwordHash: newHash });

      const transporter = nodemailer.createTransport({
        host: mailServer.host,
        port: mailServer.port,
        secure: mailServer.port === 465,
        auth: {
          user: mailServer.user,
          pass: mailServer.pass
        }
      });

      await transporter.sendMail({
        from: mailServer.from || mailServer.user,
        to: email,
        subject: "Wachtwoord Reset - ILG Foodgroup YMS",
        text: `Beste ${user.name},\n\nUw wachtwoord is gereset. Uw nieuwe tijdelijke wachtwoord is: ${tempPassword}\n\nWe raden u aan dit direct na het inloggen te wijzigen.\n\nMet vriendelijke groet,\nILG Foodgroup YMS`
      });

      addLog({
        timestamp: new Date().toISOString(),
        user: "SYSTEM",
        action: "Password Reset Request",
        details: `Password reset sent to ${email}`
      });

      res.json({ success: true, message: "Wachtwoord gereset. Controleer uw e-mail." });
    } catch (error) {
      console.error("SMTP Error:", error);
      res.status(500).json({ error: "Fout bij verzenden email (SMTP fout)" });
    }
  });

  const calculateRisk = (delivery: any) => {
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

  // Socket.io logic
  io.on("connection", (socket) => {
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
            const riskInfo = calculateRisk(payload);
            const newDelivery = { 
              ...payload, 
              delayRisk: riskInfo.risk, 
              predictionReason: riskInfo.reason,
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
            io.emit("DELIVERY_UPDATED"); // Notify clients to redraw
            break;
          }
          case "UPDATE_DELIVERY": {
            const allDels = getAllDeliveries();
            const existing = allDels.find(d => d.id === payload.id);
            const updatedRisk = calculateRisk(payload);
            let newPayload = { ...payload, delayRisk: updatedRisk.risk, predictionReason: updatedRisk.reason };
            
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
                  reference: newPayload.reference,
                  licensePlate: '', // Can be updated later
                  supplier: supplier?.name || 'Onbekend',
                  temperature: newPayload.cargoType || 'Droog',
                  scheduledTime: newPayload.etaWarehouse || newPayload.eta || new Date().toISOString(),
                  status: 'Scheduled',
                  transporterId: newPayload.transporterId
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
            // payload: { ids: string[], updates: any }
            const allDels = getAllDeliveries().filter(d => payload.ids.includes(d.id));
            for (const d of allDels) {
              const updated = { ...d, ...payload.updates, updatedAt: timestamp };
              const risk = calculateRisk(updated);
              insertDelivery({ ...updated, delayRisk: risk.risk, predictionReason: risk.reason });
            }
            logEntry.action = "Bulk Updated Deliveries";
            logEntry.details = `Updated ${payload.ids.length} deliveries`;
            io.emit("DELIVERY_UPDATED");
            break;

          case "UPDATE_USER": {
            const { password, ...userData } = payload;
            const existingUser = getUsers().find(u => u.id === userData.id);
            
            if (password) {
              const salt = bcrypt.genSaltSync(10);
              userData.passwordHash = bcrypt.hashSync(password, salt);
            } else if (existingUser) {
              userData.passwordHash = existingUser.passwordHash;
            }

            saveUser(userData);
            logEntry.action = "Updated User";
            logEntry.details = `Updated profile/role for ${userData.name}`;
            io.emit("state_update", buildStaticState());
            break;
          }
          case "ADD_USER": {
            const { password, ...newUserData } = payload;
            if (newUserData.email) newUserData.email = newUserData.email.toLowerCase();
            
            // Check for existing user with same email
            const existingUsers = getUsers();
            if (existingUsers.find(u => u.email === newUserData.email)) {
              console.error(`[ADD_USER] FAILED: Email ${newUserData.email} already exists.`);
              logEntry.action = "User Addition Failed";
              logEntry.details = `Failed to add user ${newUserData.name} - Duplicate email: ${newUserData.email}`;
              break; 
            }

            const salt = bcrypt.genSaltSync(10);
            newUserData.passwordHash = bcrypt.hashSync(password || 'welkom123', salt);
            saveUser(newUserData);
            logEntry.action = "Added User";
            logEntry.details = `Added new user: ${newUserData.name}`;
            io.emit("state_update", buildStaticState());
            break;
          }

          case "UPDATE_ADDRESS":
            saveAddressBookEntry(payload.entry);
            logEntry.action = "Updated Address Book";
            logEntry.details = `Updated ${payload.category}: ${payload.entry.name}`;
            io.emit("state_update", buildStaticState());
            break;

          case "ADD_ADDRESS":
            saveAddressBookEntry(payload.entry);
            logEntry.action = "Added to Address Book";
            logEntry.details = `Added ${payload.category}: ${payload.entry.name}`;
            io.emit("state_update", buildStaticState());
            break;

          case "UPDATE_SETTINGS":
            saveSetting('settings', payload);
            logEntry.action = "Updated Settings";
            logEntry.details = "Updated terminology settings";
            io.emit("state_update", buildStaticState());
            break;
          
          case "DELETE_USER":
            if (user.role === 'admin') {
              deleteUser(payload);
              logEntry.action = "Deleted User";
              logEntry.details = `Deleted user ID: ${payload}`;
              io.emit("state_update", buildStaticState());
            }
            break;

          case "DELETE_ADDRESS":
            deleteAddressEntry(payload.id);
            logEntry.action = "Deleted Address Block";
            logEntry.details = `Deleted ${payload.category} ID: ${payload.id}`;
            io.emit("state_update", buildStaticState());
            break;

          case "YMS_UPDATE_DOCK":
            saveYmsDock(payload);
            logEntry.action = "YMS Dock Updated";
            logEntry.details = `Updated YMS Dock: ${payload.name}`;
            io.emit("state_update", buildStaticState());
            break;

          case "YMS_UPDATE_WAITING_AREA":
            saveYmsWaitingArea(payload);
            logEntry.action = "YMS Waiting Area Updated";
            logEntry.details = `Updated YMS Waiting Area: ${payload.name}`;
            io.emit("state_update", buildStaticState());
            break;

          case "YMS_SAVE_DELIVERY": {
            const current = payload as any;
            if (!current.registrationTime) {
                current.registrationTime = new Date().toISOString();
            }
            // 24h Registration Rule
            const regDate = new Date(current.registrationTime).getTime();
            const schedDate = new Date(current.scheduledTime).getTime();
            const twentyFourHours = 24 * 60 * 60 * 1000;
            current.isLate = (regDate + twentyFourHours) > schedDate;

            saveYmsDelivery(current);
            logEntry.action = "YMS Delivery Saved";
            logEntry.details = `Saved YMS Delivery: ${current.reference} (Late: ${current.isLate})`;
            io.emit("state_update", buildStaticState());
            break;
          }

          case "YMS_DELETE_DELIVERY":
            deleteYmsDelivery(payload);
            logEntry.action = "YMS Delivery Deleted";
            logEntry.details = `Deleted YMS Delivery ID: ${payload}`;
            io.emit("state_update", buildStaticState());
            break;

          case "YMS_SAVE_WAREHOUSE":
            saveYmsWarehouse(payload);
            logEntry.action = "YMS Warehouse Saved";
            logEntry.details = `Saved YMS Warehouse: ${payload.name}`;
            io.emit("state_update", buildStaticState());
            break;

          case "YMS_DELETE_WAREHOUSE":
            deleteYmsWarehouse(payload);
            logEntry.action = "YMS Warehouse Deleted";
            logEntry.details = `Deleted YMS Warehouse ID: ${payload}`;
            io.emit("state_update", buildStaticState());
            break;

          case "YMS_SAVE_DOCK_OVERRIDE":
            saveYmsDockOverride(payload);
            logEntry.action = "YMS Dock Override Saved";
            logEntry.details = `Saved Override for Dock ${payload.dockId} on ${payload.date}`;
            io.emit("state_update", buildStaticState());
            break;

          case "YMS_DELETE_DOCK_OVERRIDE":
            deleteYmsDockOverride(payload);
            logEntry.action = "YMS Dock Override Deleted";
            logEntry.details = `Deleted Override ID: ${payload}`;
            io.emit("state_update", buildStaticState());
            break;
        }

        addLog(logEntry);
        // If it wasn't a delivery update that triggers state_update, trigger it now for logs
        if (!["ADD_DELIVERY", "UPDATE_DELIVERY", "DELETE_DELIVERY", "BULK_UPDATE_DELIVERIES"].includes(type)) {
          io.emit("state_update", buildStaticState());
        }

      } catch (err: any) {
        console.error("Action Error Details:", {
          type,
          user: user?.name,
          error: err?.message || err,
          stack: err?.stack
        });
      }
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
    console.log(`Server running on http://localhost:${PORT} with SQLite`);
  });
}

startServer();
