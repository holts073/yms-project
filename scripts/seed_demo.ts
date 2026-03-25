import { insertDelivery } from '../src/db/queries';
import { Delivery } from '../src/types';

function generateRandomString(length: number) {
  return Math.random().toString(36).substr(2, length).toUpperCase();
}

function getRandomDate(start: Date, end: Date) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generateContainerDelivery(i: number): Delivery {
  const eta = getRandomDate(new Date(), new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)); // Next 14 days
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

function generateExWorksDelivery(i: number): Delivery {
  const eta = getRandomDate(new Date(), new Date(Date.now() + 14 * 24 * 60 * 60 * 1000));
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
  console.log('Seeding 50 demo shipments...');
  
  for (let i = 1; i <= 30; i++) {
    insertDelivery(generateContainerDelivery(i));
  }
  
  for (let i = 1; i <= 20; i++) {
    insertDelivery(generateExWorksDelivery(i));
  }
  
  console.log('Seeding completed successfully.');
};

seedDemo();
