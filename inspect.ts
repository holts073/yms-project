import { getDeliveries, getAllDeliveries } from './src/db/queries';

console.log("Active deliveries:", getDeliveries(1, 15, '', 'all', 'eta', true).total);
console.log("All deliveries:", getAllDeliveries().length);
