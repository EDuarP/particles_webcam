import * as THREE from "three";
import { BASE_PITCH } from "./config.js";
import { renderer, scene, camera, disk } from "./scene.js";
import { uniforms } from "./vortex.js";
import { core } from "./sphere.js";
import { state } from "./state.js";
import { initControls } from "./controls.js";
import { initCamera, initHands, updateHands } from "./hands.js";

const intro    = document.getElementById("intro");
const startBtn = document.getElementById("start");
const statusIn = document.getElementById("statusIntro");
const liveEl   = document.getElementById("live");

initControls();

const clock = new THREE.Clock();

function loop() {
  const dt = Math.min(clock.getDelta(), 0.05);
  uniforms.uTime.value += dt;

  updateHands();

  // Speed: the left hand rules; with no hand, use the base-speed slider
  if (!state.leftActive) state.targetSpeed = state.baseSpeed;
  // Zoom: the open right hand rules; with no right hand, use the slider
  if (!state.rightActive) state.targetZoom = state.sliderZoom;
  // Orientation: only changes with a closed fist; otherwise a gentle drift (never static)
  if (!state.rightRotating) {
    state.targetYaw += dt * 0.12;
    if (!state.rightActive) state.targetPitch = BASE_PITCH;
  }

  const k = Math.min(1, dt * 6);
  state.curSpeed += (state.targetSpeed - state.curSpeed) * k;
  state.curZoom  += (state.targetZoom  - state.curZoom)  * k;
  state.curYaw   += (state.targetYaw   - state.curYaw)   * k;
  state.curPitch += (state.targetPitch - state.curPitch) * k;

  // Accumulated phase -> speed affects motion clearly and smoothly (no jumps)
  state.spinPhase += state.curSpeed * dt;
  state.flowPhase += (0.04 + state.curSpeed * 0.12) * dt;   // there is always some inflow to the center
  uniforms.uSpin.value = state.spinPhase;
  uniforms.uFlow.value = state.flowPhase;
  uniforms.uZoom.value = state.curZoom;
  disk.rotation.set(state.curPitch, state.curYaw, 0);
  core.scale.setScalar(1.6 * state.curZoom);

  liveEl.textContent =
    `speed ${state.curSpeed.toFixed(2)}x  ·  zoom ${state.curZoom.toFixed(2)}x` +
    (state.rightRotating ? "  ·  rotating" : (state.rightActive ? "  ·  zoom" : ""));

  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

startBtn.addEventListener("click", async () => {
  startBtn.disabled = true;
  try {
    await initCamera(msg => { statusIn.textContent = msg; });
    await initHands(msg => { statusIn.textContent = msg; });
    statusIn.textContent = "";
    intro.classList.add("hidden");
    loop();
  } catch (err) {
    console.error(err);
    statusIn.textContent = "Error: " + (err?.message || err) + " — check camera permissions and your connection.";
    startBtn.disabled = false;
  }
});
