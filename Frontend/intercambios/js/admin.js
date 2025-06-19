document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticación
    firebase.auth().onAuthStateChanged(user => {
        if (!user) {
            window.location.href = 'login.html';
        } else {
            initAdminPanel();
        }
    });
});

async function initAdminPanel() {
    // Cargar estado de registros
    const configRef = db.collection('config').doc('intercambio');
    const configDoc = await configRef.get();
    
    if (configDoc.exists) {
        document.getElementById('cerrar-registros').checked = configDoc.data().registrosCerrados || false;
    }
    
    // Manejar cierre de registros
    document.getElementById('cerrar-registros').addEventListener('change', async function() {
        await configRef.set({ registrosCerrados: this.checked }, { merge: true });
        alert(`Registros ${this.checked ? 'cerrados' : 'abiertos'} correctamente`);
    });
    
    // Cargar participantes
    await cargarParticipantes();
    
    // Manejar sorteo
    document.getElementById('realizar-sorteo').addEventListener('click', realizarSorteo);
    
    // Manejar envío de resultados
    document.getElementById('enviar-resultados').addEventListener('click', enviarResultadosWhatsApp);
}

async function cargarParticipantes() {
    const querySnapshot = await db.collection('participantes').get();
    const lista = document.getElementById('lista-participantes');
    
    if (querySnapshot.empty) {
        lista.innerHTML = '<p>No hay participantes registrados aún.</p>';
        return;
    }
    
    let html = '<ul>';
    querySnapshot.forEach(doc => {
        const data = doc.data();
        html += `<li>${data.nombre} - ${data.telefono}</li>`;
    });
    html += '</ul>';
    html += `<p>Total: ${querySnapshot.size} participantes</p>`;
    
    lista.innerHTML = html;
}

async function realizarSorteo() {
    const querySnapshot = await db.collection('participantes').get();
    const participantes = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    if (participantes.length < 2) {
        alert('Se necesitan al menos 2 participantes para realizar el sorteo');
        return;
    }
    
    // Mezclar participantes
    let asignaciones = shuffleArray([...participantes]);
    
    // Asegurar que nadie se tenga a sí mismo
    for (let i = 0; i < participantes.length; i++) {
        if (participantes[i].nombre === asignaciones[i].nombre) {
            const j = (i === participantes.length - 1) ? 0 : i + 1;
            [asignaciones[i], asignaciones[j]] = [asignaciones[j], asignaciones[i]];
        }
    }
    
    // Guardar resultados
    const batch = db.batch();
    const resultados = [];
    
    for (let i = 0; i < participantes.length; i++) {
        const resultado = {
            participante: participantes[i].nombre,
            telefono: participantes[i].telefono,
            asignado: asignaciones[i].nombre,
            fechaSorteo: new Date()
        };
        
        resultados.push(resultado);
        batch.set(db.collection('resultados').doc(), resultado);
    }
    
    await batch.commit();
    mostrarResultados(resultados);
}

function mostrarResultados(resultados) {
    const contenedor = document.getElementById('resultados-sorteo');
    let html = '<table><tr><th>Participante</th><th>Le toca regalar a</th></tr>';
    
    resultados.forEach(item => {
        html += `<tr><td>${item.participante}</td><td>${item.asignado}</td></tr>`;
    });
    
    html += '</table>';
    contenedor.innerHTML = html;
}

async function enviarResultadosWhatsApp() {
    const querySnapshot = await db.collection('resultados').get();
    
    if (querySnapshot.empty) {
        alert('Primero debes realizar el sorteo');
        return;
    }
    
    querySnapshot.forEach(doc => {
        const resultado = doc.data();
        const mensaje = `¡Hola ${resultado.participante}! 🎄\n\nPara el intercambio navideño, te ha tocado regalarle a: *${resultado.asignado}*.\n\n¡Felices fiestas! 🎁`;
        const urlWhatsApp = `https://wa.me/${resultado.telefono}?text=${encodeURIComponent(mensaje)}`;
        
        // Abrir en nueva pestaña
        window.open(urlWhatsApp, '_blank');
    });
    
    alert('Mensajes preparados para enviar por WhatsApp');
}

// Función para mezclar array (Fisher-Yates)
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}