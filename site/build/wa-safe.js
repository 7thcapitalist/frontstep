const floatingCta = document.querySelector('.wa-float');
const safeZones = [...document.querySelectorAll('.cta-sec, .foot')];

if (floatingCta && safeZones.length && 'IntersectionObserver' in window) {
  const visibleZones = new Set();
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) visibleZones.add(entry.target);
      else visibleZones.delete(entry.target);
    }
    floatingCta.classList.toggle('wa-obscured', visibleZones.size > 0);
  }, {
    rootMargin: '0px 0px 72px 0px',
    threshold: 0,
  });

  safeZones.forEach((zone) => observer.observe(zone));
}
