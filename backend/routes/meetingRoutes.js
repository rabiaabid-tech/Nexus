const express = require("express");
const router = express.Router();
const {
  requestMeeting,
  getUserMeetings,
  updateMeetingStatus,
} = require("../controllers/meetingController");

const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware);

// Routes
router.post("/request", requestMeeting);
router.get("/", getUserMeetings);
router.put("/:id/status", updateMeetingStatus);

module.exports = router;
