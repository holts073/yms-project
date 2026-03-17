import { saveUser } from './src/db/queries';

try {
  saveUser({
    id: "test12347",
    name: "Test User",
    email: "test8@test.test",
    passwordHash: "dummyhash",
    role: "staff",
    permissions: {}
  });
  console.log("Success");
} catch (e) {
  console.error("DB Error:", e);
}
