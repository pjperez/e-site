import {
  CatmullRomCurve3,
  Color,
  Group,
  IcosahedronGeometry,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  PointLight,
  Scene,
  ShaderMaterial,
  SRGBColorSpace,
  TubeGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three';
import {
  THREEUI_DOT_FRAGMENT_SHADER,
  THREEUI_DOT_VERTEX_SHADER,
} from './threeui-dot-matrix.js';

const supportsWebGL = () => {
  try {
    const testCanvas = document.createElement('canvas');
    return Boolean(
      window.WebGLRenderingContext &&
        (testCanvas.getContext('webgl2') || testCanvas.getContext('webgl')),
    );
  } catch {
    return false;
  }
};

export function mountThreeMark() {
  const canvas = document.getElementById('mark-canvas');
  const visual = document.querySelector('.hero-visual');
  if (!(canvas instanceof HTMLCanvasElement) || !visual || !supportsWebGL()) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const renderer = new WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.outputColorSpace = SRGBColorSpace;

  const scene = new Scene();
  const camera = new PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(0, 0, 7.4);

  const dotUniforms = {
    uTime: { value: 0 },
    uResolution: { value: new Vector2(1, 1) },
    uMouse: { value: new Vector2() },
    uColor: { value: new Color(0x8b5cf6) },
    uGridScale: { value: 34 },
    uMouseAmount: { value: 0.028 },
    uPulseSpeed: { value: 0.32 },
    uRadius: { value: 0.08 },
    uOpacity: { value: 0.18 },
  };
  const dotGeometry = new PlaneGeometry(2, 2);
  const dotMaterial = new ShaderMaterial({
    uniforms: dotUniforms,
    vertexShader: THREEUI_DOT_VERTEX_SHADER,
    fragmentShader: THREEUI_DOT_FRAGMENT_SHADER,
    transparent: true,
    depthWrite: false,
    depthTest: false,
  });
  const dotField = new Mesh(dotGeometry, dotMaterial);
  dotField.renderOrder = -1;
  scene.add(dotField);

  const mark = new Group();
  scene.add(mark);

  const violet = new MeshStandardMaterial({
    color: 0xa78bfa,
    emissive: 0x4c1d95,
    emissiveIntensity: 1.15,
    metalness: 0.35,
    roughness: 0.28,
  });
  const quietViolet = new MeshBasicMaterial({
    color: 0x8b5cf6,
    transparent: true,
    opacity: 0.22,
  });

  const spiralPoints = [];
  const turns = Math.PI * 4.15;
  for (let index = 0; index <= 260; index += 1) {
    const theta = (index / 260) * turns + 0.34;
    const radius = 0.082 * Math.exp(0.225 * theta);
    spiralPoints.push(
      new Vector3(
        Math.cos(theta) * radius,
        Math.sin(theta) * radius,
        Math.sin(theta * 0.5) * 0.08,
      ),
    );
  }

  const spiralCurve = new CatmullRomCurve3(spiralPoints);
  const spiral = new Mesh(
    new TubeGeometry(spiralCurve, 260, 0.035, 7, false),
    violet,
  );
  spiral.rotation.z = -0.22;
  mark.add(spiral);

  const railPoints = [
    new Vector3(-1.74, 0.44, 0.04),
    new Vector3(1.88, 0.44, 0.04),
  ];
  const rail = new Mesh(
    new TubeGeometry(
      new CatmullRomCurve3(railPoints),
      24,
      0.032,
      7,
      false,
    ),
    violet,
  );
  mark.add(rail);

  const moduleGeometry = new IcosahedronGeometry(0.045, 1);
  const moduleMaterial = new MeshBasicMaterial({ color: 0xd8ccff });
  const modules = new InstancedMesh(moduleGeometry, moduleMaterial, 5);
  const modulePositions = [
    [-1.52, 0.44, 0.04],
    [-0.76, 0.44, 0.04],
    [0.02, 0.44, 0.04],
    [0.82, 0.44, 0.04],
    [1.62, 0.44, 0.04],
  ];
  const matrix = new Matrix4();
  modulePositions.forEach(([x, y, z], index) => {
    matrix.makeTranslation(x, y, z);
    modules.setMatrixAt(index, matrix);
  });
  mark.add(modules);

  for (const scale of [1.09, 1.18]) {
    const echo = new Mesh(
      new TubeGeometry(spiralCurve, 180, 0.008, 5, false),
      quietViolet.clone(),
    );
    echo.scale.setScalar(scale);
    echo.rotation.z = -0.22;
    echo.position.z = -0.22 * scale;
    mark.add(echo);
  }

  const keyLight = new PointLight(0xc4b5fd, 42, 12, 2);
  keyLight.position.set(2.6, 2.8, 4);
  scene.add(keyLight);
  const fillLight = new PointLight(0x67e8f9, 16, 10, 2);
  fillLight.position.set(-3, -2, 2);
  scene.add(fillLight);

  mark.scale.setScalar(0.92);
  mark.rotation.set(-0.12, -0.08, 0.08);

  const pointer = { x: 0, y: 0 };
  const dotTarget = new Vector2();
  visual.addEventListener(
    'pointermove',
    (event) => {
      const bounds = visual.getBoundingClientRect();
      pointer.x = (event.clientX - bounds.left) / bounds.width - 0.5;
      pointer.y = (event.clientY - bounds.top) / bounds.height - 0.5;
    },
    { passive: true },
  );
  visual.addEventListener('pointerleave', () => {
    pointer.x = 0;
    pointer.y = 0;
  });

  const resize = () => {
    const bounds = visual.getBoundingClientRect();
    renderer.setSize(bounds.width, bounds.height, false);
    renderer.getDrawingBufferSize(dotUniforms.uResolution.value);
    camera.aspect = bounds.width / bounds.height;
    camera.updateProjectionMatrix();
  };
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(visual);
  resize();

  let frameId = 0;
  let previousTime = 0;
  let isVisible = true;
  const render = (time = 0) => {
    const delta = Math.min((time - previousTime) / 1000, 0.05);
    previousTime = time;
    dotUniforms.uTime.value = time * 0.001;
    dotTarget.set(pointer.x * 2, -pointer.y * 2);
    dotUniforms.uMouse.value.lerp(dotTarget, 0.05);

    if (!reduceMotion) {
      mark.rotation.y += (pointer.x * 0.34 - mark.rotation.y) * 0.045;
      mark.rotation.x += (-pointer.y * 0.2 - 0.12 - mark.rotation.x) * 0.045;
      mark.rotation.z += delta * 0.035;
    }
    renderer.render(scene, camera);
    if (!reduceMotion && !document.hidden && isVisible) {
      frameId = requestAnimationFrame(render);
    }
  };

  const restart = () => {
    cancelAnimationFrame(frameId);
    if (!document.hidden && isVisible && !reduceMotion) {
      previousTime = performance.now();
      frameId = requestAnimationFrame(render);
    }
  };
  const visibilityObserver = new IntersectionObserver(([entry]) => {
    isVisible = entry?.isIntersecting ?? true;
    restart();
  });
  visibilityObserver.observe(visual);
  document.addEventListener('visibilitychange', restart);

  render();
  visual.classList.add('is-ready');
}
