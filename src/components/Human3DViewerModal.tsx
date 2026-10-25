import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  X,
  Maximize2,
  Minimize2,
  RotateCcw,
  RotateCw,
  Sparkles,
  Activity,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Stethoscope,
  ChevronRight,
  ShieldCheck,
  Copy,
  Eye,
  Terminal,
  Layers,
  Key,
  Lock,
  Unlock,
  RefreshCw,
  ExternalLink,
  Compass,
  Check,
  Info,
  Code
} from 'lucide-react';
import {
  fetchBioDigitalAccessToken,
  getStoredBioDigitalAuth,
  clearStoredBioDigitalAuth,
  type BioDigitalErrorResponse
} from '../lib/biodigital';

export interface Human3DViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialFocus?: 'head' | 'foot' | 'full' | 'ulcer';
  patientName?: string;
  onApplyUlcerTag?: (tag: { site: string; condition: string; notes: string }) => void;
}

// Preset BioDigital Human Models
const BIODIGITAL_MODELS = [
  {
    id: 'dfu',
    name: 'Diabetic Foot Ulcer (DFU)',
    url: 'https://human.biodigital.com/viewer/?id=production/maleAdult/diabetic_foot_ulcer&lang=en'
  },
  {
    id: 'foot_ankle',
    name: 'Foot & Ankle Regional Anatomy',
    url: 'https://human.biodigital.com/viewer/?id=production/maleAdult/human_02_regional_male_foot_and_ankle&lang=en'
  },
  {
    id: 'full_body',
    name: 'Complete Human Body Anatomy',
    url: 'https://human.biodigital.com/viewer/?id=production/maleAdult/complete_male_anatomy&lang=en'
  }
];

export default function Human3DViewerModal({
  isOpen,
  onClose,
  initialFocus = 'foot',
  patientName = 'Shri Rajesh Verma (ABHA: 91-8291-3829-4412)',
  onApplyUlcerTag
}: Human3DViewerModalProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Engine selection: 'webgl' (Zero Auth Required, 100% Reliable) vs 'biodigital' (Cloud Stream with DK)
  const [engineMode, setEngineMode] = useState<'webgl' | 'biodigital'>('webgl');
  
  const [selectedModel, setSelectedModel] = useState(BIODIGITAL_MODELS[0].url);

  // BioDigital OAuth2 & Credential State
  const [storedAuth, setStoredAuth] = useState(() => getStoredBioDigitalAuth());
  const [developerKey, setDeveloperKey] = useState<string>(() => storedAuth.developerKey);
  const [developerSecret, setDeveloperSecret] = useState<string>(() => storedAuth.developerSecret);
  const [activeToken, setActiveToken] = useState<string | null>(() => storedAuth.token);
  const [tokenExpiresIn, setTokenExpiresIn] = useState<number>(() => storedAuth.expiresInMinutes);

  // OAuth2 Drawer/Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [isGeneratingToken, setIsGeneratingToken] = useState(false);
  const [authError, setAuthError] = useState<BioDigitalErrorResponse | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);

  // HumanAPI Status & Logs
  const [isApiReady, setIsApiReady] = useState(false);
  const [lastApiCommand, setLastApiCommand] = useState<string>('BioDigital & WebGL Engines Loaded');
  const [xrayActive, setXrayActive] = useState(false);
  const [copiedNotes, setCopiedNotes] = useState(false);
  const [tagApplied, setTagApplied] = useState(false);

  // WebGL 3D Anatomy State
  const webglMountRef = useRef<HTMLDivElement>(null);
  const webglControlsRef = useRef<{
    flyTo: (region: 'head' | 'foot' | 'full' | 'ulcer') => void;
    rotate: (dir: 'left' | 'right') => void;
    toggleAutoRotate: () => boolean;
    setLayer: (layer: string) => void;
  } | null>(null);
  const [autoRotate, setAutoRotate] = useState(false);

  // HumanAPI instance reference
  const humanApiRef = useRef<any>(null);
  const iframeId = 'biodigital-human-iframe';

  // Compute final iframe URL with developer key if present
  const computedIframeUrl = developerKey.trim()
    ? `${selectedModel}&dk=${encodeURIComponent(developerKey.trim())}`
    : selectedModel;

  // Keep auth expiration status synced
  useEffect(() => {
    const checkAuth = () => {
      const auth = getStoredBioDigitalAuth();
      setStoredAuth(auth);
      setActiveToken(auth.token);
      setTokenExpiresIn(auth.expiresInMinutes);
    };
    checkAuth();
    const timer = setInterval(checkAuth, 30000);
    return () => clearInterval(timer);
  }, []);

  // ─────────────────────────────────────────────────────────────
  // 1. Initialize BioDigital HumanAPI on iframe when in biodigital mode
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen || engineMode !== 'biodigital') return;

    let initTimer: any = null;

    const setupHumanApi = () => {
      if (typeof window !== 'undefined' && window.HumanAPI) {
        try {
          const iframeEl = document.getElementById(iframeId);
          if (!iframeEl) return;

          setLastApiCommand('Connecting new HumanAPI("biodigital-human-iframe")...');
          const human = new window.HumanAPI(iframeId);
          humanApiRef.current = human;

          human.on('human.ready', () => {
            setIsApiReady(true);
            setLastApiCommand('human.on("human.ready") => Connected to BioDigital Viewer!');

            if (initialFocus === 'head') {
              human.send('camera.set', { position: { x: 0, y: 150, z: 90 }, target: { x: 0, y: 140, z: 0 }, animate: true });
            } else if (initialFocus === 'foot' || initialFocus === 'ulcer') {
              human.send('camera.set', { position: { x: 18, y: -125, z: 65 }, target: { x: 12, y: -135, z: 12 }, animate: true });
            }
          });

          human.on('timeline.chapterTransition', (data: any) => {
            setLastApiCommand(`timeline.chapterTransition: Chapter ${data?.chapterIndex || 1}`);
          });

        } catch (err: any) {
          console.warn('HumanAPI init notice:', err);
        }
      } else {
        initTimer = setTimeout(setupHumanApi, 300);
      }
    };

    const domTimer = setTimeout(setupHumanApi, 200);

    return () => {
      clearTimeout(domTimer);
      if (initTimer) clearTimeout(initTimer);
      if (humanApiRef.current && typeof humanApiRef.current.destroy === 'function') {
        try {
          humanApiRef.current.destroy();
        } catch (_) {}
      }
    };
  }, [isOpen, engineMode, selectedModel, developerKey, initialFocus]);

  // ─────────────────────────────────────────────────────────────
  // 2. Initialize Procedural Three.js 3D WebGL Anatomy Model
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen || engineMode !== 'webgl' || !webglMountRef.current) return;

    const container = webglMountRef.current;
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 540;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a081e);
    scene.fog = new THREE.FogExp2(0x0a081e, 0.08);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 0.2, 3.8);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.replaceChildren(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x28325a, 1.4);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(3, 4, 4);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x4865ff, 2.8);
    rimLight.position.set(-3, 2, -3);
    scene.add(rimLight);

    // Floor Grid
    const gridHelper = new THREE.GridHelper(6, 24, 0x4865ff, 0x181c3a);
    gridHelper.position.y = -1.6;
    scene.add(gridHelper);

    // Anatomical Hierarchy
    const modelGroup = new THREE.Group();
    scene.add(modelGroup);

    const skinMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xd9c5b2,
      roughness: 0.35,
      metalness: 0.05,
      clearcoat: 0.25,
      transmission: 0.08,
      transparent: true,
      opacity: 0.94
    });

    // Head
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.45, 0);
    const craniumGeo = new THREE.SphereGeometry(0.24, 24, 20);
    craniumGeo.scale(0.9, 1.15, 0.95);
    headGroup.add(new THREE.Mesh(craniumGeo, skinMaterial));
    modelGroup.add(headGroup);

    // Torso
    const torsoGroup = new THREE.Group();
    torsoGroup.position.set(0, 0.72, 0);
    const chestGeo = new THREE.BoxGeometry(0.56, 0.44, 0.28, 4, 4, 4);
    torsoGroup.add(new THREE.Mesh(chestGeo, skinMaterial));
    modelGroup.add(torsoGroup);

    // Pelvis
    const pelvisGeo = new THREE.CylinderGeometry(0.26, 0.22, 0.26, 16);
    const pelvis = new THREE.Mesh(pelvisGeo, skinMaterial);
    pelvis.position.set(0, 0.32, 0);
    modelGroup.add(pelvis);

    // Limbs
    [-1, 1].forEach((side) => {
      // Arms
      const armGeo = new THREE.CylinderGeometry(0.065, 0.05, 0.75, 12);
      const arm = new THREE.Mesh(armGeo, skinMaterial);
      arm.position.set(side * 0.42, 0.5, 0);
      modelGroup.add(arm);

      // Legs
      const legGeo = new THREE.CylinderGeometry(0.1, 0.065, 1.35, 14);
      const leg = new THREE.Mesh(legGeo, skinMaterial);
      leg.position.set(side * 0.18, -0.45, 0);
      modelGroup.add(leg);
    });

    // Right Foot (Detailed Plantar Diabetic Ulcer Site)
    const rightFootGroup = new THREE.Group();
    rightFootGroup.position.set(0.18, -1.26, 0.05);

    const heelGeo = new THREE.SphereGeometry(0.078, 14, 14);
    heelGeo.scale(1, 0.72, 1.25);
    const heel = new THREE.Mesh(heelGeo, skinMaterial);
    heel.position.set(0, -0.05, -0.05);
    rightFootGroup.add(heel);

    const forefootGeo = new THREE.BoxGeometry(0.14, 0.075, 0.24);
    const forefoot = new THREE.Mesh(forefootGeo, skinMaterial);
    forefoot.position.set(0, -0.08, 0.13);
    rightFootGroup.add(forefoot);

    // Active Diabetic Ulcer Crater
    const ulcerGroup = new THREE.Group();
    ulcerGroup.position.set(0.02, -0.12, 0.11);
    ulcerGroup.rotation.x = Math.PI / 2;

    const haloGeo = new THREE.RingGeometry(0.028, 0.055, 24);
    const haloMat = new THREE.MeshBasicMaterial({ color: 0xff3333, side: THREE.DoubleSide, transparent: true, opacity: 0.85 });
    ulcerGroup.add(new THREE.Mesh(haloGeo, haloMat));

    const craterGeo = new THREE.CircleGeometry(0.022, 24);
    const craterMat = new THREE.MeshStandardMaterial({ color: 0x7a0c0c, roughness: 0.9 });
    ulcerGroup.add(new THREE.Mesh(craterGeo, craterMat));

    // Radar Rings
    const radarGeo = new THREE.RingGeometry(0.05, 0.065, 32);
    const radarMat = new THREE.MeshBasicMaterial({ color: 0xff4848, side: THREE.DoubleSide, transparent: true, opacity: 0.9 });
    const radarRing = new THREE.Mesh(radarGeo, radarMat);
    ulcerGroup.add(radarRing);

    rightFootGroup.add(ulcerGroup);
    modelGroup.add(rightFootGroup);

    // Left Foot
    const leftFoot = rightFootGroup.clone();
    leftFoot.position.set(-0.18, -1.26, 0.05);
    leftFoot.remove(leftFoot.children[2]); // remove ulcer from healthy foot
    modelGroup.add(leftFoot);

    // Camera targets
    const currentCamPos = camera.position.clone();
    const targetCamPos = new THREE.Vector3(0, 0.2, 3.8);
    const currentLookAt = new THREE.Vector3(0, 0, 0);
    const targetLookAt = new THREE.Vector3(0, 0, 0);

    if (initialFocus === 'head') {
      targetCamPos.set(0, 1.6, 1.25);
      targetLookAt.set(0, 1.5, 0);
    } else if (initialFocus === 'foot' || initialFocus === 'ulcer') {
      targetCamPos.set(0.42, -1.15, 0.95);
      targetLookAt.set(0.18, -1.36, 0.12);
    }

    // Drag interaction
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let isAutoRotating = false;
    let radarTime = 0;

    const onPointerDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };
    const onPointerMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      modelGroup.rotation.y += deltaX * 0.008;
      modelGroup.rotation.x = Math.max(-0.4, Math.min(0.4, modelGroup.rotation.x + deltaY * 0.004));
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };
    const onPointerUp = () => { isDragging = false; };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      targetCamPos.multiplyScalar(1 + e.deltaY * 0.0015);
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);
    dom.addEventListener('wheel', onWheel, { passive: false });

    // Animation Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      currentCamPos.lerp(targetCamPos, 0.065);
      currentLookAt.lerp(targetLookAt, 0.065);
      camera.position.copy(currentCamPos);
      camera.lookAt(currentLookAt);

      if (isAutoRotating) modelGroup.rotation.y += 0.007;

      radarTime += 0.04;
      const s = 1 + (Math.sin(radarTime) * 0.5 + 0.5) * 1.6;
      radarRing.scale.set(s, s, 1);
      (radarRing.material as any).opacity = Math.max(0, 1 - (s - 1) / 1.6);

      renderer.render(scene, camera);
    };
    animate();

    webglControlsRef.current = {
      flyTo: (region) => {
        if (region === 'head') {
          targetCamPos.set(0, 1.6, 1.25);
          targetLookAt.set(0, 1.5, 0);
        } else if (region === 'foot' || region === 'ulcer') {
          targetCamPos.set(0.42, -1.15, 0.95);
          targetLookAt.set(0.18, -1.36, 0.12);
        } else {
          targetCamPos.set(0, 0.2, 3.8);
          targetLookAt.set(0, 0, 0);
        }
      },
      rotate: (dir) => {
        modelGroup.rotation.y += dir === 'left' ? Math.PI / 4 : -Math.PI / 4;
      },
      toggleAutoRotate: () => {
        isAutoRotating = !isAutoRotating;
        return isAutoRotating;
      },
      setLayer: (layer) => {
        skinMaterial.wireframe = layer === 'muscular' || layer === 'neuropathy';
        skinMaterial.opacity = layer === 'integumentary' ? 0.98 : layer === 'all' ? 0.94 : 0.25;
      }
    };

    const onResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animId);
      dom.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
      dom.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
    };
  }, [isOpen, engineMode]);

  // ─────────────────────────────────────────────────────────────
  // Unified Command Handlers (Works on Both BioDigital and WebGL)
  // ─────────────────────────────────────────────────────────────
  const dispatchCommand = (action: 'head' | 'foot' | 'reset' | 'rotate_left' | 'rotate_right' | 'xray') => {
    if (engineMode === 'biodigital') {
      const human = humanApiRef.current;
      if (action === 'head') {
        human?.send('camera.set', { position: { x: 0, y: 150, z: 90 }, target: { x: 0, y: 140, z: 0 }, animate: true });
        setLastApiCommand('human.send("camera.set", { target: cranial_axis })');
      } else if (action === 'foot') {
        human?.send('camera.set', { position: { x: 18, y: -125, z: 65 }, target: { x: 12, y: -135, z: 12 }, animate: true });
        setLastApiCommand('human.send("camera.set", { target: diabetic_foot_ulcer })');
      } else if (action === 'reset') {
        human?.send('camera.reset');
        setLastApiCommand('human.send("camera.reset")');
      } else if (action === 'rotate_left') {
        human?.send('camera.orbit', { yaw: 45 });
        setLastApiCommand('human.send("camera.orbit", { yaw: 45 })');
      } else if (action === 'rotate_right') {
        human?.send('camera.orbit', { yaw: -45 });
        setLastApiCommand('human.send("camera.orbit", { yaw: -45 })');
      } else if (action === 'xray') {
        if (xrayActive) {
          human?.send('scene.disableXray');
          setXrayActive(false);
          setLastApiCommand('human.send("scene.disableXray")');
        } else {
          human?.send('scene.enableXray');
          setXrayActive(true);
          setLastApiCommand('human.send("scene.enableXray")');
        }
      }
    } else {
      // WebGL 3D Controls
      if (action === 'head') {
        webglControlsRef.current?.flyTo('head');
        setLastApiCommand('3D WebGL Camera: Fly to Head Cranial Axis');
      } else if (action === 'foot') {
        webglControlsRef.current?.flyTo('foot');
        setLastApiCommand('3D WebGL Camera: Fly to Plantar Diabetic Foot Ulcer');
      } else if (action === 'reset') {
        webglControlsRef.current?.flyTo('full');
        setLastApiCommand('3D WebGL Camera: Reset Full Body View');
      } else if (action === 'rotate_left') {
        webglControlsRef.current?.rotate('left');
        setLastApiCommand('3D WebGL Orbit: Rotated Left 45°');
      } else if (action === 'rotate_right') {
        webglControlsRef.current?.rotate('right');
        setLastApiCommand('3D WebGL Orbit: Rotated Right 45°');
      } else if (action === 'xray') {
        const next = !xrayActive;
        setXrayActive(next);
        webglControlsRef.current?.setLayer(next ? 'neuropathy' : 'all');
        setLastApiCommand(next ? '3D WebGL: X-Ray Transparency ON' : '3D WebGL: X-Ray OFF');
      }
    }
  };

  // BioDigital OAuth2 Token Generation (Step 1 & Step 2)
  const handleGenerateToken = async () => {
    if (!developerKey.trim() || !developerSecret.trim()) {
      setAuthError({
        error_type: 'missing_credentials',
        error_code: '1001',
        error_message: 'Please enter both Developer Key and Developer Secret.'
      });
      return;
    }

    setIsGeneratingToken(true);
    setAuthError(null);
    setAuthSuccess(null);

    const result = await fetchBioDigitalAccessToken(developerKey.trim(), developerSecret.trim());
    setIsGeneratingToken(false);

    if (result.success) {
      setActiveToken(result.data.access_token);
      const minutes = Math.round((result.data.expires_in || 3600) / 60);
      setTokenExpiresIn(minutes);
      setAuthSuccess(`Bearer Token generated successfully! Expires in ${minutes} minutes.`);
      setLastApiCommand(`BioDigital OAuth2: Token generated (${result.data.token_type || 'Bearer'})`);
      setStoredAuth(getStoredBioDigitalAuth());
    } else {
      setAuthError(result.error);
      setLastApiCommand(`BioDigital OAuth2 Error: ${result.error.error_type} (${result.error.error_code})`);
    }
  };

  const handleSaveDeveloperKeyOnly = () => {
    if (!developerKey.trim()) return;
    localStorage.setItem('biodigital_dev_key', developerKey.trim());
    setAuthSuccess('Developer Key saved. Bound to 3D Viewer embed.');
    setStoredAuth(getStoredBioDigitalAuth());
    setLastApiCommand(`Developer Key saved: ${developerKey.trim().slice(0, 6)}...`);
  };

  const handleClearAuth = () => {
    clearStoredBioDigitalAuth();
    setDeveloperKey('');
    setDeveloperSecret('');
    setActiveToken(null);
    setTokenExpiresIn(0);
    setAuthSuccess(null);
    setAuthError(null);
    setStoredAuth(getStoredBioDigitalAuth());
    setLastApiCommand('BioDigital credentials and token cleared.');
  };

  // Preview encoded Basic Authorization string
  const basicAuthPreview = developerKey.trim() && developerSecret.trim()
    ? (typeof btoa !== 'undefined'
        ? btoa(`${encodeURIComponent(developerKey.trim())}:${encodeURIComponent(developerSecret.trim())}`)
        : '')
    : '';

  const curlCommandPreview = `curl -X POST https://apis.biodigital.com/oauth2/v2/token \\
  -H "Accept: application/json" \\
  -H "Content-Type: application/json;charset=UTF-8" \\
  -H "Authorization: Basic ${basicAuthPreview || '<base64_encoded_credentials>'}" \\
  -d '{"grant_type":"client_credentials","scope":"contentapi"}'`;

  const handleOpenBioDigitalDirect = () => {
    window.open(selectedModel, '_blank', 'width=1100,height=750');
  };

  // Copy clinical dossier to clipboard
  const handleCopyNotes = () => {
    const summary = `[HUMAN PATHOLOGY REPORT: DIABETIC FOOT ULCER]
Patient: ${patientName}
Platform: BioDigital Human & 3D WebGL Engine
Model: Diabetic Foot Ulcer (Wagner Grade 2)
Site: Plantar aspect, 1st & 2nd Metatarsal Head (Right Foot)
Clinical Findings:
1. Effects on Skin: Marked shear stress damage, anhidrosis from autonomic denervation, hyperkeratotic halo.
2. Effects on Muscles: Motor neuropathy causing intrinsic foot muscle volume loss, claw toes, and elevated plantar peak pressure (>55 N/cm²).
Ayush Chikitsa Protocol:
- Jatyadi Taila sterile gauze dressing OD for Vrana Ropana (granulation).
- Panchavalkala Kashaya parisheka (antiseptic bio-wash) prior to dressing.
- Glycemic tight control + Curcumin/Haridra 500mg BD.
- Total contact off-loading therapeutic footwear.`;

    navigator.clipboard.writeText(summary);
    setCopiedNotes(true);
    setTimeout(() => setCopiedNotes(false), 2500);
  };

  const handleApplyUlcerTag = () => {
    if (onApplyUlcerTag) {
      onApplyUlcerTag({
        site: 'Plantar Metatarsal Head (Right Foot)',
        condition: 'Diabetic Foot Ulcer (Wagner Grade 2)',
        notes: 'Verified via 3D Human Viewer: Integumentary shear breakdown with intrinsic muscle volume loss.'
      });
      setTagApplied(true);
      setTimeout(() => setTagApplied(false), 3000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      
      {/* ─────────────────────────────────────────────────────────────
          Modal Container (August Health Refined Aesthetic)
          ───────────────────────────────────────────────────────────── */}
      <div
        className={`w-full bg-[#f8f3eb] text-[#080331] rounded-[28px] border border-[#4d4439]/15 shadow-[0_25px_70px_rgba(0,0,0,0.35)] flex flex-col overflow-hidden transition-all duration-300 ${
          isFullscreen
            ? 'fixed inset-2 z-50 max-w-none max-h-none rounded-2xl'
            : 'max-w-[1300px] max-h-[94vh]'
        }`}
      >
        {/* ─── TOP HEADER BAR ─── */}
        <div className="px-6 py-3.5 bg-white border-b border-[#4d4439]/10 flex flex-wrap items-center justify-between gap-3 shrink-0">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#080331] flex items-center justify-center text-white shadow-sm">
              <Activity size={20} className="text-[#4865ff]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#4865ff] bg-[#4865ff]/10 px-2.5 py-0.5 rounded-full">
                  3D Human Viewer
                </span>
                <span className="text-xs text-stone/40">•</span>
                <span className="text-xs font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  {engineMode === 'webgl' ? '3D WebGL Engine Active' : isApiReady ? 'HumanAPI v3.0.0 Connected' : 'BioDigital Stream'}
                </span>
              </div>
              <h2 className="font-serif text-xl sm:text-2xl text-[#080331] font-normal leading-tight">
                Human Viewer in Popup Window
              </h2>
            </div>
          </div>

          {/* Engine Selector & Controls */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            
            {/* Dual Engine Switcher */}
            <div className="flex items-center bg-[#f8f3eb] p-1 rounded-full border border-[#4d4439]/15 text-xs">
              <button
                onClick={() => setEngineMode('webgl')}
                className={`px-3 py-1 rounded-full font-medium transition-all cursor-pointer flex items-center gap-1 ${
                  engineMode === 'webgl'
                    ? 'bg-[#080331] text-white shadow-sm'
                    : 'text-stone/70 hover:text-[#080331]'
                }`}
                title="Loads 3D procedural human model directly in WebGL with 0 external API key requirement"
              >
                <Sparkles size={12} className="text-[#4865ff]" />
                <span>3D WebGL (Instant)</span>
              </button>

              <button
                onClick={() => setEngineMode('biodigital')}
                className={`px-3 py-1 rounded-full font-medium transition-all cursor-pointer flex items-center gap-1 ${
                  engineMode === 'biodigital'
                    ? 'bg-[#4865ff] text-white shadow-sm'
                    : 'text-stone/70 hover:text-[#080331]'
                }`}
                title="Streams 3D model directly from BioDigital Cloud (Requires BioDigital developer key)"
              >
                <span>BioDigital Cloud</span>
              </button>
            </div>

            {/* Model Presets (If BioDigital mode) */}
            {engineMode === 'biodigital' && (
              <div className="hidden xl:flex items-center bg-[#f8f3eb] p-1 rounded-full border border-[#4d4439]/10 text-xs">
                {BIODIGITAL_MODELS.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => setSelectedModel(model.url)}
                    className={`px-2.5 py-1 rounded-full font-medium transition-all cursor-pointer whitespace-nowrap ${
                      selectedModel === model.url ? 'bg-white text-[#080331] shadow-xs' : 'text-stone/70 hover:text-[#080331]'
                    }`}
                  >
                    {model.name.split(' (')[0]}
                  </button>
                ))}
              </div>
            )}

            {/* BioDigital OAuth2 Credentials & Token Status Button */}
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 border shadow-xs ${
                activeToken
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                  : developerKey
                  ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                  : 'bg-white text-[#080331] border-[#4d4439]/20 hover:bg-[#ede6da]'
              }`}
              title="BioDigital OAuth2 Credentials & Access Token Manager"
            >
              {activeToken ? (
                <ShieldCheck size={14} className="text-emerald-600 animate-pulse" />
              ) : (
                <Key size={14} className="text-[#ff6d39]" />
              )}
              <span>
                {activeToken
                  ? `OAuth2 Active (${tokenExpiresIn}m)`
                  : developerKey
                  ? 'Key Configured'
                  : 'BioDigital OAuth2'}
              </span>
            </button>

            {/* Direct BioDigital Window Launcher */}
            <button
              onClick={handleOpenBioDigitalDirect}
              className="p-2 rounded-full hover:bg-[#ede6da] text-[#4865ff] transition-colors cursor-pointer"
              title="Launch official BioDigital Viewer in separate popup window"
            >
              <ExternalLink size={16} />
            </button>

            {/* Fullscreen Button */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              className="p-2 rounded-full hover:bg-[#f8f3eb] text-stone/70 hover:text-[#080331] transition-colors cursor-pointer"
            >
              {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              title="Close Popup Window"
              className="p-2 rounded-full hover:bg-red-50 text-stone/70 hover:text-red-600 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            Modal Body (Split-Screen: Left 3D Viewer, Right Clinical Dossier)
            ───────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 min-h-0 overflow-y-auto lg:overflow-hidden">
          
          {/* ─── LEFT COLUMN: 3D VIEWER CANVAS (7 Cols) ─── */}
          <div className="lg:col-span-7 bg-[#0a081e] relative flex flex-col min-h-[480px] lg:min-h-[620px] overflow-hidden border-r border-[#4d4439]/10">
            
            {/* Viewport 1: 3D WebGL Canvas (100% Reliable, 0 Key Needed) */}
            {engineMode === 'webgl' && (
              <div
                ref={webglMountRef}
                className="w-full h-full flex-1 cursor-grab active:cursor-grabbing relative"
                title="Click and drag to rotate 3D human model • Scroll to zoom"
              />
            )}

            {/* Viewport 2: Official BioDigital Human Iframe */}
            {engineMode === 'biodigital' && (
              <div className="w-full h-full flex-1 relative bg-[#0b0c16]">
                <iframe
                  id={iframeId}
                  name={iframeId}
                  src={computedIframeUrl}
                  className="w-full h-full border-0 bg-[#0b0c16]"
                  allow="fullscreen; xr-spatial-tracking"
                  title="BioDigital Human 3D Viewer"
                />

                {/* Authentication Helper Banner overlay if no DK is entered */}
                {!developerKey && (
                  <div className="absolute bottom-16 left-4 right-4 bg-black/85 backdrop-blur-md p-3.5 rounded-2xl border border-white/20 text-white text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xl animate-fade-in pointer-events-auto">
                    <div>
                      <div className="font-semibold text-amber-300 flex items-center gap-1.5">
                        <AlertTriangle size={14} />
                        <span>BioDigital Domain Authentication Required</span>
                      </div>
                      <p className="text-stone-300 text-[11px] mt-0.5 leading-relaxed">
                        BioDigital requires an authorized developer key (`dk`) or OAuth2 token to embed on localhost. Switch to <strong>3D WebGL</strong> for instant interactive 3D, or configure your credentials.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      <button
                        onClick={() => setIsAuthModalOpen(true)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-full font-medium text-xs cursor-pointer shadow-sm whitespace-nowrap flex items-center gap-1"
                      >
                        <Key size={12} />
                        <span>Configure OAuth2 / Key</span>
                      </button>
                      <button
                        onClick={() => setEngineMode('webgl')}
                        className="bg-[#4865ff] hover:bg-[#3855eb] text-white px-3 py-1.5 rounded-full font-medium text-xs cursor-pointer shadow-sm whitespace-nowrap"
                      >
                        Switch to 3D WebGL
                      </button>
                      <button
                        onClick={handleOpenBioDigitalDirect}
                        className="bg-white text-[#080331] hover:bg-stone-100 px-3 py-1.5 rounded-full font-medium text-xs cursor-pointer shadow-sm whitespace-nowrap"
                      >
                        Open in New Window
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Floating Top Controls Overlay */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
              
              {/* Camera Fly-To Controls (Unified across WebGL & HumanAPI) */}
              <div className="flex items-center gap-1.5 bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/15 pointer-events-auto shadow-xl text-xs">
                <button
                  onClick={() => dispatchCommand('head')}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-[#4865ff] text-white transition-all cursor-pointer font-medium"
                  title="Fly camera to cranial autonomic center"
                >
                  <Eye size={13} />
                  <span>Fly to Head</span>
                </button>

                <button
                  onClick={() => dispatchCommand('foot')}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600/85 hover:bg-red-600 text-white transition-all cursor-pointer font-medium shadow-md shadow-red-600/30 animate-pulse"
                  title="Fly camera to diabetic foot ulcer site"
                >
                  <AlertTriangle size={13} />
                  <span>Fly to Foot (DFU)</span>
                </button>

                <button
                  onClick={() => dispatchCommand('reset')}
                  className="px-2.5 py-1 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                  title="Reset full anatomical overview"
                >
                  Reset View
                </button>
              </div>

              {/* View Tools: X-Ray & Layer */}
              <div className="hidden sm:flex items-center gap-1.5 bg-black/75 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-white/15 pointer-events-auto text-xs text-white">
                <button
                  onClick={() => dispatchCommand('xray')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                    xrayActive ? 'bg-[#4865ff] text-white font-medium' : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                  title="Toggle anatomical X-Ray transparency"
                >
                  <Layers size={13} />
                  <span>X-Ray</span>
                </button>

                {engineMode === 'webgl' && (
                  <button
                    onClick={() => {
                      if (webglControlsRef.current) {
                        const state = webglControlsRef.current.toggleAutoRotate();
                        setAutoRotate(state);
                      }
                    }}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                      autoRotate ? 'bg-[#4865ff] text-white font-medium' : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Compass size={13} className={autoRotate ? 'animate-spin' : ''} />
                    <span>360° Orbit</span>
                  </button>
                )}
              </div>
            </div>

            {/* Bottom Manipulation Toolbar & HumanAPI Terminal */}
            <div className="absolute bottom-3 left-3 right-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pointer-events-none">
              
              {/* Rotation Buttons */}
              <div className="flex items-center gap-1 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 pointer-events-auto text-white shadow-xl self-start">
                <button
                  onClick={() => dispatchCommand('rotate_left')}
                  title="Rotate Model Left 45°"
                  className="p-1.5 rounded-full hover:bg-white/20 transition-colors cursor-pointer text-white/90 hover:text-white flex items-center gap-1 text-xs"
                >
                  <RotateCcw size={14} />
                  <span className="hidden md:inline text-[11px]">Rotate Left</span>
                </button>
                <span className="text-white/30 px-0.5">|</span>
                <button
                  onClick={() => dispatchCommand('rotate_right')}
                  title="Rotate Model Right 45°"
                  className="p-1.5 rounded-full hover:bg-white/20 transition-colors cursor-pointer text-white/90 hover:text-white flex items-center gap-1 text-xs"
                >
                  <RotateCw size={14} />
                  <span className="hidden md:inline text-[11px]">Rotate Right</span>
                </button>
              </div>

              {/* Action Terminal Log Indicator */}
              <div className="bg-black/85 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/15 pointer-events-auto text-[11px] text-emerald-400 font-mono flex items-center gap-2 shadow-lg truncate max-w-[420px]">
                <Terminal size={12} className="text-emerald-400 shrink-0" />
                <span className="truncate">{lastApiCommand}</span>
              </div>
            </div>

          </div>

          {/* ─── RIGHT COLUMN: CLINICAL DOSSIER & IN-TEXT TRIGGERS (5 Cols) ─── */}
          <div className="lg:col-span-5 bg-white p-6 sm:p-7 flex flex-col justify-between overflow-y-auto max-h-[660px]">
            
            <div className="space-y-5">
              
              {/* Patient Reference Header */}
              <div className="pb-3 border-b border-[#f0ece5] flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone/60">
                    Patient Reference
                  </span>
                  <div className="font-medium text-sm text-[#080331]">
                    {patientName}
                  </div>
                </div>
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-[#328a3b]/10 text-[#328a3b]">
                  OPD Active
                </span>
              </div>

              {/* Case Study Title */}
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#ff6d39] uppercase tracking-wider mb-1">
                  <Sparkles size={13} />
                  Clinical Guide &amp; Pathology
                </div>
                <h3 className="font-serif text-2xl sm:text-3xl text-[#080331] font-normal">
                  Diabetic Foot Ulcer
                </h3>
                <p className="text-xs text-stone/70 mt-1 italic">
                  Launch the Human Viewer in a popup window from your clinical text.
                </p>
              </div>

              {/* Interactive Text Guide (Matching User Prompt Verbatim) */}
              <div className="p-4.5 rounded-2xl bg-[#fbf1ec]/70 border border-[#ff6d39]/20 text-xs leading-relaxed text-[#080331]">
                <p className="font-medium text-[#080331] mb-2 text-[12.5px]">
                  Briefly, we can summarise the effect of diabetes on the main structures of the foot-ankle complex as:
                </p>

                {/* Section 1: Effects on Skin */}
                <div className="mt-3 p-3.5 rounded-xl bg-white/90 border border-[#4d4439]/10 shadow-sm">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-xs text-[#080331] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#ff6d39]"></span>
                      Effects on Skin:
                    </span>
                    <button
                      onClick={() => dispatchCommand('foot')}
                      className="text-[11px] font-semibold text-[#4865ff] hover:text-[#3852e6] hover:underline flex items-center gap-0.5 cursor-pointer bg-[#4865ff]/10 px-2 py-0.5 rounded-full"
                      title="Fly camera to inspect diabetic foot ulcer"
                    >
                      <span>[Fly to Skin]</span>
                      <ChevronRight size={11} />
                    </button>
                  </div>
                  <p className="text-stone/80 text-[11.5px] leading-relaxed">
                    Skin – and the soft tissues immediately underneath the skin - undergo greater compression and shear loading than usual, thus explaining the onset of tissue damage so deeply correlated to traumatic ulceration processes. Besides this, skin of the Diabetic foot suffers from loss of autonomic nervous control and consequently reduced hydration, making it less elastic and thus more vulnerable to the action of increased mechanical stress;
                  </p>
                </div>

                {/* Section 2: Effects on Muscles */}
                <div className="mt-3 p-3.5 rounded-xl bg-white/90 border border-[#4d4439]/10 shadow-sm">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-xs text-[#080331] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#328a3b]"></span>
                      Effects on Muscles:
                    </span>
                    <button
                      onClick={() => {
                        dispatchCommand('foot');
                        setTimeout(() => dispatchCommand('rotate_right'), 400);
                      }}
                      className="text-[11px] font-semibold text-[#328a3b] hover:text-[#286f2f] hover:underline flex items-center gap-0.5 cursor-pointer bg-[#328a3b]/10 px-2 py-0.5 rounded-full"
                      title="Focus foot muscles & rotate lateral view"
                    >
                      <span>[Inspect Muscles]</span>
                      <ChevronRight size={11} />
                    </button>
                  </div>
                  <p className="text-stone/80 text-[11.5px] leading-relaxed">
                    Diabetes mellitus causes severe damage to nerve conduction, thus causing a worsening in the management of the related muscle fibers. As a consequence, both intrinsic and extrinsic muscles of the foot-ankle complex are damaged in structure (reduction of muscle volume) and function (reduction of muscle strength, leading to biomechanical imbalances, claw toes, prominent metatarsal heads, and high pressure points).
                  </p>
                </div>

                {/* Section 3: Central Autonomic Axis */}
                <div className="mt-3 p-3.5 rounded-xl bg-white/90 border border-[#4d4439]/10 shadow-sm">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-xs text-[#080331] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#4865ff]"></span>
                      Central Autonomic Axis:
                    </span>
                    <button
                      onClick={() => dispatchCommand('head')}
                      className="text-[11px] font-semibold text-[#4865ff] hover:text-[#3852e6] hover:underline flex items-center gap-0.5 cursor-pointer bg-[#4865ff]/10 px-2 py-0.5 rounded-full"
                      title="Fly camera to cranial autonomic center"
                    >
                      <span>[Fly to Head]</span>
                      <ChevronRight size={11} />
                    </button>
                  </div>
                  <p className="text-stone/80 text-[11.5px] leading-relaxed">
                    Central hypothalamic autonomic dysregulation and peripheral small-fiber neuropathy impair vasomotor perfusion, rendering the extremities anhidrotic and hyper-susceptible to traumatic skin breakdown.
                  </p>
                </div>

              </div>

              {/* Integrative Ayush Vrana Ropana Protocol */}
              <div className="p-4 rounded-2xl bg-[#eef5ee] border border-[#328a3b]/20">
                <div className="flex items-center gap-2 text-xs font-bold text-[#328a3b] mb-2">
                  <Stethoscope size={15} />
                  <span>Ayush Vrana Ropana (Wound Healing) Protocol</span>
                </div>
                <div className="space-y-1.5 text-[11.5px] text-[#080331]">
                  <div className="flex items-start gap-1.5">
                    <CheckCircle2 size={13} className="text-[#328a3b] shrink-0 mt-0.5" />
                    <span><strong>Jatyadi Taila / Ghrita</strong>: Direct sterile dressing on ulcer bed for granulation tissue synthesis and re-epithelialization.</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <CheckCircle2 size={13} className="text-[#328a3b] shrink-0 mt-0.5" />
                    <span><strong>Panchavalkala Kashaya Parisheka</strong>: Antimicrobial natural wash to debride biofilm without cytotoxic cell destruction.</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <CheckCircle2 size={13} className="text-[#328a3b] shrink-0 mt-0.5" />
                    <span><strong>Off-Loading Footwear</strong>: Customized rocker-bottom sole or total contact cast to relieve metatarsal peak shear pressure.</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Bottom Actions */}
            <div className="mt-6 pt-4 border-t border-[#f0ece5] flex flex-col sm:flex-row items-center gap-2.5">
              
              {/* Copy Report button */}
              <button
                onClick={handleCopyNotes}
                className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 bg-[#080331] hover:bg-[#1b1463] text-white text-xs font-medium px-4 py-2.5 rounded-full shadow-sm transition-all cursor-pointer"
              >
                <Copy size={13} />
                <span>{copiedNotes ? 'Copied to Clipboard!' : 'Copy Clinical Dossier'}</span>
              </button>

              {/* Apply Tag button */}
              {onApplyUlcerTag && (
                <button
                  onClick={handleApplyUlcerTag}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 bg-[#4865ff] hover:bg-[#3855eb] text-white text-xs font-medium px-4 py-2.5 rounded-full shadow-sm transition-all cursor-pointer"
                >
                  <ShieldCheck size={14} />
                  <span>{tagApplied ? 'Tagged to Records!' : 'Tag Ulcer to Patient Dossier'}</span>
                </button>
              )}

              {/* Close Button */}
              <button
                onClick={onClose}
                className="w-full sm:w-auto text-xs text-stone/70 hover:text-[#080331] font-medium px-3 py-2 rounded-full hover:bg-[#f8f3eb] transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>

        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────────
          BioDigital OAuth2 Credentials & Access Token Modal
          ───────────────────────────────────────────────────────────── */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#f8f3eb] w-full max-w-2xl rounded-3xl border border-[#4d4439]/20 shadow-2xl flex flex-col overflow-hidden text-[#080331] max-h-[92vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-white border-b border-[#4d4439]/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#080331] flex items-center justify-center text-white">
                  <Key size={18} className="text-[#ff6d39]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#4865ff] bg-[#4865ff]/10 px-2 py-0.5 rounded-full">
                      OAuth 2.0 Client Credentials
                    </span>
                    <span className="text-[10px] font-mono text-stone-500">v2.0 /token</span>
                  </div>
                  <h3 className="font-serif text-lg font-medium text-[#080331]">
                    BioDigital Human Content API Authentication
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setIsAuthModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-stone-100 text-stone-500 hover:text-[#080331] transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 overflow-y-auto">
              
              {/* Documentation Summary Banner */}
              <div className="p-3.5 rounded-2xl bg-white border border-[#4d4439]/10 text-xs leading-relaxed">
                <div className="flex items-start gap-2">
                  <Info size={15} className="text-[#4865ff] shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-[#080331]">
                      BioDigital Content API Authentication Spec
                    </div>
                    <p className="text-stone/75 text-[11px] mt-0.5">
                      Sends <code className="font-mono bg-stone-100 px-1 py-0.5 rounded text-[10px]">POST https://apis.biodigital.com/oauth2/v2/token</code> with Base64 URL-encoded client credentials in the <code className="font-mono bg-stone-100 px-1 py-0.5 rounded text-[10px]">Authorization: Basic</code> header and <code className="font-mono bg-stone-100 px-1 py-0.5 rounded text-[10px]">grant_type: &quot;client_credentials&quot;</code>.
                    </p>
                  </div>
                </div>
              </div>

              {/* Active Token Banner if active */}
              {activeToken && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-xs shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-800 text-xs">
                      <CheckCircle2 size={16} className="text-emerald-600" />
                      <span>Active Bearer Access Token</span>
                    </div>
                    <span className="text-[11px] font-mono bg-emerald-200/70 text-emerald-900 px-2 py-0.5 rounded-full font-semibold">
                      Expires in ~{tokenExpiresIn} mins
                    </span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/90 p-2 rounded-xl border border-emerald-200 font-mono text-[11px] text-stone-700">
                    <span className="truncate flex-1">
                      {activeToken.slice(0, 24)}...{activeToken.slice(-16)}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(activeToken);
                        setCopiedToken(true);
                        setTimeout(() => setCopiedToken(false), 2000);
                      }}
                      className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-lg font-sans cursor-pointer transition-colors flex items-center gap-1 shrink-0"
                    >
                      {copiedToken ? <Check size={12} /> : <Copy size={12} />}
                      <span>{copiedToken ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-emerald-800 mt-2 flex items-center gap-1">
                    <Check size={12} className="text-emerald-700 shrink-0" />
                    <span>Developer Key <code className="font-mono font-bold bg-emerald-100 px-1 rounded">{developerKey.slice(0, 8)}...</code> is active on the 3D Viewer iframe.</span>
                  </p>
                </div>
              )}

              {/* Success Message Banner */}
              {authSuccess && !activeToken && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                  <span>{authSuccess}</span>
                </div>
              )}

              {/* Error Message Diagnostic Box */}
              {authError && (
                <div className="p-4 rounded-2xl bg-red-50 border border-red-300 text-xs shadow-xs space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-red-800">
                    <AlertCircle size={15} className="text-red-600 shrink-0" />
                    <span>Authentication Diagnostic: {authError.error_type || 'Error'} ({authError.error_code || authError.error_status_code})</span>
                  </div>
                  <p className="text-red-700 text-[11.5px] leading-relaxed">
                    {authError.error_message}
                  </p>
                  {authError.error_more_info && (
                    <p className="text-red-600/80 text-[10.5px] italic">
                      More info: {authError.error_more_info}
                    </p>
                  )}
                  <div className="mt-2 pt-2 border-t border-red-200 text-[11px] text-stone-600">
                    <strong>Resolution:</strong> Ensure credentials from <a href="https://developer.biodigital.com/" target="_blank" rel="noreferrer" className="text-[#4865ff] underline">developer.biodigital.com</a> are active. You can also switch to <strong>3D WebGL</strong> for instant 3D without credentials.
                  </div>
                </div>
              )}

              {/* Input Form: Key & Secret */}
              <div className="bg-white p-4.5 rounded-2xl border border-[#4d4439]/10 space-y-3.5 shadow-sm">
                <div>
                  <label className="block text-xs font-semibold text-[#080331] mb-1">
                    BioDigital Developer Key (`developerKey` / `dk`)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 7a8b9c0d1e2f3g4h5i6j7k8l9m0n1o2p"
                    value={developerKey}
                    onChange={(e) => setDeveloperKey(e.target.value)}
                    className="w-full bg-[#f8f3eb]/60 border border-[#4d4439]/20 rounded-xl px-3.5 py-2 text-xs text-[#080331] font-mono focus:outline-none focus:border-[#4865ff] transition-all"
                  />
                  <span className="text-[10.5px] text-stone/60 mt-1 block">
                    Used as the <code className="font-mono bg-stone-100 px-1 py-0.5 rounded">&amp;dk=...</code> parameter for the BioDigital Human Viewer embed.
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-[#080331]">
                      BioDigital Developer Secret (`developerSecret`)
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowSecret(!showSecret)}
                      className="text-[11px] text-[#4865ff] hover:underline cursor-pointer flex items-center gap-1"
                    >
                      {showSecret ? <Unlock size={11} /> : <Lock size={11} />}
                      <span>{showSecret ? 'Hide' : 'Show'}</span>
                    </button>
                  </div>
                  <input
                    type={showSecret ? 'text' : 'password'}
                    placeholder="e.g. sec_9x8y7w6v5u4t3s2r1q0p"
                    value={developerSecret}
                    onChange={(e) => setDeveloperSecret(e.target.value)}
                    className="w-full bg-[#f8f3eb]/60 border border-[#4d4439]/20 rounded-xl px-3.5 py-2 text-xs text-[#080331] font-mono focus:outline-none focus:border-[#4865ff] transition-all"
                  />
                </div>

                {/* Step 1 Base64 Auth Header Preview */}
                {basicAuthPreview && (
                  <div className="p-2.5 rounded-xl bg-stone-100 border border-stone-200 text-[10.5px] font-mono text-stone-700">
                    <div className="text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-0.5">
                      Step 1: Computed Basic Auth Header
                    </div>
                    <div className="truncate text-stone-800">
                      Authorization: Basic {basicAuthPreview}
                    </div>
                  </div>
                )}
              </div>

              {/* cURL Spec Drawer */}
              <div className="bg-white p-3.5 rounded-2xl border border-[#4d4439]/10 text-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-xs text-[#080331] flex items-center gap-1.5">
                    <Code size={13} className="text-[#4865ff]" />
                    cURL Command Reference
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(curlCommandPreview);
                      setCopiedCurl(true);
                      setTimeout(() => setCopiedCurl(false), 2000);
                    }}
                    className="text-[11px] text-[#4865ff] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {copiedCurl ? <Check size={11} /> : <Copy size={11} />}
                    <span>{copiedCurl ? 'Copied cURL' : 'Copy cURL'}</span>
                  </button>
                </div>
                <pre className="p-2.5 rounded-xl bg-[#080331] text-emerald-400 font-mono text-[10.5px] overflow-x-auto">
                  {curlCommandPreview}
                </pre>
              </div>

            </div>

            {/* Modal Footer Actions */}
            <div className="px-6 py-4 bg-white border-t border-[#4d4439]/10 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <a
                href="https://developer.biodigital.com/"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-[#4865ff] hover:underline flex items-center gap-1 font-medium"
              >
                <span>Get BioDigital API Credentials</span>
                <ExternalLink size={12} />
              </a>

              <div className="flex items-center gap-2 flex-wrap">
                {(developerKey || developerSecret || activeToken) && (
                  <button
                    onClick={handleClearAuth}
                    className="px-3 py-2 rounded-full text-xs text-red-600 hover:bg-red-50 transition-colors cursor-pointer font-medium"
                  >
                    Clear Credentials
                  </button>
                )}

                <button
                  onClick={handleSaveDeveloperKeyOnly}
                  className="px-4 py-2 rounded-full text-xs text-[#080331] bg-[#f8f3eb] hover:bg-[#ede6da] transition-colors cursor-pointer font-medium border border-[#4d4439]/15"
                >
                  Save Key Only
                </button>

                <button
                  onClick={handleGenerateToken}
                  disabled={isGeneratingToken}
                  className="px-5 py-2 rounded-full text-xs text-white bg-[#080331] hover:bg-[#1b1463] disabled:opacity-50 transition-all cursor-pointer font-medium shadow-sm flex items-center gap-1.5"
                >
                  {isGeneratingToken ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      <span>Requesting Token...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={13} className="text-[#ff6d39]" />
                      <span>Generate Bearer Token</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
