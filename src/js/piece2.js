export default class piece2 extends Phaser.Scene {
    constructor() {
        super({ key: "piece2" });
    }

    init() {
        this.patrickAttrapes = 0;
        this.victoire = false;
        this.estMort = false; 
        this.bobScale = 0.3;
    }

    preload() {
        // --- CHARGEMENT DES ASSETS ---
        this.load.spritesheet("bob", "src/assets/bob.png", { frameWidth: 282, frameHeight: 416 });
        this.load.image("patrick", "src/assets/patrick.png");
        this.load.image("pierre1", "src/assets/tileset/pierre1.png");
        this.load.image("pierre2", "src/assets/tileset/pierre2.png");
        this.load.image("FondBOB_image", "src/assets/tileset/FD bob FINAL.png"); 
        this.load.tilemapTiledJSON("carte", "src/assets/FondBOB.json");
    }

    create() {
        // 1. FOND (TileSprite)
        this.fondRoule = this.add.tileSprite(400, 300, 800, 600, "FondBOB_image").setDepth(-1);

        // 2. JOUEUR (BOB)
        this.player = this.physics.add.sprite(150, 300, "bob");
        
        // Animation
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
        this.player.setCollideWorldBounds(false); // Permet de tomber hors de l'écran
        this.player.body.allowGravity = false;
        this.player.setDepth(5);

        // 3. GROUPES
        this.obstacles = this.physics.add.group();
        this.bonus = this.physics.add.group();

        // 4. CHARGEMENT DEPUIS TILED (patrick)
        const carteDuNiveau = this.make.tilemap({ key: "carte" });
        const calqueObjets = carteDuNiveau.getObjectLayer("Calque d'Objets 1");
        if (calqueObjets) {
            calqueObjets.objects.forEach(obj => {
                if (obj.name === "patrick") {
                    let p = this.bonus.create(obj.x, obj.y, "patrick");
                    p.setScale(0.5);
                    p.body.allowGravity = false;
                    p.setVelocityX(-200); 
                }
            });
        }

        // 5. INTERFACE (Score)
        this.scoreText = this.add.text(16, 16, 'Patricks: 0/10', { 
            fontSize: '24px', fill: '#fff', stroke: '#000', strokeThickness: 3 
        }).setDepth(10).setScrollFactor(0);

        // 6. CONTRÔLES
        this.clavier = this.input.keyboard.createCursorKeys();

        // 7. GÉNÉRATION DES PIERRES
        this.timerPierres = this.time.addEvent({
            delay: 1500,
            callback: this.spawnPierres,
            callbackScope: this,
            loop: true
        });

        // 8. COLLISIONS
        this.physics.add.overlap(this.player, this.obstacles, this.mortDeBob, null, this);

        this.physics.add.overlap(this.player, this.bonus, (p, pat) => {
            if (this.estMort) return;
            pat.destroy();
            this.patrickAttrapes++;
            this.scoreText.setText('Patricks: ' + this.patrickAttrapes + '/10');
            
            // Réduction de taille
            if (this.bobScale > 0.15) {
                this.bobScale -= 0.02;
                this.player.setScale(this.bobScale);
            }
            
            if (this.patrickAttrapes >= 10) this.gagnerPartie();
        }, null, this);
    }

    update() {
        // On bloque tout si Bob est mort ou a gagné
        if (this.estMort || this.victoire) {
            if (this.victoire) this.player.setVelocityX(400);
            return;
        }

        this.fondRoule.tilePositionX += 3;

        const v = 300;
        if (this.clavier.left.isDown) this.player.setVelocityX(-v);
        else if (this.clavier.right.isDown) this.player.setVelocityX(v);
        else this.player.setVelocityX(0);

        if (this.clavier.up.isDown) this.player.setVelocityY(-v);
        else if (this.clavier.down.isDown) this.player.setVelocityY(v);
        else this.player.setVelocityY(0);

        // Nettoyage des objets hors écran
        this.obstacles.children.each(obs => { if (obs && obs.x < -100) obs.destroy(); });
        this.bonus.children.each(pat => { if (pat && pat.x < -100) pat.destroy(); });
    }

    mortDeBob() {
        if (this.estMort || this.victoire) return;

        this.estMort = true;
        
        // Arrêt des mouvements du décor et des objets
        this.timerPierres.remove();
        this.obstacles.setVelocityX(0);
        this.bonus.setVelocityX(0);

        // Effet de chute de Bob
        this.player.setTint(0xff0000); // Bob devient rouge
        this.player.stop(); // Arrête l'animation de vol
        this.player.setVelocity(0, 500); // Bob tombe vers le bas
        
        // Pause de 2 secondes (2000 ms) avant de redémarrer
        this.time.delayedCall(2000, () => {
            this.scene.restart();
        });
    }

    spawnPierres() {
        if (this.victoire || this.estMort) return;
        let py = Phaser.Math.Between(150, 450);
        let ecart = 260; 

        let h = this.obstacles.create(900, py - ecart, "pierre1");
        h.setVelocityX(-350);
        h.body.allowGravity = false;
        h.body.setSize(h.width - 10, h.height - 10, true);

        let b = this.obstacles.create(900, py + ecart, "pierre2");
        b.setVelocityX(-350);
        b.body.allowGravity = false;
        b.body.setSize(b.width - 10, b.height - 10, true);
    }

    gagnerPartie() {
        this.victoire = true;
        this.obstacles.clear(true, true);
        this.add.text(400, 300, "BRAVO BOB !", {
            fontSize: '64px', fill: '#ffff00', fontFamily: 'Arial Black', stroke: '#000', strokeThickness: 6
        }).setOrigin(0.5).setDepth(15);
    }
}