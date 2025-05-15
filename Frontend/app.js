// Configuración de AWS (cambiar con tus credenciales)
AWS.config.update({
  region: 'us-east-1',
  accessKeyId: 'TU_ACCESS_KEY',
  secretAccessKey: 'TU_SECRET_KEY'
});

// Widget de clima
async function fetchWeather() {
  const response = await fetch('https://api.openweathermap.org/data/2.5/weather?q=Ciudad de México&appid=TU_API_KEY&units=metric&lang=es');
  const data = await response.json();
  const weatherDiv = document.getElementById('weather-data');
  weatherDiv.innerHTML = `
    <p>🌡️ Temperatura: ${data.main.temp}°C</p>
    <p>☁️ Condición: ${data.weather[0].description}</p>
  `;
}

// Integración con WhatsApp
document.getElementById('whatsapp-button').addEventListener('click', () => {
  const phone = '5215512345678'; // Reemplaza con tu número
  const message = encodeURIComponent('¡Confirmo mi asistencia al evento!');
  window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
});

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  fetchWeather();
});