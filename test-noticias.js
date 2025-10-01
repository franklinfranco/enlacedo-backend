const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DATABASE_USER || 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  database: process.env.DATABASE_NAME || 'enlacedo',
  password: process.env.DATABASE_PASSWORD || '@Shley02',
  port: process.env.DATABASE_PORT || 5432,
});

async function testNoticias() {
  try {
    const res = await pool.query('SELECT * FROM noticias LIMIT 5'); // Ajusta el nombre de la tabla
    console.log('Datos obtenidos:', res.rows);
  } catch (err) {
    console.error('Error consultando la BD:', err);
  } finally {
    pool.end();
  }
}

testNoticias();
