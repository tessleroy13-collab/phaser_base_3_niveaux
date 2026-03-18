export default class piece4 extends Phaser.Scene {
  constructor() {
    super({ key: "piece4" });
  }

  preload() {
    this.load.image("bullet", "src/assets/balle.png");
    this.load.spritesheet("img_ennemi", "src/assets/cible.png", {
      frameWidth: 128,
      frameHeight: 279
    });
    this.load.tilemapTiledJSON("map", "src/assets/map.json");
    this.load.image("fond", "src/assets/tileset/fond.png");
    this.load.image("deco", "src/assets/tileset/deco.png");
    this.load.spritesheet("img_perso", "src/assets/dude.png", {
      frameWidth: 173,
      frameHeight: 228
    });
    this.load.image("img_porte", "src/assets/porte4.png");
    this.load.image("img_portefin", "src/assets/portefin.png");
  }

  create() {
    this.isRestarting = false; 
    const carte = this.make.tilemap({ key: "map" });
    const tileset_fond = carte.addTilesetImage("fond", "fond");
    const tileset_plateformes = carte.addTilesetImage("claque_plateformes", "deco");
    const calque_fond = carte.createLayer("Calque_de_Tuiles2", tileset_fond);
    
    calque_plateformes = carte.createLayer("calque_plateformes", tileset_plateformes);
    calque_plateformes.setCollisionByProperty({ estSolide: true });
  
    // --- CORRECTION PORTE DÉBUT (Utilise le bon nom "img_porte") ---
    this.porte_retour = this.physics.add.staticSprite(35, 100, "img_porte").setScale(0.4).refreshBody();

    // Personnage Bob
    player = this.physics.add.sprite(80, 100, "img_perso");
    player.setScale(0.2);
    player.body.setSize(60, 210);
    player.body.setOffset(55, 10);
    player.setGravityY(150);
    player.setCollideWorldBounds(true);
    player.setDepth(10);

    // --- (Tes animations Bob et Ennemis restent ici, ne change rien) ---
    if (!this.anims.exists("anim_tourne_gauche")) {
        this.anims.create({ key: "anim_tourne_gauche", frames: this.anims.generateFrameNumbers("img_perso", { start: 1, end: 3 }), frameRate: 10, repeat: -1 });
    }
    if (!this.anims.exists("anim_face")) {
        this.anims.create({ key: "anim_face", frames: [{ key: "img_perso", frame: 4 }], frameRate: 20 });
    }
    if (!this.anims.exists("anim_tourne_droite")) {
        this.anims.create({ key: "anim_tourne_droite", frames: this.anims.generateFrameNumbers("img_perso", { start: 6, end: 8 }), frameRate: 10, repeat: -1 });
    }
    if (!this.anims.exists("ennemi_gauche")) {
        this.anims.create({ key: "ennemi_gauche", frames: this.anims.generateFrameNumbers("img_ennemi", { start: 8, end: 10 }), frameRate: 10, repeat: -1 });
    }
    if (!this.anims.exists("ennemi_droite")) {
        this.anims.create({ key: "ennemi_droite", frames: this.anims.generateFrameNumbers("img_ennemi", { start: 2, end: 4 }), frameRate: 10, repeat: -1 });
    }

    clavier = this.input.keyboard.createCursorKeys();
    boutonFeu = this.input.keyboard.addKey('A');

    // --- CORRECTION PORTE FIN (On ne la crée qu'UNE SEULE FOIS ici) ---
    this.porte_devant = this.physics.add.staticSprite(3155, 380, "img_portefin").setScale(0.6).refreshBody();

    groupeBullets = this.physics.add.group();
    groupe_ennemis = this.physics.add.group();

    const tab_points = carte.getObjectLayer("calque_ennemis");
    if (tab_points) {
      tab_points.objects.forEach(point => {
        if (point.name === "ennemi") {
          var un_ennemi = groupe_ennemis.create(point.x, point.y - 10, "img_ennemi");
          un_ennemi.setScale(0.2);
          un_ennemi.pointsVie = 1;
          un_ennemi.setCollideWorldBounds(true);
          un_ennemi.direction = "gauche";
          un_ennemi.setVelocityX(-40);
          un_ennemi.play("ennemi_gauche", true);
        }
      });
    }

    // Collisions
    this.physics.add.collider(player, calque_plateformes);
    this.physics.add.collider(groupe_ennemis, calque_plateformes);
    this.physics.add.collider(groupeBullets, calque_plateformes, (bullet) => {
    bullet.destroy(); // La balle disparait si elle touche un mur/solide
}, null, this);
    this.physics.add.overlap(groupeBullets, groupe_ennemis, hit, null, this);
    this.physics.add.overlap(player, groupe_ennemis, contactEnnemi, null, this);

    scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '32px', fill: '#000' });

    this.physics.world.setBounds(0, 0, carte.widthInPixels, carte.heightInPixels);
    this.cameras.main.startFollow(player, true, 0.08, 0.08);
    this.cameras.main.setBounds(0, 0, carte.widthInPixels, carte.heightInPixels);
  }

  update() {
    // Nettoyage des balles qui sortent des limites de la map
    groupeBullets.children.each(function(b) {
        if (b.active && (b.x < 0 || b.x > this.physics.world.bounds.width)) {
            b.destroy();
        }
    }, this);

    if (this.isRestarting) return;

    // Mort par la chute
    if (player.y > (this.physics.world.bounds.height - 20) || player.y > 580) {
    this.isRestarting = true;
    player.setTint(0xff0000); // Bob devient ENFIN rouge
    player.setVelocity(0, 0);
    player.body.allowGravity = false;
    
    // On peut aussi arrêter les animations
    player.anims.stop();

    this.tweens.add({
        targets: player,
        x: player.x + 4,
        duration: 40,
        yoyo: true,
        repeat: -1
    });

    this.time.addEvent({
        delay: 2000,
        callback: () => {
            this.isRestarting = false;
            this.scene.restart();
        }
    });
    return;
}

    // Déplacements Bob
    if (clavier.left.isDown) {
      player.direction = 'left';
      player.setVelocityX(-160);
      player.anims.play("anim_tourne_gauche", true);
    } else if (clavier.right.isDown) {
      player.direction = 'right';
      player.setVelocityX(160);
      player.anims.play("anim_tourne_droite", true);
    } else {
      player.setVelocityX(0);
      player.anims.stop();
      player.setFrame(player.direction === 'left' ? 1 : 6);
    }

    if (clavier.up.isDown && (player.body.onFloor() || player.body.touching.down)) {
      player.setVelocityY(-250);
    }

    if (Phaser.Input.Keyboard.JustDown(boutonFeu)) {
      tirer(player);
    }

    // Intelligence Artificielle Ennemis
    groupe_ennemis.children.iterate(function(un_ennemi) {
        if (!un_ennemi) return;
        if (un_ennemi.body.blocked.down) {
            let coords = (un_ennemi.direction === "gauche") ? un_ennemi.getBottomLeft() : un_ennemi.getBottomRight();
            let tuileSuivante = calque_plateformes.getTileAtWorldXY(coords.x, coords.y + 10);
            
            if (tuileSuivante == null || un_ennemi.body.blocked.left || un_ennemi.body.blocked.right) {
                un_ennemi.direction = (un_ennemi.direction === "gauche") ? "droite" : "gauche";
                un_ennemi.setVelocityX(un_ennemi.direction === "droite" ? 40 : -40);
                un_ennemi.play("ennemi_" + un_ennemi.direction, true);
            }
        }
    });
  
    if (Phaser.Input.Keyboard.JustDown(clavier.space)) {
        if (this.physics.overlap(player, this.porte_devant)) {
            this.scene.start("fin"); 
        }
        if (this.physics.overlap(player, this.porte_retour)) {
            this.scene.start("selection");
        }
    }
  }
} // <--- FIN DE LA CLASSE PIECE4

/**************** VARIABLES GLOBALES ****************/
var player;
var clavier;
var boutonFeu;
var groupeBullets;
var score = 0;
var scoreText;
var calque_plateformes;
var groupe_ennemis;
var ennemisTues = 0;
var totalEnnemis = 8;
var messageTexte;

function tirer(player) {
  var coefDir = (player.direction == 'left') ? -1 : 1;
  var bullet = groupeBullets.create(player.x + (25 * coefDir), player.y - 4, 'bullet');
  
  bullet.setCollideWorldBounds(false); 
  
  // On remplace le bug par cette propriété simple :
  bullet.outOfBoundsKill = true; 
  bullet.checkWorldBounds = true;

  bullet.body.allowGravity = false;
  bullet.setVelocity(200 * coefDir, 0); // Vitesse modérée (2000 c'était une téléportation !)
  bullet.setScale(0.07);
}

function hit(bullet, ennemi) {
  // On vérifie que la balle existe encore avant de la détruire
  if (bullet) bullet.destroy();
  
  ennemi.pointsVie--;
  if (ennemi.pointsVie <= 0) {
    ennemi.destroy();
    score += 10;
    scoreText.setText('Score: ' + score);
  }
}

function contactEnnemi(player, ennemi) {
  // Si Bob n'est pas déjà en train de mourir
  if (this.isRestarting === false) {
    this.isRestarting = true;

    // Bob s'arrête et devient rouge
    player.setVelocity(0, 0);
    player.setTint(0xff0000);
    player.anims.stop();
    
    // On peut aussi faire reculer un peu Bob pour l'effet de choc
    player.setVelocityY(-150);

    this.tweens.add({
        targets: player,
        x: player.x + 4,
        duration: 40,
        yoyo: true,
        repeat: -1
    });

    // On attend 2 secondes avant de recommencer
    this.time.addEvent({
      delay: 2000,
      callback: () => {
        this.isRestarting = false;
        this.scene.restart();
      },
      loop: false
    });
  }
}

