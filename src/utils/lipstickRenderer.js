/**
 * Realistic Lipstick Renderer using Perceptual CIELAB Color Space.
 * Accurately reproduces target lipstick shades while preserving natural
 * lip texture, creases, lighting depth, and specular highlights.
 */

import { applyLightingToCanvas } from './lightingUtils.js';

export function hexToRgb(hex) {
  const cleanHex = hex.replace('#', '');
  const bigint = parseInt(cleanHex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return { r, g, b };
}

// ─── sRGB <-> Linear Conversions ──────────────────────────────────────────────
function srgbToLinear(c) {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function linearToSrgb(v) {
  const c = v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
  return Math.max(0, Math.min(255, Math.round(c * 255)));
}

/**
 * sRGB [0..255] to CIELAB D65 [L*, a*, b*]
 */
export function rgbToLab(r, g, b) {
  const lr = srgbToLinear(r);
  const lg = srgbToLinear(g);
  const lb = srgbToLinear(b);

  // Standard D65 illuminant
  const x = (lr * 0.4124564 + lg * 0.3575761 + lb * 0.1804375) / 0.95047;
  const y = (lr * 0.2126729 + lg * 0.7151522 + lb * 0.0721750) / 1.00000;
  const z = (lr * 0.0193339 + lg * 0.1191920 + lb * 0.9503041) / 1.08883;

  const fx = x > 0.008856 ? Math.cbrt(x) : (7.787 * x) + (16 / 116);
  const fy = y > 0.008856 ? Math.cbrt(y) : (7.787 * y) + (16 / 116);
  const fz = z > 0.008856 ? Math.cbrt(z) : (7.787 * z) + (16 / 116);

  const L = (116 * fy) - 16;
  const a = 500 * (fx - fy);
  const bVal = 200 * (fy - fz);

  return [L, a, bVal];
}

/**
 * CIELAB D65 [L*, a*, b*] to sRGB [0..255]
 */
export function labToRgb(L, a, bVal) {
  const fy = (L + 16) / 116;
  const fx = a / 500 + fy;
  const fz = fy - bVal / 200;

  const fx3 = fx * fx * fx;
  const fy3 = fy * fy * fy;
  const fz3 = fz * fz * fz;

  const x = (fx3 > 0.008856 ? fx3 : (fx - 16 / 116) / 7.787) * 0.95047;
  const y = (fy3 > 0.008856 ? fy3 : (fy - 16 / 116) / 7.787) * 1.00000;
  const z = (fz3 > 0.008856 ? fz3 : (fz - 16 / 116) / 7.787) * 1.08883;

  const lr = x *  3.2404542 + y * -1.5371385 + z * -0.4985314;
  const lg = x * -0.9692660 + y *  1.8760108 + z *  0.0415560;
  const lb = x *  0.0556434 + y * -0.2040259 + z *  1.0572252;

  return [linearToSrgb(lr), linearToSrgb(lg), linearToSrgb(lb)];
}

/**
 * Builds a path for outer and inner lip boundaries with even-odd filling
 * so that teeth/inner mouth and external skin are never colored.
 */
function traceLipPath(ctx, outerPoints, innerPoints, width, height) {
  ctx.beginPath();

  if (outerPoints && outerPoints.length > 0) {
    ctx.moveTo(outerPoints[0].x * width, outerPoints[0].y * height);
    for (let i = 1; i < outerPoints.length; i++) {
      ctx.lineTo(outerPoints[i].x * width, outerPoints[i].y * height);
    }
    ctx.closePath();
  }

  // Inner contour traced as a hole
  if (innerPoints && innerPoints.length > 0) {
    ctx.moveTo(innerPoints[0].x * width, innerPoints[0].y * height);
    for (let i = innerPoints.length - 1; i >= 0; i--) {
      ctx.lineTo(innerPoints[i].x * width, innerPoints[i].y * height);
    }
    ctx.closePath();
  }
}

/**
 * Renders realistic lipstick onto an image using facial lip landmarks.
 * 
 * Uses CIELAB perceptual color transformation to shift chromaticity (a*, b*)
 * faithfully towards target shade HEX while preserving original lip lightness
 * variations, natural texture, creases, and finish-specific highlights.
 * 
 * @param {HTMLImageElement|HTMLCanvasElement} sourceImage - The base portrait image
 * @param {Object} lipLandmarks - Detected lip landmarks
 * @param {string} shadeHex - Lipstick hex color (e.g. '#C5556A')
 * @param {number} intensity - 10 to 100
 * @param {Object} options - { finish: 'satin'|'matte'|'gloss', lighting: 'auto'|'natural'|'soft'|'warm'|'cool', isBefore: boolean }
 * @returns {HTMLCanvasElement} Canvas containing the rendered portrait
 */
export function renderLipstickOnCanvas(
  sourceImage,
  lipLandmarks,
  shadeHex = '#C87F78',
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

  // If before comparison or no landmarks, return photo with lighting adjustment
  if (options.isBefore || !lipLandmarks || !lipLandmarks.outerContour || lipLandmarks.outerContour.length < 3) {
    return canvas;
  }

  const { outerContour, innerContour, lowerOuter, lowerInner } = lipLandmarks;
  const finish = options.finish || 'satin';

  // 2. Compute bounding box with padding to minimize pixel processing area
  let lipMinX = 1;
  let lipMinY = 1;
  let lipMaxX = 0;
  let lipMaxY = 0;
  for (let i = 0; i < outerContour.length; i++) {
    const pt = outerContour[i];
    if (pt.x < lipMinX) lipMinX = pt.x;
    if (pt.y < lipMinY) lipMinY = pt.y;
    if (pt.x > lipMaxX) lipMaxX = pt.x;
    if (pt.y > lipMaxY) lipMaxY = pt.y;
  }

  const padPx = Math.max(12, Math.round(width * 0.02));
  const bx0 = Math.max(0, Math.floor(lipMinX * width) - padPx);
  const by0 = Math.max(0, Math.floor(lipMinY * height) - padPx);
  const bx1 = Math.min(width, Math.ceil(lipMaxX * width) + padPx);
  const by1 = Math.min(height, Math.ceil(lipMaxY * height) + padPx);
  const bWidth = bx1 - bx0;
  const bHeight = by1 - by0;

  if (bWidth <= 0 || bHeight <= 0) return canvas;

  // 3. Render soft feathered mask on sub-canvas
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = bWidth;
  maskCanvas.height = bHeight;
  const maskCtx = maskCanvas.getContext('2d');

  // Feather blur proportional to image size (approx 1.0 - 2.2px) to prevent halo or spilling
  const featherPx = Math.max(1.0, Math.min(2.2, width * 0.0016));
  maskCtx.save();
  maskCtx.translate(-bx0, -by0);
  maskCtx.filter = `blur(${featherPx}px)`;
  traceLipPath(maskCtx, outerContour, innerContour, width, height);
  maskCtx.fillStyle = '#FFFFFF';
  maskCtx.fill('evenodd');
  maskCtx.restore();

  const maskData = maskCtx.getImageData(0, 0, bWidth, bHeight).data;

  // 4. Read underlying image pixels for bounding box
  const imgData = ctx.getImageData(bx0, by0, bWidth, bHeight);
  const data = imgData.data;

  // 5. Compute average lip lightness (avgLipL) from original lip pixels for texture relativity
  let totalL = 0;
  let lipPixelCount = 0;
  for (let y = 0; y < bHeight; y++) {
    for (let x = 0; x < bWidth; x++) {
      const idx = (y * bWidth + x) * 4;
      const mAlpha = maskData[idx + 3] / 255;
      if (mAlpha > 0.45) {
        const [l] = rgbToLab(data[idx], data[idx + 1], data[idx + 2]);
        totalL += l;
        lipPixelCount++;
      }
    }
  }
  const avgLipL = lipPixelCount > 0 ? (totalL / lipPixelCount) : 48.0;

  // 6. Target shade color in CIELAB
  const targetRgb = hexToRgb(shadeHex);
  const [targetL, targetA, targetB] = rgbToLab(targetRgb.r, targetRgb.g, targetRgb.b);

  // 7. Calibrate blend weights according to intensity & finish
  const normInt = Math.max(0.1, Math.min(1.0, intensity / 100));
  let chromaWeight = Math.min(0.98, 0.22 + 0.76 * Math.pow(normInt, 0.72));
  let lightWeight = Math.min(0.90, 0.12 + 0.78 * Math.pow(normInt, 0.80));

  if (finish === 'matte') {
    chromaWeight = Math.min(0.99, chromaWeight * 1.06);
    lightWeight = Math.min(0.94, lightWeight * 1.08);
  } else if (finish === 'gloss') {
    lightWeight *= 0.82;
  }

  const baseL = avgLipL * (1 - lightWeight) + targetL * lightWeight;

  // Center point & radius for lower-lip gloss specular reflection
  let glossCenterX = 0;
  let glossCenterY = 0;
  let glossRadiusX = 1;
  let glossRadiusY = 1;
  const hasGlossCenter = finish === 'gloss' && lowerOuter && lowerOuter.length >= 6;
  if (hasGlossCenter) {
    const midOuterIdx = Math.floor(lowerOuter.length / 2);
    const midInnerIdx = lowerInner ? Math.floor(lowerInner.length / 2) : midOuterIdx;
    const outerMid = lowerOuter[midOuterIdx];
    const innerMid = lowerInner ? lowerInner[midInnerIdx] : outerMid;
    glossCenterX = ((outerMid.x + innerMid.x) * 0.5) * width;
    glossCenterY = ((outerMid.y + innerMid.y) * 0.5) * height;
    glossRadiusX = Math.max(10, (lipMaxX - lipMinX) * width * 0.22);
    glossRadiusY = Math.max(4, Math.abs(outerMid.y - innerMid.y) * height * 0.55);
  }

  // 8. Transform each pixel inside the bounding box
  for (let y = 0; y < bHeight; y++) {
    const globalY = by0 + y;
    for (let x = 0; x < bWidth; x++) {
      const idx = (y * bWidth + x) * 4;
      const maskAlpha = maskData[idx + 3] / 255;
      if (maskAlpha < 0.008) continue;

      const origR = data[idx];
      const origG = data[idx + 1];
      const origB = data[idx + 2];

      const [origL, origA, origLabB] = rgbToLab(origR, origG, origB);

      // Preserve natural lip texture, creases, and relief
      const ratio = origL / Math.max(1, avgLipL);
      const textureDelta = origL - avgLipL;
      let newL = baseL * (0.60 + 0.40 * ratio) + textureDelta * 0.25;

      // Identify natural specular highlight areas
      const isHighlight = origL > (avgLipL + 7);
      const highlightStrength = isHighlight ? Math.min(1.0, (origL - (avgLipL + 7)) / 22) : 0;

      // Chromaticity shift towards target shade
      let curA = origA * (1 - chromaWeight) + targetA * chromaWeight;
      let curB = origLabB * (1 - chromaWeight) + targetB * chromaWeight;

      // Finish-specific highlight rendering
      if (finish === 'matte') {
        if (highlightStrength > 0) {
          // Softly diffuse specular shine towards base lightness for velvety matte
          newL = newL * (1 - highlightStrength * 0.18) + baseL * (highlightStrength * 0.18);
        }
      } else if (finish === 'satin') {
        if (highlightStrength > 0) {
          newL += highlightStrength * 6.5 * normInt;
          curA *= (1 - highlightStrength * 0.10);
          curB *= (1 - highlightStrength * 0.10);
        }
      } else if (finish === 'gloss') {
        if (highlightStrength > 0) {
          newL += highlightStrength * 16 * normInt;
          curA *= (1 - highlightStrength * 0.28);
          curB *= (1 - highlightStrength * 0.28);
        }

        // Additional lower lip 3D gloss cushion reflection
        if (hasGlossCenter) {
          const globalX = bx0 + x;
          const gdx = (globalX - glossCenterX) / glossRadiusX;
          const gdy = (globalY - glossCenterY) / glossRadiusY;
          const gd2 = gdx * gdx + gdy * gdy;
          if (gd2 < 1.0) {
            const gleam = Math.pow(1.0 - Math.sqrt(gd2), 1.6) * 0.38 * normInt;
            newL += gleam * 22;
            curA *= (1 - gleam * 0.32);
            curB *= (1 - gleam * 0.32);
          }
        }
      }

      newL = Math.max(2, Math.min(98, newL));

      // Convert back to sRGB
      const [transR, transG, transB] = labToRgb(newL, curA, curB);

      // Feathered blend onto image data
      data[idx]     = Math.round(origR * (1 - maskAlpha) + transR * maskAlpha);
      data[idx + 1] = Math.round(origG * (1 - maskAlpha) + transG * maskAlpha);
      data[idx + 2] = Math.round(origB * (1 - maskAlpha) + transB * maskAlpha);
    }
  }

  // 9. Write modified bounding box pixels back to canvas
  ctx.putImageData(imgData, bx0, by0);

  return canvas;
}
