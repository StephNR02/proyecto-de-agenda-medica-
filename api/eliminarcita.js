// api/eliminarcita/index.js
const { query } = require("../shared/postgres"); 

module.exports = async function (context, req) {
  try {
    // El 'id' se obtiene de la URL (ruta: citas/{id})
    const id = context.bindingData.id; 

    if (!id) {
      context.res = { status: 400, body: { error: "Falta el ID de la cita a eliminar" } };
      return;
    }
    
    // Consulta SQL para eliminar
    const sqlQuery = "DELETE FROM citas WHERE id = $1";
    await query(sqlQuery, [id]);

    context.res = { status: 204, body: null }; // 204: Eliminación exitosa sin contenido
  } catch (err) {
    context.log("Error en deleteCita:", err);
    context.res = { status: 500, body: { error: "Error al eliminar la cita" } };
  }
};