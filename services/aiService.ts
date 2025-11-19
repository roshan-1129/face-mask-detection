
import { DetectionResult, FacePrediction } from "../types";

// Declare types for global window objects injected by scripts
declare global {
  interface Window {
    blazeface: any;
    tf: any;
  }
}

let model: any = null;

/**
 * Loads the BlazeFace model from TensorFlow.js
 */
export const loadModel = async () => {
  if (model) return;
  try {
    console.log("Loading BlazeFace model...");
    // Wait for script to load if needed
    if (!window.blazeface) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    model = await window.blazeface.load();
    console.log("BlazeFace model loaded successfully");
  } catch (err) {
    console.error("Failed to load BlazeFace model:", err);
  }
};

/**
 * Detects faces in a video element and estimates mask usage.
 */
export const detectFacesInVideo = async (video: HTMLVideoElement, canvas: HTMLCanvasElement): Promise<DetectionResult> => {
  if (!model) {
    return { hasMask: true, confidence: 0, faces: [] };
  }

  // 1. Detect Faces (returnTensors: false gives us plain JS objects with landmarks)
  const returnTensors = false;
  const predictions = await model.estimateFaces(video, returnTensors);

  if (!predictions || predictions.length === 0) {
    return { hasMask: true, confidence: 0, faces: [] };
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) return { hasMask: true, confidence: 0, faces: [] };

  const faces: FacePrediction[] = [];
  let globalNoMaskDetected = false;
  let maxConfidence = 0;

  for (let i = 0; i < predictions.length; i++) {
    const start = predictions[i].topLeft;
    const end = predictions[i].bottomRight;
    const probability = predictions[i].probability[0];
    const landmarks = predictions[i].landmarks; // [eye, eye, nose, mouth, ear, ear]

    // Bounding Box
    const x = start[0];
    const y = start[1];
    const w = end[0] - start[0];
    const h = end[1] - start[1];

    // --- Advanced Mask Heuristic using Landmarks ---
    // Landmarks: 0=REye, 1=LEye, 2=Nose, 3=Mouth, 4=REar, 5=LEar
    let hasMask = true;

    if (w > 0 && h > 0) {
        // Define the "Mask Zone".
        // Instead of taking the whole bottom half (which includes neck/chest),
        // we focus tight on the nose-mouth-chin area.
        
        let sampleX = x + (w * 0.25);
        let sampleY = y + (h * 0.55); // Start just below nose
        let sampleW = w * 0.5;
        let sampleH = h * 0.35; // Stop before chin/neck

        // If we have landmarks, use them to be more precise
        if (landmarks && landmarks.length >= 4) {
            const nose = landmarks[2];
            const mouth = landmarks[3];
            
            // Center sampling on the mouth, extending up to nose and down to chin
            sampleX = nose[0] - (w * 0.25);
            sampleY = nose[1]; // Start at nose tip
            sampleW = w * 0.5;
            sampleH = (mouth[1] - nose[1]) * 2.5; // Extend down past mouth
        }

        // Clamp values to stay within image
        sampleX = Math.max(0, sampleX);
        sampleY = Math.max(0, sampleY);
        sampleW = Math.min(video.videoWidth - sampleX, sampleW);
        sampleH = Math.min(video.videoHeight - sampleY, sampleH);

        if (sampleW > 0 && sampleH > 0) {
            const imageData = ctx.getImageData(sampleX, sampleY, sampleW, sampleH);
            
            // Detect if this area looks like skin using HSV
            const skinPercentage = detectSkinToneHSV(imageData);
            
            // Threshold:
            // If > 8% of the pixels in the mouth/nose area are skin-colored, 
            // we assume the mouth/nose is exposed -> NO MASK.
            // Updated: 0.08 is safer than 0.12 for darker rooms or bad cams.
            // A real mask usually has near 0% skin tone in that specific area.
            hasMask = skinPercentage < 0.08; 
        }
    }

    if (!hasMask) globalNoMaskDetected = true;
    if (probability > maxConfidence) maxConfidence = probability;

    faces.push({
      bbox: [x, y, w, h],
      hasMask: hasMask,
      score: probability
    });
  }

  return {
    hasMask: !globalNoMaskDetected, // If anyone has NO mask, the system status is ALERT
    confidence: maxConfidence,
    faces: faces,
    message: `Detected ${faces.length} face(s)`
  };
};

/**
 * Helper: Convert RGB to HSV
 * r,g,b in [0, 255], returns h in [0,360], s,v in [0,1]
 */
const rgbToHsv = (r: number, g: number, b: number) => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s, v = max;
    const d = max - min;
    s = max === 0 ? 0 : d / max;

    if (max === min) {
        h = 0; // achromatic
    } else {
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return [h * 360, s, v];
};

/**
 * Robust HSV-based skin detection.
 * Much better than RGB for varying lighting conditions.
 */
const detectSkinToneHSV = (imageData: ImageData): number => {
  const data = imageData.data;
  let skinPixels = 0;
  const totalPixels = data.length / 4;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const [h, s, v] = rgbToHsv(r, g, b);

    // HSV Thresholds for Skin:
    // UPDATED: Ranges broadened for webcams.
    // Hue: 0 - 50 (Normal Skin) OR 330-360 (Pinkish/Reddish Skin)
    // Saturation: > 0.10 (Lowered from 0.15 to catch pale skin/washed out cam)
    // Value: > 0.20 (Lowered from 0.3 to catch skin in shadow)
    
    const isSkinHue = (h >= 0 && h <= 50) || (h >= 330 && h <= 360);
    const isSkinSat = (s >= 0.10 && s <= 0.9); 
    const isSkinVal = (v >= 0.20);

    if (isSkinHue && isSkinSat && isSkinVal) {
      skinPixels++;
    }
  }

  return skinPixels / totalPixels;
};
