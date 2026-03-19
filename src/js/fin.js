function afficherVideoFin() {
    // 1. On récupère les éléments HTML
    const gameCanvas = document.querySelector('canvas'); // Le jeu Phaser
    const videoContainer = document.getElementById('video-fin-container');
    const maVideo = document.getElementById('maVideo');

    // 2. On cache le jeu
    if (gameCanvas) {
        gameCanvas.style.display = 'none';
    }

    // 3. On affiche le container de la vidéo
    videoContainer.style.display = 'block';

    // 4. On lance la vidéo
    maVideo.play();
}