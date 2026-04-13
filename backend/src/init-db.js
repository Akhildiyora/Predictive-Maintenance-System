import pool from './services/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initializeDatabase() {
  console.log('[db] initializing schema...');
  try {
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    await pool.query(schema);
    console.log('[db] schema applied successfully');
    
    // Check if we need a default user
    const userCheck = await pool.query('SELECT * FROM profiles LIMIT 1');
    if (userCheck.rows.length === 0) {
      console.log('[db] creating default maintenance engineer...');
      // Note: We use the plain password here, for local testing you'd usually hash this.
      // But for a fast start, let's just insert one or allow the user to signup.
      // Actually, since signup endpoint exists, just having the table is enough.
    }
    
    process.exit(0);
  } catch (err) {
    console.error('[db] failed to initialize schema', err);
    process.exit(1);
  }
}

initializeDatabase();
