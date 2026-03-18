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
  }

  create() {
    const carteDuNiveau = this.add.tilemap("carte");
    const tileset_fond = carteDuNiveau.addTilesetImage("fond1", "img_fond1");
    const tileset_bois = carteDuNiveau.addTilesetImage("plateauxbois", "img_plateauxbois");
    const tousLesTilesets = [tileset_fond, tileset_bois];

    const backgroundLayer = carteDuNiveau.createLayer("Calque de Tuiles 4", tousLesTilesets);
    const plateformesLayer = carteDuNiveau.createLayer("tuiles_de_jeu", tousLesTilesets);

    plateformesLayer.setCollisionByProperty({ estSolide: true });

    const largeurCarte = carteDuNiveau.widthInPixels;
    const hauteurCarte = carteDuNiveau.heightInPixels;
    this.physics.world.setBounds(0, 0, largeurCarte, hauteurCarte);
    this.cameras.main.setBounds(0, 0, largeurCarte, hauteurCarte);

    // --- CONFIGURATION DE LA PORTE ---
    this.porte = this.physics.add.sprite(3150, 100, "porte2");
    this.porte.setOrigin(0.5, 0.5);
    this.porte.setImmovable(true);
    this.porte.body.allowGravity = false;
    this.porte.setScale(0.03);
    this.porte.setDepth(5);

    // JOUEUR
    this.player = this.physics.add.sprite(100, 50, "img_bob");
    this.player.setScale(0.2);
    this.player.setCollideWorldBounds(true);
    this.player.body.setGravityY(300);

    this.physics.add.collider(this.player, plateformesLayer);

    // Collision avec la porte -> Déclenche la fonction passerPorte
    this.physics.add.overlap(this.player, this.porte, this.passerPorte, null, this);

    this.player.body.onWorldBounds = true;
    this.physics.world.on('worldbounds', (body) => {
      if (body.gameObject === this.player && body.blocked.down) {
        this.mort(this.player);
      }
    });

    this.clavier = this.input.keyboard.createCursorKeys();

    if (!this.anims.exists('left')) {
      this.anims.create({ key: 'left', frames: this.anims.generateFrameNumbers('img_bob', { start: 1, end: 3 }), frameRate: 10, repeat: -1 });
      this.anims.create({ key: 'turn', frames: [{ key: 'img_bob', frame: 4 }], frameRate: 20 });
      this.anims.create({ key: 'right', frames: this.anims.generateFrameNumbers('img_bob', { start: 6, end: 8 }), frameRate: 10, repeat: -1 });
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

        if (p.isPlafond) {
          p.setVelocity(0, 0);
        } else {
          if (p.estVertical) p.setVelocityY(80);
          else p.setVelocityX(80);
        }
      });

      this.physics.add.collider(this.player, this.groupe_plateformes, (joueur, plateforme) => {
        if (plateforme.isPlafond) {
          joueur.body.setGravityY(-1000);
          joueur.setFlipY(true);
        }
      });
    }

    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
  }

  update() {
    if (!this.clavier || !this.player || this.player.isDead) return;

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

    if (this.clavier.down.isDown) {
      this.player.body.setGravityY(0);
      this.player.setFlipY(false);
    }

    const surSolOuPlanche = this.player.body.blocked.down || this.player.body.touching.down;
    const sousPlancheInversee = this.player.body.blocked.up || this.player.body.touching.up;

    if (this.clavier.up.isDown) {
      if (surSolOuPlanche && this.player.body.gravity.y >= 0) {
        this.player.setVelocityY(-350);
      } else if (sousPlancheInversee && this.player.body.gravity.y < 0) {
        this.player.setVelocityY(350);
      }
    }

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
        // Entraînement du joueur par la plateforme
        if ((this.player.body.touching.down || this.player.body.touching.up) && this.player.body.gameObject === p) {
          this.player.x += p.body.deltaX();
          this.player.y += p.body.deltaY();
        }
      });
    }
  }

  // --- LA FONCTION POUR CHANGER DE PIÈCE ---
  passerPorte(p, porte) {
    if (!p.isDead) {
      p.setVelocity(0, 0);
      // On lance la scène suivante !
      this.scene.start("piece2");
    }
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