import state from "./state.js";

const elements = {
    play: document.getElementById('play'),
    restart: document.getElementById('restart'),
    guessMap: document.getElementById('guess-map'),
    panoramaMap: document.getElementById('panorama-map'),
    resetPosition: document.getElementById('reset-position'),
    expandGuessMap: document.getElementById('expand-guess-map'),
    guessContainer: document.getElementById('guess-container'),
    timer: document.querySelector('.timer'),
    timeLeft: document.getElementById('time-left'),
    round: document.getElementById('current-round'),
    rounds: document.getElementById('total-rounds'),
    score: document.getElementById('current-score'),
    finalTotalScore: document.getElementById('final-total-score'),
    palpiteIcon: document.getElementById('palpite-icon'),
    destinationIcon: document.getElementById('destination-icon'),
    confirm: document.getElementById('guess'),
    roundDistance: document.getElementById('round-distance'),
    roundPoints: document.getElementById('round-points')
};

const maps = {
    guess: null,
    panorama: null
};

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
            state.markers.guess = await addMarker(event.latLng, maps.guess, 'Palpite', elements.palpiteIcon);
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

    elements.timeLeft.innerText = timeLeft;

    if (timeLeft <= 0) {
        elements.timer.classList.remove('text-danger');
        return;
    }

    if (timeLeft > 0 && timeLeft < 20)
        elements.timer.classList.add('text-danger');
};

const updateRound = (currentRound) => {
    if (currentRound > state.rounds)
        return;

    elements.round.innerText = currentRound;
    elements.rounds.innerText = state.rounds
};

const updateScore = (score) => {
    if (score < 0)
        return;

    elements.score.innerText = score;
    elements.finalTotalScore.innerText = score;
};

const expandGuessMap = () => {
    if (elements.guessContainer.classList.contains('expanded')) {
        elements.guessContainer.classList.remove('expanded')
    } else {
        elements.guessContainer.classList.add('expanded')
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
    maps.panorama.setPosition({ lat: state.userLocation.latitude, lng: state.userLocation.longitude });
};

const animateResetPosition = () => {
    elements.resetPosition.classList.add('clicked');

    setInterval(() => {
        elements.resetPosition.classList.remove('clicked');
    }, 1000);
};

const drawRouteOnMap = (markerOne, markerTwo, map) => {
    state.routeLine = new google.maps.Polyline({
        path: [markerOne.position, markerTwo.position],
        geodesic: true,
        strokeColor: "#FF0000", // Cor da linha (Vermelho)
        strokeOpacity: 0.8, // Transparência (0.0 a 1.0)
        strokeWeight: 3, // Espessura da linha em píxeis
        map: map // O mapa onde a linha será desenhada
    });
};

const refreshMaps = () => {
    maps.guess.setCenter(state.destinationLocation);
    maps.panorama.setPosition(state.destinationLocation);
};

const updateRoundStats = (distance, points) => {
    elements.roundDistance.innerText = distance;
    elements.roundPoints.innerText = points;
}

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
    elements,
    maps,
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
    updateRoundStats
};