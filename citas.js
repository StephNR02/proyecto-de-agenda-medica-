// api/getCitas/index.js
const { getContainer } = require("../shared/cosmos");

module.exports = async function (context, req) {
  try {
    const container = await getContainer();
    const query = {
      query: "SELECT * FROM c ORDER BY c.fecha DESC",
    };

    const { resources } = await container.items.query(query).fetchAll();

    context.res = {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: resources,
    };
  } catch (err) {
    context.log("Error en getCitas:", err);
    context.res = {
      status: 500,
      body: { error: "Error al obtener citas" },
    };
  }
};
