const fs = require('fs');
const path = require('path');
const { cloudinary, isCloudinaryConfigured } = require('../config/cloudinary');

/**
 * Upload an image file from user device to Cloudinary (or local server fallback)
 * @param {string} filePath - Absolute path to local temporary file
 * @param {string} folder - Target folder (e.g. 'cloth_shop/products')
 * @returns {Promise<{ public_id: string, url: string }>}
 */
const uploadToCloudinary = async (filePath, folder = 'cloth_shop/products') => {
  if (isCloudinaryConfigured()) {
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: folder,
        resource_type: 'image',
        transformation: [
          { quality: 'auto:good' },
          { fetch_format: 'auto' },
        ],
      });

      // Remove local temp file after successful Cloudinary upload
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      return {
        public_id: result.public_id,
        url: result.secure_url,
      };
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      // Fallback to local storage if Cloudinary upload failed
      return handleLocalStorageFallback(filePath);
    }
  } else {
    // Zero-friction local development fallback
    return handleLocalStorageFallback(filePath);
  }
};

/**
 * Upload multiple images from device
 */
const uploadMultipleToCloudinary = async (files, folder = 'cloth_shop/products') => {
  const uploadPromises = files.map((file) => uploadToCloudinary(file.path, folder));
  return await Promise.all(uploadPromises);
};

/**
 * Delete image by public_id from Cloudinary or local disk
 */
const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return;

  if (publicId.startsWith('local_')) {
    // Delete from local uploads folder
    const filename = publicId.replace('local_', '');
    const localPath = path.join(__dirname, '..', 'uploads', filename);
    if (fs.existsSync(localPath)) {
      try {
        fs.unlinkSync(localPath);
      } catch (err) {
        console.warn('Failed to delete local image:', err.message);
      }
    }
    return { result: 'ok' };
  }

  if (isCloudinaryConfigured()) {
    try {
      return await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.warn('Error deleting Cloudinary image:', error.message);
      return null;
    }
  }
};

const handleLocalStorageFallback = (filePath) => {
  const filename = path.basename(filePath);
  // Keep the file in uploads/ directory so Express can serve it statically
  const publicUrl = `/uploads/${filename}`;
  return {
    public_id: `local_${filename}`,
    url: publicUrl,
  };
};

module.exports = {
  uploadToCloudinary,
  uploadMultipleToCloudinary,
  deleteFromCloudinary,
};
