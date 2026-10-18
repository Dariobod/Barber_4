import * as THREE from 'three';

// Helper to configure repeating canvas textures
function makeCanvasTexture(canvas, repeatX = 1, repeatY = 1, isSRGB = true) {
  const tex = new THREE.CanvasTexture(canvas);
  if (isSRGB) {
    tex.colorSpace = THREE.SRGBColorSpace;
  }
  if (repeatX > 1 || repeatY > 1) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeatX, repeatY);
  }
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

// 1. Polished Warm Oak Parquet Floor (inspired by Pipa's real studio floor in pipa-01.jpg)
export function createParquetTextures(repeatX = 5, repeatY = 5) {
  const size = 1024;
  const diffCanvas = document.createElement('canvas');
  diffCanvas.width = size;
  diffCanvas.height = size;
  const ctx = diffCanvas.getContext('2d');

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bCtx = bumpCanvas.getContext('2d');

  ctx.fillStyle = '#9d6634';
  ctx.fillRect(0, 0, size, size);
  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, size, size);

  const cols = 4;
  const rows = 16;
  const plankW = size / cols;
  const plankH = size / rows;

  const palette = [
    '#a86d38', '#99602f', '#b57840', '#8f5729',
    '#ad713b', '#9f6533', '#ba7e46', '#8a5225'
  ];

  for (let r = 0; r < rows; r++) {
    const offset = (r % 2) * (plankW * 0.5);
    for (let c = -1; c <= cols; c++) {
      const x = c * plankW + offset;
      const y = r * plankH;
      const baseColor = palette[Math.abs((r * 7 + c * 3)) % palette.length];

      // Plank fill
      ctx.fillStyle = baseColor;
      ctx.fillRect(x + 1, y + 1, plankW - 2, plankH - 2);

      // Subtle wood grain fibers
      ctx.save();
      ctx.beginPath();
      ctx.rect(x + 1, y + 1, plankW - 2, plankH - 2);
      ctx.clip();

      for (let g = 0; g < 18; g++) {
        const gy = y + (g / 18) * plankH;
        ctx.strokeStyle = g % 2 === 0 ? 'rgba(60, 30, 8, 0.12)' : 'rgba(255, 215, 165, 0.08)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x, gy);
        ctx.bezierCurveTo(
          x + plankW * 0.33, gy + Math.sin(g + r) * 3,
          x + plankW * 0.66, gy - Math.cos(g + c) * 3,
          x + plankW, gy
        );
        ctx.stroke();
      }
      ctx.restore();

      // Plank seam grooves in bump and diffuse
      ctx.strokeStyle = '#4a2a10';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, plankW, plankH);

      bCtx.fillStyle = '#969696';
      bCtx.fillRect(x + 2, y + 2, plankW - 4, plankH - 4);
      bCtx.strokeStyle = '#202020';
      bCtx.lineWidth = 3;
      bCtx.strokeRect(x, y, plankW, plankH);
    }
  }

  return {
    map: makeCanvasTexture(diffCanvas, repeatX, repeatY, true),
    bumpMap: makeCanvasTexture(bumpCanvas, repeatX, repeatY, false)
  };
}

// 2. Exposed Industrial Brick Wall Texture + Bump Map
export function createBrickTextures(repeatX = 4, repeatY = 2) {
  const w = 1024;
  const h = 512;
  const diffCanvas = document.createElement('canvas');
  diffCanvas.width = w;
  diffCanvas.height = h;
  const ctx = diffCanvas.getContext('2d');

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = w;
  bumpCanvas.height = h;
  const bCtx = bumpCanvas.getContext('2d');

  // Mortar background
  ctx.fillStyle = '#38332e';
  ctx.fillRect(0, 0, w, h);
  bCtx.fillStyle = '#222222';
  bCtx.fillRect(0, 0, w, h);

  const rows = 8;
  const cols = 8;
  const brickW = w / cols;
  const brickH = h / rows;
  const mortar = 5;

  const brickColors = [
    '#7b3828', '#682e20', '#874130', '#5a271c',
    '#6e3324', '#7f3e2d', '#4f231a', '#8c4734'
  ];

  for (let r = 0; r < rows; r++) {
    const shift = (r % 2) * (brickW * 0.5);
    for (let c = -1; c <= cols; c++) {
      const bx = c * brickW + shift + mortar;
      const by = r * brickH + mortar;
      const bw = brickW - mortar * 2;
      const bh = brickH - mortar * 2;

      const color = brickColors[Math.abs(r * 5 + c * 11) % brickColors.length];
      ctx.fillStyle = color;
      ctx.fillRect(bx, by, bw, bh);

      // Brick surface variation
      ctx.fillStyle = (r + c) % 3 === 0 ? 'rgba(0,0,0,0.16)' : 'rgba(255,200,170,0.06)';
      ctx.fillRect(bx + 4, by + 3, bw - 8, bh - 6);

      // Bump height
      bCtx.fillStyle = '#d0d0d0';
      bCtx.fillRect(bx, by, bw, bh);
      bCtx.fillStyle = '#a8a8a8';
      bCtx.fillRect(bx + 6, by + 5, bw - 12, bh - 10);
    }
  }

  return {
    map: makeCanvasTexture(diffCanvas, repeatX, repeatY, true),
    bumpMap: makeCanvasTexture(bumpCanvas, repeatX, repeatY, false)
  };
}

// 3. Dark Walnut / Espresso Wood Texture for Furniture & Boiserie
export function createWalnutWoodTexture(repeatX = 1, repeatY = 1, tint = '#3b2416') {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = tint;
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 90; i++) {
    const y = (i / 90) * size;
    ctx.strokeStyle = i % 2 === 0 ? 'rgba(15, 7, 3, 0.24)' : 'rgba(180, 120, 75, 0.08)';
    ctx.lineWidth = 2 + (i % 3);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(
      size * 0.3, y + Math.sin(i * 0.5) * 6,
      size * 0.7, y - Math.cos(i * 0.4) * 6,
      size, y
    );
    ctx.stroke();
  }

  return makeCanvasTexture(canvas, repeatX, repeatY, true);
}

// 4. Diamond Button-Tufted Oxblood/Burgundy Leather Texture + Bump Map (for Barber Chair & Sofa)
export function createTuftedLeatherTextures(repeatX = 2, repeatY = 2, baseColor = '#581317') {
  const size = 512;
  const diffCanvas = document.createElement('canvas');
  diffCanvas.width = size;
  diffCanvas.height = size;
  const ctx = diffCanvas.getContext('2d');

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bCtx = bumpCanvas.getContext('2d');

  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, size, size);

  bCtx.fillStyle = '#c8c8c8';
  bCtx.fillRect(0, 0, size, size);

  const grid = 4;
  const step = size / grid;

  // Draw diamond folds & deep button tufts
  ctx.strokeStyle = 'rgba(15, 2, 4, 0.55)';
  ctx.lineWidth = 4;
  bCtx.strokeStyle = '#303030';
  bCtx.lineWidth = 6;

  for (let i = -grid; i <= grid * 2; i++) {
    ctx.beginPath();
    ctx.moveTo(i * step, 0);
    ctx.lineTo(i * step + size, size);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(i * step, size);
    ctx.lineTo(i * step + size, 0);
    ctx.stroke();

    bCtx.beginPath();
    bCtx.moveTo(i * step, 0);
    bCtx.lineTo(i * step + size, size);
    bCtx.stroke();

    bCtx.beginPath();
    bCtx.moveTo(i * step, size);
    bCtx.lineTo(i * step + size, 0);
    bCtx.stroke();
  }

  // Deep button dimples at diamond intersections
  for (let r = 0; r <= grid; r++) {
    for (let c = 0; c <= grid; c++) {
      const cx = c * step;
      const cy = r * step;

      const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 22);
      grad.addColorStop(0, '#1a0406');
      grad.addColorStop(0.4, '#88242a');
      grad.addColorStop(1, 'rgba(88, 19, 23, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, 22, 0, Math.PI * 2);
      ctx.fill();

      const bGrad = bCtx.createRadialGradient(cx, cy, 2, cx, cy, 24);
      bGrad.addColorStop(0, '#101010');
      bGrad.addColorStop(0.5, '#606060');
      bGrad.addColorStop(1, '#d8d8d8');
      bCtx.fillStyle = bGrad;
      bCtx.beginPath();
      bCtx.arc(cx, cy, 24, 0, Math.PI * 2);
      bCtx.fill();
    }
  }

  return {
    map: makeCanvasTexture(diffCanvas, repeatX, repeatY, true),
    bumpMap: makeCanvasTexture(bumpCanvas, repeatX, repeatY, false)
  };
}

// 5. Classic Spinning Barber Pole Helical Stripes
export function createBarberPoleTexture() {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#faf9f6';
  ctx.fillRect(0, 0, size, size);

  const stripeW = size / 8;
  const colors = ['#df2528', '#faf9f6', '#1d4ed8', '#faf9f6'];

  ctx.save();
  for (let i = -8; i < 16; i++) {
    ctx.fillStyle = colors[((i % 4) + 4) % 4];
    ctx.beginPath();
    ctx.moveTo(i * stripeW, 0);
    ctx.lineTo((i + 1) * stripeW, 0);
    ctx.lineTo((i - 3) * stripeW, size);
    ctx.lineTo((i - 4) * stripeW, size);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  return makeCanvasTexture(canvas, 1, 2, true);
}

// 6. Studded Black Rubber Barber Mat (from pipa-02.jpg)
export function createRubberMatTexture() {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#181818';
  ctx.fillRect(0, 0, size, size);

  const step = 12;
  for (let y = 10; y < size - 6; y += step) {
    for (let x = 10; x < size - 6; x += step) {
      ctx.fillStyle = '#2d2d2d';
      ctx.beginPath();
      ctx.arc(x, y, 3.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#484848';
      ctx.beginPath();
      ctx.arc(x - 0.8, y - 0.8, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  return makeCanvasTexture(canvas, 1, 1, false);
}

// 7. 3D Services Menu Board Texture ("01 / NUESTROS SERVICIOS")
export function createServicesBoardTexture() {
  const w = 1024;
  const h = 768;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  // Deep matte charcoal & red brand board
  ctx.fillStyle = '#191917';
  ctx.fillRect(0, 0, w, h);

  // Outer copper/red and gold double border
  ctx.strokeStyle = '#df2528';
  ctx.lineWidth = 10;
  ctx.strokeRect(24, 24, w - 48, h - 48);

  ctx.strokeStyle = '#d4a359';
  ctx.lineWidth = 2;
  ctx.strokeRect(38, 38, w - 76, h - 76);

  // Header
  ctx.fillStyle = '#df2528';
  ctx.font = '700 22px "Barlow Condensed", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('01 / NUESTROS SERVICIOS · THE PIP\'S BARBER', w / 2, 92);

  ctx.fillStyle = '#faf9f6';
  ctx.font = '700 66px "Barlow Condensed", sans-serif';
  ctx.fillText('NUESTROS SERVICIOS', w / 2, 165);

  // Decorative divider line with scissors symbol
  ctx.strokeStyle = '#df2528';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(160, 195);
  ctx.lineTo(w - 160, 195);
  ctx.stroke();

  ctx.fillStyle = '#d4a359';
  ctx.font = '28px sans-serif';
  ctx.fillText('✂', w / 2, 205);

  // Service 01
  ctx.textAlign = 'left';
  ctx.fillStyle = '#df2528';
  ctx.font = 'italic 44px Georgia, serif';
  ctx.fillText('01', 90, 295);

  ctx.fillStyle = '#faf9f6';
  ctx.font = '700 46px "Barlow Condensed", sans-serif';
  ctx.fillText('CORTE DE ADULTOS', 165, 295);

  ctx.fillStyle = '#b8b6ae';
  ctx.font = '400 24px "DM Sans", sans-serif';
  ctx.fillText('Corte de cabello para adultos con Pipa · Asesoramiento de estilo', 165, 335);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#d4a359';
  ctx.font = '700 38px "Barlow Condensed", sans-serif';
  ctx.fillText('40 MIN  ↗', w - 90, 305);

  // Dotted divider
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.moveTo(90, 385);
  ctx.lineTo(w - 90, 385);
  ctx.stroke();
  ctx.setLineDash([]);

  // Service 02
  ctx.textAlign = 'left';
  ctx.fillStyle = '#df2528';
  ctx.font = 'italic 44px Georgia, serif';
  ctx.fillText('02', 90, 465);

  ctx.fillStyle = '#faf9f6';
  ctx.font = '700 46px "Barlow Condensed", sans-serif';
  ctx.fillText('CORTE DE BARBA', 165, 465);

  ctx.fillStyle = '#b8b6ae';
  ctx.font = '400 24px "DM Sans", sans-serif';
  ctx.fillText('Corte, perfilado y arreglo de barba con Pipa · Ritual clásico', 165, 505);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#d4a359';
  ctx.font = '700 38px "Barlow Condensed", sans-serif';
  ctx.fillText('40 MIN  ↗', w - 90, 475);

  // Footer banner inside board
  ctx.fillStyle = '#df2528';
  ctx.fillRect(85, 575, w - 170, 68);
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.font = '700 26px "Barlow Condensed", sans-serif';
  ctx.fillText('LUNES A VIERNES DE 10 A 18 HS · TOCÁ PARA RESERVAR O VER DETALLES', w / 2, 618);

  ctx.fillStyle = '#9e9c94';
  ctx.font = '400 20px "DM Sans", sans-serif';
  ctx.fillText('Tarifas a consultar en el local · Buenos Aires', w / 2, 690);

  return makeCanvasTexture(canvas, 1, 1, true);
}

// 8. 3D "Antes de Venir / Preguntas Frecuentes" Chalkboard Stand Texture
export function createFaqBoardTexture() {
  const w = 512;
  const h = 768;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#1c1d1a';
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = '#d4a359';
  ctx.lineWidth = 6;
  ctx.strokeRect(18, 18, w - 36, h - 36);

  ctx.fillStyle = '#df2528';
  ctx.font = '700 22px "Barlow Condensed", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('ANTES DE VENIR', w / 2, 75);

  ctx.fillStyle = '#faf9f6';
  ctx.font = '700 48px "Barlow Condensed", sans-serif';
  ctx.fillText('PREGUNTAS', w / 2, 135);
  ctx.fillText('FRECUENTES', w / 2, 185);

  ctx.strokeStyle = '#df2528';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(70, 215);
  ctx.lineTo(w - 70, 215);
  ctx.stroke();

  const items = [
    ['01. ¿Cómo funciona la reserva?', 'Elegí tu horario online sin crear cuenta.'],
    ['02. ¿Puedo elegir mi estilo?', 'Charlamos antes del corte según tu pelo.'],
    ['03. ¿Horarios y ubicación?', 'Lun a Vie de 10 a 18 hs (Buenos Aires).']
  ];

  ctx.textAlign = 'left';
  items.forEach((item, idx) => {
    const y = 285 + idx * 125;
    ctx.fillStyle = '#d4a359';
    ctx.font = '700 25px "Barlow Condensed", sans-serif';
    ctx.fillText(item[0], 45, y);

    ctx.fillStyle = '#d6d4cd';
    ctx.font = '400 20px "DM Sans", sans-serif';
    ctx.fillText(item[1], 45, y + 36);
  });

  ctx.fillStyle = '#df2528';
  ctx.fillRect(45, 650, w - 90, 56);
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.font = '700 22px "Barlow Condensed", sans-serif';
  ctx.fillText('CLICK PARA ABRIR GUÍA COMPLETA', w / 2, 685);

  return makeCanvasTexture(canvas, 1, 1, true);
}

// 9. Reception Booking Tablet Screen Texture
export function createBookingTabletTexture() {
  const w = 512;
  const h = 384;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#141413';
  ctx.fillRect(0, 0, w, h);

  // Header bar
  ctx.fillStyle = '#df2528';
  ctx.fillRect(0, 0, w, 68);
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 26px "Barlow Condensed", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('📅 AGENDA DE TURNOS · SETMORE LIVE', w / 2, 43);

  // Calendar grid preview
  ctx.fillStyle = '#faf9f6';
  ctx.font = '700 28px "Barlow Condensed", sans-serif';
  ctx.fillText('RESERVÁ TU PRÓXIMO TURNO CON PIPA', w / 2, 118);

  const days = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE'];
  days.forEach((d, i) => {
    const x = 56 + i * 82;
    ctx.fillStyle = i === 2 ? '#df2528' : '#292926';
    ctx.fillRect(x, 145, 68, 74);
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 18px sans-serif';
    ctx.fillText(d, x + 34, 172);
    ctx.font = '700 24px sans-serif';
    ctx.fillText(String(14 + i), x + 34, 204);
  });

  // CTA Button
  ctx.fillStyle = '#df2528';
  ctx.fillRect(76, 260, w - 152, 64);
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 24px "Barlow Condensed", sans-serif';
  ctx.fillText('ABRIR CALENDARIO INTERACTIVO ↗', w / 2, 300);

  return makeCanvasTexture(canvas, 1, 1, true);
}

// 10. Vintage Persian / Barbershop Lounge Rug Texture
export function createLoungeRugTexture() {
  const w = 512;
  const h = 768;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#5c191b';
  ctx.fillRect(0, 0, w, h);

  // Ornate borders
  ctx.strokeStyle = '#d4a359';
  ctx.lineWidth = 14;
  ctx.strokeRect(24, 24, w - 48, h - 48);

  ctx.strokeStyle = '#1e1e1b';
  ctx.lineWidth = 8;
  ctx.strokeRect(48, 48, w - 96, h - 96);

  ctx.strokeStyle = '#c89648';
  ctx.lineWidth = 3;
  ctx.strokeRect(64, 64, w - 128, h - 128);

  // Center medallion
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.fillStyle = '#1e1e1b';
  ctx.beginPath();
  ctx.moveTo(0, -160);
  ctx.lineTo(110, 0);
  ctx.lineTo(0, 160);
  ctx.lineTo(-110, 0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#d4a359';
  ctx.lineWidth = 5;
  ctx.stroke();

  ctx.fillStyle = '#8b2629';
  ctx.beginPath();
  ctx.arc(0, 0, 52, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  return makeCanvasTexture(canvas, 1, 1, true);
}

// 11. Studio Wall Clock Texture (Buenos Aires Time)
export function createClockTexture() {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#181816';
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#d4a359';
  ctx.lineWidth = 8;
  ctx.stroke();

  ctx.fillStyle = '#faf9f6';
  ctx.font = '700 16px "Barlow Condensed", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText("THE PIP'S", size / 2, 82);
  ctx.fillStyle = '#df2528';
  ctx.font = '700 12px sans-serif';
  ctx.fillText('10 A 18 HS', size / 2, 182);

  // Hour ticks
  for (let i = 0; i < 12; i++) {
    const ang = (i / 12) * Math.PI * 2;
    const r1 = 96;
    const r2 = i % 3 === 0 ? 112 : 105;
    ctx.strokeStyle = i % 3 === 0 ? '#df2528' : '#faf9f6';
    ctx.lineWidth = i % 3 === 0 ? 4 : 2;
    ctx.beginPath();
    ctx.moveTo(size / 2 + Math.cos(ang) * r1, size / 2 + Math.sin(ang) * r1);
    ctx.lineTo(size / 2 + Math.cos(ang) * r2, size / 2 + Math.sin(ang) * r2);
    ctx.stroke();
  }

  // Hands
  ctx.strokeStyle = '#faf9f6';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(size / 2, size / 2);
  ctx.lineTo(size / 2 - 36, size / 2 - 28);
  ctx.stroke();

  ctx.strokeStyle = '#d4a359';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(size / 2, size / 2);
  ctx.lineTo(size / 2 + 52, size / 2 - 42);
  ctx.stroke();

  return makeCanvasTexture(canvas, 1, 1, true);
}

