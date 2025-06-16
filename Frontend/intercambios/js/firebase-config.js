// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyD2yQFJGybiGa-sJEwJeHDSkxm6b21szhk",
  authDomain: "intercambios-navidenos.firebaseapp.com",
  projectId: "intercambios-navidenos",
  storageBucket: "intercambios-navidenos.firebasestorage.app",
  messagingSenderId: "453471770714",
  appId: "1:453471770714:web:506bde9accb046ae82a063"
};

// Inicializa Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
const storage = firebase.storage(); 