targetScope = 'resourceGroup'

// --- PARÁMETROS ---
param location string = 'eastus2'
param appName string = 'agenda${uniqueString(resourceGroup().id)}'

@secure()
param githubToken string

param repositoryUrl string = 'https://github.com/StephNR02/proyecto-de-agenda-medica-.git'
param repositoryBranch string = 'main'

@secure()
param adminPassword string
param pgAdminUser string = 'pgadmin'

// --- PostgreSQL ---
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
    storage: {
      storageSizeGB: 32
    }
    backup: {
      backupRetentionDays: 7
    }
  }
}

resource pgFirewall 'Microsoft.DBforPostgreSQL/flexibleServers/firewallRules@2021-06-01' = {
  parent: postgresServer
  name: 'AllowAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

// --- Storage Account ---
resource storageAccount 'Microsoft.Storage/storageAccounts@2021-09-01' = {
  name: 'st${uniqueString(resourceGroup().id)}'
  location: location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    allowBlobPublicAccess: true
  }
}

// --- Static Web App (frontend + API en /api) ---
resource staticWebApp 'Microsoft.Web/staticSites@2021-01-15' = {
  name: '${appName}-frontend'
  location: location
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  properties: {
    repositoryUrl: repositoryUrl
    repositoryToken: githubToken
    branch: repositoryBranch
    buildProperties: {
      appLocation: 'frontend'
      outputLocation: 'frontend'
      apiLocation: 'api'
    }
  }
}

// --- SALIDAS ---
output frontendUrl string = 'https://${staticWebApp.properties.defaultHostname}'
output postgresHost string = postgresServer.properties.fullyQualifiedDomainName
output storageName string = storageAccount.name
