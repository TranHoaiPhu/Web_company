const { Pool } = require('pg');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

//dotenv.config({ path: path.join(__dirname, '../../config.env') });
// dotenv.config({ path: path.join(__dirname, '../../.env') });

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  client_encoding: 'utf8',
  /*   ssl: {
      require: true,
      rejectUnauthorized: false, // bỏ qua chứng chỉ self-signed
    }, */
  max: 20,
  /*   idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000, */
});



pool.on('connect', (client) => {
  console.log('Connected to PostgreSQL database');
  // Đảm bảo pg_trgm đã được kích hoạt cho Fuzzy Search
  client.query('CREATE EXTENSION IF NOT EXISTS pg_trgm')
    .catch(err => console.error('Error enabling pg_trgm:', err.message));
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = pool;
