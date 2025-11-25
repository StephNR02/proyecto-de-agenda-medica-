// api/deleteCita/index.js
const { getContainer } = require("../shared/cosmos");

module.exports = async function (context, req) {
  try {
    const id = context.bindingData.id;
    const partitionKey = req.query.pk || req.body?.pk || req.headers["x-partition-key"];

    if (!id || !partitionKey) {
      context.res = {
        status: 400,
        body: { error: "Faltan id o partitionKey (pk)" },
      };
      return;
    }

    const container = await getContainer();
    await container.item(id, partitionKey).delete();

    context.res = {
      status: 204,
      body: null,
    };
  } catch (err) {
    context.log("Error en deleteCita:", err);
    context.res = {
      status: 500,
      body: { error: "Error al eliminar la cita" },
    };
  }
};
