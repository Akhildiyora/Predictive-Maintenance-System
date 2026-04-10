import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER || 'factory_admin',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'smart_factory',
  password: process.env.DB_PASSWORD || 'factory_password',
  port: process.env.DB_PORT || 5432,
});

export default pool;
