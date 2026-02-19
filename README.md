# BairroGuessr

Um jogo no estilo GeoGuessr focado em descobrir bairros da sua cidade.

## Como Jogar

1. Abra o arquivo `index.html` no seu navegador.
2. Na tela inicial, insira as coordenadas da sua cidade de origem (Latitude e Longitude).
   - Você pode pegar isso no Google Maps clicando com o botão direito em um lugar.
3. **Importante**: Você precisa de uma **Google Maps API Key** válida.
   - A chave precisa ter permissão para: **Maps JavaScript API**, **Street View Static API**, **Geocoding API** e **Geolocation API**.
   - Cole a chave no campo indicado.

## Funcionalidades Novas

- **Localização Automática**: Clique em "Usar Minha Localização" para detectar onde você está.
- **Restrição de Cidade**: O jogo tenta detectar sua cidade e gerar locais apenas dentro dela (requer Geocoding API).

## Estrutura do Projeto

- `index.html`: Estrutura do jogo.
- `style.css`: Estilização moderna e responsiva.
- `app.js`: Lógica do jogo (Google Maps, Sistema de Pontuação, Canvas).

## Tecnologias

- HTML5
- CSS3 (Vanilla, Glassmorphism)
- JavaScript (ES6+)
- Google Maps API
- HTML5 Canvas (Efeitos visuais)
