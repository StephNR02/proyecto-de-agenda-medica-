// CÓDIGO BICEP FINAL Y FUNCIONAL (infra/main.bicep)
targetScope = 'resourceGroup'

// --- PARÁMETROS DEL DESPLIEGUE ---
param location string = 'eastus2' 
param appName string = 'agenda${uniqueString(resourceGroup().id)}'
param githubToken string = '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' 
param repositoryUrl string = 'https://github.com/StephNR02/proyecto-de-agenda-medica-.git' 
param repositoryBranch string = 'main' 

@secure()
param adminPassword string
param pgAdminUser string = 'pgadmin' 

// --- 1. Base de Datos: Azure Database for PostgreSQL (Flexible Server) ---
// Bicep creará este recurso si no existe
resource postgresServer 'Microsoft.DBforPostgreSQL/flexibleServers@2021-06-01' = {
  name: '${appName}-pgserver'
  location: location
  sku: {
    name: 'Standard_D2ds_v4'
    tier: 'GeneralPurpose'
  }
  properties: {
    version: '13'
    administratorLogin: pgAdminUser
    administratorLoginPassword: adminPassword
    storage: { storageSizeGB: 20 }
    backup: { backupRetentionDays: 7 }
  }
}

// Firewall Rule (Permitir tráfico desde Azure Functions y SWA)
resource pgFirewall 'Microsoft.DBforPostgreSQL/flexibleServers/firewallRules@2021-06-01' = {
  parent: postgresServer
  name: 'AllowAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

// --- 2. Almacenamiento de Archivos: Azure Storage Account ---
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
        { name: 'FUNCTIONS_WORKER_RUNTIME', value: 'node' }
        { name: 'FUNCTIONS_CORS', value: 'https://*.azurestaticapps.net' } 
        // 🚨 CONFIGURACIÓN CRÍTICA: Se establece la variable de entorno para PostgreSQL
        { name: 'PG_CONNECTION_STRING', value: 'Host=${postgresServer.properties.fullyQualifiedDomainName};Database=postgres;Username=${pgAdminUser};Password=${adminPassword};SslMode=Require;' }
      ]
    }, 
    httpsOnly: true 
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
    branch: repositoryBranch, 
    buildProperties: {
      appLocation: 'frontend' 
      outputLocation: 'frontend'
      apiLocation: 'api'
    }
  }
}

// --- SALIDAS ---
output frontendUrl string = 'https://${staticWebApp.properties.defaultHostname}'
output functionUrl string = 'https://${functionApp.properties.defaultHostName}/api/citas'
