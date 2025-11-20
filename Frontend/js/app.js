AWS.config.region = 'us-east-1';
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
  IdentityPoolId: 'us-east-1:7e8675ae-dbc4-4685-8620-81f78ae7ac20'
});

/* STORYTELLING SCROLL REVEAL */
const revealItems = document.querySelectorAll('.reveal-story');

const ioStory = new IntersectionObserver((entries)=>{
  entries.forEach(entry=>{
    if(entry.isIntersecting){
      entry.target.classList.add('inview');
    }
  });
},{
  threshold:0.25
});

revealItems.forEach(el => ioStory.observe(el));


async function fetchWeather() {
  try {
    // Fetch current weather and forecast (3 days)
    const currentResponse = await fetch('https://api.openweathermap.org/data/2.5/weather?q=Jungapeo&appid=cb2cfb2c5f62bb4438016eab750db987&units=metric&lang=es');
    const forecastResponse = await fetch('https://api.openweathermap.org/data/2.5/forecast?q=Jungapeo&appid=cb2cfb2c5f62bb4438016eab750db987&units=metric&lang=es&cnt=24');
    
    const currentData = await currentResponse.json();
    const forecastData = await forecastResponse.json();
    
    // Process forecast data to get daily values
    const dailyForecast = processForecastData(forecastData);
    
    // Generate weather HTML
    document.getElementById('weather-data').innerHTML = `
      <div class="weather-current">
        ${generateCurrentWeather(currentData)}
      </div>
      <div class="weather-forecast">
        <h3>Pronóstico para los próximos días</h3>
        <div class="forecast-days">
          ${dailyForecast.map(day => generateForecastDay(day)).join('')}
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

function processForecastData(forecastData) {
  // Group forecast by day
  const dailyForecast = {};
  
  forecastData.list.forEach(item => {
    const date = new Date(item.dt * 1000);
    const dayKey = date.toLocaleDateString('es-ES', { weekday: 'long' });
    
    if (!dailyForecast[dayKey]) {
      dailyForecast[dayKey] = {
        date: date,
        temps: [],
        weather: [],
        icon: item.weather[0].icon,
        description: item.weather[0].description
      };
    }
    
    dailyForecast[dayKey].temps.push(item.main.temp);
    dailyForecast[dayKey].weather.push(item.weather[0]);
  });
  
  // Convert to array and calculate averages
  return Object.keys(dailyForecast).slice(0, 3).map(dayKey => {
    const day = dailyForecast[dayKey];
    const temps = day.temps;
    
    return {
      day: dayKey,
      date: day.date,
      icon: getWeatherIcon(day.weather[0].id, day.weather[0].icon),
      description: capitalizeFirstLetter(day.weather[0].description),
      temp_max: Math.round(Math.max(...temps)),
      temp_min: Math.round(Math.min(...temps)),
      temp_avg: Math.round(temps.reduce((a, b) => a + b, 0) / temps.length)
    };
  });
}

function generateCurrentWeather(data) {
  return `
    <div class="weather-card">
      <div class="weather-header">
        <h3>${data.name}, ${data.sys.country}</h3>
        <span class="weather-date">${formatDate(new Date(), data.timezone)}</span>
      </div>
      <div class="weather-main">
        ${getWeatherIcon(data.weather[0].id, data.weather[0].icon)}
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
}

function generateForecastDay(day) {
  return `
    <div class="forecast-day">
      <div class="forecast-date">${day.day}</div>
      <div class="forecast-icon">${day.icon}</div>
      <div class="forecast-temp">
        <span class="max-temp">${day.temp_max}°</span>
        <span class="min-temp">${day.temp_min}°</span>
      </div>
      <div class="forecast-desc">${day.description}</div>
    </div>
  `;
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

/* ===========================
   COUNTDOWN
=========================== */

const targetDate = new Date("Apr 18, 2026 16:00:00").getTime();

setInterval(function(){
  const now = new Date().getTime();
  const diff = targetDate - now;

  const d = Math.floor(diff / (1000*60*60*24));
  const h = Math.floor((diff % (1000*60*60*24)) / (1000*60*60));
  const m = Math.floor((diff % (1000*60*60)) / (1000*60));
  const s = Math.floor((diff % (1000*60)) / 1000);

  document.getElementById("dias").innerText = d;
  document.getElementById("horas").innerText = h;
  document.getElementById("minutos").innerText = m;
  document.getElementById("segundos").innerText = s;
}, 1000);


document.addEventListener('DOMContentLoaded', function() {
  /* ===========Parallax=============*/
  /* ================================*/
  // Optimized Parallax Class
  class SmoothParallax {
    constructor() {
      this.containers = [];
      this.lastScrollY = 0;
      this.ticking = false;
      
      this.init();
    }
    
    init() {
      document.querySelectorAll('.parallax-container').forEach(container => {
        this.containers.push({
          element: container,
          layers: container.querySelectorAll('.parallax-layer, .parallax-content'),
          top: 0,
          height: 0
        });
      });
      
      this.calculatePositions();
      window.addEventListener('scroll', this.onScroll.bind(this));
      window.addEventListener('resize', this.calculatePositions.bind(this));
    }
    
    calculatePositions() {
      this.containers.forEach(container => {
        const rect = container.element.getBoundingClientRect();
        container.top = rect.top + window.scrollY;
        container.height = rect.height;
      });
    }
    
    onScroll() {
      this.lastScrollY = window.scrollY;
      
      if (!this.ticking) {
        requestAnimationFrame(this.update.bind(this));
        this.ticking = true;
      }
    }
    
    update() {
      this.containers.forEach(container => {
        const scrollY = this.lastScrollY;
        const viewportHeight = window.innerHeight;
        
        if (scrollY + viewportHeight > container.top && 
            scrollY < container.top + container.height) {
          const scrolled = scrollY - container.top;
          
          container.layers.forEach(layer => {
            const speed = parseFloat(layer.getAttribute('data-speed')) || 0;
            const offset = scrolled * speed;
            layer.style.transform = `translateY(${offset}px)`;
          });
        }
      });
      
      this.ticking = false;
    }
  }
  new SmoothParallax();
  fetchWeather();
  // Set wedding details here
  const weddingDetails = {
    title: "Boda de Irving y Evelyn",
    description: "Celebración del matrimonio. ¡Esperamos verte allí!\n\nVestimenta: Formal\nDirección: Salón San Francisco, Jungapeo, Michoacán",
    location: "Salón San Francisco, Jungapeo, Michoacán",
    startTime: "20260418T160000", // Format: YYYYMMDDTHHMMSS
    endTime: "20260418T230000",   // Adjust with your times
    timezone: "America/Mexico_City",
    reminder: "-PT15M" // 15 minute reminder
  };

  document.getElementById('download-ics').addEventListener('click', function() {
    downloadICS(weddingDetails);
  });
 
function downloadICS(details) {
  // Generate the ICS file content
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Wedding//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${Date.now()}@irvingyevelyn.com`,
    `DTSTAMP:${formatDateForICS(new Date())}`,
    `DTSTART;TZID=${details.timezone}:${details.startTime}`,
    `DTEND;TZID=${details.timezone}:${details.endTime}`,
    `SUMMARY:${details.title}`,
    `DESCRIPTION:${details.description.replace(/\n/g, '\\n')}`,
    `LOCATION:${details.location}`,
    'STATUS:CONFIRMED',
    'TRANSP:OPAQUE',
    'BEGIN:VALARM',
    `TRIGGER:${details.reminder}`,
    'ACTION:DISPLAY',
    'DESCRIPTION:Recordatorio de boda',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\n');

  // Create and trigger the download
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = 'Boda-Evelyn-Irving.ics';
  document.body.appendChild(link);
  link.click();
  
  // Clean up
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
}

function formatDateForICS(date) {
  return date.toISOString()
    .replace(/-/g, '')
    .replace(/:/g, '')
    .replace(/\..+/, '')
    .replace('T', '');
}



  // ******************************************
  // Sprites
  // ******************************************
  //const groom = document.getElementById('groom-sprite');
  //const bride = document.getElementById('bride-sprite');
  //const documentHeight = document.body.scrollHeight;
  //const windowHeight = window.innerHeight;
  //const scrollableDistance = documentHeight - windowHeight;
  
  // Track if they've met for the first time
  //let hasMet = false;
  //let lastScrollY = window.scrollY;
  //
  //window.addEventListener('scroll', function() {
  //  const currentScrollY = window.scrollY;
  //  const scrollDirection = currentScrollY > lastScrollY ? 'down' : 'up';
  //  lastScrollY = currentScrollY;
  //  
  //  const scrollProgress = Math.min(Math.max(currentScrollY / scrollableDistance, 0), 1);
    
    // Going down - approaching each other
    //if (scrollDirection === 'down' && !hasMet) {
      // Calculate positions (meet at 90% of page)
      //const meetPoint = 0.9;
      //const approachProgress = Math.min(scrollProgress / meetPoint, 1);
      //
      //groom.style.top = `${20 + (30 * approachProgress)}%`;
      //bride.style.bottom = `${20 + (30 * approachProgress)}%`;
      
      // Rotation as they approach
      //const rotation = 5 * approachProgress;
      //groom.style.transform = `translateY(-50%)`;
      //bride.style.transform = `translateY(50%)`;
      
      // Check if they've met
      //if (approachProgress >= 1) {
        //hasMet = true;
        // Snap to together position
  //      groom.style.top = '50%';
  //      bride.style.bottom = 'auto';
  //      bride.style.top = '50%';
  //      groom.style.transform = 'translateY(-50%) translateX(-20px)';
  //      bride.style.transform = 'translateY(-50%) translateX(0px)';
  //    }
  //  }
    // Going up - separating (only if not at top)
    //else if (scrollDirection === 'up' && scrollProgress > 0) {
      // If they were together, start separating
    //  if (hasMet) {
    //    const separatePoint = 0.9;
    //    const separateProgress = 1 - (Math.max(scrollProgress, separatePoint) - separatePoint) / (1 - separatePoint);
    //    
    //    groom.style.top = `${20 + (30 * separateProgress)}%`;
    //    bride.style.bottom = `${20 + (30 * separateProgress)}%`;
    //    
    //    const rotation = 5 * separateProgress;
    //    groom.style.transform = `translateY(-50%)`;
    //    bride.style.transform = `translateY(50%)`;
        
        // If fully separated, reset hasMet
  //      if (separateProgress <= 0) {
  //        hasMet = false;
  //      }
  //    }
  //  }
    // When together (scrolling down after meeting)
  //  else if (hasMet) {
      // Keep them together
  //    groom.style.top = '50%';
  //    bride.style.top = '50%';
  //    groom.style.transform = 'translateY(-50%) translateX(-20px)';
  //    bride.style.transform = 'translateY(-50%) translateX(0px)';
  //  }
    
    // Always fully visible
  //  groom.style.opacity = 1;
  //  bride.style.opacity = 1;
  //});
  // ****************************************************
  // End of sprites
  // ****************************************************
})