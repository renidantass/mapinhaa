import state from "./state.js";
import * as logic from "./logic.js";
import * as ui from "./ui.js";

ui.elements.play.addEventListener('click', async () => {
    await logic.startGame();
    ui.showScreen('game-ui');
    await ui.initMapIntoElement(ui.elements.guessMap);
    await ui.initPanoramaMapIntoElement(ui.elements.panoramaMap);
});

ui.elements.restart.addEventListener('click', async () => {
    await logic.restartGame();
    ui.showScreen('game-ui');
});

ui.elements.resetPosition.addEventListener('click', async () => {
    ui.resetPosition();
    ui.animateResetPosition();
});

ui.elements.expandGuessMap.addEventListener('click', () => {
    ui.expandGuessMap();
});

ui.elements.confirm.addEventListener('click', async () => {
    if (!state.markers.guess)
        return;

    if (!state.markers.destination)
        state.markers.destination = await ui.addMarker(state.destinationLocation, ui.maps.guess, 'Destino', ui.elements.destinationIcon);

    ui.drawRouteOnMap(state.markers.guess, state.markers.destination, ui.maps.guess);

    await logic.takeGuess();
    logic.completeRound();

    ui.refreshMaps();
    ui.maps.panorama.addListener('status_changed', () => {
        const status = ui.maps.panorama.getStatus();

        if (status === 'OK') {
            ui.removeDrawings();
        } else if (status === 'ZERO_RESULTS') {
            console.error('Não tem imagem para essa localização');
        }
    });

    if (state.currentRound == state.rounds) {
        setTimeout(() => {
            ui.showScreen('final-screen');
        }, 500);
    }
});