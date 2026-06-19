//userController.js
const pool = require("../database");

// GET ALL ENTREPRENEURS (For Investor Dashboard)
const getEntrepreneurs = async (req, res) => {
  try {
    const query = `
            SELECT 
                u.id, 
                u.name, 
                u.email, 
                u.role,
                u.avatar_url AS "avatarUrl", 
                u.bio, 
                u.is_online AS "isOnline",
                ep.startup_name AS "startupName", 
                ep.industry, 
                ep.location, 
                ep.founded_year AS "foundedYear", 
                ep.team_size AS "teamSize", 
                ep.pitch_summary AS "pitchSummary", 
                ep.funding_needed AS "fundingNeeded"
            FROM users u
            LEFT JOIN entrepreneur_profiles ep ON u.id = ep.user_id
            WHERE u.role = 'Entrepreneur';
        `;

    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error fetching entrepreneurs:", err.message);
    res
      .status(500)
      .json({ error: "Server error while fetching entrepreneurs." });
  }
};

// GET ALL INVESTORS (For Entrepreneur Dashboard)
const getInvestors = async (req, res) => {
  try {
    const query = `
            SELECT 
                u.id, 
                u.name, 
                u.email, 
                u.role,
                u.avatar_url AS "avatarUrl", 
                u.bio, 
                u.is_online AS "isOnline",
                ip.investment_interests AS "investmentInterests", 
                ip.investment_stage AS "investmentStage", 
                ip.portfolio_companies AS "portfolioCompanies", 
                ip.minimum_investment AS "minimumInvestment", 
                ip.maximum_investment AS "maximumInvestment"
            FROM users u
            LEFT JOIN investor_profiles ip ON u.id = ip.user_id
            WHERE u.role = 'Investor';
        `;

    const result = await pool.query(query);

    // Strict Type Safety: Ensure arrays are returned properly, not nulls
    const safeRows = result.rows.map((row) => ({
      ...row,
      investmentInterests: row.investmentInterests || [],
      investmentStage: row.investmentStage || [],
      portfolioCompanies: row.portfolioCompanies || [],
    }));

    res.status(200).json(safeRows);
  } catch (err) {
    console.error("Error fetching investors:", err.message);
    res.status(500).json({ error: "Server error while fetching investors." });
  }
};

// GET SPECIFIC USER PROFILE BY ID (For public viewing)
const getPublicProfile = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Fetch base user
    const userResult = await pool.query(
      'SELECT id, name, email, role, avatar_url AS "avatarUrl", bio, is_online AS "isOnline" FROM users WHERE id = $1',
      [id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found." });
    }

    const baseUser = userResult.rows[0];
    let profileData = {};

    // Fetch role-specific details based on what role the targeted user has
    if (baseUser.role === "Entrepreneur") {
      const entResult = await pool.query(
        'SELECT startup_name AS "startupName", pitch_summary AS "pitchSummary", funding_needed AS "fundingNeeded", industry, location, founded_year AS "foundedYear", team_size AS "teamSize" FROM entrepreneur_profiles WHERE user_id = $1',
        [id]
      );
      if (entResult.rows.length > 0) profileData = entResult.rows[0];
    } else if (baseUser.role === "Investor") {
      const invResult = await pool.query(
        'SELECT investment_interests AS "investmentInterests", investment_stage AS "investmentStage", portfolio_companies AS "portfolioCompanies", minimum_investment AS "minimumInvestment", maximum_investment AS "maximumInvestment" FROM investor_profiles WHERE user_id = $1',
        [id]
      );
      if (invResult.rows.length > 0) profileData = invResult.rows[0];
    }

    res.status(200).json({ ...baseUser, ...profileData });
  } catch (err) {
    console.error("Error fetching public profile:", err.message);
    res.status(500).json({ error: "Server error fetching public profile." });
  }
};


module.exports = {
  getEntrepreneurs,
  getInvestors,
  getPublicProfile 
};

