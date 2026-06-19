const express = require('express');
const cors = require('cors');
const compression = require('compression');
require('dotenv').config();
const pool = require('./database');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require("./routes/userRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json()); // Parses incoming JSON requests
app.use(compression()); // GZip compression for API response optimization

// Automated keep-alive config
app.use((req, res, next) => {
    res.set('Connection', 'keep-alive');
    next();
});

app.use('/api/auth', authRoutes);
app.use("/api/users", userRoutes);

// Basic Test Route
app.get('/', (req, res) => {
    res.send('Nexus Backend API is running and optimized.');
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running smoothly on port ${PORT}`);
});