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
  
  // Generar ID único
  function generateUniqueId() {
    return 'xxxx-xxxx-xxxx-xxxx'.replace(/[x]/g, function() {
      return Math.floor(Math.random() * 16).toString(16);
    });
  }
  
  document.getElementById('rsvp-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const nombre = document.getElementById('nombre').value;
    const email = document.getElementById('email').value;
    const asistentes = document.getElementById('asistentes').value;
    const mensaje = document.getElementById('mensaje').value;
    
    // Generar ID único y código QR
    const confirmationId = generateUniqueId();
    const qrData = JSON.stringify({
      id: confirmationId,
      nombre: nombre,
      email: email,
      valido: false // El admin lo activará después
    });
    
    try {
      // Guardar en Firestore
      await db.collection('confirmaciones').doc(confirmationId).set({
        nombre,
        email,
        asistentes,
        mensaje,
        fecha: new Date(),
        confirmado: true,
        qrData,
        valido: false // El admin debe activarlo
      });
      
      // Generar QR
      const qrContainer = document.getElementById('qr-code');
      qrContainer.innerHTML = '';
      QRCode.toCanvas(qrContainer, qrData, { width: 200 }, (error) => {
        if (error) console.error(error);
      });
      
      // Mostrar sección QR
      document.getElementById('qr-container').style.display = 'block';
      
      // Botón de descarga
      document.getElementById('download-qr').addEventListener('click', () => {
        const canvas = qrContainer.querySelector('canvas');
        const link = document.createElement('a');
        link.download = `confirmacion-${nombre}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      });
      
      // Scroll a QR
      qrContainer.scrollIntoView({ behavior: 'smooth' });
      
    } catch (error) {
      console.error("Error al confirmar:", error);
      alert("Ocurrió un error al confirmar. Por favor intenta más tarde.");
    }
  });