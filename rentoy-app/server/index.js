import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// Servidor HTTP
const server = http.createServer(app);

// Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Evento de conexión
io.on("connection", (socket) => {
  console.log("Jugador conectado:", socket.id);

  socket.on("disconnect", () => {
    console.log("Jugador desconectado:", socket.id);
  });
});

// Puerto dinámico para Railway
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("Servidor funcionando en puerto " + PORT);
});
