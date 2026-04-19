import fetch from 'node-fetch';
import { io } from 'socket.io-client';

async function checkLoad() {
  console.log("Logging in...");
  const res = await fetch("http://localhost:3000/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "manager@ilgfood.com", password: "manager123" })
  });
  const data = await res.json();
  if(!data.token) return console.log("NO TOKEN", data);
  console.log("Logged in, token received");
  
  const start = Date.now();
  const socket = io("http://localhost:3000", { auth: { token: data.token } });
  socket.on("connect", () => console.log("Socket connected in", Date.now() - start, "ms"));
  socket.on("init", (state) => {
    console.log("State init received in", Date.now() - start, "ms");
    console.log("Deliveries count:", state.deliveries?.length, "YMS count:", state.yms?.deliveries?.length);
    process.exit(0);
  });
  socket.on("connect_error", (err) => {
    console.log("error", err.message);
  });
}

checkLoad().catch(console.error);
