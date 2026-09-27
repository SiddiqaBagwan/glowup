/**
 * Realistic Eyeliner Renderer using HTML5 Canvas composite operations.
 * Renders precise, natural-looking eyeliner along detected upper lash lines
 * with style-specific tapers, wing geometries, and texture-preserving color blending.
 */

import { hexToRgb } from './lipstickRenderer';
import { applyLightingToCanvas } from './lightingUtils';

export const EYELINER_STYLES = [
  { id: 'natural', label: 'Natural', desc: 'Subtle, very thin upper lash line' },
  { id: 'classic', label: 'Classic', desc: 'Clean line, slightly thicker at outer corner' },
  { id: 'winged',  label: 'Winged',  desc: 'Visible outward wing & defined line' },
  { id: 'cateye',  label: 'Cat Eye', desc: 'Dramatic outer corner with sharp wing' },
  { id: 'soft',    label: 'Soft',    desc: 'Soft-focus, diffused pencil finish' },
];

export const EYELINER_COLORS = [
  { id: 'black',      name: 'Black',      hex: '#171312' },
  { id: 'dark-brown', name: 'Dark Brown', hex: '#3A211B' },
  { id: 'brown',      name: 'Brown',      hex: '#5A3428' },
  { id: 'navy',       name: 'Navy',       hex: '#182A4A' },
  { id: 'plum',       name: 'Plum',       hex: '#4A203F' },
];

/**
 * Normalizes a 2D vector
 */
function normalize(vx, vy) {
  const len = Math.hypot(vx, vy);
  if (len < 1e-6) return { x: 0, y: -1 };
  return { x: vx / len, y: vy / len };
}

/**
 * Draws eyeliner path for a single eye (either left or right)
 */
function drawSingleEyeLiner(
  ctx,
  eyeData,
  isLeftEye,
  width,
  height,
  style = 'classic',
  thicknessVal = 50,
  wingVal = 50
) {
  if (!eyeData || !eyeData.upperLashLine || eyeData.upperLashLine.length < 3) return;

  const lashPoints = eyeData.upperLashLine.map((pt) => ({
    x: pt.x * width,
    y: pt.y * height,
  }));

  const innerPt = { x: eyeData.innerCorner.x * width, y: eyeData.innerCorner.y * height };
  const outerPt = { x: eyeData.outerCorner.x * width, y: eyeData.outerCorner.y * height };
  const eyeWidth = Math.hypot(outerPt.x - innerPt.x, outerPt.y - innerPt.y);

  if (eyeWidth < 10) return;

  // Base thickness scaled to eye width in pixels
  const thicknessRatio = thicknessVal / 50; // 0.2 to 2.0
  let maxThickness = eyeWidth * 0.026 * thicknessRatio;

  if (style === 'natural') {
    maxThickness *= 0.65;
  } else if (style === 'classic') {
    maxThickness *= 0.88;
  } else if (style === 'winged') {
    maxThickness *= 1.05;
  } else if (style === 'cateye') {
    maxThickness *= 1.35;
  } else if (style === 'soft') {
    maxThickness *= 1.1;
  }

  const numPts = lashPoints.length;
  const topPoints = [];

  // Compute normals pointing upward (into the eyelid, never into the eye)
  for (let i = 0; i < numPts; i++) {
    let tx, ty;
    if (i === 0) {
      tx = lashPoints[1].x - lashPoints[0].x;
      ty = lashPoints[1].y - lashPoints[0].y;
    } else if (i === numPts - 1) {
      tx = lashPoints[numPts - 1].x - lashPoints[numPts - 2].x;
      ty = lashPoints[numPts - 1].y - lashPoints[numPts - 2].y;
    } else {
      tx = lashPoints[i + 1].x - lashPoints[i - 1].x;
      ty = lashPoints[i + 1].y - lashPoints[i - 1].y;
    }

    // Normal vector perpendicular to lash curve
    let nx = -ty;
    let ny = tx;
    const n = normalize(nx, ny);

    // Ensure normal points upward (negative y in canvas coords)
    if (n.y > 0) {
      n.x = -n.x;
      n.y = -n.y;
    }

    // Taper curve: fine at inner corner, smoothly widening toward outer corner
    const progress = i / (numPts - 1);
    let taperFactor = 0.2 + 0.8 * Math.pow(progress, 1.3);

    if (style === 'cateye') {
      taperFactor = 0.15 + 1.25 * Math.pow(progress, 1.6);
    } else if (style === 'natural') {
      taperFactor = 0.25 + 0.65 * progress;
    }

    const ptThickness = Math.max(1.0, maxThickness * taperFactor);
    topPoints.push({
      x: lashPoints[i].x + n.x * ptThickness,
      y: lashPoints[i].y + n.y * ptThickness,
    });
  }

  // Calculate Wing Tip (at outer corner)
  let wingTip = null;
  const outerLashPt = lashPoints[numPts - 1];

  let wingPx = 0;
  if (style === 'classic') {
    wingPx = eyeWidth * 0.12;
  } else if (style === 'winged') {
    wingPx = eyeWidth * (0.16 + (wingVal / 100) * 0.32);
  } else if (style === 'cateye') {
    wingPx = eyeWidth * (0.24 + (wingVal / 100) * 0.42);
  } else if (style === 'soft') {
    wingPx = eyeWidth * 0.08;
  }

  if (wingPx > 0 && eyeData.prevOuterLower) {
    const prevLowerPt = {
      x: eyeData.prevOuterLower.x * width,
      y: eyeData.prevOuterLower.y * height,
    };

    // Wing vector follows lower lash line curvature extending past outer corner
    let wvx = outerPt.x - prevLowerPt.x;
    let wvy = outerPt.y - prevLowerPt.y;

    // Direct outward and upward
    const wingDir = normalize(wvx, wvy);
    if (wingDir.y > -0.15) {
      wingDir.y = -0.32;
      const reNorm = normalize(wingDir.x, wingDir.y);
      wingDir.x = reNorm.x;
      wingDir.y = reNorm.y;
    }

    wingTip = {
      x: outerLashPt.x + wingDir.x * wingPx,
      y: outerLashPt.y + wingDir.y * wingPx,
    };
  }

  // Build Eyeliner Contour Path
  ctx.beginPath();

  // 1. Move to inner corner
  ctx.moveTo(lashPoints[0].x, lashPoints[0].y);

  // 2. Trace along the upper lash line (bottom edge of eyeliner)
  for (let i = 1; i < numPts; i++) {
    const prev = lashPoints[i - 1];
    const curr = lashPoints[i];
    const midX = (prev.x + curr.x) / 2;
    const midY = (prev.y + curr.y) / 2;
    ctx.quadraticCurveTo(prev.x, prev.y, midX, midY);
  }
  ctx.lineTo(outerLashPt.x, outerLashPt.y);

  // 3. Extend to wing tip if present
  if (wingTip) {
    ctx.lineTo(wingTip.x, wingTip.y);
    // Connect wing tip to upper edge
    const topOuter = topPoints[numPts - 1];
    ctx.quadraticCurveTo(
      (wingTip.x + topOuter.x) / 2,
      (wingTip.y + topOuter.y) / 2,
      topOuter.x,
      topOuter.y
    );
  } else {
    ctx.lineTo(topPoints[numPts - 1].x, topPoints[numPts - 1].y);
  }

  // 4. Trace back along the top edge of eyeliner (outer to inner)
  for (let i = numPts - 2; i >= 0; i--) {
    const prevTop = topPoints[i + 1];
    const currTop = topPoints[i];
    const midX = (prevTop.x + currTop.x) / 2;
    const midY = (prevTop.y + currTop.y) / 2;
    ctx.quadraticCurveTo(prevTop.x, prevTop.y, midX, midY);
  }
  ctx.lineTo(topPoints[0].x, topPoints[0].y);

  // Close back to inner corner
  ctx.closePath();
}

/**
 * Main Eyeliner Canvas Renderer
 * 
 * @param {HTMLImageElement|HTMLCanvasElement} sourceImage
 * @param {Object} eyeLandmarks - { leftEye, rightEye }
 * @param {string} colorHex - Hex color code (e.g. '#171312')
 * @param {number} intensity - 10 to 100
 * @param {Object} options - { style, thickness, wingLength, lighting, isBefore }
 * @returns {HTMLCanvasElement}
 */
export function renderEyelinerOnCanvas(
  sourceImage,
  eyeLandmarks,
  colorHex = '#171312',
  intensity = 80,
  options = {}
) {
  const width = sourceImage.naturalWidth || sourceImage.width;
  const height = sourceImage.naturalHeight || sourceImage.height;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // 1. Draw base photo (or pass-through canvas) with lighting normalization
  if (options.skipLighting) {
    ctx.drawImage(sourceImage, 0, 0, width, height);
  } else {
    applyLightingToCanvas(ctx, sourceImage, width, height, options.lighting || 'auto');
  }

  // If before comparison or no landmarks, return photo
  if (options.isBefore || !eyeLandmarks || (!eyeLandmarks.leftEye && !eyeLandmarks.rightEye)) {
    return canvas;
  }

  const rgb = hexToRgb(colorHex);
  const style = options.style || 'classic';
  const thickness = options.thickness ?? 50;
  const wingLength = options.wingLength ?? 50;

  // Normalized intensity
  const normIntensity = Math.max(0.1, Math.min(1.0, intensity / 100));
  const baseAlpha = 0.35 + normIntensity * 0.6; // 0.41 to 0.95

  // 2. Offscreen Mask Canvas for Eyeliner Shape
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = width;
  maskCanvas.height = height;
  const maskCtx = maskCanvas.getContext('2d');

  const featherPx = style === 'soft'
    ? Math.max(1.8, width * 0.0032)
    : Math.max(0.8, width * 0.0014);

  maskCtx.save();
  maskCtx.filter = `blur(${featherPx}px)`;
  maskCtx.fillStyle = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;

  if (eyeLandmarks.rightEye) {
    drawSingleEyeLiner(maskCtx, eyeLandmarks.rightEye, false, width, height, style, thickness, wingLength);
    maskCtx.fill();
  }

  if (eyeLandmarks.leftEye) {
    drawSingleEyeLiner(maskCtx, eyeLandmarks.leftEye, true, width, height, style, thickness, wingLength);
    maskCtx.fill();
  }

  maskCtx.restore();

  // 3. Composite Pass 1: Multiply blend for realistic skin texture absorption
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.globalAlpha = baseAlpha * 0.92;
  ctx.drawImage(maskCanvas, 0, 0);
  ctx.restore();

  // 4. Composite Pass 2: Source-over for crisp color opacity
  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = baseAlpha * (style === 'soft' ? 0.35 : 0.65);
  ctx.drawImage(maskCanvas, 0, 0);
  ctx.restore();

  // 5. Lash Root Depth: Fine micro-stroke along the lash line
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.globalAlpha = baseAlpha * 0.75;
  ctx.strokeStyle = `rgb(${Math.max(0, rgb.r - 20)}, ${Math.max(0, rgb.g - 20)}, ${Math.max(0, rgb.b - 20)})`;
  ctx.lineWidth = Math.max(1.2, width * 0.0018);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ['rightEye', 'leftEye'].forEach((eyeKey) => {
    const eye = eyeLandmarks[eyeKey];
    if (!eye || !eye.upperLashLine) return;
    const pts = eye.upperLashLine;
    ctx.beginPath();
    ctx.moveTo(pts[0].x * width, pts[0].y * height);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x * width, pts[i].y * height);
    }
    ctx.stroke();
  });

  ctx.restore();

  return canvas;
}
