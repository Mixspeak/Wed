const firebaseConfig = {
  apiKey: "AIzaSyD2yQFJGybiGa-sJEwJeHDSkxm6b21szhk",
  authDomain: "intercambios-navidenos.firebaseapp.com",
  projectId: "intercambios-navidenos",
  storageBucket: "intercambios-navidenos.firebasestorage.app",
  messagingSenderId: "453471770714",
  appId: "1:453471770714:web:506bde9accb046ae82a063"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
const storage = firebase.storage(); 

// Espera a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
  // Ahora puedes usar db de forma segura
  checkRegistroStatus();
});

// Función mejorada para registrar participantes
async function registrarParticipantes(participantes) {
  try {
    const batch = db.batch();
    const participantesRef = db.collection('participantes');
    
    for (const participante of participantes) {
      const docRef = participantesRef.doc();
      batch.set(docRef, {
        ...participante,
        fecha: firebase.firestore.FieldValue.serverTimestamp(),
        registradoPor: navigator.userAgent // Para debugging
      });
    }
    
    await batch.commit();
    return true;
  } catch (error) {
    console.error("Error detallado:", {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
}

// Verificar estado de registros al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    checkRegistroStatus();
    setupFormHandlers();
});

async function checkRegistroStatus() {
    try {
        // Fuerza conexión con el servidor y tiempo de espera
        const doc = await db.collection('config').doc('intercambio')
            .get({ source: 'server', timeout: 5000 });
            
        if (doc.exists) {
            const data = doc.data();
            if (data.registrosCerrados) {
                document.getElementById('registro-form').classList.add('hidden');
                document.getElementById('registros-cerrados').classList.remove('hidden');
            }
        }
    } catch (error) {
        console.error("Error detallado:", {
            code: error.code,
            message: error.message,
            stack: error.stack
        });
        
        // Manejo específico para errores de conexión
        if (error.code === 'unavailable' || error.message.includes('400')) {
            showError("Problema de conexión. Intenta recargar la página.");
            // Intenta reconectar
            setTimeout(checkRegistroStatus, 3000);
        }
    }
}

function showError(message) {
    const errorElement = document.getElementById('error-message') || 
                         document.createElement('div');
    errorElement.id = 'error-message';
    errorElement.textContent = message;
    errorElement.style.color = 'red';
    document.body.prepend(errorElement);
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    document.querySelector('.container').prepend(errorDiv);
    
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

function setupFormHandlers() {
    // Manejar agregar participantes adicionales
    document.getElementById('agregar-participante').addEventListener('click', function() {
        const container = document.getElementById('participantes-adicionales');
        const count = container.children.length + 1;
        
        const nuevoParticipante = document.createElement('div');
        nuevoParticipante.className = 'participante-adicional';
        nuevoParticipante.innerHTML = `
            <h3>Persona adicional ${count}</h3>
            <div class="form-group">
                <label for="nombre-${count}">Nombre:</label>
                <input type="text" id="nombre-${count}" required>
            </div>
            <div class="form-group">
                <label for="telefono-${count}">Teléfono:</label>
                <input type="tel" id="telefono-${count}" required>
            </div>
        `;
        
        container.appendChild(nuevoParticipante);
    });
    
    // Manejar envío del formulario
   document.getElementById('enviar-registro').addEventListener('click', async function(e) {
  e.preventDefault();
  
  const submitBtn = this;
  const originalBtnText = submitBtn.innerHTML;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registrando...';
  submitBtn.disabled = true;

  try {
    // Validar conexión a Firebase
    if (!firebase.apps.length) {
      throw new Error("Firebase no está inicializado");
    }

    // Recolectar datos
    const participantes = obtenerDatosFormulario();
    
    // Registrar en Firestore
    await registrarParticipantes(participantes);
    
    // Mostrar éxito
    mostrarMensajeExito();
    
  } catch (error) {
    console.error("Error completo:", error);
    
    // Mensajes específicos según el error
    if (error.code === 'permission-denied') {
      alert("Error de permisos. Las reglas de seguridad no permiten esta operación.");
    } else if (error.message.includes('ERR_BLOCKED_BY_CLIENT')) {
      alert("Error: El navegador o una extensión está bloqueando la conexión a Firebase. Prueba en modo incógnito.");
    } else {
      alert(`Error: ${error.message}`);
    }
    
  } finally {
    submitBtn.innerHTML = originalBtnText;
    submitBtn.disabled = false;
  }
});

function obtenerDatosFormulario() {
  const participantes = [];
  
  // Participante principal
  const nombre = document.getElementById('nombre').value.trim();
  const telefono = document.getElementById('telefono').value.trim();
  
  if (!nombre || !telefono) {
    throw new Error('Por favor completa todos los campos obligatorios');
  }
  
  participantes.push({ nombre, telefono });
  
  // Participantes adicionales
  const adicionales = document.querySelectorAll('.participante-adicional');
  adicionales.forEach((item, index) => {
    const nombreAdd = document.getElementById(`nombre-${index+1}`).value.trim();
    const telefonoAdd = document.getElementById(`telefono-${index+1}`).value.trim();
    
    if (nombreAdd && telefonoAdd) {
      participantes.push({ nombre: nombreAdd, telefono: telefonoAdd });
    }
  });
  
  return participantes;
}
}