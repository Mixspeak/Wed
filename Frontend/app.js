// Configuración de AWS (reemplaza con tus credenciales)
//AWS.config.update({
//  region: 'us-east-1',
//  accessKeyId: '',
//  secretAccessKey: ''
//});

// In your app.js or auth.js
// Configure Amplify
const authConfig = {
  region: 'us-east-1',
  userPoolId: 'us-east-1_nSY2Zks8d',
  userPoolWebClientId: '8087ck55rluaqvde5u2qt42b2',
  identityPoolId: 'us-east-1:dd6c356c-7255-408a-9e13-6e6eafe75b41'
};

AWS.config.update({
  region: 'us-east-1',
  credentials: new AWS.CognitoIdentityCredentials({
    IdentityPoolId: authConfig.identityPoolId
  })
});

// Initialize Amplify
Amplify.configure({
  Auth: authConfig
});

// Example usage
async function signIn(username, password) {
  try {
    const user = await Amplify.Auth.signIn(username, password);
    console.log('Signed in:', user);
  } catch (error) {
    console.error('Sign in error:', error);
  }
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