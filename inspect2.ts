import { getYmsDeliveries } from './src/db/queries';

console.log("YMS deliveries:", getYmsDeliveries().length);
const sample = getYmsDeliveries().find(d => true);
console.log("Sample YMS delivery:", sample);
