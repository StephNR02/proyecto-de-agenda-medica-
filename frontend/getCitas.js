// api/getCitas/index.js
// 🚨 CAMBIO 1: Reemplaza la conexión a Cosmos por la de Postgres
const { query } = require("../shared/postgres");

module.exports = async function (context, req) {
  try {
    // 🚨 CAMBIO 2: Lógica para obtener citas desde PostgreSQL
    const sql = "SELECT * FROM citas ORDER BY fecha DESC, hora DESC";
    
    const result = await query(sql);

    context.res = {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: result.rows, // PostgreSQL devuelve los resultados en .rows
    };
  } catch (err) {
    context.log("Error en getCitas:", err);
    // ... (rest of the error handling) ...
  }
};