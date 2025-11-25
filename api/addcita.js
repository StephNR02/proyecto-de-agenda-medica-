// api/addCita/index.js
const { getContainer } = require("../shared/cosmos");
const { v4: uuidv4 } = require("uuid");

module.exports = async function (context, req) {
  try {
    const body = req.body || {};

    // Campos esperados: paciente, fecha, hora, motivo
    const cita = {
      id: uuidv4(),
      paciente: body.paciente,
      fecha: body.fecha,
      hora: body.hora,
      motivo: body.motivo,
      creadaEn: new Date().toISOString(),
    };

    if (!cita.paciente || !cita.fecha || !cita.hora) {
      context.res = {
        status: 400,
        body: { error: "Faltan campos obligatorios" },
      };
      return;
    }

    const container = await getContainer();
    const { resource } = await container.items.create(cita);

    context.res = {
      status: 201,
      body: resource,
    };
  } catch (err) {
    context.log("Error en addCita:", err);
    context.res = {
      status: 500,
      body: { error: "Error al crear la cita" },
    };
  }
};
