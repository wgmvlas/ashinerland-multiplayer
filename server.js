import { Server, Origins } from "boardgame.io/dist/cjs/server.js";

const server = Server({
  games: [],
  origins: [Origins.LOCALHOST],
});

server.run(8000);

console.log("Ashinerland multiplayer server running on port 8000");