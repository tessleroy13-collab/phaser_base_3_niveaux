export default class piece3 extends Phaser.Scene {
  // constructeur de la classe
  constructor() {
    super({
      key: "piece3" //  ici on précise le nom de la classe en tant qu'identifiant
    });
  }
 
  preload() {
    this.load.spritesheet("img_bobnage", "src/assets/bobnage.png", { 
      frameWidth: 146, 
      frameHeight: 78 
    });
    this.load.image("image_fond", "src/assets/tileset/fond.png");
    this.load.image("image_bob", "src/assets/tileset/tuiles_bob.png");
    this.load.tilemapTiledJSON("cartes", "src/assets/fond_bob.tmj");
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
    this.load.image("img_porte2bis", "src/assets/porte2bis.png");
    this.load.image("img_porte4", "src/assets/porte4.png");
  }
 
  create() {
    const carteDuNiveau = this.add.tilemap("cartes");
    const tileset_fond = carteDuNiveau.addTilesetImage("fond", "image_fond");
    const tileset_bob = carteDuNiveau.addTilesetImage("Sans titre (4) (1)", "image_bob");
 
    carteDuNiveau.createLayer("Calque de Tuiles 4", [tileset_fond, tileset_bob]);
    this.plateformes = carteDuNiveau.createLayer("calque_plateformes", [tileset_fond, tileset_bob]);
    carteDuNiveau.createLayer("calque_plantes", [tileset_fond, tileset_bob]);
    carteDuNiveau.createLayer("calque_coquillages", [tileset_fond, tileset_bob]);
 
    this.plateformes.setCollisionByProperty({ estSolide: true });
 
    this.player = this.physics.add.sprite(100, 300, "img_bobnage").setScale(0.6);
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(10);
    this.player.body.setAllowGravity(false);
    this.physics.add.collider(this.player, this.plateformes);
 
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
 
    this.creerDepuisTiled(carteDuNiveau, "calque_poissons", this.poissons, "anim_poisson", 0.15, "img_poisson");
    this.creerDepuisTiled(carteDuNiveau, "calque_tortues", this.tortues, "anim_tortue", 1.8, "img_tortue");
    this.creerDepuisTiled(carteDuNiveau, "calque_requins", this.requins, "anim_requin", 0.5, "img_requin");
 
    this.porte_retour = this.physics.add.staticSprite(100, 300, "img_porte2bis").setScale(0.4).refreshBody();
    this.porte_devant = this.physics.add.staticSprite(3100, 500, "img_porte4").refreshBody();
 
    this.physics.add.overlap(this.player, this.poissons, this.attraperPoisson, null, this);
    this.physics.add.overlap(this.player, this.tortues, this.attraperTortue, null, this);
    this.physics.add.overlap(this.player, this.requins, this.toucherRequin, null, this);
 
    this.tempsRestant = 30;
    this.texteTimer = this.add.text(16, 16, 'Temps: 30', { fontSize: '32px', fill: '#fff', backgroundColor: '#000' }).setScrollFactor(0).setDepth(100);
 
    this.timerGlobal = this.time.addEvent({
      delay: 1000,
      callback: this.compteARebours,
      callbackScope: this,
      loop: true,
      paused: true
    });
 
    this.jeuLance = false;
    this.vitesse = 120;
    this.offset = 0;
    this.afficherRegles();
  }
 
  creerDepuisTiled(carte, nomCalque, groupe, animation, echelle, image) {
    const calqueObjets = carte.getObjectLayer(nomCalque);
    if (calqueObjets) {
      calqueObjets.objects.forEach(objet => {
        let entite = groupe.create(objet.x, objet.y, image);
        entite.setScale(echelle);
        entite.body.setAllowGravity(false);
        entite.setVelocityX(0); 
        entite.play(animation);
      });
    }
  }
 
  afficherRegles() {
    this.groupeRegles = this.add.container(0, 0).setScrollFactor(0).setDepth(200);
    let fond = this.add.graphics();
    fond.fillStyle(0x000000, 0.8);
    fond.fillRect(200, 150, 400, 300);
    let texte = this.add.text(400, 300, "BIENVENUE !\n\n Atteins la porte de l'autre coté en 30s\n- POISSON : Accélère\n- TORTUE : Ralentit\n- REQUIN / VIDE : Perdu\n\n Appuie sur ESPACE pour commencer", 
      { fontSize: '18px', fill: '#fff', align: 'center', wordWrap: { width: 350 } }).setOrigin(0.5);
    this.groupeRegles.add([fond, texte]);
  }
 
  update() {
    if (!this.jeuLance) {
        if (Phaser.Input.Keyboard.JustDown(this.clavier.space)) {
            this.demarrerPartie();
        }
        return;
    }
 
    if (this.player.isDead) {
        this.player.setVelocity(0, 0); 
        this.texteTimer.setText("DOMMAGE !");
        return; 
    }
 
    this.texteTimer.setText('Temps: ' + this.tempsRestant);
 
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
 
    this.recyclerEnnemis(this.poissons);
    this.recyclerEnnemis(this.tortues);
    this.recyclerEnnemis(this.requins);
 
    if (Phaser.Input.Keyboard.JustDown(this.clavier.space)) {
        if (this.physics.overlap(this.player, this.porte_devant)) {
            this.scene.start("piece4");
        }
    }
}
 
  demarrerPartie() {
    this.groupeRegles.destroy();
    this.jeuLance = true;
    this.timerGlobal.paused = false;
    
    [this.poissons, this.tortues, this.requins].forEach(groupe => {
      groupe.children.iterate(ennemi => {
        ennemi.setVelocityX(Phaser.Math.Between(-120, -70));
      });
    });
  }
 
  recyclerEnnemis(groupe) {
    groupe.children.iterate(ennemi => {
      if (ennemi && ennemi.x < -100) {
        ennemi.x = 3300;
        ennemi.y = Phaser.Math.Between(50, 600);
      }
      if (ennemi && ennemi.body) {
        ennemi.setFlipX(ennemi.body.velocity.x > 0);
      }
    });
  }
 
  attraperPoisson(player, poisson) {
    poisson.x = 3300;
    this.vitesse += 25;
  }
 
  attraperTortue(player, tortue) {
    tortue.x = 3300;
    this.vitesse -= 25;
  }
 
  toucherRequin() {
    if (this.player.isDead) return;
    this.player.isDead = true;
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
    this.tempsRestant--;
    this.texteTimer.setText('Temps: ' + this.tempsRestant);
    if (this.tempsRestant <= 0) this.toucherRequin();
  }
 
  resetTimer() {
    this.tempsRestant = 30;
    this.texteTimer.setText('Temps: 30');
  }
}