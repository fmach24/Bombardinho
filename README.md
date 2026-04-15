# 💣 Bombardinho

A real-time multiplayer Bomberman game for 2–4 players, built with Node.js, Socket.IO, and Phaser 3 — and deployed to production on AWS ECS Fargate via a full CI/CD pipeline.

![Players](https://img.shields.io/badge/Players-2--4-blue)
![Platform](https://img.shields.io/badge/Platform-Web-orange)
![Node](https://img.shields.io/badge/Node.js-20-green)
![Docker](https://img.shields.io/badge/Docker-multi--stage-2496ED?logo=docker&logoColor=white)
![Terraform](https://img.shields.io/badge/Terraform-IaC-7B42BC?logo=terraform&logoColor=white)
![AWS](https://img.shields.io/badge/AWS-ECS%20Fargate-FF9900?logo=amazonaws&logoColor=white)
![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-2088FF?logo=githubactions&logoColor=white)

---

## 🎮 Gameplay

Classic Bomberman mechanics in a browser — no installation needed for players. Place bombs to destroy walls, collect power-ups, and be the last one standing.

### Controls

| Key | Action |
|-----|--------|
| ↑ ↓ ← → | Move |
| `Space` | Place bomb |

### Power-ups

| Icon | Power-up | Effect |
|------|----------|--------|
| 🏃 | Speed Boost | +movement speed for 7.5s |
| 🐌 | Slow Potion | slows all other players for 10s |
| 💣 | Extra Bombs | +1 bomb charge (max 5) |
| ❤️ | Health | +1 HP (max 4) |

### Maps

🏖️ Beach · ⛏️ Gold Mine · 🇵🇹 Portugal

---

## 🖼️ Screenshots

<img width="1918" alt="Game" src="https://github.com/user-attachments/assets/1e864143-cb33-4e1f-be4b-72eb7f7ff303" />
<img width="1918" alt="Lobby" src="https://github.com/user-attachments/assets/d5388a00-0e3a-4e29-99f4-4171272e55ea" />

---

## 🛠️ Tech Stack

### Application
| Layer | Technology |
|-------|------------|
| Game engine | Phaser 3 |
| Backend | Node.js + Express |
| Real-time | Socket.IO (WebSockets) |
| Maps | Tiled map editor (`.tmj`) |
| Assets | Custom pixel art sprites |

### Infrastructure
| Component | Technology |
|-----------|------------|
| Container | Docker (multi-stage, non-root) |
| Registry | AWS ECR |
| Compute | AWS ECS Fargate |
| Networking | AWS VPC + Application Load Balancer |
| IaC | Terraform |
| CI/CD | GitHub Actions |
| Observability | AWS CloudWatch Logs |

---

## 🏗️ Architecture

```
GitHub push (main)
       │
       ▼
GitHub Actions
  ├── node --check (lint)
  ├── docker build → push to AWS ECR
  └── aws ecs update-service (zero-downtime deploy)
                │
                ▼
        AWS ECS Fargate
        (VPC · ALB · sticky sessions)
                │
                ▼
           Browser clients
        (Socket.IO WebSockets)
```

> **Why sticky sessions?** Socket.IO maintains stateful WebSocket connections. The ALB is configured with cookie-based stickiness so every player stays routed to the same Fargate task for the duration of the game session.

---

## 🚀 Run Locally

**Prerequisites:** Node.js v14+

```bash
git clone https://github.com/fmach24/Bombardinho.git
cd Bombardinho
npm install
node server.js
```

Open `http://localhost:5678` — share the URL on your local network to play with others.

### Run with Docker

```bash
docker build -t bombardinho .
docker run -p 5678:5678 bombardinho
```

---

## ☁️ Deploy to AWS

Full infrastructure-as-code with Terraform. See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for the step-by-step guide covering:

- `terraform apply` to provision all AWS resources
- First Docker build + ECR push
- GitHub Actions secrets configuration
- CloudWatch log monitoring

**Resources created by Terraform:** VPC · 2 public subnets · Internet Gateway · Security groups · ECR repository · ECS cluster + task definition + service · Application Load Balancer · IAM roles · CloudWatch log group

---

## 📁 Project Structure

```
Bombardinho/
├── Dockerfile                        # Multi-stage production build
├── server.js                         # Express + Socket.IO server
├── package.json
├── terraform/
│   ├── main.tf                       # VPC, ECR, ECS, ALB, IAM, CloudWatch
│   ├── variables.tf
│   └── outputs.tf
├── .github/
│   └── workflows/
│       └── deploy.yml                # CI/CD: build → push → deploy
└── public/
    ├── index.html
    ├── index.js                      # Game bootstrap
    ├── GameScene.js                  # Core game logic
    ├── LobbyScene.js                 # Matchmaking lobby
    ├── NetworkManager.js             # Socket.IO client wrapper
    ├── styles.css
    └── assets/
        ├── animations/               # Character sprite sheets
        ├── fonts/
        └── *.tmj                     # Tiled map files
```

---

## ⚙️ Configuration

```javascript
// server.js
const REQUIRED_PLAYERS = 2;    // players needed to start a game
const DETONATION_TIME  = 2500; // bomb fuse in ms
const HP_MAX           = 3;    // starting health points
const MAX_ACTIVE_POWERUPS = 5; // max simultaneous power-ups on map
```

```hcl
# terraform/variables.tf
variable "aws_region"     { default = "eu-central-1" }
variable "desired_count"  { default = 1 }   # number of Fargate tasks
```

---

## 📜 License

MIT — feel free to fork, mod, and deploy your own version.

---

*Inspired by the classic Bomberman series and Party Time with Winnie the Pooh.*