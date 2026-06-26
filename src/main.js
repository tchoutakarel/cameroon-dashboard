const apiKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_OPENWEATHER_API_KEY) || '25cd8ea7f5c3c2dad989507b5da2ab04';
const cities = [
  'Douala',
  'Yaoundé',
  'Bafoussam',
  'Garoua',
  'Bamenda',
  'Maroua',
  'Ngaoundéré',
  'Bertoua',
  'Kumba',
  'Ebolowa'
];
const units = {
  metric: { label: '°C', speed: 'm/s' },
  imperial: { label: '°F', speed: 'mph' }
};

const app = document.getElementById('app');

const template = `
  <header class="hero">
    <div class="hero__content">
      <p class="eyebrow">Cameroon Weather</p>
      <h1>Real-time Weather Dashboard</h1>
      <p>Live weather, 5-day forecast, favorites, and unit toggle for Cameroonian cities.</p>
    </div>
  </header>

  <main class="dashboard">
    <section class="controls-card">
      <div class="search-box">
        <label for="city-search">Search city</label>
        <div class="search-row">
          <input id="city-search" placeholder="Type a city name, e.g. Douala" autocomplete="off" />
          <button id="search-btn" type="button">Search</button>
        </div>
        <p class="hint">Search any Cameroonian city or pick one from the list below.</p>
      </div>

      <div class="unit-row">
        <p class="list-title">Temperature unit</p>
        <div class="unit-toggle" id="unit-toggle">
          <button class="unit-btn" type="button" data-unit="metric">°C</button>
          <button class="unit-btn" type="button" data-unit="imperial">°F</button>
        </div>
      </div>

      <div class="favorite-row">
        <button id="favorite-btn" class="secondary-btn" type="button">Add favorite</button>
        <p class="favorite-note">Saved cities: <span id="favorites-list">None</span></p>
      </div>

      <div class="city-list">
        <p class="list-title">Quick cities</p>
        <div id="city-buttons" class="chips"></div>
      </div>

      <div class="favorite-list">
        <p class="list-title">Favorite cities</p>
        <div id="favorite-chips" class="chips"></div>
      </div>
    </section>

    <section class="weather-card">
      <div class="weather-header">
        <div>
          <p class="weather-location" id="weather-location">Select a city</p>
          <p class="weather-description" id="weather-description">Current conditions for Cameroon cities.</p>
        </div>
        <div class="status" id="status">Waiting for selection</div>
      </div>

      <div class="weather-main">
        <div class="icon-wrap">
          <img id="weather-icon" class="weather-icon" src="" alt="Weather icon" />
        </div>

        <div class="weather-body">
          <div class="metric">
            <span class="metric__label">Temperature</span>
            <strong id="weather-temp">--</strong>
          </div>
          <div class="metric">
            <span class="metric__label">Feels like</span>
            <strong id="weather-feels">--</strong>
          </div>
          <div class="metric">
            <span class="metric__label">Humidity</span>
            <strong id="weather-humidity">--</strong>
          </div>
          <div class="metric">
            <span class="metric__label">Wind</span>
            <strong id="weather-wind">--</strong>
          </div>
          <div class="metric full-width">
            <span class="metric__label">Last update</span>
            <strong id="weather-update">--</strong>
          </div>
        </div>
      </div>

      <div class="forecast-section">
        <p class="forecast-title">5-Day forecast</p>
        <div id="forecast-cards" class="forecast-grid"></div>
      </div>
    </section>
  </main>
`;

app.innerHTML = template;

const cityButtonsContainer = document.getElementById('city-buttons');
const searchInput = document.getElementById('city-search');
const searchButton = document.getElementById('search-btn');
const statusLabel = document.getElementById('status');
const locationLabel = document.getElementById('weather-location');
const descriptionLabel = document.getElementById('weather-description');
const tempLabel = document.getElementById('weather-temp');
const feelsLabel = document.getElementById('weather-feels');
const humidityLabel = document.getElementById('weather-humidity');
const windLabel = document.getElementById('weather-wind');
const updateLabel = document.getElementById('weather-update');
const iconImage = document.getElementById('weather-icon');
const favoriteButton = document.getElementById('favorite-btn');
const favoritesListLabel = document.getElementById('favorites-list');
const favoriteChipsContainer = document.getElementById('favorite-chips');
const unitToggle = document.getElementById('unit-toggle');
const forecastCards = document.getElementById('forecast-cards');

let currentCity = localStorage.getItem('lastWeatherCity') || cities[0];
let currentUnit = localStorage.getItem('weatherUnit') || 'metric';
const favorites = new Set(JSON.parse(localStorage.getItem('favoriteCities') || '[]'));

const formatDate = (timestamp, timezoneOffset) => {
  const localTime = new Date((timestamp + timezoneOffset) * 1000);
  return localTime.toLocaleString('en-GB', {
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatDay = (timestamp, timezoneOffset) => {
  const localTime = new Date((timestamp + timezoneOffset) * 1000);
  return localTime.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
};

function setStatus(message, type = 'neutral') {
  statusLabel.textContent = message;
  statusLabel.dataset.status = type;
}

function saveFavorites() {
  localStorage.setItem('favoriteCities', JSON.stringify(Array.from(favorites)));
  updateFavoriteUI();
}

function updateFavoriteUI() {
  const items = Array.from(favorites);
  favoritesListLabel.textContent = items.length ? items.join(', ') : 'None';

  favoriteChipsContainer.innerHTML = items.length
    ? items.map((city) => `<button class="chip favorite-chip" type="button" data-city="${city}">${city}</button>`).join('')
    : '<span class="muted-chip">No saved cities yet</span>';

  favoriteChipsContainer.querySelectorAll('button').forEach((button) => {
    button.addEventListener('click', () => {
      searchInput.value = button.dataset.city;
      loadWeather(button.dataset.city);
    });
  });

  const favoriteText = currentCity && favorites.has(currentCity) ? 'Remove favorite' : 'Add favorite';
  favoriteButton.textContent = favoriteText;
}

function setUnitButtons() {
  unitToggle.querySelectorAll('button').forEach((button) => {
    button.classList.toggle('active', button.dataset.unit === currentUnit);
  });
}

function createCityButtons() {
  cityButtonsContainer.innerHTML = cities.map((city) => `
    <button class="chip" type="button" data-city="${city}">${city}</button>
  `).join('');

  cityButtonsContainer.querySelectorAll('button').forEach((button) => {
    button.addEventListener('click', () => {
      const city = button.dataset.city;
      searchInput.value = city;
      loadWeather(city);
    });
  });
}

function toUnit(value) {
  if (currentUnit === 'metric') return value;
  return (value * 9) / 5 + 32;
}

function formatTemperature(value) {
  return `${Math.round(toUnit(value))}${units[currentUnit].label}`;
}

function formatWind(speed) {
  if (currentUnit === 'metric') {
    return `${speed.toFixed(1)} ${units.metric.speed}`;
  }
  return `${(speed * 2.237).toFixed(1)} ${units.imperial.speed}`;
}

function chooseDailyForecast(entries) {
  const ideal = entries.find((entry) => entry.dt_txt.includes('12:00:00')) || entries[Math.floor(entries.length / 2)];
  return ideal;
}

function buildDailyForecast(list) {
  const days = new Map();

  list.forEach((item) => {
    const [date] = item.dt_txt.split(' ');
    const items = days.get(date) || [];
    items.push(item);
    days.set(date, items);
  });

  return Array.from(days.values())
    .map((entries) => chooseDailyForecast(entries))
    .slice(0, 5);
}

const API_BASE_URL = 'https://api.openweathermap.org/data/2.5';

function ensureApiKey() {
  if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
    throw new Error('OpenWeatherMap API key is missing. Set VITE_OPENWEATHER_API_KEY in .env or update the placeholder.');
  }
}

async function fetchCurrentWeather(cityName) {
  ensureApiKey();

  const encodedCity = encodeURIComponent(`${cityName},CM`);
  const url = `${API_BASE_URL}/weather?q=${encodedCity}&units=metric&lang=en&appid=${apiKey}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Unable to fetch weather for ${cityName}. (${response.status})`);
  }
  return response.json();
}

async function fetchForecast(cityName) {
  ensureApiKey();

  const encodedCity = encodeURIComponent(`${cityName},CM`);
  const url = `${API_BASE_URL}/forecast?q=${encodedCity}&units=metric&lang=en&appid=${apiKey}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Unable to fetch forecast for ${cityName}. (${response.status})`);
  }
  return response.json();
}

function renderForecast(forecastData) {
  const list = forecastData.list || [];
  const daily = buildDailyForecast(list);
  const timezone = forecastData.city?.timezone || 0;

  forecastCards.innerHTML = daily
    .map((item) => {
      const weather = item.weather?.[0];
      return `
        <article class="forecast-card">
          <p class="forecast-day">${formatDay(item.dt, timezone)}</p>
          <img class="forecast-icon" src="https://openweathermap.org/img/wn/${weather.icon}@2x.png" alt="${weather.description}" />
          <p class="forecast-description">${weather.description}</p>
          <p class="forecast-temp">${formatTemperature(item.main.temp)}</p>
        </article>
      `;
    })
    .join('');
}

function renderWeather(currentData, forecastData) {
  currentCity = currentData.name || currentCity;
  localStorage.setItem('lastWeatherCity', currentCity);

  const weather = currentData.weather?.[0] || {};
  const main = currentData.main || {};
  const wind = currentData.wind || {};
  const timezone = currentData.timezone || 0;

  locationLabel.textContent = `${currentCity}, Cameroon`;
  descriptionLabel.textContent = weather.description ? weather.description : 'Weather details unavailable';
  tempLabel.textContent = main.temp ? formatTemperature(main.temp) : '--';
  feelsLabel.textContent = main.feels_like ? formatTemperature(main.feels_like) : '--';
  humidityLabel.textContent = main.humidity ? `${main.humidity}%` : '--';
  windLabel.textContent = wind.speed ? formatWind(wind.speed) : '--';
  updateLabel.textContent = currentData.dt ? formatDate(currentData.dt, timezone) : '--';
  iconImage.src = weather.icon ? `https://openweathermap.org/img/wn/${weather.icon}@4x.png` : '';
  iconImage.alt = weather.description || 'Weather icon';
  iconImage.parentElement.classList.toggle('no-icon', !weather.icon);

  renderForecast(forecastData);
  setStatus('Updated now', 'success');
  updateFavoriteUI();
}

async function loadWeather(cityName) {
  if (!cityName?.trim()) {
    setStatus('Please enter a city name.', 'error');
    return;
  }

  const normalizedCity = cityName.trim();
  setStatus('Loading weather...', 'loading');

  try {
    const [currentData, forecastData] = await Promise.all([
      fetchCurrentWeather(normalizedCity),
      fetchForecast(normalizedCity)
    ]);
    renderWeather(currentData, forecastData);
  } catch (error) {
    locationLabel.textContent = 'City not found';
    descriptionLabel.textContent = 'Check the city name and try again.';
    tempLabel.textContent = '--';
    feelsLabel.textContent = '--';
    humidityLabel.textContent = '--';
    windLabel.textContent = '--';
    updateLabel.textContent = '--';
    iconImage.src = '';
    forecastCards.innerHTML = '';
    setStatus(error.message, 'error');
    console.error(error);
  }
}

searchButton.addEventListener('click', () => loadWeather(searchInput.value));
searchInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    loadWeather(searchInput.value);
  }
});

unitToggle.addEventListener('click', (event) => {
  const target = event.target.closest('button[data-unit]');
  if (!target) return;
  currentUnit = target.dataset.unit;
  localStorage.setItem('weatherUnit', currentUnit);
  setUnitButtons();
  loadWeather(currentCity);
});

favoriteButton.addEventListener('click', () => {
  if (!currentCity) return;
  if (favorites.has(currentCity)) {
    favorites.delete(currentCity);
  } else {
    favorites.add(currentCity);
  }
  saveFavorites();
});

createCityButtons();
setUnitButtons();
updateFavoriteUI();
loadWeather(currentCity);
