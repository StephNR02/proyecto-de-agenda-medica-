// api/getCitas/index.js
const { query } = require("../shared/postgres"); 

module.exports = async function (context, req) {
  try {
    // 1. INTENTA CREAR LA TABLA (PostgreSQL necesita esto)
    await query(`
        CREATE TABLE IF NOT EXISTS citas (
            id TEXT PRIMARY KEY, 
            paciente TEXT NOT NULL,
            fecha DATE NOT NULL,
            hora_inicio TIME NOT NULL,
            hora_fin TIME NOT NULL,
            observaciones TEXT,
            estado TEXT NOT NULL
        );
    `);
    
    // 2. CONSULTA SQL para obtener las citas
    const result = await query("SELECT * FROM citas ORDER BY fecha DESC");

    context.res = {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: result.rows, // PostgreSQL devuelve los resultados en .rows
    };
  } catch (err) {
    context.log("Error en getCitas:", err);
    context.res = { status: 500, body: { error: "Error al obtener citas" } };
  }
};