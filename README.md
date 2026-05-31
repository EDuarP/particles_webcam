# Particle Black Hole

A browser toy that renders a **particle black hole** — a logarithmic spiral vortex of ~30,000 X‑shaped particles with several tails winding into a 3D funnel, plus a glowing particle **core sphere** at the bottom of the funnel — composited over your **webcam** behind a dark filter. Everything is controlled with your **hands** via MediaPipe.

No build step, no dependencies to install: a single `index.html` that pulls Three.js and MediaPipe from a CDN.

## Demo controls

| Gesture | Action |
|---|---|
| **Left hand** open / close | Spin speed (closed fist = stop) |
| **Right hand** closed (fist) + move | Rotate the vortex (up/down + turn), as if you were holding it |
| **Right hand** open, pinch / spread fingers | Zoom in / out |

Right hand on the **right** side of the screen, left hand on the **left** — roles are assigned by on‑screen position (the view is mirrored, like a selfie).

### Dashboard (top‑right panel)

- **Shape** — particle sprite: X · Circle · Star · Triangle
- **Color** — White · Ice (cyan) · Fire (orange) · Matrix (green) · Purple → pink · Rainbow
- **Zoom** — overall scale (overridden by the open right hand)
- **Depth** — how deep the central funnel sinks (the core sphere follows it)
- **Twist** — how tightly the arms/tails wind toward the center
- **Turbulence** — organic noise; runs independently of the spin so it never looks frozen
- **Size** — particle point size
- **Core (sphere)** — radius of the central particle sphere (0 hides it)
- **Base speed** — spin speed used when no left hand is detected

## Run it

The webcam and MediaPipe need a secure context, so serve it over `http://localhost` (not `file://`):

```bash
# from the project folder
python3 -m http.server 8000
# then open http://localhost:8000/
```

Then click **Start camera** and allow camera access.

> Tested in Chromium‑based browsers. A WebGL‑capable GPU is recommended (the particles are rendered on the GPU).

## How it works

- **Rendering** — Three.js. Both the vortex and the core sphere are `THREE.Points` driven by custom GLSL `ShaderMaterial`s, so all the motion happens on the GPU. Particle positions are computed in the vertex shader from per‑particle attributes; nothing is updated on the CPU per frame.
- **Vortex shape** — particles flow continuously from the outer edge to the center (`uFlow` phase), positioned along a logarithmic spiral (`uWind`) split into `ARMS` tails, sinking into a funnel (`uFunnel`). Inner particles rotate faster.
- **Core sphere** — a uniform‑volume ball of particles placed at `-uFunnel` (the funnel throat where the tails converge). It shares the vortex's color/shape/time uniforms and rotates with the whole group.
- **Smooth speed** — spin and inflow use accumulated phase (`spinPhase`, `flowPhase`) integrated over time, so changing speed never causes a jump and stopping the spin still leaves turbulence + inflow alive.
- **Hands** — MediaPipe Tasks Vision `HandLandmarker` (2 hands, GPU, video mode). Finger openness = normalized thumb‑to‑index distance; a closed fist is detected below the `GRAB` threshold.
- **Compositing** — `<video>` (mirrored) → dark overlay (`#darken`) → transparent WebGL canvas → HUD.

## Files

The app is split into ES modules (no build step — `index.html` loads them directly):

- `index.html` — markup only (dashboard panel, intro, video/canvas).
- `css/styles.css` — all styles.
- `js/config.js` — shared constants and color palettes.
- `js/scene.js` — renderer, scene, camera, rotating `disk` group, resize.
- `js/shapes.js` — `makeShapeTexture()` (X · circle · star · triangle).
- `js/vortex.js` — the 30k-particle spiral `Points` + shared shader uniforms.
- `js/sphere.js` — the core particle sphere and the dark "hole" sprite.
- `js/state.js` — mutable state shared between sliders, hands and the loop.
- `js/controls.js` — wires the dashboard sliders and selects.
- `js/hands.js` — MediaPipe hand tracking and gesture → state mapping.
- `js/main.js` — entry point: animation loop and start button.

## Tweakables

Quick constants live in `js/config.js`:

- `COUNT` — vortex particle count (30,000)
- `SPHERE_COUNT` — core sphere particle count (9,000)
- `ARMS` — number of tails (5)
- `R_INNER` / `R_OUTER` — inner hole and outer disk radius
- `GRAB` — fist‑detection threshold (0.30)

## Credits

- [Three.js](https://threejs.org/)
- [MediaPipe Tasks Vision — Hand Landmarker](https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker)
