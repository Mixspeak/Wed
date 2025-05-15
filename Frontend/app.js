// First verify AWS and Amplify are loaded
function initializeApp() {
  if (typeof AWS === 'undefined' || typeof Amplify === 'undefined') {
    showError('AWS SDK or Amplify not loaded!', true);
    return;
  }

  // Configuration
  const config = {
    region: 'us-east-1',
    userPoolId: 'us-east-1_nSY2Zks8d',
    userPoolWebClientId: '8087ck55rluaqvde5u2qt42b2',
    identityPoolId: 'us-east-1:dd6c356c-7255-408a-9e13-6e6eafe75b41'
  };

  try {
    // Initialize Amplify and AWS
    Amplify.configure({ Auth: config });
    
    AWS.config.update({
      region: config.region,
      credentials: new AWS.CognitoIdentityCredentials({
        IdentityPoolId: config.identityPoolId,
        Logins: {}
      })
    });

    // Verify credentials
    AWS.config.credentials.get(function(err) {
      if (err) {
        console.error("Credentials error:", err);
        showError("Error de inicialización. Por favor recarga.", false);
        return;
      }
      
      console.log("AWS initialized successfully");
      initializeAppFeatures();
    });
  } catch (error) {
    console.error("Initialization error:", error);
    showError("Error en la aplicación. Intenta más tarde.", false);
  }
}

function initializeAppFeatures() {
  // Weather Widget
  async function fetchWeather() {
    try {
      const response = await fetch('https://api.openweathermap.org/data/2.5/weather?q=Jungapeo&appid=cb2cfb2c5f62bb4438016eab750db987&units=metric&lang=es');
      const data = await response.json();
      const weatherElement = document.getElementById('weather-data');
      if (weatherElement) {
        weatherElement.innerHTML = `
          <p>🌡️ ${Math.round(data.main.temp)}°C • ${data.weather[0].description}</p>
          <small>${new Date().toLocaleDateString('es')}</small>
        `;
      }
    } catch (error) {
      console.error("Weather error:", error);
      const weatherElement = document.getElementById('weather-data');
      if (weatherElement) {
        weatherElement.innerHTML = '<p>Clima no disponible</p>';
      }
    }
  }

  // WhatsApp Button
  const whatsappButton = document.getElementById('whatsapp-button');
  if (whatsappButton) {
    whatsappButton.addEventListener('click', () => {
      const phone = "+525548943857";
      const message = encodeURIComponent("¡Confirmo mi asistencia al evento de Evelyn & Irving!");
      window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
    });
  }

  // Initialize features
  fetchWeather();
}

function showError(message, isFatal) {
  const errorDiv = document.createElement('div');
  errorDiv.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: ${isFatal ? '#ffebee' : '#fff8e1'};
    color: ${isFatal ? '#c62828' : '#e65100'};
    padding: 15px;
    text-align: center;
    z-index: 1000;
    border-bottom: 1px solid ${isFatal ? '#ef9a9a' : '#ffcc80'};
  `;
  
  errorDiv.innerHTML = `
    <strong>${isFatal ? 'Error Grave' : 'Advertencia'}</strong>
    <p>${message}</p>
    <button onclick="window.location.reload()" style="
      background: ${isFatal ? '#c62828' : '#fb8c00'};
      color: white;
      border: none;
      padding: 5px 10px;
      border-radius: 4px;
      cursor: pointer;
    ">Recargar</button>
  `;
  
  document.body.prepend(errorDiv);
}

// Start the app when DOM is ready
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  initializeApp();
} else {
  document.addEventListener('DOMContentLoaded', initializeApp);
}