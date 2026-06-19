const express = require("express");
const router = express.Router();
const {
  getEntrepreneurs,
  getInvestors, getPublicProfile
} = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");

// Route to get all startups (Accessible by Investors)
// Method: GET
// URL: /api/users/entrepreneurs
router.get("/entrepreneurs", authMiddleware, getEntrepreneurs);

// Route to get all investors (Accessible by Entrepreneurs)
// Method: GET
// URL: /api/users/investors
router.get("/investors", authMiddleware, getInvestors);
router.get("/profile/:id", getPublicProfile);

module.exports = router;
