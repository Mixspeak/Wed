// Configuración de AWS (reemplaza con tus credenciales)
//AWS.config.update({
//  region: 'us-east-1',
//  accessKeyId: '',
//  secretAccessKey: ''
//});

// First verify AWS and Amplify are loaded
if (typeof AWS === 'undefined' || typeof Amplify === 'undefined') {
  console.error('AWS SDK or Amplify not loaded!');
  document.body.innerHTML = `
    <div style="color: red; padding: 20px;">
      <h2>Loading Error</h2>
      <p>Failed to load required resources. Please:</p>
      <ol>
        <li>Refresh the page</li>
        <li>Check your internet connection</li>
        <li>Try a different browser</li>
      </ol>
    </div>
  `;
} else {
  // Configuration - REPLACE WITH YOUR ACTUAL VALUES
  const config = {
    region: 'us-east-1',
    userPoolId: 'us-east-1_nSY2Zks8d',
    userPoolWebClientId: '8087ck55rluaqvde5u2qt42b2', // Get from Cognito Console
    identityPoolId: 'us-east-1:dd6c356c-7255-408a-9e13-6e6eafe75b41'
  };

  // Initialize Amplify
  try {
    Amplify.configure({ Auth: config });
    
    // Initialize AWS Credentials
    AWS.config.update({
      region: config.region,
      credentials: new AWS.CognitoIdentityCredentials({
        IdentityPoolId: config.identityPoolId,
        Logins: {} // Empty for unauthenticated access
      })
    });

    // Verify credentials
    AWS.config.credentials.get(function(err) {
      if (err) {
        console.error("Error getting credentials:", err);
        showError("Failed to initialize. Please refresh.");
      } else {
        console.log("Successfully initialized!");
        // Your application code here
      }
    });
  } catch (error) {
    console.error("Initialization error:", error);
    showError("Application error. Please try again later.");
  }
}

function showError(message) {
  const errorDiv = document.createElement('div');
  errorDiv.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: #ffebee;
    color: #c62828;
    padding: 15px;
    text-align: center;
    z-index: 1000;
  `;
  errorDiv.textContent = message;
  document.body.prepend(errorDiv);
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