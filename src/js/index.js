// chargement des librairies
import selection from "/src/js/selection.js";
import piece1 from "/src/js/piece1.js";
import piece3 from "/src/js/piece3.js";
import piece4 from "/src/js/piece4.js";
import piece2 from "/src/js/piece2.js";


// configuration générale du jeu
var config = {
  type: Phaser.AUTO,
  width: 800, // largeur en pixels
  height: 600, // hauteur en pixels
   scale: {
        // Or set parent divId here
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
   },
  physics: {
    // définition des parametres physiques
    default: "arcade", // mode arcade : le plus simple : des rectangles pour gérer les collisions. Pas de pentes
    arcade: {
      // parametres du mode arcade
      gravity: {
        y: 300 // gravité verticale : acceleration ddes corps en pixels par seconde
      },
      debug: false // permet de voir les hitbox et les vecteurs d'acceleration quand mis à true
    }
  },
  scene: [selection, piece1, piece2, piece3, piece4]
};

// création et lancement du jeu
var game = new Phaser.Game(config);
game.scene.start("selection");
