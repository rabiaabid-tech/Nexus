const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // Required for Neon Cloud connections
    }
});

pool.on("error", (err, client) => {
  console.error(
    "Unexpected error on idle database client. Neon dropped connection.",
    err.message,
  );
});

pool
  .connect()
  .then((client) => {
    console.log("Cloud PostgreSQL (Neon) connected successfully.");
    client.release(); 
  })
  .catch((err) => console.error("Database connection error:", err.stack));

module.exports = pool;