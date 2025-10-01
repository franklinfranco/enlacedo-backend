const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'enlacedo',
  password: '@Shley02',
  port: 5432,
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error connecting to DB:', err);
  } else {
    console.log('Connection OK, current time:', res.rows[0]);
  }
  pool.end();
});