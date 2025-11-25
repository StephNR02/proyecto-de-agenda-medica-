// CÓDIGO BICEP FINAL (Agenda Médica) - PLAN B1 PARA FUNCTIONS

targetScope = 'resourceGroup'

// =====================
// PARÁMETROS
// =====================

@description('Región donde se desplegarán la mayoría de los recursos (misma que el resource group)')
param location string = resourceGroup().location

@description('Región donde se desplegará la Azure Static Web App (región soportada)')
param staticWebAppLocation string = 'eastus2' // westus2, centralus, eastus2, westeurope, eastasia

@description('Región donde se desplegará Cosmos DB')
param cosmosLocation string = 'eastus2'

@description('Nombre base de la aplicación')
param appName string = 'agenda${uniqueString(resourceGroup().id)}'

@description('Nombre de la Storage Account (3-24 caracteres, solo minúsculas y números)')
param storageAccountName string = 'ag${uniqueString(resourceGroup().id)}'

@description('Throughput de Cosmos DB (RU/s) para el contenedor Citas')
param cosmosDbThroughput int = 400


// =====================
// 1. Azure Cosmos DB
// =====================

resource cosmosAccount 'Microsoft.DocumentDB/databaseAccounts@2021-10-15' = {
  // IMPORTANTE: nombre distinto al que ya existe en el RG
  name: '${appName}-cosmos2'
  location: cosmosLocation
  kind: 'GlobalDocumentDB'
  properties: {
    databaseAccountOfferType: 'Standard'
    locations: [
      {
        locationName: cosmosLocation
        failoverPriority: 0
        isZoneRedundant: false
      }
    ]
  }
}

resource sqlDatabase 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases@2021-10-15' = {
  name: 'AgendaDB'
  parent: cosmosAccount
  properties: {
    resource: {
      id: 'AgendaDB'
    }
  }
}

resource citasContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2021-10-15' = {
  name: 'Citas'
  parent: sqlDatabase
  properties: {
    resource: {
      id: 'Citas'
      partitionKey: {
        paths: [
          '/fecha'
        ]
        kind: 'Hash'
      }
    }
    options: {
      throughput: cosmosDbThroughput
    }
  }
}


// =====================
// 2. Storage Account (Blob)
// =====================

resource storageAccount 'Microsoft.Storage/storageAccounts@2021-09-01' = {
  name: storageAccountName
  location: location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    allowBlobPublicAccess: true
  }
}


// =====================
// 3. Azure Function App (API) en App Service Plan BASIC B1
// =====================

resource appServicePlan 'Microsoft.Web/serverfarms@2021-03-01' = {
  name: '${appName}-plan'
  location: location
  sku: {
    name: 'B1'
    tier: 'Basic'
    size: 'B1'
    capacity: 1
  }
}

resource functionApp 'Microsoft.Web/sites@2021-03-01' = {
  name: '${appName}-api'
  location: location
  kind: 'functionapp'
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      appSettings: [
        {
          name: 'AzureWebJobsStorage'
          value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};AccountKey=${storageAccount.listKeys().keys[0].value};EndpointSuffix=${environment().suffixes.storage}'
        }
        {
          name: 'COSMOS_DB_CONNECTION'
          value: 'AccountEndpoint=${cosmosAccount.properties.documentEndpoint};AccountKey=${cosmosAccount.listKeys().primaryMasterKey}'
        }
        {
          name: 'FUNCTIONS_WORKER_RUNTIME'
          value: 'node'
        }
        {
          name: 'FUNCTIONS_CORS'
          value: 'https://*.azurestaticapps.net'
        }
      ]
    }
  }
}


// =====================
// 4. Azure Static Web App (Frontend) SIN GitHub integrado desde Bicep
// =====================

resource staticWebApp 'Microsoft.Web/staticSites@2021-01-15' = {
  name: '${appName}-frontend'
  location: staticWebAppLocation
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  properties: {}
}


// =====================
// SALIDAS
// =====================

output frontendUrl string = 'https://${staticWebApp.properties.defaultHostname}'
output functionUrl string = 'https://${functionApp.properties.defaultHostName}/api/citas'
