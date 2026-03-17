export default class piece2 extends Phaser.Scene {

    constructor() {
        super({
            key: "piece2"
        });
    }

    init() {
        this.compteurVagues = 0;
        this.patrickAttrapes = 0;
        this.victoire = false;
        this.porteApparue = false;
    }

    preload() {
        // 🔥 Bob en spritesheet (image redimensionnée à 2538px)
        this.load.spritesheet("bob", "src/assets/bob.png", {
            frameWidth: 282,
            frameHeight: 416
        });

        this.load.image("img_ciel", "src/assets/sky.png");
        this.load.image("img_plateforme", "src/assets/platform.png");
        this.load.image("patrick", "src/assets/patrick.png");
        this.load.image("porte", "src/assets/porte.png");

        this.load.image("FondBOB", "src/assets/FondBOB.png");
        // chargement de la carte
        this.load.tilemapTiledJSON("carte", "src/assets/map.json");  
    }

    create() {
        // 1. Fond
        this.add.image(400, 300, "img_ciel");

        // 2. Textes
        this.add.text(400, 30, "Niveau 2 : Bob l'éponge", {
            fontFamily: 'Georgia', fontSize: "24pt", fill: "#ffffff"
        }).setOrigin(0.5);

        this.texteScore = this.add.text(20, 20, "Patrick : 0 / 5", {
            fontFamily: 'Arial', fontSize: "18pt", fill: "#00ffff", fontWeight: 'bold'
        });

        // 🎬 Animation de Bob
        this.anims.create({
            key: "bob_vol",
            frames: this.anims.generateFrameNumbers("bob", { start: 0, end: 8 }),
            frameRate: 10,
            repeat: -1
        });

        // 3. Joueur (Bob)
        this.player = this.physics.add.sprite(150, 300, "bob");
        this.player.play("bob_vol"); // 🔥 animation activée
        this.player.setScale(0.2);
        this.player.setCollideWorldBounds(true);
        this.player.body.allowGravity = false;

        // Hitbox ajustée
        this.player.body.setSize(200, 300);
        this.player.body.setOffset(40, 50);

        // 4. Groupes
        this.plateformes = this.physics.add.group();
        this.bonus = this.physics.add.group();
        this.groupePorte = this.physics.add.group();

        // 5. Clavier
        this.clavier = this.input.keyboard.createCursorKeys();

        // 6. Génération des obstacles
        this.timerObstacles = this.time.addEvent({
            delay: 1500,
            callback: this.spawnObstacles,
            callbackScope: this,
            loop: true
        });

        // 7. Collisions
        this.physics.add.overlap(this.player, this.plateformes, () => {
            if (!this.victoire) {
                this.scene.restart();
            }
        }, null, this);

        this.physics.add.overlap(this.player, this.bonus, (player, patrickItem) => {
            patrickItem.destroy();
            
            if (!this.victoire) {
                this.patrickAttrapes++;
                this.texteScore.setText("Patrick : " + this.patrickAttrapes + " / 5");

                if (player.scale > 0.04) {
                    player.setScale(player.scale * 0.85);
                }

                if (this.patrickAttrapes >= 5 && !this.porteApparue) {
                    this.apparaitrePorte();
                }
            }
        }, null, this);

        this.physics.add.overlap(this.player, this.groupePorte, () => {
            this.gagnerPartie();
        }, null, this);

        // chargement de la carte
        const carteDuNiveau = this.add.tilemap("carte");

        // chargement du jeu de tuiles
        const tileset = carteDuNiveau.addTilesetImage(
          "FondBOB",
          "FondBOB"
        );  
    }

    update() {
        if (this.victoire) {
            this.player.setVelocity(400, 0);
            return;
        }

        const vitesse = 250;
        if (this.clavier.left.isDown) this.player.setVelocityX(-vitesse);
        else if (this.clavier.right.isDown) this.player.setVelocityX(vitesse);
        else this.player.setVelocityX(0);

        if (this.clavier.up.isDown) this.player.setVelocityY(-vitesse);
        else if (this.clavier.down.isDown) this.player.setVelocityY(vitesse);
        else this.player.setVelocityY(0);

        this.plateformes.children.each(obs => {
            if (obs && obs.x < -100) obs.destroy();
        });

        this.bonus.children.each(b => {
            if (b && b.x < -100) b.destroy();
        });
    }

    spawnObstacles() {
        if (this.victoire || this.porteApparue) return;

        this.compteurVagues++;
        let ecartActuel = Math.max(120, 280 - (this.compteurVagues * 4));
        let passageY = Phaser.Math.Between(150, 450);
        let vitesseX = -250 - (this.compteurVagues * 2);

        let h = this.plateformes.create(900, passageY - ecartActuel, "img_plateforme");
        h.setAngle(90).setVelocityX(vitesseX);
        h.body.allowGravity = false;
        h.body.setSize(h.height, h.width);

        let b = this.plateformes.create(900, passageY + ecartActuel, "img_plateforme");
        b.setAngle(90).setVelocityX(vitesseX);
        b.body.allowGravity = false;
        b.body.setSize(b.height, b.width);

        // ⭐ Patrick fréquent + gros
        if (Phaser.Math.Between(0, 10) > 2) {
            let positionYBonus = passageY + Phaser.Math.Between(-30, 30);

            let p = this.bonus.create(1000, positionYBonus, "patrick");
            p.setScale(0.35).setVelocityX(vitesseX);

            p.body.allowGravity = false;
            p.setDepth(1);
        }
    }

    apparaitrePorte() {
        this.porteApparue = true;
        this.timerObstacles.remove();

        this.time.delayedCall(2000, () => {
            let porte = this.groupePorte.create(900, 300, "porte");
            porte.setVelocityX(-200);
            porte.body.allowGravity = false;
            porte.setScale(0.5);
        });
    }

    gagnerPartie() {
        if (this.victoire) return;
        this.victoire = true;
        this.plateformes.clear(true, true);
        this.bonus.clear(true, true);

        console.log("Victoire pour Bob et Patrick !");
        this.time.delayedCall(2000, () => {
            // this.scene.start("piece3");
        });
    }
}