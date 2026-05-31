import * as THREE from "three";
import { BASE_PITCH } from "./config.js";

const canvas = document.getElementById("gl");

export const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
renderer.setClearColor(0x000000, 0);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

export const scene  = new THREE.Scene();
export const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
camera.position.set(0, 0, 7);

// Group we rotate with the hand (as if you were grabbing it)
export const disk = new THREE.Group();
disk.rotation.x = BASE_PITCH;
scene.add(disk);

export function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", resize);
resize();
