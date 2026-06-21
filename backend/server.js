const express = require("express");
const cors = require("cors");
const compression = require("compression");
require("dotenv").config();
const pool = require("./database");
const { encrypt } = require("./utils/encryption");

// Route Imports
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const meetingRoutes = require("./routes/meetingRoutes");
const documentRoutes = require("./routes/documentRoutes");
const messageRoutes = require("./routes/messageRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

// Core Node Modules for WebSockets
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const PORT = process.env.PORT || 5000;

// ==========================================
// MIDDLEWARE CONFIGURATION
// ==========================================
app.use(
  cors({
    origin: [
      "https://nexus-plateform-taupe.vercel.app",
      "http://localhost:5173",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  }),
);
app.use(compression()); // GZip compression for API response optimization
app.use(express.json({ limit: "10mb" })); // Allowed large payload for base64 signatures
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Automated keep-alive config to prevent Neon DB connection drops
app.use((req, res, next) => {
  res.set("Connection", "keep-alive");
  next();
});

// ==========================================
// REST API ROUTES
// ==========================================
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/meetings", meetingRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationRoutes);
// Expose uploads folder to public for document viewing
app.use("/uploads", express.static("uploads"));

// Basic Server Health Check Route
app.get("/", (req, res) => {
  res.send("Nexus Backend API is running and optimized.");
});

// ==========================================
// WEBSOCKET ENGINE SETUP
// ==========================================
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      "https://nexus-plateform-taupe.vercel.app",
      "http://localhost:5173",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Online Directory to map Database User IDs to Live Socket IDs
const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log(`[SYSTEM] New raw connection established: ${socket.id}`);

  // ------------------------------------------
  // MILESTONE 4: VIDEO MEETINGS (WebRTC)
  // ------------------------------------------

  // Triggered when a user clicks 'Join Video Call'
  socket.on("join-room", (roomId, userId) => {
    socket.join(roomId);
    console.log(`[VIDEO] User ${userId} joined room ${roomId}`);

    // Notify others in the room that a new user has arrived
    socket.to(roomId).emit("user-connected", userId);

    // Dedicated disconnect listener for the video room
    socket.on("disconnect", () => {
      socket.to(roomId).emit("user-disconnected", userId);
    });
  });

  // ------------------------------------------
  // MILESTONE 6: REAL-TIME CHAT SYSTEM
  // ------------------------------------------
  // 1. User Login / App Open
  socket.on("register-user", (userId) => {
    const stringId = String(userId);
    onlineUsers.set(stringId, socket.id);
    console.log(`[CHAT] User ${stringId} is ONLINE`);

    // Broadcast to EVERYONE else
    io.emit("user-status-change", { userId: stringId, isOnline: true });

    socket.emit("online-users-list", Array.from(onlineUsers.keys()));
  });

  // 2. Sending Messages & Triggers
  socket.on("send-private-message", async (data) => {
    const receiverSocketId = onlineUsers.get(String(data.receiverId));

    // Encrypt the actual message content
    const cipherText = encrypt(data.content);

    // ACTION 1: Save the actual message to the MESSAGES table (ENCRYPTED)
    try {
      await pool.query(
        "INSERT INTO messages (sender_id, receiver_id, content) VALUES ($1, $2, $3)",
        [data.senderId, data.receiverId, cipherText],
      );
    } catch (err) {
      console.error("[MESSAGE API] Error saving encrypted message:", err);
    }

    // ACTION 2: Save Notification to Database (PLAIN TEXT ALERT)
    try {
      await pool.query(
        "INSERT INTO notifications (user_id, sender_id, message, type) VALUES ($1, $2, $3, $4)",
        [data.receiverId, data.senderId, "sent you a new message", "message"], // Yahan cipherText NAHI aayega
      );
    } catch (err) {
      console.error("[NOTIFICATION API] Error saving notification:", err);
    }

    // ACTION 3: Live Socket Emits
    if (receiverSocketId) {
      // Send the actual message (Live socket gets the plain 'data' so UI renders instantly without decryption logic on frontend)
      socket.to(receiverSocketId).emit("receive-private-message", data);

      // Emit the Live Notification Trigger
      socket.to(receiverSocketId).emit("new-notification", {
        message: `sent you a new message`,
        type: "message",
        senderId: data.senderId,
      });
      console.log(
        `[CHAT] Delivered instantly from ${data.senderId} to ${data.receiverId}`,
      );
    } else {
      console.log(
        `[CHAT] User ${data.receiverId} is offline. Saved encrypted to DB.`,
      );
    }
  });

  // ------------------------------------------
  // GLOBAL DISCONNECT HANDLER
  // ------------------------------------------
  socket.on("disconnect", () => {
    console.log(`[SYSTEM] Connection lost: ${socket.id}`);

    // Scan the directory and remove the user if they go offline
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        console.log(
          `[CHAT] User ${userId} went OFFLINE. Removed from active directory.`,
        );
        io.emit("user-status-change", {
          userId: String(userId),
          isOnline: false,
        });
        break;
      }
    }
  });
});

// ==========================================
// SERVER BOOT LOGIC
// ==========================================
server.listen(PORT, () => {
  console.log(`Server & WebSocket Engine running smoothly on port ${PORT}`);
});
