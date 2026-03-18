
export default class piece3 extends Phaser.Scene {
  // constructeur de la classe
  constructor() {
    super({
      key: "piece3" //  ici on précise le nom de la classe en tant qu'identifiant
    });
  }

git config --global user.email "eloise.brest@epfedu.fr"
  git config --global user.name "eloise-bst"
  preload() {
    this.load.spritesheet("img_bobnage", "src/assets/bobnage.png", { 
      frameWidth: 146, 
      frameHeight: 78
    });
    this.load.image("image_fond", "src/assets/tileset/fond.png");
    this.load.image("image_bob", "src/assets/tileset/tuiles_bob.png");
    this.load.tilemapTiledJSON("carte", "src/assets/fond_bob.tmj");
    this.load.spritesheet("img_poisson", "src/assets/poisson.png", { 
      frameWidth: 316, 
      frameHeight: 216 
    });
    this.load.spritesheet("img_tortue", "src/assets/tortue.png", { 
      frameWidth: 46, 
      frameHeight: 16 
    });
    this.load.spritesheet("img_requin", "src/assets/requins.png", { 
      frameWidth: 288, 
      frameHeight: 135 
    });
    this.load.image("img_porteouverte", "src/assets/porteouverte.png");
  }

  create() {
    const carteDuNiveau = this.add.tilemap("carte");
    const tileset_fond = carteDuNiveau.addTilesetImage("fond", "image_fond");
    const tileset_bob = carteDuNiveau.addTilesetImage("Sans titre (4) (1)", "image_bob");
    const tousLesTilesets = [tileset_fond, tileset_bob];

    const fond = carteDuNiveau.createLayer("Calque de Tuiles 4", tousLesTilesets);
    const plateformes = carteDuNiveau.createLayer("calque_plateformes", tousLesTilesets);
    carteDuNiveau.createLayer("calque_plantes", tousLesTilesets);
    carteDuNiveau.createLayer("calque_coquillages", tousLesTilesets);

    plateformes.setCollisionByProperty({ estSolide: true });

    this.player = this.physics.add.sprite(100, 300, "img_bobnage").setScale(0.6); 
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(10);
    this.player.body.setAllowGravity(false);
    this.physics.add.collider(this.player, plateformes); 
    this.clavier = this.input.keyboard.createCursorKeys();

    this.physics.world.setBounds(0, 0, 3200, 640);
    this.cameras.main.setBounds(0, 0, 3200, 640);
    this.cameras.main.startFollow(this.player);

    this.anims.create({ 
      key: "nage_gauche", 
      frames: this.anims.generateFrameNumbers("img_bobnage", { 
        start: 0, 
        end: 6 
      }), 
      frameRate: 10, 
      repeat: -1 
    });

    this.anims.create({ 
      key: "nage_droite", 
      frames: this.anims.generateFrameNumbers("img_bobnage", { 
        start: 7, 
        end: 13 
      }), 
      frameRate: 10, 
      repeat: -1 
    });

    this.anims.create({ 
      key: "nage_statique", 
      frames: [{ 
        key: "img_bobnage", 
        frame: 7 
      }], 
      frameRate: 10 
    });

    this.anims.create({ 
      key: "anim_poisson", 
      frames: this.anims.generateFrameNumbers("img_poisson", { 
        start: 0, 
        end: 3 
      }), 
      frameRate: 8, 
      repeat: -1 
    });

    this.anims.create({ 
      key: "anim_tortue", 
      frames: this.anims.generateFrameNumbers("img_tortue", { 
        start: 0, 
        end: 5 
      }), 
      frameRate: 6, 
      repeat: -1 
    });

    this.anims.create({ 
      key: "anim_requin", 
      frames: this.anims.generateFrameNumbers("img_requin", { 
        start: 0, 
        end: 5 
      }), 
      frameRate: 10, 
      repeat: -1 
    });

    this.poissons = this.physics.add.group();
    this.tortues = this.physics.add.group();
    this.requins = this.physics.add.group();
    this.poissons.setDepth(5);
    this.tortues.setDepth(5);
    this.requins.setDepth(5);

    const spawnLayer = (name, group, anim, scale, cleImage) => {
      const layer = carteDuNiveau.getObjectLayer(name);
      if (layer) {
        layer.objects.forEach(obj => {
          let en = group.create(obj.x, obj.y, cleImage);
          en.setScale(scale);
          en.body.setAllowGravity(false);
          en.setVelocityX(0);
          en.play(anim);
        });
      }
    };

    spawnLayer("calque_poissons", this.poissons, "anim_poisson", 0.15, "img_poisson");
    spawnLayer("calque_tortues", this.tortues, "anim_tortue", 1.8, "img_tortue");
    spawnLayer("calque_requins", this.requins, "anim_requin", 0.5, "img_requin");

    this.porte_retour = this.physics.add.staticSprite(100, 300, "img_porteouverte");
    this.porte_retour.setScale(0.4).refreshBody().setDepth(1);

    this.physics.add.overlap(this.player, this.poissons, this.attraperPoisson, null, this);
    this.physics.add.overlap(this.player, this.tortues, this.attraperTortue, null, this);
    this.physics.add.overlap(this.player, this.requins, this.toucherRequin, null, this);

    this.physics.world.on("worldbounds", (body) => {
      if (body.gameObject === this.player && body.blocked.down) this.toucherRequin();
    });
    this.player.body.onWorldBounds = true;

    // === TIMER ===
    this.tempsRestant = 30;
    this.texteTimer = this.add.text(16, 16, 'Temps: 30', { fontSize: '32px', fill: '#ffffff', backgroundColor: '#000000' });
    this.texteTimer.setScrollFactor(0).setDepth(100);
    this.timerGlobal = this.time.addEvent({
        delay: 1000,
        callback: this.compteARebours,
        callbackScope: this,
        loop: true,
        paused: true // PAUSE AU DÉBUT
    });

    // === RÈGLES ET PAUSE ===
    this.jeuLance = false; 
    this.groupeRegles = this.add.container(0, 0).setScrollFactor(0).setDepth(200);
    let fondRegles = this.add.graphics();
    fondRegles.fillStyle(0x000000, 0.8);
    fondRegles.fillRect(200, 150, 400, 300);
    let texteRegles = this.add.text(400, 300, 
        "BIENVENUE !\n\n Atteins la PORTE en moins de 30s\n- POISSON : Accélère (+)\n- TORTUE : Ralentit (-)\n- REQUIN / VIDE : Tu meurs\n\nAppuie sur ESPACE pour commencer", 
        { fontSize: '18px', fill: '#ffffff', align: 'center', wordWrap: { width: 350 } }
    ).setOrigin(0.5);
    this.groupeRegles.add([fondRegles, texteRegles]);

    this.vitesse = 120;
    this.offset = 0;
  }

  update() {
    // === GESTION DU DÉMARRAGE ===
    if (!this.jeuLance) {
        if (Phaser.Input.Keyboard.JustDown(this.clavier.space)) {
    this.groupeRegles.destroy();
    this.jeuLance = true;
    this.timerGlobal.paused = false;

    // Vitesse lente pour les TORTUES (ex: entre -40 et -60)
    this.tortues.children.iterate(t => {
        t.setVelocityX(Phaser.Math.Between(-60, -40));
    });

    // Vitesse rapide pour les REQUINS (ex: entre -150 et -200)
    this.requins.children.iterate(r => {
        r.setVelocityX(Phaser.Math.Between(-200, -150));
    });

    // Vitesse normale pour les POISSONS
    this.poissons.children.iterate(p => {
        p.setVelocityX(Phaser.Math.Between(-120, -70));
    });
}
    }
    
    if (this.player.isDead) return;

    // === MOUVEMENTS BOB ===
    if (this.clavier.left.isDown) {
      this.player.setVelocityX(-this.vitesse);
      this.player.anims.play("nage_gauche", true);
    } else if (this.clavier.right.isDown) {
      this.player.setVelocityX(this.vitesse);
      this.player.anims.play("nage_droite", true);
    } else {
      this.player.setVelocityX(0);
      this.player.anims.play("nage_statique", true);
    }

    if (this.clavier.up.isDown) this.player.setVelocityY(-150);
    else if (this.clavier.down.isDown) this.player.setVelocityY(150);
    else this.player.setVelocityY(0);

    this.offset += 0.03;
    this.player.y += Math.sin(this.offset) * 0.5;

    if (this.player.y > 630) this.toucherRequin();

    // === RECYCLAGE ET FLIP ===
    [this.poissons, this.tortues, this.requins].forEach(groupe => {
      groupe.children.iterate(ennemi => {
        if (ennemi) {
          if (ennemi.x < -100) {
            ennemi.x = 3300; 
            ennemi.y = Phaser.Math.Between(50, 600);
          }
          if (ennemi.body) ennemi.setFlipX(ennemi.body.velocity.x > 0);
        }
      });
    });

    // === PORTE ===
    if (Phaser.Input.Keyboard.JustDown(this.clavier.space)) {
      if (this.physics.overlap(this.player, this.porte_retour)) {
        this.scene.start("selection");
      }
    }
  }

  // === FONCTIONS ===
  attraperPoisson(player, poisson) {
    poisson.x = 3300;
    poisson.y = Phaser.Math.Between(50, 600);
    this.vitesse += 25;
  }

  attraperTortue(player, tortue) {
    tortue.x = 3300;
    tortue.y = Phaser.Math.Between(50, 600);
    this.vitesse -= 25;
  }

  toucherRequin() {
    if (this.player.isDead) return;
    this.player.isDead = true;
    this.vitesse = 0;
    this.player.setTint(0xff0000);
    this.player.setVelocity(0, 0);
    this.cameras.main.shake(300, 0.02);

    this.time.delayedCall(800, () => {
        this.player.setPosition(100, 300);
        this.player.clearTint();
        this.vitesse = 120;
        this.player.isDead = false;
        this.resetTimer(); 
    });
  }

  compteARebours() {
    if (this.player.isDead || !this.jeuLance) return;
    this.tempsRestant -= 1;
    this.texteTimer.setText('Temps: ' + this.tempsRestant);
    if (this.tempsRestant <= 0) this.toucherRequin();
  }

  resetTimer() {
    this.tempsRestant = 30;
    this.texteTimer.setText('Temps: 30');
  }
}