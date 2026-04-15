variable "aws_region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "eu-central-1" # Frankfurt — closest to Kraków
}

variable "app_name" {
  description = "Application name, used for resource naming"
  type        = string
  default     = "bombardinho"
}

variable "app_port" {
  description = "Port the Node.js server listens on"
  type        = number
  default     = 5678
}

variable "desired_count" {
  description = "Number of ECS task replicas"
  type        = number
  default     = 1
}

variable "acm_certificate_arn" {
  description = "ACM certificate ARN for HTTPS on ALB. Leave empty to keep HTTP-only listener."
  type        = string
  default     = ""
}
