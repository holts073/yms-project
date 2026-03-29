import { getUsers } from './src/db/queries';
import { User } from './src/types';

const users: User[] = getUsers();
const admin = users.find((u: User) => u.email === 'admin@ilgfood.com');

console.log('--- ADMIN GEBRUIKERSGEGEVENS ---');
console.log(JSON.stringify(admin, null, 2));
