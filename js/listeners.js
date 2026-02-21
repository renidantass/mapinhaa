import state from "./state.js";
import { domElements, maps } from "./elements.js";
import * as logic from "./logic.js";
import * as ui from "./ui.js";

domElements.play.addEventListener('click', async () => {
    await logic.startGame();
    ui.showScreen('game-ui');
    await ui.initMapIntoElement(domElements.guessMap);
    await ui.initPanoramaMapIntoElement(domElements.panoramaMap);
});

domElements.nextRound.addEventListener('click', async () => {
    await logic.completeRound();
    ui.showScreen('game-ui');
});

domElements.restart.addEventListener('click', async () => {
    await logic.restartGame();
    ui.showScreen('game-ui');
});

domElements.resetPosition.addEventListener('click', async () => {
    ui.resetPosition();
    ui.animateResetPosition();
});

domElements.expandGuessMap.addEventListener('click', () => {
    ui.expandGuessMap();
});

domElements.confirm.addEventListener('click', async () => {
    if (!state.markers.guess)
        return;

    if (!state.markers.destination)
        state.markers.destination = await ui.addMarker(state.destinationLocation, maps.guess, 'Destino', domElements.destinationIcon);

    ui.drawRouteOnMap(state.markers.guess, state.markers.destination, maps.guess);

    const roundStats = await logic.takeGuess();
    logic.completeRound();

    ui.updateRoundStats(roundStats.distance, roundStats.score);
    ui.showScreen('round-result-screen');

    ui.refreshMaps();
    maps.panorama.addListener('status_changed', () => {
        const status = maps.panorama.getStatus();

        if (status === 'OK')
            ui.removeDrawings();
    });
});