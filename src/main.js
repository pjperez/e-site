import './style.css';

document.documentElement.classList.add('js');

/* --- navigation ----------------------------------------------------------- */

const menu = document.querySelector('.menu');
const nav = document.querySelector('.masthead nav');

menu?.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') === 'true';
  menu.setAttribute('aria-expanded', String(!open));
  nav?.classList.toggle('open', !open);
});

nav?.addEventListener('click', (event) => {
  if (!(event.target instanceof HTMLAnchorElement)) return;
  menu?.setAttribute('aria-expanded', 'false');
  nav.classList.remove('open');
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape' || !nav?.classList.contains('open')) return;
  menu?.setAttribute('aria-expanded', 'false');
  nav.classList.remove('open');
  menu?.focus();
});

/* --- copy ----------------------------------------------------------------- */

const copy = document.querySelector('.copy');

copy?.addEventListener('click', async () => {
  const source = document.getElementById(copy.dataset.target);
  const label = copy.querySelector('.copy-text');
  if (!source || !label) return;

  const idle = label.dataset.idle ?? label.textContent;
  label.dataset.idle = idle;

  try {
    await navigator.clipboard.writeText(source.textContent.trim());
    label.textContent = 'Copied';
  } catch {
    const range = document.createRange();
    range.selectNodeContents(source);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    label.textContent = 'Selected';
  }

  window.clearTimeout(copy.dataset.timer);
  copy.dataset.timer = String(
    window.setTimeout(() => {
      label.textContent = idle;
    }, 2000),
  );
});

/* --- reveal --------------------------------------------------------------- */

const revealed = document.querySelectorAll(
  '.prose-head, .rows article, .surfaces li, .extend-note, .install-body',
);
revealed.forEach((node) => node.setAttribute('data-reveal', ''));

if ('IntersectionObserver' in window) {
  const watcher = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('shown');
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: '0px 0px -6%', threshold: 0.1 },
  );
  revealed.forEach((node) => watcher.observe(node));
} else {
  revealed.forEach((node) => node.classList.add('shown'));
}

/* --- the mark ------------------------------------------------------------- */

function webglAvailable() {
  try {
    const probe = document.createElement('canvas');
    return Boolean(
      window.WebGLRenderingContext &&
        (probe.getContext('webgl2') || probe.getContext('webgl')),
    );
  } catch {
    return false;
  }
}

function loadMark() {
  const canvas = document.getElementById('stage');
  const stage = document.querySelector('.hero-stage');
  if (!canvas || !stage || !webglAvailable()) return;

  import('./mark.js')
    .then(({ mountMark }) => mountMark(canvas, stage))
    .catch(() => {
      /* The static mark stays on screen. */
    });
}

const schedule = () => {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(loadMark, { timeout: 1500 });
  } else {
    window.setTimeout(loadMark, 250);
  }
};

if (document.readyState === 'complete') {
  schedule();
} else {
  window.addEventListener('load', schedule, { once: true });
}
