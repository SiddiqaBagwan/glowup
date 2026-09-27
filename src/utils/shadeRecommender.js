/**
 * Lightweight client-side shade recommender.
 * Analyzes visible facial/skin characteristics and image lighting
 * to suggest 3 diverse, visually compatible lipstick shades from LIPSTICK_SHADES.
 * 
 * Rules:
 * - Deterministic, lightweight, fast.
 * - No external AI/APIs or heavy models.
 * - Respects privacy: strictly analyzes visual color compatibility.
 * - Never makes claims about ethnicity, race, age, or health.
 */

import { LIPSTICK_SHADES } from './shades';
import { loadImage } from './imageUtils';
import { detectFaceAndLips } from './faceDetector';

/**
 * Maps shade ID to shade object from LIPSTICK_SHADES
 */
function getShade(id) {
  return LIPSTICK_SHADES.find((s) => s.id === id) || LIPSTICK_SHADES[0];
}

/**
 * Samples average RGB from an ImageData array over specified pixel coordinates
 */
function sampleAverageRGB(imageData, startX, startY, sampleWidth, sampleHeight) {
  const { data, width, height } = imageData;
  const x0 = Math.max(0, Math.min(width - 1, Math.floor(startX)));
  const y0 = Math.max(0, Math.min(height - 1, Math.floor(startY)));
  const x1 = Math.max(0, Math.min(width, Math.floor(startX + sampleWidth)));
  const y1 = Math.max(0, Math.min(height, Math.floor(startY + sampleHeight)));

  let rSum = 0;
  let gSum = 0;
  let bSum = 0;
  let count = 0;

  for (let y = y0; y < y1; y += 2) {
    for (let x = x0; x < x1; x += 2) {
      const idx = (y * width + x) * 4;
      rSum += data[idx];
      gSum += data[idx + 1];
      bSum += data[idx + 2];
      count++;
    }
  }

  if (count === 0) return { r: 180, g: 140, b: 120 };
  return {
    r: Math.round(rSum / count),
    g: Math.round(gSum / count),
    b: Math.round(bSum / count)
  };
}

/**
 * Analyzes image lighting and complexion/undertone characteristics
 * and returns top 3 diverse lipstick recommendations.
 */
export async function analyzePhotoForSuggestions(photoUrl) {
  try {
    const img = await loadImage(photoUrl);

    // Create an offscreen canvas to sample pixels
    const canvas = document.createElement('canvas');
    const targetDim = 400;
    let w = img.naturalWidth || img.width;
    let h = img.naturalHeight || img.height;
    if (w > h) {
      h = Math.round((h * targetDim) / w);
      w = targetDim;
    } else {
      w = Math.round((w * targetDim) / h);
      h = targetDim;
    }
    canvas.width = Math.max(w, 100);
    canvas.height = Math.max(h, 100);

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // 1. Overall Image Lighting Assessment
    const centerSample = sampleAverageRGB(
      imgData,
      canvas.width * 0.25,
      canvas.height * 0.2,
      canvas.width * 0.5,
      canvas.height * 0.6
    );
    const luminance = 0.299 * centerSample.r + 0.587 * centerSample.g + 0.114 * centerSample.b;

    let isDark = luminance < 48;
    let isBright = luminance > 225;
    let lightingQuality = isDark ? 'Low Light' : (isBright ? 'High Exposure' : 'Natural Light');

    let lightingWarning = null;
    if (isDark) {
      lightingWarning = 'Try a brighter photo for better shade suggestions.';
    } else if (isBright) {
      lightingWarning = 'Photo has strong highlights; suggestions are calibrated for balanced lighting.';
    }

    // 2. Face and Lip Landmark Analysis
    let detectionWarning = null;
    let skinRGB = null;

    try {
      const faceResult = await detectFaceAndLips(img);
      if (faceResult && faceResult.success && faceResult.lipBounds) {
        const lb = faceResult.lipBounds;

        // Sample cheek skin tone adjacent to lips
        const cheek1X = Math.max(0, (lb.minX - lb.width * 0.6) * canvas.width);
        const cheek1Y = Math.max(0, (lb.minY - lb.height * 0.8) * canvas.height);
        const cheekW = Math.max(10, lb.width * 0.5 * canvas.width);
        const cheekH = Math.max(10, lb.height * 0.6 * canvas.height);
        skinRGB = sampleAverageRGB(imgData, cheek1X, cheek1Y, cheekW, cheekH);

        if (faceResult.warning) {
          detectionWarning = faceResult.warning;
        }
      } else {
        detectionWarning = "We couldn't get a clear read from this photo. Try a front-facing photo in natural light.";
      }
    } catch (err) {
      console.warn('Face detection error in recommender:', err);
      detectionWarning = "We couldn't get a clear read from this photo. Try a front-facing photo in natural light.";
    }

    // Fallback skin sample if detection was uncertain
    if (!skinRGB) {
      skinRGB = centerSample;
    }

    // 3. Undertone & Complexion Estimation
    const skinLuma = 0.299 * skinRGB.r + 0.587 * skinRGB.g + 0.114 * skinRGB.b;

    let complexion = 'Medium';
    if (skinLuma > 165) complexion = 'Fair';
    else if (skinLuma < 112) complexion = 'Deep';

    // Warm vs Cool evaluation
    const rDiffB = skinRGB.r - skinRGB.b;
    const gDiffB = skinRGB.g - skinRGB.b;

    let undertone = 'Neutral';
    if (rDiffB > 26 && gDiffB > 12) {
      undertone = 'Warm';
    } else if (rDiffB < 18 || (skinRGB.b > 0.88 * skinRGB.g && skinRGB.b > 90)) {
      undertone = 'Cool';
    }

    // 4. Select Exactly 3 Diverse Recommendations
    let rec1, rec2, rec3;

    if (undertone === 'Warm') {
      if (complexion === 'Deep') {
        rec1 = {
          shade: getShade('caramel-nude'),
          reason: 'Warm everyday nude'
        };
        rec2 = {
          shade: getShade('terracotta'),
          reason: 'Sun-baked earthy option'
        };
        rec3 = {
          shade: getShade('cherry-red'),
          reason: 'Bold vibrant statement'
        };
      } else if (complexion === 'Fair') {
        rec1 = {
          shade: getShade('peach-nude'),
          reason: 'Soft everyday option'
        };
        rec2 = {
          shade: getShade('peachy-coral'),
          reason: 'Fresh warm glow'
        };
        rec3 = {
          shade: getShade('brick-red'),
          reason: 'Warm statement red'
        };
      } else {
        // Medium Warm
        rec1 = {
          shade: getShade('rose-nude'),
          reason: 'Soft everyday option'
        };
        rec2 = {
          shade: getShade('terracotta'),
          reason: 'Warm earthy option'
        };
        rec3 = {
          shade: getShade('brick-red'),
          reason: 'Rich statement red'
        };
      }
    } else if (undertone === 'Cool') {
      if (complexion === 'Deep') {
        rec1 = {
          shade: getShade('dusty-mauve'),
          reason: 'Cool elegant neutral'
        };
        rec2 = {
          shade: getShade('plum-berry'),
          reason: 'Rich dusky berry accent'
        };
        rec3 = {
          shade: getShade('deep-boysenberry'),
          reason: 'Deeper statement option'
        };
      } else if (complexion === 'Fair') {
        rec1 = {
          shade: getShade('soft-pink'),
          reason: 'Fresh everyday blush'
        };
        rec2 = {
          shade: getShade('classic-rose'),
          reason: 'Timeless rosy finish'
        };
        rec3 = {
          shade: getShade('wine-red'),
          reason: 'Velvety statement option'
        };
      } else {
        // Medium Cool
        rec1 = {
          shade: getShade('soft-mauve'),
          reason: 'Muted everyday option'
        };
        rec2 = {
          shade: getShade('cranberry'),
          reason: 'Crisp cool berry pop'
        };
        rec3 = {
          shade: getShade('wine-red'),
          reason: 'Deeper statement option'
        };
      }
    } else {
      // Neutral
      if (complexion === 'Deep') {
        rec1 = {
          shade: getShade('caramel-nude'),
          reason: 'Balanced everyday neutral'
        };
        rec2 = {
          shade: getShade('warm-rose'),
          reason: 'Soft radiant option'
        };
        rec3 = {
          shade: getShade('classic-red'),
          reason: 'Timeless statement red'
        };
      } else {
        rec1 = {
          shade: getShade('rose-nude'),
          reason: 'Soft everyday option'
        };
        rec2 = {
          shade: getShade('dusty-rose'),
          reason: 'Versatile vintage rose'
        };
        rec3 = {
          shade: getShade('wild-berry'),
          reason: 'Playful statement option'
        };
      }
    }

    return {
      success: true,
      undertone,
      complexion,
      lightingQuality,
      warning: lightingWarning || detectionWarning || null,
      recommendations: [rec1, rec2, rec3]
    };
  } catch (err) {
    console.error('Error analyzing photo for suggestions:', err);
    return {
      success: true,
      undertone: 'Neutral',
      complexion: 'Medium',
      lightingQuality: 'Natural Light',
      warning: "We couldn't get a clear read from this photo. Try a front-facing photo in natural light.",
      recommendations: [
        { shade: getShade('rose-nude'), reason: 'Soft everyday option' },
        { shade: getShade('terracotta'), reason: 'Warm earthy option' },
        { shade: getShade('classic-red'), reason: 'Timeless statement red' }
      ]
    };
  }
}
