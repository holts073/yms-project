import { getUsers } from './src/db/queries';
import bcrypt from 'bcryptjs';

const testPasswords: Record<string, string> = {
  'admin@ilgfood.com': 'admin123',
  'manager@ilgfood.com': 'manager123',
  'staff@ilgfood.com': 'welkom123',
  'test99@test.com': 'pwd'
};

async function run() {
  const users = getUsers();
  console.log("Current Users in DB:");
  for (const user of users) {
    const expectedPwd = testPasswords[user.email] || 'none';
    let isValid = false;
    if (user.passwordHash) {
      isValid = bcrypt.compareSync(expectedPwd, user.passwordHash);
    }
    console.log(`- Email: ${user.email}`);
    console.log(`  Hash: ${user.passwordHash}`);
    console.log(`  Expected Pwd (for test): ${expectedPwd}`);
    console.log(`  Bcrypt Check: ${isValid ? 'MATCH' : 'FAIL'}`);
  }
}

run();
