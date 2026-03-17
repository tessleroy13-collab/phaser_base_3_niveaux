export default class piece4 extends Phaser.Scene {
  // constructeur de la classe
  constructor() {
    super({
      key: "piece4" //  ici on précise le nom de la classe en tant qu'identifiant
    });
  }



  preload() {
    // tous les assets du jeu sont placés dans le sous-répertoire src/assets/
    this.load.image("img_ciel", "src/assets/sky.png");
    this.load.image("img_plateforme", "src/assets/platform.png");
    this.load.spritesheet("img_perso", "src/assets/dude.png", {
      frameWidth: 212,
      frameHeight: 287
    });

    // chargement de l'image balle.png
    this.load.image("bullet", "src/assets/balle.png");
    // chargement de l'image cible.png
    this.load.image("cible", "src/assets/cible.png");
  }

  create() {


    /*************************************
   *  CREATION DU MONDE + PLATEFORMES  *
   *************************************/

    // On ajoute une simple image de fond, le ciel, au centre de la zone affichée (400, 300)
    // Par défaut le point d'ancrage d'une image est le centre de cette derniere
    this.add.image(400, 300, "img_ciel");

    // la création d'un groupes permet de gérer simultanément les éléments d'une meme famille
    //  Le groupe groupe_plateformes contiendra le sol et deux platesformes sur lesquelles sauter
    // notez le mot clé "staticGroup" : le static indique que ces élements sont fixes : pas de gravite,
    // ni de possibilité de les pousser.
    groupe_plateformes = this.physics.add.staticGroup();
    // une fois le groupe créé, on va créer les platesformes , le sol, et les ajouter au groupe groupe_plateformes

    // l'image img_plateforme fait 400x32. On en met 2 à coté pour faire le sol
    // la méthode create permet de créer et d'ajouter automatiquement des objets à un groupe
    // on précise 2 parametres : chaque coordonnées et la texture de l'objet, et "voila!"
    groupe_plateformes.create(200, 584, "img_plateforme");
    groupe_plateformes.create(600, 584, "img_plateforme");

    //  on ajoute 3 platesformes flottantes
    groupe_plateformes.create(600, 450, "img_plateforme");
    groupe_plateformes.create(50, 300, "img_plateforme");
    groupe_plateformes.create(750, 270, "img_plateforme");

    /****************************
     *  CREATION DU PERSONNAGE  *
     ****************************/

    // On créée un nouveeau personnage : player
    player = this.physics.add.sprite(100, 450, "img_perso");
    player.setScale(0.2);


    //  propriétées physiqyes de l'objet player :
    player.setBounce(0.2); // on donne un petit coefficient de rebond
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
      frames: this.anims.generateFrameNumbers("img_perso", { start: 5, end: 8 }), // on prend toutes les frames de img perso numerotées de 0 à 3
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
      frames: this.anims.generateFrameNumbers("img_perso", { start: 0, end: 3 }),
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

    //  Collide the player and the groupe_etoiles with the groupe_plateformes
    this.physics.add.collider(player, groupe_plateformes);
    player.direction = 'right';
    // création du clavier - code déja présent sur le jeu de départ
    cursors = this.input.keyboard.createCursorKeys();

    // affectation de la touche A à boutonFeu
    boutonFeu = this.input.keyboard.addKey('A');
    // création d'un groupe d'éléments vide
    groupeBullets = this.physics.add.group();

    cibles = this.physics.add.group();
    var cible1 = cibles.create(600, 420, "cible");
    var cible2 = cibles.create(50, 270, "cible");
    var cible3 = cibles.create(750, 240, "cible");
    var cible4 = cibles.create(200, 550, "cible");


    cibles.children.iterate(function (cibleTrouvee) {
      cibleTrouvee.setScale(0.2);   // taille des cibles
      cibleTrouvee.pointsVie = Phaser.Math.Between(1, 5);
    });

    ajouterCible(600, 420);
    ajouterCible(50, 270);
    ajouterCible(750, 240);

    this.physics.add.overlap(groupeBullets, cibles, hit, null, this);


    // ajout du modèle de collision entre cibles et plate-formes
    this.physics.add.collider(cibles, groupe_plateformes);

    scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '32px', fill: '#000' });
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
      player.anims.play("anim_face");
    }

    if (clavier.up.isDown && player.body.touching.down) {
      player.setVelocityY(-330);
    }

    // déclenchement de la fonction tirer() si appui sur boutonFeu 
    if (Phaser.Input.Keyboard.JustDown(boutonFeu)) {
      tirer(player);
    }


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
  bullet.setVelocity(1000 * coefDir, 0); // vitesse en x et en y
  bullet.setScale(0.1);
  bullet.body.setSize(bullet.width * 0.5, bullet.height * 0.5);
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
  cible.setScale(0.2);
  cible.pointsVie = 3;
}


