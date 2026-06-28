variable "project_name" {
  type        = string
  default     = "orderflowgb"
  description = "Nombre base para los recursos del proyecto."
}

variable "environment" {
  type        = string
  default     = "dev"
  description = "Entorno de despliegue (dev, staging, prod)."
}

variable "location" {
  type        = string
  default     = "centralus"
  description = "Región de Azure donde se crearán los recursos."
}

variable "db_admin_password" {
  type        = string
  default     = "SecurePassword2026!"
  description = "Contraseña de administrador de SQL Server."
  sensitive   = true
}
