// Configuración de AWS (reemplaza con tus credenciales)
const AWS_CONFIG = {
  region: '__AWS_REGION__',
  accessKeyId: '__AWS_ACCESS_KEY_ID__',
  secretAccessKey: '__AWS_SECRET_ACCESS_KEY__'
};

// Widget de clima
async function fetchWeather() {
  try {
    const response = await fetch('https://api.openweathermap.org/data/2.5/weather?q=Jungapeo&appid=cb2cfb2c5f62bb4438016eab750db987&units=metric&lang=es');
    const data = await response.json();
    document.getElementById('weather-data').innerHTML = `
      <p>🌡️ ${Math.round(data.main.temp)}°C • ${data.weather[0].description}</p>
      <small>${new Date().toLocaleDateString('es')}</small>
    `;
  } catch (error) {
    console.error("Weather error:", error);
    document.getElementById('weather-data').innerHTML = '<p>Clima no disponible</p>';
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