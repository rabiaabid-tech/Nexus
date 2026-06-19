//authController.js
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../database");
require("dotenv").config(); // CRITICAL: Added this to ensure JWT_SECRET is loaded in this file

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

    // 4. Role Validation
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
    const initials = name
      .trim()
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();

    const avatarUrl = `https://ui-avatars.com/api/?name=${initials}&background=random`;

    const newUser = await pool.query(
      "INSERT INTO users (name, email, password, role, avatar_url) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role",
      [name, email, hashedPassword, role, avatarUrl],
    );

    const userId = newUser.rows[0].id;

    // 8. Create Role-Specific Profile with Safe Defaults
    if (role === "Entrepreneur") {
      await pool.query(
        "INSERT INTO entrepreneur_profiles (user_id, startup_name, industry) VALUES ($1, $2, $3)",
        [userId, "New Startup", "Not Specified"],
      );
    } else if (role === "Investor") {
      await pool.query(
        "INSERT INTO investor_profiles (user_id, investment_interests, investment_stage, portfolio_companies) VALUES ($1, '{}', '{}', '{}')",
        [userId],
      );
    }
    const token = jwt.sign(
      { id: userId, role: newUser.rows[0].role },
      process.env.JWT_SECRET,
      {
        expiresIn: "30d",
      },
    );

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: userId,
        name: newUser.rows[0].name,
        email: newUser.rows[0].email,
        role: newUser.rows[0].role,
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
      },
      token,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error during registration." });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Email and password are required." });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format." });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Invalid credentials." });
    }

    const userResult = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email],
    );
    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: "Invalid credentials." });
    }

    const user = userResult.rows[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials." });
    }

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
        avatarUrl:
          user.avatar_url ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`,
      },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error during login." });
  }
};

const getProfile = async (req, res) => {
  try {
    const userResult = await pool.query(
      'SELECT id, name, email, role, avatar_url AS "avatarUrl", bio, is_online AS "isOnline" FROM users WHERE id = $1',
      [req.user.id],
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found." });
    }

    const baseUser = userResult.rows[0];

    let profileData = {};

    if (baseUser.role === "Entrepreneur") {
      const entResult = await pool.query(
        'SELECT startup_name AS "startupName", pitch_summary AS "pitchSummary", funding_needed AS "fundingNeeded", industry, location, founded_year AS "foundedYear", team_size AS "teamSize" FROM entrepreneur_profiles WHERE user_id = $1',
        [req.user.id],
      );
      if (entResult.rows.length > 0) {
        profileData = entResult.rows[0];
      }
    } else if (baseUser.role === "Investor") {
      const invResult = await pool.query(
        'SELECT investment_interests AS "investmentInterests", investment_stage AS "investmentStage", portfolio_companies AS "portfolioCompanies", minimum_investment AS "minimumInvestment", maximum_investment AS "maximumInvestment" FROM investor_profiles WHERE user_id = $1',
        [req.user.id],
      );
      if (invResult.rows.length > 0) {
        profileData = invResult.rows[0];
      }
    }

    res.status(200).json({ ...baseUser, ...profileData });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error fetching profile." });
  }
};

// dynamic updateProfile function
const updateProfile = async (req, res) => {
    const userId = req.user.id;
    const userRole = req.user.role;

    try {
        const {
            name, bio, avatarUrl, 
            startupName, industry, location, foundedYear, teamSize, pitchSummary, fundingNeeded,
            investmentInterests, investmentStage, portfolioCompanies, minimumInvestment, maximumInvestment
        } = req.body;

        // SANITIZATION HELPER: Converts empty strings "" to null for PostgreSQL strict integer/numeric columns
        const cleanNum = (val) => (val === "" || val === undefined) ? null : val;

        // 1. Update Base User Table
        await pool.query(
            "UPDATE users SET name = COALESCE($1, name), bio = COALESCE($2, bio), avatar_url = COALESCE($3, avatar_url) WHERE id = $4",
            [name, bio, avatarUrl, userId]
        );

        // 2. Update Role-Specific Tables
        if (userRole === 'Entrepreneur') {
            await pool.query(
                `UPDATE entrepreneur_profiles 
                 SET startup_name = COALESCE($1, startup_name), 
                     industry = COALESCE($2, industry), 
                     location = COALESCE($3, location), 
                     founded_year = COALESCE($4, founded_year), 
                     team_size = COALESCE($5, team_size), 
                     pitch_summary = COALESCE($6, pitch_summary), 
                     funding_needed = COALESCE($7, funding_needed)
                 WHERE user_id = $8`,
                [
                    startupName, 
                    industry, 
                    location, 
                    cleanNum(foundedYear),   // Sanitized
                    cleanNum(teamSize),      // Sanitized
                    pitchSummary, 
                    cleanNum(fundingNeeded), // Sanitized
                    userId
                ]
            );
        } else if (userRole === 'Investor') {
            await pool.query(
                `UPDATE investor_profiles 
                 SET investment_interests = COALESCE($1, investment_interests), 
                     investment_stage = COALESCE($2, investment_stage), 
                     portfolio_companies = COALESCE($3, portfolio_companies), 
                     minimum_investment = COALESCE($4, minimum_investment), 
                     maximum_investment = COALESCE($5, maximum_investment)
                 WHERE user_id = $6`,
                [
                    investmentInterests ? investmentInterests : null, 
                    investmentStage ? investmentStage : null, 
                    portfolioCompanies ? portfolioCompanies : null, 
                    cleanNum(minimumInvestment), // Sanitized
                    cleanNum(maximumInvestment), // Sanitized
                    userId
                ]
            );
        }

        res.status(200).json({ message: "Profile updated successfully in the database." });

    } catch (err) {
        console.error("Update Profile Error: ", err.message);
        res.status(500).json({ error: "Server error during profile update." });
    }
};

module.exports = { registerUser, loginUser, getProfile, updateProfile };
