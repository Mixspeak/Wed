// Configuración de AWS (reemplaza con tus credenciales)
//const AWS_CONFIG = {
//  region: '__AWS_REGION__',
//  accessKeyId: '__AWS_ACCESS_KEY_ID__',
//  secretAccessKey: '__AWS_SECRET_ACCESS_KEY__'
//};
// Frontend/app.js
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
  const params = {
    Bucket: 'wed-fotos',
    Key: `uploads/${Date.now()}-${file.name}`,
    Body: file,
    ContentType: file.type,
    // Remove ACL if using Bucket Owner Enforced
    // ACL: 'public-read' 
  };

  try {
    const data = await s3.upload(params).promise();
    console.log('Upload verified:', data.Location);
    return true;
  } catch (error) {
    console.error('Real upload error:', error);
    alert('Upload failed silently - check console');
    return false;
  }
}

// Cargar y mostrar archivos desde S3
async function loadGallery() {
  try {
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
    data.Contents.forEach(item => {
      const fileUrl = `https://${bucketName}.s3.amazonaws.com/${item.Key}`;
      const fileType = item.Key.split('.').pop().toLowerCase();
      const isVideo = ['mp4', 'mov', 'avi'].includes(fileType);
      
      const galleryItem = document.createElement('div');
      galleryItem.className = 'gallery-item';
      
      if (isVideo) {
        galleryItem.innerHTML = `
          <video controls>
            <source src="${fileUrl}" type="video/mp4">
          </video>
          <span class="file-type">Video</span>
        `;
      } else {
        galleryItem.innerHTML = `
          <img src="${fileUrl}" alt="Foto del evento">
          <span class="file-type">Foto</span>
        `;
      }
      
      gallery.appendChild(galleryItem);
    });
  } catch (error) {
    console.error('Error al cargar galería:', error);
  }
}