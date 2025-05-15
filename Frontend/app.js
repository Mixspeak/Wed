// Configuración de AWS (reemplaza con tus credenciales)
AWS.config.update({
  region: 'us-east-1',
  accessKeyId: 'AKIAWXH3TVVY2QN7V7OZ',
  secretAccessKey: '/jP+xxfmmZcMl9vmaCjnpTCHFIEwFOcP5N/vJWvZX59X'
});

// Widget de clima
async function fetchWeather() {
  try {
    const response = await fetch('https://api.openweathermap.org/data/2.5/weather?q=Ciudad de México&appid=TU_API_KEY&units=metric&lang=es');
    const data = await response.json();
    const weatherDiv = document.getElementById('weather-data');
    weatherDiv.innerHTML = `
      <p>🌡️ ${Math.round(data.main.temp)}°C • ☁️ ${data.weather[0].description}</p>
      <small>${new Date().toLocaleDateString('es')}</small>
    `;
  } catch (error) {
    console.error("Error al cargar el clima:", error);
  }
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