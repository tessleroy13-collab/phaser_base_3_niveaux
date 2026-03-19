export default class piece1 extends Phaser.Scene {
  constructor() {
    super({ key: "piece1" });
  }

  preload() {
    this.load.image("img_fond1", "src/assets/tilesets/fond1.png");
    this.load.image("img_plateauxbois", "src/assets/tilesets/plateauxbois.png");
    this.load.image("img_plateaux", "src/assets/plateau.png");
    this.load.image("porte2", "src/assets/porte2.png");
    
    // NOUVEAU : Chargement de la clé
    this.load.image("cle", "src/assets/cle.png"); 

    this.load.tilemapTiledJSON("carte", "src/assets/map.tmj");
    this.load.spritesheet("img_bob", "src/assets/dude.png", {
      frameWidth: 173,
      frameHeight: 228
    });

    this.load.image("raie_frame1", "src/assets/Raie.png");
    this.load.image("raie_frame2", "src/assets/Raie25.png");
  }

  create() {
    this.jeuDemarre = false;
    // NOUVEAU : Variable pour savoir si Bob a la clé
    this.aLaCle = false; 

    const carteDuNiveau = this.add.tilemap("carte");
    const tileset_fond = carteDuNiveau.addTilesetImage("fond1", "img_fond1");
    const tileset_bois = carteDuNiveau.addTilesetImage("plateauxbois", "img_plateauxbois");
    const tousLesTilesets = [tileset_fond, tileset_bois];

    const backgroundLayer = carteDuNiveau.createLayer("Calque", tousLesTilesets);
    const plateformesLayer = carteDuNiveau.createLayer("tuiles_de_jeu", tousLesTilesets);
    plateformesLayer.setCollisionByProperty({ estSolide: true });

    const largeurCarte = carteDuNiveau.widthInPixels;
    const hauteurCarte = carteDuNiveau.heightInPixels;
    this.physics.world.setBounds(0, 0, largeurCarte, hauteurCarte);
    this.cameras.main.setBounds(0, 0, largeurCarte, hauteurCarte);

    // PORTE
    this.porte = this.physics.add.sprite(3160, 275, "porte2");
    this.porte.setOrigin(0.5, 0.5);
    this.porte.setImmovable(true);
    this.porte.body.allowGravity = false;
    this.porte.setScale(0.06);
    this.porte.setDepth(5);

    // NOUVEAU : Création de la CLÉ
    // Tu peux changer les coordonnées (500, 400) pour placer la clé où tu veux sur ta map
    this.laCle = this.physics.add.sprite(1580, 175, "cle");
    this.laCle.setScale(0.1); // On réduit la taille de la clé
    this.laCle.body.allowGravity = false; // Elle flotte pour être visible
    this.laCle.setDepth(5);

    // JOUEUR
    this.player = this.physics.add.sprite(100, 50, "img_bob");
    this.player.setScale(0.2);
    this.player.setCollideWorldBounds(true);
    this.player.body.setGravityY(300);

    this.physics.add.collider(this.player, plateformesLayer);
    
    // NOUVEAU : Collision avec la clé
    this.physics.add.overlap(this.player, this.laCle, this.ramasserCle, null, this);
    
    // Collision avec la porte
    this.physics.add.overlap(this.player, this.porte, this.passerPorte, null, this);

    this.player.body.onWorldBounds = true;
    this.physics.world.on('worldbounds', (body) => {
      if (body.gameObject === this.player && (body.blocked.down || body.blocked.up)) {
        this.mort(this.player);
      }
    });

    this.clavier = this.input.keyboard.createCursorKeys();
    this.toucheEspace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.toucheEntree = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);

    // ANIMATIONS (Le reste du code create est identique...)
    if (!this.anims.exists('left')) {
      this.anims.create({ key: 'left', frames: this.anims.generateFrameNumbers('img_bob', { start: 1, end: 3 }), frameRate: 10, repeat: -1 });
      this.anims.create({ key: 'turn', frames: [{ key: 'img_bob', frame: 4 }], frameRate: 20 });
      this.anims.create({ key: 'right', frames: this.anims.generateFrameNumbers('img_bob', { start: 6, end: 8 }), frameRate: 10, repeat: -1 });
    }
    if (!this.anims.exists('nager_raie')) {
        this.anims.create({ key: 'nager_raie', frames: [{ key: 'raie_frame1' }, { key: 'raie_frame2' }], frameRate: 5, repeat: -1 });
    }

    // PLATEFORMES MOBILES
    const tab_points = carteDuNiveau.getObjectLayer("departPlatforme");
    if (tab_points) {
      this.groupe_plateformes = this.physics.add.group({ allowGravity: false, immovable: true });
      tab_points.objects.forEach(obj => {
        let p = this.groupe_plateformes.create(obj.x, obj.y, "img_plateaux");
        p.setOrigin(0, 1);
        p.setDisplaySize(obj.width, obj.height);
        p.refreshBody();
        p.setDepth(10);

        let distMax = 200;
        let plafond = false;
        let vertical = false;

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
        p.estVertical = vertical;
        p.limiteDeCourse = distMax;
        p.compteurVitesse = Math.floor(Math.random() * distMax);
        p.directionSigne = 1;

        if (!p.isPlafond) {
          if (p.estVertical) p.setVelocityY(80);
          else p.setVelocityX(80);
        }
      });
      this.physics.add.collider(this.player, this.groupe_plateformes);
    }

    // RAIES
    const pointsRaies = carteDuNiveau.getObjectLayer("calque_raie");
    this.groupe_raies = this.physics.add.group({ allowGravity: false, immovable: true });
    if (pointsRaies) {
      pointsRaies.objects.forEach(obj => {
        let raie = this.groupe_raies.create(obj.x, obj.y, "raie_frame1");
        raie.setScale(0.2).play('nager_raie').setFlipX(true).setVelocityX(-120);
      });
    }
    this.physics.add.overlap(this.player, this.groupe_raies, (joueur, raie) => { this.mort(joueur); }, null, this);

    // ÉCRAN DE CONSIGNES
    this.ecranConsignes = this.add.container(0, 0).setDepth(100).setScrollFactor(0);
    let fond = this.add.graphics();
    fond.fillStyle(0x000000, 0.8);
    fond.fillRect(0, 0, 800, 600);
    let cadre = this.add.graphics();
    cadre.lineStyle(4, 0xffd700, 1);
    cadre.fillStyle(0x2c3e50, 0.9);
    cadre.fillRoundedRect(150, 150, 500, 300, 15);
    cadre.strokeRoundedRect(150, 150, 500, 300, 15);
    const texteAide = 
      "CONSIGNES DU JEU\n\n" +
      "• FLÈCHE HAUT : Échange la gravité (Bob monte au plafond)\n" +
      "• FLÈCHE BAS : Gravité normale\n" +
      "• MISSION : Attrape la clé pour ouvrir la porte !\n" + // Modifié
      "• DANGER : Si tu croises une raie, tu risques de mourir !\n\n" +
      "> Appuie sur ESPACE pour lancer le jeu <";
    let texte = this.add.text(400, 300, texteAide, {
      fontSize: '18px', fill: '#ffffff', align: 'center', fontFamily: 'Arial', lineSpacing: 8
    }).setOrigin(0.5);
    this.ecranConsignes.add([fond, cadre, texte]);

    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
  }

  update() {
    // Le code update reste identique à ta version
    if (this.groupe_plateformes) {
      this.groupe_plateformes.children.iterate((p) => {
        if (!p.isPlafond) {
          p.compteurVitesse++;
          if (p.compteurVitesse >= p.limiteDeCourse) {
            p.directionSigne *= -1;
            let vitesse = 80 * p.directionSigne;
            if (p.estVertical) p.setVelocityY(vitesse);
            else p.setVelocityX(vitesse);
            p.compteurVitesse = 0;
          }
        }
        if ((this.player.body.touching.down || this.player.body.touching.up) && this.player.body.gameObject === p) {
          this.player.x += p.body.deltaX();
          this.player.y += p.body.deltaY();
        }
      });
    }

    if (this.groupe_raies) {
      this.groupe_raies.children.iterate((raie) => {
        raie.setFlipX(raie.body.velocity.x < 0);
        if (raie.x < -100) raie.x = this.physics.world.bounds.width + 100;
        else if (raie.x > this.physics.world.bounds.width + 100) raie.x = -100;
      });
    }

    if (!this.jeuDemarre) {
      if (Phaser.Input.Keyboard.JustDown(this.toucheEspace) || Phaser.Input.Keyboard.JustDown(this.toucheEntree)) {
        this.jeuDemarre = true;
        this.ecranConsignes.destroy();
      }
      return;
    }

    if (!this.clavier || !this.player || this.player.isDead) return;

    if (this.clavier.up.isDown) {
      this.player.body.setGravityY(-1500); 
      this.player.setFlipY(true);
    } else if (this.clavier.down.isDown) {
      this.player.body.setGravityY(300);
      this.player.setFlipY(false);
    }

    if (this.clavier.left.isDown) {
      this.player.setVelocityX(-160);
      this.player.anims.play('left', true);
    } else if (this.clavier.right.isDown) {
      this.player.setVelocityX(160);
      this.player.anims.play('right', true);
    } else {
      this.player.setVelocityX(0);
      this.player.anims.play('turn');
    }

    if (Phaser.Input.Keyboard.JustDown(this.toucheEspace)) {
      if (this.player.body.blocked.down || this.player.body.touching.down) {
        this.player.setVelocityY(-350);
      } else if (this.player.body.blocked.up || this.player.body.touching.up) {
        this.player.setVelocityY(350);
      }
    }
  }

  // NOUVEAU : Fonction pour ramasser la clé
  ramasserCle(player, cle) {
    cle.disableBody(true, true); // La clé disparaît
    this.aLaCle = true; // Bob a maintenant la clé
  }

  passerPorte(p, porte) {
    // MODIFIÉ : On vérifie si Bob a la clé AVANT de changer de scène
    if (!p.isDead && this.aLaCle) {
      this.scene.start("piece2");
    } else if (!p.isDead && !this.aLaCle) {
      // Optionnel : un petit message si Bob touche la porte sans clé
      console.log("Il te faut la clé !");
    }
  }

  mort(p) {
    if (!p.isDead) {
      p.isDead = true;
      p.setTint(0xff0000);
      p.setVelocity(0, 0);
      this.time.addEvent({ 
        delay: 1000, 
        callback: () => { this.scene.restart(); }, 
        callbackScope: this 
      });
    }
  }
}