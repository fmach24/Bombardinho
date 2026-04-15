export default class GameScene extends Phaser.Scene {

    HP_BAR_TAG = "hp_bar";
    constructor() {
        super("GameScene");

    }

    preload() {

        this.load.font('jersey', 'assets/fonts/jersey10.ttf');
        //mapy
        
        this.load.tilemapTiledJSON("beachMap", "assets/beachMap.tmj");
        this.load.image("beachTiles", "assets/beachTiles.png");
        this.load.image("grave", "assets/animations/grave.png");

        this.load.tilemapTiledJSON("goldMineMap", "assets/goldmineMap.tmj");
        this.load.image("goldMineTiles", "assets/goldmineTiles.png");

        this.load.tilemapTiledJSON("portugalMap", "assets/portugalMap.tmj");
        this.load.image("portugalTiles", "assets/portugalTiles.png");

        // // sprite gracza
        // this.load.spritesheet("player", "assets/player.png", {
        //     frameWidth: 64,
        //     frameHeight: 64
        // });

        // Animacje powerupów - ładowanie klatek
        // Speed powerup (powerup0) - 12 klatek
        for (let i = 1; i <= 12; i++) {
            this.load.image(`speed${i}`, `assets/animations/speed${i}.png`);
        }

        // Mikstura powerup (powerup1) - 15 klatek
        for (let i = 1; i <= 15; i++) {
            this.load.image(`mikstura${i}`, `assets/animations/mikstura${i}.png`);
        }

        // Szczupas powerup (powerup2) - 15 klatek
        for (let i = 1; i <= 15; i++) {
            this.load.image(`szczups${i}`, `assets/animations/szczups${i}.png`);
        }

        // Bomba animacja - 12 klatek  
        for (let i = 1; i <= 12; i++) {
            this.load.image(`bomba${i}`, `assets/animations/bomba${i}.png`);
        }

        for (let i = 1; i <= 8; i++) {
            this.load.image(`explosion${i}`, `assets/animations/wybuchbomby${i}.png`);
        }

        // Animacje gracza - lewo/prawo
        this.load.image('standing1l', 'assets/animations/standing1l.png');
        this.load.image('standing2l', 'assets/animations/standing2l.png');
        this.load.image('standing1r', 'assets/animations/standing1r.png');
        this.load.image('standing2r', 'assets/animations/standing2r.png');

        // === ANIMACJE BOMBARDINHO ===
        // Wszystkie kierunki ruchu
        for (let i = 1; i <= 4; i++) {
            this.load.image(`bombardinho_down${i}`, `assets/animations/bombardinho_down${i}.png`);
            this.load.image(`bombardinho_up${i}`, `assets/animations/bombardinho_up${i}.png`);
        }
        for (let i = 1; i <= 6; i++) {
            this.load.image(`bombardinho_left${i}`, `assets/animations/bombardinho_left${i}.png`);
            this.load.image(`bombardinho_right${i}`, `assets/animations/bombardinho_right${i}.png`);
        }

        // === ANIMACJE FILIPEK ===
        // Wszystkie kierunki ruchu
        for (let i = 1; i <= 4; i++) {
            this.load.image(`filipek_down${i}`, `assets/animations/filipek_down${i}.png`);
            this.load.image(`filipek_up${i}`, `assets/animations/filipek_up${i}.png`);
        }
        for (let i = 1; i <= 6; i++) {
            this.load.image(`filipek_left${i}`, `assets/animations/filipek_left${i}.png`);
            this.load.image(`filipek_right${i}`, `assets/animations/filipek_right${i}.png`);
        }

        // === ANIMACJE GUCZO ===
        this.load.image(`guczo_down1`, `assets/animations/Guczo1.png`);
        this.load.image(`guczo_up1`, `assets/animations/Guczo3.png`);
        this.load.image(`guczo_left1`, `assets/animations/Guczo2.png`);
        this.load.image(`guczo_right1`, `assets/animations/Guczo4.png`);


        this.load.spritesheet('bomb-explosion', 'assets/animations/bomb-explosion.png', { frameWidth: 16, frameHeight: 16 });



        this.load.image('slow-indic', 'assets/slow_indic.png');
        this.load.image('speed-indic', 'assets/speed_indic.png');
        this.load.spritesheet('heart-idle', 'assets/animations/heart-spritesheet.png', { frameWidth: 32, frameHeight: 32 });
        this.load.image('heart1', 'assets/animations/heart1.png');

        this.load.image('slow-indic', 'assets/slow_indic.png');
        this.load.image('speed-indic', 'assets/speed_indic.png');
        this.load.image('frame', 'assets/frame.png');

    }






    //start scene -> create
    create(data) {
        this.initializeGame(data, data.socket);
    }

    initializeGame(data, socket) {

        // alert(data.players);
        console.log(data);
        this.mapName = data.mapName;
        this.players = data.players;
        this.playerId = data.playerId;
        this.socket = socket;
        this.speed = 300;
        this.map = null;
        //TODO: skiny
        this.skin = data.players[this.playerId].skin || "default";
        console.log("Player skin:", this.skin);
        this.isDead = false; // Flaga czy gracz już umarł

        // Tworzenie animacji powerupów i gracza
        this.createAnimations();

        console.log("Players in GameScene:", this.players);
        console.log("My player ID:", this.playerId);
        console.log("My socket:", this.socket);
        console.log("Loading map:", this.mapName);

        this.buildMap(data);

        //game network event handlers:

        this.socket.on('spawnPowerup', (data) => { this.spawnPowerup(data); });

        this.socket.on('destroyPowerup', (data) => { this.destroyPowerup(data); });

        this.socket.on('update', (data) => { this.updatePlayers(data); });

        this.socket.on('newBomb', (data) => { this.newBomb(data); });

        this.socket.on('explosionDetails', (data) => { this.animateExplosion(data); })

    }

    createAnimations() {
        // Animacja speed (powerup0) - 12 klatek
        const speedFrames = [];
        for (let i = 1; i <= 12; i++) {
            speedFrames.push({ key: `speed${i}` });
        }
        this.anims.create({
            key: 'speed-animation',
            frames: speedFrames,
            frameRate: 20,
            repeat: -1 // zapętlenie w nieskończoność
        });

        // Animacja mikstura (powerup1) - 15 klatek
        const miksturaFrames = [];
        for (let i = 1; i <= 15; i++) {
            miksturaFrames.push({ key: `mikstura${i}` });
        }
        this.anims.create({
            key: 'mikstura-animation',
            frames: miksturaFrames,
            frameRate: 20,
            repeat: -1 // zapętlenie w nieskończoność
        });

        // Animacja szczupas (powerup2) - 15 klatek
        const szczupsFrames = [];
        for (let i = 1; i <= 15; i++) {
            szczupsFrames.push({ key: `szczups${i}` });
        }
        this.anims.create({
            key: 'szczupas-animation',
            frames: szczupsFrames,
            frameRate: 20,
            repeat: -1 // zapętlenie w nieskończoność
        });

        // Animacja bomby - 12 klatek
        const bombaFrames = [];
        for (let i = 1; i <= 12; i++) {
            bombaFrames.push({ key: `bomba${i}` });
        }
        this.anims.create({
            key: 'bomba-animation',
            frames: bombaFrames,
            frameRate: 20,
            repeat: -1 // zapętlenie w nieskończoność
        });

        const explosionFrames = [];
        for (let i = 1; i <= 8; i++) {
            explosionFrames.push({ key: `explosion${i}` });
        }
        this.anims.create({
            key: 'bomb-explode',
            frames: explosionFrames,
            frameRate: 10,
            repeat: 0
        });
        // Animacje gracza domyślnego - idąc w lewo
        this.anims.create({
            key: 'left',
            frames: [
                { key: 'standing1l' },
                { key: 'standing2l' }
            ],
            frameRate: 4,
            repeat: -1
        });

        // Animacje gracza domyślnego - idąc w prawo
        this.anims.create({
            key: 'right',
            frames: [
                { key: 'standing1r' },
                { key: 'standing2r' }
            ],
            frameRate: 4,
            repeat: -1
        });

        // === ANIMACJE BOMBARDINHO ===
        this.anims.create({
            key: 'bombardinho-down',
            frames: [
                { key: 'bombardinho_down1' },
                { key: 'bombardinho_down2' },
                { key: 'bombardinho_down3' },
                { key: 'bombardinho_down4' }
            ],
            frameRate: 8,
            repeat: -1
        });

        this.anims.create({
            key: 'bombardinho-up',
            frames: [
                { key: 'bombardinho_up1' },
                { key: 'bombardinho_up2' },
                { key: 'bombardinho_up3' },
                { key: 'bombardinho_up4' }
            ],
            frameRate: 8,
            repeat: -1
        });

        this.anims.create({
            key: 'bombardinho-left',
            frames: [
                { key: 'bombardinho_left1' },
                { key: 'bombardinho_left2' },
                { key: 'bombardinho_left3' },
                { key: 'bombardinho_left4' },
                { key: 'bombardinho_left5' },
                { key: 'bombardinho_left6' }
            ],
            frameRate: 8,
            repeat: -1
        });

        this.anims.create({
            key: 'bombardinho-right',
            frames: [
                { key: 'bombardinho_right1' },
                { key: 'bombardinho_right2' },
                { key: 'bombardinho_right3' },
                { key: 'bombardinho_right4' },
                { key: 'bombardinho_right5' },
                { key: 'bombardinho_right6' }
            ],
            frameRate: 8,
            repeat: -1
        });

        this.anims.create({
            key: 'bombardinho-idle',
            frames: [{ key: 'bombardinho_down1' }],
            frameRate: 1
        });

        // === ANIMACJE FILIPEK ===
        this.anims.create({
            key: 'filipek-down',
            frames: [
                { key: 'filipek_down1' },
                { key: 'filipek_down2' },
                { key: 'filipek_down3' },
                { key: 'filipek_down4' }
            ],
            frameRate: 8,
            repeat: -1
        });

        this.anims.create({
            key: 'filipek-up',
            frames: [
                { key: 'filipek_up1' },
                { key: 'filipek_up2' },
                { key: 'filipek_up3' },
                { key: 'filipek_up4' }
            ],
            frameRate: 8,
            repeat: -1
        });

        this.anims.create({
            key: 'filipek-left',
            frames: [
                { key: 'filipek_left1' },
                { key: 'filipek_left2' },
                { key: 'filipek_left3' },
                { key: 'filipek_left4' },
                { key: 'filipek_left5' },
                { key: 'filipek_left6' }
            ],
            frameRate: 8,
            repeat: -1
        });

        this.anims.create({
            key: 'filipek-right',
            frames: [
                { key: 'filipek_right1' },
                { key: 'filipek_right2' },
                { key: 'filipek_right3' },
                { key: 'filipek_right4' },
                { key: 'filipek_right5' },
                { key: 'filipek_right6' }
            ],
            frameRate: 8,
            repeat: -1
        });

        this.anims.create({
            key: 'filipek-idle',
            frames: [{ key: 'filipek_down1' }],
            frameRate: 1
        });

        // === ANIMACJE GUCZO ===
        this.anims.create({
            key: 'guczo-left',
            frames: [
                { key: 'guczo_left1' }
            ],
            frameRate: 1
        });

        this.anims.create({
            key: 'guczo-right',
            frames: [
                { key: 'guczo_right1' }
            ],
            frameRate: 1
        });

        this.anims.create({
            key: 'guczo-down',
            frames: [
                { key: 'guczo_down1' }
            ],
            frameRate: 1
        });

        this.anims.create({
            key: 'guczo-up',
            frames: [
                { key: 'guczo_up1' }
            ],
            frameRate: 1
        });



        this.anims.create({
            key: 'heart-idle',
            frames: this.anims.generateFrameNames('heart-idle', { start: 0, end: 4 }),
            frameRate: 10,
            repeat: -1
        });
    }



    buildMap(data) {
        // this.load.tilemapTiledJSON("map", "assets/" + mapName + "Map.tmj");
        // this.load.image("tilesKey", "assets/" + mapName + "Tiles.png");
        // Tworzymy mapę
        const map = this.make.tilemap({ key: this.mapName + "Map" });
        const tileset = map.addTilesetImage("tiles", this.mapName + "Tiles");

        // 2 warstwy kafelkowe
        const groundLayer = map.createLayer("groundLayer", tileset, 0, 0);
        const wallsLayer = map.createLayer("wallsLayer", tileset, 0, 0);

        //tworzenie mapArray ktory zostanie wyslany do servera
        this.mapHeight = map.height;
        console.log("Map height in tiles:", this.mapHeight);
        this.mapWidth = map.width;
        //tworzenie mapy
        const mapArray = Array.from({ length: this.mapHeight }, () =>
            Array.from({ length: this.mapWidth }, () => ({ bomb: null, powerup: false, wall: false }))
        );

        // Sprawdź każdy kafelek w wallsLayer i ustaw wall = true jeśli kafelek istnieje
        for (let y = 0; y < this.mapHeight; y++) {
            for (let x = 0; x < this.mapWidth; x++) {
                const tile = wallsLayer.getTileAt(x, y);
                if (tile !== null) {
                    mapArray[y][x].wall = true;
                }
            }
        }
        console.log("Map:", mapArray);

        // Kolizje dla ścian
        // wallsLayer.setCollisionByProperty({ collides: true });




        //kolizje scian
        wallsLayer.setCollisionByExclusion([-1]);

        // Warstwa obiektów: Spawns
        const spawnLayer = map.getObjectLayer("spawnPoints");

        //Osobno nasz lokalny gracz a osobno reszta otrzyjmuje polozenie.
        let spawntag = this.players[this.playerId].spawn;
        //TODO: czy to jest uzywane???
        let spawnPoint2 = spawnLayer.objects.find(obj => obj.name === spawntag);

        this.playerGroup = this.physics.add.group()
        

        Object.values(this.players).forEach(ply => {

            let spawnPoint = spawnLayer.objects.find(obj => obj.name === ply.spawn);
            // Create main sprite
            const sprite = this.add.sprite(0, 0, ply.skin + '_down1');

            const speedIndicatorSprite = this.add.sprite(0, 20, 'speed-indic');
            const slowIndicatorSprite = this.add.sprite(0, 20, 'slow-indic');

            speedIndicatorSprite.setVisible(false);
            slowIndicatorSprite.setVisible(false);
            // Create nickname text
            const nickname = this.add.text(0, -56, ply.nick || "NICK", {
                resolution: 30,
                fontFamily: 'jersey',
                fontSize: "16px",
                color: "#fff",
                stroke: "#000",
                strokeThickness: 3
            }).setOrigin(0.5);

            const health_indicator = this.add.image(10, -40, 'heart1')
                .setOrigin(0, 0.5) // left aligned, middle vertically
                .setScale(0.7);

            const hp_bar = this.add.text(0, -40, ply.health, {
                fontFamily: 'jersey',
                resolution: 30,
                fontSize: "16px",
                color: "#47c070ff",
                stroke: "#000",
                strokeThickness: 4
            }).setOrigin(0.5);

            hp_bar.name = this.HP_BAR_TAG;

            // Put sprite + text into a container
            const startX = Number.isFinite(ply.x) ? ply.x : spawnPoint.x;
            const startY = Number.isFinite(ply.y) ? ply.y : spawnPoint.y;
            const player = this.add.container(startX, startY, [speedIndicatorSprite, slowIndicatorSprite, sprite, nickname, hp_bar, health_indicator]);

            // Enable physics on the container
            this.physics.world.enable(player);

            // Ustaw konkretny rozmiar hitboxa gracza
            player.body.setSize(32, 40);
            player.body.setOffset(-16, -8);

            // Add collisions
            this.physics.add.collider(player, wallsLayer);

            // Add to player group
            this.playerGroup.add(player);

            // Assign ID for later lookup
            player.name = ply.id;
            player.hp_bar = hp_bar;
            player.spriteBody = sprite;
            player.speedIndicator = speedIndicatorSprite;
            player.slowIndicator = slowIndicatorSprite;
            player.bonusCharges = ply.bonusCharges;
            player.hasPlantedBomb = ply.hasPlantedBomb;
            player.health = ply.health;
            if (ply.id == this.playerId) {
                this.player = player;
            }

            // player.spriteBody.play(ply.currentDirection + '_down1', true);
        });


        // Kamera podąża za graczem
        // this.cameras.main.startFollow(this.player);
        // this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

        this.physics.add.collider(this.player,this.bombGroup);
        this.powerups = this.physics.add.group();
        // const powerupSpawns = map.getObjectLayer("powerupSpawns");

        this.bombGroup = this.physics.add.staticGroup();

        this.socket.emit('mapCreated', { mapArray: mapArray });

        //ADD BOMB COUNTER:

        // Background for HUD
        let bg = this.add.image(0, 0, 'frame')
            .setOrigin(0, 0.5);

        // === Bomb icon & counter ===
        let bomb = this.add.image(0, 0, 'bomba1')
            .setScale(0.6)
            .setOrigin(0, 0.5);

        let label = this.add.text(40, 0, this.player.bonusCharges + (this.player.hasPlantedBomb ? 0 : 1), {
            resolution: 30,
            fontFamily: 'jersey',
            fontSize: "20px",
            color: "#000",
            stroke: "#fff",
            strokeThickness: 2
        }).setOrigin(0, 0.5);

        // === Health icon & counter ===
        let health_img = this.add.image(80, 0, 'heart1')
            .setOrigin(0, 0.5);

        let hp_label = this.add.text(120, 0, this.player.health, {
            resolution: 30,
            fontFamily: 'jersey',
            fontSize: "20px",
            color: "#000",
            stroke: "#fff",
            strokeThickness: 2
        }).setOrigin(0, 0.5);

        // === Speed Powerup icon & counter ===
        let speed_img = this.add.image(140, 0, 'speed1')
            .setScale(0.6)
            .setOrigin(0, 0.5);

        const remainingSpeedTime = this.player.speedEffectStamp - Date.now();
        let speed_label = this.add.text(180, 0, remainingSpeedTime > 0 ? remainingSpeedTime : "-", {
            resolution: 30,
            fontFamily: 'jersey',
            fontSize: "20px",
            color: "#000",
            stroke: "#fff",
            strokeThickness: 2
        }).setOrigin(0, 0.5);

        // === Slow Powerup icon & counter ===
        let slow_img = this.add.image(220, 0, 'mikstura1')
            .setScale(0.6)
            .setOrigin(0, 0.5);

        const remainingSlowTime = this.player.slowEffectStamp - Date.now();
        let slow_label = this.add.text(260, 0, remainingSlowTime > 0 ? remainingSlowTime : "-", {
            resolution: 30,
            fontFamily: 'jersey',
            fontSize: "20px",
            color: "#000",
            stroke: "#fff",
            strokeThickness: 2
        }).setOrigin(0, 0.5);

        // === Group everything into a single container ===
        let hudContainer = this.add.container(0, 570, [
            bg,
            bomb, label,
            health_img, hp_label,
            speed_img, speed_label,
            slow_img, slow_label
        ]);

        hudContainer.setZ(100);
        hudContainer.setScrollFactor(0, 0); // HUD stays fixed on screen

        // Save references for updating later
        this.hp_label = hp_label;
        this.bomb_label = label;
        this.speed_label = speed_label;
        this.slow_label = slow_label;

    }


    //NETWORK:

    //proceeds powerup spawn (received from server)
    spawnPowerup(data) {
        console.log("Received spawnPowerup event:", data);
        const { x, y, type } = data;

        // Mapowanie typów powerupów na animacje
        const animationKeys = {
            0: 'speed-animation',
            1: 'mikstura-animation',
            2: 'szczupas-animation',
            3: 'heart-idle'
        };

        // Mapowanie typów na pierwszy frame (do wyświetlenia przed animacją)
        const firstFrameKeys = {
            0: 'speed1',
            1: 'mikstura1',
            2: 'szczups1',
            3: 'heart1'
        };

        const animationKey = animationKeys[type];
        const firstFrameKey = firstFrameKeys[type];

        if (!animationKey || !firstFrameKey) {
            console.error("Nieznany typ powerupa:", type);
            return;
        }

        // Stwórz sprite z pierwszą klatką
        const powerup = this.physics.add.sprite(x * 64 + 32, y * 64 + 32, firstFrameKey);
        powerup.setData("x", x);
        powerup.setData("y", y);
        powerup.setData("type", type);
        this.powerups.add(powerup);

        // Odtwórz animację
        powerup.play(animationKey);

        //zebranie powerupa
        this.physics.add.overlap(this.player, powerup, (player, powerup) => {
            this.socket.emit('pickedPowerup', { id: this.playerId, x: powerup.getData('x'), y: powerup.getData('y'), type: powerup.getData('type') });
            // powerup.destroy(); // usuń powerupa z mapy
            const offsetX = Phaser.Math.Between(-20, 20);

            switch (type) {
                case 0:
                    this.showFloatingText(this.player.x + offsetX, this.player.y - 20, "Speed Effect", "#fbf236");
                    break;
                case 1:
                    this.showFloatingText(this.player.x + offsetX, this.player.y - 20, "Slow Effect", "#639bff");
                    break;
                case 2:
                    this.showFloatingText(this.player.x + offsetX, this.player.y - 20, "+3 Bombs", "#d77bba");
                    break;
                case 3:
                    this.showFloatingText(this.player.x + offsetX, this.player.y - 20, "+1 Health", "#6abe30");
                    break;
            }

        });
    }

    //destroys powerup (data from server)
    destroyPowerup(data) {
        const { x, y } = data;
        const powerup = this.powerups.getChildren().find(p => p.getData('x') === x && p.getData('y') === y);
        if (powerup) {
            // Zatrzymaj animację przed usunięciem
            powerup.stop();
            powerup.destroy();
        }
    }


    //proceeds update from the server.
    updatePlayers(players) {



        Object.values(players).forEach(ply => {

            const playerContainer = this.playerGroup.getChildren().find(x => x.name == ply.id);

            if (playerContainer && (ply.x != null) && (ply.y != null)) {
                // console.log(players)

                const direction = ply.currentDirection;

                // Jeśli direction jest null, 0 lub undefined - gracz stoi (idle)
                if (!direction || direction === 0 || direction === null) {
                    // Pokaż statyczną klatkę _down1 (idle)
                    playerContainer.spriteBody.stop();
                    const idleTexture = ply.skin + '_down1';
                    playerContainer.spriteBody.setTexture(idleTexture);
                } else {
                    // Gracz się porusza - odtwarzaj animację
                    if (direction === "left") {
                        playerContainer.spriteBody.play(ply.skin + '-left', true);
                    } else if (direction === "right") {
                        playerContainer.spriteBody.play(ply.skin + '-right', true);
                    } else if (direction === "up") {
                        playerContainer.spriteBody.play(ply.skin + '-up', true);
                    } else if (direction === "down") {
                        playerContainer.spriteBody.play(ply.skin + '-down', true);
                    }
                }
                const hasSpeedEffect = ply.speedEffectStamp >= Date.now();
                const hasSlowEffect = ply.slowEffectStamp >= Date.now();
                //jesli to jest nasz gracz
                if (ply.id == this.playerId) {
                    // Domyślna prędkość
                    // this.speed = 300;
                    if (hasSpeedEffect) {
                        this.speed = 200; // Powerup SPEED
                    }
                    else if (hasSlowEffect) {
                        this.speed = 75; //powerup slow
                    }
                    else {
                        this.speed = 150; // Brak powerupu SPEED
                    }

                    //gracz ma 0hp
                    if (ply.health <= 0) {
                        this.isDead = true; // Ustaw flagę że gracz umarł
                        this.showDeathOverlay();
                        // this.player.setTint(0xff0000); // na czerwono
                        playerContainer.setVisible(false);
                        playerContainer.setActive(false); // usuń gracza z gry
                        this.physics.add.sprite(playerContainer.x, playerContainer.y, 'grave').setOrigin(0.5, 0);
                        // Możesz też dodać tutaj jakieś powiadomienie o przegranej lub przycisk restartu
                    }

                    this.hp_label.setText(ply.health);
                    this.bomb_label.setText(ply.bonusCharges + (ply.hasPlantedBomb ? 0 : 1));

                    const remainingSpeedTime = ply.speedEffectStamp - Date.now();
                    const remainingSlowTime = ply.slowEffectStamp - Date.now();
                    this.speed_label.setText(remainingSpeedTime > 0 ? Math.ceil(remainingSpeedTime / 1000) : "-");
                    this.slow_label.setText(remainingSlowTime > 0 ? Math.ceil(remainingSlowTime / 1000) : "-");
                }
                else {

                    playerContainer.setPosition(ply.x, ply.y);


                    //gracz ma 0hp
                    if (ply.health <= 0) {
                        // this.player.setTint(0xff0000); // na czerwono
                        playerContainer.setVisible(false); // ukryj gracza
                        playerContainer.setActive(false);
                        this.physics.add.sprite(playerContainer.x, playerContainer.y, 'grave').setOrigin(0.5, 0);
                        // Możesz też dodać tutaj jakieś powiadomienie o przegranej lub przycisk restartu
                    }
                }

                playerContainer.hp_bar.setText(ply.health);
                playerContainer.slowIndicator.setVisible(hasSlowEffect);
                playerContainer.speedIndicator.setVisible(hasSpeedEffect);
            }


        });
    }



    sendUpdate(direction) {
        this.socket.emit('moved', { id: this.playerId, x: this.player.x, y: this.player.y, direction: direction })
    }

    newBomb(bomb) {
        // Stwórz sprite bomby z pierwszą klatką animacji
        const bombSprite = this.physics.add.staticSprite(bomb.x + 32, bomb.y + 32, "bomba1");
        this.bombGroup.add(bombSprite);
        // Odtwórz animację bomby
        bombSprite.play('bomba-animation');

        setTimeout(() => {
            // Zatrzymaj animację przed usunięciem
            bombSprite.stop();
            bombSprite.destroy();
        }, bomb.timeout);
    }



    plantBomb() {
        this.socket.emit('plantBomb', { id: this.playerId, x: this.player.x, y: this.player.y });
    }

    update() {
        let direction = null;
        // Jeśli gracz nie żyje, nie pozwól mu się ruszać
        if (this.isDead) return;

        // Sterowanie z historią wciśniętych klawiszy
        const cursors = this.input.keyboard.createCursorKeys();

        // Inicjalizuj stos klawiszy jeśli nie istnieje
        if (!this.keyStack) {
            this.keyStack = [];
        }

        // Dodaj nowo wciśnięte klawisze na górę stosu
        if (Phaser.Input.Keyboard.JustDown(cursors.left) && !this.keyStack.includes('left')) {
            this.keyStack.push('left');
        }
        if (Phaser.Input.Keyboard.JustDown(cursors.right) && !this.keyStack.includes('right')) {
            this.keyStack.push('right');
        }
        if (Phaser.Input.Keyboard.JustDown(cursors.up) && !this.keyStack.includes('up')) {
            this.keyStack.push('up');
        }
        if (Phaser.Input.Keyboard.JustDown(cursors.down) && !this.keyStack.includes('down')) {
            this.keyStack.push('down');
        }

        // Usuń puszczone klawisze ze stosu
        if (!cursors.left.isDown) {
            this.keyStack = this.keyStack.filter(key => key !== 'left');
        }
        if (!cursors.right.isDown) {
            this.keyStack = this.keyStack.filter(key => key !== 'right');
        }
        if (!cursors.up.isDown) {
            this.keyStack = this.keyStack.filter(key => key !== 'up');
        }
        if (!cursors.down.isDown) {
            this.keyStack = this.keyStack.filter(key => key !== 'down');
        }


        this.player.body.setVelocity(0, 0);

        // Użyj ostatniego klawisza ze stosu (najnowszy wciśnięty)
        const currentKey = this.keyStack[this.keyStack.length - 1];

        if (currentKey === 'left') {
            this.player.body.setVelocityX(-this.speed);
            direction = 'left';
        } else if (currentKey === 'right') {
            this.player.body.setVelocityX(this.speed);
            direction = 'right';
        } else if (currentKey === 'up') {
            this.player.body.setVelocityY(-this.speed);
            direction = 'up';
        } else if (currentKey === 'down') {
            this.player.body.setVelocityY(this.speed);
            direction = 'down';
        }

        if (this.player.body.velocity.length() > 0) {
            this.sendUpdate(direction);
        } else {
            // Gracz się zatrzymał - wyślij null do serwera
            this.sendUpdate(null);
        }

        if (cursors.space.isDown) {
            this.plantBomb();
        }
    }

    animateExplosion(area, map) {
        console.log(area.slice(0, 10));
        console.log(this.mapWidth);
        console.log(this.mapHeight);
        for (let y = 0; y < 20; y++) {
            for (let x = 0; x < 20; x++) {
                if (area[y][x]) {
                    const effect = this.add.sprite(x * 64 + 32, y * 64 + 32, 'explosion1');

                    effect.play('bomb-explode');
                    effect.on('animationcomplete', () => {
                        effect.destroy();
                    });
                }
            }
        }

        // Ensure countdown displays 0 before transitioning
        if (this.countdownText) {
            this.countdownText.setText('0');
            this.time.delayedCall(500, () => {
                this.countdownText.setVisible(false);
            });
        }
    }

    showFloatingText(x, y, text, color = "#fff") {
        const floatingText = this.add.text(x, y, text, {
            resolution: 30,
            fontFamily: 'jersey',
            fontSize: "16px",
            color: color,
            stroke: "#000",
            strokeThickness: 3
        }).setOrigin(0.5);

        // Animacja: przesunięcie w górę + fade out
        this.tweens.add({
            targets: floatingText,
            y: y - 40,        // przesuń w górę
            alpha: 0,         // znikanie
            duration: 1500,   // czas w ms
            ease: "Cubic.easeOut",
            onComplete: () => {
                floatingText.destroy(); // usuń po animacji
            }
        });
    }

    showDeathOverlay() {
        // Sprawdź czy overlay już istnieje
        if (this.deathOverlay) return;

        // Szary filtr na całym ekranie
        this.deathOverlay = this.add.rectangle(
            this.cameras.main.centerX,
            this.cameras.main.centerY,
            this.cameras.main.width,
            this.cameras.main.height,
            0x000000,
            0.6
        );
        this.deathOverlay.setScrollFactor(0); // Nie podąża za kamerą
        this.deathOverlay.setDepth(1000); // Na wierzchu

        // Panel z informacjami
        const panelWidth = 400;
        const panelHeight = 300;
        const panel = this.add.rectangle(
            this.cameras.main.centerX,
            this.cameras.main.centerY,
            panelWidth,
            panelHeight,
            0x222222,
            0.9
        );
        panel.setScrollFactor(0);
        panel.setDepth(1001);
        panel.setStrokeStyle(4, 0xff0000);

        // Tytuł
        const title = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY - 100,
            "You died!",
            {
                resolution: 30,
                fontFamily: 'jersey',
                fontSize: "100px",
                color: "#ff0000",
            }
        );
        title.setOrigin(0.5);
        title.setScrollFactor(0);
        title.setDepth(1002);

        // Informacje o grze
        const gameInfo = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY - 40,
            "\n\nStatistics:\n• Game time: " + Math.floor(this.time.now / 1000) + "s",
            {
                resolution: 30,
                fontFamily: 'jersey',
                fontSize: "25px",
                color: "#ffffff",
                align: "center",
                stroke: "#000",
                strokeThickness: 2
            }
        );
        gameInfo.setOrigin(0.5);
        gameInfo.setScrollFactor(0);
        gameInfo.setDepth(1002);

        // Instrukcja
        const instruction = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY + 80,
            "Watch the other players\n to see who will win!",
            {
                resolution: 30,
                fontFamily: 'jersey',
                fontSize: "25px",
                color: "#cccccc",
                align: "center"
            }
        );
        instruction.setOrigin(0.5);
        instruction.setScrollFactor(0);
        instruction.setDepth(1002);

        // Przechowaj referencje do elementów overlay
        this.deathOverlayElements = [this.deathOverlay, panel, title, gameInfo, instruction];
    }


}

