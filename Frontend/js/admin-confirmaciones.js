// Configuración igual que en confirmacion.js
// Configura Firebase con tus credenciales
const firebaseConfig = {
    apiKey: "AIzaSyBCFzL31n1AZRIGV6Vax563BpW4_DIbLt0",
    authDomain: "wedapp-8e7df.firebaseapp.com",
    projectId: "wedapp-8e7df",
    storageBucket: "wedapp-8e7df.firebasestorage.app",
    messagingSenderId: "416233320162",
    appId: "1:416233320162:web:d243a2c257f787be0c78bb"
  };
  
  // Inicializa Firebase
  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();
  const auth = firebase.auth();

// Autenticación (debes crear un usuario admin en Firebase Authentication)
auth.signInWithEmailAndPassword('umixspeak1@gmail.com', 'Xoch2M1l')
  .then(() => loadConfirmations())
  .catch(error => console.error("Error de autenticación:", error));

// Función mejorada para cargar confirmaciones con búsqueda
async function loadConfirmations(filter = 'all', search = '') {
    try {
      // Mostrar estado de carga
      const list = document.getElementById('confirmations-list');
      list.innerHTML = '<div class="loading-state"><div class="loading-spinner"></div><p>Cargando...</p></div>';
      
      // Obtener todos los documentos
      const snapshot = await db.collection('confirmaciones')
                            .orderBy('fecha', 'desc')
                            .get();
      
      // Procesar resultados
      if (snapshot.empty) {
        list.innerHTML = '<p class="empty-message"><i class="fas fa-inbox"></i> No hay confirmaciones aún</p>';
        return;
      }
      
      list.innerHTML = '';
      let hasResults = false;
      const searchTerm = search.toLowerCase().trim();
      
      snapshot.forEach(doc => {
        const data = doc.data();
        
        // Aplicar filtro por estado
        if (filter === 'valid' && !data.valido) return;
        if (filter === 'invalid' && data.valido) return;
        
        // Aplicar búsqueda si hay término
        if (searchTerm) {
          const nombre = data.nombre?.toLowerCase() || '';
          const email = data.email?.toLowerCase() || '';
          
          if (!nombre.includes(searchTerm) && !email.includes(searchTerm)) {
            return;
          }
        }
        
        // Si pasa los filtros, mostrar el resultado
        hasResults = true;
        renderConfirmationItem(list, doc.id, data);
      });
      
      if (!hasResults) {
        list.innerHTML = '<p class="empty-message"><i class="fas fa-search"></i> No se encontraron resultados</p>';
      }
      
    } catch (error) {
      console.error("Error al cargar confirmaciones:", error);
      showError(error);
    }
  }
  
  // Función para renderizar un item individual
  function renderConfirmationItem(container, id, data) {
    const confirmationItem = document.createElement('div');
    confirmationItem.className = `confirmation-card ${data.valido ? 'valid' : 'invalid'}`;
    
    const fecha = data.fecha?.toDate ? data.fecha.toDate().toLocaleDateString() : 'Fecha no disponible';
    
    confirmationItem.innerHTML = `
      <h3>${data.nombre || 'Sin nombre'}</h3>
      <p><i class="fas fa-envelope"></i> ${data.email || 'sin@email.com'}</p>
      <p><i class="fas fa-users"></i> ${data.asistentes || 0} asistentes</p>
      <p><i class="fas fa-calendar"></i> ${fecha}</p>
      <div class="confirmation-actions">
        <button data-id="${id}" class="toggle-valid ${data.valido ? 'gold-button' : 'gold-button outline'}">
          ${data.valido ? 'Válido' : 'No válido'}
        </button>
        <button data-id="${id}" class="send-email gold-button">
          <i class="fas fa-paper-plane"></i> Enviar QR
        </button>
      </div>
    `;
    
    container.appendChild(confirmationItem);
  }
  
  // Función para mostrar errores
  function showError(error) {
    const list = document.getElementById('confirmations-list');
    list.innerHTML = `
      <div class="error">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Error al cargar datos: ${error.message}</p>
      </div>
    `;
  }
  
  // Event listener para el campo de búsqueda
  document.getElementById('search-input').addEventListener('input', function(e) {
    const searchTerm = e.target.value;
    const filter = document.getElementById('status-filter').value;
    loadConfirmations(filter, searchTerm);
  });
  
  // Event listener para el filtro de estado
  document.getElementById('status-filter').addEventListener('change', function(e) {
    const filter = e.target.value;
    const searchTerm = document.getElementById('search-input').value;
    loadConfirmations(filter, searchTerm);
  });
  
  function showError(error) {
    const list = document.getElementById('confirmations-list');
    
    if (error.message.includes('index')) {
      list.innerHTML = `
        <div class="error">
          <i class="fas fa-exclamation-triangle"></i>
          <h3>Se requiere índice</h3>
          <p>Esta consulta necesita un índice especial en Firebase.</p>
          <a href="${error.message.match(/https:\/\/[^\s]+/)[0]}" 
             target="_blank" 
             class="gold-button">
            Crear índice automáticamente
          </a>
        </div>
      `;
    } else {
      list.innerHTML = `
        <div class="error">
          <i class="fas fa-exclamation-triangle"></i>
          <p>Error al cargar datos: ${error.message}</p>
        </div>
      `;
    }
  }
function toggleValidStatus(e) {
  const id = e.target.getAttribute('data-id');
  const currentStatus = e.target.classList.contains('gold-button');
  
  db.collection('confirmaciones').doc(id).update({
    valido: !currentStatus
  })
  .then(() => {
    alert(`Estado actualizado a ${!currentStatus ? 'VÁLIDO' : 'NO VÁLIDO'}`);
    loadConfirmations(
      document.getElementById('status-filter').value,
      document.getElementById('search-input').value
    );
  })
  .catch(error => {
    console.error("Error al actualizar estado:", error);
    alert("Error al actualizar estado");
  });
}

function sendQRCode(e) {
  const id = e.target.getAttribute('data-id');
  
  // Aquí implementarías el envío del correo
  // En un entorno real usarías un servicio como EmailJS o SendGrid
  alert(`Se enviará el QR al invitado con ID: ${id}\n\nEn un entorno real, esto enviaría un correo con el QR adjunto.`);
}

// Validar código QR manualmente
document.getElementById('validate-btn').addEventListener('click', () => {
  const qrInput = document.getElementById('qr-input').value.trim();
  const resultDiv = document.getElementById('validation-result');
  
  if (!qrInput) {
    resultDiv.innerHTML = '<p class="error">Ingresa un código QR o ID</p>';
    return;
  }
  
  db.collection('confirmaciones').doc(qrInput).get()
    .then(doc => {
      if (!doc.exists) {
        resultDiv.innerHTML = '<p class="error">Invitación no encontrada</p>';
        return;
      }
      
      const data = doc.data();
      resultDiv.innerHTML = `
        <div class="validation-success">
          <h3>Invitación ${data.valido ? 'VÁLIDA' : 'NO VÁLIDA'}</h3>
          <p><strong>Nombre:</strong> ${data.nombre}</p>
          <p><strong>Email:</strong> ${data.email}</p>
          <p><strong>Asistentes:</strong> ${data.asistentes}</p>
          <p><strong>Fecha confirmación:</strong> ${data.fecha.toDate().toLocaleString()}</p>
          <button class="gold-button toggle-valid" data-id="${doc.id}">
            Marcar como ${data.valido ? 'No Válido' : 'Válido'}
          </button>
        </div>
      `;
      
      // Agregar evento al botón
      document.querySelector('.validation-success .toggle-valid').addEventListener('click', toggleValidStatus);
    })
    .catch(error => {
      console.error("Error al validar:", error);
      resultDiv.innerHTML = '<p class="error">Error al validar invitación</p>';
    });
});

// Instalar la librería necesaria (agrega esto al head)
// <script src="https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js"></script>

let scannerActive = false;
let videoElement;

document.getElementById('start-camera').addEventListener('click', startQRScanner);
document.getElementById('stop-camera').addEventListener('click', stopQRScanner);
document.getElementById('upload-qr').addEventListener('click', () => document.getElementById('qr-file').click());
document.getElementById('qr-file').addEventListener('change', handleQRUpload);

function startQRScanner() {
  const scannerContainer = document.getElementById('scanner-container');
  scannerContainer.style.display = 'block';
  
  const qrReader = document.getElementById('qr-reader');
  qrReader.innerHTML = '';
  
  videoElement = document.createElement('video');
  const canvasElement = document.createElement('canvas');
  const canvasContext = canvasElement.getContext('2d');
  
  qrReader.appendChild(videoElement);
  qrReader.appendChild(canvasElement);
  
  navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
    .then(function(stream) {
      videoElement.srcObject = stream;
      videoElement.setAttribute("playsinline", true);
      videoElement.play();
      scannerActive = true;
      requestAnimationFrame(tick);
    })
    .catch(function(err) {
      showScanResult("Error al acceder a la cámara: " + err.message, false);
    });
  
  function tick() {
    if (!scannerActive) return;
    
    if (videoElement.readyState === videoElement.HAVE_ENOUGH_DATA) {
      canvasElement.height = videoElement.videoHeight;
      canvasElement.width = videoElement.videoWidth;
      canvasContext.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
      
      const imageData = canvasContext.getImageData(0, 0, canvasElement.width, canvasElement.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });
      
      if (code) {
        validateQRCode(code.data);
      }
    }
    
    requestAnimationFrame(tick);
  }
}

function stopQRScanner() {
  scannerActive = false;
  if (videoElement && videoElement.srcObject) {
    videoElement.srcObject.getTracks().forEach(track => track.stop());
  }
  document.getElementById('scanner-container').style.display = 'none';
}

function handleQRUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const img = new Image();
  img.onload = function() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);
    
    if (code) {
      validateQRCode(code.data);
    } else {
      showScanResult("No se encontró un código QR en la imagen", false);
    }
  };
  
  img.src = URL.createObjectURL(file);
}

function validateQRCode(qrData) {
  try {
    const data = JSON.parse(qrData);
    
    // Verifica que tenga la estructura esperada
    if (!data.id || !data.nombre) {
      throw new Error("Formato de QR inválido");
    }
    
    // Busca en Firestore
    db.collection('confirmaciones').doc(data.id).get()
      .then(doc => {
        if (!doc.exists) {
          throw new Error("Invitación no encontrada");
        }
        
        const confirmation = doc.data();
        const resultHTML = `
          <h3>Invitación Válida</h3>
          <p><strong>Nombre:</strong> ${confirmation.nombre}</p>
          <p><strong>Email:</strong> ${confirmation.email}</p>
          <p><strong>Asistentes:</strong> ${confirmation.asistentes}</p>
          <p><strong>Estado:</strong> ${confirmation.valido ? '✅ Válido' : '❌ No válido'}</p>
          <button class="gold-button toggle-valid" data-id="${doc.id}">
            ${confirmation.valido ? 'Invalidar' : 'Validar'}
          </button>
        `;
        
        showScanResult(resultHTML, true);
        stopQRScanner();
      })
      .catch(error => {
        showScanResult("Error al validar: " + error.message, false);
      });
  } catch (error) {
    showScanResult("Error al leer QR: " + error.message, false);
  }
}

function showScanResult(message, isSuccess) {
  const resultDiv = document.getElementById('scan-result');
  resultDiv.innerHTML = message;
  resultDiv.className = isSuccess ? 'scan-result scan-success' : 'scan-result scan-error';
}

// Delegación de eventos para el botón de validación
document.getElementById('scan-result').addEventListener('click', function(e) {
    if (e.target.classList.contains('toggle-valid')) {
      const id = e.target.getAttribute('data-id');
      toggleValidStatus(id);
    }
  });
  
  function toggleValidStatus(id) {
    db.collection('confirmaciones').doc(id).get()
      .then(doc => {
        const current = doc.data().valido;
        return db.collection('confirmaciones').doc(id).update({
          valido: !current
        });
      })
      .then(() => {
        showScanResult("Estado actualizado correctamente", true);
        loadConfirmations(); // Recargar la lista
      })
      .catch(error => {
        showScanResult("Error al actualizar estado: " + error.message, false);
      });
  }