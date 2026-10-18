---
trigger: always_on
description: Contexto completo, arquitectura e infraestructura del proyecto The Pip's Barber 4 (Híbrido 2D + Estudio 3D)
---

# Contexto del Proyecto: The Pip's Barber — Versión 4 (`Barber_4`)

## 1. Visión General y Ecosistema de Proyectos
Este proyecto (**`Barber_4`**) es la evolución híbrida que combina lo mejor de dos versiones previas de **The Pip's Barber** (barbería y peluquería tradicional de **Pipa** en Buenos Aires):
- **`Barber` (`barber-pips.pages.dev`)**: Primera versión original (intacta).
- **`Barber_2` (`barber-pips-2.pages.dev` / repo `Dariobod/Barber_2`)**: Sitio web clásico 2D de alta velocidad, con estética inspirada en *Fab the Barber* (`--ink: #1e1e1b`, `--paper: #faf9f6`, `--copper: #df2528`, `--gold: #d4a359`), carrusel de 5 videos (*Puertas Adentro*) y agenda integrada de **Setmore** (intacto).
- **`Barber_3` (`barber-pips-3.pages.dev` / repo `Dariobod/Barber_3` / carpeta `c:\DARIO\IA\Antigravity\Barber_3d`)**: Experiencia inmersiva tipo juego de exploración en 3D con **Three.js** dentro del interior del estudio de barbería (intacto).
- **`Barber_4` (`barber-pips-4.pages.dev` / repo `Dariobod/Barber_4` / carpeta `c:\DARIO\IA\Antigravity\Barber_4`)**: **Este proyecto**. Tiene como página principal la web rápida de `Barber_2` en la raíz (`/`) e integra accesos interactivos (botón flotante con cilindro animado, botón en Hero y banner en *Puertas Adentro*) con una transición cinematográfica (**"Abrir las puertas del estudio"**) que lleva al **Estudio Virtual 3D (`/estudio-3d/`)**, compartiendo una única carpeta `/assets/`.

---

## 2. Estructura de Carpetas y Archivos (`c:\DARIO\IA\Antigravity\Barber_4`)

```text
Barber_4/
├── index.html               # Web principal 2D (base Barber_2) + Botón flotante 3D + Overlay de puertas dobles (#studio-doors-overlay)
├── styles.css               # Estilos de Barber_2 + Estilos del portal flotante (.floating-3d-portal) y animación 3D de puertas (.studio-doors)
├── script.js                # Lógica de Barber_2 + Sonido de campanilla Web Audio + Transición de apertura de puertas hacia estudio-3d/
├── server.js                # Servidor HTTP Node local (puerto 3004) con soporte de Range requests para videos MP4 y rutas de subdirectorios
├── package.json             # Scripts npm start / npm run dev (ejecuta node server.js)
├── assets/                  # Carpeta única compartida entre la web 2D y el Estudio 3D (sin duplicar videos)
│   ├── logo-the-pips-barber.jpg
│   ├── pipa-01.jpg .. pipa-05.jpg
│   ├── pipa-01.mp4 .. pipa-05.mp4
│   └── ref-*.png            # Íconos y divisores gráficos (barber pole, tijeras, peine, navaja, líneas)
└── estudio-3d/              # Experiencia completa de exploración 3D con Three.js (apunta a ../assets/)
    ├── index.html           # Lienzo WebGL (#barber-canvas), HUD 3D, botón "← Web Clásica" (../?from=3d) y modales
    ├── styles.css           # Estilos del HUD 3D, marcadores flotantes (.hotspot-marker), controles del sillón y modales
    └── js/
        ├── main.js          # Loop principal 3D, cámara con sistema anticolisión de paredes, partículas, día/noche y eventos UI
        ├── world.js         # Construcción 3D del estudio (14m x 12m x 4.4m), sillón central, carro, aro ETHEOS, TV 3D, cilindros y luces
        ├── textures.js      # Generador procedural Canvas 2D de texturas PBR y bump maps (parquet, ladrillo, cuero capitoné, pizarras)
        └── audio.js         # Motor de sonido Web Audio API + reproducción del audio original de "02 - Pipa en Acción" (../assets/pipa-02.mp4) y beat urbano
```

---

## 3. Detalles Técnicos Clave del Estudio 3D (`estudio-3d/`)
1. **Fluidez (60+ FPS)**:
   - Se evita el uso de `MeshPhysicalMaterial` con `transmission` para no duplicar el pase de renderizado en GPU.
   - El *raycasting* al mover el mouse está limitado al array `interactables` con *throttling* a 25 Hz y cero asignaciones de memoria (`Vector3`/`Color`) por frame en `animate()`.
2. **Cámara y Anticolisión de Paredes (`updateCameraTransform` y `clampPlayerPosition` en `estudio-3d/js/main.js`)**:
   - Al girar 360° o caminar (`WASD`, flechas o click en el piso de parquet), la cámara aplica límites del cuarto (`ROOM_BOUNDS`), colisión contra muebles (`obstacleBoxes`), *raycasting* trasero contra `wallColliders` y `camera.near = 0.06` para que **nunca atraviese ni se meta en una pared**.
3. **Orientación Derecha de Logo y Reloj (`estudio-3d/js/world.js`)**:
   - Tanto el medallón del logo de *The Pip's Barber* sobre el espejo principal como el reloj de la pared Norte usan `THREE.CircleGeometry` en el plano XY (`+Y` hacia arriba) para verse 100% verticales y sin inclinación.
4. **Cilindros de Peluquería (*Barber Poles*) en Movimiento**:
   - Hay un cilindro principal en la pared Norte del fondo, **a la izquierda del espejo/pantalla principal (`X = -3.85, Y = 2.25, Z = -5.52`)**, visible de frente al sillón, y un segundo cilindro a la izquierda de la Smart TV de 65" en la pared Oeste (`X = -6.52, Y = 2.28, Z = 1.32`). Ambos rotan y desplazan sus franjas helicoidales (`barberPoleTex.offset.y`) continuamente.
5. **Música y Sonidos (`estudio-3d/js/audio.js`)**:
   - La estación principal reproduce el ritmo original de **`02 — Pipa en Acción`** (`../assets/pipa-02.mp4`), seguida de un **Urban Barber Beat** procedural y las pistas de `pipa-01.mp4` y `pipa-05.mp4`. Al abrir el modal de videos, la música de fondo se pausa automáticamente y se reanuda al cerrarlo.
6. **Iluminación Día (Luz Natural) vs. Noche (Luz Artificial)**:
   - En **Modo Día**, entra luz solar natural con haces volumétricos (*god-rays*) desde los ventanales Este hacia el sillón central.
   - En **Modo Noche** (botón HUD, tecla `L` o interruptor en el pilar Este), se apaga el sol y se encienden las lámparas colgantes Edison, el LED del espejo, el neón rojo y el cilindro.

---

## 4. Repositorio GitHub y Despliegue Automático en Cloudflare Pages
- **Repositorio GitHub**: `https://github.com/Dariobod/Barber_4` (rama de producción: **`main`**).
- **Cloudflare Pages**:
  - **Account ID**: `830ec601e86839e72ec3f3ffbad5f99b` (usuario: `barber.pips@gmail.com`).
  - **Proyecto**: **`barber-pips-4`**
  - **URL Pública**: **[https://barber-pips-4.pages.dev/](https://barber-pips-4.pages.dev/)** (y `/estudio-3d/`).
  - **CI/CD**: Vinculado nativamente con el repositorio `Dariobod/Barber_4` (`production_branch: "main"`). Todo `git push origin main` publica automáticamente en Cloudflare Pages.
  - **Nota sobre Wrangler CLI en Windows (Node 24)**: Si se ejecuta `wrangler` desde terminal en este equipo, definir `$env:NODE_OPTIONS="--use-system-ca"` para que Node valide el certificado TLS local de Windows.
