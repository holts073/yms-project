import { saveUser, getUsers } from './src/db/queries';
import bcrypt from 'bcryptjs';

async function restore() {
  console.log("Starting account restoration...");
  
  const accounts = [
    { email: 'admin@ilgfood.com', name: 'Admin', role: 'admin', password: 'admin123' },
    { email: 'manager@ilgfood.com', name: 'Logistics Manager', role: 'manager', password: 'manager123' },
    { email: 'staff@ilgfood.com', name: 'Staff User', role: 'staff', password: 'welkom123' }
  ];

  for (const acc of accounts) {
    const existing = getUsers().find(u => u.email === acc.email);
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(acc.password, salt);
    
    const userData = {
      id: existing?.id || Math.random().toString(36).substr(2, 9),
      name: acc.name,
      email: acc.email,
      role: acc.role as any,
      passwordHash: hash
    };
    
    saveUser(userData);
    console.log(`Restored: ${acc.email} with password: ${acc.password}`);
  }
  
  console.log("Restoration complete.");
}

restore().catch(console.error);
