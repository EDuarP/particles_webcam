import * as THREE from "three";
import { SPHERE_COUNT, TWO_PI } from "./config.js";
import { scene, disk } from "./scene.js";
import { uniforms } from "./vortex.js";

// ── Particle sphere (central core) ──────────────────────────────
const sOff  = new Float32Array(SPHERE_COUNT * 3);
const sSize = new Float32Array(SPHERE_COUNT);
const sSeed = new Float32Array(SPHERE_COUNT);
for (let i = 0; i < SPHERE_COUNT; i++) {
  // uniform direction on the sphere + radius (dense volume toward the center)
  const u = Math.random() * 2 - 1;
  const th = Math.random() * TWO_PI;
  const k = Math.sqrt(1 - u * u);
  const rad = Math.cbrt(Math.random());      // uniform volume -> solid ball
  sOff[i*3+0] = k * Math.cos(th) * rad;
  sOff[i*3+1] = u * rad;
  sOff[i*3+2] = k * Math.sin(th) * rad;
  sSize[i] = 0.5 + Math.random() * 0.9;
  sSeed[i] = Math.random();
}
const sphereGeom = new THREE.BufferGeometry();
sphereGeom.setAttribute("position", new THREE.BufferAttribute(new Float32Array(SPHERE_COUNT * 3), 3));
sphereGeom.setAttribute("aOff",  new THREE.BufferAttribute(sOff, 3));
sphereGeom.setAttribute("aSize", new THREE.BufferAttribute(sSize, 1));
sphereGeom.setAttribute("aSeed", new THREE.BufferAttribute(sSeed, 1));

// shares the color/shape/time uniforms with the vortex
export const sphereUniforms = {
  uTime:      uniforms.uTime,
  uSpin:      uniforms.uSpin,
  uZoom:      uniforms.uZoom,
  uSize:      uniforms.uSize,
  uTex:       uniforms.uTex,
  uColorMode: uniforms.uColorMode,
  uColorA:    uniforms.uColorA,
  uColorB:    uniforms.uColorB,
  uFunnel:    uniforms.uFunnel,
  uSphereR:   { value: 0.9 },
};

const sphereMat = new THREE.ShaderMaterial({
  uniforms: sphereUniforms,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  vertexShader: /* glsl */`
    attribute vec3 aOff;
    attribute float aSize;
    attribute float aSeed;
    uniform float uTime, uSpin, uZoom, uSize, uSphereR, uColorMode, uFunnel;
    uniform vec3  uColorA, uColorB;
    varying float vBright;
    varying vec3  vColor;

    vec3 hue2rgb(float h) {
      h = fract(h);
      return clamp(abs(mod(h * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
    }

    void main() {
      float s = aSeed * 6.2831853;
      // slow self-rotation of the sphere
      float a = uSpin * 0.4 + uTime * 0.05;
      float ca = cos(a), sa = sin(a);
      vec3 d = vec3(aOff.x * ca - aOff.z * sa, aOff.y, aOff.x * sa + aOff.z * ca);
      float pulse = 1.0 + 0.05 * sin(uTime * 1.6 + s);
      vec3 pos = d * uSphereR * pulse;
      pos.z -= uFunnel;            // at the bottom of the funnel, where the tails converge
      pos *= uZoom;

      float rl = length(aOff);                          // 0 center -> 1 edge
      vBright = (0.55 + 0.45 * sin(uTime * 2.4 + s)) * (1.0 - 0.35 * rl);
      if (uColorMode < 0.5)      vColor = uColorA;
      else if (uColorMode < 1.5) vColor = mix(uColorA, uColorB, rl);
      else                       vColor = hue2rgb(rl * 0.6 + uTime * 0.05 + s * 0.04);

      vec4 mv = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mv;
      gl_PointSize = uSize * aSize * 1.15 * uZoom / max(-mv.z, 0.001);
    }
  `,
  fragmentShader: /* glsl */`
    uniform sampler2D uTex;
    varying float vBright;
    varying vec3  vColor;
    void main() {
      vec4 tex = texture2D(uTex, gl_PointCoord);
      if (tex.a < 0.05) discard;
      gl_FragColor = vec4(tex.rgb * vColor, tex.a * vBright);
    }
  `,
});
export const sphere = new THREE.Points(sphereGeom, sphereMat);
disk.add(sphere);

// ── Dark/bluish core sprite to reinforce the "hole" ─────────────
export const core = new THREE.Sprite(new THREE.SpriteMaterial({
  map: (() => {
    const s = 128, c = document.createElement("canvas"); c.width = c.height = s;
    const ctx = c.getContext("2d");
    const g = ctx.createRadialGradient(s/2, s/2, 0, s/2, s/2, s/2);
    g.addColorStop(0, "rgba(18,38,78,0.9)");
    g.addColorStop(0.5, "rgba(8,18,42,0.4)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g; ctx.fillRect(0,0,s,s);
    return new THREE.CanvasTexture(c);
  })(),
  transparent: true, depthWrite: false, blending: THREE.NormalBlending,
}));
core.scale.setScalar(1.6);
scene.add(core);
