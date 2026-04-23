import http from "http";
import { WebSocketServer } from "ws";

/* =========================
   🌐 HTTP SERVER (Render needs this)
========================= */

const server = http.createServer((req, res) => {
  if (req.url === "/") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Ashinerland Multiplayer Server Running");
  }
});

/* =========================
   ⚡ WebSocket SERVER
========================= */

const wss = new WebSocketServer({ server });

let rooms = [];

/* =========================
   👥 CONNECTIONS
========================= */

wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("message", (msg) => {
    const data = JSON.parse(msg);

    /* 📋 GET ROOMS */
    if (data.type === "get_rooms") {
      ws.send(JSON.stringify({
        type: "rooms_list",
        rooms
      }));
    }

    /* 🏠 CREATE ROOM */
    if (data.type === "create_room") {
      const room = {
        id: Date.now().toString(),
        host: data.user,
        map: data.map,
        points: data.points,
        maxPlayers: data.players,
        players: [data.user]
      };

      rooms.push(room);

      broadcastRooms();
    }

    /* ➕ JOIN ROOM */
    if (data.type === "join_room") {
      const room = rooms.find(r => r.id === data.roomId);

      if (room && room.players.length < room.maxPlayers) {
        room.players.push(data.user);
        broadcastRooms();
      }
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});

/* =========================
   📡 BROADCAST ROOMS
========================= */

function broadcastRooms() {
  wss.clients.forEach(client => {
    client.send(JSON.stringify({
      type: "rooms_update",
      rooms
    }));
  });
}

/* =========================
   🚀 START SERVER (RENDER FIX)
========================= */

const PORT = process.env.PORT || 8000;

server.listen(PORT, "0.0.0.0", () => {
  console.log("🔥 Ashinerland multiplayer server running on port", PORT);
});