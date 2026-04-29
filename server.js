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
const normalize = (s) => (s || "").trim();

/* =========================
   BROADCAST
========================= */
function broadcast() {
    const payload = JSON.stringify({
        type: "rooms_list",   // 👈 ВАЖЛИВО: УНІФІКУЄМО
        rooms
    });

    wss.clients.forEach(client => {
        if (client.readyState === 1) {
            client.send(payload);
        }
    });
}

/* =========================
   FIND ROOM
========================= */
function findRoom(id) {
    return rooms.find(r => r.id === id);
}

/* =========================
   CONNECTIONS
========================= */
wss.on("connection", (ws) => {
    console.log("Client connected");

    ws.send(JSON.stringify({
        type: "rooms_list",
        rooms
    }));

    ws.on("message", (msg) => {
    let data = JSON.parse(msg);

    if (data.type === "start_game") { ... }

    // ❌ surrender у тебе ВИНЕСЕНИЙ НАЗОВНІ
});

if (data.type === "surrender") { ❌ НЕ ІСНУЄ data тут
}
✅ ПРАВИЛЬНО (FIX)

👉 ВСТАВ ЦЕ В СЕРВЕР всередину ws.on("message")

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
const normalize = (s) => (s || "").trim();

/* =========================
   BROADCAST
========================= */
function broadcast() {
    const payload = JSON.stringify({
        type: "rooms_list",   // 👈 ВАЖЛИВО: УНІФІКУЄМО
        rooms
    });

    wss.clients.forEach(client => {
        if (client.readyState === 1) {
            client.send(payload);
        }
    });
}

/* =========================
   FIND ROOM
========================= */
function findRoom(id) {
    return rooms.find(r => r.id === id);
}

/* =========================
   CONNECTIONS
========================= */
wss.on("connection", (ws) => {
    console.log("Client connected");

    ws.send(JSON.stringify({
        type: "rooms_list",
        rooms
    }));

    ws.on("message", (msg) => {
    let data = JSON.parse(msg);

    if (data.type === "start_game") { ... }
});

if (data.type === "surrender") {
    console.log("SURRENDER RECEIVED:", data);
✅ ПРАВИЛЬНО (FIX)

👉 ВСТАВ ЦЕ В СЕРВЕР всередину ws.on("message")

ws.on("message", (msg) => {

    let data;
    try {
        data = JSON.parse(msg);
    } catch {
        return;
    }

    /* =========================
       START GAME
    ========================= */
    if (data.type === "start_game") {
        const room = findRoom(data.roomId);
        if (!room) return;

        const user = normalize(data.user);

        if (normalize(room.host) !== user) return;

        room.status = "in_game";
        broadcast();
    }

    /* =========================
       SURRENDER (✔ FIXED)
    ========================= */
    if (data.type === "surrender") {

        const room = findRoom(data.roomId);
        if (!room) return;

        const user = normalize(data.user);

        // видаляємо гравця
        room.players = room.players.filter(p =>
            normalize(p.name) !== user
        );

        console.log(user, "surrendered");

        // 🏆 якщо залишився 1 гравець
        if (room.players.length === 1) {

            const winner = room.players[0];

            room.status = "finished";

            broadcast();

            wss.clients.forEach(client => {
                if (client.readyState === 1) {
                    client.send(JSON.stringify({
                        type: "game_win",
                        user: winner.name,
                        roomId: room.id
                    }));
                }
            });

            return;
        }

        broadcast();
    }

});
        /* GET ROOMS */
        if (data.type === "get_rooms") {
            ws.send(JSON.stringify({
                type: "rooms_list",
                rooms
            }));
        }

        /* CREATE ROOM */
        if (data.type === "create_room") {
            const user = normalize(data.user);

            const room = {
                id: Date.now().toString(),
                host: user,
                map: data.map,
                points: data.points,
                maxPlayers: Number(data.players),
                status: "lobby",
                players: [
                    {
                        name: user,
                        lineage: data.lineage,
                        image: data.image
                    }
                ]
            };

            rooms.push(room);
            broadcast();
        }

        /* JOIN ROOM */
        if (data.type === "join_room") {
            const room = findRoom(data.roomId);
            if (!room) return;

            const user = normalize(data.user);

            if (room.players.length >= room.maxPlayers) return;

            const exists = room.players.find(p => p.name === user);

            if (!exists) {
                room.players.push({
                    name: user,
                    lineage: data.lineage,
                    image: data.image || "default.jpg"
                });
            }

            broadcast();
        }
        /* LEAV ROOM */
if (data.type === "leave_room") {
    const room = findRoom(data.roomId);
    if (!room) return;

    const user = normalize(data.user);

    // якщо host виходить → видалити кімнату
    if (room.host === user) {
        rooms = rooms.filter(r => r.id !== data.roomId);
        broadcast();
        return;
    }

    // інакше просто видаляємо гравця
    room.players = room.players.filter(p => p.name !== user);

    broadcast();
}

        /* DELETE ROOM */
        if (data.type === "delete_room") {
            const room = findRoom(data.roomId);
            if (!room) return;

            const user = normalize(data.user);

            if (room.host !== user) return;

            rooms = rooms.filter(r => r.id !== data.roomId);

            broadcast();
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
/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 8000;

server.listen(PORT, "0.0.0.0", () => {
    console.log("Server running on port", PORT);
});
