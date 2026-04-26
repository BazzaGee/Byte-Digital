export function initFaqToggle(): void {
  document.querySelectorAll('.faq-q').forEach((btn) => {
    btn.addEventListener('click', () => {
      const wasOpen = btn.classList.contains('open');
      document.querySelectorAll('.faq-q.open').forEach((q) => {
        q.classList.remove('open');
        const answer = q.nextElementSibling;
        if (answer) answer.classList.remove('open');
      });
      if (!wasOpen) {
        btn.classList.add('open');
        const answer = btn.nextElementSibling;
        if (answer) answer.classList.add('open');
      }
    });
  });
}
