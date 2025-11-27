// api/addCita/index.js
// 🚨 CAMBIO 1: Reemplaza la conexión a Cosmos por la de Postgres
const { query } = require("../shared/postgres"); 
const { v4: uuidv4 } = require("uuid");

module.exports = async function (context, req) {
  try {
    const body = req.body || {};
    
    // ... (rest of the validation code is the same) ...

    if (!cita.paciente || !cita.fecha || !cita.hora) {
      context.res = {
        status: 400,
        body: { error: "Faltan campos obligatorios" },
      };
      return;
    }

    // 🚨 CAMBIO 2: Lógica para insertar en PostgreSQL
    const sql = `
        INSERT INTO citas (id, paciente, fecha, hora, motivo, creadaEn) 
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *;
    `;
    const values = [
      cita.id, 
      cita.paciente, 
      cita.fecha, 
      cita.hora, 
      cita.motivo, 
      cita.creadaEn
    ];

    const result = await query(sql, values);

    context.res = {
      status: 201,
      body: result.rows[0],
    };
  } catch (err) {
    context.log("Error en addCita:", err);
    // ... (rest of the error handling) ...
  }
};