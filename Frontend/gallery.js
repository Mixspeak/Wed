// First verify AWS and Amplify are loaded
if (typeof AWS === 'undefined' || typeof Amplify === 'undefined') {
  console.error('AWS SDK or Amplify not loaded!');
  document.body.innerHTML = `
    <div style="color: red; padding: 20px;">
      <h2>Loading Error</h2>
      <p>Failed to load required resources. Please:</p>
      <ol>
        <li>Refresh the page</li>
        <li>Check your internet connection</li>
        <li>Try a different browser</li>
      </ol>
    </div>
  `;
} else {
  // Configuration - REPLACE WITH YOUR ACTUAL VALUES
  const config = {
    region: 'us-east-1',
    userPoolId: 'us-east-1_nSY2Zks8d',
    userPoolWebClientId: '8087ck55rluaqvde5u2qt42b2', // Get from Cognito Console
    identityPoolId: 'us-east-1:dd6c356c-7255-408a-9e13-6e6eafe75b41'
  };

  // Initialize Amplify
  try {
    Amplify.configure({ Auth: config });
    
    // Initialize AWS Credentials
    AWS.config.update({
      region: config.region,
      credentials: new AWS.CognitoIdentityCredentials({
        IdentityPoolId: config.identityPoolId,
        Logins: {} // Empty for unauthenticated access
      })
    });

    // Verify credentials
    AWS.config.credentials.get(function(err) {
      if (err) {
        console.error("Error getting credentials:", err);
        showError("Failed to initialize. Please refresh.");
      } else {
        console.log("Successfully initialized!");
        // Your application code here
      }
    });
  } catch (error) {
    console.error("Initialization error:", error);
    showError("Application error. Please try again later.");
  }
}

function showError(message) {
  const errorDiv = document.createElement('div');
  errorDiv.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: #ffebee;
    color: #c62828;
    padding: 15px;
    text-align: center;
    z-index: 1000;
  `;
  errorDiv.textContent = message;
  document.body.prepend(errorDiv);
}

// DOM elements
const fileInput = document.getElementById('file-input');
const uploadButton = document.getElementById('upload-button');
const gallery = document.getElementById('gallery');

// Initialize S3 client
const s3 = new AWS.S3();
const bucketName = 'wed-fotos';

// First: Refresh AWS credentials
AWS.config.credentials.get(function(err) {
  if (err) {
    console.error("Error getting credentials:", err);
    showError("Error initializing gallery. Please refresh the page.");
    return;
  }
  // Credentials loaded successfully
  loadGallery();
});

// Load gallery function
async function loadGallery() {
  try {
    gallery.innerHTML = '<div class="loading">Loading gallery...</div>';
    
    const data = await s3.listObjectsV2({ 
      Bucket: bucketName,
      Prefix: 'uploads/' // Only show files in uploads folder
    }).promise();
    
    if (!data.Contents || data.Contents.length === 0) {
      gallery.innerHTML = `
        <div class="empty-gallery">
          <i class="fas fa-images"></i>
          <p>No photos yet. Be the first to upload!</p>
        </div>
      `;
      return;
    }

    gallery.innerHTML = data.Contents.map(item => {
      const fileUrl = `https://${bucketName}.s3.amazonaws.com/${item.Key}`;
      const isImage = item.Key.match(/\.(jpg|jpeg|png|gif)$/i);
      
      return `
        <div class="gallery-item">
          ${isImage ? 
            `<img src="${fileUrl}" alt="Gallery photo">` : 
            `<video controls>
              <source src="${fileUrl}" type="video/mp4">
            </video>`
          }
          <span class="file-type">${isImage ? 'Photo' : 'Video'}</span>
        </div>
      `;
    }).join('');

  } catch (error) {
    console.error("Gallery load error:", error);
    showError("Error loading gallery. Please try again later.");
  }
}

// Upload function
uploadButton.addEventListener('click', async () => {
  const files = fileInput.files;
  if (files.length === 0) {
    alert('Please select at least one file');
    return;
  }

  uploadButton.disabled = true;
  uploadButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';

  try {
    for (let file of files) {
      const fileName = `uploads/${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
      await s3.upload({
        Bucket: bucketName,
        Key: fileName,
        Body: file,
        ContentType: file.type
      }).promise();
    }
    alert('Files uploaded successfully!');
    loadGallery();
  } catch (error) {
    console.error("Upload error:", error);
    alert('Error uploading files. Please check console for details.');
  } finally {
    uploadButton.disabled = false;
    uploadButton.innerHTML = '<i class="fas fa-paper-plane"></i> Upload';
    fileInput.value = '';
  }
});

// Helper function to show errors
function showError(message) {
  gallery.innerHTML = `
    <div class="error">
      <i class="fas fa-exclamation-triangle"></i>
      <p>${message}</p>
    </div>
  `;
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  // Additional initialization if needed
});