import * as THREE from 'three';
import {
  createParquetTextures,
  createBrickTextures,
  createWalnutWoodTexture,
  createTuftedLeatherTextures,
  createBarberPoleTexture,
  createRubberMatTexture,
  createServicesBoardTexture,
  createFaqBoardTexture,
  createBookingTabletTexture,
  createLoungeRugTexture,
  createClockTexture
} from './textures.js';

export function buildBarbershopWorld(scene) {
  const interactables = [];
  const wallColliders = []; // Meshes used for camera raycast anti-clipping
  const obstacleBoxes = []; // 2D XZ bounding boxes { minX, maxX, minZ, maxZ } for player walk collision

  const textureLoader = new THREE.TextureLoader();
  const parquet = createParquetTextures(5, 5);
  const brick = createBrickTextures(4, 2);
  const brickSide = createBrickTextures(3, 2);
  const walnutTex = createWalnutWoodTexture(2, 1, '#3d2314');
  const darkWoodTex = createWalnutWoodTexture(1, 1, '#24150c');
  const tuftedLeather = createTuftedLeatherTextures(2, 2, '#5c1318');
  const sofaLeather = createTuftedLeatherTextures(3, 1, '#3d1c12');
  const barberPoleTex = createBarberPoleTexture();
  barberPoleTex.wrapS = THREE.RepeatWrapping;
  barberPoleTex.wrapT = THREE.RepeatWrapping;

  const rubberMatTex = createRubberMatTexture();
  const servicesBoardTex = createServicesBoardTexture();
  const faqBoardTex = createFaqBoardTexture();
  const tabletTex = createBookingTabletTexture();
  const rugTex = createLoungeRugTexture();
  const clockTex = createClockTexture();

  const logoTex = textureLoader.load('../assets/logo-the-pips-barber.jpg');
  logoTex.colorSpace = THREE.SRGBColorSpace;

  const posterTextures = [1, 2, 3, 4, 5].map((n) => {
    const t = textureLoader.load(`assets/pipa-0${n}.jpg`);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  });

  // Shared High-Performance PBR Materials (No multi-pass transmission shaders)
  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xe8eaed,
    metalness: 0.92,
    roughness: 0.14
  });

  const brushedSteelMat = new THREE.MeshStandardMaterial({
    color: 0xbec3c9,
    metalness: 0.82,
    roughness: 0.28
  });

  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xd8a648,
    metalness: 0.86,
    roughness: 0.22
  });

  const blackIronMat = new THREE.MeshStandardMaterial({
    color: 0x1c1c1a,
    metalness: 0.65,
    roughness: 0.42
  });

  const walnutMat = new THREE.MeshStandardMaterial({
    map: walnutTex,
    roughness: 0.38,
    metalness: 0.05
  });

  const darkWoodMat = new THREE.MeshStandardMaterial({
    map: darkWoodTex,
    roughness: 0.45,
    metalness: 0.05
  });

  const chairLeatherMat = new THREE.MeshStandardMaterial({
    map: tuftedLeather.map,
    bumpMap: tuftedLeather.bumpMap,
    bumpScale: 0.018,
    roughness: 0.34,
    metalness: 0.08
  });

  const smoothBurgundyLeatherMat = new THREE.MeshStandardMaterial({
    color: 0x521116,
    roughness: 0.36,
    metalness: 0.06
  });

  const creamPlasterMat = new THREE.MeshStandardMaterial({
    color: 0xd8d3c8,
    roughness: 0.85,
    metalness: 0.02
  });

  const darkCeilingMat = new THREE.MeshStandardMaterial({
    color: 0x181715,
    roughness: 0.9
  });

  // Helper to register interactive objects
  function registerInteractable(object3D, meta) {
    object3D.userData = {
      ...object3D.userData,
      interactive: true,
      ...meta
    };
    object3D.traverse((child) => {
      if (child.isMesh) {
        child.userData.interactiveRoot = object3D;
      }
    });
    interactables.push(object3D);
  }

  // ============================================================================
  // 1. STUDIO ARCHITECTURE (14m Wide x 12m Deep x 4.4m High)
  // ============================================================================
  const ROOM_W = 14;
  const ROOM_D = 12;
  const ROOM_H = 4.4;

  const architectureGroup = new THREE.Group();
  scene.add(architectureGroup);

  // Polished Oak Parquet Floor
  const floorGeo = new THREE.PlaneGeometry(ROOM_W, ROOM_D);
  const floorMat = new THREE.MeshStandardMaterial({
    map: parquet.map,
    bumpMap: parquet.bumpMap,
    bumpScale: 0.008,
    roughness: 0.28,
    metalness: 0.05
  });
  const floorMesh = new THREE.Mesh(floorGeo, floorMat);
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.receiveShadow = true;
  floorMesh.name = 'walkable-floor';
  architectureGroup.add(floorMesh);

  // Ceiling
  const ceilingMesh = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_W, ROOM_D), darkCeilingMat);
  ceilingMesh.rotation.x = Math.PI / 2;
  ceilingMesh.position.y = ROOM_H;
  architectureGroup.add(ceilingMesh);
  wallColliders.push(ceilingMesh);

  // Exposed Ceiling Timber Beams
  for (let z = -4.5; z <= 4.5; z += 3.0) {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(ROOM_W, 0.22, 0.24), darkWoodMat);
    beam.position.set(0, ROOM_H - 0.11, z);
    architectureGroup.add(beam);
  }

  const brickWallMat = new THREE.MeshStandardMaterial({
    map: brick.map,
    bumpMap: brick.bumpMap,
    bumpScale: 0.025,
    roughness: 0.82
  });

  const brickSideMat = new THREE.MeshStandardMaterial({
    map: brickSide.map,
    bumpMap: brickSide.bumpMap,
    bumpScale: 0.025,
    roughness: 0.82
  });

  // NORTH WALL (Z = -6) — Main Barber Mirror, Barber Pole & Services Wall
  const northWall = new THREE.Mesh(new THREE.BoxGeometry(ROOM_W + 0.4, ROOM_H, 0.3), brickWallMat);
  northWall.position.set(0, ROOM_H / 2, -ROOM_D / 2 - 0.15);
  northWall.receiveShadow = true;
  architectureGroup.add(northWall);
  wallColliders.push(northWall);

  // SOUTH WALL (Z = +6) — Entrance & Lounge Back Wall
  const southWall = new THREE.Mesh(new THREE.BoxGeometry(ROOM_W + 0.4, ROOM_H, 0.3), brickWallMat);
  southWall.position.set(0, ROOM_H / 2, ROOM_D / 2 + 0.15);
  southWall.receiveShadow = true;
  architectureGroup.add(southWall);
  wallColliders.push(southWall);

  // WEST WALL (X = -7) — Puertas Adentro (Video Wall & Vinyl Station)
  const westWall = new THREE.Mesh(new THREE.BoxGeometry(0.3, ROOM_H, ROOM_D), brickSideMat);
  westWall.position.set(-ROOM_W / 2 - 0.15, ROOM_H / 2, 0);
  westWall.receiveShadow = true;
  architectureGroup.add(westWall);
  wallColliders.push(westWall);

  // EAST WALL (X = +7) — Large Loft Windows letting in Natural Daylight
  const eastWallGroup = new THREE.Group();
  eastWallGroup.position.x = ROOM_W / 2 + 0.15;
  architectureGroup.add(eastWallGroup);

  const eastBottom = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.1, ROOM_D), creamPlasterMat);
  eastBottom.position.set(0, 0.55, 0);
  eastWallGroup.add(eastBottom);

  const eastTop = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.7, ROOM_D), creamPlasterMat);
  eastTop.position.set(0, 4.05, 0);
  eastWallGroup.add(eastTop);

  const pillarPositionsZ = [-4.8, 0, 4.8];
  const pillarWidths = [2.4, 1.2, 2.4];
  pillarPositionsZ.forEach((pz, idx) => {
    const pillar = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 2.6, pillarWidths[idx]),
      creamPlasterMat
    );
    pillar.position.set(0, 2.4, pz);
    pillar.castShadow = true;
    eastWallGroup.add(pillar);
  });

  // Invisible full collider on East Wall so camera never passes through window glass
  const eastCollider = new THREE.Mesh(
    new THREE.BoxGeometry(0.35, ROOM_H, ROOM_D),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  eastCollider.position.set(ROOM_W / 2 + 0.15, ROOM_H / 2, 0);
  architectureGroup.add(eastCollider);
  wallColliders.push(eastCollider);

  // Fast single-pass Window Glass (avoids double-scene transmission pass for 2x FPS!)
  const windowGlassMat = new THREE.MeshStandardMaterial({
    color: 0xdff2ff,
    transparent: true,
    opacity: 0.22,
    roughness: 0.1,
    metalness: 0.15
  });

  [-2.1, 2.1].forEach((winZ) => {
    const winGroup = new THREE.Group();
    winGroup.position.set(ROOM_W / 2, 2.4, winZ);
    architectureGroup.add(winGroup);

    const frameTop = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 3.0), blackIronMat);
    frameTop.position.y = 1.26;
    const frameBot = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.1, 3.05), walnutMat);
    frameBot.position.y = -1.28;
    winGroup.add(frameTop, frameBot);

    for (let mz = -1.5; mz <= 1.5; mz += 0.75) {
      const vBar = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.6, 0.05), blackIronMat);
      vBar.position.z = mz;
      winGroup.add(vBar);
    }
    for (let my = -0.65; my <= 0.65; my += 0.65) {
      const hBar = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 3.0), blackIronMat);
      hBar.position.y = my;
      winGroup.add(hBar);
    }

    const glass = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 2.6), windowGlassMat);
    glass.rotation.y = -Math.PI / 2;
    winGroup.add(glass);

    const valence = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.28, 3.04),
      new THREE.MeshStandardMaterial({ color: 0xf5f2eb, roughness: 0.6 })
    );
    valence.position.set(-0.04, 1.12, 0);
    winGroup.add(valence);
  });

  // Lower Wainscot Wood Boiserie Paneling
  const wainscotH = 1.15;
  const wainscotNorth = new THREE.Mesh(new THREE.BoxGeometry(ROOM_W, wainscotH, 0.08), darkWoodMat);
  wainscotNorth.position.set(0, wainscotH / 2, -ROOM_D / 2 + 0.04);
  const wainscotSouth = new THREE.Mesh(new THREE.BoxGeometry(ROOM_W, wainscotH, 0.08), darkWoodMat);
  wainscotSouth.position.set(0, wainscotH / 2, ROOM_D / 2 - 0.04);
  const wainscotWest = new THREE.Mesh(new THREE.BoxGeometry(0.08, wainscotH, ROOM_D), darkWoodMat);
  wainscotWest.position.set(-ROOM_W / 2 + 0.04, wainscotH / 2, 0);
  const wainscotEast = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.05, ROOM_D), darkWoodMat);
  wainscotEast.position.set(ROOM_W / 2 - 0.04, 0.525, 0);
  architectureGroup.add(wainscotNorth, wainscotSouth, wainscotWest, wainscotEast);

  // Exterior Sky & Sun/Moon outside East Windows
  const exteriorGroup = new THREE.Group();
  exteriorGroup.position.set(ROOM_W / 2 + 3.5, 2.5, 0);
  scene.add(exteriorGroup);

  const skyBackdropMat = new THREE.MeshBasicMaterial({ color: 0x87ceeb, side: THREE.DoubleSide });
  const skyBackdrop = new THREE.Mesh(new THREE.PlaneGeometry(18, 12), skyBackdropMat);
  skyBackdrop.rotation.y = -Math.PI / 2;
  skyBackdrop.position.x = 3.0;
  exteriorGroup.add(skyBackdrop);

  const celestialMat = new THREE.MeshBasicMaterial({ color: 0xfff5cc });
  const celestialOrb = new THREE.Mesh(new THREE.SphereGeometry(0.85, 20, 20), celestialMat);
  celestialOrb.position.set(2.4, 2.2, -1.5);
  exteriorGroup.add(celestialOrb);

  // Volumetric God-Ray Sunbeams streaming from East Windows to the Central Barber Chair
  const sunbeamGroup = new THREE.Group();
  scene.add(sunbeamGroup);
  const sunbeamMat = new THREE.MeshBasicMaterial({
    color: 0xfff3d1,
    transparent: true,
    opacity: 0.065,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  [-1.9, 1.9].forEach((bz) => {
    const coneGeo = new THREE.ConeGeometry(2.2, 8.2, 18, 1, true);
    const beam = new THREE.Mesh(coneGeo, sunbeamMat);
    beam.position.set(3.2, 1.75, bz * 0.65);
    beam.rotation.z = Math.PI / 2.65;
    beam.rotation.y = 0.08;
    sunbeamGroup.add(beam);
  });

  // ============================================================================
  // 2. CENTRAL HERO PIECE: EL SILLÓN DEL BARBERO + CARRO DE HERRAMIENTAS + ARO LED
  // ============================================================================
  const centerStageGroup = new THREE.Group();
  centerStageGroup.position.set(0, 0, 0);
  scene.add(centerStageGroup);

  // Raised Circular Vintage Barber Platform with Dark Marble & Brass Rim
  const stageBase = new THREE.Mesh(
    new THREE.CylinderGeometry(1.85, 1.95, 0.07, 40),
    new THREE.MeshStandardMaterial({ color: 0x191918, roughness: 0.22, metalness: 0.2 })
  );
  stageBase.position.y = 0.035;
  stageBase.receiveShadow = true;
  centerStageGroup.add(stageBase);

  const stageBrassRim = new THREE.Mesh(
    new THREE.TorusGeometry(1.9, 0.025, 12, 48),
    goldMat
  );
  stageBrassRim.rotation.x = Math.PI / 2;
  stageBrassRim.position.y = 0.05;
  centerStageGroup.add(stageBrassRim);

  const innerRing = new THREE.Mesh(
    new THREE.RingGeometry(0.62, 1.75, 40),
    new THREE.MeshStandardMaterial({ color: 0x252422, roughness: 0.3, metalness: 0.15 })
  );
  innerRing.rotation.x = -Math.PI / 2;
  innerRing.position.y = 0.072;
  innerRing.receiveShadow = true;
  centerStageGroup.add(innerRing);

  // --- THE BARBER CHAIR (Ultra-Detailed Classic Hydraulic Chair) ---
  const barberChairRoot = new THREE.Group();
  barberChairRoot.position.set(0, 0.07, 0);
  barberChairRoot.rotation.y = Math.PI * 0.85;
  centerStageGroup.add(barberChairRoot);

  // 1) Heavy Chrome Stepped Base
  const basePlate1 = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.52, 0.05, 32), chromeMat);
  basePlate1.position.y = 0.025;
  const basePlate2 = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.44, 0.07, 32), chromeMat);
  basePlate2.position.y = 0.08;
  const baseRubberRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.51, 0.018, 10, 36),
    new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 })
  );
  baseRubberRing.rotation.x = Math.PI / 2;
  baseRubberRing.position.y = 0.015;
  barberChairRoot.add(basePlate1, basePlate2, baseRubberRing);

  // 2) Hydraulic Piston Column & Foot Pump Lever
  const pistonOuter = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.28, 20), chromeMat);
  pistonOuter.position.y = 0.24;
  barberChairRoot.add(pistonOuter);

  const chairSwivelGroup = new THREE.Group();
  chairSwivelGroup.position.y = 0.52;
  barberChairRoot.add(chairSwivelGroup);

  const pistonInner = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.38, 20), chromeMat);
  pistonInner.position.y = -0.14;
  chairSwivelGroup.add(pistonInner);

  const pumpPedalGroup = new THREE.Group();
  pumpPedalGroup.position.set(-0.12, -0.22, -0.18);
  chairSwivelGroup.add(pumpPedalGroup);
  const pedalRod = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.36, 10), chromeMat);
  pedalRod.rotation.z = Math.PI / 3;
  pedalRod.position.set(-0.14, 0.06, 0);
  const pedalPad = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.025, 0.08),
    new THREE.MeshStandardMaterial({ color: 0x181818, roughness: 0.8 })
  );
  pedalPad.position.set(-0.28, 0.14, 0);
  pumpPedalGroup.add(pedalRod, pedalPad);

  // 3) Seat Frame & Plush Tufted Burgundy Cushion
  const seatChassis = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.08, 0.62), chromeMat);
  seatChassis.position.y = 0;
  chairSwivelGroup.add(seatChassis);

  const seatCushion = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.15, 0.60), chairLeatherMat);
  seatCushion.position.y = 0.11;
  seatCushion.castShadow = true;
  seatCushion.receiveShadow = true;
  chairSwivelGroup.add(seatCushion);

  const seatBolster = new THREE.Mesh(
    new THREE.CylinderGeometry(0.075, 0.075, 0.62, 16),
    chairLeatherMat
  );
  seatBolster.rotation.z = Math.PI / 2;
  seatBolster.position.set(0, 0.11, 0.30);
  chairSwivelGroup.add(seatBolster);

  for (let z = -0.24; z <= 0.24; z += 0.08) {
    [-0.315, 0.315].forEach((xSide) => {
      const tack = new THREE.Mesh(new THREE.SphereGeometry(0.01, 6, 6), goldMat);
      tack.position.set(xSide, 0.055, z);
      chairSwivelGroup.add(tack);
    });
  }

  // 4) Reclining Backrest Assembly
  const chairBackPivot = new THREE.Group();
  chairBackPivot.position.set(0, 0.16, -0.27);
  chairBackPivot.rotation.x = -0.16;
  chairSwivelGroup.add(chairBackPivot);

  [-0.28, 0.28].forEach((bx) => {
    const upright = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.68, 0.05), chromeMat);
    upright.position.set(bx, 0.34, -0.03);
    chairBackPivot.add(upright);
  });

  const backrestCushion = new THREE.Mesh(
    new THREE.BoxGeometry(0.58, 0.64, 0.13),
    chairLeatherMat
  );
  backrestCushion.position.set(0, 0.35, 0.02);
  backrestCushion.castShadow = true;
  chairBackPivot.add(backrestCushion);

  const backrestCrown = new THREE.Mesh(
    new THREE.CylinderGeometry(0.065, 0.065, 0.58, 16),
    smoothBurgundyLeatherMat
  );
  backrestCrown.rotation.z = Math.PI / 2;
  backrestCrown.position.set(0, 0.67, 0.02);
  chairBackPivot.add(backrestCrown);

  for (let row = 0; row < 3; row++) {
    for (let col = -1; col <= 1; col++) {
      const btn = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 8), smoothBurgundyLeatherMat);
      btn.position.set(col * 0.14 + (row % 2) * 0.05, 0.18 + row * 0.16, 0.088);
      chairBackPivot.add(btn);
    }
  }

  const rearShell = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.58, 0.02), chromeMat);
  rearShell.position.set(0, 0.35, -0.05);
  chairBackPivot.add(rearShell);

  // 5) Articulated Adjustable Headrest
  const headrestGroup = new THREE.Group();
  headrestGroup.position.set(0, 0.76, 0.02);
  chairBackPivot.add(headrestGroup);

  [-0.09, 0.09].forEach((hx) => {
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.22, 10), chromeMat);
    rod.position.set(hx, 0, -0.02);
    headrestGroup.add(rod);
  });

  const headrestPad = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 0.16, 0.09),
    smoothBurgundyLeatherMat
  );
  headrestPad.position.set(0, 0.09, 0.02);
  headrestPad.castShadow = true;
  headrestGroup.add(headrestPad);

  // 6) Sculpted Chrome & Leather Armrests + Side Recline Handle
  [-0.35, 0.35].forEach((ax) => {
    const armGroup = new THREE.Group();
    armGroup.position.set(ax, 0.12, 0);
    chairSwivelGroup.add(armGroup);

    const frontPost = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.032, 0.26, 12), chromeMat);
    frontPost.position.set(0, 0.12, 0.22);
    const rearPost = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.028, 0.26, 12), chromeMat);
    rearPost.position.set(0, 0.12, -0.22);

    const armPad = new THREE.Mesh(
      new THREE.BoxGeometry(0.09, 0.06, 0.56),
      smoothBurgundyLeatherMat
    );
    armPad.position.set(0, 0.26, 0);

    const scrollCap = new THREE.Mesh(new THREE.SphereGeometry(0.046, 12, 12), chromeMat);
    scrollCap.position.set(0, 0.25, 0.29);

    armGroup.add(frontPost, rearPost, armPad, scrollCap);
  });

  const reclineLever = new THREE.Group();
  reclineLever.position.set(0.41, 0.22, -0.12);
  const leverShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.32, 10), chromeMat);
  leverShaft.rotation.x = -0.35;
  leverShaft.position.y = 0.12;
  const leverKnob = new THREE.Mesh(new THREE.SphereGeometry(0.028, 12, 12), blackIronMat);
  leverKnob.position.set(0, 0.27, -0.05);
  reclineLever.add(leverShaft, leverKnob);
  chairSwivelGroup.add(reclineLever);

  const capeMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.13, 0.34, 0.32),
    new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.75 })
  );
  capeMesh.position.set(-0.37, 0.24, 0.05);
  capeMesh.rotation.z = 0.12;
  chairSwivelGroup.add(capeMesh);

  // 7) Classic Cast-Chrome Footrest & Calf Pad Assembly
  const footrestGroup = new THREE.Group();
  footrestGroup.position.set(0, 0.04, 0.32);
  footrestGroup.rotation.x = 0.42;
  chairSwivelGroup.add(footrestGroup);

  [-0.22, 0.22].forEach((fx) => {
    const strut = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.48, 0.03), chromeMat);
    strut.position.set(fx, -0.22, 0.08);
    footrestGroup.add(strut);
  });

  const calfPad = new THREE.Mesh(
    new THREE.BoxGeometry(0.46, 0.18, 0.06),
    smoothBurgundyLeatherMat
  );
  calfPad.position.set(0, -0.14, 0.09);
  footrestGroup.add(calfPad);

  const footPlate = new THREE.Mesh(new THREE.BoxGeometry(0.50, 0.03, 0.28), brushedSteelMat);
  footPlate.position.set(0, -0.44, 0.22);
  footPlate.rotation.x = -0.42;
  footrestGroup.add(footPlate);

  registerInteractable(barberChairRoot, {
    id: 'barber-chair',
    title: 'El Sillón del Barbero (Centro del Estudio)',
    subtitle: 'Click para accionar el sistema hidráulico, girar 360° o sentarte en primera persona',
    category: 'surprise',
    badgePos: new THREE.Vector3(0, 1.55, 0)
  });

  obstacleBoxes.push({ minX: -0.95, maxX: 0.95, minZ: -0.95, maxZ: 0.95 });

  // --- ROLLING BARBER TOOL TROLLEY (Right next to the Chair) ---
  const trolleyGroup = new THREE.Group();
  trolleyGroup.position.set(1.22, 0.07, -0.28);
  trolleyGroup.rotation.y = -0.35;
  centerStageGroup.add(trolleyGroup);

  [
    [-0.32, -0.22],
    [0.32, -0.22],
    [-0.32, 0.22],
    [0.32, 0.22]
  ].forEach(([tx, tz]) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.86, 10), blackIronMat);
    leg.position.set(tx, 0.45, tz);
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.025, 10), chromeMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(tx, 0.03, tz);
    trolleyGroup.add(leg, wheel);
  });

  [0.16, 0.50, 0.86].forEach((sy) => {
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.035, 0.48), walnutMat);
    shelf.position.y = sy;
    shelf.castShadow = true;
    shelf.receiveShadow = true;
    trolleyGroup.add(shelf);
  });

  const rubberMat = new THREE.Mesh(
    new THREE.BoxGeometry(0.60, 0.012, 0.40),
    new THREE.MeshStandardMaterial({ map: rubberMatTex, roughness: 0.85 })
  );
  rubberMat.position.set(0, 0.884, 0);
  trolleyGroup.add(rubberMat);

  const sterilizerBox = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.09, 0.14), chromeMat);
  sterilizerBox.position.set(-0.18, 0.93, -0.05);
  trolleyGroup.add(sterilizerBox);

  // Interactive #1 on Trolley: Gold/Chrome Cordless Hair Clippers
  const clippersGroup = new THREE.Group();
  clippersGroup.position.set(0.02, 0.91, 0.04);
  clippersGroup.rotation.y = 0.25;
  trolleyGroup.add(clippersGroup);

  const clipperBody = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.022, 0.16, 14), goldMat);
  clipperBody.rotation.x = Math.PI / 2;
  const clipperBlade = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.012, 0.035), chromeMat);
  clipperBlade.position.set(0, 0.012, 0.085);
  const clipperGrip = new THREE.Mesh(new THREE.CylinderGeometry(0.027, 0.025, 0.06, 14), blackIronMat);
  clipperGrip.rotation.x = Math.PI / 2;
  clipperGrip.position.z = -0.01;
  clippersGroup.add(clipperBody, clipperBlade, clipperGrip);

  registerInteractable(clippersGroup, {
    id: 'surprise-clippers',
    title: 'Máquina Cortapelos Profesional (Gold FX)',
    subtitle: 'Click para encender la máquina y escuchar el corte en vivo',
    category: 'surprise'
  });

  // Interactive #2 on Trolley: Barber Scissors
  const scissorsGroup = new THREE.Group();
  scissorsGroup.position.set(0.15, 0.90, 0.05);
  scissorsGroup.rotation.y = -0.2;
  trolleyGroup.add(scissorsGroup);

  const blade1 = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.004, 0.15), chromeMat);
  blade1.rotation.y = 0.12;
  const blade2 = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.004, 0.15), chromeMat);
  blade2.rotation.y = -0.12;
  const ring1 = new THREE.Mesh(new THREE.TorusGeometry(0.018, 0.004, 8, 16), goldMat);
  ring1.rotation.x = Math.PI / 2;
  ring1.position.set(-0.02, 0, -0.08);
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.018, 0.004, 8, 16), goldMat);
  ring2.rotation.x = Math.PI / 2;
  ring2.position.set(0.02, 0, -0.08);
  scissorsGroup.add(blade1, blade2, ring1, ring2);

  registerInteractable(scissorsGroup, {
    id: 'surprise-scissors',
    title: 'Tijeras de Barbero & Peine',
    subtitle: 'Click para probar la precisión de las tijeras de Pipa',
    category: 'surprise'
  });

  // Interactive #3 on Trolley: Chrome Water Spray Bottle
  const sprayGroup = new THREE.Group();
  sprayGroup.position.set(0.22, 0.89, -0.10);
  trolleyGroup.add(sprayGroup);

  const sprayBottle = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.042, 0.15, 16), chromeMat);
  sprayBottle.position.y = 0.075;
  const sprayNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.022, 0.04, 12), blackIronMat);
  sprayNeck.position.y = 0.165;
  const sprayNozzle = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.025, 0.07), blackIronMat);
  sprayNozzle.position.set(0, 0.185, 0.015);
  sprayGroup.add(sprayBottle, sprayNeck, sprayNozzle);

  registerInteractable(sprayGroup, {
    id: 'surprise-spray',
    title: 'Rociador Metálico de Barbería',
    subtitle: 'Click para pulverizar bruma de agua fresca',
    category: 'surprise'
  });

  // Glowing Blue Barbicide Disinfectant Jar
  const barbicideGroup = new THREE.Group();
  barbicideGroup.position.set(-0.03, 0.89, -0.11);
  const jarGlass = new THREE.Mesh(
    new THREE.CylinderGeometry(0.042, 0.042, 0.17, 16),
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.35,
      roughness: 0.1
    })
  );
  jarGlass.position.y = 0.085;
  const jarLiquid = new THREE.Mesh(
    new THREE.CylinderGeometry(0.038, 0.038, 0.13, 16),
    new THREE.MeshStandardMaterial({
      color: 0x0088ff,
      emissive: 0x0044aa,
      emissiveIntensity: 0.45,
      transparent: true,
      opacity: 0.82
    })
  );
  jarLiquid.position.y = 0.07;
  const jarCap = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.02, 16), chromeMat);
  jarCap.position.y = 0.175;
  barbicideGroup.add(jarGlass, jarLiquid, jarCap);
  trolleyGroup.add(barbicideGroup);

  for (let t = 0; t < 3; t++) {
    const towel = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.045, 0.30),
      new THREE.MeshStandardMaterial({ color: 0xf7f5f0, roughness: 0.9 })
    );
    towel.position.set(-0.14, 0.54 + t * 0.048, 0);
    trolleyGroup.add(towel);
  }

  obstacleBoxes.push({ minX: 0.75, maxX: 1.7, minZ: -0.75, maxZ: 0.25 });

  // --- ETHEOS RING LIGHT ON TRIPOD ---
  const ringLightGroup = new THREE.Group();
  ringLightGroup.position.set(-1.35, 0, 0.68);
  ringLightGroup.rotation.y = Math.PI * 0.72;
  centerStageGroup.add(ringLightGroup);

  for (let l = 0; l < 3; l++) {
    const ang = (l / 3) * Math.PI * 2;
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.65, 8), blackIronMat);
    leg.position.set(Math.cos(ang) * 0.18, 0.26, Math.sin(ang) * 0.18);
    leg.rotation.z = -Math.cos(ang) * 0.45;
    leg.rotation.x = Math.sin(ang) * 0.45;
    ringLightGroup.add(leg);
  }

  const tripodPole = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.022, 1.45, 12), blackIronMat);
  tripodPole.position.y = 0.85;
  ringLightGroup.add(tripodPole);

  const ringOuter = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.026, 12, 36), blackIronMat);
  ringOuter.position.y = 1.68;
  const ringLedMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xfff5e4,
    emissiveIntensity: 2.2
  });
  const ringLed = new THREE.Mesh(new THREE.TorusGeometry(0.245, 0.016, 12, 36), ringLedMat);
  ringLed.position.set(0, 1.68, 0.012);

  const phoneMount = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.15, 0.012), blackIronMat);
  phoneMount.position.set(0, 1.64, 0);

  ringLightGroup.add(ringOuter, ringLed, phoneMount);

  const ringPointLight = new THREE.PointLight(0xfff5e4, 1.2, 4.5);
  ringPointLight.position.set(0, 1.68, 0.25);
  ringLightGroup.add(ringPointLight);

  registerInteractable(ringLightGroup, {
    id: 'surprise-ringlight',
    title: 'Aro de Luz ETHEOS Studio',
    subtitle: 'Click para cambiar el tono de luz de fotografía (Cálido / Frío / RGB / Off)',
    category: 'surprise',
    badgePos: new THREE.Vector3(-1.35, 2.15, 0.68)
  });

  // ============================================================================
  // 3. NORTH STATION: "¿QUIÉN SOY? (PIPA)", BARBER POLE & "01 / SERVICIOS"
  // ============================================================================
  const northStationGroup = new THREE.Group();
  northStationGroup.position.set(-1.35, 0, -5.42);
  scene.add(northStationGroup);

  const mainCounter = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.92, 0.72), walnutMat);
  mainCounter.position.y = 0.46;
  mainCounter.castShadow = true;
  mainCounter.receiveShadow = true;
  northStationGroup.add(mainCounter);

  const counterTop = new THREE.Mesh(
    new THREE.BoxGeometry(3.52, 0.05, 0.78),
    new THREE.MeshStandardMaterial({ color: 0x1e1e1c, roughness: 0.2, metalness: 0.15 })
  );
  counterTop.position.y = 0.945;
  northStationGroup.add(counterTop);

  for (let dx = -1.2; dx <= 1.2; dx += 0.8) {
    const drawerFront = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.22, 0.02), darkWoodMat);
    drawerFront.position.set(dx, 0.72, 0.365);
    const pull = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.02, 0.03), goldMat);
    pull.position.set(dx, 0.72, 0.385);
    northStationGroup.add(drawerFront, pull);
  }

  // Grand Illuminated Barber Mirror + Upright Logo Medallion ("THE PIP'S BARBER")
  const mirrorFrameGroup = new THREE.Group();
  mirrorFrameGroup.position.set(0, 2.25, -0.32);
  northStationGroup.add(mirrorFrameGroup);

  const mirrorWoodBack = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.15, 0.08), walnutMat);
  mirrorFrameGroup.add(mirrorWoodBack);

  const mirrorLedStripMat = new THREE.MeshStandardMaterial({
    color: 0xffdfaa,
    emissive: 0xffb85c,
    emissiveIntensity: 1.5
  });
  const mirrorLedBorder = new THREE.Mesh(new THREE.BoxGeometry(3.26, 2.21, 0.03), mirrorLedStripMat);
  mirrorLedBorder.position.z = -0.03;
  mirrorFrameGroup.add(mirrorLedBorder);

  const mirrorGlass = new THREE.Mesh(
    new THREE.PlaneGeometry(2.96, 1.90),
    new THREE.MeshStandardMaterial({
      color: 0xd8e0e8,
      metalness: 0.94,
      roughness: 0.06
    })
  );
  mirrorGlass.position.z = 0.045;
  mirrorFrameGroup.add(mirrorGlass);

  // FIXED UPRIGHT LOGO MEDALLION (Uses CircleGeometry in XY plane so 0° tilt!)
  const logoMedallionGroup = new THREE.Group();
  logoMedallionGroup.position.set(0, 0.96, 0.08);
  mirrorFrameGroup.add(logoMedallionGroup);

  const logoBackingCylinder = new THREE.Mesh(
    new THREE.CylinderGeometry(0.48, 0.48, 0.04, 36),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 })
  );
  logoBackingCylinder.rotation.x = Math.PI / 2;
  const logoFrontFace = new THREE.Mesh(
    new THREE.CircleGeometry(0.475, 48),
    new THREE.MeshStandardMaterial({ map: logoTex, roughness: 0.28 })
  );
  logoFrontFace.position.z = 0.022;
  const logoGoldRim = new THREE.Mesh(new THREE.TorusGeometry(0.485, 0.025, 14, 48), goldMat);
  logoMedallionGroup.add(logoBackingCylinder, logoFrontFace, logoGoldRim);

  // Tonic & Aftershave Bottles on Main Counter
  const bottleColors = [0xc85a17, 0x226644, 0x992222, 0xd4a359, 0x1e488f];
  bottleColors.forEach((col, idx) => {
    const bx = -1.25 + idx * 0.22;
    const bottle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.032, 0.038, 0.16, 12),
      new THREE.MeshStandardMaterial({
        color: col,
        transparent: true,
        opacity: 0.85,
        roughness: 0.15
      })
    );
    bottle.position.set(bx, 1.05, -0.12);
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.016, 0.04, 10), goldMat);
    neck.position.set(bx, 1.15, -0.12);
    northStationGroup.add(bottle, neck);
  });

  // Framed Portrait on Counter
  const pipaFrameGroup = new THREE.Group();
  pipaFrameGroup.position.set(0.95, 1.18, -0.05);
  pipaFrameGroup.rotation.y = -0.25;
  northStationGroup.add(pipaFrameGroup);

  const frameBox = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.54, 0.03), goldMat);
  frameBox.rotation.x = -0.18;
  const framePhoto = new THREE.Mesh(
    new THREE.PlaneGeometry(0.38, 0.48),
    new THREE.MeshStandardMaterial({ map: posterTextures[1], roughness: 0.4 })
  );
  framePhoto.rotation.x = -0.18;
  framePhoto.position.set(0, 0, 0.018);
  pipaFrameGroup.add(frameBox, framePhoto);

  registerInteractable(northStationGroup, {
    id: 'section-pipa',
    title: '¿Quién Soy? — Hola, soy Pipa',
    subtitle: 'Barbería tradicional · Conocé mi historia, mis herramientas y filosofía',
    category: 'section',
    sectionTarget: 'pipa',
    badgePos: new THREE.Vector3(-1.35, 2.35, -4.9)
  });

  // Kayak mounted high on North Wall (pipa-02.jpg detail)
  const kayakGroup = new THREE.Group();
  kayakGroup.position.set(-1.35, 3.88, -5.65);
  scene.add(kayakGroup);

  const kayakHull = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.18, 2.4, 10, 20),
    new THREE.MeshStandardMaterial({ color: 0x0ea5e9, roughness: 0.3, metalness: 0.1 })
  );
  kayakHull.rotation.z = Math.PI / 2;
  kayakHull.scale.set(1, 1, 0.55);
  const kayakStripe = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.182, 1.5, 10, 20),
    new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.35 })
  );
  kayakStripe.rotation.z = Math.PI / 2;
  kayakStripe.scale.set(1, 1, 0.56);
  kayakGroup.add(kayakHull, kayakStripe);

  obstacleBoxes.push({ minX: -3.2, maxX: 0.5, minZ: -6.0, maxZ: -4.85 });

  // ============================================================================
  // CLASSIC SPINNING 3D BARBER POLES (CILINDRO DE LOS PELUQUEROS)
  // Placed right in front of the Chair to the LEFT of the background mirror/screen
  // AND flanking the left of the West TV screen!
  // ============================================================================
  const poleCylinders = [];

  function createBarberPoleAssembly(posX, posY, posZ, wallNormalAngle = 0) {
    const group = new THREE.Group();
    group.position.set(posX, posY, posZ);
    group.rotation.y = wallNormalAngle;
    scene.add(group);

    // Wall mount chrome brackets
    [-0.58, 0.58].forEach((by) => {
      const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.32), chromeMat);
      bracket.position.set(0, by, -0.14);
      group.add(bracket);
    });

    // Inner Rotating Helical Striped Cylinder
    const cyl = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.18, 1.18, 32),
      new THREE.MeshStandardMaterial({
        map: barberPoleTex,
        emissive: 0xffffff,
        emissiveMap: barberPoleTex,
        emissiveIntensity: 0.65,
        roughness: 0.2
      })
    );
    group.add(cyl);
    poleCylinders.push(cyl);

    // Clear Outer Glass Housing
    const glassTube = new THREE.Mesh(
      new THREE.CylinderGeometry(0.215, 0.215, 1.20, 28),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.22,
        roughness: 0.08,
        metalness: 0.2
      })
    );
    group.add(glassTube);

    // 4 Vertical Chrome Guard Bars around glass
    for (let i = 0; i < 4; i++) {
      const ang = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 1.22, 8), chromeMat);
      bar.position.set(Math.cos(ang) * 0.225, 0, Math.sin(ang) * 0.225);
      group.add(bar);
    }

    // Top & Bottom Fluted Chrome Caps
    const topRing = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.23, 0.08, 28), chromeMat);
    topRing.position.y = 0.62;
    const topDome = new THREE.Mesh(
      new THREE.SphereGeometry(0.23, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2),
      chromeMat
    );
    topDome.position.y = 0.65;

    // Classic Glowing Top Globe Finial (just like The Pip's Barber logo!)
    const topGlobe = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 20, 16),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xfff0d0,
        emissiveIntensity: 1.4,
        roughness: 0.15
      })
    );
    topGlobe.position.y = 0.94;

    const botRing = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.24, 0.08, 28), chromeMat);
    botRing.position.y = -0.62;
    const botDome = new THREE.Mesh(
      new THREE.SphereGeometry(0.23, 24, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
      chromeMat
    );
    botDome.position.y = -0.65;
    const botFinial = new THREE.Mesh(new THREE.SphereGeometry(0.065, 16, 12), chromeMat);
    botFinial.position.y = -0.90;

    group.add(topRing, topDome, topGlobe, botRing, botDome, botFinial);
    return group;
  }

  // Primary Barber Pole: Front-facing on the North background wall, to the left of the main mirror/screen!
  const frontBarberPole = createBarberPoleAssembly(-3.85, 2.25, -5.52, 0);

  // Secondary Barber Pole: On the West Wall right to the left of the 65" Smart TV screen!
  const tvSideBarberPole = createBarberPoleAssembly(-6.52, 2.28, 1.32, Math.PI / 2);

  const poleGlowLight = new THREE.PointLight(0xff4444, 1.1, 4.8);
  poleGlowLight.position.set(-3.85, 2.25, -5.0);
  scene.add(poleGlowLight);

  registerInteractable(frontBarberPole, {
    id: 'surprise-pole',
    title: 'Cilindro Clásico de Barbería (Barber Pole)',
    subtitle: 'Click para cambiar la velocidad de giro (Clásico / Turbo / Pausa)',
    category: 'surprise',
    badgePos: new THREE.Vector3(-3.85, 3.25, -5.35)
  });

  registerInteractable(tvSideBarberPole, {
    id: 'surprise-pole',
    title: 'Cilindro de Peluquería',
    subtitle: 'Click para cambiar la velocidad de giro del cilindro',
    category: 'surprise'
  });

  // --- 3D SERVICES BOARD ON NORTH-EAST WALL ("01 / NUESTROS SERVICIOS") ---
  const servicesWallGroup = new THREE.Group();
  servicesWallGroup.position.set(2.95, 2.15, -5.82);
  scene.add(servicesWallGroup);

  const servicesFrame = new THREE.Mesh(new THREE.BoxGeometry(2.75, 2.05, 0.08), walnutMat);
  const servicesGoldTrim = new THREE.Mesh(new THREE.BoxGeometry(2.62, 1.92, 0.09), goldMat);
  const servicesFace = new THREE.Mesh(
    new THREE.PlaneGeometry(2.56, 1.86),
    new THREE.MeshStandardMaterial({
      map: servicesBoardTex,
      roughness: 0.45
    })
  );
  servicesFace.position.z = 0.05;

  const picLightArm = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.04, 0.25), goldMat);
  picLightArm.position.set(0, 1.12, 0.12);

  servicesWallGroup.add(servicesFrame, servicesGoldTrim, servicesFace, picLightArm);

  registerInteractable(servicesWallGroup, {
    id: 'section-servicios',
    title: '01 / Nuestros Servicios',
    subtitle: 'Corte de Adultos (40 min) · Corte de Barba (40 min) · Ver detalles y reservar',
    category: 'section',
    sectionTarget: 'servicios',
    badgePos: new THREE.Vector3(2.95, 2.55, -5.55)
  });

  // ============================================================================
  // 4. WEST WALL: "03 / PUERTAS ADENTRO (VIDEOS EN VIVO)" + TOCADISCOS VINTAGE
  // ============================================================================
  const mediaWallGroup = new THREE.Group();
  mediaWallGroup.position.set(-6.82, 0, -0.8);
  mediaWallGroup.rotation.y = Math.PI / 2;
  scene.add(mediaWallGroup);

  const tvVideoEl = document.createElement('video');
  tvVideoEl.src = '../assets/pipa-02.mp4';
  tvVideoEl.crossOrigin = 'anonymous';
  tvVideoEl.loop = true;
  tvVideoEl.muted = true;
  tvVideoEl.playsInline = true;
  tvVideoEl.play().catch(() => {});

  const tvVideoTex = new THREE.VideoTexture(tvVideoEl);
  tvVideoTex.colorSpace = THREE.SRGBColorSpace;

  const tvGroup = new THREE.Group();
  tvGroup.position.set(0, 2.32, 0);
  mediaWallGroup.add(tvGroup);

  const tvBezel = new THREE.Mesh(new THREE.BoxGeometry(1.45, 2.25, 0.07), blackIronMat);
  const tvScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(1.32, 2.12),
    new THREE.MeshBasicMaterial({ map: tvVideoTex })
  );
  tvScreen.position.z = 0.04;

  const tvBackGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(1.6, 2.4),
    new THREE.MeshBasicMaterial({
      color: 0xdf2528,
      transparent: true,
      opacity: 0.18
    })
  );
  tvBackGlow.position.z = -0.02;
  tvGroup.add(tvBezel, tvScreen, tvBackGlow);

  // 5 Framed Video Posters flanking the TV
  const frameOffsets = [
    [-1.4, 2.65, 0],
    [-1.4, 1.75, 1],
    [1.4, 2.65, 2],
    [1.4, 1.75, 3],
    [2.25, 2.20, 4]
  ];
  frameOffsets.forEach(([fx, fy, pIdx]) => {
    const fGroup = new THREE.Group();
    fGroup.position.set(fx, fy, 0);
    const fBorder = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.78, 0.04), goldMat);
    const fPic = new THREE.Mesh(
      new THREE.PlaneGeometry(0.54, 0.70),
      new THREE.MeshStandardMaterial({
        map: posterTextures[pIdx],
        roughness: 0.35
      })
    );
    fPic.position.z = 0.025;
    fGroup.add(fBorder, fPic);
    mediaWallGroup.add(fGroup);
  });

  registerInteractable(mediaWallGroup, {
    id: 'section-videos',
    title: '03 / Puertas Adentro — El Oficio en Movimiento',
    subtitle: 'Mirar los 5 videos reales de cortes con Pipa o cambiar el canal de la TV 3D',
    category: 'section',
    sectionTarget: 'galeria',
    badgePos: new THREE.Vector3(-6.45, 2.55, -0.8)
  });

  // --- VINTAGE CREDENZA & VINYL TURNTABLE ---
  const turntableStandGroup = new THREE.Group();
  turntableStandGroup.position.set(-6.35, 0, 2.65);
  turntableStandGroup.rotation.y = Math.PI / 2;
  scene.add(turntableStandGroup);

  const credenza = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.78, 0.52), walnutMat);
  credenza.position.y = 0.39;
  credenza.castShadow = true;
  credenza.receiveShadow = true;
  turntableStandGroup.add(credenza);

  const playerBase = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.08, 0.42), darkWoodMat);
  playerBase.position.set(0, 0.82, 0);
  turntableStandGroup.add(playerBase);

  const vinylDisc = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.16, 0.01, 24),
    new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.2, metalness: 0.4 })
  );
  vinylDisc.position.set(-0.04, 0.868, 0);
  const vinylLabel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.055, 0.012, 18),
    new THREE.MeshStandardMaterial({ color: 0xdf2528 })
  );
  vinylDisc.add(vinylLabel);
  turntableStandGroup.add(vinylDisc);

  const toneArm = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.22, 8), chromeMat);
  toneArm.rotation.x = Math.PI / 2;
  toneArm.rotation.z = 0.35;
  toneArm.position.set(0.14, 0.88, 0.02);
  turntableStandGroup.add(toneArm);

  registerInteractable(turntableStandGroup, {
    id: 'surprise-turntable',
    title: 'Tocadiscos & Audio del Estudio',
    subtitle: 'Click para reproducir el ritmo de "02 - Pipa en Acción" o cambiar de pista',
    category: 'surprise',
    badgePos: new THREE.Vector3(-6.15, 1.35, 2.65)
  });

  obstacleBoxes.push({ minX: -7.0, maxX: -5.9, minZ: 1.8, maxZ: 3.4 });

  // ============================================================================
  // 5. SOUTH-WEST STATION: "04 / RESERVAR TURNO (AGENDA SETMORE)"
  // ============================================================================
  const receptionGroup = new THREE.Group();
  receptionGroup.position.set(-3.6, 0, 4.1);
  receptionGroup.rotation.y = Math.PI * 0.88;
  scene.add(receptionGroup);

  const deskBody = new THREE.Mesh(new THREE.BoxGeometry(2.15, 1.05, 0.78), walnutMat);
  deskBody.position.y = 0.525;
  deskBody.castShadow = true;
  deskBody.receiveShadow = true;
  receptionGroup.add(deskBody);

  const deskTop = new THREE.Mesh(
    new THREE.BoxGeometry(2.26, 0.06, 0.86),
    new THREE.MeshStandardMaterial({ color: 0x161615, roughness: 0.22, metalness: 0.2 })
  );
  deskTop.position.y = 1.08;
  receptionGroup.add(deskTop);

  const deskFrontSign = new THREE.Mesh(
    new THREE.PlaneGeometry(1.6, 0.55),
    new THREE.MeshStandardMaterial({
      color: 0xdf2528,
      roughness: 0.4
    })
  );
  deskFrontSign.position.set(0, 0.55, 0.395);
  receptionGroup.add(deskFrontSign);

  const tabletStandGroup = new THREE.Group();
  tabletStandGroup.position.set(-0.22, 1.11, 0.05);
  receptionGroup.add(tabletStandGroup);

  const standBase = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.03, 0.22), brushedSteelMat);
  const standNeck = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.22, 0.04), brushedSteelMat);
  standNeck.position.set(0, 0.11, -0.03);
  standNeck.rotation.x = -0.25;

  const tabletBezel = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.42, 0.025), blackIronMat);
  tabletBezel.position.set(0, 0.24, 0.02);
  tabletBezel.rotation.x = -0.35;

  const tabletScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.51, 0.37),
    new THREE.MeshStandardMaterial({
      map: tabletTex,
      emissive: 0xffffff,
      emissiveMap: tabletTex,
      emissiveIntensity: 0.55,
      roughness: 0.2
    })
  );
  tabletScreen.position.set(0, 0.24, 0.035);
  tabletScreen.rotation.x = -0.35;
  tabletStandGroup.add(standBase, standNeck, tabletBezel, tabletScreen);

  registerInteractable(tabletStandGroup, {
    id: 'section-reservar',
    title: '04 / Reservá tu Turno (Calendario en Vivo)',
    subtitle: 'Elegí tu horario de Lunes a Viernes de 10 a 18 hs en la agenda oficial de Pipa',
    category: 'section',
    sectionTarget: 'reservar',
    badgePos: new THREE.Vector3(-3.45, 1.85, 3.95)
  });

  // Brass Reception Service Bell
  const bellGroup = new THREE.Group();
  bellGroup.position.set(0.55, 1.11, 0.12);
  receptionGroup.add(bellGroup);

  const bellBase = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.02, 20), blackIronMat);
  const bellDome = new THREE.Mesh(
    new THREE.SphereGeometry(0.075, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2),
    goldMat
  );
  bellDome.position.y = 0.01;
  const bellPin = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.03, 10), chromeMat);
  bellPin.position.y = 0.09;
  bellGroup.add(bellBase, bellDome, bellPin);

  registerInteractable(bellGroup, {
    id: 'surprise-bell',
    title: 'Timbre Clásico de Recepción',
    subtitle: 'Click para tocar la campanilla y llamar a Pipa (¡Ding!)',
    category: 'surprise'
  });

  obstacleBoxes.push({ minX: -4.9, maxX: -2.3, minZ: 3.4, maxZ: 4.8 });

  // ============================================================================
  // 6. SOUTH-EAST LOUNGE: "ANTES DE VENIR (FAQ)" + MESA REDONDA CON MATE
  // ============================================================================
  const loungeGroup = new THREE.Group();
  loungeGroup.position.set(3.5, 0, 3.6);
  scene.add(loungeGroup);

  const rugMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(3.6, 2.8),
    new THREE.MeshStandardMaterial({ map: rugTex, roughness: 0.88 })
  );
  rugMesh.rotation.x = -Math.PI / 2;
  rugMesh.position.set(0.2, 0.008, 0.25);
  rugMesh.receiveShadow = true;
  loungeGroup.add(rugMesh);

  const sofaGroup = new THREE.Group();
  sofaGroup.position.set(0.3, 0, 1.25);
  sofaGroup.rotation.y = Math.PI;
  loungeGroup.add(sofaGroup);

  const sofaMat = new THREE.MeshStandardMaterial({
    map: sofaLeather.map,
    bumpMap: sofaLeather.bumpMap,
    bumpScale: 0.015,
    roughness: 0.42
  });

  const sofaBase = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.36, 0.88), sofaMat);
  sofaBase.position.y = 0.24;
  sofaBase.castShadow = true;
  const sofaBack = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.56, 0.24), sofaMat);
  sofaBack.position.set(0, 0.64, -0.32);
  sofaBack.castShadow = true;
  const sofaArmL = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.48, 0.88), sofaMat);
  sofaArmL.position.set(-1.05, 0.52, 0);
  const sofaArmR = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.48, 0.88), sofaMat);
  sofaArmR.position.set(1.05, 0.52, 0);
  sofaGroup.add(sofaBase, sofaBack, sofaArmL, sofaArmR);

  // Round Wooden Coffee Table
  const coffeeTableGroup = new THREE.Group();
  coffeeTableGroup.position.set(0.3, 0, -0.15);
  loungeGroup.add(coffeeTableGroup);

  const tableTop = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.56, 0.045, 28), walnutMat);
  tableTop.position.y = 0.56;
  tableTop.castShadow = true;
  tableTop.receiveShadow = true;
  const tablePedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.54, 14), blackIronMat);
  tablePedestal.position.y = 0.27;
  coffeeTableGroup.add(tableTop, tablePedestal);

  for (let l = 0; l < 4; l++) {
    const ang = (l / 4) * Math.PI * 2 + Math.PI / 4;
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.03, 0.04), blackIronMat);
    foot.position.set(Math.cos(ang) * 0.18, 0.02, Math.sin(ang) * 0.18);
    foot.rotation.y = -ang;
    coffeeTableGroup.add(foot);
  }

  // Argentine Mate & Termo
  const mateGroup = new THREE.Group();
  mateGroup.position.set(0.05, 0.585, 0);
  coffeeTableGroup.add(mateGroup);

  const termoBody = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.27, 16), brushedSteelMat);
  termoBody.position.set(-0.12, 0.135, -0.05);
  const termoStopper = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.048, 0.04, 14), blackIronMat);
  termoStopper.position.set(-0.12, 0.28, -0.05);

  const mateGourd = new THREE.Mesh(
    new THREE.SphereGeometry(0.052, 16, 12),
    new THREE.MeshStandardMaterial({ color: 0x4a2511, roughness: 0.5 })
  );
  mateGourd.position.set(0.06, 0.05, 0.04);
  const mateYerba = new THREE.Mesh(
    new THREE.CylinderGeometry(0.038, 0.038, 0.02, 14),
    new THREE.MeshStandardMaterial({ color: 0x3f6212, roughness: 0.9 })
  );
  mateYerba.position.set(0.06, 0.09, 0.04);
  const bombilla = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.14, 8), chromeMat);
  bombilla.position.set(0.08, 0.12, 0.04);
  bombilla.rotation.z = -0.38;

  mateGroup.add(termoBody, termoStopper, mateGourd, mateYerba, bombilla);

  registerInteractable(mateGroup, {
    id: 'surprise-mate',
    title: 'El Mate del Estudio (Costumbre Argentina)',
    subtitle: 'Click para cebar un mate calentito mientras esperás tu turno',
    category: 'surprise',
    badgePos: new THREE.Vector3(3.85, 1.05, 3.45)
  });

  // --- "ANTES DE VENIR / PREGUNTAS FRECUENTES" CHALKBOARD EASEL STAND ---
  const faqEaselGroup = new THREE.Group();
  faqEaselGroup.position.set(-1.35, 0, -0.15);
  faqEaselGroup.rotation.y = -0.55;
  loungeGroup.add(faqEaselGroup);

  const faqBoardFrame = new THREE.Mesh(new THREE.BoxGeometry(0.96, 1.38, 0.06), walnutMat);
  faqBoardFrame.position.y = 1.12;
  faqBoardFrame.rotation.x = -0.12;
  faqBoardFrame.castShadow = true;

  const faqBoardFace = new THREE.Mesh(
    new THREE.PlaneGeometry(0.88, 1.28),
    new THREE.MeshStandardMaterial({ map: faqBoardTex, roughness: 0.5 })
  );
  faqBoardFace.position.set(0, 1.12, 0.035);
  faqBoardFace.rotation.x = -0.12;

  [-0.36, 0.36].forEach((lx) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.045, 1.85, 0.045), walnutMat);
    leg.position.set(lx, 0.9, -0.05);
    leg.rotation.x = -0.12;
    faqEaselGroup.add(leg);
  });
  const backLeg = new THREE.Mesh(new THREE.BoxGeometry(0.045, 1.85, 0.045), walnutMat);
  backLeg.position.set(0, 0.88, -0.38);
  backLeg.rotation.x = 0.25;
  faqEaselGroup.add(faqBoardFrame, faqBoardFace, backLeg);

  registerInteractable(faqEaselGroup, {
    id: 'section-faq',
    title: 'Antes de Venir — Preguntas Frecuentes',
    subtitle: 'Cómo funciona la reserva, elección de estilo, horarios y ubicación',
    category: 'section',
    sectionTarget: 'preguntas',
    badgePos: new THREE.Vector3(2.15, 2.05, 3.45)
  });

  obstacleBoxes.push({ minX: 2.3, maxX: 5.2, minZ: 2.8, maxZ: 5.5 });

  // ============================================================================
  // 7. STUDIO DECOR DETAILS: UPRIGHT CLOCK, NEON SIGN, PLANTS & WALL SWITCH
  // ============================================================================
  // FIXED UPRIGHT STUDIO CLOCK ON NORTH WALL (Uses CircleGeometry in XY plane so 0° tilt!)
  const clockGroup = new THREE.Group();
  clockGroup.position.set(0.82, 3.35, -5.82);
  scene.add(clockGroup);

  const clockRimBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.35, 0.05, 32),
    goldMat
  );
  clockRimBody.rotation.x = Math.PI / 2;
  const clockFrontFace = new THREE.Mesh(
    new THREE.CircleGeometry(0.335, 40),
    new THREE.MeshStandardMaterial({ map: clockTex, roughness: 0.3 })
  );
  clockFrontFace.position.z = 0.027;
  clockGroup.add(clockRimBody, clockFrontFace);

  // Glowing Neon Wall Sign ("THE PIP'S BARBER · STUDIO") on South Wall
  const neonGroup = new THREE.Group();
  neonGroup.position.set(0, 3.15, 5.82);
  neonGroup.rotation.y = Math.PI;
  scene.add(neonGroup);

  const neonBacking = new THREE.Mesh(
    new THREE.BoxGeometry(3.4, 0.72, 0.04),
    new THREE.MeshStandardMaterial({ color: 0x141413, roughness: 0.4 })
  );
  const neonTubeMat = new THREE.MeshStandardMaterial({
    color: 0xff3b3f,
    emissive: 0xdf2528,
    emissiveIntensity: 2.4
  });
  const neonTopBar = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 3.1, 10), neonTubeMat);
  neonTopBar.rotation.z = Math.PI / 2;
  neonTopBar.position.set(0, 0.26, 0.03);
  const neonBotBar = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 3.1, 10), neonTubeMat);
  neonBotBar.rotation.z = Math.PI / 2;
  neonBotBar.position.set(0, -0.26, 0.03);
  neonGroup.add(neonBacking, neonTopBar, neonBotBar);

  // Wall Light Switch on East Wall Pillar
  const lightSwitchGroup = new THREE.Group();
  lightSwitchGroup.position.set(6.82, 1.42, 0);
  lightSwitchGroup.rotation.y = -Math.PI / 2;
  scene.add(lightSwitchGroup);

  const switchPlate = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.26, 0.03), goldMat);
  const switchToggle = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.09, 0.05), blackIronMat);
  switchToggle.position.z = 0.025;
  switchToggle.rotation.x = -0.35;
  lightSwitchGroup.add(switchPlate, switchToggle);

  registerInteractable(lightSwitchGroup, {
    id: 'surprise-lightswitch',
    title: 'Interruptor General de Iluminación (Día / Noche)',
    subtitle: 'Click para alternar entre Luz Natural del Día y Luz Artificial Nocturna',
    category: 'surprise',
    badgePos: new THREE.Vector3(6.45, 1.75, 0)
  });

  // Lush Indoor Potted Plants in Corners
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x2d5a27, roughness: 0.55 });
  const potMat = new THREE.MeshStandardMaterial({ color: 0x22201e, roughness: 0.7 });
  [
    [5.8, -4.8],
    [5.8, 4.8],
    [-5.8, -4.8]
  ].forEach(([px, pz]) => {
    const pGroup = new THREE.Group();
    pGroup.position.set(px, 0, pz);
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.21, 0.48, 16), potMat);
    pot.position.y = 0.24;
    pGroup.add(pot);

    for (let b = 0; b < 6; b++) {
      const ang = (b / 6) * Math.PI * 2;
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), leafMat);
      leaf.scale.set(0.65, 1.6, 0.2);
      leaf.position.set(Math.cos(ang) * 0.18, 0.65 + (b % 3) * 0.14, Math.sin(ang) * 0.18);
      leaf.rotation.y = -ang;
      leaf.rotation.z = 0.35;
      pGroup.add(leaf);
    }
    scene.add(pGroup);
  });

  // ============================================================================
  // 8. OPTIMIZED LIGHTING SYSTEM (HIGH FPS + RICH DAY/NIGHT ATMOSPHERE)
  // ============================================================================
  const lights = {};

  // Ambient / Hemisphere Fill Light
  lights.hemi = new THREE.HemisphereLight(0xfff8eb, 0x3d2e22, 1.38);
  scene.add(lights.hemi);

  // Natural Sunlight streaming from East Windows onto the Central Barber Chair
  lights.sunSpot = new THREE.SpotLight(0xfff1d6, 5.2);
  lights.sunSpot.position.set(8.5, 4.1, 0.4);
  lights.sunSpot.target.position.set(0, 0.5, 0);
  lights.sunSpot.angle = Math.PI / 2.8;
  lights.sunSpot.penumbra = 0.55;
  lights.sunSpot.decay = 1.1;
  lights.sunSpot.distance = 20;
  lights.sunSpot.castShadow = true;
  lights.sunSpot.shadow.mapSize.width = 1024;
  lights.sunSpot.shadow.mapSize.height = 1024;
  lights.sunSpot.shadow.camera.near = 2;
  lights.sunSpot.shadow.camera.far = 18;
  lights.sunSpot.shadow.bias = -0.0008;
  scene.add(lights.sunSpot);
  scene.add(lights.sunSpot.target);

  // Overhead Key Spotlight directly above the Central Barber Chair
  lights.chairOverhead = new THREE.SpotLight(0xffe6ba, 3.2);
  lights.chairOverhead.position.set(0, 4.15, 0);
  lights.chairOverhead.target.position.set(0, 0, 0);
  lights.chairOverhead.angle = Math.PI / 3.0;
  lights.chairOverhead.penumbra = 0.65;
  lights.chairOverhead.castShadow = false; // Single shadow map from sunSpot keeps GPU at 60+ FPS
  scene.add(lights.chairOverhead);
  scene.add(lights.chairOverhead.target);

  // 5 Hanging Vintage Edison Industrial Pendant Lamps (Visual Fixtures)
  const pendantPositions = [
    [0, 3.65, 0],
    [-1.35, 3.65, -4.4],
    [2.95, 3.65, -4.4],
    [-3.6, 3.65, 3.5],
    [3.5, 3.65, 3.5]
  ];

  lights.pendantPointLights = [];
  lights.pendantBulbs = [];

  pendantPositions.forEach(([lx, ly, lz]) => {
    const pGroup = new THREE.Group();
    pGroup.position.set(lx, ly, lz);
    scene.add(pGroup);

    const cord = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.008, ROOM_H - ly, 6),
      blackIronMat
    );
    cord.position.y = (ROOM_H - ly) / 2;

    const shade = new THREE.Mesh(
      new THREE.ConeGeometry(0.24, 0.18, 20, 1, true),
      new THREE.MeshStandardMaterial({
        color: 0x1a1a18,
        metalness: 0.7,
        roughness: 0.35,
        side: THREE.DoubleSide
      })
    );
    shade.position.y = 0.05;

    const bulbMat = new THREE.MeshStandardMaterial({
      color: 0xffdfa0,
      emissive: 0xffaa33,
      emissiveIntensity: 1.5
    });
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 12), bulbMat);
    bulb.position.y = -0.02;

    pGroup.add(cord, shade, bulb);
    lights.pendantBulbs.push(bulbMat);
  });

  // 2 Consolidated Warm Studio Fill PointLights (North & South zones) for buttery-smooth shader performance
  const northFillLight = new THREE.PointLight(0xffb454, 1.4, 11, 1.3);
  northFillLight.position.set(0, 3.4, -3.2);
  const southFillLight = new THREE.PointLight(0xffb454, 1.2, 11, 1.3);
  southFillLight.position.set(0, 3.4, 3.2);
  scene.add(northFillLight, southFillLight);
  lights.pendantPointLights.push(northFillLight, southFillLight);

  return {
    interactables,
    wallColliders,
    obstacleBoxes,
    lights,
    refs: {
      barberChairRoot,
      chairSwivelGroup,
      chairBackPivot,
      footrestGroup,
      pumpPedalGroup,
      clippersGroup,
      scissorsGroup,
      blade1,
      blade2,
      sprayGroup,
      ringLightGroup,
      ringLedMat,
      ringPointLight,
      poleCylinders,
      barberPoleTex,
      poleGlowLight,
      vinylDisc,
      toneArm,
      tvVideoEl,
      sunbeamGroup,
      sunbeamMat,
      skyBackdropMat,
      celestialOrb,
      celestialMat,
      windowGlassMat,
      mirrorLedStripMat,
      neonTubeMat,
      switchToggle
    }
  };
}

