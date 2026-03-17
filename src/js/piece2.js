export default class piece2 extends Phaser.Scene {
    constructor() {
        super({ key: "piece2" });
    }

    init() {
        this.patrickAttrapes = 0;
        this.victoire = false;
        this.estMort = false; 
        this.bobScale = 0.3; // Taille de départ
    }

    preload() {
        this.load.spritesheet("bob", "src/assets/bob.png", { frameWidth: 282, frameHeight: 416 });
        this.load.image("patrick", "src/assets/patrick.png");
        this.load.image("pierre1", "src/assets/tileset/pierre1.png");
        this.load.image("pierre2", "src/assets/tileset/pierre2.png");
        this.load.image("FondBOB_image", "src/assets/tileset/FD bob FINAL.png"); 
        this.load.tilemapTiledJSON("carte", "src/assets/FondBOB.json");
    }

    create() {
        // 1. FOND
        this.fondRoule = this.add.tileSprite(400, 300, 800, 600, "FondBOB_image").setDepth(-1);

        // 2. JOUEUR (BOB)
        this.player = this.physics.add.sprite(150, 300, "bob");
        
        if (!this.anims.exists("bob_vol")) {
            this.anims.create({
                key: "bob_vol",
                frames: this.anims.generateFrameNumbers("bob", { start: 0, end: 8 }),
                frameRate: 10, repeat: -1
            });
        }
        
        this.player.play("bob_vol");
        this.player.setScale(this.bobScale);
        this.player.body.setSize(160, 260, true); 
        this.player.setCollideWorldBounds(false); 
        this.player.body.allowGravity = false;
        this.player.setDepth(5);

        // 3. GROUPES
        this.obstacles = this.physics.add.group();
        this.bonus = this.physics.add.group();

        // 4. CHARGEMENT TILED (Optionnel si tu en as mis sur la carte)
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

        // 5. INTERFACE
        this.scoreText = this.add.text(16, 16, 'Patricks: 0/6', { 
            fontSize: '24px', fill: '#fff', stroke: '#000', strokeThickness: 3 
        }).setDepth(10).setScrollFactor(0);

        // 6. CONTRÔLES
        this.clavier = this.input.keyboard.createCursorKeys();

        // 7. GÉNÉRATION AUTOMATIQUE (Pierres + Patrick)
        this.timerPierres = this.time.addEvent({
            delay: 1500,
            callback: this.spawnObstacles,
            callbackScope: this,
            loop: true
        });

        // 8. COLLISIONS
        this.physics.add.overlap(this.player, this.obstacles, this.mortDeBob, null, this);

        this.physics.add.overlap(this.player, this.bonus, (p, pat) => {
            if (this.estMort) return;
            pat.destroy();
            this.patrickAttrapes++;
            this.scoreText.setText('Patricks: ' + this.patrickAttrapes + '/6');
            
            // --- BOB RAPETISSIT ICI ---
            if (this.bobScale > 0.12) { // Limite pour ne pas qu'il disparaisse
                this.bobScale -= 0.03;
                this.player.setScale(this.bobScale);
            }
            
            if (this.patrickAttrapes >= 6) this.gagnerPartie();
        }, null, this);
    }

    update() {
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

        // Nettoyage des objets sortis de l'écran
        this.obstacles.children.each(obs => { if (obs && obs.x < -100) obs.destroy(); });
        this.bonus.children.each(pat => { if (pat && pat.x < -100) pat.destroy(); });
    }

    spawnObstacles() {
        if (this.victoire || this.estMort) return;
        let py = Phaser.Math.Between(150, 450);
        let ecart = 260; 

        // Création des pierres
        let h = this.obstacles.create(900, py - ecart, "pierre1");
        h.setVelocityX(-350); h.body.allowGravity = false;
        
        let b = this.obstacles.create(900, py + ecart, "pierre2");
        b.setVelocityX(-350); b.body.allowGravity = false;

        // --- APPARITION INFINIE DE PATRICK ---
        // 40% de chance qu'un Patrick apparaisse entre les deux pierres
        if (Phaser.Math.Between(0, 10) > 6) {
            let p = this.bonus.create(1000, py, "patrick");
            p.setScale(0.5);
            p.body.allowGravity = false;
            p.setVelocityX(-350); // Même vitesse que les pierres
        }
    }

    mortDeBob() {
        if (this.estMort || this.victoire) return;
        this.estMort = true;
        this.timerPierres.remove();
        this.obstacles.setVelocityX(0);
        this.bonus.setVelocityX(0);

        this.player.setTint(0xff0000); 
        this.player.stop(); 
        this.player.setVelocity(0, 500); 
        
        this.time.delayedCall(2000, () => {
            this.scene.restart();
        });
    }

    gagnerPartie() {
        this.victoire = true;
        this.obstacles.clear(true, true);
        this.add.text(400, 300, "BRAVO BOB !", {
            fontSize: '64px', fill: '#ffff00', fontFamily: 'Arial Black', stroke: '#000', strokeThickness: 6
        }).setOrigin(0.5).setDepth(15);
    }
}