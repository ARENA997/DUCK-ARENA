const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public")));

const rooms = new Map();
const capacity = mode => mode === "X2" ? 4 : 2;

function publicRoom(room) {
  return { id: room.id, mode: room.mode, host: room.host,
    players: room.players.map(p => p.nick), count: room.players.length,
    max: capacity(room.mode), status: room.players.length === capacity(room.mode) ? "CHEIA" : "AGUARDANDO" };
}
function broadcastRooms() {
  io.emit("rooms:update", [...rooms.values()].map(publicRoom));
}

io.on("connection", socket => {
  socket.emit("rooms:update", [...rooms.values()].map(publicRoom));

  socket.on("room:create", ({nick, mode}) => {
    nick = String(nick || "Jogador").trim().slice(0,18);
    mode = mode === "X2" ? "X2" : "X1";
    const id = Math.random().toString(36).slice(2,8).toUpperCase();
    const room = {id, mode, host:nick, players:[{sid:socket.id,nick}]};
    rooms.set(id, room);
    socket.join(id);
    socket.emit("room:joined", publicRoom(room));
    broadcastRooms();
  });

  socket.on("room:join", ({id,nick}) => {
    const room = rooms.get(String(id || "").toUpperCase());
    if (!room) return socket.emit("notice","Sala não encontrada.");
    if (room.players.length >= capacity(room.mode)) return socket.emit("notice","Sala cheia!");
    if (room.players.some(p=>p.sid===socket.id)) return;
    nick = String(nick || "Jogador").trim().slice(0,18) || "Jogador";
    room.players.push({sid:socket.id,nick});
    socket.join(room.id);
    io.to(room.id).emit("room:joined", publicRoom(room));
    broadcastRooms();
    if(room.players.length===capacity(room.mode)) io.to(room.id).emit("notice","🔥 SALA COMPLETA! Combina o X1/X2 no Roblox.");
  });

  socket.on("room:leave", () => leaveRoom(socket));
  socket.on("disconnect", () => leaveRoom(socket));
});
function leaveRoom(socket) {
  for (const [id, room] of rooms) {
    const before=room.players.length;
    room.players=room.players.filter(p=>p.sid!==socket.id);
    if(room.players.length===0) rooms.delete(id);
    else if(before!==room.players.length) io.to(id).emit("room:joined", publicRoom(room));
  }
  broadcastRooms();
}
server.listen(PORT, () => console.log(`DUCK ARENA rodando em http://localhost:${PORT}`));
