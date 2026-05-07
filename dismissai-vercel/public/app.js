// ── Theme ──
function toggleTheme() {
  const html = document.documentElement;
  html.classList.toggle('light');
  localStorage.setItem('theme', html.classList.contains('light') ? 'light' : 'dark');
  const btn = document.querySelector('.theme-btn');
  if (btn) btn.textContent = html.classList.contains('light') ? '🌙' : '☀️';
}
(function() {
  if (localStorage.getItem('theme') === 'light') {
    document.documentElement.classList.add('light');
    document.addEventListener('DOMContentLoaded', () => {
      const btn = document.querySelector('.theme-btn');
      if (btn) btn.textContent = '🌙';
    });
  }
})();

// ── Mobile Menu ──
function toggleMenu() {
  document.getElementById('mobileMenu')?.classList.toggle('open');
}

// ── Scroll Animations ──
document.addEventListener('DOMContentLoaded', () => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) {
        setTimeout(() => e.target.classList.add('visible'), i * 100);
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.slide-up').forEach(el => observer.observe(el));
});

// ── Particles ──
(function() {
  const canvas = document.getElementById('particles');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const colors = ['#3b82f6','#6366f1','#8b5cf6','#ef4444','#10b981'];
  let particles = [];
  let running = true;

  function resize() { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; }
  resize();
  window.addEventListener('resize', resize);

  for (let i = 0; i < 35; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2 + 1,
      speed: Math.random() * 0.4 + 0.15,
      color: colors[Math.floor(Math.random() * colors.length)],
      opacity: Math.random() * 0.4 + 0.1
    });
  }

  const heroEl = document.querySelector('.hero');
  const scrollObs = new IntersectionObserver(([e]) => { running = e.isIntersecting; });
  if (heroEl) scrollObs.observe(heroEl);

  function draw() {
    requestAnimationFrame(draw);
    if (!running) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.opacity;
      ctx.fill();
      p.y -= p.speed;
      if (p.y < -5) { p.y = canvas.height + 5; p.x = Math.random() * canvas.width; }
    });
    ctx.globalAlpha = 1;
  }
  draw();
})();

// ── Share Helpers ──
function shareOnWhatsApp(text) { window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank'); }
function shareOnTwitter(text) { window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank'); }
function copyToClipboard(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    const orig = btn.textContent;
    btn.textContent = '✅ Copied!';
    setTimeout(() => btn.textContent = orig, 2000);
  });
}
