AWS.config.region = 'us-east-1'; // Only region is needed in client code
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
  IdentityPoolId: 'us-east-1:7e8675ae-dbc4-4685-8620-81f78ae7ac20'
});

const s3 = new AWS.S3();
const bucketName = 'wed-fotos';

// Elementos del DOM
const fileInput = document.getElementById('file-input');
const uploadButton = document.getElementById('upload-button');
const gallery = document.getElementById('gallery');

// Cargar galería al iniciar
document.addEventListener('DOMContentLoaded', () => {
  loadGallery();
});

// Subir archivos a S3
uploadButton.addEventListener('click', async () => {
  const files = fileInput.files;
  
  if (files.length === 0) {
    alert('Selecciona al menos un archivo');
    return;
  }

  uploadButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Subiendo...';
  uploadButton.disabled = true;

  try {
    for (let file of files) {
      const fileType = file.type.split('/')[0]; // 'image' o 'video'
      const params = {
        Bucket: bucketName,
        Key: `${Date.now()}-${file.name}`,
        Body: file,
        ContentType: file.type
      };
      await s3.upload(params).promise();
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
  }
});

async function uploadFile(file) {
  // Add these to your S3 upload params
const params = {
  Bucket: bucketName,
  Key: `uploads/${Date.now()}-${encodeURIComponent(file.name)}`, // Safer filenames
  Body: file,
  ContentType: file.type,
  Metadata: {
    'uploaded-by': 'guest', // You might track who uploaded
    'upload-time': new Date().toISOString()
  }
};

try {
  const upload = s3.upload(params);
  
  upload.on('httpUploadProgress', (progress) => {
    const percentage = Math.round((progress.loaded / progress.total) * 100);
    console.log(`Upload progress: ${percentage}%`);
    // You could update a progress bar here
  });
  
    const data = await upload.promise();
    return true;
  } catch (error) {
    console.error('Upload error:', error);
    return false;
  }
}

// Enhanced network detection function
async function checkNetworkConnection() {
  try {
    // Modern browsers with Network Information API
    if (navigator.connection) {
      const connection = navigator.connection;
      const networkInfo = {
        isWifi: connection.effectiveType === 'wifi',
        isSlow: ['slow-2g', '2g'].includes(connection.effectiveType),
        type: connection.effectiveType,
        downlink: connection.downlink, // Mbps
        saveData: connection.saveData
      };
      
      console.log('Network info:', networkInfo);
      return networkInfo;
    }
    
    // Fallback for browsers without Network Information API
    console.warn('Network Information API not available, using fallback detection');
    return {
      isWifi: false, // Assume mobile data to be cautious
      isSlow: false,
      type: 'unknown'
    };
  } catch (error) {
    console.error('Network detection error:', error);
    return {
      isWifi: false,
      isSlow: false,
      type: 'error'
    };
  }
}

// Modified loadGallery function with better network handling
async function loadGallery() {
  try {
    // Show loading state
    gallery.innerHTML = `
      <div class="loading">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Cargando fotos...</p>
      </div>
    `;

    // Get network status
    const network = await checkNetworkConnection();
    console.log('Current network:', network);

    // Get gallery content
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

    // Calculate total size
    const totalSizeBytes = data.Contents.reduce((sum, item) => sum + item.Size, 0);
    const totalSizeMB = (totalSizeBytes / (1024 * 1024)).toFixed(1);

    // Check if we should proceed with loading
    if (!network.isWifi && totalSizeMB > 5) { // 5MB threshold
      const shouldProceed = await showNetworkWarning(totalSizeMB, data.Contents.length);
      if (!shouldProceed) {
        showLimitedGalleryOption();
        return;
      }
    }

    // Load full gallery
    renderGallery(data.Contents, network);
    
  } catch (error) {
    console.error('Error loading gallery:', error);
    showErrorState();
  }
}

// Show network warning dialog
function showNetworkWarning(totalSizeMB, itemCount) {
  return new Promise((resolve) => {
    const warningDiv = document.createElement('div');
    warningDiv.className = 'network-warning';
    warningDiv.innerHTML = `
      <div class="warning-content">
        <h3>Uso de Datos Móviles</h3>
        <p>Estás usando una conexión de datos móviles.</p>
        <p>La galería contiene ${itemCount} archivos (${totalSizeMB} MB).</p>
        <div class="warning-actions">
          <button id="load-anyway" class="gold-button">Cargar de todos modos</button>
          <button id="load-preview" class="gold-button outline">Ver solo vista previa</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(warningDiv);
    
    document.getElementById('load-anyway').addEventListener('click', () => {
      document.body.removeChild(warningDiv);
      resolve(true);
    });
    
    document.getElementById('load-preview').addEventListener('click', () => {
      document.body.removeChild(warningDiv);
      resolve(false);
    });
  });
}

// Render gallery based on network conditions
function renderGallery(items, network) {
  gallery.innerHTML = '';
  
  const fragment = document.createDocumentFragment();
  const loadFullMedia = network.isWifi || confirmMediaLoad;
  
  items.forEach(item => {
    const galleryItem = createGalleryItem(item, loadFullMedia);
    fragment.appendChild(galleryItem);
  });
  
  gallery.appendChild(fragment);
}

// Create individual gallery item with network-appropriate loading
function createGalleryItem(item, loadFullMedia) {
  const fileUrl = `https://${bucketName}.s3.amazonaws.com/${encodeURIComponent(item.Key)}`;
  const fileType = item.Key.split('.').pop().toLowerCase();
  const isVideo = ['mp4', 'mov', 'avi'].includes(fileType);
  const sizeMB = (item.Size / (1024 * 1024)).toFixed(1);
  
  const galleryItem = document.createElement('div');
  galleryItem.className = 'gallery-item';
  
  if (isVideo) {
    galleryItem.innerHTML = `
      <video ${loadFullMedia ? 'controls' : 'preload="none" poster="placeholder.jpg"'} 
             ${loadFullMedia ? `src="${fileUrl}"` : 'data-src="'+fileUrl+'"'}>
      </video>
      <span class="file-type">Video (${sizeMB} MB)</span>
    `;
  } else {
    galleryItem.innerHTML = `
      <img ${loadFullMedia ? `src="${fileUrl}"` : 'src="placeholder.jpg" data-src="'+fileUrl+'"'} 
           alt="Foto del evento" 
           loading="${loadFullMedia ? 'eager' : 'lazy'}">
      <span class="file-type">Foto (${sizeMB} MB)</span>
    `;
  }
  
  // Lazy load if needed
  if (!loadFullMedia) {
    galleryItem.addEventListener('click', () => loadFullQuality(galleryItem, fileUrl, isVideo));
  }
  
  return galleryItem;
}

// Add drag and drop functionality
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
    // Optional: show file names or count
  }
});

async function loadGallery() {
  try {
    // Show loading state
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
    
    // Sort by upload date (newest first)
    const sortedItems = data.Contents.sort((a, b) => 
      new Date(b.LastModified) - new Date(a.LastModified));
    
    // Create document fragment for better performance
    const fragment = document.createDocumentFragment();
    
    sortedItems.forEach(item => {
      const fileUrl = `https://${bucketName}.s3.amazonaws.com/${encodeURIComponent(item.Key)}`;
      const fileType = item.Key.split('.').pop().toLowerCase();
      const isVideo = ['mp4', 'mov', 'avi', 'webm'].includes(fileType);
      
      const galleryItem = document.createElement('div');
      galleryItem.className = 'gallery-item';
      
      // Lazy loading for better performance
      if (isVideo) {
        galleryItem.innerHTML = `
          <video controls preload="metadata">
            <source src="${fileUrl}" type="video/${fileType}">
          </video>
          <span class="file-type">Video</span>
        `;
      } else {
        galleryItem.innerHTML = `
          <img src="${fileUrl}" alt="Foto del evento" loading="lazy">
          <span class="file-type">Foto</span>
        `;
      }
      
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