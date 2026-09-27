/**
 * Lightweight Lighting Normalization & Adjustment for Selfies.
 * Adapts exposure, contrast, and color temperature without complex server dependencies.
 */

/**
 * Analyzes average image luminance to determine auto-normalization parameters.
 */
export function analyzeImageLuminance(sourceImage) {
  try {
    const sampleCanvas = document.createElement('canvas');
    sampleCanvas.width = 100;
    sampleCanvas.height = 100;
    const sampleCtx = sampleCanvas.getContext('2d');
    sampleCtx.drawImage(sourceImage, 0, 0, 100, 100);

    const imgData = sampleCtx.getImageData(0, 0, 100, 100).data;
    let totalLuminance = 0;
    const totalPixels = 100 * 100;

    for (let i = 0; i < imgData.length; i += 4) {
      const r = imgData[i];
      const g = imgData[i + 1];
      const b = imgData[i + 2];
      // Standard perceived luminance formula
      totalLuminance += 0.299 * r + 0.587 * g + 0.114 * b;
    }

    const avgLuminance = totalLuminance / totalPixels;
    return avgLuminance;
  } catch (err) {
    console.warn('Luminance analysis fallback:', err);
    return 128; // Default neutral midtone
  }
}

/**
 * Applies lighting preset normalization onto a canvas.
 * 
 * @param {CanvasRenderingContext2D} ctx - Target canvas context
 * @param {HTMLImageElement|HTMLCanvasElement} sourceImage - The raw source photo
 * @param {number} width - Output width
 * @param {number} height - Output height
 * @param {string} lightingPreset - 'auto' | 'natural' | 'soft' | 'warm' | 'cool'
 */
export function applyLightingToCanvas(ctx, sourceImage, width, height, lightingPreset = 'auto') {
  ctx.save();

  let filterString = 'none';
  let tintColor = null;
  let tintAlpha = 0;

  switch (lightingPreset) {
    case 'auto': {
      const avgLum = analyzeImageLuminance(sourceImage);
      // Auto-exposure adjustment based on detected ambient light
      if (avgLum < 90) {
        // Dim/underexposed selfie -> boost exposure and contrast
        const boost = Math.min(1.3, 1 + (90 - avgLum) / 180);
        filterString = `brightness(${boost.toFixed(2)}) contrast(1.06) saturate(1.04)`;
      } else if (avgLum > 185) {
        // Harsh/overexposed selfie -> tone down highlight clipping
        filterString = 'brightness(0.92) contrast(1.05) saturate(1.02)';
      } else {
        // Balanced standard selfie -> gentle portrait pop
        filterString = 'brightness(1.04) contrast(1.03) saturate(1.03)';
      }
      break;
    }

    case 'natural':
      // True daylight neutral reproduction
      filterString = 'brightness(1.0) contrast(1.01) saturate(1.0)';
      break;

    case 'soft':
      // Flattering diffused glow
      filterString = 'brightness(1.06) contrast(0.95) saturate(0.98)';
      break;

    case 'warm':
      // Golden hour warm sunlight
      filterString = 'brightness(1.03) contrast(1.02) saturate(1.06)';
      tintColor = '#FFE8D6';
      tintAlpha = 0.18;
      break;

    case 'cool':
      // Clean modern studio daylight
      filterString = 'brightness(1.02) contrast(1.04) saturate(0.96)';
      tintColor = '#DCE9FF';
      tintAlpha = 0.14;
      break;

    default:
      filterString = 'none';
  }

  // Draw base photo with CSS filters
  ctx.filter = filterString;
  ctx.drawImage(sourceImage, 0, 0, width, height);
  ctx.filter = 'none';

  // Apply subtle temperature tint if warm/cool
  if (tintColor && tintAlpha > 0) {
    ctx.save();
    ctx.globalCompositeOperation = 'soft-light';
    ctx.globalAlpha = tintAlpha;
    ctx.fillStyle = tintColor;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  ctx.restore();
}
