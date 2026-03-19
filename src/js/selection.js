// On importe les fonctions externes si on en a besoin (même si on ne les utilise pas encore ici)
import * as fct from "/src/js/fonctions.js";

// On déclare nos variables globales pour le joueur, les touches et les plateformes
var player;
var clavier;
var groupe_plateformes;

export default class selection extends Phaser.Scene {
  constructor() {
    // On donne le nom "selection" à cette scène
    super({ key: "selection" });
  }

  preload() {
    // Chargement de l'image de fond (le menu d'accueil)
    this.load.image("img_ciel", "src/assets/page_acceuil.png");
    // Chargement des blocs pour le sol
    this.load.image("img_plateforme", "src/assets/platform.png");
    // Chargement du perso avec ses cases pour l'animer
    this.load.spritesheet("img_perso", "src/assets/dude.png", {
      frameWidth: 173,
      frameHeight: 228
    });
    // Chargement des différentes portes vers les niveaux
    this.load.image("img_porte_debut", "src/assets/portedebut.png");
  }

  create() {
    // On affiche l'image de fond au milieu
    this.add.image(400, 300, "img_ciel");

    // On affiche le titre du jeu en gros avec un contour noir
    this.add.text(400, 100, "Bob Adventure", {
      fontSize: "64px",
      fill: "#f4d03f", // Jaune
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 6
    }).setOrigin(0.5);

    // Petit texte pour expliquer au joueur quoi faire
    this.add.text(400, 170, "Avance vers la porte puis clique sur espace pour jouer", {
      fontSize: "20px",
      fill: "#ffffff",
      backgroundColor: "#000000aa", // Petit fond noir transparent pour mieux voir
      padding: { x: 10, y: 5 }
    }).setOrigin(0.5);

    // On crée le sol qui ne bouge pas (statique)
    groupe_plateformes = this.physics.add.staticGroup();
    groupe_plateformes.create(200, 584, "img_plateforme")
    groupe_plateformes.create(600, 584, "img_plateforme")
    groupe_plateformes.create(600, 506, "img_plateforme")

    

    // La porte principale du début
    this.portedebut = this.physics.add.staticSprite(724, 377, "img_porte_debut");
    this.portedebut.setScale(0.6);
    this.portedebut.refreshBody(); // On rafraîchit la hitbox après avoir changé la taille

    // Création de Bob (le perso)
    player = this.physics.add.sprite(100, 450, "img_perso");
    player.setScale(0.5);
    player.setCollideWorldBounds(true); // Empêche Bob de sortir de l'écran
    player.setGravityY(500); // Bob tombe vers le bas

    // Création des animations : Gauche, Face et Droite
    this.anims.create({
      key: "anim_tourne_gauche",
      frames: this.anims.generateFrameNumbers("img_perso", { start: 1, end: 3 }),
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

    // On active les touches du clavier
    clavier = this.input.keyboard.createCursorKeys();
    
    // On fait en sorte que Bob puisse marcher sur le sol
    this.physics.add.collider(player, groupe_plateformes);
    
    // On gère l'ordre d'affichage (profondeur) pour que Bob passe devant la porte
    this.portedebut.setDepth(0);
    player.setDepth(1);
  }

  update() {
    // Déplacement à gauche
    if (clavier.left.isDown) {
      player.setVelocityX(-160);
      player.anims.play("anim_tourne_gauche", true);
    } 
    // Déplacement à droite
    else if (clavier.right.isDown) {
      player.setVelocityX(160);
      player.anims.play("anim_tourne_droite", true);
    } 
    // Si on ne touche à rien : Bob s'arrête de face
    else {
      player.setVelocityX(0);
      player.anims.play("anim_face");
    }

    // Sauter (seulement si Bob touche le sol)
    if (clavier.up.isDown && player.body.touching.down) {
      player.setVelocityY(-500);
    }

    // Si on appuie sur ESPACE devant une porte
    if (Phaser.Input.Keyboard.JustDown(clavier.space) == true) {
      
      // Si on est sur la porte de début, on va à la pièce 1
      if (this.physics.overlap(player, this.portedebut)) {
          this.scene.switch("piece1");
      }

    
    }
  }
}