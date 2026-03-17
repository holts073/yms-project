import { io } from "socket.io-client";
const socket = io("http://localhost:3001");
socket.on("connect", () => {
  socket.emit("action", {
    type: "ADD_USER",
    payload: { id: "testuser99", name: "Test 99", email: "test99@test.com", password: "pwd", role: "staff", permissions: {} },
    user: { name: "Admin" }
  });
  setTimeout(() => process.exit(0), 1000);
});
