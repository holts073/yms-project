import { io } from "socket.io-client";
const socket = io("http://localhost:3000");

socket.on("connect", () => {
  console.log("Connected to server");
  
  const payload = {
    id: "randomid123",
    name: "New Admin",
    email: "newadmin@test.com",
    password: "password123",
    role: "admin",
    permissions: {}
  };
  
  socket.emit("action", {
    type: "ADD_USER",
    payload,
    user: { name: "System Admin" }
  });
  
  console.log("Emitted ADD_USER");
});

socket.on("state_update", (state) => {
  console.log("Received state_update, user count:", state.users?.length);
  const found = state.users.find(u => u.email === "newadmin@test.com");
  if (found) {
    console.log("User successfully added!");
  } else {
    console.log("User not found in state_update!");
  }
  process.exit(0);
});
