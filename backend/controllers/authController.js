const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../database");

const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // 1. Basic Validation
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: "All fields are required." });
    }

    // 2. Email Format Validation (Using Regex)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format." });
    }

    // 3. Password Strength Validation
    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters long." });
    }

    // 4. Role Validation (Strictly enforcing document requirements)
    if (role !== "Investor" && role !== "Entrepreneur") {
      return res
        .status(400)
        .json({ error: "Invalid role. Must be Investor or Entrepreneur." });
    }

    // 5. Check if user already exists
    const userExists = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email],
    );
    if (userExists.rows.length > 0) {
      return res
        .status(400)
        .json({ error: "User already exists with this email." });
    }

    // 6. Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 7. Insert User into Database
    const newUser = await pool.query(
      "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role",
      [name, email, hashedPassword, role],
    );

    res
      .status(201)
      .json({ message: "User registered successfully", user: newUser.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error during registration." });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Basic Validation
    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Email and password are required." });
    }
    // 2. Email Format Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      // Reject completely malformed emails before hitting the DB
      return res.status(400).json({ error: "Invalid email format." });
    }

    // 3. Early Exit for impossible passwords
    if (password.length < 6) {
      // If it's less than 6 chars, it can't possibly exist in our system anyway.
      // But we keep the message generic to prevent password profiling.
      return res.status(400).json({ error: "Invalid credentials." });
    }

    // 4. Check if user exists
    const userResult = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email],
    );
    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: "Invalid credentials." }); // Don't specify 'email not found' for security
    }

    const user = userResult.rows[0];

    // 5. Compare Password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials." });
    }

    // 6. Generate JWT Token
    const payload = { id: user.id, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.status(200).json({
      message: "Login successful",
      token: token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error during login." });
  }
};

// Get User Profile
const getProfile = async (req, res) => {
    try {
        // req.user.id comes from the JWT token via the protect middleware
        const userResult = await pool.query(
            "SELECT id, name, email, role, bio, history, preferences FROM users WHERE id = $1", 
            [req.user.id]
        );
        
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: "User not found." });
        }
        
        res.status(200).json(userResult.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server error fetching profile." });
    }
};

// Update User Profile
const updateProfile = async (req, res) => {
    try {
        const { bio, history, preferences } = req.body;
        
        const updatedUser = await pool.query(
            "UPDATE users SET bio = $1, history = $2, preferences = $3 WHERE id = $4 RETURNING id, name, email, role, bio, history, preferences",
            [bio, history, preferences, req.user.id]
        );

        res.status(200).json({
            message: "Profile updated successfully",
            profile: updatedUser.rows[0]
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server error updating profile." });
    }
};

module.exports = { registerUser, loginUser, getProfile, updateProfile };