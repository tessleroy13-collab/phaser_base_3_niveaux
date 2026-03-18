export default class piece2 extends Phaser.Scene {
    constructor() {
        super({ key: "piece2" });
    }

    init(data) {
        this.dejaJoue = data.dejaJoue || false;
        this.patrickAttrapes = 0;
        this.victoire = false;
        this.estMort = false;
        this.bobScale = 0.3;
        this.totalPatricksVoulus = 7;
        this.jeuACommence = this.dejaJoue;
    }

    preload() {
        this.load.spritesheet("bob", "src/assets/bob.png", { frameWidth: 282, frameHeight: 416 });
        this.load.image("patrick", "src/assets/patrick.png");
        this.load.image("pierre1", "src/assets/tileset/pierre1.png");
        this.load.image("pierre2", "src/assets/tileset/pierre2.png");
        this.load.image("FondFINI_image", "src/assets/tileset/FondFINI.png");
        this.load.image("porte2", "src/assets/porte2.png");
        this.load.image("porte2bis", "src/assets/porte2bis.png");
    }

    create() {
        // 1. LE FOND (Défilement infini)
        this.fondRoule = this.add.tileSprite(400, 300, 800, 600, "FondFINI_image").setDepth(-1);

        // 2. LA PORTE DE DÉPART
        this.porte2 = this.add.image(180, 300, "porte2").setScale(0.2).setDepth(1);

        // 3. LE JOUEUR (BOB)
        this.player = this.physics.add.sprite(180, 300, "bob");
        if (!this.anims.exists("bob_vol")) {
            this.anims.create({
                key: "bob_vol",
                frames: this.anims.generateFrameNumbers("bob", { start: 0, end: 8 }),
                frameRate: 10,
                repeat: -1
            });
        }
        this.player.play("bob_vol");
        this.player.setScale(this.bobScale).setDepth(10);
        this.player.body.setSize(160, 260, true);
        this.player.body.allowGravity = false;

        // 4. GROUPES ET UI
        this.obstacles = this.physics.add.group();
        this.bonus = this.physics.add.group();
        this.clavier = this.input.keyboard.createCursorKeys();
        this.toucheEspace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
       
        this.scoreText = this.add.text(16, 16, `Patricks: 0/${this.totalPatricksVoulus}`, {
            fontSize: '24px', fill: '#fff', stroke: '#000', strokeThickness: 3
        }).setDepth(20);

        if (!this.dejaJoue) {
            this.scoreText.setVisible(false);
            this.annonceRegles = this.add.text(400, 300,
                "RÈGLES DU JEU :\n\nAttrape 7 Patricks\nsans toucher les cailloux !\n\n--- Appuie sur ESPACE pour commencer ---",
                {
                    fontSize: '28px', fill: '#fff', align: 'center',
                    backgroundColor: '#000000aa', padding: { x: 20, y: 20 },
                    stroke: '#000', strokeThickness: 5
                }
            ).setOrigin(0.5).setDepth(30);
        } else {
            this.demarrerLeJeu();
        }

        // COLLISIONS
        this.physics.add.overlap(this.player, this.obstacles, this.mortDeBob, null, this);
        this.physics.add.overlap(this.player, this.bonus, this.collecterPatrick, null, this);
    }

    update() {
        if (this.estMort) return;

        if (!this.jeuACommence) {
            if (Phaser.Input.Keyboard.JustDown(this.toucheEspace)) this.demarrerLeJeu();
            return;
        }

        // Le fond continue de défiler pour garder l'ambiance
        this.fondRoule.tilePositionX += 3;

        // Effacement de la porte de départ
        if (this.porte2) {
            this.porte2.x -= 3;
            if (this.porte2.x < -200) this.porte2.destroy();
        }

        // Contrôles de Bob (Actifs sauf si aspiré)
        if (this.player.body.enable) {
            const v = 300;
            if (this.clavier.left.isDown) this.player.setVelocityX(-v);
            else if (this.clavier.right.isDown) this.player.setVelocityX(v);
            else this.player.setVelocityX(0);

            if (this.clavier.up.isDown) this.player.setVelocityY(-v);
            else if (this.clavier.down.isDown) this.player.setVelocityY(v);
            else this.player.setVelocityY(0);
        }
    }

    demarrerLeJeu() {
        this.jeuACommence = true;
        if (this.annonceRegles) this.annonceRegles.destroy();
        this.scoreText.setVisible(true);

        this.timerPierres = this.time.addEvent({
            delay: 1500, callback: this.spawnObstacles, callbackScope: this, loop: true
        });
        this.timerPatricks = this.time.addEvent({
            delay: 2000, callback: this.spawnPatrick, callbackScope: this, loop: true
        });
    }

    spawnObstacles() {
        if (this.victoire || this.estMort) return;
        let py = Phaser.Math.Between(150, 450);
        this.obstacles.create(900, py - 260, "pierre1").setVelocityX(-350).body.allowGravity = false;
        this.obstacles.create(900, py + 260, "pierre2").setVelocityX(-350).body.allowGravity = false;
    }

    spawnPatrick() {
        if (this.victoire || this.estMort) return;
        let p = this.bonus.create(900, Phaser.Math.Between(50, 550), "patrick");
        p.setScale(0.5).body.allowGravity = false; p.setVelocityX(-250);
    }

    collecterPatrick(player, patrick) {
        if (this.estMort || this.victoire) return;
        patrick.destroy();
        this.patrickAttrapes++;
        this.scoreText.setText(`Patricks: ${this.patrickAttrapes}/${this.totalPatricksVoulus}`);
       
        if (this.bobScale > 0.12) {
            this.bobScale -= 0.02;
            this.player.setScale(this.bobScale);
        }
       
        if (this.patrickAttrapes >= this.totalPatricksVoulus) {
            this.nettoyageEtApparitionPorte();
        }
    }

    nettoyageEtApparitionPorte() {
        this.victoire = true;
       
        // 1. ARRÊT DES GÉNÉRATEURS
        if(this.timerPierres) this.timerPierres.remove();
        if(this.timerPatricks) this.timerPatricks.remove();
       
        // 2. SUPPRESSION DE TOUS LES PATRICKS ET CAILLOUX RESTANTS
        this.bonus.clear(true, true);
        this.obstacles.clear(true, true);

        // 3. APPARITION DE LA PORTE FIXE (x=700)
        this.porte2bis = this.physics.add.image(700, 300, "porte2bis");
        this.porte2bis.setScale(0.5).setDepth(1); // Bob est devant (10 > 1)
        this.porte2bis.body.allowGravity = false;
        this.porte2bis.body.setImmovable(true);
       
        // 4. DÉTECTION DU PASSAGE
        this.physics.add.overlap(this.player, this.porte2bis, () => {
            this.aspirationVersPiece3();
        }, null, this);
    }

    aspirationVersPiece3() {
        // On évite les doubles appels
        this.player.body.enable = false;

        // Animation d'aspiration
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
        if (this.estMort || this.victoire) return;
        this.estMort = true;
        if(this.timerPierres) this.timerPierres.remove();
        if(this.timerPatricks) this.timerPatricks.remove();
        this.player.setTint(0xff0000);
        this.player.setVelocity(0, 500);
        this.time.delayedCall(2000, () => {
            this.scene.restart({ dejaJoue: true });
        });
    }
}