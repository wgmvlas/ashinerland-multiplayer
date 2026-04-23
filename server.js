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
const clean = (s) => (s || "").trim().toLowerCase();

/* =========================
   BROADCAST
========================= */
function broadcast() {
    wss.clients.forEach(client => {
        if (client.readyState === 1) {
            client.send(JSON.stringify({
                type: "rooms_update",
                rooms
            }));
        }
    });
}

/* =========================
   CONNECTIONS
========================= */
wss.on("connection", (ws) => {
    console.log("Client connected");

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
            const room = {
                id: Date.now().toString(),
                host: clean(data.user),
                map: data.map,
                points: data.points,
                maxPlayers: Number(data.players),
                players: [clean(data.user)]
            };

            rooms.push(room);
            broadcast();
        }

        /* =========================
           JOIN ROOM
        ========================= */
        if (data.type === "join_room") {
            const room = rooms.find(r => r.id === data.roomId);

            if (room && room.players.length < room.maxPlayers) {
                const user = clean(data.user);

                if (!room.players.includes(user)) {
                    room.players.push(user);
                }

                broadcast();
            }
        }

        /* =========================
           DELETE ROOM
        ========================= */
        if (data.type === "delete_room") {
            const roomIndex = rooms.findIndex(r => r.id === data.roomId);

            if (roomIndex === -1) return;

            const room = rooms[roomIndex];

            console.log("DELETE REQUEST:", data);

            if (room.host === clean(data.user)) {
                rooms.splice(roomIndex, 1);
                console.log("ROOM DELETED");
                broadcast();
            } else {
                console.log("NOT HOST - DENIED");
            }
        }
    });

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
