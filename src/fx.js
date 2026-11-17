let ctx;
export const sound = { muted: localStorage.getItem('sd_muted') === '1' };

function beep(freq, dur = 0.06, type = 'triangle', vol = 0.06) {
  if (sound.muted) return;
  ctx ??= new AudioContext();
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(vol, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
  o.connect(g).connect(ctx.destination);
  o.start(); o.stop(ctx.currentTime + dur);
}

export const tick = () => beep(1200, 0.03, 'square', 0.025);
export const click = () => beep(660, 0.05);
export const win = () => [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => beep(f, 0.18), i * 90));
export const lose = () => [392, 330, 262].forEach((f, i) => setTimeout(() => beep(f, 0.2, 'sawtooth', 0.04), i * 120));

export function strawberryRain(n = 40) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  for (let i = 0; i < n; i++) {
    const s = document.createElement('span');
    s.className = 'rain';
    s.textContent = Math.random() < 0.7 ? '🍓' : '💗';
    s.style.left = Math.random() * 100 + 'vw';
    s.style.animationDuration = 1.6 + Math.random() * 1.6 + 's';
    s.style.animationDelay = Math.random() * 0.6 + 's';
    document.body.append(s);
    s.addEventListener('animationend', () => s.remove());
  }
}
