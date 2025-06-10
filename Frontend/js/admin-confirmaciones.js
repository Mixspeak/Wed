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
          const telefono = data.telefono?.toLowerCase() || '';
          
          if (!nombre.includes(searchTerm) && !telefono.includes(searchTerm)) {
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
    <p><i class="fas fa-phone"></i> ${data.telefono || 'sin teléfono'}</p>
    <p><i class="fas fa-users"></i> ${data.asistentes || 0} asistentes</p>
    <p><i class="fas fa-envelope"></i><strong>Mensaje:</strong> ${data.mensaje}</p>
    <p><i class="fas fa-calendar"></i> ${fecha}</p>
    <div class="confirmation-actions">
        <button data-id="${id}" class="toggle-valid ${data.valido ? 'gold-button' : 'gold-button outline'}">
        ${data.valido ? 'Válido' : 'No válido'}
        </button>
        <button data-id="${id}" class="send-whatsapp gold-button">
        <i class="fas fa-paper-plane"></i> Enviar QR
        </button>
        <button data-id="${id}" class="delete-btn gold-button danger">
        <i class="fas fa-trash-alt"></i> Eliminar
        </button>
    </div>
    `;
    
    container.appendChild(confirmationItem);
  }
  
  async function sendQRByWhatsApp(e) {
    const id = e.target.getAttribute('data-id');
    const button = e.target;
    
    try {
      // Mostrar estado de carga
      button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Preparando...';
      button.disabled = true;
      
      // 1. Obtener datos de la confirmación
      const doc = await db.collection('confirmaciones').doc(id).get();
      if (!doc.exists) throw new Error('Confirmación no encontrada');
      
      const data = doc.data();
      if (!data.telefono) throw new Error('No hay número de teléfono registrado');
      
      // 2. Verificar si tenemos URL del QR
      if (!data.qrImageUrl) {
        throw new Error('No se encontró la imagen QR en Storage');
      }
      
      // 3. Generar mensaje para WhatsApp
      const messageText = `Hola ${data.nombre}, aquí está tu confirmación para el evento:\n\n` +
                        `*Evento:* Mi Boda\n` +
                        `*Asistentes:* ${data.asistentes || 1}\n\n` +
                        `Por favor muestra este QR al llegar al evento:`;
      
      // 4. Formatear número de teléfono
      const telefono = data.telefono.replace(/\D/g, '');
      
      // 5. Crear página temporal con el QR
      const tempPageUrl = await createTempQRPage(data.qrImageUrl, messageText, data.nombre);
      
      // 6. Abrir WhatsApp con instrucciones
      const whatsappUrl = `https://wa.me/${telefono}?text=${encodeURIComponent(
        `${messageText}\n\n` +
        `Descarga tu QR aquí: ${tempPageUrl}\n\n` +
        `O copia esta URL y ábrela en tu navegador para ver el QR: ${data.qrImageUrl}`
      )}`;
      
      window.open(whatsappUrl, '_blank');
      
    } catch (error) {
      console.error("Error al enviar por WhatsApp:", error);
      alert(`Error: ${error.message}`);
    } finally {
      // Restaurar botón
      if (button) {
        button.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar QR';
        button.disabled = false;
      }
    }
}

// Función auxiliar para crear página temporal con el QR
async function createTempQRPage(qrImageUrl, message, nombre) {
  try {
    // Subir una página HTML temporal a Firebase Storage
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>QR para ${nombre}</title>
        <meta property="og:title" content="Tu QR para el evento">
        <meta property="og:description" content="${message}">
        <meta property="og:image" content="${qrImageUrl}">
        <meta property="og:url" content="${qrImageUrl}">
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
          img { max-width: 100%; height: auto; margin: 20px 0; }
        </style>
      </head>
      <body>
        <h1>QR para ${nombre}</h1>
        <img src="${qrImageUrl}" alt="Código QR">
        <p>${message}</p>
      </body>
      </html>
    `;
    
    const storageRef = storage.ref();
    const tempPageRef = storageRef.child(`temp_pages/qr_${Date.now()}.html`);
    await tempPageRef.putString(htmlContent, 'raw');
    return await tempPageRef.getDownloadURL();
    
  } catch (error) {
    console.error("Error creando página temporal:", error);
    return qrImageUrl; // Fallback a la URL directa de la imagen
  }
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

  document.addEventListener('click', function(e) {
    if (e.target.closest('.send-whatsapp')) {
      sendQRByWhatsApp(e);
    }
    if (e.target.closest('.toggle-valid')) {
      toggleValidStatus(e);
    }
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
          <p><strong>Teléfono:</strong> ${data.telefono}</p>
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
          <p><strong>Teléfono:</strong> ${confirmation.telefono}</p>
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

  // Modal de confirmación (agrega esto al final de tu HTML body)
document.body.insertAdjacentHTML('beforeend', `
    <div id="delete-modal" class="delete-modal">
      <div class="delete-modal-content">
        <h3>¿Eliminar esta confirmación?</h3>
        <p>Esta acción no se puede deshacer. Se eliminarán todos los datos asociados.</p>
        <div class="delete-modal-actions">
          <button id="cancel-delete" class="gold-button outline">Cancelar</button>
          <button id="confirm-delete" class="gold-button danger">Eliminar</button>
        </div>
      </div>
    </div>
  `);
  
  // Variables para el control de eliminación
  let currentDeleteId = null;
  
  // Delegación de eventos para los botones de eliminar
  document.addEventListener('click', function(e) {
    if (e.target.closest('.delete-btn')) {
      const card = e.target.closest('.confirmation-card');
      currentDeleteId = e.target.closest('.delete-btn').getAttribute('data-id');
      
      // Mostrar modal de confirmación
      document.getElementById('delete-modal').style.display = 'flex';
      
      // Opcional: Resaltar la tarjeta que se eliminará
      card.style.boxShadow = '0 0 0 2px #e74c3c';
    }
  });
  
  // Manejar acciones del modal
  document.getElementById('confirm-delete').addEventListener('click', deleteConfirmation);
  document.getElementById('cancel-delete').addEventListener('click', closeDeleteModal);
  
  // Función para cerrar el modal
  function closeDeleteModal() {
    document.getElementById('delete-modal').style.display = 'none';
    currentDeleteId = null;
    
    // Quitar resaltado de todas las tarjetas
    document.querySelectorAll('.confirmation-card').forEach(card => {
      card.style.boxShadow = '';
    });
  }
  
  // Función para eliminar la confirmación
  async function deleteConfirmation() {
    if (!currentDeleteId) {
      closeDeleteModal();
      return;
    }
  
    try {
      // Mostrar estado de carga
      document.getElementById('confirm-delete').innerHTML = '<i class="fas fa-spinner fa-spin"></i> Eliminando...';
      document.getElementById('confirm-delete').disabled = true;
      
      // Eliminar el documento de Firestore
      await db.collection('confirmaciones').doc(currentDeleteId).delete();
      
      // Mostrar mensaje de éxito
      showToast('Confirmación eliminada correctamente', 'success');
      
      // Recargar la lista
      const filter = document.getElementById('status-filter').value;
      const searchTerm = document.getElementById('search-input').value;
      loadConfirmations(filter, searchTerm);
      
    } catch (error) {
      console.error("Error al eliminar:", error);
      showToast('Error al eliminar la confirmación', 'error');
    } finally {
      closeDeleteModal();
    }
  }
  
  // Función para mostrar notificaciones (toast)
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    toast.innerHTML = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }