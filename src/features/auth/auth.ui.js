export function applyMode(mode = 'guest') {
  document.body.classList.remove('host-mode', 'guest-mode');
  document.body.classList.add(mode === 'host' ? 'host-mode' : 'guest-mode');
  const badge = document.querySelector('[data-mode-badge]');
  if (badge) badge.textContent = mode === 'host' ? 'Host Mode' : 'Guest Mode';
  document.querySelectorAll('[data-host-only]').forEach(el => { el.hidden = (mode !== 'host'); });
}
