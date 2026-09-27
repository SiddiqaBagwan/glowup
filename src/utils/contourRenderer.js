/**
 * Realistic Facial Contour Renderer using HTML5 Canvas & Facial Geometry.
 * Provides subtle, natural cheekbone & jawline sculpting that preserves skin texture.
 */

import { hexToRgb } from './lipstickRenderer.js';
import { applyLightingToCanvas } from './lightingUtils.js';

/**
 * Draws cheek contour hollow under the cheekbone on one side of the face.
 */
function drawCheekContourSide(maskCtx, cheek, isLeft, width, height, strokeWidth, rgb) {
  if (!cheek || !cheek.hollow || cheek.hollow.length < 2) return;

  const pts = cheek.hollow.map((pt) => ({
    x: pt.x * width,
    y: pt.y * height
  }));

  // Start from near temple / preauricular, curving under cheekbone toward mouth corner
  maskCtx.save();
  maskCtx.beginPath();
  maskCtx.moveTo(pts[0].x, pts[0].y);

  for (let i = 1; i < pts.length; i++) {
    // Quadratic smoothing between points
    const prev = pts[i - 1];
    const curr = pts[i];
    const midX = (prev.x + curr.x) * 0.5;
    const midY = (prev.y + curr.y) * 0.5;
    maskCtx.quadraticCurveTo(prev.x, prev.y, midX, midY);
  }
  const lastPt = pts[pts.length - 1];
  maskCtx.lineTo(lastPt.x, lastPt.y);

  // Gradient along the stroke to taper off as it approaches mouth
  const startPt = pts[0];
  const grad = maskCtx.createLinearGradient(startPt.x, startPt.y, lastPt.x, lastPt.y);
  grad.addColorStop(0.0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.25)`);
  grad.addColorStop(0.3, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.95)`);
  grad.addColorStop(0.7, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.80)`);
  grad.addColorStop(1.0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.0)`);

  maskCtx.strokeStyle = grad;
  maskCtx.lineWidth = strokeWidth;
  maskCtx.lineCap = 'round';
  maskCtx.lineJoin = 'round';
  maskCtx.stroke();
  maskCtx.restore();
}

/**
 * Draws jawline contour shading under the mandibular edge.
 */
function drawJawContourSide(maskCtx, cheek, isLeft, width, height, strokeWidth, rgb) {
  if (!cheek || !cheek.jaw || cheek.jaw.length < 3) return;

  const pts = cheek.jaw.map((pt) => ({
    x: pt.x * width,
    y: pt.y * height
  }));

  maskCtx.save();
  maskCtx.beginPath();
  maskCtx.moveTo(pts[0].x, pts[0].y);

  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const curr = pts[i];
    const midX = (prev.x + curr.x) * 0.5;
    const midY = (prev.y + curr.y) * 0.5;
    maskCtx.quadraticCurveTo(prev.x, prev.y, midX, midY);
  }
  const last = pts[pts.length - 1];
  maskCtx.lineTo(last.x, last.y);

  const startPt = pts[0];
  const grad = maskCtx.createLinearGradient(startPt.x, startPt.y, last.x, last.y);
  grad.addColorStop(0.0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.40)`);
  grad.addColorStop(0.4, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.85)`);
  grad.addColorStop(0.85, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.50)`);
  grad.addColorStop(1.0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.0)`);

  maskCtx.strokeStyle = grad;
  maskCtx.lineWidth = strokeWidth * 0.8;
  maskCtx.lineCap = 'round';
  maskCtx.lineJoin = 'round';
  maskCtx.stroke();
  maskCtx.restore();
}

/**
 * Main Contour Renderer
 * 
 * @param {HTMLImageElement|HTMLCanvasElement} sourceImage
 * @param {Object} faceLandmarks - Face structure landmarks (rightCheek, leftCheek)
 * @param {string} shadeHex - Contour color hex (e.g. '#765847')
 * @param {number} intensity - 10 to 100
 * @param {Object} options - { isBefore, skipLighting, lighting }
 * @returns {HTMLCanvasElement}
 */
export function renderContourOnCanvas(
  sourceImage,
  faceLandmarks,
  shadeHex = '#765847',
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

  // Dynamic scale proportional to face width
  const rightTempleX = faceLandmarks.rightCheek?.temple?.x || 0.25;
  const leftTempleX = faceLandmarks.leftCheek?.temple?.x || 0.75;
  const faceSpan = Math.abs(leftTempleX - rightTempleX) * width;
  const strokeWidth = Math.max(14, Math.min(42, faceSpan * 0.085));
  const featherBlur = Math.max(8, Math.min(26, faceSpan * 0.055));

  // 2. Offscreen Mask Canvas with feathered blur
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = width;
  maskCanvas.height = height;
  const maskCtx = maskCanvas.getContext('2d');

  maskCtx.save();
  maskCtx.filter = `blur(${featherBlur}px)`;

  if (faceLandmarks.rightCheek) {
    drawCheekContourSide(maskCtx, faceLandmarks.rightCheek, false, width, height, strokeWidth, rgb);
    drawJawContourSide(maskCtx, faceLandmarks.rightCheek, false, width, height, strokeWidth, rgb);
  }

  if (faceLandmarks.leftCheek) {
    drawCheekContourSide(maskCtx, faceLandmarks.leftCheek, true, width, height, strokeWidth, rgb);
    drawJawContourSide(maskCtx, faceLandmarks.leftCheek, true, width, height, strokeWidth, rgb);
  }

  maskCtx.restore();

  // 3. Composite Pass 1: Multiply for realistic sculpted shadow depth
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.globalAlpha = Math.min(0.70, 0.12 + 0.45 * normInt);
  ctx.drawImage(maskCanvas, 0, 0);
  ctx.restore();

  // 4. Composite Pass 2: Soft-light for skin undertone fusion
  ctx.save();
  ctx.globalCompositeOperation = 'soft-light';
  ctx.globalAlpha = Math.min(0.50, 0.08 + 0.32 * normInt);
  ctx.drawImage(maskCanvas, 0, 0);
  ctx.restore();

  return canvas;
}
