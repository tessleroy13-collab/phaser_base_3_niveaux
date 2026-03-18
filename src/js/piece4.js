export default class piece4 extends Phaser.Scene {

  constructor() {
    super({
      key: "piece4" 
    });
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
  }


  create() {

    const carte = this.make.tilemap({ key: "map" });
    const tileset_fond = carte.addTilesetImage("fond", "fond");
    const tileset_plateformes = carte.addTilesetImage("claque_plateformes", "deco");
    const calque_fond = carte.createLayer("Calque_de_Tuiles2", tileset_fond);
    calque_plateformes = carte.createLayer("calque_plateformes", tileset_plateformes);
    calque_plateformes.setCollisionByProperty({ estSolide: true });

    /*************************************

   *  CREATION DU MONDE + PLATEFORMES  *

   *************************************/


    /****************************

     *  CREATION DU PERSONNAGE  *

     ****************************/

    player = this.physics.add.sprite(60, 100, "img_perso");
    player.setScale(0.2);
    player.body.setSize(60, 210); 
    player.body.setOffset(55, 10); 
    player.setGravityY(150);
    player.setCollideWorldBounds(true); 

    /***************************

     *  CREATION DES ANIMATIONS *

     ****************************/

    this.anims.create({
      key: "anim_tourne_gauche", 
      frames: this.anims.generateFrameNumbers("img_perso", { start: 1, end: 3 }), // on prend toutes les frames de img perso numerotées de 0 à 3
      frameRate: 10, 
      repeat: -1 
    });

    this.anims.create({
      key: "anim_face",
      frames: [{ key: "img_perso", frame: 4 }],
      frameRate: 20
    });

    this.anims.create({
      key: "anim_tourne_droite",
      frames: this.anims.generateFrameNumbers("img_perso", { start: 6, end: 8 }),
      frameRate: 10,
      repeat: -1
    });

    /***********************

     *  CREATION DU CLAVIER *

     ************************/
    clavier = this.input.keyboard.createCursorKeys();

    /*****************************************************

     *  GESTION DES INTERATIONS ENTRE  GROUPES ET ELEMENTS *

     ******************************************************/

    this.physics.add.collider(player, calque_plateformes);
    player.direction = 'right';
    cursors = this.input.keyboard.createCursorKeys();
    boutonFeu = this.input.keyboard.addKey('A');
    groupeBullets = this.physics.add.group();

    groupe_ennemis = this.physics.add.group();
    const tab_points = carte.getObjectLayer("calque_ennemis"); 

if (tab_points) {
    tab_points.objects.forEach(point => {
        if (point.name === "ennemi") {
            var un_ennemi = groupe_ennemis.create(point.x, point.y, "img_ennemi");
            un_ennemi.setScale(0.3); 
            un_ennemi.pointsVie = 1; // IMPORTANT pour la fonction hit
            un_ennemi.setCollideWorldBounds(true);
            un_ennemi.direction = "gauche";
            un_ennemi.setVelocityX(-40);
            un_ennemi.play("ennemi_gauche", true);
        }
    });
}

// Gestion des collisions pour les nouveaux ennemis
this.physics.add.collider(groupe_ennemis, calque_plateformes);
this.physics.add.overlap(groupeBullets, groupe_ennemis, hit, null, this);

    scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '32px', fill: '#000' });

    this.physics.world.on("worldbounds", function (body) {
      var objet = body.gameObject;
      if (groupeBullets.contains(objet)) {
        objet.destroy();
      }
    });

this.physics.add.collider(groupe_ennemis, calque_plateformes);
this.physics.add.collider(player, calque_plateformes);
this.physics.world.setBounds(0, 0, carte.widthInPixels, carte.heightInPixels);
this.cameras.main.startFollow(player, true, 0.08, 0.08);
this.cameras.main.setBounds(0, 0, carte.widthInPixels, carte.heightInPixels);

this.anims.create({
  key: "ennemi_gauche",
  frames: this.anims.generateFrameNumbers("img_ennemi", { start: 8, end: 10 }),
  frameRate: 10,
  repeat: -1
});

this.anims.create({
  key: "ennemi_droite",
  frames: this.anims.generateFrameNumbers("img_ennemi", { start: 2, end: 4 }),
  frameRate: 10,
  repeat: -1
});
  }


  update() {

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

  if (player.direction === 'left') {
    player.anims.stop();
    player.setFrame(1); 
  } else {
    player.anims.stop();
    player.setFrame(6); 
  }
}
   if (clavier.up.isDown && (player.body.onFloor() || player.body.touching.down)) {
    player.setVelocityY(-250);
}
    if (Phaser.Input.Keyboard.JustDown(boutonFeu)) {
      tirer(player);
    }

    groupe_ennemis.children.iterate(function iterateur(un_ennemi) {
    if (un_ennemi.direction == "gauche" && un_ennemi.body.blocked.down) {
      var coords = un_ennemi.getBottomLeft();
      var tuileSuivante = calque_plateformes.getTileAtWorldXY(
        coords.x,
        coords.y + 10
      );
      if (tuileSuivante == null || un_ennemi.body.blocked.left) {
    un_ennemi.direction = "droite";
    un_ennemi.setVelocityX(40);
    un_ennemi.play("ennemi_droite", true); // CHANGEMENT ICI
}
    } else if (un_ennemi.direction == "droite" && un_ennemi.body.blocked.down) {
      var coords = un_ennemi.getBottomRight();
      var tuileSuivante = calque_plateformes.getTileAtWorldXY(
        coords.x,
        coords.y + 10
      );
      if (tuileSuivante == null || un_ennemi.body.blocked.right) {
    un_ennemi.direction = "gauche";
    un_ennemi.setVelocityX(-40);
    un_ennemi.play("ennemi_gauche", true); // CHANGEMENT ICI
}
    }
  });
  }
}

/***********************************************************************/

/** VARIABLES GLOBALES

/***********************************************************************/

var player; 
var groupe_plateformes; 
var clavier; 
var boutonFeu;
var groupeBullets;
var cursors;
var score = 0;
var scoreText;
var calque_plateformes;
var groupe_ennemis;

function tirer(player) {
  var coefDir;
  if (player.direction == 'left') { coefDir = -1; } else { coefDir = 1 }
  var bullet = groupeBullets.create(player.x + (25 * coefDir), player.y - 4, 'bullet');
  bullet.setCollideWorldBounds(true);
  bullet.body.onWorldBounds = true;
  bullet.body.allowGravity = false;
  bullet.setVelocity(300 * coefDir, 0); 
  bullet.setScale(0.07);
  bullet.body.setSize(bullet.width * 0.5, bullet.height * 0.5);
  player.setVelocityX(0);
}


function hit(bullet, ennemi) {
  bullet.destroy(); // La balle disparaît
  ennemi.pointsVie--; // On baisse les points de vie de l'ennemi touché
  
  if (ennemi.pointsVie <= 0) {
    ennemi.destroy(); // L'ennemi meurt s'il n0a plus de vie
    score += 10;
    scoreText.setText('Score: ' + score);
  }
}