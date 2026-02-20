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
}

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

async function getCoordinatesFromUser() {
    try {
        const position = await getPositionFromNavigator();
        return position.coords;
    } catch (err) {
        console.error("Erro ou permissão negada", err);
    }
}

export {
    startGame
};