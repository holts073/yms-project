import 'dotenv/config';
import { insertDelivery, saveAddressBookEntry, saveUser, saveYmsDelivery } from './src/db/queries';
import { Delivery, AddressEntry, User, YmsDelivery, YmsTemperature, YmsDirection, AuditEntry } from './src/types';
import bcrypt from 'bcryptjs';
import { db } from './src/db/sqlite';

const seedDatabase = async () => {
  console.log("Purging ALL old data to resolve schema conflicts...");
  // Ordered by dependencies if there were foreign keys (though they are loose)
  db.prepare('DELETE FROM audit_logs').run();
  db.prepare('DELETE FROM documents').run();
  db.prepare('DELETE FROM deliveries').run();
  db.prepare('DELETE FROM yms_deliveries').run();
  db.prepare('DELETE FROM yms_slots').run();
  db.prepare('DELETE FROM pallet_transactions').run();
  db.prepare('DELETE FROM logs').run();
  db.prepare('DELETE FROM address_book').run();
  db.prepare('DELETE FROM users').run();

  console.log("Seeding base testing data (Users & Address Book)...");

  // 1. Users
  const staffPwd = process.env.INITIAL_STAFF_PASSWORD || 'welkom123';
  const managerPwd = process.env.INITIAL_MANAGER_PASSWORD || 'manager123';
  const adminPwd = process.env.INITIAL_ADMIN_PASSWORD || 'ilg2026!';

  const staffHash = await bcrypt.hash(staffPwd, 10);
  const managerHash = await bcrypt.hash(managerPwd, 10);
  const adminHash = await bcrypt.hash(adminPwd, 10);
  const viewerHash = await bcrypt.hash('viewer123', 10);
  const gateHash = await bcrypt.hash('poort123', 10);
  const financeHash = await bcrypt.hash('finance123', 10);

  const users: User[] = [
    { id: 'u1', name: 'Admin User', email: 'admin@ilgfood.com', role: 'admin', passwordHash: adminHash },
    { id: 'u2', name: 'Logistics Manager', email: 'manager@ilgfood.com', role: 'manager', passwordHash: managerHash, permissions: { LOGISTICS_DELIVERY_CRUD: true, YMS_STATUS_UPDATE: true } },
    { id: 'u3', name: 'Staff User', email: 'staff@ilgfood.com', role: 'staff', passwordHash: staffHash },
    { id: 'u4', name: 'Viewer User', email: 'viewer@ilgfood.com', role: 'viewer', passwordHash: viewerHash },
    { id: 'u5', name: 'Poortwachter', email: 'gate@ilgfood.com', role: 'gate_guard', passwordHash: gateHash },
    { id: 'u6', name: 'Financieel Auditeur', email: 'finance@ilgfood.com', role: 'finance_auditor', passwordHash: financeHash },
    { id: 'u7', name: 'Demo Gebruiker', email: 'demo@ilgfood.com', role: 'staff', passwordHash: await bcrypt.hash('demo123', 10) }
  ];
  users.forEach(saveUser);

  // 2. Address Book
  const addresses: AddressEntry[] = [
    { id: 's1', type: 'supplier', name: 'Global Foods Trading', contact: 'John Doe', email: 'orders@globalfoods.com', address: 'Market Square 12, Amsterdam', otif: 92, supplier_number: 'SUP-001', pallet_rate: 14.50 },
    { id: 's2', type: 'supplier', name: 'Euro Meats BV', contact: 'Klaus Schmidt', email: 'kontakt@euromeats.de', address: 'Fleischstrasse 44, Berlin', otif: 98, supplier_number: 'SUP-002', pallet_rate: 12.00 },
    { id: 's3', type: 'supplier', name: 'Asian Spice Co', contact: 'Kenji Sato', email: 'export@spice-it.jp', address: 'Shibuya-ku, Tokyo', otif: 94, supplier_number: 'SUP-003', pallet_rate: 15.00 },
    { id: 's4', type: 'supplier', name: 'Mediterranean Oils SL', contact: 'Maria Garcia', email: 'ventas@medoils.es', address: 'Gran Via 50, Barcelona', otif: 96, supplier_number: 'SUP-004', pallet_rate: 11.50 },
    { id: 't1', type: 'transporter', name: 'FastTracks Logistics', contact: 'Mike van der Meer', email: 'dispatch@fasttracks.nl', address: 'Port of Rotterdam', otif: 95, customer_number: 'CUS-T1' },
    { id: 't2', type: 'transporter', name: 'Heavy Load Haulage', contact: 'Jan Janssen', email: 'info@heavyload.be', address: 'Antwerp Terminal', otif: 89, customer_number: 'CUS-T2' }
  ];
  addresses.forEach(saveAddressBookEntry);

  const statusCodes = [0, 20, 25, 40, 50, 60, 75, 80];
  const countries = ['NL', 'DE', 'BE', 'ES', 'IT', 'FR', 'PL'];
  const cities: Record<string, string[]> = {
    'NL': ['Rotterdam', 'Amsterdam', 'Eindhoven'],
    'DE': ['Hamburg', 'Berlin', 'Munich'],
    'ES': ['Madrid', 'Barcelona', 'Valencia'],
    'IT': ['Milan', 'Genoa', 'Naples']
  };

  const generateDelivery = (i: number, forceDelivered: boolean = false): Delivery => {
    const isContainer = Math.random() > 0.4;
    const status = forceDelivered ? 100 : (isContainer 
      ? statusCodes[Math.floor(Math.random() * statusCodes.length)]
      : statusCodes.filter(s => s !== 25 && s !== 40)[Math.floor(Math.random() * 6)]);
    
    const today = new Date();
    const offsetdays = Math.floor(Math.random() * 20) - 2; 
    const etaDate = new Date(today.getTime() + offsetdays * 24 * 60 * 60 * 1000);
    const country = countries[Math.floor(Math.random() * countries.length)];
    const cityList = cities[country] || ['Unnamed City'];
    const city = cityList[Math.floor(Math.random() * cityList.length)];

    const id = `del-${i}-${Math.random().toString(36).substr(2, 5)}`;
    
    const docs = [
      { id: `doc-${id}-1`, name: isContainer ? 'Seaway Bill / B/L' : 'CMR / Vrachtbrief', status: status >= 25 ? 'received' : 'pending', required: true, blocksMilestone: isContainer ? 40 : 50 },
      { id: `doc-${id}-2`, name: 'Commercial Invoice', status: status >= 25 ? 'received' : 'pending', required: true, blocksMilestone: 100 },
      { id: `doc-${id}-3`, name: 'Packing List', status: status >= 25 ? 'received' : (Math.random() > 0.7 ? 'missing' : 'pending'), required: true, blocksMilestone: 100 },
    ];

    // Add ATR or EUR1 specifically for some suppliers to show the "Suppliers specific doc" reality
    if (i % 3 === 0) {
      docs.push({ id: `doc-${id}-5`, name: 'ATR Document', status: status >= 40 ? 'received' : 'pending', required: true, blocksMilestone: 40 });
    } else if (i % 5 === 0) {
      docs.push({ id: `doc-${id}-6`, name: 'EUR1 Certificaat', status: status >= 40 ? 'received' : 'pending', required: true, blocksMilestone: 40 });
    }

    if (isContainer && status >= 50) {
      docs.push({ id: `doc-${id}-4`, name: 'Notification of Arrival', status: 'received', required: true, blocksMilestone: 50 });
    }

    const audit: AuditEntry[] = [
      { timestamp: new Date().toISOString(), user: 'System', action: 'CREATE', details: 'Initial record created via seed.' }
    ];

    if (status > 0) {
      audit.push({ timestamp: new Date().toISOString(), user: 'Logistics Manager', action: 'UPDATE_STATUS', details: `Status updated to ${status}.` });
    }

    const requiresQA = Math.random() > 0.7;
    const notesPool = [
      "Zegel controleren bij aankomst.",
      "Chauffeur spreekt alleen Spaans.",
      "Spoedlevering voor klant-order X.",
      "Extra pallets bijgeladen in Hamburg.",
      "Let op: temperatuur-gevoelige lading.",
      "",
      ""
    ];

    return {
      id,
      type: isContainer ? 'container' : 'exworks',
      reference: `${isContainer ? 'CONT' : 'TRUK'}-${1000 + i}`,
      supplierId: `s${1 + Math.floor(Math.random() * 4)}`,
      transporterId: Math.random() > 0.3 ? 't1' : 't2',
      forwarderId: isContainer ? 't1' : undefined,
      status,
      eta: etaDate.toISOString(),
      createdAt: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
      palletCount: Math.floor(2 + Math.random() * 30),
      palletType: 'EUR',
      palletExchange: Math.random() > 0.5,
      palletRate: 12.50,
      requiresQA,
      notes: notesPool[Math.floor(Math.random() * notesPool.length)],
      weight: Math.floor(500 + Math.random() * 15000),
      transportCost: Math.floor(200 + Math.random() * 1000),
      cargoType: isContainer ? undefined : (Math.random() > 0.7 ? 'Cool' : 'Dry'),
      loadingCountry: country,
      loadingCity: city,
      loadingTime: "08:00 - 17:00",
      etd: isContainer ? new Date(etaDate.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString() : undefined,
      etaPort: isContainer ? new Date(etaDate.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString() : undefined,
      etaWarehouse: etaDate.toISOString().split('T')[0],
      originalEtaWarehouse: etaDate.toISOString().split('T')[0],
      portOfArrival: isContainer ? 'Rotterdam' : undefined,
      billOfLading: isContainer ? `BL-${Math.random().toString(36).substr(2, 8).toUpperCase()}` : undefined,
      containerNumber: isContainer ? `MSKU${Math.floor(1000000 + Math.random() * 9000000)}` : undefined,
      customsStatus: isContainer ? (status >= 50 ? 'Cleared' : 'Pending') : undefined,
      dischargeTerminal: isContainer ? 'APM Terminals Maasvlakte II' : undefined,
      incoterm: !isContainer ? (['EXW', 'FCA', 'DAP'][Math.floor(Math.random() * 3)] as any) : undefined,
      readyForPickupDate: !isContainer ? new Date(etaDate.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString() : undefined,
      documents: docs as any,
      statusHistory: [0, Math.min(status, 20)],
      auditTrail: audit,
      delayRisk: Math.random() > 0.8 ? 'high' : 'low'
    };
  };

  console.log("Seeding 40 Pipeline deliveries (30 active, 10 delivered)...");
  const seededDeliveries: Delivery[] = [];
  for (let i = 1; i <= 40; i++) {
    const d = generateDelivery(i, i > 30);
    insertDelivery(d);
    seededDeliveries.push(d);
  }

  console.log("Seeding Yard (YMS) data based on Pipeline...");
  // Pick some deliveries that are "Expected" or further
  const ymsCandidates = seededDeliveries.filter(d => d.status >= 50 && d.status < 100);
  
  const ymsStatuses: Record<number, string> = {
    0: 'EXPECTED',
    1: 'IN_YARD',
    2: 'DOCKED',
    3: 'UNLOADING',
    4: 'COMPLETED'
  };

  ymsCandidates.slice(0, 15).forEach((d, i) => {
    const ymsStatus = i < 5 ? 'EXPECTED' : (i < 8 ? 'IN_YARD' : (i < 12 ? 'DOCKED' : 'UNLOADING'));
    const isReefer = d.cargoType === 'Cool' || d.cargoType === 'Frozen';
    
    // License plate generation
    const plates = ['01-BKB-2', 'V-456-ZZ', '99-XL-PP', 'BT-77-KK', '1-ABC-123', 'DE-XY-100'];
    
    const ymsDel: YmsDelivery = {
      id: `yms-${d.id}`,
      warehouseId: 'W01',
      reference: d.reference,
      licensePlate: plates[i % plates.length],
      supplier: addresses.find(a => a.id === d.supplierId)?.name || 'Onbekend',
      supplierId: d.supplierId,
      mainDeliveryId: d.id,
      temperature: (d.cargoType as any) || 'Droog',
      scheduledTime: d.etaWarehouse ? `${d.etaWarehouse}T${10 + (i % 8)}:00:00Z` : new Date().toISOString(),
      arrivalTime: ymsStatus !== 'EXPECTED' ? new Date().toISOString() : undefined,
      registrationTime: ymsStatus !== 'EXPECTED' ? new Date().toISOString() : undefined,
      isLate: Math.random() > 0.8,
      dockId: ymsStatus === 'DOCKED' || ymsStatus === 'UNLOADING' ? (i % 20) + 1 : undefined,
      waitingAreaId: ymsStatus === 'IN_YARD' ? (i % 10) + 1 : undefined,
      transporterId: d.transporterId,
      status: ymsStatus as any,
      palletCount: d.palletCount,
      palletType: d.palletType,
      palletRate: d.palletRate,
      direction: 'INBOUND',
      isReefer,
      estimatedDuration: 45 + (d.palletCount || 0) * 2,
      notes: d.notes,
      requiresQA: d.requiresQA
    };
    
    saveYmsDelivery(ymsDel);
  });

  console.log("Seeding Document Templates (Settings)...");
  const defaultShipmentSettings = {
    container: [
      { name: 'Seaway Bill / B/L', required: true, blocksMilestone: 40 },
      { name: 'Commercial Invoice', required: true, blocksMilestone: 100 },
      { name: 'Packing List', required: true, blocksMilestone: 100 },
      { name: 'ATR Document', required: false, blocksMilestone: 40 },
      { name: 'Notification of Arrival', required: true, blocksMilestone: 50 },
    ],
    exworks: [
      { name: 'CMR / Vrachtbrief', required: true, blocksMilestone: 50 },
      { name: 'Commercial Invoice', required: true, blocksMilestone: 100 },
      { name: 'Transport Order', required: true, blocksMilestone: 25 },
    ]
  };
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('settings', JSON.stringify({ shipment_settings: defaultShipmentSettings }));

  console.log("Database seeded successfully with HIGH FIDELITY demo data!");
};

seedDatabase().catch(console.error);
