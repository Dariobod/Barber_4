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
