const express = require("express");
const router = express.Router();
const {
  sendMessage,
  getConversation,
  getChatContacts,
} = require("../controllers/messageController");
const authMiddleware = require("../middleware/authMiddleware");

// Security Check: only authenticated users can access messaging routes
router.use(authMiddleware);

// Route ordering is critical. Specific routes must come before dynamic parameterized routes
router.get("/contacts", getChatContacts);
router.post("/", sendMessage);
router.get("/:otherUserId", getConversation);

module.exports = router;
