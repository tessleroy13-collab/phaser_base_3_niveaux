export default class piece1 extends Phaser.Scene {
  constructor() {
    super({ key: "piece1" });
  }

  preload() {
    this.load.image("img_dab", "src/assets/tilesets/dab.png");
    this.load.image("img_fond1", "src/assets/tilesets/fond1.png");
    this.load.image("img_plateauxbois", "src/assets/tilesets/plateauxbois.png");
    
    // CORRECTION ICI : On charge l'image de la plateforme normalement
    this.load.image("img_plateaux", "src/assets/plateau.png");

    this.load.tilemapTiledJSON("carte", "src/assets/map.tmj");

    this.load.spritesheet("img_bob", "src/assets/bob.png", {
      frameWidth: 173,
      frameHeight: 228
    });
  }

  create() {
    const carteDuNiveau = this.add.tilemap("carte");

    const tileset_dab = carteDuNiveau.addTilesetImage("dab", "img_dab");
    const tileset_fond = carteDuNiveau.addTilesetImage("fond1", "img_fond1");
    const tileset_bois = carteDuNiveau.addTilesetImage("plateauxbois", "img_plateauxbois");

    const tousLesTilesets = [tileset_dab, tileset_fond, tileset_bois];

    const background1 = carteDuNiveau.createLayer("Calque de Tuiles 4", tousLesTilesets);
    const background2 = carteDuNiveau.createLayer("calque_background_2", tousLesTilesets);
    const plateformesLayer = carteDuNiveau.createLayer("tuiles_de_jeu", tousLesTilesets);

    if (background1) background1.setDepth(-10);
    if (background2) background2.setDepth(-5);

    if (plateformesLayer) {
      plateformesLayer.setCollisionByProperty({ estSolide: true });
    }

    player = this.physics.add.sprite(100, 100, "img_bob");
    player.setDisplaySize(40, 40);
    player.setCollideWorldBounds(true);
    player.setBounce(0.1);
    player.setDepth(10);

    this.physics.add.collider(player, plateformesLayer);
    clavier = this.input.keyboard.createCursorKeys();

    // --- ANIMATIONS ---
    this.anims.create({
      key: 'left',
      frames: this.anims.generateFrameNumbers('img_bob', { start: 1, end: 3 }),
      frameRate: 10, repeat: -1
    });
    this.anims.create({
      key: 'turn',
      frames: [{ key: 'img_bob', frame: 4 }],
      frameRate: 20
    });
    this.anims.create({
      key: 'right',
      frames: this.anims.generateFrameNumbers('img_bob', { start: 6, end: 8 }),
      frameRate: 10, repeat: -1
    });

    // --- PLATEFORME MOBILE ---
    const pointDepart = carteDuNiveau.findObject("Calque d'Objets 1", obj => obj.name === "departPlateforme");

    if (pointDepart) {
        // On assigne à la variable globale déclarée en bas
        plateformeMobile = this.physics.add.image(pointDepart.x, pointDepart.y, "img_plateaux");
        plateformeMobile.setImmovable(true);
        plateformeMobile.body.allowGravity = false;

        this.tweens.add({
          targets: plateformeMobile,
          x: plateformeMobile.x + 200,
          duration: 2000,
          ease: 'Power1',
          yoyo: true,
          repeat: -1
        });

        this.physics.add.collider(player, plateformeMobile);
    }

    this.cameras.main.setBounds(0, 0, carteDuNiveau.widthInPixels, carteDuNiveau.heightInPixels);
    this.cameras.main.startFollow(player);
    this.physics.world.setBounds(0, 0, carteDuNiveau.widthInPixels, carteDuNiveau.heightInPixels);
  }

  update() {
    if (!clavier || !player) return;

    if (clavier.left.isDown) {
      player.setVelocityX(-160);
      player.anims.play('left', true);
    } else if (clavier.right.isDown) {
      player.setVelocityX(160);
      player.anims.play('right', true);
    } else {
      player.setVelocityX(0);
      player.anims.play('turn');
    }

    if (clavier.up.isDown && player.body.blocked.down) {
      player.setVelocityY(-200);
    }

    // Effet pour que Bob suive la plateforme quand il est dessus
    if (plateformeMobile && player.body.touching.down) {
        player.x += plateformeMobile.body.deltaX();
    }
  }
}

// Variables globales
var player;
var clavier;
var plateformeMobile; // On la déclare ici pour qu'elle soit utilisable dans update()