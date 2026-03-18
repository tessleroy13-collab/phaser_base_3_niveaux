export default class piece2 extends Phaser.Scene {
    constructor() {
        super({ key: "piece2" });
    }

    init(data) {
        // Gestion de l'affichage unique des règles
        this.dejaJoue = data.dejaJoue || false;

        this.patrickAttrapes = 0;
        this.victoire = false;
        this.estMort = false; 
        this.bobScale = 0.3; 
        this.totalPatricksVoulus = 7; 
        
        // Si on a déjà perdu une fois, on ne demande plus d'appuyer sur ESPACE
        this.jeuACommence = this.dejaJoue; 
    }

    preload() {
        // Chargement des images et sprites
        this.load.spritesheet("bob", "src/assets/bob.png", { frameWidth: 282, frameHeight: 416 });
        this.load.image("patrick", "src/assets/patrick.png");
        this.load.image("pierre1", "src/assets/tileset/pierre1.png");
        this.load.image("pierre2", "src/assets/tileset/pierre2.png");
        this.load.image("FondFINI_image", "src/assets/tileset/FondFINI.png"); 
        
        // Utilisation des noms exacts de tes fichiers assets
        this.load.image("porte2", "src/assets/porte2.png"); 
        this.load.image("porte2bis", "src/assets/porte2bis.png"); 
    }

    create() {
        // 1. LE FOND (Tout derrière)
        this.fondRoule = this.add.tileSprite(400, 300, 800, 600, "FondFINI_image").setDepth(-1);

        // 2. LA PORTE DE DÉPART (Derrière Bob)
        this.porte2 = this.add.image(180, 300, "porte2");
        this.porte2.setScale(0.4).setDepth(1); // Depth basse pour être derrière

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
        this.player.setScale(this.bobScale);
        this.player.body.setSize(160, 260, true); 
        this.player.body.allowGravity = false;
        this.player.setDepth(10); // Depth haute pour être devant la porte

        // 4. GROUPES ET UI
        this.obstacles = this.physics.add.group();
        this.bonus = this.physics.add.group();
        this.clavier = this.input.keyboard.createCursorKeys();
        this.toucheEspace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        
        this.scoreText = this.add.text(16, 16, `Patricks: 0/${this.totalPatricksVoulus}`, { 
            fontSize: '24px', fill: '#fff', stroke: '#000', strokeThickness: 3 
        }).setDepth(20);

        // 5. AFFICHAGE DES RÈGLES
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

        // 6. COLLISIONS
        this.physics.add.overlap(this.player, this.obstacles, this.mortDeBob, null, this);
        this.physics.add.overlap(this.player, this.bonus, this.collecterPatrick, null, this);
    }

    update() {
        if (this.estMort) return;

        // Attente du démarrage
        if (!this.jeuACommence) {
            if (Phaser.Input.Keyboard.JustDown(this.toucheEspace)) {
                this.demarrerLeJeu();
            }
            return;
        }

        // --- MOUVEMENTS ET DÉFILEMENT ---
        this.fondRoule.tilePositionX += 3;

        // La porte s'éloigne au début
        if (this.porte2) {
            this.porte2.x -= 3;
            if (this.porte2.x < -200) this.porte2.destroy();
        }

        // Contrôles de Bob (Vitesse 300)
        const v = 300;
        if (this.clavier.left.isDown) this.player.setVelocityX(-v);
        else if (this.clavier.right.isDown) this.player.setVelocityX(v);
        else this.player.setVelocityX(0);

        if (this.clavier.up.isDown) this.player.setVelocityY(-v);
        else if (this.clavier.down.isDown) this.player.setVelocityY(v);
        else this.player.setVelocityY(0);
    }

    demarrerLeJeu() {
        this.jeuACommence = true;
        if (this.annonceRegles) this.annonceRegles.destroy();
        this.scoreText.setVisible(true);

        // Lancement des générateurs
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
        let h = this.obstacles.create(900, py - 260, "pierre1");
        h.setVelocityX(-350); h.body.allowGravity = false;
        let b = this.obstacles.create(900, py + 260, "pierre2");
        b.setVelocityX(-350); b.body.allowGravity = false;
    }

    spawnPatrick() {
        if (this.victoire || this.estMort) return;
        let p = this.bonus.create(900, Phaser.Math.Between(50, 550), "patrick");
        p.setScale(0.5); p.body.allowGravity = false; p.setVelocityX(-250);
    }

    collecterPatrick(player, patrick) {
        if (this.estMort || this.victoire) return;
        patrick.destroy();
        this.patrickAttrapes++;
        this.scoreText.setText(`Patricks: ${this.patrickAttrapes}/${this.totalPatricksVoulus}`);
        
        // Bob rétrécit à chaque Patrick
        if (this.bobScale > 0.12) {
            this.bobScale -= 0.02;
            this.player.setScale(this.bobScale);
        }
        
        if (this.patrickAttrapes >= this.totalPatricksVoulus) {
            this.apparitionPorteFin();
        }
    }

    apparitionPorteFin() {
        this.victoire = true; 
        if(this.timerPierres) this.timerPierres.remove();
        if(this.timerPatricks) this.timerPatricks.remove();
        
        // Arrivée de la porte de fin
        this.porte2bis = this.physics.add.image(1000, 300, "porte2bis");
        this.porte2bis.setScale(0.4).setDepth(5); // Bob passera DEVANT elle (10 > 5)
        this.porte2bis.body.allowGravity = false;
        this.porte2bis.setVelocityX(-150);
        
        // Passage au niveau suivant
        this.physics.add.overlap(this.player, this.porte2bis, () => {
            this.scene.start("niveau3"); 
        }, null, this);
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