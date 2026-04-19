import express from "express";
import http from "http";
import client from "prom-client";
import { Server } from "socket.io";
import { v4 as uuidv4 } from "uuid";

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const register = new client.Registry();
client.collectDefaultMetrics({ register });

const activePlayers = new client.Gauge({
    name: "bombardinho_active_players",
    help: "Number of currently connected players",
    registers: [register]
});

const activeGames = new client.Gauge({
    name: "bombardinho_active_games",
    help: "Number of games currently in progress",
    registers: [register]
});

const bombsPlaced = new client.Counter({
    name: "bombardinho_bombs_placed_total",
    help: "Total number of bombs placed since server start",
    registers: [register]
});

app.use(express.static("public"));
app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
});

app.get("/metrics", async (_req, res) => {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
});

const REQUIRED_PLAYERS = 2;
const MAX_PLAYERS = 4;
const DETONATION_TIME = 2.5 * 1000;
const STANDARD_RANGE = 2;
const HP_MAX = 3;
const MAX_ACTIVE_POWERUPS = 5;
const SPEED_DURATION = 7.5 * 1000;
const SLOW_DURATION = 10 * 1000;
const MAX_CHARGES = 4;
const MAX_HP = 4;
const BONUS_CHARGES = 2;
const RECONNECT_GRACE_MS = 30 * 1000;
const GAME_TICK_MS = 1000 / 20;
const PORT = Number(process.env.PORT) || 5678;

let currentActivePowerups = 0;
let mapName = "";
let mapHeight = 0;
let mapWidth = 0;
let map = null;
let powerupTimer = null;
let gameLoopTimer = null;
let gameStarted = false;
const mapCreatedBy = new Set();

const sockets = {};
const sessions = {};
const disconnectTimers = {};
const mapPreferences = {};
const players = {};

function snapToGrid(value, gridSize) {
    return Math.floor(value / gridSize) * gridSize;
}

function toMapIndex(value, gridSize) {
    return value / gridSize;
}

function getConnectedPlayerIds() {
    return [...new Set(Object.values(sockets).map((state) => state.id))];
}

function updateActivePlayersMetric() {
    activePlayers.set(getConnectedPlayerIds().length);
}

function updateActiveGamesMetric() {
    activeGames.set(gameStarted ? 1 : 0);
}

function stopPowerupTimer() {
    if (!powerupTimer) {
        return;
    }

    clearInterval(powerupTimer);
    powerupTimer = null;
}

function ensurePowerupTimer() {
    if (powerupTimer || !map) {
        return;
    }

    powerupTimer = setInterval(() => {
        if (!gameStarted || !map || Object.keys(players).length === 0) {
            stopPowerupTimer();
            return;
        }

        if (currentActivePowerups >= MAX_ACTIVE_POWERUPS) {
            return;
        }

        const maxAttempts = mapHeight * mapWidth;
        let attempts = 0;

        while (attempts < maxAttempts) {
            const x = Math.floor(Math.random() * mapWidth);
            const y = Math.floor(Math.random() * mapHeight);
            const type = Math.floor(Math.random() * 4);

            if (!map[y][x].wall && !map[y][x].bomb && !map[y][x].powerup) {
                map[y][x].powerup = true;
                currentActivePowerups++;
                io.emit("spawnPowerup", { x, y, type });
                break;
            }

            attempts++;
        }
    }, 5000);
}

function startGameLoop() {
    if (gameLoopTimer) {
        return;
    }

    gameLoopTimer = setInterval(() => {
        if (!gameStarted || Object.keys(players).length === 0) {
            return;
        }

        io.emit("update", players);
    }, GAME_TICK_MS);
}

function resetGameState() {
    gameStarted = false;
    currentActivePowerups = 0;
    mapName = "";
    mapHeight = 0;
    mapWidth = 0;
    map = null;
    mapCreatedBy.clear();
    stopPowerupTimer();
    updateActiveGamesMetric();
}

function removePlayer(playerId) {
    delete players[playerId];
    delete mapPreferences[playerId];

    Object.keys(sessions).forEach((sessionId) => {
        if (sessions[sessionId] === playerId) {
            delete sessions[sessionId];
        }
    });

    if (disconnectTimers[playerId]) {
        clearTimeout(disconnectTimers[playerId]);
        delete disconnectTimers[playerId];
    }

    io.emit("playerRemoved", { id: playerId });
    io.emit("update", players);

    if (Object.keys(players).length === 0) {
        resetGameState();
    }
}

function startMatchIfReady() {
    if (gameStarted) {
        return;
    }

    const connectedPlayerIds = getConnectedPlayerIds();
    if (connectedPlayerIds.length < REQUIRED_PLAYERS) {
        return;
    }

    const availableMaps = connectedPlayerIds
        .map((id) => mapPreferences[id])
        .filter(Boolean);

    if (availableMaps.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableMaps.length);
        mapName = availableMaps[randomIndex];
    } else {
        mapName = "beach";
    }

    connectedPlayerIds.slice(0, MAX_PLAYERS).forEach((id, index) => {
        players[id].spawn = `spawn${index + 1}`;
    });

    gameStarted = true;
    updateActiveGamesMetric();
    mapCreatedBy.clear();
    currentActivePowerups = 0;
    map = null;
    mapHeight = 0;
    mapWidth = 0;

    io.emit("startGame", {
        sockets,
        players,
        mapName,
        isRejoin: false
    });

    startGameLoop();
}

io.on("connection", (socket) => {
    let playerId = null;

    socket.on("registerPlayer", (data = {}) => {
        const nick = (data.nick || "Gracz").trim().slice(0, 16);
        const preferredMap = data.preferredMap || "beach";
        const playerSkin = data.playerSkin || "bombardinho";
        const tryReconnect = Boolean(data.tryReconnect);
        const requestedSessionId = typeof data.sessionId === "string" ? data.sessionId : null;

        let sessionId = requestedSessionId;
        let reconnected = false;

        if (sessionId && sessions[sessionId] && players[sessions[sessionId]]) {
            playerId = sessions[sessionId];
            reconnected = true;
        } else if (tryReconnect) {
            socket.emit("reconnectFailed", { reason: "Session expired" });
            return;
        } else {
            if (Object.keys(players).length >= MAX_PLAYERS) {
                socket.emit("registrationRejected", {
                    reason: `Lobby is full (${MAX_PLAYERS} players max)`
                });
                return;
            }

            playerId = uuidv4();
            sessionId = uuidv4();
            sessions[sessionId] = playerId;

            players[playerId] = {
                nick,
                id: playerId,
                spawn: "",
                skin: playerSkin,
                health: HP_MAX,
                x: null,
                y: null,
                hasPlantedBomb: false,
                bonusCharges: 0,
                speedEffectStamp: Date.now(),
                slowEffectStamp: Date.now(),
                currentDirection: "right"
            };

            mapPreferences[playerId] = preferredMap;
        }

        if (!players[playerId]) {
            socket.emit("reconnectFailed", { reason: "Player state not found" });
            return;
        }

        if (!(reconnected && tryReconnect)) {
            players[playerId].nick = nick || players[playerId].nick;
            players[playerId].skin = playerSkin || players[playerId].skin;
            mapPreferences[playerId] = preferredMap;
        } else if (!mapPreferences[playerId]) {
            mapPreferences[playerId] = preferredMap;
        }

        if (disconnectTimers[playerId]) {
            clearTimeout(disconnectTimers[playerId]);
            delete disconnectTimers[playerId];
        }

        sockets[socket.id] = {
            nick: players[playerId].nick,
            id: playerId,
            sessionId
        };

        updateActivePlayersMetric();

        socket.emit("sessionAssigned", {
            sessionId,
            playerId,
            reconnected
        });

        if (gameStarted) {
            socket.emit("startGame", {
                sockets,
                players,
                mapName,
                isRejoin: true
            });
            io.emit("update", players);
            return;
        }

        startMatchIfReady();
    });

    socket.on("mapCreated", (data) => {
        if (!gameStarted || map || !data?.mapArray || !Array.isArray(data.mapArray)) {
            return;
        }

        const socketState = sockets[socket.id];
        if (!socketState || mapCreatedBy.has(socketState.id)) {
            return;
        }

        mapCreatedBy.add(socketState.id);
        if (mapCreatedBy.size >= REQUIRED_PLAYERS) {
            mapHeight = data.mapArray.length;
            mapWidth = data.mapArray[0].length;
            map = data.mapArray;
            ensurePowerupTimer();
        }
    });

    socket.on("pickedPowerup", (data) => {
        const { id, x, y, type } = data;

        if (!players[id] || !map || !map[y] || !map[y][x] || !map[y][x].powerup) {
            return;
        }

        map[y][x].powerup = false;

        switch (type) {
            case 0:
                players[id].speedEffectStamp = Date.now() + SPEED_DURATION;
                break;
            case 1:
                Object.values(players).forEach((ply) => {
                    if (ply.id !== id) {
                        ply.slowEffectStamp = Date.now() + SLOW_DURATION;
                    }
                });
                break;
            case 2:
                players[id].bonusCharges = Math.min(players[id].bonusCharges + BONUS_CHARGES, MAX_CHARGES);
                break;
            case 3:
                players[id].health = Math.min(players[id].health + 1, MAX_HP);
                break;
            default:
                return;
        }

        currentActivePowerups = Math.max(currentActivePowerups - 1, 0);
        io.emit("update", players);
        io.emit("destroyPowerup", { x, y });
    });

    socket.on("moved", (data) => {
        if (!players[data.id] || data.id !== playerId) {
            return;
        }

        players[data.id].x = data.x;
        players[data.id].y = data.y;
        players[data.id].currentDirection = data.direction;
    });

    socket.on("disconnect", () => {
        const disconnectedSocket = sockets[socket.id];
        if (!disconnectedSocket) {
            return;
        }

        delete sockets[socket.id];
        updateActivePlayersMetric();
        const disconnectedPlayerId = disconnectedSocket.id;

        if (disconnectTimers[disconnectedPlayerId]) {
            clearTimeout(disconnectTimers[disconnectedPlayerId]);
        }

        disconnectTimers[disconnectedPlayerId] = setTimeout(() => {
            const playerStillConnected = getConnectedPlayerIds().includes(disconnectedPlayerId);
            if (!playerStillConnected) {
                removePlayer(disconnectedPlayerId);
            }
        }, RECONNECT_GRACE_MS);

        if (Object.keys(sockets).length === 0) {
            stopPowerupTimer();
        }
    });

    socket.on("plantBomb", (ply) => {
        if (!map || !players[ply.id] || ply.id !== playerId) {
            return;
        }

        const checkIfPlayerHit = (y, x) => {
            const result = [];

            Object.values(players).forEach((p) => {
                if (p.x == null || p.y == null || p.health <= 0) {
                    return;
                }

                const playerHalf = 32;
                const playerLeft = p.x - playerHalf;
                const playerRight = p.x + playerHalf;
                const playerTop = p.y - playerHalf;
                const playerBottom = p.y + playerHalf;

                const bombSize = 64;
                const bombLeft = x * bombSize;
                const bombRight = bombLeft + bombSize;
                const bombTop = y * bombSize;
                const bombBottom = bombTop + bombSize;

                if (
                    playerRight > bombLeft &&
                    playerLeft < bombRight &&
                    playerBottom > bombTop &&
                    playerTop < bombBottom
                ) {
                    result.push(p.id);
                }
            });

            return result;
        };

        const detonateBomb = (row, col, bomb) => {
            const playersHit = [];
            const affectedArea = Array.from({ length: mapHeight }, () =>
                Array.from({ length: mapWidth }, () => false)
            );

            let offset = -1;
            while (
                Math.abs(offset) <= bomb.range &&
                col + offset >= 0 &&
                !map[row][col + offset].wall
            ) {
                playersHit.push(...checkIfPlayerHit(row, col + offset));
                affectedArea[row][col + offset] = true;
                offset--;
            }

            offset = 1;
            while (
                offset <= bomb.range &&
                col + offset < mapWidth &&
                !map[row][col + offset].wall
            ) {
                playersHit.push(...checkIfPlayerHit(row, col + offset));
                affectedArea[row][col + offset] = true;
                offset++;
            }

            offset = 1;
            while (
                offset <= bomb.range &&
                row + offset < mapHeight &&
                !map[row + offset][col].wall
            ) {
                playersHit.push(...checkIfPlayerHit(row + offset, col));
                affectedArea[row + offset][col] = true;
                offset++;
            }

            offset = -1;
            while (
                Math.abs(offset) <= bomb.range &&
                row + offset >= 0 &&
                !map[row + offset][col].wall
            ) {
                playersHit.push(...checkIfPlayerHit(row + offset, col));
                affectedArea[row + offset][col] = true;
                offset--;
            }

            const uniqueHit = new Set(playersHit);
            uniqueHit.forEach((p_id) => {
                if (players[p_id]) {
                    players[p_id].health--;
                }
            });

            map[row][col].bomb = null;
            if (players[bomb.id]) {
                players[bomb.id].hasPlantedBomb = false;
            }

            affectedArea[row][col] = true;

            io.emit("update", players);
            io.emit("explosionDetails", affectedArea, map);
        };

        const isOnCooldown = () => {
            return players[ply.id].bonusCharges > 0 ? false : players[ply.id].hasPlantedBomb;
        };

        const getRangeFor = () => {
            return STANDARD_RANGE;
        };

        const bombX = snapToGrid(ply.x, 64);
        const bombY = snapToGrid(ply.y, 64);

        const gridX = toMapIndex(bombX, 64);
        const gridY = toMapIndex(bombY, 64);

        if (gridY < 0 || gridY >= mapHeight || gridX < 0 || gridX >= mapWidth) {
            return;
        }

        if (!isOnCooldown() && map[gridY][gridX].bomb == null) {
            const bomb = {
                range: getRangeFor(),
                id: ply.id,
                timeout: DETONATION_TIME,
                x: bombX,
                y: bombY
            };

            map[gridY][gridX].bomb = bomb;
            bombsPlaced.inc();

            if (players[ply.id].bonusCharges > 0) {
                players[ply.id].bonusCharges--;
            } else {
                players[ply.id].hasPlantedBomb = true;
            }

            setTimeout(() => {
                detonateBomb(gridY, gridX, bomb);
            }, DETONATION_TIME);

            io.emit("newBomb", bomb);
        }
    });
});

server.listen(PORT, "0.0.0.0", () => {
    updateActivePlayersMetric();
    updateActiveGamesMetric();
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
});
