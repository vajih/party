export async function loadFragmentInto(selector, url) {
  try {
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    const el = document.querySelector(selector);
    if (el) el.innerHTML = html;
  } catch (err) {
    console.warn('Failed to load fragment', url, err);
  }
}
