import { Router } from 'express';
import { getDeliveries, getAllDeliveries, getAddressBook, getLogs, getUsers, getYmsWarehouses, getYmsDocks, getYmsWaitingAreas, getYmsDeliveries, getYmsDockOverrides, getYmsAlerts, getPalletBalances } from '../../src/db/queries';
import { getSetting } from '../../src/db/sqlite';
import nodemailer from 'nodemailer';
import { generateTransportOrderPDF } from '../services/pdfService';

const router = Router();

import { Server } from "socket.io";

import { sortPriorityQueue } from '../services/queueService';

// Function to build standard static state for Socket sync (also used via API)
export const buildStaticState = (io?: Server, selectedWarehouseId?: string) => {
  const activeUsers = io ? io.sockets.sockets.size : 0;
  const ymsDeliveries = getYmsDeliveries(selectedWarehouseId);
  
  return {
    deliveries: getAllDeliveries(),
    addressBook: getAddressBook(),
    palletBalances: getPalletBalances(),
    logs: getLogs(),
    users: getUsers().map((u: any) => {
      const { passwordHash, ...safeUser } = u;
      return safeUser;
    }),
    companySettings: getSetting('companySettings', {}),
    settings: getSetting('settings', {}),
    yms: {
      warehouses: getYmsWarehouses(),
      docks: getYmsDocks(selectedWarehouseId), 
      waitingAreas: getYmsWaitingAreas(selectedWarehouseId),
      deliveries: ymsDeliveries,
      priorityQueue: sortPriorityQueue(ymsDeliveries),
      dockOverrides: getYmsDockOverrides(selectedWarehouseId),
      alerts: getYmsAlerts(selectedWarehouseId),
      selectedWarehouseId: selectedWarehouseId || null
    },
    activeUsers
  };
};

router.get("/state", (req, res) => {
  try {
    const state = buildStaticState();
    res.json(state);
  } catch (error) {
    console.error("Error in /api/state:", error);
    res.status(500).json({ error: (error as any).message });
  }
});

router.get("/deliveries", (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 15;
  const search = req.query.search as string || '';
  const type = req.query.type as string || 'all';
  const sort = req.query.sort as string || 'eta';
  const activeOnly = req.query.activeOnly === 'true';

  const data = getDeliveries(page, limit, search, type, sort, activeOnly);
  res.json(data);
});

router.get("/deliveries/all", (req, res) => {
  const data = getAllDeliveries();
  res.json(data);
});

router.post("/deliveries/:id/send-transport-order", async (req, res) => {
  const { id } = req.params;
  const deliveries = getAllDeliveries();
  const delivery = deliveries.find(d => d.id === id);

  if (!delivery) {
    return res.status(404).json({ error: "Levering niet gevonden" });
  }

  const { suppliers, transporters } = getAddressBook();
  const supplier = suppliers.find(s => s.id === delivery.supplierId);
  const transporter = transporters.find(t => t.id === delivery.transporterId);

  try {
    const pdfBuffer = await generateTransportOrderPDF(delivery, supplier, transporter);

    const companySettings = getSetting('companySettings', {});
    const mailServer = companySettings?.mailServer;

    if (!mailServer || !mailServer.host || !mailServer.port || !mailServer.user || !mailServer.pass) {
      return res.status(500).json({ error: "SMTP instellingen zijn niet geconfigureerd" });
    }

    const mailTransporter = nodemailer.createTransport({
      host: mailServer.host,
      port: mailServer.port,
      secure: mailServer.port === 465,
      auth: {
        user: mailServer.user,
        pass: mailServer.pass
      }
    });

    await mailTransporter.sendMail({
      from: mailServer.from || mailServer.user,
      to: companySettings.email || mailServer.user, // Send internally to office
      subject: `Transport Order - ${delivery.reference}`,
      text: `Beste collega,\n\nHierbij de Transport Order voor rit ${delivery.reference}.\n\nReferentie: ${delivery.reference}\nLeverancier: ${supplier?.name || delivery.supplierId}\n\nMet vriendelijke groet,\nILG Foodgroup YMS`,
      attachments: [
        {
          filename: `TransportOrder_${delivery.reference}.pdf`,
          content: pdfBuffer
        }
      ]
    });

    res.json({ success: true, message: "Transport Order PDF verzonden" });
  } catch (error) {
    console.error("PDF/Mail Error:", error);
    res.status(500).json({ error: "Fout bij genereren of verzenden van PDF" });
  }
});

export default router;
