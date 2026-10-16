// Simple lightweight celebratory confetti effect using HTML5 Canvas
export function triggerConfetti() {
  const canvas = document.createElement('canvas');
  canvas.id = 'confetti-canvas';
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '9999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  const resizeHandler = () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  };
  window.addEventListener('resize', resizeHandler);

  const colors = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#14b8a6'];
  const particles = [];
  const particleCount = 100;

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: width * 0.5 + (Math.random() - 0.5) * 200,
      y: height * 0.5 + (Math.random() - 0.5) * 50,
      w: Math.random() * 9 + 5,
      h: Math.random() * 6 + 4,
      vx: (Math.random() - 0.5) * 16,
      vy: Math.random() * -14 - 4,
      rotation: Math.random() * 360,
      vRotation: (Math.random() - 0.5) * 12,
      color: colors[Math.floor(Math.random() * colors.length)],
      opacity: 1,
      decay: Math.random() * 0.007 + 0.005,
      gravity: 0.38
    });
  }

  let animationFrame;
  const render = () => {
    ctx.clearRect(0, 0, width, height);
    let activeCount = 0;

    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.vx *= 0.985;
      p.rotation += p.vRotation;
      p.opacity -= p.decay;

      if (p.opacity > 0 && p.y < height + 50) {
        activeCount++;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
    }

    if (activeCount > 0) {
      animationFrame = requestAnimationFrame(render);
    } else {
      window.removeEventListener('resize', resizeHandler);
      canvas.remove();
    }
  };

  animationFrame = requestAnimationFrame(render);

  return () => {
    cancelAnimationFrame(animationFrame);
    window.removeEventListener('resize', resizeHandler);
    if (document.body.contains(canvas)) {
      canvas.remove();
    }
  };
}
