'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { Play, Pause, RotateCcw, Zap, Ruler, Weight, CircleDashed } from 'lucide-react';
import * as THREE from 'three';

const GRAVITY = 9.8;
const RAMP_LENGTH = 8;
const RAMP_THICKNESS = 0.5;
const RAMP_WIDTH = 3;
const BLOCK_SIZE = 1;

export default function InclinedPlane3DTool() {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartCanvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const rampGroupRef = useRef<THREE.Group | null>(null);
  const blockRef = useRef<THREE.Mesh | null>(null);
  const trailMeshRef = useRef<THREE.Mesh | null>(null);
  const trailPositionsRef = useRef<number[]>([]);
  const angleRef = useRef(30);
  const massRef = useRef(2);
  const frictionRef = useRef(0.2);
  const posRef = useRef(0);
  const velRef = useRef(0);
  const timeRef = useRef(0);
  const runningRef = useRef(false);
  const pausedRef = useRef(false);
  const animationIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);
  const isDraggingRef = useRef(false);
  const prevMouseRef = useRef({ x: 0, y: 0 });
  const cameraAngleRef = useRef({ theta: Math.PI / 6, phi: Math.PI / 4 });
  const cameraDistRef = useRef(14);
  const velocityDataRef = useRef<{ t: number; v: number }[]>([]);
  const accelDataRef = useRef<{ t: number; a: number }[]>([]);

  const [angle, setAngle] = useState(30);
  const [mass, setMass] = useState(2);
  const [friction, setFriction] = useState(0.2);
  const [displayTime, setDisplayTime] = useState(0);
  const [displayPos, setDisplayPos] = useState(0);
  const [displayVel, setDisplayVel] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const acceleration = useCallback(() => {
    const theta = (angleRef.current * Math.PI) / 180;
    const a = GRAVITY * (Math.sin(theta) - frictionRef.current * Math.cos(theta));
    return Math.max(0, a);
  }, []);

  const maxPosition = useCallback(() => {
    return RAMP_LENGTH - BLOCK_SIZE * 0.6;
  }, []);

  // 初始化3D场景
  const initScene = useCallback(() => {
    if (!containerRef.current) return;
    const w = containerRef.current.clientWidth;
    const h = containerRef.current.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0e1a);
    scene.fog = new THREE.Fog(0x0a0e1a, 15, 40);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 星空粒子
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 800;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      starPositions[i * 3] = (Math.random() - 0.5) * 80;
      starPositions[i * 3 + 1] = Math.random() * 40 + 5;
      starPositions[i * 3 + 2] = (Math.random() - 0.5) * 80;
    }
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.08,
      transparent: true,
      opacity: 0.6,
    });
    scene.add(new THREE.Points(starGeometry, starMaterial));

    // 地面
    const groundGeo = new THREE.PlaneGeometry(40, 40);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.9,
      metalness: 0.1,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -2;
    ground.receiveShadow = true;
    scene.add(ground);

    // 斜面组
    const rampGroup = new THREE.Group();
    rampGroupRef.current = rampGroup;
    scene.add(rampGroup);

    // 斜面主体（楔形）
    const rampShape = new THREE.Shape();
    rampShape.moveTo(0, 0);
    rampShape.lineTo(RAMP_LENGTH, 0);
    rampShape.lineTo(0, RAMP_LENGTH * Math.tan(Math.PI / 3));
    rampShape.lineTo(0, 0);
    const rampGeo = new THREE.ExtrudeGeometry(rampShape, {
      depth: RAMP_WIDTH,
      bevelEnabled: false,
    });
    const rampMat = new THREE.MeshStandardMaterial({
      color: 0x6366f1,
      roughness: 0.7,
      metalness: 0.2,
    });
    const ramp = new THREE.Mesh(rampGeo, rampMat);
    ramp.position.z = -RAMP_WIDTH / 2;
    ramp.castShadow = true;
    ramp.receiveShadow = true;
    rampGroup.add(ramp);

    // 斜面上表面高亮边
    const edgeGeo = new THREE.BoxGeometry(RAMP_LENGTH, 0.05, RAMP_WIDTH + 0.05);
    const edgeMat = new THREE.MeshStandardMaterial({
      color: 0x818cf8,
      emissive: 0x4f46e5,
      emissiveIntensity: 0.3,
      roughness: 0.5,
    });
    const topEdge = new THREE.Mesh(edgeGeo, edgeMat);
    topEdge.position.set(RAMP_LENGTH / 2, 0.025, 0);
    topEdge.castShadow = false;
    topEdge.receiveShadow = false;
    rampGroup.add(topEdge);

    // 木块
    const blockGeo = new THREE.BoxGeometry(BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    const blockMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      roughness: 0.6,
      metalness: 0.1,
    });
    const block = new THREE.Mesh(blockGeo, blockMat);
    block.castShadow = true;
    block.receiveShadow = true;
    blockRef.current = block;
    rampGroup.add(block);

    // 拖尾
    const trailGeo = new THREE.BufferGeometry();
    const trailMat = new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
    });
    const trail = new THREE.Mesh(trailGeo, trailMat);
    trailMeshRef.current = trail;
    rampGroup.add(trail);

    // 光照
    const ambientLight = new THREE.AmbientLight(0x6366f1, 0.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(5, 10, 5);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 50;
    dirLight.shadow.camera.left = -15;
    dirLight.shadow.camera.right = 15;
    dirLight.shadow.camera.top = 15;
    dirLight.shadow.camera.bottom = -15;
    dirLight.shadow.bias = -0.0001;
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0x6366f1, 0.8, 20);
    pointLight.position.set(-3, 4, -3);
    scene.add(pointLight);

    const fillLight = new THREE.PointLight(0xf59e0b, 0.4, 15);
    fillLight.position.set(3, 2, 4);
    scene.add(fillLight);

    updateCamera();
    updateBlockPosition(0);
    updateRampAngle(angleRef.current);

    // 鼠标交互
    const canvas = renderer.domElement;
    canvas.addEventListener('mousedown', (e) => {
      isDraggingRef.current = true;
      prevMouseRef.current = { x: e.clientX, y: e.clientY };
    });
    window.addEventListener('mouseup', () => {
      isDraggingRef.current = false;
    });
    canvas.addEventListener('mousemove', (e) => {
      if (!isDraggingRef.current) return;
      const dx = e.clientX - prevMouseRef.current.x;
      const dy = e.clientY - prevMouseRef.current.y;
      cameraAngleRef.current.theta -= dx * 0.01;
      cameraAngleRef.current.phi = Math.max(
        0.1,
        Math.min(Math.PI / 2 - 0.1, cameraAngleRef.current.phi + dy * 0.01)
      );
      updateCamera();
      prevMouseRef.current = { x: e.clientX, y: e.clientY };
    });
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      cameraDistRef.current = Math.max(
        5,
        Math.min(30, cameraDistRef.current + e.deltaY * 0.01)
      );
      updateCamera();
    }, { passive: false });

    // 触摸支持
    let touchPrev = { x: 0, y: 0 };
    let touchDist = 0;
    canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        touchPrev = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        touchDist = Math.sqrt(dx * dx + dy * dy);
      }
    });
    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (e.touches.length === 1) {
        const dx = e.touches[0].clientX - touchPrev.x;
        const dy = e.touches[0].clientY - touchPrev.y;
        cameraAngleRef.current.theta -= dx * 0.01;
        cameraAngleRef.current.phi = Math.max(
          0.1,
          Math.min(Math.PI / 2 - 0.1, cameraAngleRef.current.phi + dy * 0.01)
        );
        updateCamera();
        touchPrev = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const newDist = Math.sqrt(dx * dx + dy * dy);
        cameraDistRef.current = Math.max(
          5,
          Math.min(30, cameraDistRef.current + (touchDist - newDist) * 0.05)
        );
        updateCamera();
        touchDist = newDist;
      }
    }, { passive: false });

    renderFrame();
  }, []);

  const updateCamera = useCallback(() => {
    if (!cameraRef.current) return;
    const { theta, phi } = cameraAngleRef.current;
    const r = cameraDistRef.current;
    const x = r * Math.cos(phi) * Math.sin(theta);
    const y = r * Math.sin(phi) + 1;
    const z = r * Math.cos(phi) * Math.cos(theta);
    cameraRef.current.position.set(x, y, z);
    cameraRef.current.lookAt(2, 1.5, 0);
  }, []);

  const updateRampAngle = useCallback((deg: number) => {
    if (!rampGroupRef.current) return;
    // 斜面底部在原点，旋转绕底端
    const maxAngle = 85;
    const d = Math.min(Math.max(deg, 0), maxAngle);
    const rad = (d * Math.PI) / 180;
    rampGroupRef.current.rotation.z = rad;
    // 调整位置让斜面底端落在地面附近
    rampGroupRef.current.position.set(-RAMP_LENGTH * 0.3, -1.5, 0);
  }, []);

  const updateBlockPosition = useCallback((s: number) => {
    if (!blockRef.current) return;
    // s 是沿斜面方向的位移（从顶端为0到底端为 maxPos）
    const maxS = maxPosition();
    const clampedS = Math.max(0, Math.min(s, maxS));
    // 木块中心位置：沿斜面方向 distance = clampedS
    // 木块中心在斜面上方 BLOCK_SIZE/2 处
    const centerX = clampedS;
    const centerY = BLOCK_SIZE / 2 + 0.03; // 斜面上表面之上
    const centerZ = 0;
    blockRef.current.position.set(centerX, centerY, centerZ);
    blockRef.current.rotation.z = 0; // 方块与斜面平行
  }, [maxPosition]);

  const updateTrail = useCallback(() => {
    if (!trailMeshRef.current || !blockRef.current) return;
    const pos = blockRef.current.position.clone();
    trailPositionsRef.current.push(pos.x, pos.y, pos.z);
    // 保留最近 100 个点
    if (trailPositionsRef.current.length > 300) {
      trailPositionsRef.current = trailPositionsRef.current.slice(-300);
    }
    const positions = new Float32Array(trailPositionsRef.current);
    trailMeshRef.current.geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(positions, 3)
    );
  }, []);

  const renderFrame = useCallback(() => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;
    rendererRef.current.render(sceneRef.current, cameraRef.current);
  }, []);

  // 绘制曲线
  const drawChart = useCallback(() => {
    const canvas = chartCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // 背景网格
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = (h / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    const vData = velocityDataRef.current;
    const aData = accelDataRef.current;
    if (vData.length < 2) return;

    const maxT = Math.max(5, vData[vData.length - 1].t);
    const maxV = Math.max(5, ...vData.map((d) => d.v));
    const maxA = Math.max(5, ...aData.map((d) => d.a));

    // 速度曲线（蓝色）
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    vData.forEach((d, i) => {
      const x = (d.t / maxT) * w;
      const y = h - (d.v / maxV) * (h * 0.9) - h * 0.05;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // 加速度曲线（橙色）
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    aData.forEach((d, i) => {
      const x = (d.t / maxT) * w;
      const y = h - (d.a / maxA) * (h * 0.9) - h * 0.05;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // 图例
    ctx.font = '11px Inter, sans-serif';
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(8, 6, 12, 3);
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('速度', 24, 12);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(70, 6, 12, 3);
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('加速度', 86, 12);
  }, []);

  // 动画循环
  const animate = useCallback(() => {
    if (!runningRef.current || pausedRef.current) {
      animationIdRef.current = requestAnimationFrame(animate);
      renderFrame();
      return;
    }

    const now = performance.now();
    const dt = Math.min((now - lastTimeRef.current) / 1000, 0.033);
    lastTimeRef.current = now;

    const theta = (angleRef.current * Math.PI) / 180;
    let a = GRAVITY * (Math.sin(theta) - frictionRef.current * Math.cos(theta));

    if (a <= 0 || posRef.current >= maxPosition()) {
      a = 0;
      if (posRef.current >= maxPosition()) {
        // 到底停止，轻微回弹
        velRef.current = 0;
        runningRef.current = false;
        setIsRunning(false);
      }
    } else {
      velRef.current += a * dt;
      posRef.current += velRef.current * dt;
      timeRef.current += dt;
      if (posRef.current > maxPosition()) {
        posRef.current = maxPosition();
        velRef.current = 0;
        runningRef.current = false;
        setIsRunning(false);
      }
      velocityDataRef.current.push({ t: timeRef.current, v: velRef.current });
      accelDataRef.current.push({ t: timeRef.current, a });
      if (velocityDataRef.current.length > 300) {
        velocityDataRef.current = velocityDataRef.current.slice(-300);
        accelDataRef.current = accelDataRef.current.slice(-300);
      }
    }

    updateBlockPosition(posRef.current);
    updateTrail();

    // 节流更新显示（~15fps）
    if (Math.floor(timeRef.current * 15) !== Math.floor((timeRef.current - dt) * 15)) {
      setDisplayTime(timeRef.current);
      setDisplayPos(posRef.current);
      setDisplayVel(velRef.current);
      drawChart();
    }

    renderFrame();
    animationIdRef.current = requestAnimationFrame(animate);
  }, [maxPosition, updateBlockPosition, updateTrail, renderFrame, drawChart]);

  const handleStart = () => {
    if (angleRef.current <= 0) return;
    const theta = (angleRef.current * Math.PI) / 180;
    if (frictionRef.current * Math.cos(theta) >= Math.sin(theta)) return; // 摩擦力过大
    if (posRef.current >= maxPosition()) handleReset();

    runningRef.current = true;
    pausedRef.current = false;
    setIsRunning(true);
    lastTimeRef.current = performance.now();
    if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
    animationIdRef.current = requestAnimationFrame(animate);
  };

  const handlePause = () => {
    pausedRef.current = !pausedRef.current;
    if (!pausedRef.current) {
      lastTimeRef.current = performance.now();
    }
  };

  const handleReset = () => {
    runningRef.current = false;
    pausedRef.current = false;
    setIsRunning(false);
    posRef.current = 0;
    velRef.current = 0;
    timeRef.current = 0;
    velocityDataRef.current = [{ t: 0, v: 0 }];
    accelDataRef.current = [{ t: 0, a: 0 }];
    trailPositionsRef.current = [];
    setDisplayTime(0);
    setDisplayPos(0);
    setDisplayVel(0);
    updateBlockPosition(0);
    drawChart();
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
      animationIdRef.current = requestAnimationFrame(animate);
    }
  };

  // 角度变化实时更新斜面
  useEffect(() => {
    angleRef.current = angle;
    updateRampAngle(angle);
    // 重设木块位置（保持在顶端附近）
    if (!runningRef.current) {
      posRef.current = 0;
      updateBlockPosition(0);
    }
    renderFrame();
  }, [angle, updateRampAngle, updateBlockPosition, renderFrame]);

  useEffect(() => {
    massRef.current = mass;
  }, [mass]);

  useEffect(() => {
    frictionRef.current = friction;
  }, [friction]);

  // 初始化
  useEffect(() => {
    initScene();
    velocityDataRef.current = [{ t: 0, v: 0 }];
    accelDataRef.current = [{ t: 0, a: 0 }];
    drawChart();

    // 启动闲置渲染循环
    animationIdRef.current = requestAnimationFrame(animate);

    // 响应式
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      rendererRef.current.setSize(w, h);
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      renderFrame();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, [initScene, animate, drawChart, renderFrame]);

  const a = acceleration();
  const isStatic = a <= 0.001;

  return (
    <div className="w-full h-full flex gap-3">
      {/* 左侧控制面板 */}
      <div className="w-56 shrink-0 bg-white/5 dark:bg-white/[0.04] border border-white/10 rounded-xl p-4 backdrop-blur-xl flex flex-col gap-4">
        <div>
          <h3 className="text-sm font-semibold text-indigo-300 mb-1 flex items-center gap-2">
            <Ruler className="w-4 h-4" />
            斜面角度
          </h3>
          <input
            type="range"
            min={0}
            max={85}
            step={1}
            value={angle}
            onChange={(e) => setAngle(Number(e.target.value))}
            className="w-full accent-indigo-500 h-2 rounded-full appearance-none bg-white/10 cursor-pointer"
          />
          <div className="text-right text-xs text-slate-400 mt-1">
            <span className="text-lg font-bold text-white">{angle}</span>°
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-amber-300 mb-1 flex items-center gap-2">
            <Weight className="w-4 h-4" />
            木块质量
          </h3>
          <input
            type="range"
            min={0.1}
            max={20}
            step={0.1}
            value={mass}
            onChange={(e) => setMass(Number(e.target.value))}
            className="w-full accent-amber-500 h-2 rounded-full appearance-none bg-white/10 cursor-pointer"
          />
          <div className="text-right text-xs text-slate-400 mt-1">
            <span className="text-lg font-bold text-white">{mass.toFixed(1)}</span> kg
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-emerald-300 mb-1 flex items-center gap-2">
            <CircleDashed className="w-4 h-4" />
            摩擦系数
          </h3>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={friction}
            onChange={(e) => setFriction(Number(e.target.value))}
            className="w-full accent-emerald-500 h-2 rounded-full appearance-none bg-white/10 cursor-pointer"
          />
          <div className="text-right text-xs text-slate-400 mt-1">
            <span className="text-lg font-bold text-white">{friction.toFixed(2)}</span> μ
          </div>
        </div>

        {isStatic && (
          <div className="text-xs bg-amber-500/10 text-amber-300 rounded-lg p-2 text-center border border-amber-500/20">
            摩擦力过大，木块静止
          </div>
        )}

        {/* 控制按钮 */}
        <div className="flex gap-2 mt-auto">
          {!isRunning || pausedRef.current ? (
            <button
              onClick={handleStart}
              disabled={isStatic}
              className="flex-1 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg font-medium text-sm flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Play className="w-4 h-4" />
              开始
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="flex-1 h-10 bg-amber-500 text-white rounded-lg font-medium text-sm flex items-center justify-center gap-1.5 hover:bg-amber-600 transition-colors"
            >
              <Pause className="w-4 h-4" />
              暂停
            </button>
          )}
          <button
            onClick={handleReset}
            className="h-10 px-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 中间3D场景 */}
      <div className="flex-1 flex flex-col gap-3 min-w-0">
        <div
          ref={containerRef}
          className="flex-1 rounded-xl border border-white/10 bg-[#0a0e1a] overflow-hidden cursor-grab active:cursor-grabbing min-h-0"
        />
      </div>

      {/* 右侧数据+曲线 */}
      <div className="w-60 shrink-0 flex flex-col gap-3">
        {/* 实时数据 */}
        <div className="bg-white/5 dark:bg-white/[0.04] border border-white/10 rounded-xl p-4 backdrop-blur-xl">
          <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Zap className="w-3.5 h-3.5" />
            实时数据
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-400">时间</span>
              <span className="text-lg font-mono font-bold text-white">
                {displayTime.toFixed(2)}
                <span className="text-xs text-slate-500 ml-1">s</span>
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-400">位移</span>
              <span className="text-lg font-mono font-bold text-cyan-300">
                {displayPos.toFixed(2)}
                <span className="text-xs text-slate-500 ml-1">m</span>
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-400">速度</span>
              <span className="text-lg font-mono font-bold text-blue-400">
                {displayVel.toFixed(2)}
                <span className="text-xs text-slate-500 ml-1">m/s</span>
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-400">加速度</span>
              <span className="text-lg font-mono font-bold text-amber-400">
                {a.toFixed(2)}
                <span className="text-xs text-slate-500 ml-1">m/s²</span>
              </span>
            </div>
          </div>
        </div>

        {/* 数据曲线 */}
        <div className="flex-1 bg-white/5 dark:bg-white/[0.04] border border-white/10 rounded-xl p-3 backdrop-blur-xl min-h-0">
          <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">v-t / a-t 曲线</h3>
          <canvas
            ref={chartCanvasRef}
            width={300}
            height={140}
            className="w-full h-auto"
          />
        </div>

        {/* 提示 */}
        <div className="text-[11px] text-slate-500 px-1 leading-relaxed">
          💡 鼠标拖拽旋转视角，滚轮缩放
        </div>
      </div>
    </div>
  );
}
