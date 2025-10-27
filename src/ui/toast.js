// src/ui/toast.js
// Lightweight toast system with accessibility, pause-on-hover, and action support.

const DEFAULTS = {
  type: 'default',         // 'default' | 'success' | 'error' | 'warning' | 'info'
  duration: 3200,          // ms; set 0 for sticky
  dismissible: true,       // show close "×"
  action: null,            // { label: 'Undo', onClick: () => {} }
  maxVisible: 4,           // max toasts on screen
};

let CURRENT_DEFAULTS = { ...DEFAULTS };

function ensureRoot() {
  let root = document.getElementById('toast-root');
  if (!root) {
    root = document.createElement('div');
    root.id = 'toast-root';
    root.setAttribute('aria-live', 'polite');
    root.setAttribute('aria-atomic', 'true');
    root.style.position = 'fixed';
    root.style.insetInlineEnd = '16px';
    root.style.insetBlockStart = '16px';
    root.style.display = 'grid';
    root.style.gap = '10px';
    root.style.zIndex = '9999';
    root.style.pointerEvents = 'none'; // only individual toasts receive events
    document.body.appendChild(root);
  }
  return root;
}

function buildToastEl(message, opts) {
  const el = document.createElement('div');
  el.className = `toast toast--${opts.type}`;
  el.role = 'status';
  el.style.pointerEvents = 'auto';
  el.style.minWidth = '220px';
  el.style.maxWidth = '420px';
  el.style.padding = '10px 12px';
  el.style.borderRadius = '10px';
  el.style.border = '1px solid #e5e7eb';
  el.style.background = '#fff';
  el.style.boxShadow = '0 2px 20px rgba(0,0,0,.08)';
  el.style.display = 'grid';
  el.style.gridTemplateColumns = '1fr auto';
  el.style.alignItems = 'center';
  el.style.gap = '8px';
  el.style.transition = 'transform 160ms ease, opacity 160ms ease';
  el.style.transform = 'translateY(-6px)';
  el.style.opacity = '0';

  // Message
  const msg = document.createElement('div');
  msg.className = 'toast__message';
  msg.style.fontSize = '14px';
  msg.style.color = '#111827';
  msg.innerHTML = typeof message === 'string' ? message : '';
  el.appendChild(msg);

  // Right-side controls
  const controls = document.createElement('div');
  controls.style.display = 'inline-flex';
  controls.style.alignItems = 'center';
  controls.style.gap = '8px';

  // Action button (optional)
  if (opts.action && typeof opts.action.onClick === 'function') {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'toast__action';
    btn.textContent = opts.action.label || 'Action';
    btn.style.border = '1px solid #d1d5db';
    btn.style.background = '#fff';
    btn.style.color = '#111827';
    btn.style.fontSize = '12px';
    btn.style.borderRadius = '999px';
    btn.style.padding = '4px 8px';
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      try { opts.action.onClick(); } finally { dismiss(el); }
    });
    controls.appendChild(btn);
  }

  // Close (optional)
  if (opts.dismissible) {
    const x = document.createElement('button');
    x.type = 'button';
    x.className = 'toast__close';
    x.setAttribute('aria-label', 'Dismiss notification');
    x.textContent = '×';
    x.style.border = 'none';
    x.style.background = 'transparent';
    x.style.fontSize = '18px';
    x.style.lineHeight = '1';
    x.style.cursor = 'pointer';
    x.style.color = '#6b7280';
    x.addEventListener('click', (e) => {
      e.stopPropagation();
      dismiss(el);
    });
    controls.appendChild(x);
  }

  el.appendChild(controls);

  // Color accents per type (kept inline so it works without extra CSS)
  const accent = {
    success: '#10b981',
    error:   '#ef4444',
    warning: '#f59e0b',
    info:    '#3b82f6',
    default: '#e5e7eb'
  }[opts.type] || '#e5e7eb';
  el.style.borderColor = accent;

  return el;
}

function animateIn(el) {
  requestAnimationFrame(() => {
    el.style.transform = 'translateY(0)';
    el.style.opacity = '1';
  });
}

function animateOut(el) {
  el.style.transform = 'translateY(-6px)';
  el.style.opacity = '0';
}

function startTimer(el, ms) {
  if (!ms || ms <= 0) return null;
  let timer = setTimeout(() => dismiss(el), ms);

  // Pause on hover/focus for accessibility
  const pause = () => { if (timer) { clearTimeout(timer); timer = null; } };
  const resume = () => { if (!timer) timer = setTimeout(() => dismiss(el), 800); };

  el.addEventListener('mouseenter', pause);
  el.addEventListener('mouseleave', resume);
  el.addEventListener('focusin',   pause);
  el.addEventListener('focusout',  resume);

  return () => { if (timer) clearTimeout(timer); timer = null; };
}

function trimIfOverMax(root, maxVisible) {
  const items = [...root.querySelectorAll('.toast')];
  const overflow = Math.max(0, items.length - maxVisible);
  for (let i = 0; i < overflow; i++) dismiss(items[i]);
}

export function toast(message, options = {}) {
  const opts = { ...CURRENT_DEFAULTS, ...options };
  const root = ensureRoot();

  const el = buildToastEl(message, opts);
  root.appendChild(el);

  trimIfOverMax(root, opts.maxVisible);

  // Animate in
  animateIn(el);

  // Auto dismiss
  const clearTimer = startTimer(el, opts.duration);

  // Return control handle
  return {
    el,
    dismiss: () => { if (clearTimer) clearTimer(); dismiss(el); }
  };
}

export function success(msg, opts={}) { return toast(msg, { ...opts, type: 'success' }); }
export function error(msg, opts={})   { return toast(msg, { ...opts, type: 'error' }); }
export function warning(msg, opts={}) { return toast(msg, { ...opts, type: 'warning' }); }
export function info(msg, opts={})    { return toast(msg, { ...opts, type: 'info' }); }

export function setDefaults(partial) { CURRENT_DEFAULTS = { ...CURRENT_DEFAULTS, ...partial }; }
export function removeAll() { ensureRoot().querySelectorAll('.toast').forEach(dismiss); }

function dismiss(el) {
  if (!el || !el.parentElement) return;
  animateOut(el);
  setTimeout(() => el.remove(), 180);
}

// Optional: expose globally for quick testing during dev
if (typeof window !== 'undefined') {
  window.UIToast = { toast, success, error, warning, info, setDefaults, removeAll };
}
