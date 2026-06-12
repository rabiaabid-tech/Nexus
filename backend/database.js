const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // Required for Neon Cloud connections
    }
});

pool.connect()
    .then(() => console.log('Cloud PostgreSQL (Neon) connected successfully.'))
    .catch(err => console.error('Database connection error:', err.stack));

module.exports = pool;