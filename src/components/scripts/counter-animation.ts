export function initCounterAnimation(): void {
  const statEls = document.querySelectorAll('.stat-num[data-target]');
  const animated = new Set<Element>();

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !animated.has(entry.target)) {
          animated.add(entry.target);
          animateCounter(entry.target as HTMLElement);
        }
      });
    },
    { threshold: 0.5 }
  );

  statEls.forEach((el) => observer.observe(el));

  function animateCounter(el: HTMLElement): void {
    const target = parseFloat(el.getAttribute('data-target') || '0');
    const suffix = el.getAttribute('data-suffix') || '';
    const decimals = parseInt(el.getAttribute('data-decimals') || '0');
    const duration = 1600;
    const start = performance.now();

    function step(now: number): void {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = eased * target;
      el.textContent = current.toFixed(decimals) + suffix;
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
}
