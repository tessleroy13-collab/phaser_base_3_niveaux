export default class piece1 extends Phaser.Scene {
  constructor() {
    super({ key: "piece1" });
  }

  preload() {
    this.load.image("img_fond1", "src/assets/tilesets/fond1.png");
    this.load.image("img_plateauxbois", "src/assets/tilesets/plateauxbois.png");
    this.load.image("img_plateaux", "src/assets/plateau.png");
    this.load.image("porte2", "src/assets/porte2.png");
    this.load.tilemapTiledJSON("carte", "src/assets/map.tmj");
    this.load.spritesheet("img_bob", "src/assets/dude.png", {
      frameWidth: 173,
      frameHeight: 228
    });

    // --- CHARGEMENT DES DEUX IMAGES DE LA RAIE ---
    this.load.image("raie_frame1", "src/assets/Raie.png");
    this.load.image("raie_frame2", "src/assets/Raie25.png");
  }

  create() {
    const carteDuNiveau = this.add.tilemap("carte");
    const tileset_fond = carteDuNiveau.addTilesetImage("fond1", "img_fond1");
    const tileset_bois = carteDuNiveau.addTilesetImage("plateauxbois", "img_plateauxbois");
    const tousLesTilesets = [tileset_fond, tileset_bois];

    const backgroundLayer = carteDuNiveau.createLayer("Calque", tousLesTilesets);
    const plateformesLayer = carteDuNiveau.createLayer("tuiles_de_jeu", tousLesTilesets);

    plateformesLayer.setCollisionByProperty({ estSolide: true });

    const largeurCarte = carteDuNiveau.widthInPixels;
    const hauteurCarte = carteDuNiveau.heightInPixels;
    this.physics.world.setBounds(0, 0, largeurCarte, hauteurCarte);
    this.cameras.main.setBounds(0, 0, largeurCarte, hauteurCarte);

    // PORTE
    this.porte = this.physics.add.sprite(3160, 275, "porte2");
    this.porte.setOrigin(0.5, 0.5);
    this.porte.setImmovable(true);
    this.porte.body.allowGravity = false;
    this.porte.setScale(0.06);
    this.porte.setDepth(5);

    // JOUEUR
    this.player = this.physics.add.sprite(100, 50, "img_bob");
    this.player.setScale(0.2);
    this.player.setCollideWorldBounds(true);
    this.player.body.setGravityY(300);

    this.physics.add.collider(this.player, plateformesLayer);
    this.physics.add.overlap(this.player, this.porte, this.passerPorte, null, this);

    // --- MODIFICATION ICI : DÉTECTION DES BORDURES DU MONDE ---
    this.player.body.onWorldBounds = true;
    this.physics.world.on('worldbounds', (body) => {
      if (body.gameObject === this.player) {
        // Meurt s'il touche le BAS du monde OU le HAUT du monde
        if (body.blocked.down || body.blocked.up) {
          this.mort(this.player);
        }
      }
    });

    this.clavier = this.input.keyboard.createCursorKeys();
    this.toucheEspace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // ANIMATIONS BOB
    if (!this.anims.exists('left')) {
      this.anims.create({ key: 'left', frames: this.anims.generateFrameNumbers('img_bob', { start: 1, end: 3 }), frameRate: 10, repeat: -1 });
      this.anims.create({ key: 'turn', frames: [{ key: 'img_bob', frame: 4 }], frameRate: 20 });
      this.anims.create({ key: 'right', frames: this.anims.generateFrameNumbers('img_bob', { start: 6, end: 8 }), frameRate: 10, repeat: -1 });
    }

    // ANIMATION RAIE
    if (!this.anims.exists('nager_raie')) {
        this.anims.create({
            key: 'nager_raie',
            frames: [{ key: 'raie_frame1' }, { key: 'raie_frame2' }],
            frameRate: 5,
            repeat: -1
        });
    }

    // PLATEFORMES MOBILES
    const tab_points = carteDuNiveau.getObjectLayer("departPlatforme");
    if (tab_points) {
      this.groupe_plateformes = this.physics.add.group({ allowGravity: false, immovable: true });
      tab_points.objects.forEach(obj => {
        let p = this.groupe_plateformes.create(obj.x, obj.y, "img_plateaux");
        p.setOrigin(0, 1);
        p.setDisplaySize(obj.width, obj.height);
        p.refreshBody();
        p.setDepth(10);

        let distMax = 200;
        let plafond = false;
        let vertical = false;

        if (obj.properties) {
          const props = Array.isArray(obj.properties) ? obj.properties : [];
          const dProp = props.find(pr => pr.name === "distance" || pr.name === "distante");
          if (dProp) distMax = dProp.value;
          const gravProp = props.find(pr => pr.name === "inverseGravite");
          if (gravProp) plafond = gravProp.value;
          const vertProp = props.find(pr => pr.name === "estVertical");
          if (vertProp) vertical = vertProp.value;
        }

        p.isPlafond = plafond;
        p.estVertical = vertical;
        p.limiteDeCourse = distMax;
        p.compteurVitesse = Math.floor(Math.random() * distMax);
        p.directionSigne = 1;

        if (p.isPlafond) { p.setVelocity(0, 0); } 
        else {
          if (p.estVertical) p.setVelocityY(80);
          else p.setVelocityX(80);
        }
      });
      this.physics.add.collider(this.player, this.groupe_plateformes);
    }

    // RAIES
    const pointsRaies = carteDuNiveau.getObjectLayer("calque_raie");
    this.groupe_raies = this.physics.add.group({ allowGravity: false, immovable: true });
    if (pointsRaies) {
      pointsRaies.objects.forEach(obj => {
        let raie = this.groupe_raies.create(obj.x, obj.y, "raie_frame1");
        raie.setScale(0.2).play('nager_raie').setFlipX(true).setVelocityX(-120);
      });
    }
    this.physics.add.overlap(this.player, this.groupe_raies, (joueur, raie) => { this.mort(joueur); }, null, this);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
  }

  update() {
    if (!this.clavier || !this.player || this.player.isDead) return;

    // Changement de gravité manuel
    if (this.clavier.down.isDown) {
      this.player.body.setGravityY(-1000);
      this.player.setFlipY(true);
    } else if (this.clavier.up.isDown) {
      this.player.body.setGravityY(300);
      this.player.setFlipY(false);
    }

    // Déplacement
    if (this.clavier.left.isDown) {
      this.player.setVelocityX(-160);
      this.player.anims.play('left', true);
    } else if (this.clavier.right.isDown) {
      this.player.setVelocityX(160);
      this.player.anims.play('right', true);
    } else {
      this.player.setVelocityX(0);
      this.player.anims.play('turn');
    }

    // Saut
    if (Phaser.Input.Keyboard.JustDown(this.toucheEspace)) {
      if (this.player.body.blocked.down || this.player.body.touching.down) {
        this.player.setVelocityY(-350);
      } else if (this.player.body.blocked.up || this.player.body.touching.up) {
        this.player.setVelocityY(350);
      }
    }

    // Plateformes mobiles
    if (this.groupe_plateformes) {
      this.groupe_plateformes.children.iterate((p) => {
        if (!p.isPlafond) {
          p.compteurVitesse++;
          if (p.compteurVitesse >= p.limiteDeCourse) {
            p.directionSigne *= -1;
            let vitesse = 80 * p.directionSigne;
            if (p.estVertical) p.setVelocityY(vitesse);
            else p.setVelocityX(vitesse);
            p.compteurVitesse = 0;
          }
        }
        if ((this.player.body.touching.down || this.player.body.touching.up) && this.player.body.gameObject === p) {
          this.player.x += p.body.deltaX();
          this.player.y += p.body.deltaY();
        }
      });
    }

    // Raies
    if (this.groupe_raies) {
      this.groupe_raies.children.iterate((raie) => {
        raie.setFlipX(raie.body.velocity.x < 0);
        if (raie.x < -100) raie.x = this.physics.world.bounds.width + 100;
        else if (raie.x > this.physics.world.bounds.width + 100) raie.x = -100;
      });
    }
  }

  passerPorte(p, porte) {
    if (!p.isDead) this.scene.start("piece2");
  }

  mort(p) {
    if (!p.isDead) {
      p.isDead = true;
      p.setTint(0xff0000);
      p.setVelocity(0, 0);
      this.time.addEvent({ 
        delay: 1000, 
        callback: () => { this.scene.restart(); }, 
        callbackScope: this 
      });
    }
  }
}