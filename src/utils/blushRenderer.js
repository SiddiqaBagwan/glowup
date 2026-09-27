/**
 * Realistic Blush Renderer using HTML5 Canvas & Facial Geometry.
 * Applies a soft, natural elliptical cheek flush that blends seamlessly with contour and skin.
 */

import { hexToRgb } from './lipstickRenderer.js';
import { applyLightingToCanvas } from './lightingUtils.js';

/**
 * Draws a single cheek's blush flush on the mask canvas.
 */
function drawSingleCheekBlush(maskCtx, cheek, isLeft, width, height, faceSpan, rgb) {
  if (!cheek || !cheek.apple) return;

  const apple = {
    x: cheek.apple.x * width,
    y: cheek.apple.y * height
  };

  const temple = cheek.temple ? {
    x: cheek.temple.x * width,
    y: cheek.temple.y * height
  } : {
    x: isLeft ? width : 0,
    y: apple.y - faceSpan * 0.15
  };

  // Angle from apple toward temple along cheekbone
  const angle = Math.atan2(temple.y - apple.y, temple.x - apple.x);

  const radiusX = Math.max(16, faceSpan * 0.135);
  const radiusY = Math.max(11, faceSpan * 0.095);

  maskCtx.save();
  maskCtx.translate(apple.x, apple.y);
  maskCtx.rotate(angle);

  // Soft elliptical gradient: strong in center, delicately fading outward
  const grad = maskCtx.createRadialGradient(0, 0, 0, 0, 0, radiusX);
  grad.addColorStop(0.0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.95)`);
  grad.addColorStop(0.35, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.70)`);
  grad.addColorStop(0.70, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.25)`);
  grad.addColorStop(1.0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.0)`);

  maskCtx.fillStyle = grad;
  maskCtx.beginPath();
  maskCtx.ellipse(0, 0, radiusX, radiusY, 0, 0, Math.PI * 2);
  maskCtx.fill();

  maskCtx.restore();
}

/**
 * Main Blush Renderer
 * 
 * @param {HTMLImageElement|HTMLCanvasElement} sourceImage
 * @param {Object} faceLandmarks - Face structure landmarks (rightCheek, leftCheek)
 * @param {string} shadeHex - Blush color hex (e.g. '#E8A0A8')
 * @param {number} intensity - 10 to 100
 * @param {Object} options - { isBefore, skipLighting, lighting, finish }
 * @returns {HTMLCanvasElement}
 */
export function renderBlushOnCanvas(
  sourceImage,
  faceLandmarks,
  shadeHex = '#E8A0A8',
  intensity = 50,
  options = {}
) {
  const width = sourceImage.naturalWidth || sourceImage.width;
  const height = sourceImage.naturalHeight || sourceImage.height;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // 1. Draw base photo with lighting normalization
  if (options.skipLighting) {
    ctx.drawImage(sourceImage, 0, 0, width, height);
  } else {
    applyLightingToCanvas(ctx, sourceImage, width, height, options.lighting || 'auto');
  }

  // If before comparison or no landmarks, return photo
  if (options.isBefore || !faceLandmarks || (!faceLandmarks.rightCheek && !faceLandmarks.leftCheek)) {
    return canvas;
  }

  const rgb = hexToRgb(shadeHex);
  const normInt = Math.max(0.1, Math.min(1.0, intensity / 100));
  const finish = options.finish || 'natural';

  const rightTempleX = faceLandmarks.rightCheek?.temple?.x || 0.25;
  const leftTempleX = faceLandmarks.leftCheek?.temple?.x || 0.75;
  const faceSpan = Math.abs(leftTempleX - rightTempleX) * width;
  const featherBlur = Math.max(8, Math.min(24, faceSpan * 0.050));

  // 2. Offscreen Mask Canvas
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = width;
  maskCanvas.height = height;
  const maskCtx = maskCanvas.getContext('2d');

  maskCtx.save();
  maskCtx.filter = `blur(${featherBlur}px)`;

  if (faceLandmarks.rightCheek) {
    drawSingleCheekBlush(maskCtx, faceLandmarks.rightCheek, false, width, height, faceSpan, rgb);
  }

  if (faceLandmarks.leftCheek) {
    drawSingleCheekBlush(maskCtx, faceLandmarks.leftCheek, true, width, height, faceSpan, rgb);
  }

  maskCtx.restore();

  // 3. Composite Pass 1: Soft-light for natural, skin-diffused flush
  ctx.save();
  ctx.globalCompositeOperation = 'soft-light';
  ctx.globalAlpha = Math.min(0.85, 0.25 + 0.55 * normInt);
  ctx.drawImage(maskCanvas, 0, 0);
  ctx.restore();

  // 4. Composite Pass 2: Source-over for clear chromatic tone
  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = Math.min(0.40, 0.06 + 0.26 * normInt);
  ctx.drawImage(maskCanvas, 0, 0);
  ctx.restore();

  // 5. Optional Soft Glow finish: delicate cheekbone radiance
  if (finish === 'glow') {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.20 * normInt;

    ['rightCheek', 'leftCheek'].forEach((cheekKey) => {
      const cheek = faceLandmarks[cheekKey];
      if (!cheek?.zygomaticPeak) return;
      const peakX = cheek.zygomaticPeak.x * width;
      const peakY = cheek.zygomaticPeak.y * height;
      const glowR = faceSpan * 0.08;

      const glowGrad = ctx.createRadialGradient(peakX, peakY, 0, peakX, peakY, glowR);
      glowGrad.addColorStop(0.0, 'rgba(255, 248, 240, 0.65)');
      glowGrad.addColorStop(0.5, 'rgba(255, 235, 220, 0.25)');
      glowGrad.addColorStop(1.0, 'rgba(255, 235, 220, 0.0)');

      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(peakX, peakY, glowR, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  }

  return canvas;
}
