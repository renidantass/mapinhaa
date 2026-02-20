import state from "./state.js";
import { startGame } from "./logic.js";
import { elements, showScreen, initMapIntoElement, initPanoramaMapIntoElement } from "./ui.js";

elements.play.addEventListener('click', async () => {
    await startGame();
    showScreen('game-ui');
    initMapIntoElement(elements.guessMap, state.userLocation);
    initPanoramaMapIntoElement(elements.panoramaMap, state.userLocation);
});