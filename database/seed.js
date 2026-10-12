// database/seed.js
// PostgreSQL Seeding Script
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

async function seedDatabase() {
  console.log('🐘 Initializing PostgreSQL Schema and Seed Data...');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    host: process.env.PGHOST || 'localhost',
    port: parseInt(process.env.PGPORT || '5432'),
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'postgres',
    database: process.env.PGDATABASE || 'doctor_platform'
  });

  try {
    const client = await pool.connect();
    console.log('Connected to PostgreSQL server.');

    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    const seedSql = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');

    console.log('Executing schema.sql...');
    await client.query(schemaSql);

    console.log('Executing seed.sql...');
    await client.query(seedSql);

    client.release();
    console.log('✅ PostgreSQL Schema and Demo Data initialized successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ PostgreSQL Seeding Failed:', err.message);
    console.log('ℹ️ Note: If you do not have PostgreSQL running, you can still run the platform directly in Demo Fallback Mode without any database installation!');
    process.exit(1);
  }
}

seedDatabase();
