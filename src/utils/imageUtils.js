/**
 * Utility functions for image processing, resizing, and sample images.
 */

// Elegant default sample portrait for testing without uploading a personal photo
export const SAMPLE_SELFIE_URL = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80';

/**
 * Loads an image from a URL or data URL and returns an HTMLImageElement
 */
export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(new Error('Failed to load image.'));
    img.src = src;
  });
}

/**
 * Normalizes and downsizes an image file to a maximum dimension
 * to ensure fast canvas rendering and smooth AI/CV processing.
 */
export async function processUploadedFile(file, maxDimension = 1000) {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please select a valid image file (JPEG, PNG, WEBP).');
  }

  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => reject(new Error('Error reading image file.'));
    reader.readAsDataURL(file);
  });

  const img = await loadImage(dataUrl);

  let width = img.naturalWidth || img.width;
  let height = img.naturalHeight || img.height;

  if (width > maxDimension || height > maxDimension) {
    if (width > height) {
      height = Math.round((height * maxDimension) / width);
      width = maxDimension;
    } else {
      width = Math.round((width * maxDimension) / height);
      height = maxDimension;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, width, height);

  const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.92);

  return {
    dataUrl: optimizedDataUrl,
    width,
    height
  };
}
