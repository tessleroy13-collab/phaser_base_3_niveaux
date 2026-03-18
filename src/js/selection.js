import * as fct from "/src/js/fonctions.js";


var player; 
var clavier; 
var groupe_plateformes;

export default class selection extends Phaser.Scene {
  constructor() {
    super({ key: "selection" }); 
  }


  preload() {
    
    this.load.image("img_ciel", "src/assets/page_acceuil.png");
    this.load.image("img_plateforme", "src/assets/platform.png");
    this.load.spritesheet("img_perso", "src/assets/dude.png", {
      frameWidth: 173,
      frameHeight: 228
    });
    this.load.image("img_porte1", "src/assets/door1.png");
    this.load.image("img_porte2", "src/assets/door2.png");
    this.load.image("img_porte3", "src/assets/door3.png");
    this.load.image("img_porte_debut", "src/assets/portedebut.png"); 
  }


  create() {

    this.add.image(400, 300, "img_ciel");

    this.add.text(400, 100, "Bob Adventure", {
      fontSize: "64px",
      fill: "#f4d03f", // Jaune sable
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 6
    }).setOrigin(0.5);

    // Instruction plus petite
    this.add.text(400, 170, "Avance vers la porte puis clique sur espace pour jouer", {
      fontSize: "20px",
      fill: "#ffffff",
      backgroundColor: "#000000aa", // Fond noir semi-transparent
      padding: { x: 10, y: 5 }
    }).setOrigin(0.5);

    groupe_plateformes = this.physics.add.staticGroup();
    groupe_plateformes.create(200, 584, "img_plateforme")
    groupe_plateformes.create(600, 584, "img_plateforme")
    groupe_plateformes.create(600, 506, "img_plateforme")

    this.porte1 = this.physics.add.staticSprite(600, 470, "img_porte1");
    this.porte2 = this.physics.add.staticSprite(50, 548, "img_porte2");
    this.porte3 = this.physics.add.staticSprite(350, 548, "img_porte3");

    this.portedebut = this.physics.add.staticSprite(724, 377, "img_porte_debut");
    this.portedebut.setScale(0.6);
    this.portedebut.refreshBody();

    player = this.physics.add.sprite(100, 450, "img_perso");
    player.setScale(0.5);
    player.setCollideWorldBounds(true); 
    player.setGravityY(500);

    this.anims.create({
      key: "anim_tourne_gauche", 
      frames: this.anims.generateFrameNumbers("img_perso", {
        start: 1,
        end: 3
      }), 
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
      frames: this.anims.generateFrameNumbers("img_perso", {
        start: 6,
        end: 8
      }),
      frameRate: 10,
      repeat: -1
    });

   
    clavier = this.input.keyboard.createCursorKeys();
    this.physics.add.collider(player, groupe_plateformes);
    this.portedebut.setDepth(0);
    player.setDepth(1);
  }


  update() {
    
    if (clavier.left.isDown) {
      player.setVelocityX(-160);
      player.anims.play("anim_tourne_gauche", true);
    } else if (clavier.right.isDown) {
      player.setVelocityX(160);
      player.anims.play("anim_tourne_droite", true);
    } else {
      player.setVelocityX(0);
      player.anims.play("anim_face");
    }

    if (clavier.up.isDown && player.body.touching.down) {
      player.setVelocityY(-500);
    }

    if (Phaser.Input.Keyboard.JustDown(clavier.space) == true) {
      // Nouvelle porte
    if (this.physics.overlap(player, this.portedebut)) {
        this.scene.switch("piece1");
    }

    // Tes autres portes existantes
      if (this.physics.overlap(player, this.porte1))
        this.scene.switch("piece1");
      if (this.physics.overlap(player, this.porte2))
        this.scene.switch("piece4");
      if (this.physics.overlap(player, this.porte3))
        this.scene.switch("piece3");
    }
  }
}

