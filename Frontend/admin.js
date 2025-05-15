// Configuración de AWS
AWS.config.update({
    region: 'us-east-1',
    credentials: new AWS.CognitoIdentityCredentials({
        IdentityPoolId: 'us-east-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
    })
});

const s3 = new AWS.S3();
const bucketName = 'wed-fotos';
let currentContinuationToken = null;
let selectedFileToDelete = null;
let currentFilter = 'all';

// Elementos del DOM
const mediaGrid = document.getElementById('mediaGrid');
const loadingSpinner = document.getElementById('loadingSpinner');
const loadMoreBtn = document.getElementById('loadMoreBtn');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const filterPhotos = document.getElementById('filterPhotos');
const filterVideos = document.getElementById('filterVideos');
const filterAll = document.getElementById('filterAll');
const confirmModal = new bootstrap.Modal(document.getElementById('confirmModal'));
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

// Tipos de archivo permitidos
const FILE_TYPES = {
    IMAGE: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    VIDEO: ['mp4', 'mov', 'avi', 'webm']
};

// Cargar archivos iniciales
document.addEventListener('DOMContentLoaded', () => {
    loadFiles();
    
    // Event listeners
    loadMoreBtn.addEventListener('click', loadFiles);
    searchBtn.addEventListener('click', searchFiles);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchFiles();
    });
    
    filterPhotos.addEventListener('click', () => {
        currentFilter = 'photos';
        resetAndLoadFiles();
    });
    
    filterVideos.addEventListener('click', () => {
        currentFilter = 'videos';
        resetAndLoadFiles();
    });
    
    filterAll.addEventListener('click', () => {
        currentFilter = 'all';
        resetAndLoadFiles();
    });
    
    confirmDeleteBtn.addEventListener('click', deleteFile);
});

// Función para cargar archivos
async function loadFiles() {
    try {
        loadingSpinner.style.display = 'block';
        loadMoreBtn.style.display = 'none';
        
        const params = {
            Bucket: bucketName,
            MaxKeys: 20
        };
        
        if (currentContinuationToken) {
            params.ContinuationToken = currentContinuationToken;
        }
        
        const data = await s3.listObjectsV2(params).promise();
        
        if (data.Contents.length > 0) {
            displayFiles(data.Contents);
            
            if (data.IsTruncated) {
                currentContinuationToken = data.NextContinuationToken;
                loadMoreBtn.style.display = 'block';
            } else {
                currentContinuationToken = null;
            }
        } else {
            mediaGrid.innerHTML = '<div class="col-12 text-center py-4"><p>No se encontraron archivos.</p></div>';
        }
    } catch (error) {
        console.error('Error al cargar archivos:', error);
        mediaGrid.innerHTML = `<div class="col-12 text-center py-4 text-danger"><p>Error al cargar archivos: ${error.message}</p></div>`;
    } finally {
        loadingSpinner.style.display = 'none';
    }
}

// Función para buscar archivos
async function searchFiles() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    
    if (!searchTerm) {
        resetAndLoadFiles();
        return;
    }
    
    try {
        loadingSpinner.style.display = 'block';
        mediaGrid.innerHTML = '';
        
        const params = {
            Bucket: bucketName
        };
        
        const data = await s3.listObjectsV2(params).promise();
        
        if (data.Contents.length > 0) {
            const filteredFiles = data.Contents.filter(file => 
                file.Key.toLowerCase().includes(searchTerm)
                .filter(file => filterFile(file.Key));
            
            if (filteredFiles.length > 0) {
                displayFiles(filteredFiles);
            } else {
                mediaGrid.innerHTML = '<div class="col-12 text-center py-4"><p>No se encontraron archivos que coincidan con la búsqueda.</p></div>';
            }
        } else {
            mediaGrid.innerHTML = '<div class="col-12 text-center py-4"><p>No se encontraron archivos.</p></div>';
        }
    } catch (error) {
        console.error('Error al buscar archivos:', error);
        mediaGrid.innerHTML = `<div class="col-12 text-center py-4 text-danger"><p>Error al buscar archivos: ${error.message}</p></div>`;
    } finally {
        loadingSpinner.style.display = 'none';
    }
}

// Función para mostrar archivos
function displayFiles(files) {
    if (!currentContinuationToken) {
        mediaGrid.innerHTML = '';
    }
    
    files.filter(file => filterFile(file.Key)).forEach(file => {
        const fileExtension = file.Key.split('.').pop().toLowerCase();
        const isImage = FILE_TYPES.IMAGE.includes(fileExtension);
        const isVideo = FILE_TYPES.VIDEO.includes(fileExtension);
        
        const fileUrl = `https://${bucketName}.s3.amazonaws.com/${encodeURIComponent(file.Key)}`;
        const fileName = file.Key.split('/').pop();
        const fileSize = formatFileSize(file.Size);
        const uploadDate = new Date(file.LastModified).toLocaleString();
        
        const col = document.createElement('div');
        col.className = 'col-md-4 col-sm-6';
        
        col.innerHTML = `
            <div class="media-container">
                ${isImage ? 
                    `<img src="${fileUrl}" class="media-thumbnail" alt="${fileName}" loading="lazy">` : 
                    isVideo ? 
                    `<video class="media-thumbnail" controls>
                        <source src="${fileUrl}" type="video/${fileExtension}">
                        Tu navegador no soporta videos HTML5.
                    </video>` :
                    `<div class="text-center py-4">
                        <i class="bi bi-file-earmark" style="font-size: 3rem;"></i>
                        <p>${fileName}</p>
                    </div>`
                }
                <div class="mt-2">
                    <p class="mb-1"><strong>${fileName}</strong></p>
                    <small class="text-muted">${fileSize} • ${uploadDate}</small>
                </div>
                <button class="btn btn-sm btn-danger delete-btn" data-key="${file.Key}">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        `;
        
        mediaGrid.appendChild(col);
    });
    
    // Agregar event listeners a los botones de eliminar
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            selectedFileToDelete = e.currentTarget.getAttribute('data-key');
            confirmModal.show();
        });
    });
}

// Función para eliminar archivo
async function deleteFile() {
    if (!selectedFileToDelete) return;
    
    try {
        await s3.deleteObject({
            Bucket: bucketName,
            Key: selectedFileToDelete
        }).promise();
        
        // Eliminar el elemento del DOM
        document.querySelector(`.delete-btn[data-key="${selectedFileToDelete}"]`).closest('.col-md-4').remove();
        
        // Mostrar mensaje de éxito
        const alert = document.createElement('div');
        alert.className = 'alert alert-success alert-dismissible fade show';
        alert.innerHTML = `
            Archivo eliminado correctamente.
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        document.querySelector('.container').prepend(alert);
        
    } catch (error) {
        console.error('Error al eliminar archivo:', error);
        
        const alert = document.createElement('div');
        alert.className = 'alert alert-danger alert-dismissible fade show';
        alert.innerHTML = `
            Error al eliminar archivo: ${error.message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        document.querySelector('.container').prepend(alert);
    } finally {
        confirmModal.hide();
        selectedFileToDelete = null;
    }
}

// Función para resetear y recargar archivos
function resetAndLoadFiles() {
    currentContinuationToken = null;
    mediaGrid.innerHTML = '';
    loadFiles();
}

// Función para filtrar archivos según el tipo seleccionado
function filterFile(filename) {
    const extension = filename.split('.').pop().toLowerCase();
    
    switch (currentFilter) {
        case 'photos':
            return FILE_TYPES.IMAGE.includes(extension);
        case 'videos':
            return FILE_TYPES.VIDEO.includes(extension);
        default:
            return true;
    }
}

// Función para formatear tamaño de archivo
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
}