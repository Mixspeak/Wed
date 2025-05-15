// Configuración de AWS (reemplaza con tus credenciales)
const AWS_CONFIG = {
  region: '###AWS_REGION###',
  accessKeyId: '###AWS_ACCESS_KEY_ID###',
  secretAccessKey: '###AWS_SECRET_ACCESS_KEY###'
};

// Inicialización condicional para desarrollo/producción
if (AWS_CONFIG.accessKeyId.startsWith('###')) {
  // Entorno de desarrollo (usar valores locales)
  AWS.config.update({
    region: 'us-east-1',
    accessKeyId: 'TU_ACCESS_KEY_LOCAL',  // Solo para desarrollo local
    secretAccessKey: 'TU_SECRET_KEY_LOCAL' // Solo para desarrollo local
  });
} else {
  // Entorno de producción (valores reemplazados por GitHub Actions)
  AWS.config.update(AWS_CONFIG);
}

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