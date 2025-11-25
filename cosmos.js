// api/shared/cosmos.js
const { CosmosClient } = require("@azure/cosmos");

const endpoint = process.env.COSMOS_DB_ENDPOINT;
const key = process.env.COSMOS_DB_KEY;
const databaseId = process.env.COSMOS_DB_DATABASE || "AgendaDB";
const containerId = process.env.COSMOS_DB_CONTAINER || "Citas";

if (!endpoint || !key) {
  console.error("Faltan variables de entorno de Cosmos DB");
}

const client = new CosmosClient({ endpoint, key });

async function getContainer() {
  const database = client.database(databaseId);
  const container = database.container(containerId);
  return container;
}

module.exports = {
  getContainer,
};
