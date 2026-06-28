# -------------------------------------------------------------
# 1. Grupo de Recursos (Resource Group)
# -------------------------------------------------------------
resource "azurerm_resource_group" "rg" {
  name     = "rg-${var.project_name}-${var.environment}"
  location = var.location
}

# Crear la Identidad Administrada para las Container Apps
resource "azurerm_user_assigned_identity" "ca_identity" {
  name                = "id-orderflow-${var.environment}"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
}

# -------------------------------------------------------------
# 2. Azure Key Vault (Almacén de Secretos)
# -------------------------------------------------------------
data "azurerm_client_config" "current" {}

resource "azurerm_key_vault" "kv" {
  name                        = "kv-${var.project_name}-${var.environment}"
  location                    = azurerm_resource_group.rg.location
  resource_group_name         = azurerm_resource_group.rg.name
  enabled_for_disk_encryption = true
  tenant_id                   = data.azurerm_client_config.current.tenant_id
  soft_delete_retention_days  = 7
  purge_protection_enabled    = false

  sku_name = "standard"

  # Asigna permisos de administrador a tu usuario actual para poder crear secretos
  access_policy {
    tenant_id = data.azurerm_client_config.current.tenant_id
    object_id = data.azurerm_client_config.current.object_id
    
    secret_permissions = [
      "Get", "List", "Set", "Delete", "Purge", "Recover"
    ]
  }

  # -------------------------------------------------------------
  # 2.1. Otorgar permisos de Key Vault a la Identidad
  # -------------------------------------------------------------
  access_policy {
    tenant_id = data.azurerm_client_config.current.tenant_id
    object_id = azurerm_user_assigned_identity.ca_identity.principal_id

    secret_permissions = [
      "Get", "List"
    ]
  }
}

# -------------------------------------------------------------
# 3. Azure SQL Database (Para Orders.Api)
# -------------------------------------------------------------
resource "azurerm_mssql_server" "sql_server" {
  name                         = "sqlserver-${var.project_name}-${var.environment}"
  resource_group_name          = azurerm_resource_group.rg.name
  location                     = azurerm_resource_group.rg.location
  version                      = "12.0"
  administrator_login          = "sqladmin"
  administrator_login_password = var.db_admin_password
}

resource "azurerm_mssql_database" "sql_db" {
  name      = "OrderFlowDb"
  server_id = azurerm_mssql_server.sql_server.id
  sku_name  = "Basic" # La más económica para fines de aprendizaje
}

# Regla de firewall para permitir que los servicios de Azure (como Container Apps) se conecten al SQL Server
resource "azurerm_mssql_firewall_rule" "allow_azure_services" {
  name             = "AllowAzureServices"
  server_id        = azurerm_mssql_server.sql_server.id
  start_ip_address = "0.0.0.0"
  end_ip_address   = "0.0.0.0"
}

# -------------------------------------------------------------
# 4. Azure Cosmos DB con API de MongoDB (Para Catalog.Api)
# -------------------------------------------------------------
resource "azurerm_cosmosdb_account" "cosmos" {
  name                 = "cosmos-${var.project_name}-${var.environment}"
  location             = azurerm_resource_group.rg.location
  resource_group_name  = azurerm_resource_group.rg.name
  offer_type           = "Standard"
  kind                 = "MongoDB"
  mongo_server_version = "4.2" # Especificar versión moderna compatible con .NET 9

  capabilities {
    name = "EnableMongo"
  }

  consistency_policy {
    consistency_level       = "BoundedStaleness"
    max_interval_in_seconds = 300
    max_staleness_prefix    = 100000
  }

  geo_location {
    location          = azurerm_resource_group.rg.location
    failover_priority = 0
  }
}

# -------------------------------------------------------------
# 5. Azure Service Bus (Para Eventos OrderPlaced)
# -------------------------------------------------------------
resource "azurerm_servicebus_namespace" "sb" {
  name                = "sbns-${var.project_name}-${var.environment}"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  sku                 = "Standard"
}

resource "azurerm_servicebus_queue" "sb_queue" {
  name         = "orders-queue"
  namespace_id = azurerm_servicebus_namespace.sb.id
}

# -------------------------------------------------------------
# 6. Entorno de Azure Container Apps (Donde vivirán las Apps)
# -------------------------------------------------------------
resource "azurerm_log_analytics_workspace" "law" {
  name                = "law-${var.project_name}-${var.environment}"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  sku                 = "PerGB2018"
  retention_in_days   = 30
}

resource "azurerm_container_app_environment" "cae" {
  name                       = "cae-${var.project_name}-${var.environment}"
  location                   = azurerm_resource_group.rg.location
  resource_group_name        = azurerm_resource_group.rg.name
  log_analytics_workspace_id = azurerm_log_analytics_workspace.law.id
}

# -------------------------------------------------------------
# 7. Registro de Contenedores (Azure Container Registry - ACR)
# -------------------------------------------------------------
resource "azurerm_container_registry" "acr" {
  name                = "acr${var.project_name}${var.environment}" // Nombre único (solo letras y números)
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  sku                 = "Basic" # Plan económico ideal para pruebas y portfolio
  admin_enabled       = true
}

# -------------------------------------------------------------
# 8. Azure Container App - Catálogo (NoSQL)
# -------------------------------------------------------------
resource "azurerm_container_app" "catalog_api" {
  name                         = "catalog-api"
  container_app_environment_id = azurerm_container_app_environment.cae.id
  resource_group_name          = azurerm_resource_group.rg.name
  revision_mode                = "Single"

  secret {
    name  = "acr-password"
    value = azurerm_container_registry.acr.admin_password
  }

  registry {
    server               = azurerm_container_registry.acr.login_server
    username             = azurerm_container_registry.acr.admin_username
    password_secret_name = "acr-password"
  }

  identity {
    type         = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.ca_identity.id]
  }

  template {
    container {
      name   = "catalog-api"
      image  = "mcr.microsoft.com/azuredocs/aci-helloworld:latest" # Imagen Hello World temporal
      cpu    = "0.25"
      memory = "0.5Gi"

      env {
        name  = "ASPNETCORE_ENVIRONMENT"
        value = "Development"
      } 
      env {
        name  = "APPLICATIONINSIGHTS_CONNECTION_STRING"
        value = azurerm_application_insights.appins.connection_string
      }
      env {
        name  = "MongoDbSettings__ConnectionString"
        value = azurerm_cosmosdb_account.cosmos.primary_mongodb_connection_string # Conexión a Cosmos DB
      }
      env {
        name  = "MongoDbSettings__DatabaseName"
        value = "CatalogDb"
      }
      env {
        name  = "MongoDbSettings__CollectionName"
        value = "Products"
      }
    }
  }

  ingress {
    external_enabled = true
    target_port      = 8080
    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }
}

# -------------------------------------------------------------
# 9. Azure Container App - Pedidos (SQL Server)
# -------------------------------------------------------------
resource "azurerm_container_app" "orders_api" {
  name                         = "orders-api"
  container_app_environment_id = azurerm_container_app_environment.cae.id
  resource_group_name          = azurerm_resource_group.rg.name
  revision_mode                = "Single"

  secret {
    name  = "acr-password"
    value = azurerm_container_registry.acr.admin_password
  }

  identity {
    type         = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.ca_identity.id]
  }

  registry {
    server               = azurerm_container_registry.acr.login_server
    username             = azurerm_container_registry.acr.admin_username
    password_secret_name = "acr-password"
  }

  template {
    container {
      name   = "orders-api"
      image  = "mcr.microsoft.com/azuredocs/aci-helloworld:latest" # Imagen Hello World temporal
      cpu    = "0.25"
      memory = "0.5Gi"

      env {
        name  = "ASPNETCORE_ENVIRONMENT"
        value = "Development"
      }
      env {
        name  = "APPLICATIONINSIGHTS_CONNECTION_STRING"
        value = azurerm_application_insights.appins.connection_string
      }
      env {
        name  = "ExternalServices__CatalogUrl"
        value = "https://${azurerm_container_app.catalog_api.ingress[0].fqdn}" # Redirección interna a Catalog.Api
      }
      env {
        name  = "JwtSettings__SecretKey"
        value = "a-secret-key-that-is-at-least-32-characters-long-for-development"
      }
      env {
        name  = "JwtSettings__Issuer"
        value = "orderflowapi"
      }
      env {
        name  = "JwtSettings__Audience"
        value = "orderflowapi"
      }
      env {
        name  = "AzureServiceBus__ConnectionString"
        value = azurerm_servicebus_namespace.sb.default_primary_connection_string # Conexión a Service Bus
      }
      env {
        name  = "AzureServiceBus__QueueName"
        value = azurerm_servicebus_queue.sb_queue.name
      }
      env {
        name  = "AzureKeyVault__Uri"
        value = azurerm_key_vault.kv.vault_uri
      }
      env {
        name  = "AZURE_CLIENT_ID"
        value = azurerm_user_assigned_identity.ca_identity.client_id
      }
    }
  }

  ingress {
    external_enabled = true
    target_port      = 8080
    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }
}

# -------------------------------------------------------------
# 10. Azure Container App - Worker de Notificaciones
# -------------------------------------------------------------
resource "azurerm_container_app" "notifications_worker" {
  name                         = "notifications-worker"
  container_app_environment_id = azurerm_container_app_environment.cae.id
  resource_group_name          = azurerm_resource_group.rg.name
  revision_mode                = "Single"

  secret {
    name  = "acr-password"
    value = azurerm_container_registry.acr.admin_password
  }

  identity {
    type         = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.ca_identity.id]
  }

  registry {
    server               = azurerm_container_registry.acr.login_server
    username             = azurerm_container_registry.acr.admin_username
    password_secret_name = "acr-password"
  }

  template {
    container {
      name   = "notifications-worker"
      image  = "mcr.microsoft.com/azuredocs/aci-helloworld:latest" # Imagen Hello World temporal
      cpu    = "0.25"
      memory = "0.5Gi"

      env {
        name  = "DOTNET_ENVIRONMENT"
        value = "Development"
      }
      env {
        name  = "AzureServiceBus__ConnectionString"
        value = azurerm_servicebus_namespace.sb.default_primary_connection_string
      }
      env {
        name  = "AzureServiceBus__QueueName"
        value = azurerm_servicebus_queue.sb_queue.name
      }
    }
  }
}

  # -------------------------------------------------------------
  # 12. Secretos de Key Vault para las Container Apps
  # -------------------------------------------------------------
  resource "azurerm_key_vault_secret" "db_password" {
    name         = "ConnectionStrings--DbPassword"
    value        = var.db_admin_password
    key_vault_id = azurerm_key_vault.kv.id
  }

  # Secreto para ConnectionStrings:DefaultConnection
  resource "azurerm_key_vault_secret" "db_connection" {
    name         = "ConnectionStrings--DefaultConnection"
    value        = "Server=tcp:${azurerm_mssql_server.sql_server.fully_qualified_domain_name},1433;Initial Catalog=${azurerm_mssql_database.sql_db.name};Persist Security Info=False;User ID=${azurerm_mssql_server.sql_server.administrator_login};Password=${azurerm_mssql_server.sql_server.administrator_login_password};MultipleActiveResultSets=True;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"
    key_vault_id = azurerm_key_vault.kv.id
  }

# -------------------------------------------------------------
# 13. Azure Application Insights (Telemetría)
# -------------------------------------------------------------
resource "azurerm_application_insights" "appins" {
  name                = "appins-${var.project_name}-${var.environment}"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  workspace_id        = azurerm_log_analytics_workspace.law.id
  application_type    = "web"
}

