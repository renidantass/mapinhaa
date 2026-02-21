import state from "./state.js";
import { domElements, maps } from "./elements.js";

const disableScreen = (screen) => {
    screen.classList = 'screen hidden';
}

const enableScreen = (screen) => {
    screen.classList = 'screen active';
}

const getCurrentScreen = () => {
    const currentScreen = document.querySelector('.screen.active');
    return currentScreen;
};

const getScreen = (screenName) => {
    const screen = document.getElementById(screenName);
    return screen;
}

const getScreensAvailable = () => {
    const screens = Array.from(document.querySelectorAll('.screen')).map(s => s.getAttribute('id'));
    return screens;
};

const showScreen = (screenName) => {
    let screensAvailable = getScreensAvailable();

    if (!screensAvailable.includes(screenName)) {
        return;
    }

    const currentScreen = getCurrentScreen();
    const nextScreen = getScreen(screenName);

    if (currentScreen == nextScreen)
        return;

    disableScreen(currentScreen);
    enableScreen(nextScreen);
};

const initMapIntoElement = async (element) => {
    maps.guess = new google.maps.Map(element, {
        center: state.userLocation,
        zoom: 7,
        disableDefaultUI: true,
        mapId: "DEMO_MAP_ID"
    });

    google.maps.event.addListener(maps.guess, 'click', async (event) => {
        if (state.markers.guess)
            state.markers.guess.position = event.latLng;

        if (!state.markers.guess)
            state.markers.guess = await addMarker(event.latLng, maps.guess, 'Palpite', domElements.palpiteIcon);
    });
};

const initPanoramaMapIntoElement = async (element) => {
    maps.panorama = new google.maps.StreetViewPanorama(
        element,
        {
            position: state.destinationLocation,
            addressControl: false,
            disableDefaultUI: true,
            fullscreenControl: true,
            showRoadLabels: false
        },
    );
};

const refreshTimeLeft = () => {
    const timeLeft = state.timeLeft;

    domElements.timeLeft.innerText = timeLeft;

    if (timeLeft <= 0) {
        domElements.timer.classList.remove('text-danger');
        return;
    }

    if (timeLeft > 0 && timeLeft < 20)
        domElements.timer.classList.add('text-danger');
};

const updateRound = (currentRound) => {
    if (currentRound > state.rounds)
        return;

    domElements.round.innerText = currentRound;
    domElements.rounds.innerText = state.rounds
};

const updateScore = (score) => {
    if (score < 0)
        return;

    domElements.score.innerText = score;
    domElements.finalTotalScore.innerText = score;
};

const expandGuessMap = () => {
    if (domElements.guessContainer.classList.contains('expanded')) {
        domElements.guessContainer.classList.remove('expanded')
    } else {
        domElements.guessContainer.classList.add('expanded')
    }
};

const addMarker = async (location, map, label, iconElement) => {
    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

    if (!label)
        label = '-'

    let marker = new AdvancedMarkerElement({
        map: map,
        position: location,
        title: label,
        anchorLeft: '-25%',
        anchorTop: '-95%',
    });

    marker.tracksViewChanges = false;

    marker.append(iconElement);

    return marker;
};

const removeDrawings = async () => {
    if (state.markers.guess) {
        state.markers.guess.map = null;
        state.markers.guess = null;
    }

    if (state.markers.destination) {
        state.markers.destination.map = null;
        state.markers.destination = null;
    }

    if (state.routeLine) {
        state.routeLine.setMap(null);
        state.routeLine = null;
    }
};

const resetPosition = () => {
    maps.panorama.setPosition(state.destinationLocation);
};

const animateResetPosition = () => {
    domElements.resetPosition.classList.add('clicked');

    setInterval(() => {
        domElements.resetPosition.classList.remove('clicked');
    }, 1000);
};
const drawRouteOnMap = (markerOne, markerTwo, map) => {
    state.routeLine = new google.maps.Polyline({
        path: [markerOne.position, markerTwo.position],
        geodesic: true,
        strokeColor: "#FF0000",
        strokeOpacity: 0.8,
        strokeWeight: 3,
        map
    });
};

const refreshMaps = () => {
    maps.guess.setCenter(state.destinationLocation);
    maps.panorama.setPosition(state.destinationLocation);
};

const updateRoundStats = (distance, points) => {
    domElements.roundDistance.innerText = distance;
    domElements.roundPoints.innerText = points;
}

const setVeredictText = (text) => {
    domElements.finalVerdict.innerText = text;
};

setInterval(() => {
    refreshTimeLeft();
    updateRound(state.currentRound);
    updateScore(state.score);

    if (state.gameOver && !state.playing) {
        showScreen('final-screen');
    }

    if (state.positionWasUpdated) {
        refreshMaps();
        state.positionWasUpdated = false;
    }

}, 1000);

export {
    showScreen,
    initMapIntoElement,
    initPanoramaMapIntoElement,
    updateRound,
    updateScore,
    expandGuessMap,
    addMarker,
    removeDrawings,
    resetPosition,
    animateResetPosition,
    drawRouteOnMap,
    refreshMaps,
    updateRoundStats,
    setVeredictText
};