const express = require('express');
const cors = require('cors');
const compression = require('compression');
require('dotenv').config();
const pool = require('./database');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require("./routes/userRoutes");
const meetingRoutes = require("./routes/meetingRoutes");
const http = require("http");
const { Server } = require("socket.io");
const documentRoutes = require("./routes/documentRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(compression()); // GZip compression for API response optimization
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true })); // Parses incoming JSON requests

// Automated keep-alive config
app.use((req, res, next) => {
    res.set('Connection', 'keep-alive');
    next();
});

app.use('/api/auth', authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/meetings", meetingRoutes);
app.use("/uploads", express.static("uploads"));
app.use("/api/documents", documentRoutes);
// Basic Test Route
app.get('/', (req, res) => {
    res.send('Nexus Backend API is running and optimized.');
});

const server = http.createServer(app);

// 2. Socket.IO 
const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"],
  },
});

// 3. WebRTC Signaling Logic
io.on("connection", (socket) => {
  console.log("A user connected for video call:", socket.id);

  // Whenever a user join meeting room
  socket.on("join-room", (roomId, userId) => {
    socket.join(roomId);
    console.log(`User ${userId} joined room ${roomId}`);
    
    // To show new member in the room
    socket.to(roomId).emit("user-connected", userId);

    // when user disconnect call
    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
      socket.to(roomId).emit("user-disconnected", userId);
    });
  });
});
// Start Server
server.listen(PORT, () => {
    console.log(`Server running smoothly on port ${PORT}`);
});