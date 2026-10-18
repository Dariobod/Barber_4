import * as THREE from 'three';
import { buildBarbershopWorld } from './world.js';
import { BarberAudio } from './audio.js';

// ============================================================================
// THE PIP'S BARBER — 3D INTERACTIVE BARBERSHOP EXPLORATION ENGINE (OPTIMIZED)
// ============================================================================

const canvas = document.getElementById('barber-canvas');
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: 'high-performance'
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1e1e1b);
scene.fog = new THREE.FogExp2(0x24201c, 0.022);

// Camera with tight near plane (0.06) to prevent any wall frustum clipping
const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.06,
  40
);

const audio = new BarberAudio();
const world = buildBarbershopWorld(scene);
const { interactables, wallColliders, obstacleBoxes, lights, refs } = world;

// ============================================================================
// CAMERA & PLAYER NAVIGATION (WITH ANTI-WALL-CLIPPING GUARANTEE)
// ============================================================================
const ROOM_BOUNDS = {
  minX: -5.95,
  maxX: 5.95,
  minZ: -4.85,
  maxZ: 4.85
};

const state = {
  playerPos: new THREE.Vector3(0.0, 1.68, 3.15),
  targetPos: new THREE.Vector3(0.0, 1.68, 3.15),
  yaw: 0.0, // Looking North (-Z) toward the central Barber Chair, Mirror & Barber Pole
  pitch: -0.06,
  targetYaw: 0.0,
  targetPitch: -0.06,
  isDragging: false,
  dragMoved: false,
  pointerDownPos: new THREE.Vector2(),
  keys: { forward: false, backward: false, left: false, right: false },
  isNight: false,
  nightBlend: 0,
  sittingInChair: false,
  chairHeightOffset: 0,
  chairTargetHeight: 0,
  chairSpinSpeed: 0,
  chairReclined: false,
  chairTargetRecline: -0.16,
  poleSpeed: 2.2,
  ringLightMode: 0,
  activeModal: null,
  discovered: new Set(),
  currentTvIndex: 2 // Default to 02 - Pipa en acción
};

// Predefined Camera Waypoints for Guided Navigation & Station Focus
const WAYPOINTS = {
  inicio: { pos: new THREE.Vector3(0.0, 1.68, 3.15), yaw: 0.0, pitch: -0.06 },
  sillon: { pos: new THREE.Vector3(-0.85, 1.55, 2.05), yaw: -0.32, pitch: -0.12 },
  pipa: { pos: new THREE.Vector3(-1.45, 1.68, -2.55), yaw: 0.05, pitch: 0.02 },
  servicios: { pos: new THREE.Vector3(2.75, 1.68, -3.15), yaw: -0.06, pitch: 0.06 },
  galeria: { pos: new THREE.Vector3(-3.85, 1.68, -0.6), yaw: Math.PI / 2, pitch: 0.05 },
  reservar: { pos: new THREE.Vector3(-2.65, 1.68, 2.35), yaw: 2.65, pitch: -0.12 },
  preguntas: { pos: new THREE.Vector3(1.65, 1.68, 2.45), yaw: -2.25, pitch: -0.08 }
};

// Floor Walk Target Ring Indicator
const walkRingGeo = new THREE.RingGeometry(0.18, 0.25, 28);
const walkRingMat = new THREE.MeshBasicMaterial({
  color: 0xdf2528,
  side: THREE.DoubleSide,
  transparent: true,
  opacity: 0.0
});
const walkRingMesh = new THREE.Mesh(walkRingGeo, walkRingMat);
walkRingMesh.rotation.x = -Math.PI / 2;
walkRingMesh.position.y = 0.015;
scene.add(walkRingMesh);
let walkRingTimer = 0;

// ============================================================================
// PARTICLE EFFECTS (WATER SPRAY, HAIR TRIMMINGS, MATE STEAM, MUSIC NOTES)
// ============================================================================
const activeBursts = [];

function spawnParticleBurst(origin, type = 'spray') {
  const count = type === 'spray' ? 36 : type === 'hair' ? 28 : 18;
  const positions = new Float32Array(count * 3);
  const velocities = [];

  for (let i = 0; i < count; i++) {
    positions[i * 3] = origin.x + (Math.random() - 0.5) * 0.08;
    positions[i * 3 + 1] = origin.y + (Math.random() - 0.5) * 0.08;
    positions[i * 3 + 2] = origin.z + (Math.random() - 0.5) * 0.08;

    if (type === 'spray') {
      velocities.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 1.1 - 0.4,
          Math.random() * 0.8 + 0.2,
          (Math.random() - 0.5) * 1.1
        )
      );
    } else if (type === 'hair') {
      velocities.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 0.9,
          Math.random() * 0.7 + 0.3,
          (Math.random() - 0.5) * 0.9
        )
      );
    } else {
      velocities.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 0.25,
          Math.random() * 0.45 + 0.35,
          (Math.random() - 0.5) * 0.25
        )
      );
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const colorMap = {
    spray: 0xbbeeff,
    hair: 0x2a1d15,
    steam: 0xfaf9f6,
    music: 0xd4a359
  };

  const mat = new THREE.PointsMaterial({
    color: colorMap[type] || 0xffffff,
    size: type === 'spray' ? 0.045 : type === 'hair' ? 0.035 : 0.065,
    transparent: true,
    opacity: 0.9,
    depthWrite: false
  });

  const points = new THREE.Points(geo, mat);
  scene.add(points);

  activeBursts.push({
    points,
    velocities,
    type,
    age: 0,
    maxAge: type === 'steam' || type === 'music' ? 1.8 : 1.1
  });
}

// ============================================================================
// COLLISION & ANTI-WALL-CLIPPING SOLVER (ZERO ALLOCATIONS PER FRAME)
// ============================================================================
const collisionRaycaster = new THREE.Raycaster();
const _lookDir = new THREE.Vector3();
const _backDir = new THREE.Vector3();
const _finalCamPos = new THREE.Vector3();
const _lookAtPoint = new THREE.Vector3();

function clampPlayerPosition(pos) {
  pos.x = Math.max(ROOM_BOUNDS.minX, Math.min(ROOM_BOUNDS.maxX, pos.x));
  pos.z = Math.max(ROOM_BOUNDS.minZ, Math.min(ROOM_BOUNDS.maxZ, pos.z));

  if (!state.sittingInChair) {
    for (let i = 0; i < obstacleBoxes.length; i++) {
      const box = obstacleBoxes[i];
      if (pos.x > box.minX && pos.x < box.maxX && pos.z > box.minZ && pos.z < box.maxZ) {
        const dLeft = pos.x - box.minX;
        const dRight = box.maxX - pos.x;
        const dTop = pos.z - box.minZ;
        const dBot = box.maxZ - pos.z;
        const minDist = Math.min(dLeft, dRight, dTop, dBot);

        if (minDist === dLeft) pos.x = box.minX;
        else if (minDist === dRight) pos.x = box.maxX;
        else if (minDist === dTop) pos.z = box.minZ;
        else pos.z = box.maxZ;
      }
    }
  }
}

function updateCameraTransform() {
  state.yaw += (state.targetYaw - state.yaw) * 0.16;
  state.pitch += (state.targetPitch - state.pitch) * 0.16;

  if (state.sittingInChair) {
    state.targetPos.set(0, 1.32 + state.chairHeightOffset, -0.05);
  } else {
    clampPlayerPosition(state.targetPos);
  }

  state.playerPos.lerp(state.targetPos, 0.14);
  if (!state.sittingInChair) {
    clampPlayerPosition(state.playerPos);
  }

  const cosPitch = Math.cos(state.pitch);
  _lookDir.set(
    -Math.sin(state.yaw) * cosPitch,
    Math.sin(state.pitch),
    -Math.cos(state.yaw) * cosPitch
  ).normalize();

  const desiredBackOffset = state.sittingInChair ? 0.05 : 0.32;
  _backDir.copy(_lookDir).negate();
  let safeBackDist = desiredBackOffset;

  collisionRaycaster.set(state.playerPos, _backDir);
  collisionRaycaster.far = desiredBackOffset + 0.6;
  const hits = collisionRaycaster.intersectObjects(wallColliders, false);
  if (hits.length > 0) {
    safeBackDist = Math.max(0, Math.min(desiredBackOffset, hits[0].distance - 0.45));
  }

  _finalCamPos.copy(state.playerPos).addScaledVector(_backDir, safeBackDist);

  // Hard frustum safety clamp so camera is always strictly inside the interior walls
  _finalCamPos.x = Math.max(-6.45, Math.min(6.45, _finalCamPos.x));
  _finalCamPos.z = Math.max(-5.45, Math.min(5.45, _finalCamPos.z));
  _finalCamPos.y = Math.max(0.85, Math.min(3.85, _finalCamPos.y));

  camera.position.copy(_finalCamPos);
  _lookAtPoint.copy(_finalCamPos).add(_lookDir);
  camera.lookAt(_lookAtPoint);
}

// ============================================================================
// POINTER, TOUCH & KEYBOARD CONTROLS (THROTTLED HOVER FOR SMOOTH FPS)
// ============================================================================
const pointerRaycaster = new THREE.Raycaster();
const pointerNDC = new THREE.Vector2();
let hoveredInteractable = null;
let lastHoverCheckTime = 0;

function getNormalizedPointer(clientX, clientY) {
  pointerNDC.x = (clientX / window.innerWidth) * 2 - 1;
  pointerNDC.y = -(clientY / window.innerHeight) * 2 + 1;
}

canvas.addEventListener('pointerdown', (e) => {
  if (state.activeModal) return;
  audio.init();
  state.isDragging = true;
  state.dragMoved = false;
  state.pointerDownPos.set(e.clientX, e.clientY);
});

window.addEventListener('pointermove', (e) => {
  if (state.activeModal) return;

  if (state.isDragging) {
    const dx = e.clientX - state.pointerDownPos.x;
    const dy = e.clientY - state.pointerDownPos.y;
    if (Math.hypot(dx, dy) > 5) {
      state.dragMoved = true;
    }
    state.targetYaw -= e.movementX * 0.0045;
    state.targetPitch = Math.max(
      -Math.PI / 2.6,
      Math.min(Math.PI / 2.8, state.targetPitch - e.movementY * 0.0038)
    );
    return;
  }

  // Throttle hover raycasting to 25Hz and ONLY test interactables array (90% faster!)
  const now = performance.now();
  const tooltip = document.getElementById('hover-tooltip');
  if (hoveredInteractable && tooltip) {
    tooltip.style.left = `${Math.min(window.innerWidth - 280, Math.max(20, e.clientX + 16))}px`;
    tooltip.style.top = `${Math.min(window.innerHeight - 90, Math.max(20, e.clientY + 16))}px`;
  }

  if (now - lastHoverCheckTime < 40) return;
  lastHoverCheckTime = now;

  getNormalizedPointer(e.clientX, e.clientY);
  pointerRaycaster.setFromCamera(pointerNDC, camera);
  const hits = pointerRaycaster.intersectObjects(interactables, true);

  let found = null;
  if (hits.length > 0 && hits[0].object.userData.interactiveRoot) {
    found = hits[0].object.userData.interactiveRoot;
  }

  if (found !== hoveredInteractable) {
    hoveredInteractable = found;
    if (found) {
      audio.playHover();
      canvas.style.cursor = 'pointer';
      if (tooltip) {
        tooltip.querySelector('.tooltip-title').textContent = found.userData.title;
        tooltip.querySelector('.tooltip-sub').textContent = found.userData.subtitle;
        tooltip.style.left = `${Math.min(window.innerWidth - 280, Math.max(20, e.clientX + 16))}px`;
        tooltip.style.top = `${Math.min(window.innerHeight - 90, Math.max(20, e.clientY + 16))}px`;
        tooltip.classList.add('visible');
      }
    } else {
      canvas.style.cursor = state.isDragging ? 'grabbing' : 'grab';
      if (tooltip) tooltip.classList.remove('visible');
    }
  }
});

window.addEventListener('pointerup', (e) => {
  if (!state.isDragging) return;
  state.isDragging = false;
  canvas.style.cursor = hoveredInteractable ? 'pointer' : 'grab';

  if (state.dragMoved || state.activeModal) return;

  getNormalizedPointer(e.clientX, e.clientY);
  pointerRaycaster.setFromCamera(pointerNDC, camera);

  // Check interactive objects first
  const interactiveHits = pointerRaycaster.intersectObjects(interactables, true);
  if (interactiveHits.length > 0 && interactiveHits[0].object.userData.interactiveRoot) {
    handleObjectInteraction(interactiveHits[0].object.userData.interactiveRoot);
    return;
  }

  // Otherwise check walkable floor
  const allHits = pointerRaycaster.intersectObjects(scene.children, true);
  for (const hit of allHits) {
    if (hit.object.name === 'walkable-floor' && hit.distance < 16) {
      if (state.sittingInChair) {
        exitChairPOV();
      }
      state.targetPos.x = hit.point.x;
      state.targetPos.z = hit.point.z;
      clampPlayerPosition(state.targetPos);

      walkRingMesh.position.set(state.targetPos.x, 0.018, state.targetPos.z);
      walkRingMat.opacity = 0.85;
      walkRingTimer = 0.75;
      return;
    }
  }
});

// Touch support for mobile drag look
let lastTouchX = 0;
let lastTouchY = 0;
canvas.addEventListener(
  'touchstart',
  (e) => {
    if (e.touches.length === 1) {
      lastTouchX = e.touches[0].clientX;
      lastTouchY = e.touches[0].clientY;
    }
  },
  { passive: true }
);

canvas.addEventListener(
  'touchmove',
  (e) => {
    if (state.activeModal || e.touches.length !== 1) return;
    const tx = e.touches[0].clientX;
    const ty = e.touches[0].clientY;
    const dx = tx - lastTouchX;
    const dy = ty - lastTouchY;
    lastTouchX = tx;
    lastTouchY = ty;
    state.targetYaw -= dx * 0.005;
    state.targetPitch = Math.max(
      -Math.PI / 2.6,
      Math.min(Math.PI / 2.8, state.targetPitch - dy * 0.004)
    );
  },
  { passive: true }
);

// Keyboard navigation
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (state.activeModal) closeAllModals();
    else if (state.sittingInChair) exitChairPOV();
    return;
  }
  if (state.activeModal) return;

  const code = e.code;
  if (code === 'KeyW' || code === 'ArrowUp') state.keys.forward = true;
  if (code === 'KeyS' || code === 'ArrowDown') state.keys.backward = true;
  if (code === 'KeyA' || code === 'ArrowLeft') state.keys.left = true;
  if (code === 'KeyD' || code === 'ArrowRight') state.keys.right = true;
  if (code === 'KeyL' || code === 'KeyN') toggleDayNight();
});

window.addEventListener('keyup', (e) => {
  const code = e.code;
  if (code === 'KeyW' || code === 'ArrowUp') state.keys.forward = false;
  if (code === 'KeyS' || code === 'ArrowDown') state.keys.backward = false;
  if (code === 'KeyA' || code === 'ArrowLeft') state.keys.left = false;
  if (code === 'KeyD' || code === 'ArrowRight') state.keys.right = false;
});

// ============================================================================
// INTERACTIONS, SURPRISES & STATION MODALS
// ============================================================================
let scissorsAnimTime = 0;
let clippersAnimTime = 0;

function markDiscovered(id, toastMsg) {
  const isNew = !state.discovered.has(id);
  state.discovered.add(id);
  updateExplorerProgress();
  if (toastMsg) {
    showToast(toastMsg, isNew);
  }
}

function updateExplorerProgress() {
  const count = state.discovered.size;
  const total = 11;
  const countEl = document.getElementById('explorer-count');
  const barEl = document.getElementById('explorer-bar-fill');
  if (countEl) countEl.textContent = `${count} / ${total}`;
  if (barEl) barEl.style.width = `${Math.min(100, (count / total) * 100)}%`;
}

let toastTimeout = null;
function showToast(message, isDiscovery = false) {
  const toast = document.getElementById('studio-toast');
  if (!toast) return;
  toast.innerHTML = isDiscovery
    ? `<span class="toast-badge">✨ DESCUBIERTO</span> <span>${message}</span>`
    : `<span>${message}</span>`;
  toast.classList.add('show');
  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 3800);
}

function syncMusicButtonUI() {
  const musicBtn = document.getElementById('btn-toggle-music');
  if (!musicBtn) return;
  const stationName = audio.stations[audio.musicStation]?.name || 'Música';
  musicBtn.classList.toggle('active', audio.musicPlaying);
  musicBtn.querySelector('.btn-label').textContent = audio.musicPlaying ? stationName : 'Música Off';
}

export function navigateToWaypoint(key) {
  const wp = WAYPOINTS[key];
  if (!wp) return;
  if (state.sittingInChair) exitChairPOV();

  state.targetPos.copy(wp.pos);
  const diff = ((wp.yaw - state.yaw + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
  state.targetYaw = state.yaw + diff;
  state.targetPitch = wp.pitch;

  document.querySelectorAll('.hud-nav-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.waypoint === key);
  });
}

function handleObjectInteraction(obj) {
  const { id, sectionTarget } = obj.userData;

  if (sectionTarget) {
    navigateToWaypoint(sectionTarget);
    openModal(sectionTarget);
    markDiscovered(id, `Exploraste: ${obj.userData.title}`);
    return;
  }

  switch (id) {
    case 'barber-chair': {
      navigateToWaypoint('sillon');
      toggleChairControlWidget(true);
      audio.playHydraulic();
      state.chairSpinSpeed = 2.6;
      markDiscovered('barber-chair', '¡Sillón Central activado! Probá sentarte, reclinarlo o girarlo.');
      break;
    }

    case 'surprise-clippers': {
      audio.playClippers(1.5);
      clippersAnimTime = 1.5;
      const worldPos = new THREE.Vector3();
      refs.clippersGroup.getWorldPosition(worldPos);
      spawnParticleBurst(worldPos, 'hair');
      markDiscovered('surprise-clippers', '✂️ ¡Bzzzz! Máquina Wahl/GoldFX en acción.');
      break;
    }

    case 'surprise-scissors': {
      audio.playScissors();
      scissorsAnimTime = 0.95;
      markDiscovered('surprise-scissors', '✂️ ¡Snip, snip! Tijeras de filo dulce listas para el corte.');
      break;
    }

    case 'surprise-spray': {
      audio.playSpray();
      const worldPos = new THREE.Vector3();
      refs.sprayGroup.getWorldPosition(worldPos);
      worldPos.y += 0.18;
      spawnParticleBurst(worldPos, 'spray');
      markDiscovered('surprise-spray', '💦 ¡Pssht! Bruma fresca del rociador de barbero.');
      break;
    }

    case 'surprise-ringlight': {
      audio.playSwitch();
      state.ringLightMode = (state.ringLightMode + 1) % 4;
      const modes = [
        { name: 'Blanco Cálido Estudio', col: 0xfff5e4, intensity: 1.5 },
        { name: 'Luz Día Fría (5600K)', col: 0xdcf0ff, intensity: 1.8 },
        { name: "Modo Rojo The Pip's", col: 0xff2a2e, intensity: 2.0 },
        { name: 'Apagado', col: 0x222222, intensity: 0.0 }
      ];
      const m = modes[state.ringLightMode];
      refs.ringLedMat.emissive.setHex(m.col);
      refs.ringLedMat.emissiveIntensity = m.intensity > 0 ? 2.4 : 0.05;
      refs.ringPointLight.color.setHex(m.col);
      refs.ringPointLight.intensity = m.intensity;
      markDiscovered('surprise-ringlight', `💡 Aro ETHEOS: ${m.name}`);
      break;
    }

    case 'surprise-turntable': {
      const res = audio.toggleMusic(true);
      syncMusicButtonUI();
      if (res.playing) {
        const worldPos = new THREE.Vector3();
        refs.vinylDisc.getWorldPosition(worldPos);
        worldPos.y += 0.12;
        spawnParticleBurst(worldPos, 'music');
      }
      markDiscovered(
        'surprise-turntable',
        res.playing ? `🎵 Sonando: "${res.station}"` : '🎵 Música del estudio en pausa'
      );
      break;
    }

    case 'surprise-mate': {
      audio.playMatePour();
      const worldPos = new THREE.Vector3(3.85, 0.72, 3.45);
      spawnParticleBurst(worldPos, 'steam');
      markDiscovered('surprise-mate', '🧉 ¡Un buen mate recién cebado mientras esperás tu turno!');
      break;
    }

    case 'surprise-bell': {
      audio.playBell();
      markDiscovered('surprise-bell', '🔔 ¡Ding! "¡Hola! Soy Pipa, ponete cómodo que ya te atiendo."');
      break;
    }

    case 'surprise-pole': {
      audio.playSwitch();
      state.poleSpeed = state.poleSpeed === 2.2 ? 6.0 : state.poleSpeed === 6.0 ? 0 : 2.2;
      const status =
        state.poleSpeed === 6.0 ? 'Modo Turbo' : state.poleSpeed === 0 ? 'Detenido' : 'Giro Clásico';
      markDiscovered('surprise-pole', `💈 Cilindro de Peluquería: ${status}`);
      break;
    }

    case 'surprise-lightswitch': {
      toggleDayNight();
      markDiscovered('surprise-lightswitch', '💡 Interruptor de pared accionado.');
      break;
    }
  }
}

// ============================================================================
// BARBER CHAIR INTERACTIVE CONTROLS (SIT POV, PUMP, RECLINE, SPIN)
// ============================================================================
function toggleChairControlWidget(show) {
  const widget = document.getElementById('chair-controls-widget');
  if (!widget) return;
  widget.classList.toggle('visible', show);
}

function enterChairPOV() {
  state.sittingInChair = true;
  audio.playHydraulic();
  const diff = ((0.18 - state.yaw + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
  state.targetYaw = state.yaw + diff;
  state.targetPitch = 0.02;
  document.getElementById('btn-chair-sit').textContent = '🚶 Levantarse del Sillón';
  showToast('💺 Estás sentado en el Sillón del Barbero. Mirá de frente al espejo y al cilindro.');
}

function exitChairPOV() {
  state.sittingInChair = false;
  state.targetPos.set(-0.85, 1.55, 2.05);
  document.getElementById('btn-chair-sit').textContent = '💺 Sentarse en el Sillón (1ª Persona)';
}

document.getElementById('btn-chair-sit')?.addEventListener('click', () => {
  if (state.sittingInChair) exitChairPOV();
  else enterChairPOV();
});

document.getElementById('btn-chair-spin')?.addEventListener('click', () => {
  audio.playHydraulic();
  state.chairSpinSpeed = 4.2;
  if (state.sittingInChair) {
    state.targetYaw += Math.PI * 2;
  }
  showToast('🔄 ¡Girando el sillón hidráulico 360°!');
});

document.getElementById('btn-chair-recline')?.addEventListener('click', () => {
  audio.playHydraulic();
  state.chairReclined = !state.chairReclined;
  state.chairTargetRecline = state.chairReclined ? -0.62 : -0.16;
  showToast(
    state.chairReclined
      ? '🛋️ Sillón reclinado para ritual de barba y toalla caliente.'
      : '🛋️ Sillón en posición de corte clásico.'
  );
});

document.getElementById('btn-chair-pump')?.addEventListener('click', () => {
  audio.playHydraulic();
  state.chairTargetHeight = state.chairTargetHeight > 0.12 ? 0.0 : state.chairTargetHeight + 0.08;
  refs.pumpPedalGroup.rotation.z = -0.35;
  setTimeout(() => {
    refs.pumpPedalGroup.rotation.z = 0;
  }, 300);
  showToast('⬆️ Bomba hidráulica accionada.');
});

document.getElementById('btn-chair-close')?.addEventListener('click', () => {
  if (state.sittingInChair) exitChairPOV();
  toggleChairControlWidget(false);
});

// ============================================================================
// DAY / NIGHT LIGHTING CONTROLLER (PRE-ALLOCATED COLORS FOR ZERO GC)
// ============================================================================
const _daySky = new THREE.Color(0x87ceeb);
const _nightSky = new THREE.Color(0x070b16);
const _sunCol = new THREE.Color(0xfff5cc);
const _moonCol = new THREE.Color(0xc8dcff);

export function toggleDayNight(forceNight = null) {
  audio.playSwitch();
  state.isNight = forceNight !== null ? forceNight : !state.isNight;

  refs.switchToggle.rotation.x = state.isNight ? 0.35 : -0.35;

  const btn = document.getElementById('btn-day-night');
  if (btn) {
    btn.classList.toggle('is-night', state.isNight);
    btn.innerHTML = state.isNight
      ? `<span class="mode-icon">🌙</span> <span class="btn-label">Noche (Luz Artificial)</span>`
      : `<span class="mode-icon">☀️</span> <span class="btn-label">Día (Luz Natural)</span>`;
  }

  markDiscovered(
    'day-night-mode',
    state.isNight
      ? '🌙 Modo Noche: Iluminación artificial cálida de la barbería activada'
      : '☀️ Modo Día: Luz natural entrando al sillón central'
  );
}

function updateLightingTransition(dt) {
  const targetBlend = state.isNight ? 1 : 0;
  if (Math.abs(targetBlend - state.nightBlend) < 0.001) return;

  state.nightBlend += (targetBlend - state.nightBlend) * Math.min(1, dt * 3.5);
  const b = state.nightBlend;

  lights.sunSpot.intensity = THREE.MathUtils.lerp(5.2, 0.25, b);
  lights.sunSpot.color.setHex(b > 0.5 ? 0x6888cc : 0xfff1d6);
  refs.sunbeamMat.opacity = THREE.MathUtils.lerp(0.068, 0.0, b);

  lights.hemi.intensity = THREE.MathUtils.lerp(1.38, 0.38, b);

  refs.skyBackdropMat.color.lerpColors(_daySky, _nightSky, b);
  refs.celestialMat.color.lerpColors(_sunCol, _moonCol, b);

  lights.chairOverhead.intensity = THREE.MathUtils.lerp(2.4, 4.4, b);

  lights.pendantPointLights.forEach((pt, idx) => {
    const dayInt = idx === 0 ? 1.2 : 0.9;
    const nightInt = idx === 0 ? 3.2 : 2.6;
    pt.intensity = THREE.MathUtils.lerp(dayInt, nightInt, b);
  });

  lights.pendantBulbs.forEach((bulbMat) => {
    bulbMat.emissiveIntensity = THREE.MathUtils.lerp(1.1, 3.5, b);
  });

  refs.mirrorLedStripMat.emissiveIntensity = THREE.MathUtils.lerp(1.1, 2.8, b);
  refs.neonTubeMat.emissiveIntensity = THREE.MathUtils.lerp(1.6, 3.8, b);
  refs.poleGlowLight.intensity = THREE.MathUtils.lerp(0.8, 2.1, b);
}

// ============================================================================
// 3D FLOATING HOTSPOT BADGES (OPTIMIZED DOM UPDATES)
// ============================================================================
const hotspotElements = [];
const hotspotContainer = document.getElementById('hotspots-layer');
const _tempV = new THREE.Vector3();
const _camDir = new THREE.Vector3();
const _toPoint = new THREE.Vector3();

function createHotspotMarkers() {
  if (!hotspotContainer) return;
  hotspotContainer.innerHTML = '';

  interactables.forEach((obj) => {
    if (!obj.userData.badgePos) return;
    const el = document.createElement('button');
    el.type = 'button';
    el.className = `hotspot-marker category-${obj.userData.category}`;
    const icon =
      obj.userData.id === 'barber-chair'
        ? '💈'
        : obj.userData.id === 'surprise-pole'
        ? '💈'
        : obj.userData.sectionTarget === 'pipa'
        ? '✂️'
        : obj.userData.sectionTarget === 'servicios'
        ? '📋'
        : obj.userData.sectionTarget === 'galeria'
        ? '🎬'
        : obj.userData.sectionTarget === 'reservar'
        ? '📅'
        : obj.userData.sectionTarget === 'preguntas'
        ? '💬'
        : '✨';

    el.innerHTML = `
      <span class="hotspot-pulse"></span>
      <span class="hotspot-icon">${icon}</span>
      <span class="hotspot-label">${obj.userData.title.split('—')[0].split('(')[0].trim()}</span>
    `;

    el.addEventListener('click', (e) => {
      e.stopPropagation();
      audio.init();
      handleObjectInteraction(obj);
    });

    hotspotContainer.appendChild(el);
    hotspotElements.push({
      el,
      pos3D: obj.userData.badgePos,
      obj,
      lastX: -999,
      lastY: -999,
      visible: true
    });
  });
}

function updateHotspotPositions() {
  camera.getWorldDirection(_camDir);
  const w = window.innerWidth;
  const h = window.innerHeight;

  for (let i = 0; i < hotspotElements.length; i++) {
    const item = hotspotElements[i];
    if (state.activeModal) {
      if (item.visible) {
        item.el.style.opacity = '0';
        item.el.style.pointerEvents = 'none';
        item.visible = false;
      }
      continue;
    }

    _tempV.copy(item.pos3D);
    _toPoint.copy(_tempV).sub(camera.position).normalize();
    const dot = _camDir.dot(_toPoint);

    if (dot < 0.15) {
      if (item.visible) {
        item.el.style.opacity = '0';
        item.el.style.pointerEvents = 'none';
        item.visible = false;
      }
      continue;
    }

    _tempV.project(camera);
    const x = (_tempV.x * 0.5 + 0.5) * w;
    const y = (-(_tempV.y * 0.5) + 0.5) * h;

    if (!item.visible) {
      item.el.style.opacity = '1';
      item.el.style.pointerEvents = 'auto';
      item.visible = true;
    }

    if (Math.abs(x - item.lastX) > 0.4 || Math.abs(y - item.lastY) > 0.4) {
      item.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%)`;
      item.lastX = x;
      item.lastY = y;
    }
  }
}

// ============================================================================
// MODALS, VIDEO CAROUSEL & SETMORE BOOKING INTEGRATION
// ============================================================================
export function openModal(modalId, customBookingUrl = null) {
  closeAllModals(false);
  const modal = document.getElementById(`modal-${modalId}`);
  if (!modal) return;

  state.activeModal = modalId;
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');

  if (modalId === 'galeria') {
    audio.pauseForModal();
    syncMusicButtonUI();
  }

  if (modalId === 'reservar' && customBookingUrl) {
    const iframe = document.getElementById('booking-calendar');
    if (iframe && iframe.src !== customBookingUrl) {
      iframe.src = customBookingUrl;
    }
  }
}

export function closeAllModals(resumeMusic = true) {
  const wasGallery = state.activeModal === 'galeria';
  state.activeModal = null;
  document.querySelectorAll('.studio-modal').forEach((m) => {
    m.classList.remove('open');
    m.setAttribute('aria-hidden', 'true');
  });
  document.querySelectorAll('#modal-galeria video').forEach((v) => v.pause());

  if (wasGallery && resumeMusic) {
    audio.resumeAfterModal();
    syncMusicButtonUI();
  }
}

// Wire up UI Buttons, Navigation Bar, Booking Triggers & TV Channel Switcher
function initUI() {
  createHotspotMarkers();
  updateExplorerProgress();

  document.querySelectorAll('[data-waypoint]').forEach((btn) => {
    btn.addEventListener('click', () => {
      audio.init();
      const wp = btn.dataset.waypoint;
      const openSec = btn.dataset.openModal;
      navigateToWaypoint(wp);
      if (openSec) {
        openModal(openSec);
      } else {
        closeAllModals();
      }
    });
  });

  document.querySelectorAll('[data-close-modal]').forEach((btn) => {
    btn.addEventListener('click', () => closeAllModals(true));
  });
  document.querySelectorAll('.studio-modal').forEach((modal) => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeAllModals(true);
    });
  });

  document.querySelectorAll('[data-booking]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const url = btn.dataset.booking;
      navigateToWaypoint('reservar');
      openModal('reservar', url);
      markDiscovered('section-reservar', '📅 Abriendo agenda de turnos de Pipa...');
    });
  });

  document.getElementById('btn-day-night')?.addEventListener('click', () => {
    audio.init();
    toggleDayNight();
  });

  document.getElementById('btn-toggle-music')?.addEventListener('click', () => {
    audio.init();
    const res = audio.toggleMusic(true);
    syncMusicButtonUI();
    showToast(res.playing ? `🎵 Sonando: ${res.station}` : '🎵 Música del estudio pausada');
  });

  document.getElementById('btn-toggle-sfx')?.addEventListener('click', () => {
    audio.setMuted(!audio.muted);
    const btn = document.getElementById('btn-toggle-sfx');
    btn.textContent = audio.muted ? '🔇' : '🔊';
    btn.title = audio.muted ? 'Activar sonido' : 'Silenciar sonido';
    syncMusicButtonUI();
  });

  const tvVideos = [
    { src: '../assets/pipa-04.mp4', title: '04 — El estilo' },
    { src: '../assets/pipa-03.mp4', title: '03 — La precisión' },
    { src: '../assets/pipa-02.mp4', title: '02 — Pipa en acción' },
    { src: '../assets/pipa-01.mp4', title: '01 — El estudio' },
    { src: '../assets/pipa-05.mp4', title: '05 — El resultado' }
  ];

  document.querySelectorAll('[data-tv-channel]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.tvChannel) || 0;
      state.currentTvIndex = idx;
      const vid = tvVideos[idx];
      refs.tvVideoEl.src = vid.src;
      refs.tvVideoEl.play().catch(() => {});
      closeAllModals(true);
      navigateToWaypoint('galeria');
      showToast(`📺 TV 3D reproduciendo: ${vid.title}`);
    });
  });

  // Ingreso directo al Estudio 3D (sin modal de indicaciones)
  const splash = document.getElementById('welcome-splash');
  if (splash) {
    splash.classList.add('hidden');
    splash.setAttribute('aria-hidden', 'true');
  }

  refs.tvVideoEl.play().catch(() => {});

  // Iniciar la música del estudio automáticamente (o en el primer gesto si el navegador bloquea autoplay con audio)
  let studioAudioStarted = false;
  const startStudioAmbience = () => {
    if (studioAudioStarted) return;
    studioAudioStarted = true;
    audio.init();
    if (!audio.musicPlaying && !audio.muted) {
      audio.startMusic();
      syncMusicButtonUI();
    }
    refs.tvVideoEl.play().catch(() => {});
  };

  window.addEventListener('pointerdown', startStudioAmbience, { once: true });
  window.addEventListener('keydown', startStudioAmbience, { once: true });

  document.getElementById('btn-enter-studio')?.addEventListener('click', () => {
    startStudioAmbience();
    if (splash) {
      splash.classList.add('hidden');
    }
  });

  document.querySelectorAll('[data-move]').forEach((btn) => {
    const dir = btn.dataset.move;
    const startMove = (e) => {
      e.preventDefault();
      state.keys[dir] = true;
    };
    const endMove = (e) => {
      e.preventDefault();
      state.keys[dir] = false;
    };
    btn.addEventListener('pointerdown', startMove);
    btn.addEventListener('pointerup', endMove);
    btn.addEventListener('pointerleave', endMove);
  });
}

// ============================================================================
// MAIN ANIMATION LOOP
// ============================================================================
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.1);

  // 1. Process Keyboard / D-Pad Walking Movement
  if (!state.activeModal && !state.sittingInChair) {
    const moveSpeed = 3.5 * dt;
    const forwardX = -Math.sin(state.yaw);
    const forwardZ = -Math.cos(state.yaw);
    const rightX = Math.cos(state.yaw);
    const rightZ = -Math.sin(state.yaw);

    if (state.keys.forward) {
      state.targetPos.x += forwardX * moveSpeed;
      state.targetPos.z += forwardZ * moveSpeed;
    }
    if (state.keys.backward) {
      state.targetPos.x -= forwardX * moveSpeed;
      state.targetPos.z -= forwardZ * moveSpeed;
    }
    if (state.keys.left) {
      state.targetPos.x -= rightX * moveSpeed;
      state.targetPos.z -= rightZ * moveSpeed;
    }
    if (state.keys.right) {
      state.targetPos.x += rightX * moveSpeed;
      state.targetPos.z += rightZ * moveSpeed;
    }
  }

  // 2. Update Camera with Anti-Wall-Clipping Solver
  updateCameraTransform();

  // 3. Update Day / Night Lighting Transition
  updateLightingTransition(dt);

  // 4. Animate Spinning Barber Poles (Both 3D Rotation & Helical Stripe Vertical Scroll!)
  if (state.poleSpeed > 0) {
    for (let i = 0; i < refs.poleCylinders.length; i++) {
      refs.poleCylinders[i].rotation.y += state.poleSpeed * dt;
    }
    refs.barberPoleTex.offset.y -= state.poleSpeed * 0.22 * dt;
  }

  // 5. Animate Central Barber Chair (Spin, Height Pump, Backrest Recline & Footrest)
  if (state.chairSpinSpeed > 0.001) {
    refs.chairSwivelGroup.rotation.y += state.chairSpinSpeed * dt;
    state.chairSpinSpeed *= Math.pow(0.22, dt);
    if (state.chairSpinSpeed < 0.02) state.chairSpinSpeed = 0;
  }

  state.chairHeightOffset += (state.chairTargetHeight - state.chairHeightOffset) * Math.min(1, dt * 6);
  refs.chairSwivelGroup.position.y = 0.52 + state.chairHeightOffset;

  refs.chairBackPivot.rotation.x +=
    (state.chairTargetRecline - refs.chairBackPivot.rotation.x) * Math.min(1, dt * 5);
  refs.footrestGroup.rotation.x = 0.42 + (-0.16 - refs.chairBackPivot.rotation.x) * 1.1;

  // 6. Animate Clippers, Scissors & Vinyl Record
  if (clippersAnimTime > 0) {
    clippersAnimTime -= dt;
    refs.clippersGroup.position.y = 0.96 + Math.sin(clock.elapsedTime * 55) * 0.006;
    refs.clippersGroup.rotation.z = Math.sin(clock.elapsedTime * 70) * 0.05;
  } else {
    refs.clippersGroup.position.y = 0.91;
    refs.clippersGroup.rotation.z = 0;
  }

  if (scissorsAnimTime > 0) {
    scissorsAnimTime -= dt;
    const snipAngle = Math.abs(Math.sin(clock.elapsedTime * 18)) * 0.32;
    refs.blade1.rotation.y = 0.05 + snipAngle;
    refs.blade2.rotation.y = -0.05 - snipAngle;
    refs.scissorsGroup.position.y = 0.96;
  } else {
    refs.blade1.rotation.y = 0.12;
    refs.blade2.rotation.y = -0.12;
    refs.scissorsGroup.position.y = 0.90;
  }

  if (audio.musicPlaying) {
    refs.vinylDisc.rotation.y -= 2.4 * dt;
    refs.toneArm.rotation.y = -0.22;
  } else {
    refs.toneArm.rotation.y = 0;
  }

  // 7. Update Floor Click Ring
  if (walkRingTimer > 0) {
    walkRingTimer -= dt;
    walkRingMesh.scale.setScalar(1 + (0.75 - walkRingTimer) * 0.8);
    walkRingMat.opacity = Math.max(0, walkRingTimer * 1.1);
  }

  // 8. Update Particle Bursts
  for (let i = activeBursts.length - 1; i >= 0; i--) {
    const b = activeBursts[i];
    b.age += dt;
    if (b.age >= b.maxAge) {
      scene.remove(b.points);
      b.points.geometry.dispose();
      b.points.material.dispose();
      activeBursts.splice(i, 1);
      continue;
    }
    const posAttr = b.points.geometry.getAttribute('position');
    for (let p = 0; p < b.velocities.length; p++) {
      const v = b.velocities[p];
      if (b.type === 'hair' || b.type === 'spray') {
        v.y -= 1.8 * dt;
      }
      posAttr.setXYZ(
        p,
        posAttr.getX(p) + v.x * dt,
        posAttr.getY(p) + v.y * dt,
        posAttr.getZ(p) + v.z * dt
      );
    }
    posAttr.needsUpdate = true;
    b.points.material.opacity = 1 - b.age / b.maxAge;
  }

  // 9. Update 3D Hotspot Screen Projections
  updateHotspotPositions();

  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

initUI();
animate();

