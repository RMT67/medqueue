const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  });

  // Setup Socket.IO
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_SOCKET_URL || "*",
      methods: ["GET", "POST"],
      credentials: true
    },
    transports: ["websocket", "polling"]
  });

  // Socket.IO authentication middleware
  io.use((socket, next) => {
      const token = socket.handshake.auth.token;
      if (!token) {
          return next(new Error("Authentication error"));
      }
      
      try {
          const JWT_SECRET = process.env.JWT_SECRET;
          if (!JWT_SECRET) {
              return next(new Error("JWT_SECRET not configured"));
          }
          
          const decoded = jwt.verify(token, JWT_SECRET);
          socket.data.userId = decoded.userId;
          socket.data.role = decoded.role;
          next();
      } catch (err) {
          next(new Error("Authentication error"));
      }
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id, socket.data.userId);

    // Join queue room
    socket.on("join:queue", ({ bookingId }) => {
      if (!bookingId) return;
      const room = `queue:${bookingId}`;
      socket.join(room);
      console.log(`Socket ${socket.id} joined room: ${room}`);
    });

    // Leave queue room
    socket.on("leave:queue", ({ bookingId }) => {
      if (!bookingId) return;
      const room = `queue:${bookingId}`;
      socket.leave(room);
      console.log(`Socket ${socket.id} left room: ${room}`);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  // Export io instance for use in API routes
  global.io = io;

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
      console.log(`> Socket.IO server running on port ${port}`);
    });
});

