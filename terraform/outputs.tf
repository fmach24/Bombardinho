output "alb_dns_name" {
  description = "ALB DNS — point your Akamai origin here"
  value       = aws_lb.main.dns_name
}

output "ecr_repository_url" {
  description = "ECR URL — used in GitHub Actions to push images"
  value       = aws_ecr_repository.app.repository_url
}

output "ecs_cluster_name" {
  description = "ECS cluster name — used in GitHub Actions deploy step"
  value       = aws_ecs_cluster.main.name
}

output "ecs_service_name" {
  description = "ECS service name — used in GitHub Actions deploy step"
  value       = aws_ecs_service.app.name
}

output "cloudwatch_log_group" {
  description = "CloudWatch log group for application logs"
  value       = aws_cloudwatch_log_group.app.name
}
