import state from "./state.js";
import { startGame } from "./logic.js";
import { elements, maps, showScreen, initMapIntoElement, initPanoramaMapIntoElement, updateRound, expandGuessMap } from "./ui.js";

elements.play.addEventListener('click', async () => {
    await startGame();
    updateRound(state.currentRound, state.rounds);
    showScreen('game-ui');
    await initMapIntoElement(elements.guessMap, state.userLocation);
    await initPanoramaMapIntoElement(elements.panoramaMap, state.userLocation);
});

elements.resetPosition.addEventListener('click', async () => {
    maps.panorama.setPosition({ lat: state.userLocation.latitude, lng: state.userLocation.longitude });

    elements.resetPosition.classList.add('clicked');

    setInterval(() => {
        elements.resetPosition.classList.remove('clicked');
    }, 1000);
});

elements.expandGuessMap.addEventListener('click', () => {
    expandGuessMap();
});