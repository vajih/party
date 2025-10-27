export const qs = (sel, root=document) => root.querySelector(sel);
export const qsa = (sel, root=document) => Array.from(root.querySelectorAll(sel));
export function el(tag, attrs={}, ...children){
  const n = document.createElement(tag);
  Object.entries(attrs || {}).forEach(([k,v]) => {
    if (k === 'class') n.className = v;
    else if (k.startsWith('on') && typeof v === 'function') n.addEventListener(k.slice(2), v);
    else n.setAttribute(k, v);
  });
  children.flat().forEach(c => n.append(c));
  return n;
}
