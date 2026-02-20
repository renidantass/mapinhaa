import state from "./state.js";
import * as logic from "./logic.js";
import * as ui from "./ui.js";

ui.elements.play.addEventListener('click', async () => {
    await logic.startGame();
    ui.updateRound(state.currentRound);
    ui.showScreen('game-ui');

    state.destinationLocation = await logic.sortearEnderecoReal(state.userLocation);

    await ui.initMapIntoElement(ui.elements.guessMap);
    await ui.initPanoramaMapIntoElement(ui.elements.panoramaMap);
});

ui.elements.restart.addEventListener('click', async () => {
    logic.restartGame();
    ui.showScreen('game-ui');
    ui.updateRound(state.currentRound);
    ui.updateScore(state.score);
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

    ui.removeMarkers();
    await logic.takeGuess();
    logic.completeRound();

    ui.updateScore(state.score);
    ui.updateRound(state.currentRound);

    state.destinationLocation = await logic.sortearEnderecoReal(state.userLocation);
    await ui.maps.guess.setCenter(state.destinationLocation);
    await ui.maps.panorama.setPosition(state.destinationLocation);

    if (state.currentRound == state.rounds) {
        setTimeout(() => {
            ui.showScreen('final-screen');
        }, 500);
    }
});