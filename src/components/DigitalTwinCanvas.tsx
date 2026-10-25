import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RotateCcw, ZoomIn, ZoomOut, User, Activity, Heart, Wind, Brain } from 'lucide-react';

interface DigitalTwinCanvasProps {
  onSelectOrgan?: (organName: string) => void;
  selectedOrgan?: string | null;
  onOpenFullModal?: () => void;
  healthScore?: number;
}

export default function DigitalTwinCanvas({
  onSelectOrgan,
  selectedOrgan,
  onOpenFullModal,
  healthScore = 92
}: DigitalTwinCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<any>(null);
  const sceneRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const bodyGroupRef = useRef<any>(null);
  const heartMeshRef = useRef<any>(null);
  const lungsGroupRef = useRef<any>(null);
  const brainMeshRef = useRef<any>(null);
  const animFrameIdRef = useRef<number | null>(null);

  const [activeLayer, setActiveLayer] = useState<'all' | 'organs' | 'skeletal' | 'vascular'>('all');

  // Mouse interaction state for orbital rotation
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 360;
    const height = container.clientHeight || 420;

    // 1. SCENE with Pure White Background (#FFFFFF)
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);
    sceneRef.current = scene;

    // 2. CAMERA
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
    camera.position.set(0, 0.2, 5.2);
    cameraRef.current = camera;

    // 3. RENDERER (Clean white, anti-aliased)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0xffffff, 1);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // Clear any previous child nodes
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // 4. LIGHTING (Soft modern medical studio lighting)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0x3b82f6, 1.8);
    keyLight.position.set(3, 4, 5);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x06b6d4, 1.5);
    rimLight.position.set(-3, 2, -3);
    scene.add(rimLight);

    const softFillLight = new THREE.DirectionalLight(0xec4899, 0.8);
    softFillLight.position.set(0, -3, 3);
    scene.add(softFillLight);

    // Subtle floor shadow ring for ground contact
    const shadowGeo = new THREE.RingGeometry(0.3, 1.2, 32);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x94a3b8,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = Math.PI / 2;
    shadowMesh.position.y = -2.1;
    scene.add(shadowMesh);

    // 5. ANATOMICAL HUMAN BODY MANNEQUIN
    const bodyGroup = new THREE.Group();
    bodyGroupRef.current = bodyGroup;
    scene.add(bodyGroup);

    // Modern semi-translucent anatomical silhouette material
    const skinMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x3b82f6,
      emissive: 0x1d4ed8,
      emissiveIntensity: 0.15,
      roughness: 0.25,
      metalness: 0.1,
      transmission: 0.65,
      thickness: 0.8,
      transparent: true,
      opacity: 0.6,
      wireframe: false
    });

    const wireframeOverlayMaterial = new THREE.MeshBasicMaterial({
      color: 0x60a5fa,
      wireframe: true,
      transparent: true,
      opacity: 0.15
    });

    // Torso & Pelvis
    const chestGeo = new THREE.CylinderGeometry(0.48, 0.38, 0.95, 24);
    const chestMesh = new THREE.Mesh(chestGeo, skinMaterial);
    chestMesh.position.y = 0.65;
    bodyGroup.add(chestMesh);

    const chestWire = new THREE.Mesh(chestGeo, wireframeOverlayMaterial);
    chestWire.position.y = 0.65;
    bodyGroup.add(chestWire);

    const abdomenGeo = new THREE.CylinderGeometry(0.38, 0.36, 0.6, 24);
    const abdomenMesh = new THREE.Mesh(abdomenGeo, skinMaterial);
    abdomenMesh.position.y = -0.05;
    bodyGroup.add(abdomenMesh);

    const pelvisGeo = new THREE.CylinderGeometry(0.36, 0.42, 0.45, 24);
    const pelvisMesh = new THREE.Mesh(pelvisGeo, skinMaterial);
    pelvisMesh.position.y = -0.52;
    bodyGroup.add(pelvisMesh);

    // Head & Neck
    const neckGeo = new THREE.CylinderGeometry(0.16, 0.18, 0.3, 16);
    const neckMesh = new THREE.Mesh(neckGeo, skinMaterial);
    neckMesh.position.y = 1.25;
    bodyGroup.add(neckMesh);

    const headGeo = new THREE.SphereGeometry(0.32, 24, 24);
    headGeo.scale(1, 1.2, 1.05);
    const headMesh = new THREE.Mesh(headGeo, skinMaterial);
    headMesh.position.y = 1.65;
    bodyGroup.add(headMesh);

    const headWire = new THREE.Mesh(headGeo, wireframeOverlayMaterial);
    headWire.position.y = 1.65;
    bodyGroup.add(headWire);

    // Glowing Brain inside head
    const brainGeo = new THREE.SphereGeometry(0.2, 16, 16);
    const brainMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 0.9,
      roughness: 0.3
    });
    const brainMesh = new THREE.Mesh(brainGeo, brainMat);
    brainMesh.position.set(0, 1.68, 0.03);
    brainMeshRef.current = brainMesh;
    bodyGroup.add(brainMesh);

    // Glowing Heart in Chest
    const heartGeo = new THREE.SphereGeometry(0.12, 16, 16);
    heartGeo.scale(1, 1.25, 0.85);
    const heartMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xdc2626,
      emissiveIntensity: 1.2,
      roughness: 0.2
    });
    const heartMesh = new THREE.Mesh(heartGeo, heartMat);
    heartMesh.position.set(-0.09, 0.72, 0.18);
    heartMeshRef.current = heartMesh;
    bodyGroup.add(heartMesh);

    // Glowing Lungs in Thorax
    const lungsGroup = new THREE.Group();
    lungsGroupRef.current = lungsGroup;
    const lungMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.7,
      roughness: 0.4,
      transparent: true,
      opacity: 0.85
    });

    const leftLungGeo = new THREE.CapsuleGeometry(0.12, 0.32, 12, 16);
    const leftLungMesh = new THREE.Mesh(leftLungGeo, lungMat);
    leftLungMesh.position.set(-0.2, 0.75, 0.08);
    leftLungMesh.rotation.z = 0.12;
    lungsGroup.add(leftLungMesh);

    const rightLungGeo = new THREE.CapsuleGeometry(0.12, 0.32, 12, 16);
    const rightLungMesh = new THREE.Mesh(rightLungGeo, lungMat);
    rightLungMesh.position.set(0.2, 0.75, 0.08);
    rightLungMesh.rotation.z = -0.12;
    lungsGroup.add(rightLungMesh);

    bodyGroup.add(lungsGroup);

    // Internal Digestive / Gut System (Glowing cyan/magenta)
    const gutGeo = new THREE.TorusGeometry(0.16, 0.05, 12, 24);
    const gutMat = new THREE.MeshStandardMaterial({
      color: 0xa855f7,
      emissive: 0x7e22ce,
      emissiveIntensity: 0.7,
      roughness: 0.3
    });
    const gutMesh = new THREE.Mesh(gutGeo, gutMat);
    gutMesh.position.set(0, 0.05, 0.12);
    gutMesh.rotation.x = Math.PI / 2.3;
    bodyGroup.add(gutMesh);

    // Shoulders & Arms
    const createLimb = (
      rTop: number,
      rBottom: number,
      len: number,
      posX: number,
      posY: number,
      rotZ: number
    ) => {
      const geo = new THREE.CylinderGeometry(rTop, rBottom, len, 16);
      const mesh = new THREE.Mesh(geo, skinMaterial);
      mesh.position.set(posX, posY, 0);
      mesh.rotation.z = rotZ;
      bodyGroup.add(mesh);

      const wire = new THREE.Mesh(geo, wireframeOverlayMaterial);
      wire.position.set(posX, posY, 0);
      wire.rotation.z = rotZ;
      bodyGroup.add(wire);
      return mesh;
    };

    // Upper arms & Forearms
    createLimb(0.13, 0.11, 0.65, -0.66, 0.7, -0.22); // Left upper arm
    createLimb(0.11, 0.09, 0.65, -0.84, 0.12, -0.15); // Left forearm
    createLimb(0.13, 0.11, 0.65, 0.66, 0.7, 0.22);  // Right upper arm
    createLimb(0.11, 0.09, 0.65, 0.84, 0.12, 0.15);  // Right forearm

    // Hands
    const handGeo = new THREE.BoxGeometry(0.12, 0.22, 0.06);
    const leftHand = new THREE.Mesh(handGeo, skinMaterial);
    leftHand.position.set(-0.94, -0.32, 0);
    bodyGroup.add(leftHand);

    const rightHand = new THREE.Mesh(handGeo, skinMaterial);
    rightHand.position.set(0.94, -0.32, 0);
    bodyGroup.add(rightHand);

    // Upper legs & Thighs
    createLimb(0.19, 0.14, 0.85, -0.25, -1.05, 0.04); // Left thigh
    createLimb(0.14, 0.11, 0.85, -0.25, -1.85, 0.02); // Left calf
    createLimb(0.19, 0.14, 0.85, 0.25, -1.05, -0.04); // Right thigh
    createLimb(0.14, 0.11, 0.85, 0.25, -1.85, -0.02); // Right calf

    // Feet
    const footGeo = new THREE.BoxGeometry(0.16, 0.1, 0.32);
    const leftFoot = new THREE.Mesh(footGeo, skinMaterial);
    leftFoot.position.set(-0.25, -2.32, 0.08);
    bodyGroup.add(leftFoot);

    const rightFoot = new THREE.Mesh(footGeo, skinMaterial);
    rightFoot.position.set(0.25, -2.32, 0.08);
    bodyGroup.add(rightFoot);

    // Center model at reasonable height
    bodyGroup.position.y = 0.2;

    // 6. ANIMATION LOOP (Pulsating heart, breathing lungs, slight idle turn)
    const clock = new THREE.Clock();

    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // Pulsating heart at ~72 bpm (1.2 Hz)
      if (heartMeshRef.current) {
        const beatCycle = (Math.sin(elapsedTime * 7.5) + 1) / 2;
        const scale = 1 + beatCycle * 0.18;
        heartMeshRef.current.scale.set(scale, scale * 1.15, scale * 0.9);
      }

      // Breathing lungs (gentle respiration)
      if (lungsGroupRef.current) {
        const breathCycle = Math.sin(elapsedTime * 2.2);
        const lungScale = 1 + breathCycle * 0.06;
        lungsGroupRef.current.scale.set(lungScale, lungScale, lungScale);
      }

      // Gentle brain neural wave
      if (brainMeshRef.current) {
        const brainIntensity = 0.7 + Math.sin(elapsedTime * 4) * 0.3;
        (brainMeshRef.current.material as any).emissiveIntensity = brainIntensity;
      }

      // Subtle slow continuous turntable rotation if not actively dragging
      if (!isDraggingRef.current && bodyGroupRef.current) {
        bodyGroupRef.current.rotation.y += 0.003;
      }

      renderer.render(scene, camera);
    };

    animate();

    // 7. RESIZE LISTENER
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      cameraRef.current.aspect = newW / newH;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(newW, newH);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      renderer.dispose();
    };
  }, []);

  // Mouse rotation handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || !bodyGroupRef.current) return;

    const deltaX = e.clientX - previousMousePositionRef.current.x;
    const deltaY = e.clientY - previousMousePositionRef.current.y;

    bodyGroupRef.current.rotation.y += deltaX * 0.015;
    bodyGroupRef.current.rotation.x = Math.max(-0.4, Math.min(0.4, bodyGroupRef.current.rotation.x + deltaY * 0.008));

    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  // Zoom controls
  const handleZoom = (direction: 'in' | 'out') => {
    if (!cameraRef.current) return;
    const delta = direction === 'in' ? -0.4 : 0.4;
    cameraRef.current.position.z = Math.max(3.2, Math.min(7.5, cameraRef.current.position.z + delta));
  };

  const handleReset = () => {
    if (!bodyGroupRef.current || !cameraRef.current) return;
    bodyGroupRef.current.rotation.set(0, 0, 0);
    cameraRef.current.position.set(0, 0.2, 5.2);
  };

  const handleLayerCycle = () => {
    const layers: ('all' | 'organs' | 'skeletal' | 'vascular')[] = ['all', 'organs', 'skeletal', 'vascular'];
    const nextIdx = (layers.indexOf(activeLayer) + 1) % layers.length;
    setActiveLayer(layers[nextIdx]);
  };

  return (
    <div className="relative w-full h-[460px] bg-white rounded-2xl overflow-hidden select-none border border-slate-100 shadow-sm flex flex-col justify-between">
      
      {/* 3D WebGL Canvas (Pure White Background) */}
      <div
        ref={mountRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="w-full h-full cursor-grab active:cursor-grabbing bg-white"
        title="Click and drag to rotate 360°"
      />

      {/* ─── FLOATING ORGAN CALLOUT PINS WITH DASHED LINES ─── */}
      {/* 1. Heart (Top Left) */}
      <div 
        onClick={() => onSelectOrgan?.('Heart')}
        className={`absolute top-10 left-4 z-20 flex items-center gap-2 cursor-pointer group transition-all ${
          selectedOrgan === 'Heart' ? 'scale-105 ring-2 ring-rose-400 rounded-xl' : ''
        }`}
      >
        <div className="w-9 h-9 rounded-xl bg-white border border-rose-100 shadow-sm flex items-center justify-center text-rose-500 transition-all group-hover:scale-105 group-hover:shadow-md">
          <Heart size={18} className="fill-rose-500 animate-pulse" />
        </div>
        <div className="text-left bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-slate-100 shadow-xs">
          <div className="text-xs font-semibold text-slate-800 leading-tight">Heart</div>
          <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded">Normal</span>
        </div>
        {/* Dashed connector line leading to chest */}
        <div className="hidden sm:block w-12 border-t-2 border-dashed border-rose-300/80 -rotate-6 transform origin-left"></div>
      </div>

      {/* 2. Lungs (Mid Left) */}
      <div 
        onClick={() => onSelectOrgan?.('Lungs')}
        className={`absolute top-36 left-4 z-20 flex items-center gap-2 cursor-pointer group transition-all ${
          selectedOrgan === 'Lungs' ? 'scale-105 ring-2 ring-blue-400 rounded-xl' : ''
        }`}
      >
        <div className="w-9 h-9 rounded-xl bg-white border border-blue-100 shadow-sm flex items-center justify-center text-blue-500 transition-all group-hover:scale-105 group-hover:shadow-md">
          <Wind size={18} className="text-blue-500" />
        </div>
        <div className="text-left bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-slate-100 shadow-xs">
          <div className="text-xs font-semibold text-slate-800 leading-tight">Lungs</div>
          <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded">Good</span>
        </div>
        {/* Dashed connector line */}
        <div className="hidden sm:block w-14 border-t-2 border-dashed border-blue-300/80 rotate-3 transform origin-left"></div>
      </div>

      {/* 3. Muscles (Lower Left) */}
      <div 
        onClick={() => onSelectOrgan?.('Muscles')}
        className={`absolute bottom-32 left-4 z-20 flex items-center gap-2 cursor-pointer group transition-all ${
          selectedOrgan === 'Muscles' ? 'scale-105 ring-2 ring-cyan-400 rounded-xl' : ''
        }`}
      >
        <div className="w-9 h-9 rounded-xl bg-white border border-cyan-100 shadow-sm flex items-center justify-center text-cyan-500 transition-all group-hover:scale-105 group-hover:shadow-md">
          <Activity size={18} className="text-cyan-500" />
        </div>
        <div className="text-left bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-slate-100 shadow-xs">
          <div className="text-xs font-semibold text-slate-800 leading-tight">Muscles</div>
          <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded">Strong</span>
        </div>
        {/* Dashed connector line */}
        <div className="hidden sm:block w-10 border-t-2 border-dashed border-cyan-300/80 -rotate-8 transform origin-left"></div>
      </div>

      {/* 4. Mental / Brain (Upper Right) */}
      <div 
        onClick={() => onSelectOrgan?.('Mental')}
        className={`absolute top-16 right-4 z-20 flex items-center gap-2 cursor-pointer group flex-row-reverse transition-all ${
          selectedOrgan === 'Mental' ? 'scale-105 ring-2 ring-emerald-400 rounded-xl' : ''
        }`}
      >
        <div className="w-9 h-9 rounded-xl bg-white border border-emerald-100 shadow-sm flex items-center justify-center text-emerald-500 transition-all group-hover:scale-105 group-hover:shadow-md">
          <Brain size={18} className="text-emerald-500" />
        </div>
        <div className="text-right bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-slate-100 shadow-xs">
          <div className="text-xs font-semibold text-slate-800 leading-tight">Mental</div>
          <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded">Stable</span>
        </div>
        {/* Dashed connector line */}
        <div className="hidden sm:block w-12 border-t-2 border-dashed border-emerald-300/80 rotate-12 transform origin-right"></div>
      </div>

      {/* ─── BOTTOM LEFT OVERLAY: OVERALL HEALTH SCORE ─── */}
      <div 
        onClick={onOpenFullModal}
        className="absolute bottom-4 left-4 z-30 bg-[#0B132B] hover:bg-[#0f1b3d] text-white rounded-2xl p-3 pr-4 shadow-xl border border-slate-700/40 flex items-center gap-3 cursor-pointer transition-all hover:scale-[1.02]"
        title="Click to view deep 3D biometric diagnostics"
      >
        {/* Circular Ring Score */}
        <div className="relative w-12 h-12 flex items-center justify-center">
          <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-slate-800 stroke-current"
              strokeWidth="3.2"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className="text-cyan-400 stroke-current"
              strokeDasharray="92, 100"
              strokeWidth="3.2"
              strokeLinecap="round"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
            <span className="text-sm font-bold text-white">{healthScore}</span>
            <span className="text-[8px] text-slate-400">/100</span>
          </div>
        </div>

        {/* Text & Mini Green Sparkline */}
        <div>
          <div className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">
            Overall Health Score
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs font-semibold text-emerald-400">Excellent</span>
            {/* SVG neon green mini sparkline */}
            <svg className="w-14 h-4" viewBox="0 0 60 16" fill="none">
              <path
                d="M1 12L10 9L18 13L28 4L38 8L48 2L59 6"
                stroke="#34d399"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* ─── BOTTOM RIGHT CONTROLS PILL ─── */}
      <div className="absolute bottom-4 right-4 z-30 bg-white/95 backdrop-blur-md rounded-xl p-1 shadow-md border border-slate-200/80 flex items-center gap-1">
        <button
          onClick={handleReset}
          className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          title="Reset View"
        >
          <RotateCcw size={14} />
        </button>
        <button
          onClick={() => handleZoom('out')}
          className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut size={14} />
        </button>
        <button
          onClick={() => handleZoom('in')}
          className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn size={14} />
        </button>
        <button
          onClick={handleLayerCycle}
          className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          title={`Cycle Layer (${activeLayer})`}
        >
          <User size={14} />
        </button>
      </div>

    </div>
  );
}
