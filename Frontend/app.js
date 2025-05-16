AWS.config.region = 'us-east-1'; // Only region is needed in client code
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
  IdentityPoolId: 'us-east-1:7e8675ae-dbc4-4685-8620-81f78ae7ac20'
});

async function fetchWeather() {
  try {
    const response = await fetch('https://api.openweathermap.org/data/2.5/weather?q=Jungapeo&appid=cb2cfb2c5f62bb4438016eab750db987&units=metric&lang=es');
    const data = await response.json();
    
    // Icono según condiciones
    const weatherIcon = getWeatherIcon(data.weather[0].id, data.weather[0].icon);
    
    document.getElementById('weather-data').innerHTML = `
      <div class="weather-card">
        <div class="weather-header">
          <h3>${data.name}, ${data.sys.country}</h3>
          <span class="weather-date">${formatDate(new Date(), data.timezone)}</span>
        </div>
        <div class="weather-main">
          ${weatherIcon}
          <div class="weather-temp">${Math.round(data.main.temp)}°C</div>
          <div class="weather-desc">${capitalizeFirstLetter(data.weather[0].description)}</div>
        </div>
        <div class="weather-details">
          <div class="detail">
            <span>🌡️ Sensación:</span>
            <span>${Math.round(data.main.feels_like)}°C</span>
          </div>
          <div class="detail">
            <span>💧 Humedad:</span>
            <span>${data.main.humidity}%</span>
          </div>
          <div class="detail">
            <span>💨 Viento:</span>
            <span>${(data.wind.speed * 3.6).toFixed(1)} km/h</span>
          </div>
          <div class="detail">
            <span>☀️ Amanecer:</span>
            <span>${formatTime(data.sys.sunrise, data.timezone)}</span>
          </div>
          <div class="detail">
            <span>🌙 Atardecer:</span>
            <span>${formatTime(data.sys.sunset, data.timezone)}</span>
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    console.error("Weather error:", error);
    document.getElementById('weather-data').innerHTML = `
      <div class="weather-error">
        <p>⚠️ Clima no disponible</p>
        <small>Intenta recargar la página</small>
      </div>
    `;
  }
}

// Improved date/time formatting functions
function formatDate(date, timezoneOffset) {
  // Create new date with timezone offset applied
  const localDate = new Date(date.getTime() + (timezoneOffset * 1000));
  
  const options = { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long',
    timeZone: 'UTC' // We're manually handling timezone
  };
  return localDate.toLocaleDateString('es-ES', options);
}

function formatTime(timestamp, timezoneOffset) {
  // Create Date object from UTC timestamp
  const date = new Date(timestamp * 1000);
  
  // Apply timezone offset
  const localDate = new Date(date.getTime() + (timezoneOffset * 1000));
  
  return localDate.toLocaleTimeString('es-ES', { 
    hour: '2-digit', 
    minute: '2-digit',
    timeZone: 'UTC' // Important: We're manually handling timezone
  });
}

// Helper functions remain the same
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function getWeatherIcon(weatherId, iconCode) {
  const isDay = iconCode.includes('d');
  const icons = {
    '01': '☀️', // cielo claro
    '02': '⛅', // pocas nubes
    '03': '☁️', // nubes dispersas
    '04': '☁️', // nubes rotas
    '09': '🌧️', // lluvia moderada
    '10': '🌦️', // lluvia
    '11': '⛈️', // tormenta
    '13': '❄️', // nieve
    '50': '🌫️'  // niebla
  };
  const iconKey = weatherId.toString()[0] === '5' ? '50' : iconCode.substring(0, 2);
  return icons[iconKey] || '🌤️';
}


// Botón de WhatsApp
document.getElementById('whatsapp-button').addEventListener('click', () => {
  const phone = "5215512345678"; // Reemplaza con tu número
  const message = encodeURIComponent("¡Confirmo mi asistencia al evento de Laura y Alejandro!");
  window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
});

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  fetchWeather();
});