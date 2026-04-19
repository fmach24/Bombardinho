# Bombardinho

Real-time multiplayer Bomberman-style browser game built with Node.js, Express, Socket.IO, and Phaser 3.

![Players](https://img.shields.io/badge/Players-2--4-blue)
![Platform](https://img.shields.io/badge/Platform-Web-orange)
![Runtime](https://img.shields.io/badge/Node-20.x-green)
![Infra](https://img.shields.io/badge/AWS-ECS%20Fargate-FF9900)
![Akamai](https://img.shields.io/badge/Akamai-LKE%20Kubernetes-009BDE)

## Overview

Bombardinho is a fast-paced multiplayer arena game for 2 to 4 players.
Players join a lobby, vote for maps, choose skins, place bombs, collect power-ups, and try to survive the longest.

The project includes:

- a Socket.IO game server with server-side state updates,
- a Phaser 3 browser client,
- Docker containerization for production runtime,
- Terraform infrastructure for AWS,
- Kubernetes manifests for Akamai LKE,
- GitHub Actions pipeline for build and deploy to both platforms.

## Core Gameplay Features

- Real-time multiplayer for 2 to 4 players.
- Bomb placement with timed detonation.
- Explosion range blocked by walls.
- Power-up spawn and pickup system.
- Health system and player elimination.
- Map voting from lobby preferences.
- Reconnection using session identifiers and grace timeout.

### Power-ups

- Speed boost.
- Slow effect for opponents.
- Extra bomb charges.
- Health restore.

### Maps

- Beach
- Gold Mine
- Portugal

## Screenshots

<img width="1918" height="1078" alt="image" src="https://github.com/user-attachments/assets/1e864143-cb33-4e1f-be4b-72eb7f7ff303" />

<img width="1918" height="1078" alt="image" src="https://github.com/user-attachments/assets/d5388a00-0e3a-4e29-99f4-4171272e55ea" />

## Access The Running Version

The project is deployed to two independent cloud platforms from a single GitHub Actions pipeline.

Live endpoints:

- **Akamai LKE (Kubernetes, Frankfurt)** — always on, via NodeBalancer public IP.
  - http://139.144.162.125/
- **AWS ECS Fargate (eu-central-1)** — can be paused to save costs.
  - http://bombardinho-alb-1678769276.eu-central-1.elb.amazonaws.com/

## Local Development (Optional)

### Requirements

- Node.js 20+
- npm

### Start

1. Clone repository.
2. Install dependencies.
3. Run server.
4. Open browser at http://localhost:5678.

Commands:

1. git clone https://github.com/fmach24/Bombardinho.git
2. cd Bombardinho
3. npm install
4. node server.js

## Docker

Production image uses a multi-stage build and runs as a non-root user.

Build and run:

1. docker build -t bombardinho .
2. docker run --rm -p 5678:5678 bombardinho

## Cloud Deployment (AWS)

Terraform provisions:

- VPC + internet gateway + public subnets,
- security groups for ALB and ECS tasks,
- ECR repository,
- ECS cluster, task definition, and service (Fargate),
- ALB + target group with sticky sessions,
- CloudWatch log group,
- IAM roles for ECS task execution and task runtime.

Outputs include ALB DNS and ECS/ECR identifiers for CI/CD integration.

## Cloud Deployment (Akamai LKE)

Kubernetes manifests in `k8s/` define:

- Deployment (application pod with health probes),
- Service type LoadBalancer (public entry point).

Basic flow:

- GitHub Actions builds one Docker image,
- the same image is pushed to `ghcr.io`,
- LKE pulls that image and updates the Deployment.

## CI/CD (GitHub Actions)

Workflow on push to main:

1. Syntax check for server code.
2. Build Docker image.
3. Push image to ECR (for ECS) and ghcr.io (for LKE) with commit SHA tag.
4. Deploy to ECS: render task definition with new image, update service, wait for stability.
5. Deploy to LKE: apply manifests, run kubectl set image, wait for rollout.

Required repository secrets:

- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY
- AWS_REGION
- ECR_REPOSITORY_URL
- ECS_CLUSTER_NAME
- ECS_SERVICE_NAME
- AKAMAI_KUBECONFIG (base64-encoded LKE kubeconfig)

## Monitoring

Monitoring stack is provided via Docker Compose:

- Prometheus for scraping metrics from the Node.js server,
- Grafana for dashboard visualization.

### Run Monitoring Locally

1. Start app server:
  - node server.js
2. In another terminal start monitoring stack:
  - docker compose -f docker-compose.monitoring.yml up
3. Open Prometheus:
  - http://localhost:9090
4. Open Grafana:
  - http://localhost:3000 (admin / admin)
5. Add data source in Grafana:
  - Connections → Data sources → Add data source → Prometheus
  - URL: http://prometheus:9090
  - Save & test
6. Create dashboard:
  - Dashboards → New → New dashboard → Add visualization

### Exposed Metrics

Server now exposes Prometheus metrics at:

- /metrics

Custom game metrics:

- bombardinho_active_players
- bombardinho_active_games
- bombardinho_bombs_placed_total

### Grafana Dashboard

Suggested panels:

- Active players (Stat): bombardinho_active_players
- Active games (Stat): bombardinho_active_games
- Bombs placed/min (Time series): rate(bombardinho_bombs_placed_total[$__rate_interval]) * 60

<img width="1920" height="1168" alt="Screenshot From 2026-04-19 19-05-37" src="https://github.com/user-attachments/assets/aceba554-b8e0-41d0-b8c7-cbd21f3fbd20" />

## Project Structure

Bombardinho/
- server.js
- Dockerfile
- package.json
- docker-compose.monitoring.yml
- prometheus.yml
- .github/workflows/deploy.yml
- .github/workflows/start.yml
- .github/workflows/stop.yml
- terraform/
  - main.tf
  - variables.tf
  - outputs.tf
- k8s/
  - deployment.yml
  - service.yml
- public/
  - index.html
  - index.js
  - LobbyScene.js
  - GameScene.js
  - NetworkManager.js
  - styles.css
  - assets/

## Current Notes

- Server has health endpoint at /health for ECS/ALB checks.
- Sticky sessions are enabled on both platforms: ALB target group (cookie-based) and Akamai NodeBalancer (session table).

## Acknowledgments

- Inspired by Bomberman-style gameplay.
- Built with Phaser and Socket.IO communities documentation.
