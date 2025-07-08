const { Server } = require("socket.io");
const express = require("express");
const bodyParser = require("body-parser");

const PORT = process.env.PORT || 9092;

const io = new Server({ cors: { origin: "*" } });
const app = express();

app.use(bodyParser.json());

// ✅ REST endpoint to emit event to specific room
app.post("/emit", (req, res) => {
  const { type, room, payload } = req.body;

  if (!type || !room || !payload) {
    return res.status(400).send("Missing parameters");
  }

  console.log(`📤 Emitting event '${type}' to room '${room}'`);
  io.to(room).emit(type, payload);

  res.send("Event emitted");
});

// ✅ Handle socket connection
io.on("connection", (socket) => {
  const { type, id } = socket.handshake.query;
  console.log(`🟢 Client connected: type=${type}, id=${id}`);

  if (type && id) {
    socket.join(`${type}:${id}`);
  }

  socket.on("disconnect", () => {
    console.log(`🔴 Client disconnected: ${id}`);
  });
});

// ✅ Start servers
io.listen(PORT);
app.listen(3000, () => {
  console.log("🌐 REST API listening on port 3000");
});
console.log(`✅ Socket.IO Server listening on port ${PORT}`);

