const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
  // Check for token in headers
  let token = req.header("Authorization");

  if (!token) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  try {
    // Handle "Bearer <token>" format
    if (token.startsWith("Bearer ")) {
      token = token.split(" ")[1];
    }
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Add user payload (id, role) to the request object
    next(); // Move to the actual controller
  } catch (err) {
    console.error(" JWT VERIFICATION FAILED: ", err.message); 
    console.log("🔑 USED SECRET: ", process.env.JWT_SECRET);
    res.status(400).json({ error: "Invalid token." });
  }
};

module.exports = protect;
