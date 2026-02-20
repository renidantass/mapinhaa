const elements = {
    play: document.getElementById('play'),
    guessMap: document.getElementById('guess-map'),
    panoramaMap: document.getElementById('panorama-map')
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


    new google.maps.Map(element, {
        position,
        zoom: 8
    });
};

const initPanoramaMapIntoElement = async (element, userLocation) => {
    new google.maps.StreetViewPanorama(
        element,
        {
            position: { lat: userLocation.latitude, lng: userLocation.longitude },
            addressControl: false
        },
    );
};

export {
    showScreen,
    elements,
    initMapIntoElement,
    initPanoramaMapIntoElement
};