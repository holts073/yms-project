import { insertDelivery } from './src/db/queries';
import { Delivery } from './src/types';

// Let's get the existing suppliers to use valid IDs if available
import { db } from './src/db/sqlite';
const suppliers = db.prepare("SELECT id FROM address_book WHERE type = 'supplier'").all() as any[];
const transporters = db.prepare("SELECT id FROM address_book WHERE type = 'transporter'").all() as any[];

const supplierId = suppliers.length > 0 ? suppliers[0].id : "1";
const transporterId = transporters.length > 0 ? transporters[0].id : "2";

const generateDelivery = (i: number): Delivery => {
  const isContainer = Math.random() > 0.5;
  const statusCodes = [0, 20, 40, 60, 80, 100];
  const statusesForExworks = [0, 50, 60, 80, 100];
  
  const status = isContainer 
    ? statusCodes[Math.floor(Math.random() * statusCodes.length)]
    : statusesForExworks[Math.floor(Math.random() * statusesForExworks.length)];
  
  const today = new Date();
  const offsetETA = Math.floor(Math.random() * 20) - 2; // -2 to +18 days
  const etaDate = new Date(today);
  etaDate.setDate(today.getDate() + offsetETA);

  return {
    id: Math.random().toString(36).substr(2, 9),
    reference: `DEMO-${1000 + i}`,
    supplierId,
    transporterId,
    type: isContainer ? 'container' : 'exworks',
    status: status,
    etaWarehouse: etaDate.toISOString().split('T')[0],
    etaPort: isContainer ? new Date(etaDate.getTime() - 4*24*60*60*1000).toISOString().split('T')[0] : undefined,
    containerNumber: isContainer ? `MSKU${Math.floor(1000000 + Math.random() * 9000000)}` : undefined,
    billOfLading: isContainer ? `BL${Math.floor(100000 + Math.random() * 900000)}` : undefined,
    palletCount: Math.floor(2 + Math.random() * 30),
    palletType: 'EUR',
    palletExchange: Math.random() > 0.5,
    cargoType: isContainer ? undefined : 'Dry',
    weight: Math.floor(500 + Math.random() * 10000),
    transportCost: "€ " + Math.floor(150 + Math.random() * 500) + ",-",
    documents: [],
    statusHistory: [],
    auditTrail: [],
    delayRisk: offsetETA < 3 && status < 100 ? 'high' : 'low',
    predictionReason: offsetETA < 3 && status < 100 ? 'ETA nadert snel.' : undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};

console.log("Seeding 30 deliveries...");

for (let i = 1; i <= 30; i++) {
  const del = generateDelivery(i);
  insertDelivery(del);
}

console.log("Database seeded successfully!");
