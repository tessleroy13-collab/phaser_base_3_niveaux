export default class menu extends Phaser.Scene {
    constructor() {
        super({ key: "menu" });
    }

    preload() {
        // Chargement des images (vérifie bien les noms de tes fichiers dans assets)
        this.load.image("menu_fond", "src/assets/sky.png");
        this.load.image("imageBoutonPlay", "src/assets/button_play.png");
    }

    create() {
        // --- 1. LE FOND ---
        // On met le ciel en fond, légèrement agrandi pour éviter les bords blancs
        this.add.image(400, 300, "menu_fond").setScale(1.2);

        // --- 2. LE TITRE ---
        // Un gros titre blanc avec un contour noir pour le style "MultiMap"
        let titre = this.add.text(400, 250, "MULTIMAP", {
            fontFamily: 'Arial Black',
            fontSize: "70pt",
            fill: "#ffffff",
            stroke: "#000000",
            strokeThickness: 12
        }).setOrigin(0.5);

        // --- 3. LE BOUTON PLAY ---
        // On place le bouton au centre, un peu plus bas
        this.bouton_play = this.add.image(400, 450, "imageBoutonPlay");
        this.bouton_play.setScale(0.6);
        this.bouton_play.setInteractive({ useHandCursor: true });

        // --- 4. ANIMATIONS (Le côté "Jolie") ---
        
        // Animation du titre : il monte et descend doucement
        this.tweens.add({
            targets: titre,
            y: 230,
            duration: 2000,
            yoyo: true,
            loop: -1,
            ease: 'Sine.easeInOut'
        });

        // Animation du bouton : il "respire" (grossit et rétrécit)
        this.tweens.add({
            targets: this.bouton_play,
            scale: 0.65,
            duration: 1000,
            yoyo: true,
            loop: -1,
            ease: 'Back.easeInOut'
        });

        // --- 5. INTERACTIONS ---

        // Quand la souris passe dessus
        this.bouton_play.on("pointerover", () => {
            this.bouton_play.setTint(0x00ffff); // Devient bleu cyan
        });

        // Quand la souris part
        this.bouton_play.on("pointerout", () => {
            this.bouton_play.clearTint();
        });

        // Quand on clique : ON VA À LA PIECE 2
        this.bouton_play.on("pointerup", () => {
            // Petit effet de caméra pour le punch
            this.cameras.main.fadeOut(500, 0, 0, 0);
            
            this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
                this.scene.start("piece2"); 
            });
        });
    }
}