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

// Add this function to check network type
function checkNetworkConnection() {
  // Note: This will only work in browsers that support the Network Information API
  // (primarily Chrome/Edge on Android). For other browsers, we'll assume mobile data.
  if (navigator.connection) {
    const connection = navigator.connection;
    return {
      isWifi: connection.effectiveType === 'wifi',
      isSlow: connection.effectiveType === 'slow-2g' || 
              connection.effectiveType === '2g' ||
              connection.saveData,
      type: connection.effectiveType
    };
  }
  // Fallback for browsers that don't support the API
  return {
    isWifi: false,
    isSlow: false,
    type: 'unknown'
  };
}

// Modified loadGallery function with network awareness
async function loadGallery() {
  try {
    // Show loading state
    gallery.innerHTML = `
      <div class="loading">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Cargando fotos...</p>
      </div>
    `;

    // First get the list of files with sizes
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

    // Check network status
    const network = checkNetworkConnection();
    
    if (!network.isWifi) {
      // Ask for confirmation on mobile data
      const shouldLoad = confirm(
        `Estás usando ${network.type === 'unknown' ? 'datos móviles' : network.type}.\n\n` +
        `La galería contiene ${data.Contents.length} archivos (${totalSizeMB} MB).\n` +
        `¿Deseas cargar las fotos ahora?`
      );
      
      if (!shouldLoad) {
        gallery.innerHTML = `
          <div class="gallery-placeholder">
            <i class="fas fa-mobile-alt"></i>
            <p>Carga de fotos cancelada para ahorrar datos.</p>
            <button class="gold-button" id="retry-load">Cargar de todos modos</button>
          </div>
        `;
        document.getElementById('retry-load').addEventListener('click', loadGallery);
        return;
      }
    }

    // If wifi or user confirmed, proceed with loading
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
      
      // For mobile data, use lazy loading and lower quality if possible
      if (isVideo) {
        galleryItem.innerHTML = `
          <video controls preload="${network.isWifi ? 'auto' : 'metadata'}" ${!network.isWifi ? 'poster="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="' : ''}>
            <source src="${fileUrl}" type="video/${fileType}">
          </video>
          <span class="file-type">Video (${(item.Size / (1024 * 1024)).toFixed(1)} MB)</span>
        `;
      } else {
        galleryItem.innerHTML = `
          <img 
            src="${fileUrl}" 
            alt="Foto del evento" 
            loading="lazy"
            ${!network.isWifi ? 'decoding="async"' : ''}
          >
          <span class="file-type">Foto (${(item.Size / (1024 * 1024)).toFixed(1)} MB)</span>
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

// Add network change listener to update behavior if connection changes
if (navigator.connection) {
  navigator.connection.addEventListener('change', () => {
    console.log('Network changed to:', navigator.connection.effectiveType);
    // You could reload with new settings if desired
  });
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