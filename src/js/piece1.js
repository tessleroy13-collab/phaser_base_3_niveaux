export default class piece1 extends Phaser.Scene {
  // constructeur de la classe
  constructor() {
    super({
      key: "piece1" //  ici on précise le nom de la classe en tant qu'identifiant
    });
  }
  preload() {
    this.load.image("img_ciel", "src/assets/sky.png");

    this.load.spritesheet("img_bob", "src/assets/bob.png", {
      frameWidth: 173,
      frameHeight: 228
    });
  }

  create() {
    this.add.image(400, 300, "img_ciel");

    player = this.physics.add.sprite(1000, 450, "img_bob");
    player.setDisplaySize(40, 40);

    //player.setFrame(0);
    player.setCollideWorldBounds(true);
    player.setBounce(0.2);
    groupe_plateformes = this.physics.add.staticGroup();
    this.physics.add.collider(player, groupe_plateformes);

    clavier = this.input.keyboard.createCursorKeys();


    this.anims.create({
      key: 'left',
      frames: this.anims.generateFrameNumbers('img_bob', { start: 1, end: 3 }), // Ajuste les chiffres selon ton spritesheet
      frameRate: 10,
      repeat: -1
    });

    // Animation quand il ne bouge pas (face caméra)
    this.anims.create({
      key: 'turn',
      frames: [{ key: 'img_bob', frame: 4 }], // Frame d'arrêt
      frameRate: 20
    });

    // Animation pour aller à droite
    this.anims.create({
      key: 'right',
      frames: this.anims.generateFrameNumbers('img_bob', { start: 6, end: 8 }), // Ajuste les chiffres selon ton spritesheet
      frameRate: 10,
      repeat: -1
    });
  }

  update() {
    //  LOGIQUE DE DÉPLACEMENT 

    if (clavier.left.isDown) {
      player.setVelocityX(-160); // Vitesse vers la gauche
      player.anims.play('left', true); // Joue l'anim gauche
    }
    else if (clavier.right.isDown) {
      player.setVelocityX(160); // Vitesse vers la droite
      player.anims.play('right', true); // Joue l'anim droite
    }
    else {
      player.setVelocityX(0); // S'arrête si on ne touche à rien
      player.anims.play('turn'); // Anim de face
    }

    // Saut : si la touche "Haut" est pressée ET que le joueur touche le sol
    if (clavier.up.isDown && player.body.touching.down) {
      player.setVelocityY(-330);
    }
  }

  update() {
    if (clavier.left.isDown) {
      player.setVelocityX(-160); // Vitesse vers la gauche
      player.anims.play('left', true); // Joue l'anim gauche
    }
    else if (clavier.right.isDown) {
      player.setVelocityX(160); // Vitesse vers la droite
      player.anims.play('right', true); // Joue l'anim droite
    }
    else {
      player.setVelocityX(0); // S'arrête si on ne touche à rien
      player.anims.play('turn'); // Anim de face
    }

    // Saut : si la touche "Haut" est pressée ET que le joueur touche le sol
    if (clavier.up.isDown && player.body.touching.down) {
      player.setVelocityY(-330);
    }
  }
}

var player;

var groupe_plateformes;

var clavier; 
