import { BASE_PITCH } from "./config.js";

// Mutable state shared between the sliders (controls.js), the hand
// tracking (hands.js) and the animation loop (main.js).
export const state = {
  // Slider-driven fallbacks (used when no hand drives them)
  baseSpeed: 0.5,
  sliderZoom: 1.0,

  // Targets set by the hands each frame
  targetSpeed: 0.5,
  targetYaw: 0,
  targetPitch: BASE_PITCH,
  targetZoom: 1.0,

  // Smoothed current values
  curSpeed: 0.5,
  curYaw: 0,
  curPitch: BASE_PITCH,
  curZoom: 1.0,

  // Hand presence flags for this frame
  rightActive: false,
  leftActive: false,
  rightRotating: false,

  // Accumulated animation phases
  spinPhase: 0,
  flowPhase: 0,
};
