const menu = document.querySelector('.menu');
const nav = document.querySelector('#nav');
const header = document.querySelector('header');
function setMenu(open) {
  nav.classList.toggle('open', open);
  header.classList.toggle('menu-open', open);
  document.body.classList.toggle('menu-open', open);
  menu.setAttribute('aria-expanded', String(open));
  menu.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  document.querySelector('main').inert = open;
  document.querySelector('footer').inert = open;
}
function closeMenu() { setMenu(false); }
menu.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
nav.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && nav.classList.contains('open')) { closeMenu(); menu.focus(); }
});
document.querySelectorAll('[data-booking]').forEach(button => button.addEventListener('click', () => {
  document.querySelector('#booking-calendar').src = button.dataset.booking;
  document.querySelector('#reservar').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  document.querySelector('#booking-calendar').focus({ preventScroll: true });
}));
document.querySelector('#year').textContent = new Date().getFullYear();
const videoTrack = document.querySelector('.carousel-track');
const videoCards = [...videoTrack.querySelectorAll('.video-card')];
const previousVideo = document.querySelector('.carousel-prev');
const nextVideo = document.querySelector('.carousel-next');
const videoCounter = document.querySelector('.carousel-count');
function currentVideo() {
  return videoCards.reduce((closest, card, index) =>
    Math.abs(card.offsetLeft - videoCards[0].offsetLeft - videoTrack.scrollLeft) <
    Math.abs(videoCards[closest].offsetLeft - videoCards[0].offsetLeft - videoTrack.scrollLeft) ? index : closest, 0);
}
function updateCarousel() {
  videoCounter.textContent = String(currentVideo() + 1).padStart(2, '0') + ' / 05';
  previousVideo.disabled = videoTrack.scrollLeft <= 2;
  nextVideo.disabled = videoTrack.scrollLeft >= videoTrack.scrollWidth - videoTrack.clientWidth - 2;
}
function moveVideo(direction) {
  const index = Math.max(0, Math.min(videoCards.length - 1, currentVideo() + direction));
  videoTrack.scrollTo({left: videoCards[index].offsetLeft - videoCards[0].offsetLeft,
    behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
}
previousVideo.addEventListener('click', () => moveVideo(-1));
nextVideo.addEventListener('click', () => moveVideo(1));
videoTrack.addEventListener('keydown', event => {
  if (event.target !== videoTrack || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
  event.preventDefault(); moveVideo(event.key === 'ArrowRight' ? 1 : -1);
});
videoTrack.addEventListener('scroll', updateCarousel, {passive:true});
new ResizeObserver(updateCarousel).observe(videoTrack);
const videoVisibility = new IntersectionObserver(entries => {
  entries.forEach(entry => { if (!entry.isIntersecting) entry.target.pause(); });
}, {threshold:0.25});
videoCards.forEach(card => {
  const video = card.querySelector('video');
  videoVisibility.observe(video);
  video.addEventListener('play', () => videoCards.forEach(other => {
    if (other !== card) other.querySelector('video').pause();
  }));
});
updateCarousel();

videoCards.forEach((card, index) => {
  const video = card.querySelector('video');
  const toggle = card.querySelector('.video-toggle');
  const icon = toggle.querySelector('.video-toggle-icon');
  function updatePlayback() {
    const playing = !video.paused && !video.ended;
    toggle.setAttribute('aria-pressed', String(playing));
    toggle.setAttribute('aria-label', (playing ? 'Pausar' : 'Reproducir') + ' video ' + (index + 1));
    icon.textContent = playing ? 'Ⅱ' : '▶';
  }
  toggle.addEventListener('click', async () => {
    if (!video.paused) { video.pause(); return; }
    try { await video.play(); } catch { updatePlayback(); }
  });
  ['play', 'pause', 'ended', 'error'].forEach(event => video.addEventListener(event, updatePlayback));
  updatePlayback();
});

videoCards.forEach(card => {
  const video = card.querySelector('video');
  const frame = card.querySelector('.video-frame');
  video.addEventListener('play', () => frame.classList.add('has-started'));
  video.addEventListener('ended', () => frame.classList.remove('has-started'));
});

const serviceSection = document.querySelector('#servicios');
if (!matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
  const serviceElements = [...serviceSection.querySelectorAll('.heading, .services article, .note')];
  serviceElements.forEach((element, index) => {
    element.classList.add('services-reveal');
    element.style.setProperty('--reveal-delay', `${index * 130}ms`);
  });
  const serviceEntrance = new IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting)) return;
    serviceElements.forEach(element => element.classList.add('is-visible'));
    serviceEntrance.disconnect();
  }, { threshold: 0.12 });
  serviceEntrance.observe(serviceSection);
}

// ============================================================================
// EFECTO DE TRANSICIÓN: "ABRIR LAS PUERTAS DEL ESTUDIO" (HACIA ESTUDIO-3D)
// ============================================================================
function playEntranceChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    // Campanilla clásica de puerta de barbería (2 notas cálidas)
    [1318.5, 1760.0].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.14);
      gain.gain.setValueAtTime(0.11, now + i * 0.14);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.14 + 0.9);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.14);
      osc.stop(now + i * 0.14 + 0.95);
    });
  } catch {
    // Ignore audio errors
  }
}

const doorsOverlay = document.getElementById('studio-doors-overlay');

document.querySelectorAll('[data-enter-3d]').forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    const targetHref = link.getAttribute('href') || 'estudio-3d/';
    closeMenu();
    playEntranceChime();

    if (!doorsOverlay) {
      window.location.href = targetHref;
      return;
    }

    // 1. Cerrar las puertas frente al usuario mostrando el emblema de The Pip's Barber
    doorsOverlay.classList.add('active', 'closing');

    // 2. Abrir las puertas hacia adentro revelando la luz del estudio y navegar
    setTimeout(() => {
      doorsOverlay.classList.remove('closing');
      doorsOverlay.classList.add('opening');
    }, 680);

    setTimeout(() => {
      window.location.href = targetHref;
    }, 1250);
  });
});

// Si el usuario vuelve desde el Estudio 3D (?from=3d), abrir las puertas suavemente al llegar
if (doorsOverlay && new URLSearchParams(window.location.search).get('from') === '3d') {
  doorsOverlay.classList.add('active', 'closed');
  requestAnimationFrame(() => {
    setTimeout(() => {
      doorsOverlay.classList.remove('closed');
      doorsOverlay.classList.add('opening');
      setTimeout(() => {
        doorsOverlay.classList.remove('active', 'opening');
      }, 750);
    }, 80);
  });
}

// ============================================================================
// CILINDRO DE BARBERÍA PRINCIPAL EN MOVIMIENTO 3D REALISTA (HERO)
// ============================================================================
(function initHeroBarberPoleSpin() {
  const poleContainer = document.querySelector('.barber-pole');
  const poleImg = poleContainer?.querySelector('img');
  const poleCanvas = poleContainer?.querySelector('.barber-pole-canvas');
  if (!poleContainer || !poleImg || !poleCanvas) return;

  const ctx = poleCanvas.getContext('2d');
  if (!ctx) return;

  // Coordenadas exactas del tubo interior en ref-barber-pole.png (419x1396)
  const TUBE_X = 39;
  const TUBE_W = 240;
  const TUBE_TOP = 189;
  const TUBE_BOT = 1198;
  const TUBE_H = TUBE_BOT - TUBE_TOP; // 1009px
  const STRIPE_PERIOD = 153.33;
  const SLICE_STEP = 3; // Rebanadas verticales para proyección cilíndrica 3D (x = R * sin(θ))

  // Precalcular la deformación angular real de un cilindro en 3D (θ = arcsin(x/R))
  // En los bordes del cilindro las franjas se comprimen y curvan naturalmente
  const slices = [];
  for (let i = 0; i < TUBE_W; i += SLICE_STEP) {
    const w = Math.min(SLICE_STEP, TUBE_W - i);
    const nx = ((i + w * 0.5) / TUBE_W) * 2 - 1; // [-1, 1]
    const clampedNx = Math.max(-0.985, Math.min(0.985, nx));
    const theta = Math.asin(clampedNx); // [-π/2, π/2]
    // Desplazamiento helicoidal no lineal propio de una superficie cilíndrica real
    const yShift = ((theta / (Math.PI * 0.5)) + 1) * 0.5 * 108;
    slices.push({ x: TUBE_X + i, w, yShift });
  }

  // Crear un buffer con las franjas limpias (sin el reflejo estático pegado) para que giren por detrás del cristal
  const patternCanvas = document.createElement('canvas');
  patternCanvas.width = 4;
  patternCanvas.height = Math.round(STRIPE_PERIOD * 10);
  const pCtx = patternCanvas.getContext('2d');
  if (pCtx) {
    pCtx.fillStyle = '#ffffff';
    pCtx.fillRect(0, 0, 4, patternCanvas.height);
    pCtx.fillStyle = '#e22a2a';
    const redBandHeight = STRIPE_PERIOD * 0.51;
    for (let y = -STRIPE_PERIOD; y < patternCanvas.height + STRIPE_PERIOD; y += STRIPE_PERIOD) {
      pCtx.fillRect(0, y, 4, redBandHeight);
    }
  }

  function startAnimation() {
    if (poleContainer.classList.contains('is-animated')) return;
    poleContainer.classList.add('is-animated');

    let phase = 0;
    let timeSec = 0;
    let lastTime = performance.now();
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

    // Gradiente de volumen 3D (sombra cilíndrica en los bordes + profundidad hacia las tapas)
    const sideShadeGrad = ctx.createLinearGradient(TUBE_X, 0, TUBE_X + TUBE_W, 0);
    sideShadeGrad.addColorStop(0.0, 'rgba(18, 18, 16, 0.34)');
    sideShadeGrad.addColorStop(0.09, 'rgba(18, 18, 16, 0.08)');
    sideShadeGrad.addColorStop(0.24, 'rgba(255, 255, 255, 0.0)');
    sideShadeGrad.addColorStop(0.55, 'rgba(255, 255, 255, 0.0)');
    sideShadeGrad.addColorStop(0.86, 'rgba(18, 18, 16, 0.12)');
    sideShadeGrad.addColorStop(1.0, 'rgba(18, 18, 16, 0.38)');

    const topCapShadow = ctx.createLinearGradient(0, TUBE_TOP, 0, TUBE_TOP + 34);
    topCapShadow.addColorStop(0, 'rgba(0, 0, 0, 0.28)');
    topCapShadow.addColorStop(1, 'rgba(0, 0, 0, 0)');

    const botCapShadow = ctx.createLinearGradient(0, TUBE_BOT - 34, 0, TUBE_BOT);
    botCapShadow.addColorStop(0, 'rgba(0, 0, 0, 0)');
    botCapShadow.addColorStop(1, 'rgba(0, 0, 0, 0.28)');

    function renderFrame(now) {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      if (!reduceMotion.matches) {
        timeSec += dt;
        // Giro continuo y suave de la hélice
        phase = (phase + dt * 115) % STRIPE_PERIOD;
      }

      ctx.clearRect(0, 0, poleCanvas.width, poleCanvas.height);

      // 1. Dibujar estructura original completa (cúpulas superior/inferior, bordes negros y soportes)
      ctx.drawImage(poleImg, 0, 0);

      // 2. Recortar el interior del cilindro para renderizar el tubo giratorio 3D y el cristal exterior
      ctx.save();
      ctx.beginPath();
      ctx.rect(TUBE_X, TUBE_TOP, TUBE_W, TUBE_H);
      ctx.clip();

      // 2a. Renderizar las franjas helicoidales con curvatura cilíndrica 3D real (comprimidas hacia los bordes)
      const baseSourceY = STRIPE_PERIOD * 2 - phase;
      for (let s = 0; s < slices.length; s++) {
        const sl = slices[s];
        ctx.drawImage(
          patternCanvas,
          0,
          baseSourceY + sl.yShift,
          2,
          TUBE_H,
          sl.x,
          TUBE_TOP,
          sl.w + 0.4,
          TUBE_H
        );
      }

      // 2b. Sombreado volumétrico 3D del cilindro interior (curvatura lateral y encastre con las tapas)
      ctx.fillStyle = sideShadeGrad;
      ctx.fillRect(TUBE_X, TUBE_TOP, TUBE_W, TUBE_H);
      ctx.fillStyle = topCapShadow;
      ctx.fillRect(TUBE_X, TUBE_TOP, TUBE_W, 34);
      ctx.fillStyle = botCapShadow;
      ctx.fillRect(TUBE_X, TUBE_BOT - 34, TUBE_W, 34);

      // 2c. Tubo de cristal exterior: reflejos verticales propios del diseño con leve destello vivo
      const shimmerX = Math.sin(timeSec * 2.4) * 1.5;
      ctx.fillStyle = '#ffffff';
      // Columna de brillo principal izquierda (fiel al arte original en X: 58..96)
      ctx.fillRect(58 + shimmerX * 0.4, TUBE_TOP, 38, TUBE_H);
      // Columna de brillo secundaria derecha (fiel al arte original en X: 251..265, con recorte superior/inferior)
      ctx.fillRect(251 - shimmerX * 0.3, TUBE_TOP + 24, 14, TUBE_H - 42);

      // Brillo especular suave de vidrio curvo al lado del reflejo principal
      const glassGlow = ctx.createLinearGradient(TUBE_X, 0, TUBE_X + TUBE_W, 0);
      glassGlow.addColorStop(0.0, 'rgba(255, 255, 255, 0)');
      glassGlow.addColorStop(0.28, 'rgba(255, 255, 255, 0.22)');
      glassGlow.addColorStop(0.42, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = glassGlow;
      ctx.fillRect(TUBE_X, TUBE_TOP, TUBE_W, TUBE_H);

      ctx.restore();
      requestAnimationFrame(renderFrame);
    }

    requestAnimationFrame(renderFrame);
  }

  if (poleImg.complete && poleImg.naturalWidth > 0) {
    startAnimation();
  } else {
    poleImg.addEventListener('load', startAnimation, { once: true });
  }
})();

// ============================================================================
// SCROLL CON INERCIA FLUIDA Y FRENADO CONTINUO (LENIS SMOOTH SCROLL)
// ============================================================================
(function initSmoothInertialScroll() {
  if (typeof Lenis === 'undefined' || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const lenis = new Lenis({
    duration: 1.25, // Duración de la inercia al deslizar
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Curva exponencial de desaceleración suave
    orientation: 'vertical',
    gestureOrientation: 'vertical',
    smoothWheel: true,
    wheelMultiplier: 1.05,
    touchMultiplier: 1.5,
    infinite: false
  });

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  // Navegación suave coordinada con enlaces de ancla (#servicios, #reservar, etc.)
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (href === '#' || href === '#contenido') return;
      const targetElem = document.querySelector(href);
      if (targetElem) {
        e.preventDefault();
        lenis.scrollTo(targetElem, { offset: -88, duration: 1.2 });
      }
    });
  });

  // Conectar botones de reserva con scroll suave Lenis
  document.querySelectorAll('[data-booking]').forEach((button) => {
    button.addEventListener('click', () => {
      const target = document.querySelector('#reservar');
      if (target) {
        lenis.scrollTo(target, { offset: -88, duration: 1.2 });
      }
    });
  });
})();

