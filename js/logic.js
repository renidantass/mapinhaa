import state from "./state.js";

const startGame = async () => {
    if (state.playing)
        return;

    try {
        state.userLocation = await getCoordinatesFromUser();
        await setRandomCoordinatesInDestination();
        initCountdown();
    } catch (err) {
        console.error(err);
    } finally {
        state.playing = true;
    }
};

const restartGame = async () => {
    stopCountdown();
    state.playing = true;
    state.gameOver = false;
    state.currentRound = 1;
    state.score = 0;
    await setRandomCoordinatesInDestination();
    initCountdown();
};

const initCountdown = () => {
    state.interval = setInterval(updateCountdown, 1000);
};

const stopCountdown = () => {
    if (!state.interval)
        return;

    clearInterval(state.interval);
}

const resetTimeLeft = () => {
    state.timeLeft = state.secondsPerRound;
};

const updateCountdown = () => {
    if (state.timeLeft > 0)
        state.timeLeft--;

    if (state.timeLeft == 0 && state.currentRound == state.rounds)
        gameOver();

    if (state.timeLeft == 0 && !state.markers.guess)
        completeRound();

    if (state.timeLeft == 0)
        clearInterval(state.interval);

};

const getPositionFromNavigator = () => {
    return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
    });
};

const getCoordinatesFromUser = async () => {
    try {
        const position = await getPositionFromNavigator();
        return { lat: position.coords.latitude, lng: position.coords.longitude };
    } catch (err) {
        console.error("Erro ou permissão negada", err);
    }
}

const getDistance = async (markerOne, markerTwo) => {
    const { spherical } = await google.maps.importLibrary("geometry");
    const distance = spherical.computeDistanceBetween(markerOne.position, markerTwo.position);
    return distance;
};

const calculateScore = async (distance) => {
    let score = 1100 - (0.1 * distance);

    score = Math.round(score);

    if (score > 1000) return 1000;
    if (score < 0) return 0;

    return score;
};

const takeGuess = async () => {
    const distance = await getDistance(state.markers.guess, state.markers.destination);
    const score = await calculateScore(distance);
    state.score += score;

    return { distance: (distance / 1000).toFixed(2), score };
};

const nextRound = () => {
    if (state.currentRound < state.rounds)
        state.currentRound++;
};

const randomizeCloseCoordinates = (latBase, lngBase, maximumRadius = 0.01) => {
    const latitudeVariance = (Math.random() - 0.5) * maximumRadius;
    const longitudeVariance = (Math.random() - 0.5) * maximumRadius;

    return {
        lat: latBase + latitudeVariance,
        lng: lngBase + longitudeVariance
    };
};

const randomizeCoordinates = async (userLocation) => {
    const { Geocoder } = await google.maps.importLibrary("geocoding");
    const geocoder = new Geocoder();

    let addressFound = false;
    let retries = 0;

    while (!addressFound && retries < 10) {
        retries++;
        const randomizedCoordinates = randomizeCloseCoordinates(userLocation.lat, userLocation.lng, 0.02);

        try {
            const response = await geocoder.geocode({ location: randomizedCoordinates });

            if (response.results && response.results[0]) {
                addressFound = true;
                return response.results[0].geometry.location;
            }
        } catch (err) {
            console.log(`Caiu num lugar sem endereço, sorteando de novo... [${err}]`);
        }
    }

    return "Não foi possível sortear um endereço fácil agora.";
};

const setRandomCoordinatesInDestination = async () => {
    const coordinates = await randomizeCoordinates(state.userLocation);
    state.destinationLocation = coordinates;
    state.positionWasUpdated = true;
}

const resetMarkers = () => {
    state.markers = {
        guess: null,
        destination: null
    };
};

const completeRound = async () => {
    stopCountdown();
    resetTimeLeft();
    nextRound();
    initCountdown();
    setRandomCoordinatesInDestination();
};

const gameOver = () => {
    stopCountdown();
    resetTimeLeft();
    state.currentRound = 0;
    state.playing = false;
    state.gameOver = true;
};

const getVeredictByScore = () => {
    if (state.score < 1000) {
        return "Se mudou recente?!";
    } else if (state.score > 1000 && state.score <= 10000) {
        return "Hm... você já mora aí há uma década";
    } else if (state.score > 10000 && state.score <= 100000) {
        return "O prefeito tem inveja de você..."
    } else {
        return "... como?!";
    }
};

export {
    startGame,
    restartGame,
    calculateScore,
    initCountdown,
    takeGuess,
    completeRound,
    stopCountdown,
    resetTimeLeft,
    nextRound,
    setRandomCoordinatesInDestination,
    resetMarkers,
    getVeredictByScore
};