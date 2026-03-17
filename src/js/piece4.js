export default class piece4 extends Phaser.Scene {
  // constructeur de la classe
  constructor() {
    super({
      key: "piece4" //  ici on précise le nom de la classe en tant qu'identifiant
    });
  }



  preload() {
    // tous les assets du jeu sont placés dans le sous-répertoire src/assets/
    
    

    // chargement de l'image balle.png
    this.load.image("bullet", "src/assets/balle.png");
    // chargement de l'image cible.png
    this.load.image("img_ennemi", "src/assets/cible.png");

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

    // 1. Chargement des jeux de tuiles
    // On utilise "claque_plateformes" car c'est le nom écrit dans ton onglet Tiled
    const tileset_fond = carte.addTilesetImage("fond", "fond");
    const tileset_plateformes = carte.addTilesetImage("claque_plateformes", "deco");

    // 2. Création des calques
    // L'ordre est important : le fond en premier pour qu'il soit derrière
    const calque_fond = carte.createLayer("Calque_de_Tuiles2", tileset_fond);
    calque_plateformes = carte.createLayer("calque_plateformes", tileset_plateformes);

    // 3. Activation des collisions
    calque_plateformes.setCollisionByProperty({ estSolide: true });
    /*************************************
   *  CREATION DU MONDE + PLATEFORMES  *
   *************************************/

    /****************************
     *  CREATION DU PERSONNAGE  *
     ****************************/

    // On créée un nouveeau personnage : player
    player = this.physics.add.sprite(60, 100, "img_perso");
    player.setScale(0.2);

    player.body.setSize(60, 210); // Ajuste ces chiffres pour que le rectangle rose colle au corps de Bob
    player.body.setOffset(55, 10); // Pour centrer le rectangle sur le dessin

    player.setGravityY(150);


    //  propriétées physiqyes de l'objet player :
    player.setCollideWorldBounds(true); // le player se cognera contre les bords du monde

    /***************************
     *  CREATION DES ANIMATIONS *
     ****************************/
    // dans cette partie, on crée les animations, à partir des spritesheet
    // chaque animation est une succession de frame à vitesse de défilement défini
    // une animation doit avoir un nom. Quand on voudra la jouer sur un sprite, on utilisera la méthode play()
    // creation de l'animation "anim_tourne_gauche" qui sera jouée sur le player lorsque ce dernier tourne à gauche
    this.anims.create({
      key: "anim_tourne_gauche", // key est le nom de l'animation : doit etre unique poru la scene.
      frames: this.anims.generateFrameNumbers("img_perso", { start: 1, end: 3 }), // on prend toutes les frames de img perso numerotées de 0 à 3
      frameRate: 10, // vitesse de défilement des frames
      repeat: -1 // nombre de répétitions de l'animation. -1 = infini
    });

    // creation de l'animation "anim_tourne_face" qui sera jouée sur le player lorsque ce dernier n'avance pas.
    this.anims.create({
      key: "anim_face",
      frames: [{ key: "img_perso", frame: 4 }],
      frameRate: 20
    });

    // creation de l'animation "anim_tourne_droite" qui sera jouée sur le player lorsque ce dernier tourne à droite
    this.anims.create({
      key: "anim_tourne_droite",
      frames: this.anims.generateFrameNumbers("img_perso", { start: 6, end: 8 }),
      frameRate: 10,
      repeat: -1
    });

    /***********************
     *  CREATION DU CLAVIER *
     ************************/
    // ceci permet de creer un clavier et de mapper des touches, connaitre l'état des touches
    clavier = this.input.keyboard.createCursorKeys();

    /*****************************************************
     *  GESTION DES INTERATIONS ENTRE  GROUPES ET ELEMENTS *
     ******************************************************/
    this.physics.add.collider(player, calque_plateformes);

    player.direction = 'right';
    // création du clavier - code déja présent sur le jeu de départ
    cursors = this.input.keyboard.createCursorKeys();

    // affectation de la touche A à boutonFeu
    boutonFeu = this.input.keyboard.addKey('A');
    // création d'un groupe d'éléments vide
    groupeBullets = this.physics.add.group();

    cibles = this.physics.add.group();
    this.physics.add.collider(cibles, calque_plateformes);

    ajouterCible(600, 420);
    ajouterCible(50, 270);
    ajouterCible(750, 240);
    ajouterCible(200, 520);

    this.physics.add.overlap(groupeBullets, cibles, hit, null, this);


    scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '32px', fill: '#000' });

    // instructions pour les objets surveillés en bord de monde
    this.physics.world.on("worldbounds", function (body) {
      // on récupère l'objet surveillé
      var objet = body.gameObject;
      // s'il s'agit d'une balle
      if (groupeBullets.contains(objet)) {
        // on le détruit
        objet.destroy();
      }
    });

  groupe_ennemis = this.physics.add.group();

  // extraction des poitns depuis le calque calque_ennemis, stockage dans tab_points
  const tab_points = carte.getObjectLayer("calque_ennemis");   

  // on fait une boucle foreach, qui parcours chaque élements du tableau tab_points  
  tab_points.objects.forEach(point => {
    if (point.name == "ennemi") {
      var nouvel_ennemi = this.physics.add.sprite(point.x, point.y, "img_ennemi");
      groupe_ennemis.add(nouvel_ennemi);
    }
}); 

  // par défaut, on va a gauche en utilisant la meme animation que le personnage
  groupe_ennemis.children.iterate(function iterateur(un_ennemi) {
    un_ennemi.setVelocityX(-40);
    un_ennemi.direction = "gauche";
    un_ennemi.play("anim_tourne_gauche", true);
  }); 

  this.physics.add.collider(groupe_ennemis, calque_plateformes);
  this.physics.add.collider(player, calque_plateformes);

  // On définit les limites du monde physique (la taille de ta carte Tiled)
this.physics.world.setBounds(0, 0, carte.widthInPixels, carte.heightInPixels);

// On demande à la caméra de suivre le joueur
this.cameras.main.startFollow(player, true, 0.08, 0.08);

// On limite la caméra aux bords de la carte pour ne pas voir le vide noir
this.cameras.main.setBounds(0, 0, carte.widthInPixels, carte.heightInPixels);
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
    player.setFrame(1); // frame fixe gauche
  } else {
    player.anims.stop();
    player.setFrame(6); // frame fixe droite
  }
}

   if (clavier.up.isDown && (player.body.onFloor() || player.body.touching.down)) {
    // -250 pour sauter moins haut, mais avec l'impression de flotter
    player.setVelocityY(-250); 
}
    // déclenchement de la fonction tirer() si appui sur boutonFeu 
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
        // on risque de marcher dans le vide, on tourne
        un_ennemi.direction = "droite";
        un_ennemi.setVelocityX(40);
        un_ennemi.play("anim_tourne_droite", true);
      }
    } else if (un_ennemi.direction == "droite" && un_ennemi.body.blocked.down) {
      var coords = un_ennemi.getBottomRight();
      var tuileSuivante = calque_plateformes.getTileAtWorldXY(
        coords.x,
        coords.y + 10
      );
      if (tuileSuivante == null || un_ennemi.body.blocked.right) {
        // on risque de marcher dans le vide, on tourne
        un_ennemi.direction = "gauche";
        un_ennemi.setVelocityX(-40);
        un_ennemi.play("anim_tourne_gauche", true);
      }
    }
  });
  }

 
}

/***********************************************************************/
/** VARIABLES GLOBALES 
/***********************************************************************/
var player; // désigne le sprite du joueur
var groupe_plateformes; // contient toutes les plateformes
var clavier; // pour la gestion du clavier
var boutonFeu;
// mise en place d'une variable groupeBullets
var groupeBullets;
// mise en place d'une variable groupeCibles
var groupeCibles;
var cursors;
var cibles;
var score = 0;
var scoreText;
var calque_plateformes;
var groupe_ennemis;


//fonction tirer( ), prenant comme paramètre l'auteur du tir
function tirer(player) {
  var coefDir;
  if (player.direction == 'left') { coefDir = -1; } else { coefDir = 1 }
  // on crée la balle a coté du joueur
  var bullet = groupeBullets.create(player.x + (25 * coefDir), player.y - 4, 'bullet');
  // parametres physiques de la balle.
  bullet.setCollideWorldBounds(true);
  // on acive la détection de l'evenement "collision au bornes"
  bullet.body.onWorldBounds = true;
  bullet.body.allowGravity = false;
  bullet.setVelocity(300 * coefDir, 0); // vitesse en x et en y
  bullet.setScale(0.07);
  bullet.body.setSize(bullet.width * 0.5, bullet.height * 0.5);
  player.setVelocityX(0);
}

// fonction déclenchée lorsque uneBalle et uneCible se superposent
function hit(bullet, cible) {
  cible.pointsVie--;
  if (cible.pointsVie == 0) {
    cible.destroy();
  }
  bullet.destroy();

  score += 10;
  scoreText.setText('Score: ' + score);
}


function ajouterCible(x, y) {
  var cible = cibles.create(x, y, "cible");
  cible.setScale(0.1);
  cible.pointsVie = 1;
}


