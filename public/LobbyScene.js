
const socket = io();
export default class LobbyScene extends Phaser.Scene {

    TRY_RECONNECT = true;

    constructor() {
        super('LobbyScene');
        this.playersList = null;
        this.inputNick = null;
        this.startButton = null;
        this.maps = [
            { name: 'beach', displayName: 'Beach Map', previewKey: 'beachPreview' },
            { name: 'goldMine', displayName: 'Gold Mine Map', previewKey: 'goldMinePreview' },
            { name: 'portugal', displayName: 'Portugal Map', previewKey: 'portugalPreview' }
        ];
        this.currentMapIndex = 0;
        
        this.playerSkins = [
            { name: 'bombardinho', displayName: 'Bombardinho', previewKey: 'bombardinhoPreview' },
            { name: 'filipek', displayName: 'Filipek', previewKey: 'filipekPreview' },
            { name: 'guczo', displayName: 'Guczo', previewKey: 'guczoPreview' }
        ];
        this.currentSkinIndex = 0;
    }

    preload() {
        // Załaduj miniaturki map do podglądu
        this.load.image('beachPreview', 'assets/beachMapPreview.png');
        this.load.image('goldMinePreview', 'assets/goldMinePreview.png');
        this.load.image('portugalPreview', 'assets/portugalMapPreview.png');

        // Załaduj podglądy skinów gracza
        this.load.image('bombardinhoPreview', 'assets/animations/bombardinho_down1.png');
        this.load.image('filipekPreview', 'assets/animations/filipek_down1.png');
        this.load.image('guczoPreview', 'assets/animations/Guczo1.png');
        
        // Można też załadować faktyczne mapy do generowania podglądu
        this.load.tilemapTiledJSON('beachMap', 'assets/beachMap.tmj');
        this.load.tilemapTiledJSON('goldMineMap', 'assets/goldmineMap.tmj');
        this.load.image('beachTiles', 'assets/beachTiles.png');
        this.load.image('goldMineTiles', 'assets/goldmineTiles.png');
        this.load.tilemapTiledJSON('portugalMap', 'assets/portugalMap.tmj');
        this.load.image('portugalTiles', 'assets/portugalTiles.png');   

        this.load.font('jersey', 'assets/fonts/jersey10.ttf');
    }

    create() {
        // Czarne tło
        this.add.rectangle(400, 300, 800, 600, 0x0b0b0b);

        // Napis "Nick" nad polem
        this.add.text(400, 40, 'Nick:', {
            resolution: 30,
            fontFamily: 'jersey',
            fontSize: '32px',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Pole nicku - na górze
        // Pole nicku - na górze - jeszcze większe
        this.inputNick = this.add.dom(400, 80, 'input', {
            id: 'menu-nick',
            type: 'text',
            maxlength: 16,
            fontFamily: 'jersey',
            fontSize: '24px',
            resolution: 30,
            color: '#000000ff',
            placeholder: 'Twój nick',
            style: `
                border: 2px solid #444;
                padding: 20px 25px; 
                font-size: 24px; 
                border-radius: 15px; 
                background: #0b0b0b; 
                color: #444444; 
                width: 450px; 
                text-align: center;
            `
        }).setOrigin(0.5).setInteractive();

        // Wybór mapy i skina - w jednym rzędzie - większe okienka
        const selectionY = 180;
        
        // Sekcja wyboru mapy (lewa strona) - kolor jak powerups
        this.add.rectangle(250, selectionY, 220, 120, 0x444444);

        // Zaokrąglona obramówka dla mapy - cienka szara jak powerups
        const mapBorder = this.add.graphics();
        mapBorder.lineStyle(1, 0x888888, 1);
        mapBorder.strokeRoundedRect(250 - 110, selectionY - 60, 220, 120, 8);

        // Przyciski nawigacji map
        this.prevMapButton = this.add.text(150, selectionY, '◀', {
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        this.nextMapButton = this.add.text(350, selectionY, '▶', {
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        // Nazwa mapy
        this.mapNameText = this.add.text(250, selectionY + 70, '', {
            resolution: 30,
            fontFamily: 'jersey',
            fontSize: '25px',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Sekcja wyboru skina (prawa strona) - kolor jak powerups
        this.add.rectangle(550, selectionY, 220, 120, 0x444444);
        
        // Zaokrąglona obramówka dla skina - cienka szara jak powerups
        const skinBorder = this.add.graphics();
        skinBorder.lineStyle(1, 0x888888, 1);
        skinBorder.strokeRoundedRect(550 - 110, selectionY - 60, 220, 120, 8);

        // Przyciski nawigacji skinów
        this.prevSkinButton = this.add.text(450, selectionY, '◀', {
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        this.nextSkinButton = this.add.text(650, selectionY, '▶', {
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        // Nazwa skina
        this.skinNameText = this.add.text(550, selectionY + 70, '', {
            resolution: 30,
            fontFamily: 'jersey',
            fontSize: '25px',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Przycisk dołącz - pod sekcjami wyboru
        this.startButton = this.add.text(400, 320, 'Join game', {
            resolution: 30,
            fontSize: '36px',
            fontFamily: 'jersey',
            color: '#000000',
            border: '2px solid #444',
            borderRadius: '15px',
            backgroundColor: '#ffffff',
            padding: { x: 30, y: 12 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        // Obsługa przycisków map
        this.prevMapButton.on('pointerdown', () => {
            this.changeMap(-1);
        });

        this.nextMapButton.on('pointerdown', () => {
            this.changeMap(1);
        });

        // Obsługa przycisków skinów
        this.prevSkinButton.on('pointerdown', () => {
            this.changeSkin(-1);
        });

        this.nextSkinButton.on('pointerdown', () => {
            this.changeSkin(1);
        });

        // Hover efekty dla przycisków
        this.prevMapButton.on('pointerover', () => {
            this.prevMapButton.setStyle({ color: '#cccccc' });
        });
        this.prevMapButton.on('pointerout', () => {
            this.prevMapButton.setStyle({ color: '#ffffff' });
        });

        this.nextMapButton.on('pointerover', () => {
            this.nextMapButton.setStyle({ color: '#cccccc' });
        });
        this.nextMapButton.on('pointerout', () => {
            this.nextMapButton.setStyle({ color: '#ffffff' });
        });

        this.prevSkinButton.on('pointerover', () => {
            this.prevSkinButton.setStyle({ color: '#cccccc' });
        });
        this.prevSkinButton.on('pointerout', () => {
            this.prevSkinButton.setStyle({ color: '#ffffff' });
        });

        this.nextSkinButton.on('pointerover', () => {
            this.nextSkinButton.setStyle({ color: '#cccccc' });
        });
        this.nextSkinButton.on('pointerout', () => {
            this.nextSkinButton.setStyle({ color: '#ffffff' });
        });

        this.startButton.on('pointerover', () => {
            this.startButton.setStyle({ backgroundColor: '#cccccc' });
        });
        this.startButton.on('pointerout', () => {
            this.startButton.setStyle({ backgroundColor: '#ffffff' });
        });

        // Obsługa kliknięcia start
        this.startButton.on('pointerdown', () => {
            const nick = this.inputNick.node.value.trim() || 'Gracz';
            const preferredMap = this.maps[this.currentMapIndex].name;
            const playerSkin = this.playerSkins[this.currentSkinIndex].name;
            const sessionId = localStorage.getItem('sessionId');

            // Zablokuj kontrolki
            this.inputNick.node.disabled = true;
            this.startButton.setText('Waiting...');
            this.startButton.setStyle({ backgroundColor: '#666666' });
            this.startButton.removeInteractive();
            this.prevMapButton.removeInteractive();
            this.nextMapButton.removeInteractive();
            this.prevSkinButton.removeInteractive();
            this.nextSkinButton.removeInteractive();

            socket.emit("registerPlayer", {
                nick,
                preferredMap,
                playerSkin,
                sessionId,
                tryReconnect: false
            });
        });

        // Inicjalizuj wybór mapy i skina
        this.updateMapDisplay();
        this.updateSkinDisplay();

        socket.off("sessionAssigned");
        socket.off("registrationRejected");
        socket.off("reconnectFailed");
        socket.off("startGame");

        socket.on("sessionAssigned", ({ sessionId }) => {
            if (sessionId) {
                localStorage.setItem("sessionId", sessionId);
            }
        });

        socket.on("registrationRejected", ({ reason }) => {
            alert(reason || "Cannot join game lobby.");
            this.enableLobbyControls();
        });

        socket.on("reconnectFailed", ({ reason }) => {
            localStorage.removeItem("sessionId");
            alert(reason || "Reconnection failed. Join again.");
            this.enableLobbyControls();
        });

        socket.on("startGame", (payload, legacyPlayers, legacyMapName) => {
            const normalizedPayload = payload?.players
                ? payload
                : {
                    sockets: payload,
                    players: legacyPlayers,
                    mapName: legacyMapName,
                    isRejoin: false
                };

            const currentSocketState = normalizedPayload.sockets?.[socket.id];
            if (!currentSocketState) {
                return;
            }

            const playerId = currentSocketState.id;
            const gameData = {
                players: normalizedPayload.players,
                playerId,
                socket,
                mapName: normalizedPayload.mapName,
                reconnect: Boolean(normalizedPayload.isRejoin)
            };

            localStorage.setItem("playerId", playerId);

            if (normalizedPayload.isRejoin) {
                this.scene.start("GameScene", gameData);
                return;
            }

            this.startCountdown(gameData);
        });

        const storedSessionId = localStorage.getItem("sessionId");
        if (storedSessionId && this.TRY_RECONNECT) {
            this.disableLobbyControls("Reconnecting...");
            socket.emit("registerPlayer", {
                nick: "Reconnecting",
                preferredMap: this.maps[this.currentMapIndex].name,
                playerSkin: this.playerSkins[this.currentSkinIndex].name,
                sessionId: storedSessionId,
                tryReconnect: true
            });
        }
    }

    disableLobbyControls(buttonText = "Waiting...") {
        if (this.inputNick?.node) {
            this.inputNick.node.disabled = true;
        }

        if (this.startButton) {
            this.startButton.setText(buttonText);
            this.startButton.setStyle({ backgroundColor: '#666666' });
            this.startButton.removeInteractive();
        }

        this.prevMapButton?.removeInteractive();
        this.nextMapButton?.removeInteractive();
        this.prevSkinButton?.removeInteractive();
        this.nextSkinButton?.removeInteractive();
    }

    enableLobbyControls() {
        if (this.inputNick?.node) {
            this.inputNick.node.disabled = false;
        }

        if (this.startButton) {
            this.startButton.setText('Join game');
            this.startButton.setStyle({ backgroundColor: '#ffffff' });
            this.startButton.setInteractive({ useHandCursor: true });
        }

        this.prevMapButton?.setInteractive({ useHandCursor: true });
        this.nextMapButton?.setInteractive({ useHandCursor: true });
        this.prevSkinButton?.setInteractive({ useHandCursor: true });
        this.nextSkinButton?.setInteractive({ useHandCursor: true });
    }

    startCountdown(gameData) {
        // Ukryj wszystkie elementy lobby
        this.children.each((child) => {
            if (child !== this.cameras.main) {
                child.setVisible(false);
            }
        });

        // Ciemne tło odliczania
        this.countdownBg = this.add.rectangle(400, 300, 800, 600, 0x0b0b0b, 0.9);

        // Tekst "Gra się rozpoczyna!"
        this.gameStartText = this.add.text(400, 200, 'Game is starting!', {
            resolution: 30,
            fontSize: '36px',
            fontFamily: 'jersey',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4,
            shadow: { offsetX: 3, offsetY: 3, color: '#000000', blur: 6, fill: true }
        }).setOrigin(0.5);

        // Tekst odliczania - prosty bez efektów
        this.countdownText = this.add.text(400, 300, '', {
            resolution: 30,
            fontSize: '140px',
            fontFamily: 'jersey',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Tekst pomocy
        this.helpText = this.add.text(400, 400, 'Get ready!', {
            resolution: 30,
            fontSize: '24px',
            fontFamily: 'jersey',
            color: '#cccccc'
        }).setOrigin(0.5);

        // Ukryj inne teksty żeby nie przeszkadzały
        this.gameStartText.setVisible(false);
        this.helpText.setVisible(false);

        // Natychmiastowy countdown - najprostszy
        const sequence = ['3', '2', '1', 'GO!'];
        let i = 0;
        
        this.countdownText.setText(sequence[i]);
        
        this.countdownTimer = this.time.addEvent({
            delay: 500, // Jeszcze szybciej
            callback: () => {
                i++;
                if (i < sequence.length) {
                    this.countdownText.setText(sequence[i]);
                } else {
                    this.scene.start('GameScene', gameData);
                }
            },
            repeat: 3
        });
    }

    changeMap(direction) {
        this.currentMapIndex += direction;
        
        // Zapętl indeks
        if (this.currentMapIndex < 0) {
            this.currentMapIndex = this.maps.length - 1;
        } else if (this.currentMapIndex >= this.maps.length) {
            this.currentMapIndex = 0;
        }
        
        this.updateMapDisplay();
    }

    updateMapDisplay() {
        const currentMap = this.maps[this.currentMapIndex];
        
        // Aktualizuj nazwę mapy
        this.mapNameText.setText(currentMap.displayName);
        
        // Usuń poprzedni podgląd
        if (this.mapPreviewImage) {
            this.mapPreviewImage.destroy();
        }
        
        // Dodaj nowy podgląd mapy w zmniejszonym rozmiarze żeby pasował
        this.mapPreviewImage = this.add.image(250, 180, currentMap.previewKey);
        this.mapPreviewImage.setDisplaySize(150, 75);
    }

    changeSkin(direction) {
        this.currentSkinIndex += direction;
        
        // Zapętl indeks
        if (this.currentSkinIndex < 0) {
            this.currentSkinIndex = this.playerSkins.length - 1;
        } else if (this.currentSkinIndex >= this.playerSkins.length) {
            this.currentSkinIndex = 0;
        }
        
        this.updateSkinDisplay();
    }

    updateSkinDisplay() {
        const currentSkin = this.playerSkins[this.currentSkinIndex];
        
        // Aktualizuj nazwę skina
        this.skinNameText.setText(currentSkin.displayName);
        
        // Usuń poprzedni podgląd
        if (this.skinPreviewImage) {
            this.skinPreviewImage.destroy();
        }
        
        // Dodaj nowy podgląd skina w większym prostokącie
        this.skinPreviewImage = this.add.image(550, 180, currentSkin.previewKey);
        this.skinPreviewImage.setDisplaySize(70, 70);
    }
}