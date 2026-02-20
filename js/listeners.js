import state from "./state.js";
import * as logic from "./logic.js";
import * as ui from "./ui.js";

ui.elements.play.addEventListener('click', async () => {
    await logic.startGame();
    ui.updateRound(state.currentRound, state.rounds);
    ui.showScreen('game-ui');
    await ui.initMapIntoElement(ui.elements.guessMap, state.userLocation);
    await ui.initPanoramaMapIntoElement(ui.elements.panoramaMap, state.userLocation);
});

ui.elements.resetPosition.addEventListener('click', async () => {
    ui.resetPosition();
    ui.animateResetPosition();
});

ui.elements.expandGuessMap.addEventListener('click', () => {
    ui.expandGuessMap();
});

ui.elements.guessButton.addEventListener('click', async () => {
    if (!state.markers.guess)
        return;

    if (!state.markers.destination)
        state.markers.destination = await ui.addMarker({ lat: state.userLocation.latitude, lng: state.userLocation.longitude }, maps.guess, 'Destino', elements.destinationIcon);

    await logic.guess();
    logic.stopCountdown();
    logic.resetTimeLeft();
    logic.nextRound();

    ui.updateScore(state.score);
    ui.updateRound(state.currentRound, state.rounds);
});