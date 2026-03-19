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
    this.isVideoPlaying = false; 

    const carte = this.make.tilemap({ key: "map" });
    const tileset_fond = carte.addTilesetImage("fond", "fond");
    const tileset_plateformes = carte.addTilesetImage("claque_plateformes", "deco");
    
    const calque_fond = carte.createLayer("Calque_de_Tuiles2", tileset_fond);
    calque_plateformes = carte.createLayer("calque_plateformes", tileset_plateformes);
    calque_plateformes.setCollisionByProperty({ estSolide: true });

    // Portes
    this.porte_retour = this.physics.add.staticSprite(35, 100, "img_porte").setScale(0.4).refreshBody();
    this.porte_devant = this.physics.add.staticSprite(3155, 380, "img_portefin").setScale(0.6).refreshBody();

    // Personnage Bob
    player = this.physics.add.sprite(80, 100, "img_perso");
    player.setScale(0.2);
    player.body.setSize(60, 210);
    player.body.setOffset(55, 10);
    player.setGravityY(150);
    player.setCollideWorldBounds(true);
    player.setDepth(10);

    // Animations
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
    this.physics.add.collider(groupeBullets, calque_plateformes, (bullet) => { bullet.destroy(); });
    this.physics.add.overlap(groupeBullets, groupe_ennemis, hit, null, this);
    this.physics.add.overlap(player, groupe_ennemis, contactEnnemi, null, this);

    scoreText = this.add.text(16, 16, 'Cibles : 0 / ' + totalEnnemis, { fontSize: '32px', fill: '#000' });
    scoreText.setScrollFactor(0);

    this.physics.world.setBounds(0, 0, carte.widthInPixels, carte.heightInPixels);
    this.cameras.main.startFollow(player, true, 0.08, 0.08);
    this.cameras.main.setBounds(0, 0, carte.widthInPixels, carte.heightInPixels);
  }

  update() {
    if (this.isRestarting || this.isVideoPlaying) return;

    // Mort par chute
    if (player.y > (this.physics.world.bounds.height - 20) || player.y > 580) {
      this.mortPersonnage();
      return;
    }

    // Déplacements
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

    // IA Ennemis
    groupe_ennemis.children.iterate(function (un_ennemi) {
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

    // Interaction Portes
   if (Phaser.Input.Keyboard.JustDown(clavier.space)) {
      // 1. PORTE DE FIN
      if (this.physics.overlap(player, this.porte_devant)) {
        if (score >= totalEnnemis) {
          this.afficherVideoFin(); 
        } else {
          // Affichage du message d'erreur BIEN VISIBLE au centre
          let reste = totalEnnemis - score;
          let msg = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY, 
            "MISSION INCOMPLÈTE\nIl te reste " + reste + " cible(s) !", 
            { 
              fontSize: '28px', 
              fill: '#ff00a2', 
              backgroundColor: '#000000',
              padding: { x: 20, y: 10 },
              align: 'center',
              fontStyle: 'bold'
            }
          ).setOrigin(0.5).setDepth(100).setScrollFactor(0);

          // Le message disparaît après 2.5 secondes
          this.time.addEvent({
            delay: 2500,
            callback: () => { msg.destroy(); }
          });
        }
      }

      // 2. PORTE DE RETOUR
      if (this.physics.overlap(player, this.porte_retour)) {
        this.scene.start("selection");
      }
    }
  }

  afficherVideoFin() {
    const videoContainer = document.getElementById('video-fin-container');
    const maVideo = document.getElementById('maVideo');
    const gameCanvas = this.sys.game.canvas;

    if (videoContainer && maVideo) {
        this.isVideoPlaying = true;
        this.physics.pause(); 

        if (gameCanvas) gameCanvas.style.display = 'none'; 
        videoContainer.style.display = 'flex'; 

        // --- SÉCURITÉ BOUCLE ---
        maVideo.loop = true; 

        maVideo.play().catch(error => {
            console.error("Erreur lecture vidéo : ", error);
        });
        
        // Pas de redirection automatique ici pour laisser boucler.
    } else {
        console.error("Éléments vidéo introuvables dans l'index.html");
    }
  }

  mortPersonnage() {
    this.isRestarting = true;
    player.setTint(0xff0000);
    player.setVelocity(0, 0);
    player.body.allowGravity = false;
    player.anims.stop();
    this.tweens.add({ targets: player, x: player.x + 4, duration: 40, yoyo: true, repeat: -1 });
    this.time.addEvent({ delay: 2000, callback: () => { this.isRestarting = false; this.scene.restart(); } });
  }
}

// Variables Globales
var player, clavier, boutonFeu, groupeBullets, score = 0, scoreText, calque_plateformes, groupe_ennemis, totalEnnemis = 8;

function tirer(player) {
  var coefDir = (player.direction == 'left') ? -1 : 1;
  var bullet = groupeBullets.create(player.x + (25 * coefDir), player.y - 4, 'bullet');
  bullet.body.allowGravity = false;
  bullet.setVelocity(250 * coefDir, 0);
  bullet.setScale(0.07);
}

function hit(bullet, ennemi) {
  if (bullet) bullet.destroy();
  ennemi.pointsVie--;
  if (ennemi.pointsVie <= 0) {
    ennemi.destroy();
    score += 1;
    scoreText.setText('Cibles : ' + score + ' / ' + totalEnnemis);
  }
}

function contactEnnemi(player, ennemi) {
  if (this.isRestarting === false) {
    this.mortPersonnage();
  }
}