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
  

  document.getElementById('rsvp-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // 1. Recolectar datos del formulario
    const nombre = document.getElementById('nombre').value;
    const email = document.getElementById('email').value;
    const asistentes = document.getElementById('asistentes').value;
    const mensaje = document.getElementById('mensaje').value;
    
    // 2. Configurar estado de carga
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
    submitBtn.disabled = true;
  
    try {
      // 3. Generar ID único y datos para el QR
      const confirmationId = generateUniqueId();
      const qrData = JSON.stringify({  // <- Definimos qrData aquí
        id: confirmationId,
        nombre: nombre,
        email: email,
        valido: false,
        fecha: new Date().toISOString()
      });
  
      // 4. Guardar en Firestore (asegúrate de tener db definido)
      await db.collection('confirmaciones').doc(confirmationId).set({
        nombre: nombre,
        email: email,
        asistentes: asistentes,
        mensaje: mensaje,
        fecha: firebase.firestore.FieldValue.serverTimestamp(),
        qrData: qrData,
        valido: false
      });
  
      // 5. Mostrar sección QR
      const qrContainer = document.getElementById('qr-container');
      qrContainer.style.display = 'block';
  
      // 6. Generar QR
      const qrCanvas = await generateQRCode('qr-code', qrData);
      
      if (qrCanvas) {
        // 7. Configurar descarga del QR
        document.getElementById('download-qr').onclick = () => {
          const link = document.createElement('a');
          link.download = `confirmacion-${nombre.replace(/\s+/g, '_')}.png`;
          link.href = qrCanvas.toDataURL('image/png');
          link.click();
        };
        
        // 8. Scroll suave al QR
        qrContainer.scrollIntoView({ behavior: 'smooth' });
      }
  
    } catch (error) {
      console.error("Error en el proceso:", error);
      alert("Ocurrió un error al procesar tu confirmación. Por favor intenta nuevamente.");
    } finally {
      // 9. Restaurar botón
      submitBtn.innerHTML = originalBtnText;
      submitBtn.disabled = false;
    }
  });
  
  // Función para generar QR (asegúrate de tenerla definida)
  async function generateQRCode(containerId, data) {
    return new Promise((resolve) => {
      const container = document.getElementById(containerId);
      if (!container) {
        console.error(`Contenedor QR no encontrado: ${containerId}`);
        return resolve(null);
      }
  
      container.innerHTML = '<canvas id="qr-canvas"></canvas>';
      const canvas = document.getElementById('qr-canvas');
  
      QRCode.toCanvas(canvas, data, { width: 200 }, (error) => {
        if (error) {
          console.error("Error generando QR:", error);
          container.innerHTML = '<p class="error">Error al generar código QR</p>';
          resolve(null);
        } else {
          resolve(canvas);
        }
      });
    });
  }
  
  // Función para generar ID único (asegúrate de tenerla)
  function generateUniqueId() {
    return 'xxxx-xxxx-4xxx-yxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }