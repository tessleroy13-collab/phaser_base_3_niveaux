export default class piece1 extends Phaser.Scene {
  constructor() {
    super({ key: "piece1" });
  }

  preload() {
    this.load.image("img_fond1", "src/assets/tilesets/fond1.png");
    this.load.image("img_plateauxbois", "src/assets/tilesets/plateauxbois.png");
    this.load.image("img_plateaux", "src/assets/plateau.png"); 
    this.load.tilemapTiledJSON("carte", "src/assets/map.tmj");
    this.load.spritesheet("img_bob", "src/assets/bob.png", {
      frameWidth: 173, frameHeight: 228
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

    player = this.physics.add.sprite(100, 50, "img_bob");
    player.setDisplaySize(40, 40);
    player.setCollideWorldBounds(true);
    player.body.setGravityY(300); 

    this.physics.add.collider(player, plateformesLayer);

    player.body.onWorldBounds = true;
    this.physics.world.on('worldbounds', (body) => {
      if (body.gameObject === player && body.blocked.down) {
        this.mort(player);
      }
    });

    clavier = this.input.keyboard.createCursorKeys();

    if (!this.anims.exists('left')) {
        this.anims.create({ key: 'left', frames: this.anims.generateFrameNumbers('img_bob', { start: 1, end: 3 }), frameRate: 10, repeat: -1 });
        this.anims.create({ key: 'turn', frames: [{ key: 'img_bob', frame: 4 }], frameRate: 20 });
        this.anims.create({ key: 'right', frames: this.anims.generateFrameNumbers('img_bob', { start: 6, end: 8 }), frameRate: 10, repeat: -1 });
    }

    const tab_points = carteDuNiveau.getObjectLayer("departPlatforme");
    if (tab_points) {
      groupe_plateformes = this.physics.add.group({ allowGravity: false, immovable: true });

      tab_points.objects.forEach(obj => {
        let p = groupe_plateformes.create(obj.x, obj.y, "img_plateaux");
        p.setOrigin(0, 1);
        p.setDisplaySize(obj.width, obj.height);
        p.refreshBody();
        p.setDepth(10);

        let distMax = 200;
        let plafond = false;
        let vertical = false; // Nouvelle propriété
        
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
        p.estVertical = vertical; // On stocke l'info
        p.limiteDeCourse = distMax;
        p.compteurVitesse = Math.floor(Math.random() * distMax); 
        p.directionSigne = 1; // 1 pour droite/bas, -1 pour gauche/haut
        
        if (p.isPlafond) {
          p.setVelocity(0, 0);
        } else {
          if (p.estVertical) {
            p.setVelocityY(80);
          } else {
            p.setVelocityX(80);
          }
        }
      });

      this.physics.add.collider(player, groupe_plateformes, (p, plateforme) => {
          if (plateforme.isPlafond) {
              p.body.setGravityY(-1000); 
              p.setFlipY(true);
          }
      });
    }

    this.cameras.main.startFollow(player, true, 0.1, 0.1);
  }

  update() {
    if (!clavier || !player || player.isDead) return;

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

    if (clavier.down.isDown) {
        player.body.setGravityY(0); 
        player.setFlipY(false);
    }

    const surSolOuPlanche = player.body.blocked.down || player.body.touching.down;
    const sousPlancheInversee = player.body.blocked.up || player.body.touching.up;

    if (clavier.up.isDown) {
        if (surSolOuPlanche && player.body.gravity.y >= 0) {
            player.setVelocityY(-350);
        } else if (sousPlancheInversee && player.body.gravity.y < 0) {
            player.setVelocityY(350); 
        }
    }

    if (groupe_plateformes) {
      groupe_plateformes.children.iterate(function (p) {
        if (!p.isPlafond) {
            p.compteurVitesse++;
            if (p.compteurVitesse >= p.limiteDeCourse) {
              p.directionSigne *= -1; // On inverse la direction
              let vitesse = 80 * p.directionSigne;
              
              if (p.estVertical) {
                p.setVelocityY(vitesse);
              } else {
                p.setVelocityX(vitesse);
              }
              p.compteurVitesse = 0;
            }
        }

        // Entraînement de Bob (horizontal ET vertical)
        if ((player.body.touching.down || player.body.touching.up) && player.body.gameObject === p) {
          player.x += p.body.deltaX();
          player.y += p.body.deltaY(); // Important pour les plateformes qui montent/descendent
        }
      });
    }
  }

  mort(p) {
    if (!p.isDead) {
      p.isDead = true;
      p.setTint(0xff0000);
      p.setVelocity(0, 0);
      this.time.addEvent({ delay: 1000, callback: () => { this.scene.restart(); }, callbackScope: this });
    }
  }
}

var player;
var groupe_plateformes;
var clavier;