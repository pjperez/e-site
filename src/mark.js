/**
 * The e mark, built from the curve it is named after.
 *
 * The bowl is r = a·e^(bθ) swept just past one and a half turns, so the letter
 * and the equation are the same object. The points running the curve are the
 * agent loop compounding outward from a small core — not a particle field.
 */

import {
  CatmullRomCurve3,
  Color,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PointLight,
  Scene,
  SphereGeometry,
  TubeGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

const A = 0.4;
const GROWTH = 0.118;
const SWEEP = Math.PI * 2.92;
// Turn the whole curve so its outer terminal lands at the lower right, where a
// lowercase e opens.
const PHASE = -0.52 - (SWEEP % (Math.PI * 2));
const STEPS = 300;
const SAMPLES = 540;
const RUNNERS = 34;

function bowl() {
  const points = [];
  for (let i = 0; i <= STEPS; i += 1) {
    const theta = (i / STEPS) * SWEEP;
    const radius = A * Math.exp(GROWTH * theta);
    const angle = theta + PHASE;
    points.push(
      new Vector3(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
        Math.sin(theta * 0.7) * 0.05,
      ),
    );
  }
  return points;
}

export function mountMark(canvas, stage) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const renderer = new WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.setClearColor(0x000000, 0);

  const scene = new Scene();
  const camera = new PerspectiveCamera(31, 1, 0.1, 60);
  camera.position.set(0, 0, 6.9);

  const mark = new Group();
  scene.add(mark);

  const points = bowl();
  const curve = new CatmullRomCurve3(points);
  const path = curve.getSpacedPoints(SAMPLES);

  const stroke = new MeshStandardMaterial({
    color: 0x9a79ff,
    emissive: new Color(0x5b31d6),
    emissiveIntensity: 0.9,
    metalness: 0.35,
    roughness: 0.25,
  });

  mark.add(new Mesh(new TubeGeometry(curve, 460, 0.042, 12, false), stroke));

  // The crossbar that turns the spiral into a letter. Its ends are read off the
  // bowl itself so the join lands on the curve instead of overshooting it.
  const rise = points.reduce((max, p) => Math.max(max, Math.abs(p.y)), 0);
  const barY = rise * 0.16;
  const near = points.filter((p) => Math.abs(p.y - barY) < rise * 0.16);
  const left = Math.min(...near.map((p) => p.x));
  const right = Math.max(...near.map((p) => p.x));
  const bar = new CatmullRomCurve3([
    new Vector3(left * 0.96, barY, 0),
    new Vector3((left + right) / 2, barY, 0.01),
    new Vector3(right * 0.96, barY, 0),
  ]);
  mark.add(new Mesh(new TubeGeometry(bar, 48, 0.042, 12, false), stroke));

  // Runners: loop iterations travelling the curve outward from the core.
  const runners = new InstancedMesh(
    new SphereGeometry(0.03, 10, 10),
    new MeshBasicMaterial({ color: 0xece5ff }),
    RUNNERS,
  );
  runners.frustumCulled = false;
  mark.add(runners);

  const seeds = Array.from({ length: RUNNERS }, (_, i) => i / RUNNERS);
  const matrix = new Matrix4();

  const placeRunners = (progress) => {
    for (let i = 0; i < RUNNERS; i += 1) {
      const t = (seeds[i] + progress) % 1;
      const point = path[Math.min(SAMPLES, Math.round(t * t * SAMPLES))];
      const scale = 0.4 + t * 1.2;
      matrix.makeScale(scale, scale, scale);
      matrix.setPosition(point.x, point.y, point.z);
      runners.setMatrixAt(i, matrix);
    }
    runners.instanceMatrix.needsUpdate = true;
  };

  const key = new PointLight(0xd8ccff, 70, 20, 2);
  key.position.set(3.1, 3, 4.4);
  scene.add(key);

  const rim = new PointLight(0x5eead4, 22, 15, 2);
  rim.position.set(-3.6, -2.4, 2.2);
  scene.add(rim);

  mark.rotation.set(-0.14, -0.08, 0);

  const composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  renderPass.clearAlpha = 0;
  composer.addPass(renderPass);
  const bloom = new UnrealBloomPass(new Vector2(1, 1), 0.58, 0.42, 0.22);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  const pointer = { x: 0, y: 0 };
  const onMove = (event) => {
    const box = stage.getBoundingClientRect();
    pointer.x = (event.clientX - box.left) / box.width - 0.5;
    pointer.y = (event.clientY - box.top) / box.height - 0.5;
  };
  const onLeave = () => {
    pointer.x = 0;
    pointer.y = 0;
  };
  stage.addEventListener('pointermove', onMove, { passive: true });
  stage.addEventListener('pointerleave', onLeave);

  const resize = () => {
    const box = stage.getBoundingClientRect();
    const width = Math.max(1, Math.round(box.width));
    const height = Math.max(1, Math.round(box.height));
    renderer.setSize(width, height, false);
    composer.setSize(width, height);
    bloom.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(stage);
  resize();

  let frame = 0;
  let last = 0;
  let travelled = 0;
  let onScreen = true;

  const draw = (now = 0) => {
    const delta = last ? Math.min((now - last) / 1000, 0.05) : 0;
    last = now;

    if (!reduced) {
      travelled = (travelled + delta * 0.06) % 1;
      mark.rotation.y += (pointer.x * 0.36 - mark.rotation.y) * 0.05;
      mark.rotation.x += (-0.14 - pointer.y * 0.22 - mark.rotation.x) * 0.05;
    }

    placeRunners(travelled);
    composer.render();

    frame =
      !reduced && onScreen && !document.hidden ? requestAnimationFrame(draw) : 0;
  };

  const restart = () => {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    if (reduced || !onScreen || document.hidden) return;
    last = 0;
    frame = requestAnimationFrame(draw);
  };

  const visibility = new IntersectionObserver(([entry]) => {
    onScreen = entry?.isIntersecting ?? true;
    restart();
  });
  visibility.observe(stage);
  document.addEventListener('visibilitychange', restart);

  draw();
  stage.classList.add('live');
}
