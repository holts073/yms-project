import { insertDelivery, saveAddressBookEntry, saveUser } from './src/db/queries';
import { Delivery, AddressEntry, User } from './src/types';
import bcrypt from 'bcryptjs';

const seedDatabase = async () => {
  console.log("Seeding base testing data (Users & Address Book)...");

  // 1. Users
  const staffHash = await bcrypt.hash('welkom123', 10);
  const managerHash = await bcrypt.hash('manager123', 10);
  const adminHash = await bcrypt.hash('admin123', 10);

  const users: User[] = [
    { id: 'u1', name: 'Admin', email: 'admin@ilgfood.com', role: 'admin', passwordHash: adminHash },
    { id: 'u2', name: 'Logistics Manager', email: 'manager@ilgfood.com', role: 'manager', passwordHash: managerHash, permissions: { sendTransportOrder: true, manageDeliveries: true } },
    { id: 'u3', name: 'Staff User', email: 'staff@ilgfood.com', role: 'staff', passwordHash: staffHash }
  ];
  users.forEach(saveUser);

  // 2. Address Book
  const addresses: AddressEntry[] = [
    { id: 's1', type: 'supplier', name: 'Global Foods Inc', contact: 'John Doe', email: 'orders@globalfoods.com', address: '123 Market St, NY', otif: 92 },
    { id: 's2', type: 'supplier', name: 'Euro Meats', contact: 'Klaus', email: 'klaus@euromeats.de', address: 'Berlin 44, DE', otif: 98 },
    { id: 't1', type: 'transporter', name: 'FastTracks Logistics', contact: 'Mike', email: 'dispatch@fasttracks.com', address: 'Rotterdam Port', otif: 95 }
  ];
  addresses.forEach(saveAddressBookEntry);

  const statusCodes = [0, 20, 25, 40, 50, 60, 75, 80, 100];
  const statusesForExworks = [0, 25, 50, 60, 80, 100];

  const generateDelivery = (i: number): Delivery => {
    const isContainer = Math.random() > 0.5;
    const status = isContainer 
      ? statusCodes[Math.floor(Math.random() * statusCodes.length)]
      : statusesForExworks[Math.floor(Math.random() * statusesForExworks.length)];
    
    const today = new Date();
    const offsetETA = Math.floor(Math.random() * 20) - 2; // -2 to +18 days
    const etaDate = new Date(today);
    etaDate.setDate(today.getDate() + offsetETA);

    const docs = isContainer ? [
      { id: Math.random().toString(36).substr(2, 9), name: 'Bill of Lading', status: status >= 50 ? 'received' : 'pending', required: true },
      { id: Math.random().toString(36).substr(2, 9), name: 'Commercial Invoice', status: status >= 25 ? 'received' : 'pending', required: true },
      { id: Math.random().toString(36).substr(2, 9), name: 'Packing List', status: 'pending', required: true },
      { id: Math.random().toString(36).substr(2, 9), name: 'Notification of Arrival', status: status >= 60 ? 'received' : 'missing', required: true }
    ] : [
      { id: Math.random().toString(36).substr(2, 9), name: 'CMR', status: status >= 80 ? 'received' : 'pending', required: true },
      { id: Math.random().toString(36).substr(2, 9), name: 'Pakbon', status: 'pending', required: true }
    ];

    return {
      id: Math.random().toString(36).substr(2, 9),
      reference: `DEMO-${1000 + i}`,
      supplierId: i % 2 === 0 ? 's1' : 's2',
      transporterId: 't1',
      forwarderId: isContainer ? 't1' : undefined,
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
      transportCost: Math.floor(150 + Math.random() * 500),
      documents: docs as any,
      statusHistory: [],
      auditTrail: [],
      delayRisk: offsetETA < 3 && status < 100 ? 'high' : 'low',
      predictionReason: offsetETA < 3 && status < 100 ? 'ETA nadert snel.' : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  };

  console.log("Seeding 30 deliveries WITH documents...");

  for (let i = 1; i <= 30; i++) {
    const del = generateDelivery(i);
    insertDelivery(del);
  }

  console.log("Database seeded successfully!");
};

seedDatabase().catch(console.error);
