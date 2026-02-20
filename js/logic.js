import state from "./state.js";

const startGame = async () => {
    const coords = await getCoordinatesFromUser();
    state.userLocation = coords;
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