export default class piece4 extends Phaser.Scene {
  constructor() {
    // On définit le nom de la scène pour pouvoir switch entre les niveaux
    super({ key: "piece4" });
  }

  preload() {
    // Ici, je charge toutes mes images et mes feuilles de sprites
    this.load.image("bullet", "src/assets/balle.png");
    this.load.spritesheet("img_ennemi", "src/assets/cible.png", {
      frameWidth: 128, // Taille d'une frame d'ennemi en largeur
      frameHeight: 279 // Taille d'une frame d'ennemi en hauteur
    });
    
    // Chargement de la carte JSON faite sur Tiled et des images du décor
    this.load.tilemapTiledJSON("map", "src/assets/map.json");
    this.load.image("fond", "src/assets/tileset/fond.png");
    this.load.image("deco", "src/assets/tileset/deco.png");
    
    // Le spritesheet de mon perso principal avec ses dimensions
    this.load.spritesheet("img_perso", "src/assets/dude.png", {
      frameWidth: 173,
      frameHeight: 228
    });
    
    // Les assets pour les portes d'entrée et de sortie
    this.load.image("img_porte", "src/assets/porte4.png");
    this.load.image("img_portefin", "src/assets/portefin.png");
  }

  create() {
    // Reset du score et des états au début de la scène
    score = 0;
    this.isRestarting = false;
    this.isVideoPlaying = false;

    // --- MISE EN PLACE DU DECOR ---
    const carte = this.make.tilemap({ key: "map" });
    const tileset_fond = carte.addTilesetImage("fond", "fond");
    const tileset_plateformes = carte.addTilesetImage("claque_plateformes", "deco");

    // Création des couches (layers) de ma map
    const calque_fond = carte.createLayer("Calque_de_Tuiles2", tileset_fond);
    calque_plateformes = carte.createLayer("calque_plateformes", tileset_plateformes);
    
    // J'active la collision pour tout ce qui est marqué "estSolide" dans Tiled
    calque_plateformes.setCollisionByProperty({ estSolide: true });

    // Placement des portes sur la map (statiques pour qu'elles ne tombent pas)
    this.porte_retour = this.physics.add.staticSprite(35, 100, "img_porte").setScale(0.4).refreshBody();
    this.porte_devant = this.physics.add.staticSprite(3155, 380, "img_portefin").setScale(0.6).refreshBody();

    // --- CONFIGURATION DU JOUEUR ---
    player = this.physics.add.sprite(80, 100, "img_perso");
    player.setScale(0.2); // Je le rétrécis car l'image de base est trop grande
    player.body.setSize(60, 210); // Je retaille sa hitbox pour qu'elle soit plus précise
    player.body.setOffset(55, 10); // Je décale la hitbox pour bien l'aligner sur le perso
    player.setGravityY(150); // Petite gravité pour un saut fluide
    player.setCollideWorldBounds(true); // Empêche le perso de sortir de la map
    player.setDepth(10); // Pour qu'il passe devant le décor

    // --- CREATION DES ANIMATIONS ---
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

    // Assignation des touches
    clavier = this.input.keyboard.createCursorKeys();
    boutonFeu = this.input.keyboard.addKey('A');

    // Groupes pour gérer plusieurs objets d'un coup
    groupeBullets = this.physics.add.group();
    groupe_ennemis = this.physics.add.group();

    // --- POP DES ENNEMIS VIA LA MAP TILED ---
    const tab_points = carte.getObjectLayer("calque_ennemis");
    if (tab_points) {
      tab_points.objects.forEach(point => {
        if (point.name === "ennemi") {
          var un_ennemi = groupe_ennemis.create(point.x, point.y - 10, "img_ennemi");
          un_ennemi.setScale(0.2);
          un_ennemi.pointsVie = 1;
          un_ennemi.setCollideWorldBounds(true); //je l'empêche de sortir des limites du monde (les bords de la map)
          un_ennemi.direction = "gauche";
          un_ennemi.setVelocityX(-40); // Ils commencent en marchant vers la gauche
          un_ennemi.play("ennemi_gauche", true); //je lance l'animation de marche vers la gauche
          // Le "true" signifie : "ne redémarre pas l'anim si elle est déjà en cours"
        }
      });
    }

    // --- LOGIQUE DES COLLISIONS ---
    this.physics.add.collider(player, calque_plateformes);
    this.physics.add.collider(groupe_ennemis, calque_plateformes);
    // Si la balle touche le sol, elle disparaît
    this.physics.add.collider(groupeBullets, calque_plateformes, (bullet) => { bullet.destroy(); });
    // Overlap : quand deux objets se touchent sans forcément bloquer (balle/ennemi et joueur/ennemi)
    this.physics.add.overlap(groupeBullets, groupe_ennemis, hit, null, this);
    this.physics.add.overlap(player, groupe_ennemis, contactEnnemi, null, this);

    // Texte du score fixé à l'écran (ScrollFactor 0)
    scoreText = this.add.text(16, 16, 'Cibles : 0 / ' + totalEnnemis, { fontSize: '32px', fill: '#000' });
    scoreText.setScrollFactor(0);

    // Caméra qui suit mon joueur
    this.physics.world.setBounds(0, 0, carte.widthInPixels, carte.heightInPixels);
    this.cameras.main.startFollow(player, true, 0.08, 0.08);
    this.cameras.main.setBounds(0, 0, carte.widthInPixels, carte.heightInPixels);

    // --- INTERFACE DE DEBUT (CONSIGNES) ---
    if (premierLancement) {
      this.physics.pause(); // Je bloque le jeu au début
      this.isPausedAtStart = true;

      // Un petit rectangle noir transparent pour faire ressortir le texte
      let fondConsignes = this.add.rectangle(
        this.cameras.main.centerX,
        this.cameras.main.centerY,
        600, 300, 0x000000, 0.8
      ).setOrigin(0.5).setDepth(100).setScrollFactor(0).setStrokeStyle(4, 0xff00a2);

      let texteConsignes = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY - 20,
        "MISSION :\nÉlimine les " + totalEnnemis + " ennemis pour sortir !\n\n[A] pour tirer\n[Flèches] pour bouger\n\n-- APPUIE SUR [ENTRÉE] POUR COMMENCER --",
        {
          fontSize: '22px',
          fill: '#ffffff',
          align: 'center',
          fontStyle: 'bold',
          wordWrap: { width: 550 }
        }
      ).setOrigin(0.5).setDepth(101).setScrollFactor(0);

      this.toucheEntree = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);

      // Fonction pour enlever les consignes et libérer la physique
      const demarrerJeu = () => {
        if (!this.isPausedAtStart) return;
        this.physics.resume();
        this.isPausedAtStart = false;
        premierLancement = false;

        // Petit effet de fondu pour faire propre
        this.tweens.add({
          targets: [fondConsignes, texteConsignes],
          alpha: 0,
          duration: 500,
          onComplete: () => {
            fondConsignes.destroy();
            texteConsignes.destroy();
          }
        });
      };

      this.toucheEntree.on('down', demarrerJeu);

    } else {
      this.isPausedAtStart = false;
      this.physics.resume();
    }
  }

  update() {
    // Si une condition de pause est active, j'arrête de lire l'update
    if (this.isRestarting || this.isVideoPlaying || this.isPausedAtStart) return;

    // Detection de chute : si le perso tombe trop bas, il meurt
    if (player.y > (this.physics.world.bounds.height - 20) || player.y > 580) {
      this.mortPersonnage();
      return;
    }

    // --- CONTROLES DU JOUEUR ---
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
      // Je remets la frame de face selon la dernière direction regardée
      player.setFrame(player.direction === 'left' ? 1 : 6);
    }

    // Gestion du saut (seulement si on touche le sol)
    if (clavier.up.isDown && (player.body.onFloor() || player.body.touching.down)) {
      player.setVelocityY(-250);
    }

    // Tirer une balle
    if (Phaser.Input.Keyboard.JustDown(boutonFeu)) {
      tirer(player);
    }

    // --- IA DES ENNEMIS (PATROUILLE) ---
    groupe_ennemis.children.iterate(function (un_ennemi) {
      if (!un_ennemi) return;
      if (un_ennemi.body.blocked.down) {
        // Je checke s'il y a du vide devant l'ennemi pour qu'il ne tombe pas
        let coords = (un_ennemi.direction === "gauche") ? un_ennemi.getBottomLeft() : un_ennemi.getBottomRight();
        let tuileSuivante = calque_plateformes.getTileAtWorldXY(coords.x, coords.y + 10);
        
        // S'il n'y a plus de sol ou s'il cogne un mur, il change de sens
        if (tuileSuivante == null || un_ennemi.body.blocked.left || un_ennemi.body.blocked.right) {
          un_ennemi.direction = (un_ennemi.direction === "gauche") ? "droite" : "gauche";
          un_ennemi.setVelocityX(un_ennemi.direction === "droite" ? 40 : -40);
          un_ennemi.play("ennemi_" + un_ennemi.direction, true);
        }
      }
    });

    // --- INTERACTIONS AVEC LES PORTES (BARRE ESPACE) ---
    if (Phaser.Input.Keyboard.JustDown(clavier.space)) {
      // Porte de fin : check si on a tué assez d'ennemis
      if (this.physics.overlap(player, this.porte_devant)) {
        if (score >= totalEnnemis) {
          this.afficherVideoFin();
        } else {
          // Sinon j'affiche un message d'erreur temporaire
          let reste = totalEnnemis - score;
          let msg = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY,
            "MISSION INCOMPLÈTE\nIl te reste " + reste + " ennemi(s) !",
            {
              fontSize: '28px',
              fill: '#ff00a2',
              backgroundColor: '#000000',
              padding: { x: 20, y: 10 },
              align: 'center',
              fontStyle: 'bold'
            }
          ).setOrigin(0.5).setDepth(100).setScrollFactor(0);
          this.time.addEvent({
            delay: 3500,
            callback: () => { msg.destroy(); }
          });
        }
      }
      // Porte pour revenir au menu de sélection
      if (this.physics.overlap(player, this.porte_retour)) {
        this.scene.start("selection");
      }
    }
  }

  // Fonction pour lancer la vidéo finale (gérée en HTML/CSS hors Phaser)
  afficherVideoFin() {
    const videoContainer = document.getElementById('video-fin-container');
    const maVideo = document.getElementById('maVideo');
    const gameCanvas = this.sys.game.canvas;
    if (videoContainer && maVideo) {
      this.isVideoPlaying = true;
      this.physics.pause();
      if (gameCanvas) gameCanvas.style.display = 'none'; // Je cache le canvas du jeu
      videoContainer.style.display = 'flex';
      maVideo.loop = true;
      maVideo.play().catch(error => {
        console.error("Erreur lecture vidéo : ", error);
      });
    } else {
      console.error("Éléments vidéo introuvables dans l'index.html");
    }
  }

  // Fonction appelée quand le joueur perd
  mortPersonnage() {
    this.isRestarting = true;
    player.setTint(0xff0000); // Le joueur devient rouge
    player.setVelocity(0, 0);
    player.body.allowGravity = false;
    player.anims.stop();
    // Petit effet de tremblement avant de restart
    this.tweens.add({ targets: player, x: player.x + 4, duration: 40, yoyo: true, repeat: -1 });
    this.time.addEvent({ delay: 2000, callback: () => { this.isRestarting = false; this.scene.restart(); } });
  }
}

// --- VARIABLES ET FONCTIONS GLOBALES ---
var player, clavier, boutonFeu, groupeBullets, score = 0, scoreText, calque_plateformes, groupe_ennemis, totalEnnemis = 8, premierLancement = true;

// Fonction de tir : on calcule le sens du tir selon la direction du perso
function tirer(player) {
  var coefDir = (player.direction == 'left') ? -1 : 1;
  var bullet = groupeBullets.create(player.x + (25 * coefDir), player.y - 4, 'bullet');
  bullet.body.allowGravity = false; // Les balles ne tombent pas
  bullet.setVelocity(250 * coefDir, 0); // Vitesse de la balle
  bullet.setScale(0.07);
}

// Quand la balle touche l'ennemi
function hit(bullet, ennemi) {
  if (bullet) bullet.destroy(); // Suppression de la balle
  ennemi.pointsVie--;
  if (ennemi.pointsVie <= 0) {
    ennemi.destroy(); // L'ennemi disparaît
    score += 1;
    scoreText.setText('Cibles : ' + score + ' / ' + totalEnnemis);
  }
}

// Quand l'ennemi touche le joueur
function contactEnnemi(player, ennemi) {
  if (this.isRestarting === false) {
    this.mortPersonnage();
  }
}