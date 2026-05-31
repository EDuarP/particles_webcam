import * as THREE from "three";
import { HandLandmarker, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.12/vision_bundle.mjs";
import {
  BASE_PITCH, SPEED_MAX, ZOOM_MIN, ZOOM_MAX, GRAB,
  TASKS_VISION_WASM, HAND_MODEL,
} from "./config.js";
import { state } from "./state.js";

const video = document.getElementById("cam");

let handLandmarker = null;
let lastVideoTime = -1;

function handOpenness(lm) {
  const d = (a, b) => Math.hypot(lm[a].x - lm[b].x, lm[a].y - lm[b].y, lm[a].z - lm[b].z);
  const pinch = d(4, 8);
  const palm  = d(0, 9) + 1e-4;
  return THREE.MathUtils.clamp(pinch / palm / 1.6, 0, 1);
}

function applyHands(res) {
  state.rightActive = false;
  state.leftActive = false;
  state.rightRotating = false;
  if (!res || !res.landmarks || res.landmarks.length === 0) return;

  // Role by screen position (mirrored): the rightmost hand = right hand
  const hands = res.landmarks.map(lm => ({
    cx: 1 - lm[9].x,         // mirrored x (0 screen-left, 1 screen-right)
    cy: lm[9].y,             // 0 top, 1 bottom
    open: handOpenness(lm),
  }));

  let right = null, left = null;
  if (hands.length === 1) {
    if (hands[0].cx >= 0.5) right = hands[0]; else left = hands[0];
  } else {
    hands.sort((a, b) => a.cx - b.cx);
    left = hands[0];
    right = hands[hands.length - 1];
  }

  if (right) {
    state.rightActive = true;
    if (right.open < GRAB) {
      // Closed fist -> ROTATE (grabbed): up/down (pitch) and spin (yaw)
      state.rightRotating = true;
      state.targetYaw   = (right.cx - 0.5) * 3.4;
      state.targetPitch = BASE_PITCH + (0.5 - right.cy) * 2.4;
    } else {
      // Open hand -> ZOOM with the finger spread
      state.targetZoom = THREE.MathUtils.mapLinear(right.open, GRAB, 1, ZOOM_MIN, ZOOM_MAX);
    }
  }
  if (left) {
    state.leftActive = true;
    // Spin SPEED; closed fist -> stops (0)
    state.targetSpeed = left.open < GRAB
      ? 0
      : THREE.MathUtils.mapLinear(left.open, GRAB, 1, 0, SPEED_MAX);
  }
}

// Run detection for the current video frame and update the shared state.
export function updateHands() {
  if (handLandmarker && video.readyState >= 2 && video.currentTime !== lastVideoTime) {
    lastVideoTime = video.currentTime;
    applyHands(handLandmarker.detectForVideo(video, performance.now()));
  }
}

export async function initHands(setStatus = () => {}) {
  setStatus("Loading hand model…");
  const vision = await FilesetResolver.forVisionTasks(TASKS_VISION_WASM);
  handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: HAND_MODEL,
      delegate: "GPU",
    },
    runningMode: "VIDEO",
    numHands: 2,
  });
}

export async function initCamera(setStatus = () => {}) {
  setStatus("Requesting camera permission…");
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
    audio: false,
  });
  video.srcObject = stream;
  await video.play();
}
