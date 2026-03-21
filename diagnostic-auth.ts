import 'dotenv/config';
import { getUsers } from './src/db/queries';
import bcrypt from 'bcryptjs';

const testPasswords: Record<string, string | undefined> = {
  'admin@ilgfood.com': process.env.INITIAL_ADMIN_PASSWORD,
  'manager@ilgfood.com': process.env.INITIAL_MANAGER_PASSWORD,
  'staff@ilgfood.com': process.env.INITIAL_STAFF_PASSWORD,
  'test99@test.com': 'pwd' // This is just a test case, maybe also move to ENV if needed
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
