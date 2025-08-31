/* APK Hub — static catalog renderer */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const state = { apps: [], termsAccepted: false };

function fmtBytes(bytes) {
  if (!Number.isFinite(bytes)) return "";
  const units = ["B","KB","MB","GB"]; let i = 0; let v = bytes;
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(v < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

function renderApps() {
  const grid = document.getElementById('apps');
  grid.innerHTML = '';
  const q = document.getElementById('search').value.trim().toLowerCase();
  const sort = document.getElementById('sort').value;

  let rows = state.apps.filter(a =>
    !q || a.name.toLowerCase().includes(q) || a.package.toLowerCase().includes(q)
  );

  rows.sort((a,b) => {
    if (sort === 'name') return a.name.localeCompare(b.name);
    if (sort === 'size') return (a.size_bytes||0) - (b.size_bytes||0);
    if (sort === 'updated') return new Date(b.updated) - new Date(a.updated);
    return 0;
  });

  const tpl = document.getElementById('app-card');
  rows.forEach(app => {
    const node = tpl.content.cloneNode(true);
    const icon = node.querySelector('.app-icon');
    icon.src = app.icon || 'assets/placeholder.png';
    icon.alt = `${app.name} icon`;

    node.querySelector('.app-name').textContent = app.name;
    node.querySelector('.app-version').textContent = `v${app.version}`;
    node.querySelector('.app-desc').textContent = app.description || '';

    node.querySelector('.size').textContent = app.size_bytes ? `Size: ${fmtBytes(app.size_bytes)}` : 'Size: —';
    node.querySelector('.updated').textContent = app.updated ? `Updated: ${new Date(app.updated).toLocaleDateString()}` : 'Updated: —';
    node.querySelector('.sdk').textContent = app.min_sdk ? `Min SDK: ${app.min_sdk}` : 'Min SDK: —';

    const dl = node.querySelector('.download');
    dl.href = app.download_url;
    dl.addEventListener('click', (e) => {
      if (!state.termsAccepted) {
        e.preventDefault();
        document.getElementById('terms').showModal();
      }
    });

    const copyBtn = node.querySelector('.copy-hash');
    if (app.sha256) {
      copyBtn.dataset.hash = app.sha256;
      copyBtn.addEventListener('click', async () => {
        try { await navigator.clipboard.writeText(app.sha256); copyBtn.textContent = 'Copied ✓'; setTimeout(()=>copyBtn.textContent='Copy SHA-256',1200); } catch {}
      });
    } else {
      copyBtn.disabled = true; copyBtn.textContent = 'No SHA-256';
    }

    grid.appendChild(node);
  });
}

async function loadApps() {
  try {
    const res = await fetch('apps.json', { cache: 'no-store' });
    const data = await res.json();
    state.apps = Array.isArray(data) ? data : (data.apps || []);
    renderApps();
  } catch (e) {
    console.error('Failed to load apps.json', e);
    $('#apps').innerHTML = '<p style="color:#9fb0c3">Could not load app catalog. Ensure <code>apps.json</code> exists at site root.</p>';
  }
}

function initUI() {
  $('#year').textContent = new Date().getFullYear();
  $('#search').addEventListener('input', renderApps);
  $('#sort').addEventListener('change', renderApps);
  $('#open-terms').addEventListener('click',()=>$('#terms').showModal());
  $('#open-terms-footer').addEventListener('click',()=>$('#terms').showModal());
  $('#accept-terms').addEventListener('click',()=>{ state.termsAccepted = true; });
}

window.addEventListener('DOMContentLoaded', () => { initUI(); loadApps(); });