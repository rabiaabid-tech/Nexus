const express = require("express");
const router = express.Router();
const {
  getNotifications,
  markAllAsRead,
} = require("../controllers/notificationController");
const authMiddleware = require("../middleware/authMiddleware");

// Security Check: Only authenticated users can access notifications
router.use(authMiddleware);

// Routes
// GET /api/notifications - Get all notifications for current user
router.get("/", getNotifications);

// POST /api/notifications/read - Mark all as read
router.post("/read", markAllAsRead);

module.exports = router;
