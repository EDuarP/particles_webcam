import * as THREE from "three";
import { COUNT, ARMS, R_INNER, R_OUTER, TWO_PI } from "./config.js";
import { makeShapeTexture } from "./shapes.js";
import { renderer, disk } from "./scene.js";

// Per-particle attributes
const aArm    = new Float32Array(COUNT);
const aJit    = new Float32Array(COUNT);
const aHeight = new Float32Array(COUNT);
const aSize   = new Float32Array(COUNT);
const aSeed   = new Float32Array(COUNT);

for (let i = 0; i < COUNT; i++) {
  const arm  = i % ARMS;
  aArm[i]    = arm * (TWO_PI / ARMS);
  aJit[i]    = (Math.random() - 0.5) * 0.85;   // arm width
  aHeight[i] = (Math.random() - 0.5);
  aSize[i]   = 0.6 + Math.random() * 0.9;
  aSeed[i]   = Math.random();
}

const geom = new THREE.BufferGeometry();
geom.setAttribute("position", new THREE.BufferAttribute(new Float32Array(COUNT * 3), 3));
geom.setAttribute("aArm",    new THREE.BufferAttribute(aArm, 1));
geom.setAttribute("aJit",    new THREE.BufferAttribute(aJit, 1));
geom.setAttribute("aHeight", new THREE.BufferAttribute(aHeight, 1));
geom.setAttribute("aSize",   new THREE.BufferAttribute(aSize, 1));
geom.setAttribute("aSeed",   new THREE.BufferAttribute(aSeed, 1));

// Uniforms shared with the core sphere (see sphere.js)
export const uniforms = {
  uTime:      { value: 0 },
  uSpin:      { value: 0 },   // accumulated spin phase (speed set by the left hand)
  uFlow:      { value: 0 },   // accumulated inflow-to-center phase
  uZoom:      { value: 1.0 },
  uChaos:     { value: 1.0 },
  uInner:     { value: R_INNER },
  uOuter:     { value: R_OUTER },
  uWind:      { value: 2.2 },
  uFunnel:    { value: 2.6 },
  uSize:      { value: 26.0 * renderer.getPixelRatio() },
  uTex:       { value: makeShapeTexture("x") },
  uColorMode: { value: 0 },                       // 0 solid, 1 gradient, 2 rainbow
  uColorA:    { value: new THREE.Color(0xffffff) },
  uColorB:    { value: new THREE.Color(0xffffff) },
};

const material = new THREE.ShaderMaterial({
  uniforms,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  vertexShader: /* glsl */`
    attribute float aArm;
    attribute float aJit;
    attribute float aHeight;
    attribute float aSize;
    attribute float aSeed;
    uniform float uTime, uSpin, uFlow, uZoom, uChaos, uInner, uOuter, uWind, uFunnel, uSize;
    uniform float uColorMode;
    uniform vec3  uColorA, uColorB;
    varying float vBright;
    varying vec3  vColor;

    vec3 hue2rgb(float h) {
      h = fract(h);
      return clamp(abs(mod(h * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
    }

    void main() {
      // continuous inflow: each particle travels from the outside (0) to the center (1)
      float flow = fract(aSeed + uFlow);
      float r    = mix(uOuter, uInner, pow(flow, 0.7));

      float s    = aSeed * 6.2831853;
      // turbulence INDEPENDENT of the spin -> never freezes
      float turb = uChaos * (sin(r * 3.5 - uTime * 1.1 + s) * 0.10 + sin(uTime * 0.8 + s) * 0.05);
      float rr   = max(r + turb, uInner * 0.5);

      // logarithmic spiral -> arms/tails that wind toward the center
      float wind  = uWind * log(r / uInner);
      float omega = 0.6 + 0.8 * pow(uInner / max(r, 0.001), 0.5);  // inner ones spin faster
      float ang   = aArm + aJit * (r / uOuter) + wind + uSpin * omega;

      vec3 pos;
      pos.x = cos(ang) * rr;
      pos.y = sin(ang) * rr;
      // funnel: the center sinks (3D vortex)
      float funnel = -uFunnel * (1.0 - smoothstep(0.0, uOuter, rr));
      float thick  = uChaos * 0.18 * (r / uOuter) * aHeight;
      pos.z = funnel + thick + uChaos * 0.12 * sin(ang * 1.5 + uTime * 1.4 + s);
      pos *= uZoom;

      // fades in on the outer edge and fades out as it is swallowed by the center
      float fin  = smoothstep(0.0, 0.05, flow);
      float fout = 1.0 - smoothstep(0.80, 1.0, flow);
      vBright = fin * fout * (0.72 + 0.28 * sin(uTime * 2.2 + s));

      // color: solid, gradient (by inflow progress) or rainbow
      if (uColorMode < 0.5)      vColor = uColorA;
      else if (uColorMode < 1.5) vColor = mix(uColorA, uColorB, flow);
      else                       vColor = hue2rgb(aArm * 0.159155 + flow * 0.25 + uTime * 0.03);

      vec4 mv = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mv;
      gl_PointSize = uSize * aSize * uZoom / max(-mv.z, 0.001);
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

export const points = new THREE.Points(geom, material);
disk.add(points);
