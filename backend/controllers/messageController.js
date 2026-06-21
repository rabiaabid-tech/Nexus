const pool = require("../database");
const { decrypt } = require("../utils/encryption");

// 1. Send a Message (Save to DB)
const sendMessage = async (req, res) => {
  const { receiverId, content } = req.body;
  const senderId = req.user.id;

  if (!receiverId || !content) {
    return res
      .status(400)
      .json({
        error: "Receiver ID and message content are strictly required.",
      });
  }

  try {
    const newMessage = await pool.query(
      "INSERT INTO messages (sender_id, receiver_id, content) VALUES ($1, $2, $3) RETURNING *",
      [senderId, receiverId, content],
    );
    res.status(201).json(newMessage.rows[0]);
  } catch (err) {
    console.error("[MESSAGE API] Error saving message:", err.message);
    res.status(500).json({ error: "Server error while saving the message." });
  }
};

// 2. Fetch Chat History Between Two Users
const getConversation = async (req, res) => {
  const { otherUserId } = req.params;
  const userId = req.user.id;

  try {
    const messages = await pool.query(
      `SELECT id, sender_id, receiver_id, content, is_read, 
             TO_CHAR(created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at 
             FROM messages 
             WHERE (sender_id = $1 AND receiver_id = $2) 
             OR (sender_id = $2 AND receiver_id = $1) 
             ORDER BY created_at ASC`,
      [userId, otherUserId],
    );
    const decryptedMessages = messages.rows.map((msg) => ({
      ...msg,
      content: decrypt(msg.content),
    }));

    res.status(200).json(decryptedMessages);
  } catch (err) {
    console.error("[MESSAGE API] Error fetching conversation:", err.message);
    res
      .status(500)
      .json({ error: "Server error while fetching chat history." });
  }
};

// 3. Fetch List of Users you have chatted with (For Chat Sidebar)
const getChatContacts = async (req, res) => {
  const userId = req.user.id;

  try {
    // Advanced SQL: Get distinct users where the current user is either sender or receiver
    const contacts = await pool.query(
      `SELECT DISTINCT u.id, u.name, u.role, u.avatar_url 
             FROM users u 
             JOIN messages m ON u.id = m.sender_id OR u.id = m.receiver_id 
             WHERE (m.sender_id = $1 OR m.receiver_id = $1) AND u.id != $1`,
      [userId],
    );
    res.status(200).json(contacts.rows);
  } catch (err) {
    console.error("[MESSAGE API] Error fetching contacts:", err.message);
    res
      .status(500)
      .json({ error: "Server error while fetching contact list." });
  }
};

module.exports = { sendMessage, getConversation, getChatContacts };
