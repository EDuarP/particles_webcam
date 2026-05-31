import { PALETTES } from "./config.js";
import { renderer } from "./scene.js";
import { uniforms } from "./vortex.js";
import { sphereUniforms } from "./sphere.js";
import { makeShapeTexture } from "./shapes.js";
import { state } from "./state.js";

function bindSlider(input, out, set) {
  const apply = () => {
    out.textContent = (+input.value).toFixed(input.step.includes(".") ? 2 : 0);
    set(+input.value);
  };
  input.addEventListener("input", apply);
  apply();
}

// Wires the dashboard sliders and selects to the scene uniforms / state.
export function initControls() {
  const $ = (id) => document.getElementById(id);

  bindSlider($("cZoom"),   $("vZoom"),   v => { state.sliderZoom = v; });
  bindSlider($("cFunnel"), $("vFunnel"), v => { uniforms.uFunnel.value = v; });
  bindSlider($("cWind"),   $("vWind"),   v => { uniforms.uWind.value = v; });
  bindSlider($("cChaos"),  $("vChaos"),  v => { uniforms.uChaos.value = v; });
  bindSlider($("cSize"),   $("vSize"),   v => { uniforms.uSize.value = v * renderer.getPixelRatio(); });
  bindSlider($("cCore"),   $("vCore"),   v => { sphereUniforms.uSphereR.value = v; });
  bindSlider($("cSpeed"),  $("vSpeed"),  v => { state.baseSpeed = v; });

  // Particle shape
  const selShape = $("selShape");
  selShape.addEventListener("change", () => {
    const old = uniforms.uTex.value;
    uniforms.uTex.value = makeShapeTexture(selShape.value);
    if (old) old.dispose();
  });

  // Color palette
  const selColor = $("selColor");
  selColor.addEventListener("change", () => {
    const p = PALETTES[selColor.value] || PALETTES.white;
    uniforms.uColorMode.value = p.mode;
    uniforms.uColorA.value.setHex(p.a);
    uniforms.uColorB.value.setHex(p.b);
  });
}
