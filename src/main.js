import './style.css';

document.documentElement.classList.add('js');

const navToggle = document.querySelector('.nav-toggle');
const nav = document.querySelector('.site-nav');

navToggle?.addEventListener('click', () => {
  const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
  navToggle.setAttribute('aria-expanded', String(!isOpen));
  nav?.classList.toggle('is-open', !isOpen);
});

nav?.addEventListener('click', (event) => {
  if (event.target instanceof HTMLAnchorElement) {
    navToggle?.setAttribute('aria-expanded', 'false');
    nav.classList.remove('is-open');
  }
});

const copyButton = document.querySelector('.copy-button');
copyButton?.addEventListener('click', async () => {
  const target = document.getElementById(copyButton.dataset.copyTarget);
  const label = copyButton.querySelector('.copy-label');
  if (!target || !label) return;

  try {
    await navigator.clipboard.writeText(
      target.innerText.replaceAll(/^\$\s/gm, ''),
    );
    label.textContent = 'Copied';
    window.setTimeout(() => {
      label.textContent = 'Copy';
    }, 1800);
  } catch {
    label.textContent = 'Select to copy';
  }
});

const revealItems = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -8%', threshold: 0.12 },
  );
  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add('is-visible'));
}

const scheduleThreeMark = () => {
  const run = () => {
    import('./e-mark.js')
      .then(({ mountThreeMark }) => mountThreeMark())
      .catch((error) => {
        console.warn('Interactive mark unavailable; using static fallback.', error);
      });
  };
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(run, { timeout: 1200 });
  } else {
    window.setTimeout(run, 300);
  }
};

if (document.readyState === 'complete') {
  scheduleThreeMark();
} else {
  window.addEventListener('load', scheduleThreeMark, { once: true });
}
