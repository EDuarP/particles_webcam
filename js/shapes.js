import * as THREE from "three";

// White texture with the chosen shape (tinted later by the color in the shader).
export function makeShapeTexture(shape) {
  const s = 64, c = document.createElement("canvas");
  c.width = c.height = s;
  const g = c.getContext("2d");
  g.clearRect(0, 0, s, s);
  g.fillStyle = "#ffffff";
  g.strokeStyle = "#ffffff";
  g.lineJoin = "round";
  g.lineCap = "round";
  g.shadowColor = "#ffffff";
  g.shadowBlur = 5;
  const cx = s / 2, cy = s / 2;

  if (shape === "circle") {
    const grd = g.createRadialGradient(cx, cy, 0, cx, cy, s * 0.42);
    grd.addColorStop(0, "#ffffff");
    grd.addColorStop(0.6, "#ffffff");
    grd.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grd;
    g.beginPath(); g.arc(cx, cy, s * 0.42, 0, Math.PI * 2); g.fill();
  } else if (shape === "triangle") {
    const R = s * 0.4;
    g.beginPath();
    for (let k = 0; k < 3; k++) {
      const a = -Math.PI / 2 + k * (Math.PI * 2 / 3);
      const px = cx + Math.cos(a) * R, py = cy + Math.sin(a) * R;
      k === 0 ? g.moveTo(px, py) : g.lineTo(px, py);
    }
    g.closePath(); g.fill();
  } else if (shape === "star") {
    const R = s * 0.42, r = R * 0.45;
    g.beginPath();
    for (let k = 0; k < 10; k++) {
      const rad = (k % 2 === 0) ? R : r;
      const a = -Math.PI / 2 + k * (Math.PI / 5);
      const px = cx + Math.cos(a) * rad, py = cy + Math.sin(a) * rad;
      k === 0 ? g.moveTo(px, py) : g.lineTo(px, py);
    }
    g.closePath(); g.fill();
  } else { // x
    g.lineWidth = 7;
    const m = 14;
    g.beginPath();
    g.moveTo(m, m);     g.lineTo(s - m, s - m);
    g.moveTo(s - m, m); g.lineTo(m, s - m);
    g.stroke();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  return tex;
}
