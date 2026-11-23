/* ===== Daqui — camada de alterações ao catálogo =====
   Os dados de base estão em js/data.js. Por cima deles aplicam-se, por esta ordem:
     1. SAVED_CHANGES (js/alteracoes.js): alterações permanentes, iguais para todos os visitantes;
     2. as alterações feitas na conta de gestão neste navegador (localStorage "daqui-catalog").
   Formato (todas as chaves são opcionais):
   {
     products:    { "<id>": { price, season:[início,fim], split:[agricultor,frio,daqui], outOfStock:true|false,
                              producers:[{farmer, organic, outOfStock}], aliases:["id antigo"] } },
     removedProducts: [ "<id>" ],   // produtos juntados a outro (ver aliases)
     newProducts: [ { id, cat, name:{pt,en}, price, unit, farmer, icon, season, harvest, essential, organic, desc:{pt,en} } ],
     boxes:       { "caixa-mista": { "P": 11.9, "G": 21.9 } },
     harvestDays: [ { date, farmer, crop, what:{pt,en}, time, spots } ],   // substitui a lista inteira
     farmers:     { "<id>": { story:{pt,en}, farm, place } },
     newFarmers:  [ { id, name, farm, place, region, lat, lon, since, crop, seed, story:{pt,en} } ],
     restaurants: { "<id>": { name, kind:{pt,en}, area:{pt,en}, dish:{pt,en}, dishes:[{pt,en}] } },
     newRestaurants: [ { id, name, lat, lon, kind, area, dish, since } ]
   } */
const CATALOG_KEY = 'daqui-catalog';
let LOCAL_CHANGES = (() => { try { return JSON.parse(localStorage.getItem(CATALOG_KEY) || '{}') || {}; } catch (e) { return {}; } })();
const BASE_HARVEST_DAYS = HARVEST_DAYS.map(d => Object.assign({}, d));
/* cópia do catálogo de js/data.js antes de qualquer alteração (para comparar e exportar) */
const CATALOG_BASE = JSON.parse(JSON.stringify({ products: PRODUCTS, farmers: FARMERS, restaurants: RESTAURANTS, harvestDays: HARVEST_DAYS, boxes: BOX_SIZES }));
function mergeChanges(a, b) {
  const out = JSON.parse(JSON.stringify(a || {}));
  for (const [k, v] of Object.entries(b || {})) {
    if (k === 'boxSizes') out[k] = Object.assign({}, out[k] || {}, JSON.parse(JSON.stringify(v)));
    else if (['products', 'boxes', 'farmers', 'restaurants', 'boxCfg'].includes(k)) { out[k] = out[k] || {}; for (const [id, o] of Object.entries(v)) out[k][id] = Object.assign({}, out[k][id] || {}, o); }
    else if (['newProducts', 'newFarmers', 'newRestaurants', 'newBoxes'].includes(k)) { const list = (out[k] || []).filter(x => !v.some(y => y.id === x.id)); out[k] = list.concat(v); }
    else out[k] = JSON.parse(JSON.stringify(v));
  }
  return out;
}
/* caixas criadas na gestão (ex.: frutos secos, aromáticas, fruta exótica): produto da categoria "caixas" + preços por tamanho */
function boxProduct(b) {
  const sizes = (b.sizes || []).filter(s => s && s.s && +s.price >= 0);
  return { id: b.id, cat: 'caixas', box: 'custom', custom: true, items: (b.items || []).slice(), icon: b.icon || '', name: { pt: b.name.pt, en: b.name.en || b.name.pt }, desc: { pt: (b.desc || {}).pt || '', en: (b.desc || {}).en || (b.desc || {}).pt || '' },
    price: sizes.length ? Math.min(...sizes.map(s => +s.price)) : 0, unit: 'cx', kg: sizes.length ? +sizes[0].kg : 0, essential: false, organic: false, isNew: true };
}
function applyBox(b) {
  const np = boxProduct(b), ex = PRODUCTS.find(p => p.id === b.id);
  if (ex) Object.assign(ex, np); else { const i = PRODUCTS.findIndex(p => p.cat !== 'caixas'); PRODUCTS.splice(i < 0 ? PRODUCTS.length : i, 0, np); }
  BOX_SIZES[b.id] = (b.sizes || []).map(s => ({ s: s.s, kg: +s.kg, price: +s.price }));
}
function applyChanges(ch) {
  (ch.newBoxes || []).forEach(applyBox);
  (ch.removedBoxes || []).forEach(id => { const i = PRODUCTS.findIndex(p => p.id === id && p.custom); if (i >= 0) PRODUCTS.splice(i, 1); delete BOX_SIZES[id]; });
  (ch.removedProducts || []).forEach(id => { const i = PRODUCTS.findIndex(p => p.id === id); if (i >= 0) PRODUCTS.splice(i, 1); });
  (ch.newProducts || []).forEach(np => { const ex = PRODUCTS.find(p => p.id === np.id); if (ex) Object.assign(ex, np); else PRODUCTS.push(Object.assign({ isNew: true }, np)); });
  for (const [id, o] of Object.entries(ch.products || {})) { const p = PRODUCTS.find(x => x.id === id); if (p) Object.assign(p, o); }
  for (const [id, c] of Object.entries(ch.boxCfg || {})) { const b = PRODUCTS.find(x => x.id === id); if (b) Object.assign(b, c, { boxCfg: true }); }
  for (const [id, list] of Object.entries(ch.boxSizes || {})) { BOX_SIZES[id] = list.map(z => ({ s: z.s, kg: +z.kg, price: +z.price })); const b = PRODUCTS.find(x => x.id === id); if (b && list.length) { b.price = Math.min(...list.map(z => +z.price)); if (b.custom) b.kg = +list[0].kg; } }
  for (const [id, sizes] of Object.entries(ch.boxes || {})) { (BOX_SIZES[id] || []).forEach(s => { if (sizes[s.s] != null) s.price = +sizes[s.s]; }); const b = PRODUCTS.find(x => x.id === id); if (b && BOX_SIZES[id]) b.price = Math.min(...BOX_SIZES[id].map(s => s.price)); }
  if (Array.isArray(ch.harvestDays)) { HARVEST_DAYS.length = 0; ch.harvestDays.forEach(d => HARVEST_DAYS.push(Object.assign({ id: d.id || `${d.date}-${d.farmer}` }, d))); HARVEST_DAYS.sort((a, b) => a.date.localeCompare(b.date)); }
  (ch.newFarmers || []).forEach(f => { const ex = FARMERS.find(x => x.id === f.id); if (ex) Object.assign(ex, f); else FARMERS.push(Object.assign({ isNew: true }, f)); });
  for (const [id, o] of Object.entries(ch.farmers || {})) { const f = FARMERS.find(x => x.id === id); if (f) Object.assign(f, o); }
  (ch.newRestaurants || []).forEach(r => { const ex = RESTAURANTS.find(x => x.id === r.id); if (ex) Object.assign(ex, r); else RESTAURANTS.push(Object.assign({ isNew: true }, r)); });
  for (const [id, o] of Object.entries(ch.restaurants || {})) { const r = RESTAURANTS.find(x => x.id === id); if (r) Object.assign(r, o); }
}
applyChanges(mergeChanges(typeof SAVED_CHANGES !== 'undefined' ? SAVED_CHANGES : {}, LOCAL_CHANGES));
/* altera o catálogo neste navegador: fn recebe o objeto de alterações local */
/* ---------- "Guardar alterações": nas páginas de gestão, as alterações feitas nos campos ficam por guardar
   e vão todas juntas num só envio quando se carrega no botão (barra no fundo do ecrã) ---------- */
let PENDING = null;
function editCatalog(fn) { const ch = {}; fn(ch); applyChanges(ch); PENDING = mergeChanges(PENDING || {}, ch); pendingBar(); }
function pendingCount() { if (!PENDING) return 0; let n = 0; for (const [k, v] of Object.entries(PENDING)) n += Array.isArray(v) ? (k === 'harvestDays' ? 1 : v.length) : Object.keys(v || {}).length; return n; }
const hasPendingEdits = () => pendingCount() > 0;
function commitEdits() {
  const ch = PENDING; PENDING = null; pendingBar();
  if (!ch) return;
  if (typeof NUVEM !== 'undefined' && NUVEM.on) NUVEM.pushCatalog(ch);
  else { LOCAL_CHANGES = mergeChanges(LOCAL_CHANGES, ch); try { localStorage.setItem(CATALOG_KEY, JSON.stringify(LOCAL_CHANGES)); } catch (e) {} }
  if (typeof toast === 'function') toast(T('Alterações guardadas', 'Changes saved'));
}
function discardEdits() { PENDING = null; pendingBar(); location.reload(); }
function pendingBar() {
  if (typeof document === 'undefined') return;
  let b = document.getElementById('pending-bar'); const n = pendingCount();
  if (!n) { if (b) b.remove(); return; }
  const label = `<b>${n}</b> ${n === 1 ? T('alteração por guardar', 'unsaved change') : T('alterações por guardar', 'unsaved changes')}`;
  /* se a barra já existe só muda o texto: os botões não são substituídos (um clique em "Guardar" logo a seguir a escrever num campo não se perde) */
  if (b) { b.querySelector('span').innerHTML = label; return; }
  b = document.createElement('div'); b.id = 'pending-bar'; b.className = 'pending-bar'; b.setAttribute('role', 'region'); b.setAttribute('aria-label', T('Alterações por guardar', 'Unsaved changes'));
  b.innerHTML = `<span>${label}</span><button type="button" class="btn btn-line btn-sm" data-pending-discard>${T('Descartar', 'Discard')}</button><button type="button" class="btn btn-green btn-sm" data-pending-save>${T('Guardar alterações', 'Save changes')}</button>`;
  document.body.appendChild(b);
}
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', e => { if (hasPendingEdits()) { e.preventDefault(); e.returnValue = ''; } });
  document.addEventListener('click', e => { const t = e.target.closest('[data-pending-save],[data-pending-discard]'); if (!t) return; if (t.matches('[data-pending-save]')) commitEdits(); else discardEdits(); });
}
function saveCatalog(fn) {
  if (typeof NUVEM !== 'undefined' && NUVEM.on) { const ch = {}; fn(ch); applyChanges(ch); NUVEM.pushCatalog(ch); return; }   // com base de dados: grava lá
  fn(LOCAL_CHANGES);
  try { localStorage.setItem(CATALOG_KEY, JSON.stringify(LOCAL_CHANGES)); } catch (e) {}
  applyChanges(LOCAL_CHANGES);
}
/* quantas alterações deste navegador ainda não estão em js/alteracoes.js */
function catalogChangeCount() {
  if (typeof NUVEM !== 'undefined' && NUVEM.on) return 0;
  const S = typeof SAVED_CHANGES !== 'undefined' ? SAVED_CHANGES : {}, M = mergeChanges(S, LOCAL_CHANGES), same = (a, b) => JSON.stringify(a) === JSON.stringify(b); let n = 0;
  for (const k of ['products', 'boxes', 'farmers', 'restaurants']) for (const id of Object.keys(M[k] || {})) if (!same(M[k][id], (S[k] || {})[id])) n++;
  for (const k of ['newProducts', 'newFarmers', 'newRestaurants', 'newBoxes']) for (const x of M[k] || []) if (!same(x, (S[k] || []).find(y => y.id === x.id))) n++;
  for (const id of M.removedProducts || []) if (!(S.removedProducts || []).includes(id)) n++;
  if (!same(M.harvestDays, S.harvestDays)) n++;
  return n;
}
/* diferenças entre o catálogo atual e o de js/data.js, no formato de SAVED_CHANGES */
function diffFromBase() {
  const B = CATALOG_BASE, ch = {}, same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const pick = (o, keys) => Object.fromEntries(keys.filter(k => o[k] !== undefined).map(k => [k, o[k]]));
  const PK = ['cat', 'name', 'price', 'unit', 'farmer', 'art', 'icon', 'season', 'harvest', 'essential', 'organic', 'outOfStock', 'split', 'desc', 'producers', 'aliases'];
  const removed = B.products.filter(b => b.cat !== 'caixas' && !PRODUCTS.some(p => p.id === b.id)).map(b => b.id); if (removed.length) ch.removedProducts = removed;
  PRODUCTS.filter(p => p.cat !== 'caixas').forEach(p => {
    const b = B.products.find(x => x.id === p.id);
    if (!b) { (ch.newProducts = ch.newProducts || []).push(pick(p, ['id', ...PK])); return; }
    const o = {}; PK.forEach(k => { if (!same(p[k] ?? null, b[k] ?? null) && !(k === 'outOfStock' && !p[k] && !b[k])) o[k] = p[k] ?? null; });
    if (Object.keys(o).length) (ch.products = ch.products || {})[p.id] = o;
  });
  for (const [id, sizes] of Object.entries(BOX_SIZES)) { const o = {}; sizes.forEach(z => { const b = (B.boxes[id] || []).find(x => x.s === z.s); if (!b || b.price !== z.price) o[z.s] = z.price; }); if (Object.keys(o).length) (ch.boxes = ch.boxes || {})[id] = o; }
  const strip = l => l.map(d => ({ date: d.date, farmer: d.farmer, crop: d.crop, what: d.what, time: d.time, spots: d.spots }));
  if (!same(strip(HARVEST_DAYS), strip(B.harvestDays))) ch.harvestDays = strip(HARVEST_DAYS);
  FARMERS.forEach(f => { const b = B.farmers.find(x => x.id === f.id), { isNew, ...rest } = f;
    if (!b) { (ch.newFarmers = ch.newFarmers || []).push(rest); return; }
    const o = {}; ['name', 'farm', 'place', 'story'].forEach(k => { if (!same(f[k], b[k])) o[k] = f[k]; }); if (Object.keys(o).length) (ch.farmers = ch.farmers || {})[f.id] = o; });
  RESTAURANTS.forEach(r => { const b = B.restaurants.find(x => x.id === r.id), { isNew, ...rest } = r;
    if (!b) { (ch.newRestaurants = ch.newRestaurants || []).push(rest); return; }
    const o = {}; ['name', 'kind', 'area', 'dish', 'dishes'].forEach(k => { if (!same(r[k] ?? null, b[k] ?? null) && !(k === 'dishes' && !(r.dishes || []).length && !b.dishes)) o[k] = r[k]; }); if (Object.keys(o).length) (ch.restaurants = ch.restaurants || {})[r.id] = o; });
  return ch;
}
function exportChangesFile() {
  const all = typeof NUVEM !== 'undefined' && NUVEM.on ? diffFromBase() : mergeChanges(typeof SAVED_CHANGES !== 'undefined' ? SAVED_CHANGES : {}, LOCAL_CHANGES);
  return `/* ===== Daqui — alterações permanentes feitas na conta de gestão =====
   Gerado em ${new Date().toISOString().slice(0, 16).replace('T', ' ')} a partir do painel de gestão.
   Substitua js/alteracoes.js por este ficheiro para que as alterações fiquem no site para toda a gente. */
const SAVED_CHANGES = ${JSON.stringify(all, null, 2)};
`;
}
function resetCatalog() { try { localStorage.removeItem(CATALOG_KEY); } catch (e) {} }
const slugify = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
