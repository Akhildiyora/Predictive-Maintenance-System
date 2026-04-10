import pool from './db.js';

export async function findUserByEmail(email) {
  const query = 'SELECT * FROM profiles WHERE email = $1';
  const result = await pool.query(query, [email]);
  return result.rows[0];
}

export async function createUser({ email, password, full_name, role }) {
  const query = `
    INSERT INTO profiles (email, password, full_name, role)
    VALUES ($1, $2, $3, $4)
    RETURNING id, email, full_name, role
  `;
  const result = await pool.query(query, [email, password, full_name, role || 'engineer']);
  return result.rows[0];
}
