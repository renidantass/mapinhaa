const domElements = {
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
    roundPoints: document.getElementById('round-points'),
    nextRound: document.getElementById('next-round'),
    finalVerdict: document.getElementById('final-verdict')
};

const maps = {
    guess: null,
    panorama: null
};

export {
    domElements,
    maps
};