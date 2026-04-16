# Bombardinho

Real-time multiplayer Bomberman-style browser game built with Node.js, Express, Socket.IO, and Phaser 3.

![Players](https://img.shields.io/badge/Players-2--4-blue)
![Platform](https://img.shields.io/badge/Platform-Web-orange)
![Runtime](https://img.shields.io/badge/Node-20.x-green)
![Infra](https://img.shields.io/badge/AWS-ECS%20Fargate-FF9900)

## Overview

Bombardinho is a fast-paced multiplayer arena game for 2 to 4 players.
Players join a lobby, vote for maps, choose skins, place bombs, collect power-ups, and try to survive the longest.

The project includes:

- a Socket.IO game server with server-side state updates,
- a Phaser 3 browser client,
- Docker containerization for production runtime,
- Terraform infrastructure for AWS,
- GitHub Actions pipeline for build and deploy.

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

## Local Run

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

## CI/CD (GitHub Actions)

Workflow on push to main:

1. Syntax check for server code.
2. Build Docker image.
3. Push image to ECR with commit SHA tag.
4. Render ECS task definition with new image.
5. Deploy to ECS service and wait for stability.

Required repository secrets:

- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY
- AWS_REGION
- ECR_REPOSITORY_URL
- ECS_CLUSTER_NAME
- ECS_SERVICE_NAME
- ECS_TASK_FAMILY (optional, fallback: bombardinho)

## Project Structure

Bombardinho/
- server.js
- Dockerfile
- package.json
- .github/workflows/deploy.yml
- terraform/
  - main.tf
  - variables.tf
  - outputs.tf
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
- Sticky sessions are enabled in ALB target group to keep WebSocket affinity.
- For production browsers, use HTTPS at the edge/proxy layer to avoid cookie policy warnings for ALB CORS cookie variants.

## Acknowledgments

- Inspired by Bomberman-style gameplay.
- Built with Phaser and Socket.IO communities documentation.
