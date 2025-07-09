const { Server } = require("socket.io");
const express = require("express");
const bodyParser = require("body-parser");

const SOCKET_PORT = process.env.SOCKET_PORT || 9092;
const REST_PORT = process.env.REST_PORT || 3000;

const io = new Server({ cors: { origin: "*" } });
const app = express();

app.use(bodyParser.json());

/**
 * REST endpoint to emit an event.
 * You can send:
 *  room = "driver:user_abc"   => send to one driver
 *  room = "drivers_nearby"    => send to all in broadcast room
 */
app.post("/emit", (req, res) => {
  const { type, room, payload } = req.body;

  if (!type || !room || !payload) {
    console.error("❌ Missing parameters in /emit", req.body);
    return res.status(400).send("Missing parameters");
  }

  console.log(`📤 Emitting [${type}] to room [${room}]`);
  io.to(room).emit(type, payload);

  res.send("✅ Event emitted");
});

/**
 * Handle socket connections
 */
io.on("connection", (socket) => {
  const { type, id } = socket.handshake.query;

  if (!type || !id) {
    console.warn(`⚠️ Client connected without type or id`);
    socket.disconnect();
    return;
  }

  const individualRoom = `${type}:${id}`;
  const broadcastRoom = `${type}s_nearby`;

  console.log(`🟢 Client connected: type=${type}, id=${id}`);
  socket.join(individualRoom);
  socket.join(broadcastRoom);

  console.log(`🚪 Joined rooms: [${individualRoom}], [${broadcastRoom}]`);
  console.log(`📋 Current socket rooms:`, Array.from(socket.rooms));

  socket.on("disconnect", () => {
    console.log(`🔴 Client disconnected: type=${type}, id=${id}`);
  });
});

/**
 * Start servers
 */
io.listen(SOCKET_PORT, () => {
  console.log(`✅ Socket.IO Server listening on port ${SOCKET_PORT}`);
});

app.listen(REST_PORT, () => {
  console.log(`🌐 REST API listening on port ${REST_PORT}`);
});
