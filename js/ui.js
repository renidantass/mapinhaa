import state from "./state.js";

const elements = {
    play: document.getElementById('play'),
    guessMap: document.getElementById('guess-map'),
    panoramaMap: document.getElementById('panorama-map'),
    resetPosition: document.getElementById('reset-position'),
    expandGuessMap: document.getElementById('expand-guess-map'),
    guessContainer: document.getElementById('guess-container'),
    timer: document.querySelector('.timer'),
    timeLeft: document.getElementById('time-left'),
    round: document.getElementById('current-round'),
    rounds: document.getElementById('total-rounds'),
    score: document.getElementById('current-score')
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
    disableScreen(currentScreen);

    const nextScreen = getScreen(screenName);
    enableScreen(nextScreen);
};

const initMapIntoElement = async (element, userLocation) => {
    let position = { lat: userLocation.latitude, lng: userLocation.longitude };

    maps.guess = new google.maps.Map(element, {
        center: position,
        zoom: 8,
        disableDefaultUI: true,
    });
};

const initPanoramaMapIntoElement = async (element, userLocation) => {
    maps.panorama = new google.maps.StreetViewPanorama(
        element,
        {
            position: { lat: userLocation.latitude, lng: userLocation.longitude },
            addressControl: false,
            disableDefaultUI: true,
            fullscreenControl: true,
            showRoadLabels: false,
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

const updateRound = (currentRound, totalRounds) => {
    if (currentRound > totalRounds)
        return;

    elements.round.innerText = currentRound;
    elements.rounds.innerText = totalRounds;
};

const updateScore = (score) => {
    if (score < 0)
        return;

    elements.score.innerText = score;
};

const expandGuessMap = () => {
    if (elements.guessContainer.classList.contains('expanded')) {
        elements.guessContainer.classList.remove('expanded')
    } else {
        elements.guessContainer.classList.add('expanded')
    }
};

setInterval(refreshTimeLeft, 1000);

export {
    elements,
    maps,
    showScreen,
    initMapIntoElement,
    initPanoramaMapIntoElement,
    updateRound,
    updateScore,
    expandGuessMap
};