export default class piece2 extends Phaser.Scene {
    constructor() {
        super({ key: "piece2" }); // Nom de la scène
    }

    init(data) {
        // Initialisation des variables de jeu
        this.dejaJoue = data.dejaJoue || false;
        this.patrickAttrapes = 0;
        this.victoire = false;
        this.estMort = false;
        this.bobScale = 0.3;
        this.totalPatricksVoulus = 7;
        this.jeuACommence = this.dejaJoue;
    }

    preload() {
        // Chargement des assets (images, sprites)
        this.load.spritesheet("bob", "src/assets/bob.png", { frameWidth: 282, frameHeight: 416 });
        this.load.image("patrick", "src/assets/patrick.png");
        this.load.image("pierre1", "src/assets/tileset/pierre1.png");
        this.load.image("pierre2", "src/assets/tileset/pierre2.png");
        this.load.image("FondFINI_image", "src/assets/tileset/FondFINI.png");
        this.load.image("porte2", "src/assets/porte2.png");
        this.load.image("porte2bis", "src/assets/porte2bis.png");
    }

    create() {
        // Création du décor et des éléments principaux
        this.fondRoule = this.add.tileSprite(400, 300, 800, 600, "FondFINI_image").setDepth(-1);
        this.porte2 = this.add.image(180, 300, "porte2").setScale(0.05).setDepth(1);

        // Création du joueur
        this.player = this.physics.add.sprite(180, 300, "bob");

        // Animation du joueur (créée une seule fois)
        if (!this.anims.exists("bob_vol")) {
            this.anims.create({
                key: "bob_vol",
                frames: this.anims.generateFrameNumbers("bob", { start: 0, end: 8 }),
                frameRate: 10,
                repeat: -1
            });
        }
        this.player.play("bob_vol");

        // Réglages du joueur (taille, hitbox, physique)
        this.player.setScale(this.bobScale).setDepth(10);
        this.player.body.setSize(160, 260, true);
        this.player.body.allowGravity = false;

        // Groupes d'objets et contrôles
        this.obstacles = this.physics.add.group();
        this.bonus = this.physics.add.group();
        this.clavier = this.input.keyboard.createCursorKeys();
        this.toucheEspace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // Interface (score)
        this.scoreText = this.add.text(16, 16, `Patricks: 0/${this.totalPatricksVoulus}`, {
            fontSize: '24px',
            fill: '#fff',
            backgroundColor: '#000000aa',
            padding: { x: 10, y: 5 }
        }).setDepth(20);

        // Affichage des règles ou démarrage direct
        if (!this.dejaJoue) {
            this.scoreText.setVisible(false);
            this.afficherRegles();
        } else {
            this.demarrerLeJeu();
        }

        // Détection des collisions
        this.physics.add.overlap(this.player, this.obstacles, this.mortDeBob, null, this);
        this.physics.add.overlap(this.player, this.bonus, this.collecterPatrick, null, this);
    }

    afficherRegles() {
        // Affiche un écran avec les règles du jeu
        this.groupeRegles = this.add.container(0, 0).setScrollFactor(0).setDepth(200);

        let fond = this.add.graphics();
        fond.fillStyle(0x000000, 0.8);
        fond.fillRect(200, 150, 400, 300);

        let texte = this.add.text(400, 300,
            "RÈGLES DU JEU :\n\nAttrape 7 Patricks sans toucher les cailloux !\n\n--- ESPACE pour commencer ---",
            { fontSize: '18px', fill: '#fff', align: 'center', wordWrap: { width: 350 } }
        ).setOrigin(0.5);

        this.groupeRegles.add([fond, texte]);
    }

    update() {
        // Boucle principale du jeu
        if (this.estMort) return;

        // Attente du lancement du jeu
        if (!this.jeuACommence) {
            if (Phaser.Input.Keyboard.JustDown(this.toucheEspace)) this.demarrerLeJeu();
            return;
        }

        // Défilement du fond
        this.fondRoule.tilePositionX += 3;

        // Animation de la porte de départ
        if (this.porte2) {
            this.porte2.x -= 3;
            if (this.porte2.x < -200) this.porte2.destroy();
        }

        // Déplacement du joueur
        if (this.player.body.enable) {
            const v = 300;
            this.player.setVelocity(
                (this.clavier.left.isDown ? -v : this.clavier.right.isDown ? v : 0),
                (this.clavier.up.isDown ? -v : this.clavier.down.isDown ? v : 0)
            );
        }
    }

    demarrerLeJeu() {
        // Lance les spawns et active le jeu
        this.jeuACommence = true;
        if (this.groupeRegles) this.groupeRegles.destroy();
        this.scoreText.setVisible(true);

        this.timerPierres = this.time.addEvent({
            delay: 1500, callback: this.spawnObstacles, callbackScope: this, loop: true
        });

        this.timerPatricks = this.time.addEvent({
            delay: 2000, callback: this.spawnPatrick, callbackScope: this, loop: true
        });
    }

    spawnObstacles() {
        // Génère deux obstacles (haut et bas)
        if (this.victoire || this.estMort) return;

        let py = Phaser.Math.Between(150, 450);

        let p1 = this.obstacles.create(900, py - 260, "pierre1");
        p1.setVelocityX(-350).body.allowGravity = false;
        p1.body.setSize(p1.width * 0.85, p1.height * 0.85, true);

        let p2 = this.obstacles.create(900, py + 260, "pierre2");
        p2.setVelocityX(-350).body.allowGravity = false;
        p2.body.setSize(p2.width * 0.85, p2.height * 0.85, true);
    }

    spawnPatrick() {
        // Génère un bonus à position aléatoire
        if (this.victoire || this.estMort) return;

        let p = this.bonus.create(900, Phaser.Math.Between(50, 550), "patrick");
        p.setScale(0.5).body.allowGravity = false;
        p.setVelocityX(-250);
    }

    collecterPatrick(player, patrick) {
        // Gestion de la collecte d’un bonus
        if (this.estMort || this.victoire) return;

        patrick.destroy();
        this.patrickAttrapes++;
        this.scoreText.setText(`Patricks: ${this.patrickAttrapes}/${this.totalPatricksVoulus}`);

        // Réduction progressive de la taille du joueur
        if (this.bobScale > 0.12) {
            this.bobScale -= 0.02;
            this.player.setScale(this.bobScale);
        }

        // Condition de victoire
        if (this.patrickAttrapes >= this.totalPatricksVoulus) {
            this.nettoyageEtApparitionPorte();
        }
    }

    nettoyageEtApparitionPorte() {
        // Nettoie la scène et fait apparaître la sortie
        this.victoire = true;
        if (this.timerPierres) this.timerPierres.remove();
        if (this.timerPatricks) this.timerPatricks.remove();

        this.bonus.clear(true, true);
        this.obstacles.clear(true, true);

        this.porte2bis = this.physics.add.image(700, 300, "porte2bis");
        this.porte2bis.setScale(0.5).setDepth(1);
        this.porte2bis.body.allowGravity = false;
        this.porte2bis.body.setImmovable(true);

        this.physics.add.overlap(this.player, this.porte2bis, () => {
            this.aspirationVersPiece3();
        }, null, this);
    }

    aspirationVersPiece3() {
        // Animation de transition vers la scène suivante
        this.player.body.enable = false;

        this.tweens.add({
            targets: this.player,
            x: this.porte2bis.x,
            y: this.porte2bis.y,
            scale: 0,
            angle: 360,
            alpha: 0,
            duration: 800,
            ease: 'Power2',
            onComplete: () => {
                this.cameras.main.fadeOut(500, 0, 0, 0);
                this.cameras.main.once('camerafadeoutcomplete', () => {
                    this.scene.switch("piece3");
                });
            }
        });
    }

    mortDeBob() {
        // Gestion de la défaite
        if (this.estMort || this.victoire) return;

        this.estMort = true;
        if (this.timerPierres) this.timerPierres.remove();
        if (this.timerPatricks) this.timerPatricks.remove();

        this.obstacles.setVelocityX(0);
        this.bonus.setVelocityX(0);

        this.player.setTint(0xff0000);
        this.player.stop();
        this.player.body.setAllowGravity(true);
        this.player.setVelocity(0, 600);
        this.player.body.checkCollision.none = true;

        // Redémarrage après 2 secondes
        this.time.delayedCall(2000, () => {
            this.scene.restart({ dejaJoue: true });
        });
    }
}