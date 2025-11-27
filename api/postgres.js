// api/shared/postgres.js
const { Pool } = require('pg');

// La cadena de conexión se obtiene de la variable de entorno
const connectionString = process.env.PG_CONNECTION_STRING;

if (!connectionString) {
  console.error("Falta la variable de entorno PG_CONNECTION_STRING");
}

const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false // Necesario para Azure
  }
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};