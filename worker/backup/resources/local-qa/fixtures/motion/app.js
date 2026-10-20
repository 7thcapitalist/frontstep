const mark = document.querySelector('.mark');
const line = document.querySelector('.line');
const started = performance.now();
function tick(now) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const progress = Math.min(1, (now - started) / 1800);
  mark.style.transform = `translateX(${Math.round(progress * 90)}px) rotate(${Math.round(progress * 15)}deg)`;
  mark.style.opacity = String(0.3 + progress * 0.7);
  mark.style.clipPath = `inset(0 ${Math.round((1 - progress) * 100)}% 0 0)`;
  line.style.strokeDashoffset = String(Math.round((1 - progress) * 100));
  if (progress < 1) requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
