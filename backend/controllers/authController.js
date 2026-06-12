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

    // 2. Role Validation (Strictly enforcing document requirements)
    if (role !== "Investor" && role !== "Entrepreneur") {
      return res
        .status(400)
        .json({ error: "Invalid role. Must be Investor or Entrepreneur." });
    }

    // 3. Check if user already exists
    const userExists = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email],
    );
    if (userExists.rows.length > 0) {
      return res
        .status(400)
        .json({ error: "User already exists with this email." });
    }

    // 4. Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 5. Insert User into Database
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

    // 2. Check if user exists
    const userResult = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email],
    );
    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: "Invalid credentials." }); // Don't specify 'email not found' for security
    }

    const user = userResult.rows[0];

    // 3. Compare Password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials." });
    }

    // 4. Generate JWT Token
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

module.exports = { registerUser, loginUser };