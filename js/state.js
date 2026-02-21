const state = {
    playing: false,
    gameOver: false,
    positionWasUpdated: false,
    markers: {
        guess: null,
        destination: null
    },
    routeLine: null,
    userLocation: { lat: 0, lng: 0 },
    destinationLocation: { lat: 0, lng: 0 },
    rounds: 2,
    currentRound: 1,
    secondsPerRound: 120,
    timeLeft: 120,
    score: 0,
    interval: null
};


export default state;