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

function loadConfirmations(filter = 'all', search = '') {
  let query = db.collection('confirmaciones');
  
  if (filter === 'valid') query = query.where('valido', '==', true);
  if (filter === 'invalid') query = query.where('valido', '==', false);
  
  query.orderBy('fecha', 'desc').get()
    .then(snapshot => {
      const list = document.getElementById('confirmations-list');
      list.innerHTML = '';
      
      if (snapshot.empty) {
        list.innerHTML = '<p>No hay confirmaciones aún</p>';
        return;
      }
      
      snapshot.forEach(doc => {
        const data = doc.data();
        const nombre = data.nombre.toLowerCase();
        const email = data.email.toLowerCase();
        const searchTerm = search.toLowerCase();
        
        if (search && !nombre.includes(searchTerm) && !email.includes(searchTerm)) {
          return;
        }
        
        const confirmationItem = document.createElement('div');
        confirmationItem.className = `confirmation-card ${data.valido ? 'valid' : 'invalid'}`;
        confirmationItem.innerHTML = `
          <h3>${data.nombre}</h3>
          <p><i class="fas fa-envelope"></i> ${data.email}</p>
          <p><i class="fas fa-users"></i> ${data.asistentes} asistentes</p>
          <p><i class="fas fa-calendar"></i> ${data.fecha.toDate().toLocaleDateString()}</p>
          <div class="confirmation-actions">
            <button data-id="${doc.id}" class="toggle-valid ${data.valido ? 'gold-button' : 'gold-button outline'}">
              ${data.valido ? 'Válido' : 'No válido'}
            </button>
            <button data-id="${doc.id}" class="send-email gold-button">
              <i class="fas fa-paper-plane"></i> Enviar QR
            </button>
          </div>
        `;
        
        list.appendChild(confirmationItem);
      });
      
      // Agregar eventos a los botones
      document.querySelectorAll('.toggle-valid').forEach(btn => {
        btn.addEventListener('click', toggleValidStatus);
      });
      
      document.querySelectorAll('.send-email').forEach(btn => {
        btn.addEventListener('click', sendQRCode);
      });
    })
    .catch(error => {
      console.error("Error al cargar confirmaciones:", error);
    });
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

// Filtros y búsqueda
document.getElementById('status-filter').addEventListener('change', (e) => {
  loadConfirmations(e.target.value, document.getElementById('search-input').value);
});

document.getElementById('search-input').addEventListener('input', (e) => {
  loadConfirmations(document.getElementById('status-filter').value, e.target.value);
});