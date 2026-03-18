export default class menu extends Phaser.Scene {
    constructor() {
        super({ key: "menu" });
    }

    preload() {
        this.load.image("page_acceuil", "src/assets/page_acceuil.png");
        this.load.image("imageBoutonPlay", "src/assets/button_play.png");
    }

    create() {
        // 1. LE FOND
        this.add.image(400, 300, "page_acceuil").setDisplaySize(800, 600);

        // 2. LE TITRE
        let titre = this.add.text(400, 220, "BOB ADVENTURE", {
            fontFamily: 'Arial Black',
            fontSize: "50pt", 
            fill: "#ff9900",
            stroke: "#ffff00",
            strokeThickness: 10
        }).setOrigin(0.5);

        // 3. LE BOUTON PLAY
        this.bouton_play = this.add.image(400, 400, "imageBoutonPlay").setScale(0.5).setInteractive({ useHandCursor: true });

        // 4. TEXTE D'INSTRUCTION
        this.instruction = this.add.text(400, 500, "Appuie sur ESPACE pour jouer", {
            fontFamily: 'Arial Black',
            fontSize: "18pt",
            fill: "#ff9900"
        }).setOrigin(0.5);

        // 5. ANIMATIONS (Titres et Instructions)
        this.tweens.add({ targets: titre, y: 200, duration: 2000, yoyo: true, loop: -1, ease: 'Sine.easeInOut' });
        this.tweens.add({ targets: this.instruction, alpha: 0.5, duration: 800, yoyo: true, loop: -1 });

        // 6. COMMANDES (Espace ou Clic)
        this.input.keyboard.once('keydown-SPACE', () => this.lancerLeJeu());
        this.bouton_play.on("pointerup", () => this.lancerLeJeu());
        
        // Effet de survol
        this.bouton_play.on("pointerover", () => this.bouton_play.setTint(0xffcc00));
        this.bouton_play.on("pointerout", () => this.bouton_play.clearTint());
    }

    lancerLeJeu() {
        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            // LIEN VERS LA PIECE 1
            this.scene.start("piece1"); 
        });
    }
}