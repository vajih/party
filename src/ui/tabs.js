export function buildTabs(mount, tabs, opts = {}) {
  if (!mount) return;
  const initial = opts.initial || (tabs[0]?.id);
  const nav = document.createElement('div');
  nav.className = 'tabs-nav';
  const panel = document.createElement('div');
  panel.className = 'tabs-panel';

  function renderTab(id) {
    panel.innerHTML = '';
    const t = tabs.find(x => x.id === id);
    if (!t) return;
    const html = typeof t.render === 'function' ? t.render() : (t.render || '');
    panel.innerHTML = html;
    Array.from(nav.children).forEach(btn => btn.classList.toggle('active', btn.dataset.id === id));
  }

  tabs.forEach(t => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = t.label;
    btn.dataset.id = t.id;
    btn.className = 'tab-btn';
    btn.addEventListener('click', () => renderTab(t.id));
    nav.appendChild(btn);
  });

  mount.innerHTML = '';
  mount.appendChild(nav);
  mount.appendChild(panel);
  renderTab(initial);
}
