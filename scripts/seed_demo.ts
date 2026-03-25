import { insertDelivery, saveAddressBookEntry, saveYmsDelivery, savePalletTransaction } from '../src/db/queries';
import { Delivery } from '../src/types';

function generateRandomString(length: number) {
  return Math.random().toString(36).substr(2, length).toUpperCase();
}

function getRandomDate(start: Date, end: Date) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generateContainerDelivery(i: number, offsetDays: number): Delivery {
  const eta = getRandomDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)); 
  return {
    id: `DEMO-CONT-${i}`,
    type: 'container',
    reference: `PO-${generateRandomString(6)}`,
    supplierId: 'S01',
    transporterId: 'T01',
    status: 10,
    eta: eta.toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    weight: Math.floor(Math.random() * 20000) + 5000,
    palletType: 'EUR',
    palletCount: Math.floor(Math.random() * 33) + 1,
    cargoType: Math.random() > 0.8 ? 'Cool' : 'Dry',
    palletExchange: Math.random() > 0.5,
    containerNumber: `${generateRandomString(4)}${Math.floor(Math.random() * 900000) + 100000}`,
    portOfArrival: 'Rotterdam',
    etaPort: (new Date(eta.getTime() - 2 * 24 * 60 * 60 * 1000)).toISOString(),
    documents: []
  };
}

function generateExWorksDelivery(i: number, offsetDays: number): Delivery {
  const eta = getRandomDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date(Date.now() + 14 * 24 * 60 * 60 * 1000));
  return {
    id: `DEMO-EXW-${i}`,
    type: 'exworks',
    reference: `PO-${generateRandomString(6)}`,
    supplierId: 'S02',
    transporterId: 'T02',
    status: 10,
    eta: eta.toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    loadingCountry: ['NL', 'BE', 'DE', 'FR'][Math.floor(Math.random() * 4)],
    loadingCity: ['Amsterdam', 'Antwerpen', 'Hamburg', 'Parijs'][Math.floor(Math.random() * 4)],
    incoterm: 'EXW',
    readyForPickupDate: (new Date(eta.getTime() - 3 * 24 * 60 * 60 * 1000)).toISOString(),
    weight: Math.floor(Math.random() * 20000) + 5000,
    palletType: 'EUR',
    palletCount: Math.floor(Math.random() * 33) + 1,
    cargoType: 'Dry',
    containerNumber: `${generateRandomString(2).toUpperCase()}-${Math.floor(Math.random() * 90) + 10}-${generateRandomString(2).toUpperCase()}`,
    palletExchange: Math.random() > 0.5,
    documents: []
  };
}

const seedDemo = () => {
  console.log('Seeding Address Book (Suppliers, Transporters, Customers)...');
  
  const suppliers = [
    { id: 'S01', type: 'supplier', name: 'FreshFood BV', contact: 'Jan Smit', email: 'jan@freshfood.nl', address: 'Amsterdam' },
    { id: 'S02', type: 'supplier', name: 'Global Foods', contact: 'Anna V.', email: 'anna@global.com', address: 'Rotterdam' },
    { id: 'S03', type: 'supplier', name: 'Quality Meat', contact: 'Peter D.', email: 'peter@meat.nl', address: 'Utrecht' }
  ];
  
  const transporters = [
    { id: 'T01', type: 'transporter', name: 'FastLogistics', contact: 'Dirk', email: 'planning@fastlogistics.nl', address: 'Breda' },
    { id: 'T02', type: 'transporter', name: 'EuroTransport', contact: 'Eva', email: 'eva@eurotransport.com', address: 'Antwerpen' }
  ];

  const customers = [
    { id: 'C01', type: 'customer', name: 'Supermarkt X', contact: 'Tom', email: 'tom@supermarktx.nl', address: 'Den Haag' },
    { id: 'C02', type: 'customer', name: 'Horeca Groep NL', contact: 'Lisa', email: 'lisa@horeca.nl', address: 'Eindhoven' }
  ];

  [...suppliers, ...transporters, ...customers].forEach(entry => saveAddressBookEntry(entry as any));

  console.log('Seeding 150+ demo shipments (Pipeline & YMS & Pallets)...');
  
  const nowMs = Date.now();
  
  for (let i = 1; i <= 100; i++) {
    const delivery = generateContainerDelivery(i, 0);
    const isPast = new Date(delivery.eta!).getTime() < nowMs - 24 * 60 * 60 * 1000;
    
    if (isPast) {
      delivery.status = 100;
      if (delivery.palletExchange && delivery.palletCount) {
        savePalletTransaction({
          entityId: delivery.supplierId,
          entityType: 'supplier',
          deliveryId: delivery.id,
          balanceChange: delivery.palletCount // received pallets
        });
      }
    }
    
    insertDelivery(delivery);
    
    // YMS Data (only for nearby deliveries to avoid huge yard clogs)
    const etaMs = new Date(delivery.eta || nowMs).getTime();
    if (Math.abs(etaMs - nowMs) < 7 * 24 * 60 * 60 * 1000) {
      const ymsStatus = isPast ? 'COMPLETED' : ['PLANNED', 'GATE_IN', 'IN_YARD', 'DOCKED', 'UNLOADING', 'COMPLETED'][Math.floor(Math.random() * 6)];
      saveYmsDelivery({
        id: `YMS-${delivery.id}`,
        warehouseId: 'W01',
        reference: delivery.reference,
        supplier: suppliers.find(s => s.id === delivery.supplierId)?.name || 'Onbekend',
        supplierId: delivery.supplierId,
        mainDeliveryId: delivery.id,
        scheduledTime: delivery.eta,
        dockId: Math.floor(Math.random() * 20) + 1,
        registrationTime: new Date(nowMs - Math.random() * 3600000).toISOString(),
        arrivalTime: new Date(nowMs - Math.random() * 1800000).toISOString(),
        status: ymsStatus,
        isLate: Math.random() > 0.8,
        direction: 'INBOUND',
        palletCount: delivery.palletCount,
        licensePlate: delivery.containerNumber,
        isReefer: delivery.cargoType === 'Cool' ? 1 : 0,
        temperature: delivery.cargoType === 'Cool' ? 'Chilled' : 'Ambient'
      });
    }
  }
  
  for (let i = 1; i <= 60; i++) {
    const delivery = generateExWorksDelivery(i, 0);
    const isPast = new Date(delivery.eta!).getTime() < nowMs - 24 * 60 * 60 * 1000;
    
    if (isPast) {
      delivery.status = 100;
      if (delivery.palletExchange && delivery.palletCount) {
        savePalletTransaction({
          entityId: delivery.supplierId, // mapped to customerId conceptually
          entityType: 'customer',
          deliveryId: delivery.id,
          balanceChange: -delivery.palletCount // given pallets away
        });
      }
    }

    insertDelivery(delivery);
    
    const etaMs = new Date(delivery.eta || nowMs).getTime();
    if (Math.abs(etaMs - nowMs) < 7 * 24 * 60 * 60 * 1000) {
      const ymsStatus = isPast ? 'COMPLETED' : ['PLANNED', 'GATE_IN', 'IN_YARD', 'DOCKED', 'LOADING', 'COMPLETED'][Math.floor(Math.random() * 6)];
      saveYmsDelivery({
        id: `YMS-${delivery.id}`,
        warehouseId: 'W01',
        reference: delivery.reference,
        supplier: customers.find(s => s.id === delivery.supplierId)?.name || 'ILG Customer',
        supplierId: delivery.supplierId,
        mainDeliveryId: delivery.id,
        dockId: Math.floor(Math.random() * 20) + 1,
        scheduledTime: delivery.eta,
        registrationTime: new Date(nowMs - Math.random() * 3600000).toISOString(),
        status: ymsStatus,
        isLate: Math.random() > 0.8,
        direction: 'OUTBOUND',
        palletCount: delivery.palletCount,
        licensePlate: delivery.containerNumber,
        temperature: 'Ambient'
      });
    }
  }
  
  console.log('Seeding completed successfully.');
};

seedDemo();
