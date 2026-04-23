import http from "http";
import { WebSocketServer } from "ws";

/* =========================
   HTTP (Render requirement)
========================= */
const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end("Ashinerland Multiplayer Server Running");
});

/* =========================
   WS SERVER
========================= */
const wss = new WebSocketServer({ server });

let rooms = [];

/* =========================
   HELPERS
========================= */
const normalize = (s) => (s || "").trim().toLowerCase();

/* =========================
   BROADCAST
========================= */
function broadcast() {
    const payload = JSON.stringify({
        type: "rooms_update",
        rooms
    });

    wss.clients.forEach(client => {
        if (client.readyState === 1) {
            client.send(payload);
        }
    });
}

/* =========================
   GET ROOM
========================= */
function getRoom(roomId) {
    return rooms.find(r => r.id === roomId);
}

/* =========================
   CONNECTION
========================= */
wss.on("connection", (ws) => {
    console.log("Client connected");

    /* ---------- MESSAGE ---------- */
    ws.on("message", (msg) => {
        let data;

        try {
            data = JSON.parse(msg);
        } catch (e) {
            console.log("Bad JSON");
            return;
        }

        /* =========================
           GET ROOMS
        ========================= */
        if (data.type === "get_rooms") {
            ws.send(JSON.stringify({
                type: "rooms_list",
                rooms
            }));
        }

        /* =========================
           CREATE ROOM
        ========================= */
        if (data.type === "create_room") {
            const user = normalize(data.user);

            const room = {
                id: Date.now().toString(),
                host: user,
                map: data.map,
                points: data.points,
                maxPlayers: Number(data.players),
                players: [user]
            };

            rooms.push(room);
            broadcast();
        }

        /* =========================
           JOIN ROOM
        ========================= */
        if (data.type === "join_room") {
            const room = getRoom(data.roomId);
            const user = normalize(data.user);

            if (!room) return;

            if (room.players.length >= room.maxPlayers) return;

            if (!room.players.includes(user)) {
                room.players.push(user);
            }

            broadcast();
        }

        /* =========================
           DELETE ROOM
        ========================= */
        if (data.type === "delete_room") {
            const roomIndex = rooms.findIndex(r => r.id === data.roomId);

            if (roomIndex === -1) return;

            const room = rooms[roomIndex];
            const user = normalize(data.user);

            if (room.host !== user) return;

            rooms.splice(roomIndex, 1);
            broadcast();
        }
    });

    /* =========================
       DISCONNECT (optional cleanup later)
    ========================= */
    ws.on("close", () => {
        console.log("Client disconnected");
    });
});

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 8000;

server.listen(PORT, "0.0.0.0", () => {
    console.log("Server running on port", PORT);
});
