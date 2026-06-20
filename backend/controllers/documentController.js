const pool = require("../database");

const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ error: "No file uploaded. Please attach a PDF." });
    }

    const uploaderId = req.user.id;
    const { receiverId } = req.body;

    if (!receiverId) {
      return res.status(400).json({ error: "Receiver ID is missing." });
    }

    // File URL to save in db
    const fileUrl = `/uploads/documents/${req.file.filename}`;
    const fileName = req.file.originalname;

    const newDoc = await pool.query(
      `INSERT INTO documents (uploader_id, receiver_id, file_name, file_url, status) 
             VALUES ($1, $2, $3, $4, 'Pending Review') RETURNING *`,
      [uploaderId, receiverId, fileName, fileUrl],
    );

    res.status(201).json({
      message: "Document uploaded successfully",
      document: newDoc.rows[0],
    });
  } catch (err) {
    console.error("Document Upload Error:", err.message);
    res.status(500).json({ error: "Server error during file upload." });
  }
};

const getUserDocuments = async (req, res) => {
  const userId = req.user.id;
  try {
    const docs = await pool.query(
      `SELECT d.*, u.name as uploader_name 
             FROM documents d 
             JOIN users u ON d.uploader_id = u.id 
             WHERE d.uploader_id = $1 OR d.receiver_id = $1
             ORDER BY d.created_at DESC`,
      [userId],
    );
    res.status(200).json(docs.rows);
  } catch (err) {
    console.error("Fetch Documents Error:", err.message);
    res.status(500).json({ error: "Server error while fetching documents." });
  }
};
// Save E-Signature to Document
const signDocument = async (req, res) => {
  const { id } = req.params;
  const { signatureData } = req.body;
  const userId = req.user.id;

  console.log(
    `\n[SIGNATURE API] Request received for Document ID: ${id} by User ID: ${userId}`,
  );

  if (!signatureData) {
    console.log("[SIGNATURE API] Failed: Signature data is missing.");
    return res.status(400).json({ error: "Signature data is missing." });
  }

  try {
    console.log("[SIGNATURE API] Checking document authorization...");
    // Security Check
    const docCheck = await pool.query(
      "SELECT * FROM documents WHERE id = $1 AND (uploader_id = $2 OR receiver_id = $2)",
      [id, userId],
    );

    if (docCheck.rows.length === 0) {
      console.log(
        "[SIGNATURE API] Failed: Not authorized or document not found.",
      );
      return res
        .status(403)
        .json({
          error: "Document not found or you are not authorized to sign it.",
        });
    }

    console.log(
      "[SIGNATURE API] Document verified. Saving large base64 signature to Neon DB...",
    );

    // Update the document with signature and change status
    const updatedDoc = await pool.query(
      "UPDATE documents SET signature_data = $1, status = 'Signed' WHERE id = $2 RETURNING *",
      [signatureData, id],
    );

    console.log("[SIGNATURE API] SUCCESS! Signature saved in database.");
    res.status(200).json({
      message: "Document signed successfully",
      document: updatedDoc.rows[0],
    });
  } catch (err) {
    console.error("[SIGNATURE API] FATAL ERROR:", err.message);
    res.status(500).json({ error: "Server error while saving signature." });
  }
};

module.exports = { uploadDocument, getUserDocuments, signDocument };
