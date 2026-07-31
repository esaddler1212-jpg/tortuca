(function () {
  'use strict';

  const canvas = document.getElementById('spinner');
  const ctx = canvas.getContext('2d');
  const rpmEl = document.getElementById('rpm');
  const spinsEl = document.getElementById('spins');
  const bestEl = document.getElementById('best');
  const themeBtn = document.getElementById('theme-btn');
  const resetBtn = document.getElementById('reset-btn');

  const SIZE = 340;
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  const FRICTION = 0.985;
  const MIN_VELOCITY = 0.001;
  const MAX_VELOCITY = 90;
  const ARM_COUNT = 3;

  canvas.width = SIZE * DPR;
  canvas.height = SIZE * DPR;
  canvas.style.width = SIZE + 'px';
  canvas.style.height = SIZE + 'px';
  ctx.scale(DPR, DPR);

  const center = SIZE / 2;
  const outerRadius = SIZE / 2 - 16;
  const armLength = outerRadius * 0.72;
  const weightRadius = outerRadius * 0.22;
  const hubRadius = outerRadius * 0.18;
  const bearingRadius = outerRadius * 0.1;

  const themes = [
    { a1: '#ff6b9d', a2: '#c44dff', a3: '#4d9fff', glow: 'rgba(196, 77, 255, 0.35)' },
    { a1: '#00e5a0', a2: '#00c9ff', a3: '#7b61ff', glow: 'rgba(0, 229, 160, 0.35)' },
    { a1: '#ff9a3c', a2: '#ff5e62', a3: '#ffc371', glow: 'rgba(255, 154, 60, 0.35)' },
    { a1: '#a8ff78', a2: '#78ffd6', a3: '#00c6ff', glow: 'rgba(120, 255, 214, 0.35)' },
    { a1: '#f857a6', a2: '#ff5858', a3: '#feca57', glow: 'rgba(248, 87, 166, 0.35)' },
  ];

  let themeIndex = 0;
  let angle = 0;
  let velocity = 0;
  let isDragging = false;
  let lastPointerAngle = 0;
  let lastPointerTime = 0;
  let recentVelocities = [];
  let totalSpins = 0;
  let bestRpm = 0;
  let lastAngle = 0;
  let particles = [];

  function getTheme() {
    return themes[themeIndex];
  }

  function applyTheme(theme) {
    const root = document.documentElement;
    root.style.setProperty('--accent-1', theme.a1);
    root.style.setProperty('--accent-2', theme.a2);
    root.style.setProperty('--accent-3', theme.a3);
    root.style.setProperty('--glow', theme.glow);
  }

  function pointerAngle(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left - rect.width / 2;
    const y = clientY - rect.top - rect.height / 2;
    return Math.atan2(y, x);
  }

  function normalizeAngle(a) {
    while (a > Math.PI) a -= Math.PI * 2;
    while (a < -Math.PI) a += Math.PI * 2;
    return a;
  }

  function getRpm() {
    return Math.abs(velocity) * (60 / (Math.PI * 2));
  }

  function spawnParticles(intensity) {
    const theme = getTheme();
    const count = Math.min(Math.floor(intensity * 3), 12);
    for (let i = 0; i < count; i++) {
      const armAngle = angle + (Math.PI * 2 / ARM_COUNT) * (i % ARM_COUNT);
      const dist = armLength * (0.5 + Math.random() * 0.5);
      particles.push({
        x: center + Math.cos(armAngle) * dist,
        y: center + Math.sin(armAngle) * dist,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        life: 1,
        color: [theme.a1, theme.a2, theme.a3][i % 3],
        size: 2 + Math.random() * 3,
      });
    }
  }

  function drawSpinner() {
    const theme = getTheme();
    ctx.clearRect(0, 0, SIZE, SIZE);

    ctx.save();
    ctx.translate(center, center);
    ctx.rotate(angle);

    for (let i = 0; i < ARM_COUNT; i++) {
      const armAngle = (Math.PI * 2 / ARM_COUNT) * i;
      const color = [theme.a1, theme.a2, theme.a3][i];

      ctx.save();
      ctx.rotate(armAngle);

      const grad = ctx.createLinearGradient(0, 0, armLength, 0);
      grad.addColorStop(0, 'rgba(30, 30, 45, 0.9)');
      grad.addColorStop(0.6, color + 'cc');
      grad.addColorStop(1, color);

      ctx.beginPath();
      ctx.moveTo(hubRadius * 0.8, -weightRadius * 0.35);
      ctx.lineTo(armLength - weightRadius * 0.3, -weightRadius * 0.25);
      ctx.arc(armLength, 0, weightRadius, -Math.PI * 0.35, Math.PI * 0.35);
      ctx.lineTo(hubRadius * 0.8, weightRadius * 0.35);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(armLength, 0, weightRadius, 0, Math.PI * 2);
      const weightGrad = ctx.createRadialGradient(
        armLength - weightRadius * 0.3, -weightRadius * 0.3, 0,
        armLength, 0, weightRadius
      );
      weightGrad.addColorStop(0, '#ffffff44');
      weightGrad.addColorStop(0.4, color);
      weightGrad.addColorStop(1, shadeColor(color, -40));
      ctx.fillStyle = weightGrad;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.restore();
    }

    const hubGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, hubRadius);
    hubGrad.addColorStop(0, '#2a2a3a');
    hubGrad.addColorStop(0.7, '#1a1a28');
    hubGrad.addColorStop(1, '#12121c');
    ctx.beginPath();
    ctx.arc(0, 0, hubRadius, 0, Math.PI * 2);
    ctx.fillStyle = hubGrad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 2;
    ctx.stroke();

    const bearingGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, bearingRadius);
    bearingGrad.addColorStop(0, '#555568');
    bearingGrad.addColorStop(0.5, '#3a3a4a');
    bearingGrad.addColorStop(1, '#222230');
    ctx.beginPath();
    ctx.arc(0, 0, bearingRadius, 0, Math.PI * 2);
    ctx.fillStyle = bearingGrad;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(-bearingRadius * 0.25, -bearingRadius * 0.25, bearingRadius * 0.2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fill();

    ctx.restore();

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.025;
      p.vx *= 0.96;
      p.vy *= 0.96;

      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fillStyle = p.color + Math.floor(p.life * 180).toString(16).padStart(2, '0');
      ctx.fill();
    }
  }

  function shadeColor(hex, percent) {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + percent));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + percent));
    const b = Math.min(255, Math.max(0, (num & 0xff) + percent));
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  function updateStats() {
    const rpm = Math.round(getRpm());
    rpmEl.textContent = rpm;
    spinsEl.textContent = totalSpins.toFixed(1);
    bestEl.textContent = Math.round(bestRpm);

    if (rpm > 200) {
      canvas.classList.add('spinning-fast');
    } else {
      canvas.classList.remove('spinning-fast');
    }
  }

  function tick(timestamp) {
    if (!isDragging) {
      let deltaAngle = angle - lastAngle;
      if (Math.abs(deltaAngle) > Math.PI) {
        deltaAngle = deltaAngle > 0 ? deltaAngle - Math.PI * 2 : deltaAngle + Math.PI * 2;
      }
      if (Math.abs(deltaAngle) > 0.01 && Math.abs(deltaAngle) < Math.PI) {
        totalSpins += Math.abs(deltaAngle) / (Math.PI * 2);
      }
      lastAngle = angle;

      angle += velocity;
      velocity *= FRICTION;

      if (Math.abs(velocity) < MIN_VELOCITY) {
        velocity = 0;
      }

      const rpm = getRpm();
      if (rpm > bestRpm) bestRpm = rpm;

      if (rpm > 300 && Math.random() < 0.15) {
        spawnParticles(rpm / 1000);
      }
    }

    drawSpinner();
    updateStats();
    requestAnimationFrame(tick);
  }

  function onPointerDown(e) {
    e.preventDefault();
    isDragging = true;
    canvas.setPointerCapture(e.pointerId);
    lastPointerAngle = pointerAngle(e.clientX, e.clientY);
    lastPointerTime = performance.now();
    recentVelocities = [];
    velocity = 0;
  }

  function onPointerMove(e) {
    if (!isDragging) return;
    e.preventDefault();

    const currentAngle = pointerAngle(e.clientX, e.clientY);
    const now = performance.now();
    const dt = (now - lastPointerTime) / 1000;

    let delta = normalizeAngle(currentAngle - lastPointerAngle);
    angle += delta;

    const safeDt = Math.max(dt, 0.012);
    if (dt > 0 && dt < 0.15) {
      const instantVel = Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, delta / safeDt));
      recentVelocities.push(instantVel);
      if (recentVelocities.length > 5) recentVelocities.shift();
    }

    lastPointerAngle = currentAngle;
    lastPointerTime = now;
  }

  function onPointerUp(e) {
    if (!isDragging) return;
    isDragging = false;
    canvas.releasePointerCapture(e.pointerId);

    if (recentVelocities.length > 0) {
      const avg = recentVelocities.reduce((a, b) => a + b, 0) / recentVelocities.length;
      velocity = Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, avg * 0.85));
      spawnParticles(Math.abs(velocity) * 2);
    }
  }

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);

  themeBtn.addEventListener('click', () => {
    themeIndex = (themeIndex + 1) % themes.length;
    applyTheme(getTheme());
  });

  resetBtn.addEventListener('click', () => {
    totalSpins = 0;
    bestRpm = 0;
    updateStats();
  });

  applyTheme(getTheme());
  requestAnimationFrame(tick);
})();
