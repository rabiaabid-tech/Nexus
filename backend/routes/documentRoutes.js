const express = require("express");
const router = express.Router();
const {
  uploadDocument,
  getUserDocuments, signDocument
} = require("../controllers/documentController");
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware"); 

router.use(authMiddleware);

// expect single file with field name "document"
router.post("/upload", upload.single("document"), uploadDocument);
router.get("/", getUserDocuments);
router.put("/:id/sign", signDocument);

module.exports = router;
