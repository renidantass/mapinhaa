import state from "./state.js";

const startGame = async () => {
    if (state.playing)
        return;

    try {
        state.userLocation = await getCoordinatesFromUser();
        initCountdown();
    } catch (err) {
        console.error(err);
    } finally {
        state.playing = true;
    }
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

    if (state.timeLeft < 1)
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
        return position.coords;
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

const guess = async () => {
    const distance = await getDistance(state.markers.guess, state.markers.destination);
    state.score = await calculateScore(distance);
};

const nextRound = () => {
    if (state.currentRound < state.rounds)
        state.currentRound++;
};

export {
    startGame,
    calculateScore,
    guess,
    stopCountdown,
    resetTimeLeft,
    nextRound
};