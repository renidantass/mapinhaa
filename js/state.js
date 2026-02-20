const state = {
    markers: {
        guess: null,
        destination: null
    },
    playing: false,
    userLocation: { latitude: 0, longitude: 0 },
    rounds: 5,
    currentRound: 1,
    secondsPerRound: 120,
    timeLeft: 120,
    score: 0,
    interval: null
};


export default state;