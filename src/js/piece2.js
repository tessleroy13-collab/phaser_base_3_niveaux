export default class piece2 extends Phaser.Scene {

  constructor() {
      super({
          key: "piece2"
      });
  }

  init() {
      // On réinitialise les variables à chaque fois que la scène commence
      this.compteurVagues = 0;
      this.nuagesAttrapes = 0;
      this.victoire = false;
      this.porteApparue = false; // Nouvelle variable pour la porte
  }

  preload() {
      this.load.image("avion", "src/assets/aviateur.png");
      this.load.image("img_ciel", "src/assets/sky.png");
      this.load.image("img_plateforme", "src/assets/platform.png");
      this.load.image("nuage", "src/assets/nuage.png"); 
      this.load.image("porte", "src/assets/porte.png"); // Charge ton image de porte ici
  }

  create() {
      // 1. Fond
      this.add.image(400, 300, "img_ciel");

      // 2. Textes
      this.add.text(400, 30, "Niveau 2 : L'avion", {
          fontFamily: 'Georgia', fontSize: "24pt", fill: "#ffffff"
      }).setOrigin(0.5);

      // Changement de couleur : Cyan (#00ffff) au lieu de Jaune
      this.texteScore = this.add.text(20, 20, "Nuages : 0 / 5", {
          fontFamily: 'Arial', fontSize: "18pt", fill: "#00ffff", fontWeight: 'bold'
      });

      // 3. L'avion
      this.player = this.physics.add.sprite(150, 300, "avion");
      this.player.setScale(0.1); 
      this.player.setCollideWorldBounds(true);
      this.player.body.allowGravity = false;
      this.player.body.setSize(600, 600); 
      this.player.body.setOffset(300, 20); 

      // 4. Groupes
      this.plateformes = this.physics.add.group();
      this.bonus = this.physics.add.group();
      this.groupePorte = this.physics.add.group(); // Groupe pour la porte

      // 5. Clavier
      this.clavier = this.input.keyboard.createCursorKeys();

      // 6. Génération des obstacles
      this.timerObstacles = this.time.addEvent({
          delay: 1500,
          callback: this.spawnObstacles,
          callbackScope: this,
          loop: true
      });

      // 7. Collisions
      this.physics.add.overlap(this.player, this.plateformes, () => {
          if (!this.victoire) {
              this.scene.restart();
          }
      }, null, this);

      this.physics.add.overlap(this.player, this.bonus, (player, nuage) => {
          nuage.destroy(); 
          
          if (!this.victoire) {
              this.nuagesAttrapes++;
              this.texteScore.setText("Nuages : " + this.nuagesAttrapes + " / 5");

              if (player.scale > 0.04) { 
                  player.setScale(player.scale * 0.85);
              }

              // VERIFICATION : On fait apparaître la porte à 5 nuages
              if (this.nuagesAttrapes >= 5 && !this.porteApparue) {
                  this.apparaitrePorte();
              }
          }
      }, null, this);

      // Collision avec la porte pour déclencher la victoire
      this.physics.add.overlap(this.player, this.groupePorte, () => {
          this.gagnerPartie();
      }, null, this);
  }

  update() {
      if (this.victoire) {
          this.player.setVelocity(400, 0); 
          return; 
      }

      const vitesse = 250;
      if (this.clavier.left.isDown) this.player.setVelocityX(-vitesse);
      else if (this.clavier.right.isDown) this.player.setVelocityX(vitesse);
      else this.player.setVelocityX(0);

      if (this.clavier.up.isDown) this.player.setVelocityY(-vitesse);
      else if (this.clavier.down.isDown) this.player.setVelocityY(vitesse);
      else this.player.setVelocityY(0);

      this.plateformes.children.each(obs => {
          if (obs && obs.x < -100) obs.destroy();
      });

      this.bonus.children.each(b => {
          if (b && b.x < -100) b.destroy();
      });
  }

  spawnObstacles() {
      if (this.victoire || this.porteApparue) return;

      this.compteurVagues++;
      let ecartActuel = Math.max(120, 280 - (this.compteurVagues * 4));
      let passageY = Phaser.Math.Between(150, 450);
      let vitesseX = -250 - (this.compteurVagues * 2);

      let h = this.plateformes.create(900, passageY - ecartActuel, "img_plateforme");
      h.setAngle(90).setVelocityX(vitesseX);
      h.body.allowGravity = false;
      h.body.setSize(h.height, h.width);

      let b = this.plateformes.create(900, passageY + ecartActuel, "img_plateforme");
      b.setAngle(90).setVelocityX(vitesseX);
      b.body.allowGravity = false;
      b.body.setSize(b.height, b.width);

      if (Phaser.Math.Between(0, 10) > 4) {
          let positionYBonus = passageY + Phaser.Math.Between(-30, 30);
          let n = this.bonus.create(1200, positionYBonus, "nuage");
          n.setScale(0.1).setVelocityX(vitesseX).body.allowGravity = false;
          n.setDepth(1); 
      }
  }

  apparaitrePorte() {
      this.porteApparue = true;
      this.timerObstacles.remove(); // Stop les nouveaux obstacles

      // On attend 2 secondes que le chemin se vide puis on envoie la porte
      this.time.delayedCall(2000, () => {
          let porte = this.groupePorte.create(900, 300, "porte");
          porte.setVelocityX(-200);
          porte.body.allowGravity = false;
          porte.setScale(0.5); 
      });
  }

  gagnerPartie() {
      if (this.victoire) return;
      this.victoire = true;
      
      // On vide les derniers obstacles pour laisser passer l'avion
      this.plateformes.clear(true, true);

      console.log("Victoire ! Passage au Niveau 3 dans 2 secondes...");

      this.time.delayedCall(2000, () => {
          // this.scene.start("piece3"); 
      });
  }
}