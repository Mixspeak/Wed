// Configuración AWS
AWS.config.region = 'us-east-1';
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
  IdentityPoolId: 'us-east-1:7e8675ae-dbc4-4685-8620-81f78ae7ac20'
});

const s3 = new AWS.S3();
const bucketName = 'wed-fotos';

// Elementos del DOM
const fileInput = document.getElementById('file-input');
const uploadButton = document.getElementById('upload-button');
const gallery = document.getElementById('gallery');
const filePreview = document.getElementById('file-preview');
const progressContainer = document.querySelector('.progress-container');
const progressFill = document.querySelector('.progress-fill');
const progressText = document.querySelector('.progress-text');

// Agregar elemento para mostrar el tiempo estimado
const progressTime = document.createElement('div');
progressTime.className = 'progress-time';
progressContainer.appendChild(progressTime);

// Variables para cálculo del tiempo estimado
let uploadStartTime;
let lastLoaded = 0;
let lastTime = 0;
let currentSpeed = 0;

// Cargar galería al iniciar
document.addEventListener('DOMContentLoaded', () => {
  loadGallery();
  setupFilePreview();
});

// Configurar previsualización de archivos
function setupFilePreview() {
  fileInput.addEventListener('change', function() {
    filePreview.innerHTML = '';
    
    if (this.files.length === 0) return;
    
    Array.from(this.files).forEach((file, index) => {
      const fileType = file.type.split('/')[0];
      const thumbnail = document.createElement('div');
      thumbnail.className = 'file-thumbnail';
      thumbnail.dataset.index = index;
      
      const fileName = file.name.length > 15 
        ? file.name.substring(0, 12) + '...' + file.name.split('.').pop()
        : file.name;
      
      if (fileType === 'image') {
        const reader = new FileReader();
        reader.onload = function(e) {
          thumbnail.innerHTML = `
            <img src="${e.target.result}" alt="Previsualización">
            <span class="file-name">${fileName}</span>
            <button class="remove-btn" data-index="${index}">×</button>
          `;
        };
        reader.readAsDataURL(file);
      } else if (file.type.includes('video')) {
        const videoURL = URL.createObjectURL(file);
        thumbnail.innerHTML = `
          <video src="${videoURL}" muted loop></video>
          <span class="file-name">${fileName}</span>
          <button class="remove-btn" data-index="${index}">×</button>
        `;
      } else {
        thumbnail.innerHTML = `
          <div class="file-icon"><i class="fas fa-file"></i></div>
          <span class="file-name">${fileName}</span>
          <button class="remove-btn" data-index="${index}">×</button>
        `;
      }
      
      filePreview.appendChild(thumbnail);
    });
  });
  
  // Manejar eliminación de archivos
  filePreview.addEventListener('click', function(e) {
    if (e.target.classList.contains('remove-btn')) {
      const index = e.target.dataset.index;
      removeFileFromList(index);
    }
  });
}

function removeFileFromList(index) {
  const dt = new DataTransfer();
  const files = Array.from(fileInput.files);
  
  files.splice(index, 1);
  
  files.forEach(file => dt.items.add(file));
  fileInput.files = dt.files;
  fileInput.dispatchEvent(new Event('change'));
}

// Subir archivos a S3 con barra de progreso y tiempo estimado
uploadButton.addEventListener('click', async () => {
  const files = fileInput.files;
  
  if (files.length === 0) {
    alert('Selecciona al menos un archivo');
    return;
  }

  uploadButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Subiendo...';
  uploadButton.disabled = true;
  
  // Mostrar barra de progreso
  progressContainer.style.display = 'block';
  progressFill.style.width = '0%';
  progressText.textContent = '0%';
  progressTime.textContent = 'Calculando tiempo restante...';

  // Inicializar variables de tiempo
  uploadStartTime = Date.now();
  lastLoaded = 0;
  lastTime = uploadStartTime;
  currentSpeed = 0;

  try {
    let uploadedCount = 0;
    const totalFiles = files.length;
    
    for (let i = 0; i < totalFiles; i++) {
      const file = files[i];
      const params = {
        Bucket: bucketName,
        Key: `${Date.now()}-${file.name}`,
        Body: file,
        ContentType: file.type
      };
      
      await s3.upload(params).on('httpUploadProgress', (progress) => {
        const now = Date.now();
        const timeElapsed = (now - lastTime) / 1000; // en segundos
        const loadedDiff = progress.loaded - lastLoaded;
        
        // Calcular velocidad actual (bytes/segundo)
        if (timeElapsed > 0) {
          currentSpeed = loadedDiff / timeElapsed;
          lastLoaded = progress.loaded;
          lastTime = now;
        }
        
        const percentage = Math.round((progress.loaded / progress.total) * 100);
        updateProgress(percentage, progress.loaded, progress.total);
      }).promise();
      
      uploadedCount++;
      const overallProgress = Math.round((uploadedCount / totalFiles) * 100);
      updateProgress(overallProgress);
    }
    
    alert('¡Archivos subidos exitosamente!');
    loadGallery();
  } catch (error) {
    console.error('Error al subir:', error);
    alert('Error al subir archivos');
  } finally {
    uploadButton.innerHTML = '<i class="fas fa-paper-plane"></i> Subir';
    uploadButton.disabled = false;
    fileInput.value = '';
    filePreview.innerHTML = '';
    progressContainer.style.display = 'none';
  }
});

function updateProgress(percent, loaded, total) {
  progressFill.style.width = `${percent}%`;
  progressText.textContent = `${percent}%`;
  
  if (percent < 30) {
    progressFill.style.background = '#ff5252';
  } else if (percent < 70) {
    progressFill.style.background = '#ffc107';
  } else {
    progressFill.style.background = '#4CAF50';
  }
  
  // Calcular tiempo restante solo si tenemos datos suficientes
  if (loaded && total && currentSpeed > 0) {
    const remainingBytes = total - loaded;
    const remainingSeconds = remainingBytes / currentSpeed;
    
    // Formatear el tiempo en un formato legible
    progressTime.textContent = formatTimeRemaining(remainingSeconds);
  }
}

function formatTimeRemaining(seconds) {
  if (seconds < 0) return 'Completando...';
  if (seconds < 1) return 'Casi listo...';
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  if (minutes > 0) {
    return `Tiempo restante: ~${minutes}m ${remainingSeconds}s`;
  } else {
    return `Tiempo restante: ~${remainingSeconds}s`;
  }
}

// Funciones de la galería
async function loadGallery() {
  try {
    gallery.innerHTML = `
      <div class="loading">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Cargando fotos...</p>
      </div>
    `;
    
    const params = { Bucket: bucketName };
    const data = await s3.listObjectsV2(params).promise();
    
    if (data.Contents.length === 0) {
      gallery.innerHTML = `
        <div class="gallery-placeholder">
          <i class="fas fa-images"></i>
          <p>No hay fotos aún. ¡Sé el primero en compartir!</p>
        </div>
      `;
      return;
    }

    gallery.innerHTML = '';
    
    const sortedItems = data.Contents.sort((a, b) => 
      new Date(b.LastModified) - new Date(a.LastModified));
    
    const fragment = document.createDocumentFragment();
    
    sortedItems.forEach(item => {
      const galleryItem = createGalleryItem(item, true);
      fragment.appendChild(galleryItem);
    });
    
    gallery.appendChild(fragment);
    
  } catch (error) {
    console.error('Error al cargar galería:', error);
    gallery.innerHTML = `
      <div class="error">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Error al cargar las fotos. Por favor intenta más tarde.</p>
      </div>
    `;
  }
}

function createGalleryItem(item, loadFullMedia) {
  const fileUrl = `https://${bucketName}.s3.amazonaws.com/${encodeURIComponent(item.Key)}`;
  const fileType = item.Key.split('.').pop().toLowerCase();
  const isVideo = ['mp4', 'mov', 'avi'].includes(fileType);
  const sizeMB = (item.Size / (1024 * 1024)).toFixed(1);
  
  const galleryItem = document.createElement('div');
  galleryItem.className = 'gallery-item';
  galleryItem.id = `item-${item.Key.replace(/[^a-zA-Z0-9]/g, '-')}`;
  
  const mediaContainer = document.createElement('div');
  mediaContainer.className = 'media-container';
  
  let mediaElement;
  
  if (isVideo) {
    mediaElement = document.createElement('video');
    mediaElement.setAttribute('controls', '');
    mediaElement.setAttribute('preload', 'metadata');
    mediaElement.src = fileUrl;
  } else {
    mediaElement = document.createElement('img');
    mediaElement.alt = "Foto del evento";
    mediaElement.loading = 'lazy';
    mediaElement.src = fileUrl;
  }
  
  mediaContainer.appendChild(mediaElement);
  galleryItem.appendChild(mediaContainer);
  
  const fileTypeSpan = document.createElement('span');
  fileTypeSpan.className = 'file-type';
  fileTypeSpan.textContent = `${isVideo ? 'Video' : 'Foto'} (${sizeMB} MB)`;
  galleryItem.appendChild(fileTypeSpan);
  
  galleryItem.addEventListener('click', function(e) {
    e.stopPropagation();
    
    if (isVideo && e.target.tagName === 'VIDEO' && e.target.controls) {
      return;
    }
    
    galleryItem.classList.toggle('expanded');
    
    if (isVideo) {
      if (galleryItem.classList.contains('expanded')) {
        mediaElement.play();
      } else {
        mediaElement.pause();
      }
    }
  });
  
  return galleryItem;
}

document.addEventListener('click', function() {
  const expandedItems = document.querySelectorAll('.gallery-item.expanded');
  expandedItems.forEach(item => {
    item.classList.remove('expanded');
    const video = item.querySelector('video');
    if (video) video.pause();
  });
});

// Drag and drop
const uploadBox = document.querySelector('.upload-box');

uploadBox.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadBox.classList.add('drag-over');
});

uploadBox.addEventListener('dragleave', () => {
  uploadBox.classList.remove('drag-over');
});

uploadBox.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadBox.classList.remove('drag-over');
  
  if (e.dataTransfer.files.length) {
    fileInput.files = e.dataTransfer.files;
    fileInput.dispatchEvent(new Event('change'));
  }
});