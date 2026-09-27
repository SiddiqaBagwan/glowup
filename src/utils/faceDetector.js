import { FilesetResolver, FaceLandmarker } from '@mediapipe/tasks-vision';

// Landmark indices for lips in MediaPipe Face Mesh (468/478 landmarks)
export const LIP_LANDMARK_INDICES = {
  upperOuter: [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291],
  upperInner: [78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308],
  lowerOuter: [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291],
  lowerInner: [78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308],
  outerContour: [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 375, 321, 405, 314, 17, 84, 181, 91, 146, 61],
  innerContour: [78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95, 78],
};

// Landmark indices for eyes in MediaPipe Face Mesh
export const EYE_LANDMARK_INDICES = {
  rightEye: {
    innerCorner: 133,
    outerCorner: 33,
    upperLashLine: [133, 173, 157, 158, 159, 160, 161, 246, 33],
    lowerLashLine: [133, 155, 154, 153, 145, 144, 163, 7, 33],
    prevOuterLower: 7
  },
  leftEye: {
    innerCorner: 362,
    outerCorner: 263,
    upperLashLine: [362, 398, 384, 385, 386, 387, 388, 466, 263],
    lowerLashLine: [362, 382, 381, 380, 374, 373, 390, 249, 263],
    prevOuterLower: 249
  }
};

// Landmark indices for cheeks and jawline for Contour and Blush
export const FACE_STRUCTURE_INDICES = {
  rightCheek: {
    apple: 50,
    zygomaticPeak: 123,
    temple: 234,
    hollow: [234, 127, 93, 137, 177, 215],
    jaw: [234, 138, 172, 136, 150, 149, 176, 148, 152],
    mouthCorner: 61,
    noseWing: 98
  },
  leftCheek: {
    apple: 280,
    zygomaticPeak: 352,
    temple: 454,
    hollow: [454, 356, 323, 366, 401, 435],
    jaw: [454, 367, 397, 365, 379, 378, 400, 377, 152],
    mouthCorner: 291,
    noseWing: 327
  },
  forehead: 10,
  chin: 152,
  noseTip: 1
};

let landmarkerPromise = null;
let landmarkerInstance = null;

/**
 * Initializes and caches the MediaPipe FaceLandmarker singleton.
 */
export async function getFaceLandmarker() {
  if (landmarkerInstance) {
    return landmarkerInstance;
  }

  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      try {
        const filesetResolver = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );

        const landmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
            delegate: 'GPU'
          },
          outputFaceBlendshapes: false,
          runningMode: 'IMAGE',
          numFaces: 2
        });

        landmarkerInstance = landmarker;
        return landmarker;
      } catch (err) {
        console.warn('GPU delegate failed or initial setup error, retrying with CPU delegate:', err);
        // Fallback to CPU delegate if WebGL is unavailable on device
        const filesetResolver = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );

        const landmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
            delegate: 'CPU'
          },
          outputFaceBlendshapes: false,
          runningMode: 'IMAGE',
          numFaces: 2
        });

        landmarkerInstance = landmarker;
        return landmarker;
      }
    })();
  }

  return landmarkerPromise;
}

/**
 * Detects face and extracts lip contour points from an image element.
 * Handles edge cases: no face, multiple faces, face too small.
 */
export async function detectFaceAndLips(imageElement) {
  try {
    const landmarker = await getFaceLandmarker();
    const result = landmarker.detect(imageElement);

    if (!result || !result.faceLandmarks || result.faceLandmarks.length === 0) {
      return {
        success: false,
        error: "We couldn't find a clear face. Try a front-facing photo with good lighting."
      };
    }

    const faceCount = result.faceLandmarks.length;
    // Use the primary detected face
    const landmarks = result.faceLandmarks[0];

    // Compute Face Bounding Box to check scale
    let minX = 1, minY = 1, maxX = 0, maxY = 0;
    landmarks.forEach((pt) => {
      if (pt.x < minX) minX = pt.x;
      if (pt.y < minY) minY = pt.y;
      if (pt.x > maxX) maxX = pt.x;
      if (pt.y > maxY) maxY = pt.y;
    });

    const faceWidth = maxX - minX;
    const faceHeight = maxY - minY;

    let warning = null;
    if (faceWidth < 0.12 || faceHeight < 0.12) {
      warning = "The face is a bit far away. A closer photo will give you the most accurate look!";
    } else if (faceCount > 1) {
      warning = "Multiple faces detected. Applying lipstick to the primary face.";
    }

    // Extract Lip Contours
    const mapPoints = (indices) =>
      indices.map((idx) => ({
        x: landmarks[idx].x,
        y: landmarks[idx].y,
        z: landmarks[idx].z || 0
      }));

    const upperOuter = mapPoints(LIP_LANDMARK_INDICES.upperOuter);
    const upperInner = mapPoints(LIP_LANDMARK_INDICES.upperInner);
    const lowerOuter = mapPoints(LIP_LANDMARK_INDICES.lowerOuter);
    const lowerInner = mapPoints(LIP_LANDMARK_INDICES.lowerInner);
    const outerContour = mapPoints(LIP_LANDMARK_INDICES.outerContour);
    const innerContour = mapPoints(LIP_LANDMARK_INDICES.innerContour);

    // Lip bounding box
    let lipMinX = 1, lipMinY = 1, lipMaxX = 0, lipMaxY = 0;
    outerContour.forEach((pt) => {
      if (pt.x < lipMinX) lipMinX = pt.x;
      if (pt.y < lipMinY) lipMinY = pt.y;
      if (pt.x > lipMaxX) lipMaxX = pt.x;
      if (pt.y > lipMaxY) lipMaxY = pt.y;
    });

    // Extract Eye Landmarks for Eyeliner
    const mapSingle = (idx) => ({
      x: landmarks[idx].x,
      y: landmarks[idx].y,
      z: landmarks[idx].z || 0
    });

    const eyeLandmarks = {
      rightEye: {
        innerCorner: mapSingle(EYE_LANDMARK_INDICES.rightEye.innerCorner),
        outerCorner: mapSingle(EYE_LANDMARK_INDICES.rightEye.outerCorner),
        upperLashLine: mapPoints(EYE_LANDMARK_INDICES.rightEye.upperLashLine),
        lowerLashLine: mapPoints(EYE_LANDMARK_INDICES.rightEye.lowerLashLine),
        prevOuterLower: mapSingle(EYE_LANDMARK_INDICES.rightEye.prevOuterLower)
      },
      leftEye: {
        innerCorner: mapSingle(EYE_LANDMARK_INDICES.leftEye.innerCorner),
        outerCorner: mapSingle(EYE_LANDMARK_INDICES.leftEye.outerCorner),
        upperLashLine: mapPoints(EYE_LANDMARK_INDICES.leftEye.upperLashLine),
        lowerLashLine: mapPoints(EYE_LANDMARK_INDICES.leftEye.lowerLashLine),
        prevOuterLower: mapSingle(EYE_LANDMARK_INDICES.leftEye.prevOuterLower)
      }
    };

    const rEyeWidth = Math.abs(eyeLandmarks.rightEye.outerCorner.x - eyeLandmarks.rightEye.innerCorner.x);
    const lEyeWidth = Math.abs(eyeLandmarks.leftEye.outerCorner.x - eyeLandmarks.leftEye.innerCorner.x);
    const eyesDetected = rEyeWidth > 0.015 && lEyeWidth > 0.015;

    // Extract Facial Structure Landmarks for Contour & Blush
    const faceStructureLandmarks = {
      rightCheek: {
        apple: mapSingle(FACE_STRUCTURE_INDICES.rightCheek.apple),
        zygomaticPeak: mapSingle(FACE_STRUCTURE_INDICES.rightCheek.zygomaticPeak),
        temple: mapSingle(FACE_STRUCTURE_INDICES.rightCheek.temple),
        hollow: mapPoints(FACE_STRUCTURE_INDICES.rightCheek.hollow),
        jaw: mapPoints(FACE_STRUCTURE_INDICES.rightCheek.jaw),
        mouthCorner: mapSingle(FACE_STRUCTURE_INDICES.rightCheek.mouthCorner),
        noseWing: mapSingle(FACE_STRUCTURE_INDICES.rightCheek.noseWing)
      },
      leftCheek: {
        apple: mapSingle(FACE_STRUCTURE_INDICES.leftCheek.apple),
        zygomaticPeak: mapSingle(FACE_STRUCTURE_INDICES.leftCheek.zygomaticPeak),
        temple: mapSingle(FACE_STRUCTURE_INDICES.leftCheek.temple),
        hollow: mapPoints(FACE_STRUCTURE_INDICES.leftCheek.hollow),
        jaw: mapPoints(FACE_STRUCTURE_INDICES.leftCheek.jaw),
        mouthCorner: mapSingle(FACE_STRUCTURE_INDICES.leftCheek.mouthCorner),
        noseWing: mapSingle(FACE_STRUCTURE_INDICES.leftCheek.noseWing)
      },
      forehead: mapSingle(FACE_STRUCTURE_INDICES.forehead),
      chin: mapSingle(FACE_STRUCTURE_INDICES.chin),
      noseTip: mapSingle(FACE_STRUCTURE_INDICES.noseTip)
    };

    return {
      success: true,
      lipLandmarks: {
        upperOuter,
        upperInner,
        lowerOuter,
        lowerInner,
        outerContour,
        innerContour
      },
      lipBounds: {
        minX: lipMinX,
        minY: lipMinY,
        maxX: lipMaxX,
        maxY: lipMaxY,
        width: lipMaxX - lipMinX,
        height: lipMaxY - lipMinY
      },
      eyeLandmarks,
      eyesDetected,
      faceStructureLandmarks,
      warning
    };
  } catch (err) {
    console.error('Error in face/lip detection:', err);
    return {
      success: false,
      error: "Face detection was interrupted. Please try again with a clear photo."
    };
  }
}
