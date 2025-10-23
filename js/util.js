export const byId = (id) => document.getElementById(id);

export function slugify(text) {
  return (text || '')
    .toString().trim().toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 60);
}

export function fmtDate(dt) {
  if (!dt) return '';
  const d = new Date(dt);
  return d.toLocaleString();
}

export function copyToClipboard(text) {
  navigator.clipboard?.writeText(text).catch(() => {});
}
