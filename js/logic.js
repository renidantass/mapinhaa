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

const restartGame = () => {
    state.currentRound = 0;
    state.score = 0;
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
    state.score = await calculateScore(distance);
};

const nextRound = () => {
    if (state.currentRound < state.rounds)
        state.currentRound++;
};

function sortearCoordenadaPerto(latBase, lngBase, raioMaximo = 0.01) {
    const variacaoLat = (Math.random() - 0.5) * raioMaximo;
    const variacaoLng = (Math.random() - 0.5) * raioMaximo;

    return {
        lat: latBase + variacaoLat,
        lng: lngBase + variacaoLng
    };
};

async function sortearEnderecoReal(userLocation) {
    const { Geocoder } = await google.maps.importLibrary("geocoding");
    const geocoder = new Geocoder();

    let encontrouEndereco = false;
    let tentativa = 0;

    while (!encontrouEndereco && tentativa < 10) {
        tentativa++;
        const pontoSorteado = sortearCoordenadaPerto(userLocation.lat, userLocation.lng, 0.02);

        try {
            const resposta = await geocoder.geocode({ location: pontoSorteado });

            if (resposta.results && resposta.results[0]) {
                encontrouEndereco = true;
                console.log(`Sucesso na tentativa ${tentativa}!`);

                return resposta.results[0].geometry.location;
            }
        } catch (erro) {
            // Se o Google reclamar (ex: caiu no mar), ele cai aqui e o loop roda de novo
            console.log("Caiu num lugar sem endereço, sorteando de novo...");
        }
    }

    return "Não foi possível sortear um endereço fácil agora.";
};

const resetMarkers = () => {
    state.markers = {
        guess: null,
        destination: null
    };
};

const completeRound = () => {
    stopCountdown();
    resetTimeLeft();
    nextRound();
    resetMarkers();
    initCountdown();
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
    sortearEnderecoReal,
    resetMarkers
};