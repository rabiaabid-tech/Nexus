const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure directory exists
const dir = "./uploads/documents";
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/documents/"); // File will save here
  },
  filename: function (req, file, cb) {
    // timestamp is neccessary for unique name
    cb(
      null,
      Date.now() +
        "-" +
        Math.round(Math.random() * 1e9) +
        path.extname(file.originalname),
    );
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Strict Security: Only PDF files are allowed!"), false);
    }
  },
});

module.exports = upload;
