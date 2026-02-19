// App State
const gameState = {
    apiKey: localStorage.getItem('bg_api_key') || '',
    homeLocation: { lat: -23.5505, lng: -46.6333 }, // Default: São Paulo
    radius: 2000,
    cityBounds: null,
    currentRound: 1,
    totalRounds: 5,
    score: 0,
    roundScore: 0,
    actualLocation: null,
    guessLocation: null,
    map: null,
    panorama: null,
    streetViewService: null,
    geocoder: null,
    guessMarker: null,
    resultLine: null,
    resultLine: null,
    actualMarker: null,
    cityRectangle: null,
    targetCity: null, // Strict validation
    // Timer
    timeLeft: 60,
    timerInterval: null
};

// DOM Elements
const dom = {
    // Screens
    startScreen: document.getElementById('start-screen'),
    gameUI: document.getElementById('game-ui'),
    resultScreen: document.getElementById('round-result-screen'),
    finalScreen: document.getElementById('final-screen'),

    // Inputs & Buttons
    latInput: document.getElementById('lat-input'),
    lngInput: document.getElementById('lng-input'),
    apiKeyInput: document.getElementById('api-key-input'),

    geoBtn: document.getElementById('geo-btn'),
    startBtn: document.getElementById('start-btn'),
    settingsBtn: document.getElementById('settings-btn'),
    saveSettingsBtn: document.getElementById('save-settings-btn'),

    settingsModal: document.getElementById('settings-modal'),

    // Game Elements
    pano: document.getElementById('pano'),
    guessMap: document.getElementById('guess-map'),
    guessContainer: document.getElementById('guess-container'),
    toggleMapBtn: document.getElementById('toggle-map-btn'),
    guessBtn: document.getElementById('guess-btn'),

    // HUD
    roundEl: document.getElementById('current-round'),
    scoreEl: document.getElementById('current-score'),

    // Results
    nextRoundBtn: document.getElementById('next-round-btn'),
    restartBtn: document.getElementById('restart-btn'),

    distanceEl: document.getElementById('round-distance'),
    pointsEl: document.getElementById('round-points'),
    messageEl: document.getElementById('round-message'),
    cityNameEl: document.getElementById('city-name-display'),

    finalTotal: document.getElementById('final-total-score'),
    finalTotal: document.getElementById('final-total-score'),
    finalVerdict: document.getElementById('final-verdict'),

    // Timer & Return
    timerEl: document.getElementById('time-left'),
    returnBtn: document.getElementById('return-start-btn'),
};

// --- Initialization ---

function init() {
    // Pre-fill inputs if available
    if (gameState.apiKey) {
        dom.apiKeyInput.value = gameState.apiKey;
    } else {
        // If no key, show settings immediately or highlight it
        dom.settingsModal.classList.remove('hidden');
    }

    // Event Listeners
    dom.geoBtn.addEventListener('click', handleUserLocation);
    dom.startBtn.addEventListener('click', startGame);

    dom.settingsBtn.addEventListener('click', () => {
        dom.settingsModal.classList.toggle('hidden');
    });

    dom.saveSettingsBtn.addEventListener('click', () => {
        const key = dom.apiKeyInput.value.trim();
        if (key) {
            gameState.apiKey = key;
            localStorage.setItem('bg_api_key', key);
            dom.settingsModal.classList.add('hidden');
            alert("Chave salva!");
        }
    });

    dom.toggleMapBtn.addEventListener('click', toggleMapSize);
    dom.guessBtn.addEventListener('click', () => submitGuess());
    dom.returnBtn.addEventListener('click', returnToStart);
    dom.nextRoundBtn.addEventListener('click', nextRound);
    dom.restartBtn.addEventListener('click', () => location.reload());

    // Shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && !dom.gameUI.classList.contains('hidden')) {
            // Only if map is expanded? Or always? Let's be careful.
            // Maybe Space toggles map?
        }
    });
}

// --- Geolocation ---

function handleUserLocation() {
    if (!navigator.geolocation) {
        alert("Geolocalização não suportada.");
        return;
    }

    dom.geoBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

    navigator.geolocation.getCurrentPosition(
        (pos) => {
            const { latitude, longitude } = pos.coords;
            dom.latInput.value = latitude.toFixed(5);
            dom.lngInput.value = longitude.toFixed(5);
            dom.geoBtn.innerHTML = '<i class="fa-solid fa-check"></i> Pronto para Jogar';

            // Auto start if key exists? No, let user confirm.
            setTimeout(() => startGame(), 500);
        },
        (err) => {
            console.error(err);
            dom.geoBtn.innerHTML = '<i class="fa-solid fa-location-arrow"></i> Jogar Onde Estou';
            alert("Não foi possível obter sua localização.");
        }
    );
}

// --- Game Flow ---

async function startGame() {
    // Validate Inputs
    const key = gameState.apiKey || dom.apiKeyInput.value.trim();
    if (!key) {
        alert("Configure sua API Key primeiro (ícone de engrenagem).");
        dom.settingsModal.classList.remove('hidden');
        return;
    }

    const lat = parseFloat(dom.latInput.value);
    const lng = parseFloat(dom.lngInput.value);

    if (isNaN(lat) || isNaN(lng)) {
        alert("Insira coordenadas ou use sua localização.");
        return;
    }

    gameState.apiKey = key;
    gameState.homeLocation = { lat, lng };

    // UI Transition
    dom.startBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Carregando...';

    try {
        await loadGoogleMaps(key);
        initMaps();
        await resolveCityBounds(lat, lng);

        await startRound();

        dom.startScreen.classList.add('hidden');
        dom.gameUI.classList.remove('hidden');
    } catch (e) {
        console.error(e);
        alert("Erro ao iniciar o jogo. Verifique a API Key.");
        dom.startBtn.innerHTML = 'Começar com Coordenadas';
    }
}

function loadGoogleMaps(key) {
    return new Promise((resolve, reject) => {
        if (window.google && window.google.maps) return resolve();

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=geometry,places`;
        script.async = true;
        script.defer = true;
        script.onload = resolve;
        script.onerror = reject;
        document.body.appendChild(script);
    });
}

function initMaps() {
    gameState.streetViewService = new google.maps.StreetViewService();
    gameState.geocoder = new google.maps.Geocoder();

    gameState.map = new google.maps.Map(dom.guessMap, {
        center: gameState.homeLocation,
        zoom: 13,
        disableDefaultUI: true,
        clickableIcons: false,
        backgroundColor: '#1e293b',
    });

    gameState.map.addListener('click', (e) => {
        placeGuessMarker(e.latLng);
    });
}

async function resolveCityBounds(lat, lng) {
    if (!gameState.geocoder) return;

    // Limpa retângulo anterior se existir
    if (gameState.cityRectangle) {
        gameState.cityRectangle.setMap(null);
        gameState.cityRectangle = null;
    }

    try {
        const res = await gameState.geocoder.geocode({ location: { lat, lng } });

        // Tenta encontrar 'administrative_area_level_2' (município) ou 'locality' (cidade)
        // Prioridade NOVA: Município > Cidade. Ignora Bairro (sublocality) para não ficar restrito.
        let city = res.results.find(r => r.types.includes('administrative_area_level_2'));

        if (!city) city = res.results.find(r => r.types.includes('locality'));

        // Se ainda assim não achou, checa locality de novo (pode ter vindo como fallback)
        // Mas evitamos sublocality explicitamente nas prioridades altas.

        if (city) {
            console.log("Limite de Município/Cidade encontrado:", city.formatted_address);

            // Evitar bounds muito grandes (Estados, Países)
            const isTooBig = city.types.includes('administrative_area_level_1') || city.types.includes('country');

            if (isTooBig) {
                console.warn("Área muito grande detectada a nível de estado. Usando fallback.");
                gameState.cityBounds = null;
                dom.cityNameEl.textContent = "Área Indefinida";
            } else {
                if (city.geometry.bounds) gameState.cityBounds = city.geometry.bounds;
                else if (city.geometry.viewport) gameState.cityBounds = city.geometry.viewport;

                // Atualiza nome na UI e define Target City para validação
                // Prioridade ABSOLUTA: Municipality > Locality. 
                // NUNCA usar sublocality aqui, senão restringe o jogo ao bairro!

                let nameComp = null;

                // 1. Tenta achar componente de Município (Ex: Osasco)
                nameComp = city.address_components.find(c => c.types.includes('administrative_area_level_2'));

                // 2. Se não achar, tenta Localidade (Ex: São Paulo)
                if (!nameComp) nameComp = city.address_components.find(c => c.types.includes('locality'));

                if (nameComp) {
                    dom.cityNameEl.textContent = nameComp.long_name;
                    gameState.targetCity = nameComp.long_name;
                    console.log("Target City definido para:", gameState.targetCity);
                } else {
                    // Se não achar nome de cidade/município, usa o formatado mas NÃO define targetCity estrito
                    // Isso evita travar validação em nome de rua ou bairro
                    dom.cityNameEl.textContent = city.formatted_address.split(',')[0];
                    gameState.targetCity = null;
                    console.log("Nome específico não encontrado. Strict validation DESATIVADO.");
                }

                // Desenha o limite no mapa visualmente
                console.log("Desenhando retângulo no mapa:", gameState.cityBounds);

                gameState.cityRectangle = new google.maps.Rectangle({
                    strokeColor: "#2563eb", // Azul mais forte
                    strokeOpacity: 0.8,
                    strokeWeight: 4,
                    fillColor: "#3b82f6",
                    fillOpacity: 0.2, // Mais visível
                    map: gameState.map,
                    bounds: gameState.cityBounds,
                    clickable: false,
                    zIndex: 999
                });

                // Força o mapa a focar na área
                gameState.map.fitBounds(gameState.cityBounds);
            }
        } else {
            // Tentativa Genérica: Pega o primeiro resultado que tenha viewport (Geometria ampla)
            const generic = res.results.find(r => r.geometry && (r.geometry.bounds || r.geometry.viewport) && !r.types.includes('street_address') && !r.types.includes('route'));

            if (generic) {
                console.log("Limite genérico encontrado:", generic.formatted_address);
                if (generic.geometry.bounds) gameState.cityBounds = generic.geometry.bounds;
                else gameState.cityBounds = generic.geometry.viewport;

                dom.cityNameEl.textContent = generic.formatted_address.split(',')[0];
                gameState.targetCity = dom.cityNameEl.textContent;

                gameState.cityRectangle = new google.maps.Rectangle({
                    strokeColor: "#3b82f6",
                    strokeOpacity: 0.8,
                    strokeWeight: 2,
                    fillColor: "#3b82f6",
                    fillOpacity: 0.1,
                    map: gameState.map,
                    bounds: gameState.cityBounds,
                    clickable: false
                });
            } else {
                console.warn("Nenhum limite de cidade encontrado. Único jeito é usar raio.");
                gameState.cityBounds = null;
                dom.cityNameEl.textContent = "Localização (Raio)";
            }
        }
    } catch (e) {
        console.warn("Geocoding failed", e);
        gameState.cityBounds = null;
        dom.cityNameEl.textContent = "Erro API (Usando Raio)";

        // Alerta específico para desenvolvedor/usuário
        if (JSON.stringify(e).includes("REQUEST_DENIED") || e.code === 'REQUEST_DENIED') {
            alert("⚠️ A API 'Geocoding API' não está ativada na sua chave do Google Cloud.\n\nO jogo vai funcionar no modo 'Raio Simples' (sem limites de cidade) até você ativar essa API no console do Google.");
        }
    }
}

async function startRound() {
    // Reset State
    gameState.guessLocation = null;
    if (gameState.guessMarker) gameState.guessMarker.setMap(null);
    if (gameState.actualMarker) gameState.actualMarker.setMap(null);
    if (gameState.resultLine) gameState.resultLine.setMap(null);

    dom.guessContainer.classList.remove('expanded');
    dom.resultScreen.classList.add('hidden'); // Ensure result is hidden

    // Reset Map
    if (gameState.cityBounds) gameState.map.fitBounds(gameState.cityBounds);
    else {
        gameState.map.setCenter(gameState.homeLocation);
        gameState.map.setZoom(13);
    }

    dom.roundEl.textContent = gameState.currentRound;

    // Find Location
    try {
        const loc = await findRandomStreetView();
        gameState.actualLocation = loc;

        gameState.panorama = new google.maps.StreetViewPanorama(dom.pano, {
            position: loc,
            pov: { heading: 0, pitch: 0 },
            zoom: 0,
            addressControl: false,
            showRoadLabels: false,
            linksControl: true,
            panControl: true,
            enableCloseButton: false,
            fullscreenControl: false,
            motionTracking: false,
            motionTrackingControl: false
        });

        // Inicia o Timer
        startTimer();

    } catch (e) {
        console.error("Failed to find location", e);
        // Retry once or twice could be done here
    }
}

function findRandomStreetView() {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        const check = () => {
            attempts++;
            if (attempts > 50) return reject("Não foi possível encontrar um local no Street View após 50 tentativas.");

            let point;
            if (gameState.cityBounds) {
                const sw = gameState.cityBounds.getSouthWest();
                const ne = gameState.cityBounds.getNorthEast();
                const lat = sw.lat() + Math.random() * (ne.lat() - sw.lat());
                const lng = sw.lng() + Math.random() * (ne.lng() - sw.lng());
                point = { lat, lng };
            } else {
                // Fallback se não detectar cidade: usa um raio de 5km fixo
                console.log("Usando fallback de raio de 5km (Cidade não detectada).");
                point = getRandomCoordinate(gameState.homeLocation, gameState.radius);
            }

            // Procura um panorama num raio de 1km do ponto sorteado
            gameState.streetViewService.getPanorama({
                location: point,
                radius: 1000,
                source: google.maps.StreetViewSource.OUTDOOR
            }, (data, status) => {
                if (status === 'OK' && data.location) {
                    const foundLoc = data.location.latLng;

                    // Validação Estrita de Cidade
                    if (gameState.targetCity && gameState.geocoder) {
                        gameState.geocoder.geocode({ location: foundLoc }, (results, status) => {
                            if (status === 'OK' && results[0]) {
                                // Verifica se algum componente do endereço bate com a Target City
                                const components = results[0].address_components;
                                const match = components.some(c =>
                                    c.long_name === gameState.targetCity ||
                                    c.short_name === gameState.targetCity ||
                                    // Robustez: Às vezes o targetCity é o município e o resultado é só o bairro, ou vice-versa
                                    // Mas se o targetCity for o município, ele deve aparecer na lista de componentes da rua.
                                    c.types.includes('administrative_area_level_2') && c.long_name === gameState.targetCity
                                );

                                if (match) {
                                    resolve(foundLoc);
                                } else {
                                    console.warn(`Ponto rejeitado: ${results[0].formatted_address} (Fora de ${gameState.targetCity})`);
                                    check(); // Tenta de novo
                                }
                            } else {
                                // Se geocode falhar, aceita pra não travar
                                resolve(foundLoc);
                            }
                        });
                    } else {
                        // Sem targetCity definido (modo fallback ou raio), aceita qualquer um
                        resolve(foundLoc);
                    }
                } else {
                    check(); // Tenta outro ponto
                }
            });
        };
        check();
    });
}

// Função corrigida para gerar coordenadas aleatórias num raio circular
function getRandomCoordinate(center, radius) {
    const y0 = center.lat;
    const x0 = center.lng;

    // Raio em graus (aproximação: 1 grau ~= 111.3km)
    // radius vem em metros
    const r = radius / 111300;

    // Distribuição uniforme no círculo
    const u = Math.random();
    const v = Math.random();
    const w = r * Math.sqrt(u); // ajustar para distribuição uniforme de área
    const t = 2 * Math.PI * v;
    const x = w * Math.cos(t);
    const y = w * Math.sin(t);

    // Ajuste da longitude baseada na latitude (Correção: converter para radianos!)
    const xp = x / Math.cos(y0 * Math.PI / 180);

    return {
        lat: y + y0,
        lng: xp + x0
    };
}


// --- Interactions ---

function placeGuessMarker(loc) {
    if (gameState.guessMarker) gameState.guessMarker.setMap(null);
    gameState.guessLocation = loc;
    gameState.guessMarker = new google.maps.Marker({
        position: loc,
        map: gameState.map,
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 7,
            fillColor: "#ef4444",
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: "#ffffff"
        }
    });
}

function toggleMapSize() {
    dom.guessContainer.classList.toggle('expanded');
    setTimeout(() => google.maps.event.trigger(gameState.map, 'resize'), 300);
}

function submitGuess() {
    stopTimer();
    if (!gameState.guessLocation) return alert("Marque um local no mapa!");

    const distMeters = google.maps.geometry.spherical.computeDistanceBetween(
        gameState.actualLocation, gameState.guessLocation
    );

    // Scoring
    let score = 0;
    if (distMeters < 50) score = 5000;
    else score = Math.max(0, Math.round(5000 * Math.exp(-distMeters / 2000)));

    gameState.score += score;
    gameState.roundScore = score;

    // Update UI
    dom.scoreEl.textContent = gameState.score;
    dom.distanceEl.textContent = (distMeters / 1000).toFixed(2) + ' km';
    dom.pointsEl.textContent = score;

    if (score === 5000) dom.messageEl.textContent = "Na mosca!!";
    else if (score > 4000) dom.messageEl.textContent = "Excelente!";
    else if (score > 2000) dom.messageEl.textContent = "Bom trabalho";
    else dom.messageEl.textContent = "Longe...";

    // Visuals on Map
    dom.guessContainer.classList.add('expanded');

    // Actual Marker
    gameState.actualMarker = new google.maps.Marker({
        position: gameState.actualLocation,
        map: gameState.map,
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 7,
            fillColor: "#22c55e",
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: "#ffffff"
        }
    });

    // Line
    gameState.resultLine = new google.maps.Polyline({
        path: [gameState.guessLocation, gameState.actualLocation],
        geodesic: true,
        strokeColor: '#f59e0b',
        strokeOpacity: 1.0,
        strokeWeight: 4,
        map: gameState.map
    });

    const bounds = new google.maps.LatLngBounds();
    bounds.extend(gameState.guessLocation);
    bounds.extend(gameState.actualLocation);
    gameState.map.fitBounds(bounds, 100);

    // Show Result Overlay
    dom.resultScreen.classList.remove('hidden');
}

function nextRound() {
    gameState.currentRound++;
    if (gameState.currentRound > gameState.totalRounds) {
        endGame();
    } else {
        startRound();
    }
}

function endGame() {
    dom.gameUI.classList.add('hidden');
    dom.resultScreen.classList.add('hidden');
    dom.finalScreen.classList.remove('hidden');

    dom.finalTotal.textContent = gameState.score;

    if (gameState.score > 24000) dom.finalVerdict.textContent = "Lenda Urbana!";
    else if (gameState.score > 15000) dom.finalVerdict.textContent = "Conhecedor Local";
    else dom.finalVerdict.textContent = "Turista Perdido";

    startConfetti();
}

// --- Timer & Actions ---

function startTimer() {
    stopTimer(); // Limpa anterior
    gameState.timeLeft = 60;
    if (dom.timerEl) dom.timerEl.textContent = gameState.timeLeft;

    // Atualiza cor
    dom.timerEl.parentElement.style.backgroundColor = 'rgba(15, 23, 42, 0.8)';
    dom.timerEl.parentElement.style.color = 'var(--text)';

    gameState.timerInterval = setInterval(() => {
        gameState.timeLeft--;
        if (dom.timerEl) dom.timerEl.textContent = gameState.timeLeft;

        // Alerta visual
        if (gameState.timeLeft <= 10) {
            dom.timerEl.parentElement.style.backgroundColor = '#ef4444'; // Vermelho
            dom.timerEl.parentElement.style.color = 'white';
        }

        if (gameState.timeLeft <= 0) {
            stopTimer();
            alert("Tempo esgotado! O jogo vai considerar sua posição atual ou 0 pontos.");
            // Se não marcou nada, marca a casa (ou 0,0) só pra finalizar
            if (!gameState.guessLocation) {
                // Time's up sem chute
                handleTimeOut();
            } else {
                submitGuess();
            }
        }
    }, 1000);
}

function stopTimer() {
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = null;
    }
}

function handleTimeOut() {
    // Se o usuário não marcou nada, infelizmente é 0 pontos.
    // Vamos simular um chute no local homeLocation pra não travar, mas avisando
    console.log("Timeout sem chute!");

    // Mostra resultado zerado
    gameState.score += 0;
    gameState.roundScore = 0;

    dom.scoreEl.textContent = gameState.score;
    dom.distanceEl.textContent = "Infinito";
    dom.pointsEl.textContent = 0;
    dom.messageEl.textContent = "Tempo Esgotado!";

    dom.guessContainer.classList.add('expanded');

    // Mostra onde era
    gameState.actualMarker = new google.maps.Marker({
        position: gameState.actualLocation,
        map: gameState.map,
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 7,
            fillColor: "#22c55e",
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: "#ffffff"
        }
    });

    gameState.map.setCenter(gameState.actualLocation);
    gameState.map.setZoom(14);

    dom.resultScreen.classList.remove('hidden');
}

function returnToStart() {
    if (gameState.panorama && gameState.actualLocation) {
        gameState.panorama.setPosition(gameState.actualLocation);
        gameState.panorama.setPov({ heading: 0, pitch: 0 });
    }
}

// Start
init();


// --- Canvas Utils ---
function startConfetti() {
    const canvas = document.getElementById('fireworks-canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const colors = ['#3b82f6', '#ef4444', '#f59e0b', '#22c55e'];

    for (let i = 0; i < 150; i++) {
        particles.push({
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            color: colors[Math.floor(Math.random() * 4)],
            size: Math.random() * 5 + 2
        });
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            p.x += p.vx; p.y += p.vy;
            ctx.fillStyle = p.color;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
        });
        if (!dom.finalScreen.classList.contains('hidden')) requestAnimationFrame(animate);
    }
    animate();
}
