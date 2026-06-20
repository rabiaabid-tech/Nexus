const pool = require("../database");

// 1. Request a New Meeting (With Conflict Detection)
const requestMeeting = async (req, res) => {
  const senderId = req.user.id;
  const { receiverId, title, description, meetingDate, startTime, endTime } =
    req.body;

  if (!receiverId || !title || !meetingDate || !startTime || !endTime) {
    return res
      .status(400)
      .json({ error: "All required fields must be provided." });
  }

  if (senderId === receiverId) {
    return res
      .status(400)
      .json({ error: "You cannot request a meeting with yourself." });
  }

  try {
    // CONFLICT DETECTION LOGIC: Check if receiver already has an 'Accepted' meeting overlapping with this time
    const conflictQuery = `
            SELECT id FROM meetings 
            WHERE (sender_id = $1 OR receiver_id = $1) 
            AND meeting_date = $2 
            AND status = 'Accepted'
            AND (start_time < $4 AND end_time > $3)
        `;

    // $1=receiverId, $2=meetingDate, $3=startTime, $4=endTime
    const conflictCheck = await pool.query(conflictQuery, [
      receiverId,
      meetingDate,
      startTime,
      endTime,
    ]);

    if (conflictCheck.rows.length > 0) {
      return res
        .status(409)
        .json({
          error:
            "The user is already busy at this time. Please choose another slot.",
        });
    }

    // Insert new meeting if no conflict
    const newMeeting = await pool.query(
      `INSERT INTO meetings (sender_id, receiver_id, title, description, meeting_date, start_time, end_time, status) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, 'Pending') RETURNING *`,
      [
        senderId,
        receiverId,
        title,
        description,
        meetingDate,
        startTime,
        endTime,
      ],
    );

    res
      .status(201)
      .json({
        message: "Meeting requested successfully.",
        meeting: newMeeting.rows[0],
      });
  } catch (err) {
    console.error("Meeting Request Error:", err.message);
    res.status(500).json({ error: "Server error while requesting meeting." });
  }
};

// 2. Get All Meetings for the Logged-in User
const getUserMeetings = async (req, res) => {
  const userId = req.user.id;

  try {
    const query = `
            SELECT 
                m.id, m.title, m.description, m.meeting_date AS "meetingDate", 
                m.start_time AS "startTime", m.end_time AS "endTime", m.status,
                sender.id AS "senderId", sender.name AS "senderName", sender.avatar_url AS "senderAvatar",
                receiver.id AS "receiverId", receiver.name AS "receiverName", receiver.avatar_url AS "receiverAvatar"
            FROM meetings m
            JOIN users sender ON m.sender_id = sender.id
            JOIN users receiver ON m.receiver_id = receiver.id
            WHERE m.sender_id = $1 OR m.receiver_id = $1
            ORDER BY m.meeting_date ASC, m.start_time ASC
        `;

    const meetings = await pool.query(query, [userId]);
    res.status(200).json(meetings.rows);
  } catch (err) {
    console.error("Get Meetings Error:", err.message);
    res.status(500).json({ error: "Server error while fetching meetings." });
  }
};

// 3. Update Meeting Status (Accept / Reject / Cancel)
const updateMeetingStatus = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params; // Meeting ID
  const { status } = req.body; // 'Accepted', 'Rejected', 'Canceled'

  if (!["Accepted", "Rejected", "Canceled"].includes(status)) {
    return res.status(400).json({ error: "Invalid status." });
  }

  try {
    // Fetch the meeting to verify ownership
    const meetingResult = await pool.query(
      "SELECT * FROM meetings WHERE id = $1",
      [id],
    );

    if (meetingResult.rows.length === 0) {
      return res.status(404).json({ error: "Meeting not found." });
    }

    const meeting = meetingResult.rows[0];

    // Authorization check: Only receiver can Accept/Reject. Only sender can Cancel.
    if (
      (status === "Accepted" || status === "Rejected") &&
      meeting.receiver_id !== userId
    ) {
      return res
        .status(403)
        .json({
          error: "Only the receiver can accept or reject this meeting.",
        });
    }
    if (status === "Canceled" && meeting.sender_id !== userId) {
      return res
        .status(403)
        .json({ error: "Only the sender can cancel this meeting." });
    }

    // Update the status
    const updatedMeeting = await pool.query(
      "UPDATE meetings SET status = $1 WHERE id = $2 RETURNING *",
      [status, id],
    );

    res
      .status(200)
      .json({
        message: `Meeting ${status.toLowerCase()} successfully.`,
        meeting: updatedMeeting.rows[0],
      });
  } catch (err) {
    console.error("Update Meeting Error:", err.message);
    res
      .status(500)
      .json({ error: "Server error while updating meeting status." });
  }
};

module.exports = { requestMeeting, getUserMeetings, updateMeetingStatus };
