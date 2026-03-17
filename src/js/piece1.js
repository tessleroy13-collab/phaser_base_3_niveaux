export default class piece1 extends Phaser.Scene {
  constructor() {
    super({ key: "piece1" });
  }

  preload() {
    // Chargement des images et tuiles
    this.load.image("img_dab", "src/assets/tilesets/dab.png");
    this.load.image("img_fond1", "src/assets/tilesets/fond1.png");
    this.load.image("img_plateauxbois", "src/assets/tilesets/plateauxbois.png");
    this.load.image("img_plateaux", "src/assets/plateau.png"); 
    this.load.tilemapTiledJSON("carte", "src/assets/map.tmj");

    // Chargement de Bob
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

    // Calques de tuiles
    const backgroundLayer = carteDuNiveau.createLayer("Calque de Tuiles 4", tousLesTilesets);
    const backgroundLayer2 = carteDuNiveau.createLayer("calque_background_2", tousLesTilesets);
    const plateformesLayer = carteDuNiveau.createLayer("tuiles_de_jeu", tousLesTilesets);

    // Collisions du décor fixe
    plateformesLayer.setCollisionByProperty({ estSolide: true });
    
    if (backgroundLayer2) {
      backgroundLayer2.setDepth(-5);
      backgroundLayer2.setCollisionByExclusion([-1]);
    }

    this.physics.world.TILE_BIAS = 32;
    this.physics.world.setBounds(0, 0, carteDuNiveau.widthInPixels, carteDuNiveau.heightInPixels);

    // Création de Bob
    player = this.physics.add.sprite(100, 50, "img_bob");
    player.setDisplaySize(40, 40);
    player.setCollideWorldBounds(true);
    player.setBounce(0.2);
    player.body.setFriction(0);

    // Collisions Joueur
    this.physics.add.collider(player, plateformesLayer);
    this.physics.add.collider(player, backgroundLayer2, () => { this.mort(player); });

    player.body.onWorldBounds = true;
    this.physics.world.on('worldbounds', (body) => {
      if (body.gameObject === player && body.blocked.down) {
        this.mort(player);
      }
    });

    clavier = this.input.keyboard.createCursorKeys();

    // --- GESTION DES ANIMATIONS (AVEC VÉRIFICATION) ---
    if (!this.anims.exists('left')) {
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
    }

    // --- LOGIQUE PLATEFORMES MOBILES (CORRECTION ORIGINE) ---
    const tab_points = carteDuNiveau.getObjectLayer("departPlatforme");
    if (tab_points) {
      groupe_plateformes = this.physics.add.group({ 
        allowGravity: false, 
        immovable: true 
      });

      tab_points.objects.forEach(obj => {
        // IMPORTANT : On crée le sprite aux coordonnées exactes de Tiled
        let p = groupe_plateformes.create(obj.x, obj.y, "img_plateaux");
        
        // 1. On règle l'origine en bas à gauche (comme dans Tiled)
        p.setOrigin(0, 1); 
        
        // 2. On force la texture et la taille
        p.setTexture("img_plateaux"); 
        p.setDisplaySize(obj.width, obj.height);
        
        // 3. On rafraîchit la hitbox physique pour qu'elle suive l'image
        p.refreshBody(); 
        p.setDepth(10); 

        // Récupération de la distance
        let distMax = 200;
        if (obj.properties) {
          const props = Array.isArray(obj.properties) ? obj.properties : [];
          const dProp = props.find(pr => pr.name === "distance");
          distMax = dProp ? dProp.value : 200;
        }

        p.setVelocityX(80);
        p.direction = "droite";
        p.compteurVitesse = 0;
        p.limiteDeCourse = distMax;
      });

      this.physics.add.collider(player, groupe_plateformes);
    }

    this.cameras.main.setBounds(0, 0, carteDuNiveau.widthInPixels, carteDuNiveau.heightInPixels);
    this.cameras.main.startFollow(player);
  }

  update() {
    if (!clavier || !player || player.isDead) return;

    // Mouvements de Bob
    if (clavier.left.isDown) {
      player.setVelocityX(-160); 
      player.anims.play('left', true); 
    }
    else if (clavier.right.isDown) {
      player.setVelocityX(160); 
      player.anims.play('right', true); 
    }
    else {
      player.setVelocityX(0); 
      player.anims.play('turn'); 
    }

    if (clavier.up.isDown && player.body.blocked.down) {
      player.setVelocityY(-330);
    }

    // Mouvements des plateformes
    if (groupe_plateformes) {
      groupe_plateformes.children.iterate(function (p) {
        p.compteurVitesse++;
        if (p.compteurVitesse >= p.limiteDeCourse) {
          p.direction = (p.direction == "droite") ? "gauche" : "droite";
          p.setVelocityX(p.direction == "droite" ? 80 : -80);
          p.compteurVitesse = 0;
        }
        if (player.body.touching.down && player.body.gameObject === p) {
          player.x += p.body.deltaX();
        }
      });
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

var player;
var groupe_plateformes;
var clavier;