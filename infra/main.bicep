// CÓDIGO EN infra/main.bicep
targetScope = 'resourceGroup'

// --- PARÁMETROS DEL DESPLIEGUE ---
param location string = resourceGroup().location
param appName string = 'agenda${uniqueString(resourceGroup().id)}'
// Tu Token de Acceso Personal (PAT) insertado en una sola línea:
param githubToken string = '' 
param repositoryUrl string = 'https://github.com/StephNR02/proyecto-de-agenda-medica-.git' // Tu URL
param repositoryBranch string = 'main' 
param cosmosDbThroughput int = 400 // RU/s para bajo costo o Free Tier

// --- 1. Base de Datos: Azure Cosmos DB ---
resource cosmosAccount 'Microsoft.DocumentDB/databaseAccounts@2021-10-15' = {
  name: '${appName}-cosmos'
  location: location
  properties: {
    databaseAccountOfferType: 'Standard'
    locations: [ { locationName: location } ]
  }
}

resource sqlDatabase 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases@2021-10-15' = {
  parent: cosmosAccount
  name: 'AgendaDB'
  properties: { resource: { id: 'AgendaDB' } }
}

resource citasContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2021-10-15' = {
  parent: sqlDatabase
  name: 'Citas'
  properties: {
    resource: {
      id: 'Citas'
      partitionKey: { paths: [ '/fecha' ]; kind: 'Hash' }
      throughput: cosmosDbThroughput
    }
  }
}

// --- 2. Almacenamiento de Archivos: Azure Storage Account (Blob Storage) ---
resource storageAccount 'Microsoft.Storage/storageAccounts@2021-09-01' = {
  name: '${appName}store${uniqueString(resourceGroup().id)}'
  location: location
  sku: { name: 'Standard_LRS' } 
  kind: 'StorageV2'
  properties: { allowBlobPublicAccess: true }
}

// --- 3. Web API: Azure Function App ---
resource appServicePlan 'Microsoft.Web/serverfarms@2021-03-01' = {
  name: '${appName}-plan'
  location: location
  sku: { name: 'Y1'; tier: 'Dynamic' }
}

resource functionApp 'Microsoft.Web/sites@2021-03-01' = {
  name: '${appName}-api'
  location: location
  kind: 'functionapp'
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      appSettings: [
        { name: 'AzureWebJobsStorage', value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};AccountKey=${storageAccount.listKeys().keys[0].value};EndpointSuffix=${environment().suffixes.storage}' }
        { name: 'COSMOS_DB_CONNECTION', value: 'AccountEndpoint=${cosmosAccount.properties.documentEndpoint};AccountKey=${cosmosAccount.listKeys().primaryMasterKey}' }
        { name: 'FUNCTIONS_WORKER_RUNTIME', value: 'node' }
        { name: 'FUNCTIONS_CORS', value: 'https://${staticWebApp.properties.defaultHostname}' }
      ]
    }
  }
}

// --- 4. Frontend: Azure Static Web Apps (SWA) ---
resource staticWebApp 'Microsoft.Web/staticSites@2021-01-15' = {
  name: '${appName}-frontend'
  location: location
  sku: { name: 'Free'; tier: 'Free' }
  properties: {
    repositoryUrl: repositoryUrl
    repositoryToken: githubToken
    branch: repositoryBranch
    buildProperties: {
      appLocation: 'frontend' 
      outputLocation: 'frontend'
      apiLocation: 'api'
    }
    backendHostNames: [ functionApp.properties.defaultHostName ]
  }
}

// --- SALIDAS ---
output frontendUrl string = 'https://${staticWebApp.properties.defaultHostname}'
output functionUrl string = 'https://${functionApp.properties.defaultHostName}/api/citas'
