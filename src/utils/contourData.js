/**
 * Contour Shade Library & Lightweight AI Recommendation System
 */

import { rgbToLab } from './lipstickRenderer.js';

export const CONTOUR_SHADES = [
  {
    id: 'soft-taupe',
    name: 'Soft Taupe',
    hex: '#9A7B6A',
    undertone: 'cool',
    depth: 'light',
    description: 'Subtle sculpting option'
  },
  {
    id: 'cool-brown',
    name: 'Cool Brown',
    hex: '#806354',
    undertone: 'cool',
    depth: 'medium',
    description: 'Sculpted cool definition'
  },
  {
    id: 'neutral-brown',
    name: 'Neutral Brown',
    hex: '#765847',
    undertone: 'neutral',
    depth: 'medium',
    description: 'Natural everyday definition'
  },
  {
    id: 'warm-caramel',
    name: 'Warm Caramel',
    hex: '#9A684B',
    undertone: 'warm',
    depth: 'medium',
    description: 'Warm sculpted look'
  },
  {
    id: 'deep-cocoa',
    name: 'Deep Cocoa',
    hex: '#5C4035',
    undertone: 'neutral',
    depth: 'deep',
    description: 'Rich deep contour'
  },
  {
    id: 'soft-bronze',
    name: 'Soft Bronze',
    hex: '#8D6248',
    undertone: 'warm',
    depth: 'light',
    description: 'Sun-kissed bronzed contour'
  }
];

/**
 * Lightweight browser-side complexion & undertone analysis to recommend
 * 3 suitable contour shades using neutral, respectful descriptions.
 * 
 * @param {HTMLImageElement|HTMLCanvasElement} img - Source image
 * @param {Object} faceLandmarks - Detected face structure landmarks
 * @returns {Array} Array of 3 recommended shade objects with contextual recommendation note
 */
export function recommendContourShades(img, faceLandmarks) {
  if (!img) {
    return [
      { ...CONTOUR_SHADES[0], reason: 'Subtle sculpting option' },
      { ...CONTOUR_SHADES[2], reason: 'Natural everyday definition' },
      { ...CONTOUR_SHADES[3], reason: 'Warm sculpted look' }
    ];
  }

  try {
    const width = img.naturalWidth || img.width || 400;
    const height = img.naturalHeight || img.height || 400;

    const sampleCanvas = document.createElement('canvas');
    sampleCanvas.width = 64;
    sampleCanvas.height = 64;
    const ctx = sampleCanvas.getContext('2d');

    // Sample from cheek/forehead region if landmarks available
    let sx = width * 0.35;
    let sy = height * 0.35;
    let sw = width * 0.30;
    let sh = height * 0.30;

    if (faceLandmarks?.forehead && faceLandmarks?.chin) {
      const topY = faceLandmarks.forehead.y * height;
      const bottomY = faceLandmarks.chin.y * height;
      const centerX = (faceLandmarks.forehead.x || 0.5) * width;
      sw = Math.max(30, (bottomY - topY) * 0.35);
      sh = Math.max(30, (bottomY - topY) * 0.35);
      sx = Math.max(0, Math.min(width - sw, centerX - sw * 0.5));
      sy = Math.max(0, Math.min(height - sh, topY + (bottomY - topY) * 0.20));
    }

    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, 64, 64);
    const imgData = ctx.getImageData(0, 0, 64, 64).data;

    let totalR = 0, totalG = 0, totalB = 0;
    let totalL = 0;
    const count = 64 * 64;

    for (let i = 0; i < imgData.length; i += 4) {
      const r = imgData[i];
      const g = imgData[i + 1];
      const b = imgData[i + 2];
      totalR += r;
      totalG += g;
      totalB += b;
      const [l] = rgbToLab(r, g, b);
      totalL += l;
    }

    const avgL = totalL / count;
    const avgR = totalR / count;
    const avgB = totalB / count;
    const warmthRatio = avgR / Math.max(1, avgB);

    // Lightness depth:
    // Fair/Light: avgL > 64
    // Medium/Tan: 48 <= avgL <= 64
    // Deep/Rich: avgL < 48

    if (avgL > 64) {
      // Fair / Light complexions
      return [
        { ...CONTOUR_SHADES[0], reason: 'Subtle sculpting option' },
        { ...CONTOUR_SHADES[2], reason: 'Natural everyday definition' },
        { ...CONTOUR_SHADES[5], reason: 'Sun-kissed bronzed contour' }
      ];
    } else if (avgL >= 48) {
      // Medium / Tan complexions
      if (warmthRatio > 1.35) {
        return [
          { ...CONTOUR_SHADES[3], reason: 'Warm sculpted look' },
          { ...CONTOUR_SHADES[2], reason: 'Natural everyday definition' },
          { ...CONTOUR_SHADES[1], reason: 'Sculpted cool definition' }
        ];
      } else {
        return [
          { ...CONTOUR_SHADES[2], reason: 'Natural everyday definition' },
          { ...CONTOUR_SHADES[1], reason: 'Sculpted cool definition' },
          { ...CONTOUR_SHADES[3], reason: 'Warm sculpted look' }
        ];
      }
    } else {
      // Deep / Rich complexions
      return [
        { ...CONTOUR_SHADES[4], reason: 'Rich deep contour' },
        { ...CONTOUR_SHADES[2], reason: 'Natural everyday definition' },
        { ...CONTOUR_SHADES[3], reason: 'Warm sculpted look' }
      ];
    }
  } catch (err) {
    console.warn('Contour recommendation fallback:', err);
    return [
      { ...CONTOUR_SHADES[0], reason: 'Subtle sculpting option' },
      { ...CONTOUR_SHADES[2], reason: 'Natural everyday definition' },
      { ...CONTOUR_SHADES[3], reason: 'Warm sculpted look' }
    ];
  }
}
