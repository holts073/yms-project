import { saveUser, getUsers } from './src/db/queries';
import bcrypt from 'bcryptjs';

async function verify() {
  console.log("Verifying fix...");
  
  // 1. Create a new user with a password
  const testId = 'test-fix-' + Math.random().toString(36).substr(2, 5);
  const salt = bcrypt.genSaltSync(10);
  const initialHash = bcrypt.hashSync('initial-pwd', salt);
  
  const newUser = {
    id: testId,
    name: 'Test Fix',
    email: testId + '@test.com',
    role: 'staff' as any,
    passwordHash: initialHash
  };
  
  saveUser(newUser);
  console.log("Created test user with password.");
  
  // 2. Perform an "update" without a password (simulating frontend role change)
  const updateData = {
    id: testId,
    name: 'Test Fix Updated',
    email: testId + '@test.com',
    role: 'manager' as any,
    // passwordHash is omitted to simulate the bug scenario
  };
  
  saveUser(updateData as any);
  console.log("Performed update without password hash.");
  
  // 3. Verify hash is still there
  const result = getUsers().find(u => u.id === testId);
  if (result && result.passwordHash === initialHash) {
    console.log("SUCCESS: Password hash was preserved!");
  } else {
    console.error("FAILURE: Password hash was lost or changed!", result?.passwordHash);
    process.exit(1);
  }
}

verify().catch(console.error);
