// Inicializa Firebase
firebase.initializeApp(firebaseConfig);

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando...';
    submitBtn.disabled = true;
    
    try {
        await firebase.auth().signInWithEmailAndPassword(email, password);
        window.location.href = 'admin.html';
    } catch (error) {
        console.error("Error de autenticación:", error);
        alert("Credenciales incorrectas. Por favor intenta nuevamente.");
    } finally {
        submitBtn.innerHTML = originalBtnText;
        submitBtn.disabled = false;
    }
});