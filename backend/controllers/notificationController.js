const pool = require("../database");

const getNotifications = async (req, res) => {
  try {
    const notifications = await pool.query(
      `SELECT n.id, n.type, n.message, n.is_read, n.sender_id, 
             TO_CHAR(n.created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at, 
             u.name as sender_name, u.avatar_url as sender_avatar 
             FROM notifications n 
             LEFT JOIN users u ON n.sender_id = u.id 
             WHERE n.user_id = $1 
             ORDER BY n.created_at DESC`,
      [req.user.id],
    );
    res.json(notifications.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    await pool.query(
      "UPDATE notifications SET is_read = TRUE WHERE user_id = $1",
      [req.user.id],
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to update status" });
  }
};

module.exports = { getNotifications, markAllAsRead };
