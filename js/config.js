// Shared constants for the particle black hole.

export const COUNT   = 30000;   // vortex particle count
export const R_INNER = 0.45;    // inner hole radius
export const R_OUTER = 4.2;     // outer disk radius
export const ARMS    = 5;       // number of tails / arms of the vortex

export const SPHERE_COUNT = 9000;  // core sphere particle count

export const BASE_PITCH = -0.6;    // resting tilt of the disk

export const TWO_PI = Math.PI * 2;

// Hand control
export const SPEED_MAX = 2.4;                  // max spin speed
export const ZOOM_MIN  = 0.5, ZOOM_MAX = 2.6;  // zoom range
export const GRAB      = 0.30;                 // below this = closed fist

// Remote assets
export const TASKS_VISION_WASM = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.12/wasm";
export const HAND_MODEL = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

// Color palettes: mode 0 = solid (A), 1 = gradient (A->B), 2 = rainbow
export const PALETTES = {
  white:   { mode: 0, a: 0xffffff, b: 0xffffff },
  ice:     { mode: 1, a: 0x9fdcff, b: 0xffffff },
  fire:    { mode: 1, a: 0xffd24a, b: 0xff3d00 },
  matrix:  { mode: 1, a: 0xeaffea, b: 0x16ff5e },
  purple:  { mode: 1, a: 0xb06bff, b: 0xff5cc8 },
  rainbow: { mode: 2, a: 0xffffff, b: 0xffffff },
};
