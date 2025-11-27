// api/shared/postgres.js
const { Pool } = require('pg');

// La cadena de conexión es inyectada por Azure Functions
const connectionString = process.env.PG_CONNECTION_STRING; 

if (!connectionString) {
    console.error("Falta la variable de entorno PG_CONNECTION_STRING");
}

const pool = new Pool({
    connectionString: connectionString,
    ssl: {
        rejectUnauthorized: false
    }
});

module.exports = {
    query: (text, params) => pool.query(text, params),
};