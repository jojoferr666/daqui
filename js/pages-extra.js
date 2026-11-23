/* ===== Daqui — v11: restaurantes (página própria, cozinhas, distâncias, mapa com zoom), aspeto, sininho,
   Saldo Daqui e Cooperativa, avaliações de produtos, dados da conta e textos legais ===== */

/* ---------- preferências de aspeto (guardadas neste navegador / telemóvel) ---------- */
const LOOK_KEY = 'daqui-aspeto';
const LOOK = Object.assign({ map: 0, anim: true }, store.get(LOOK_KEY, {}));
function setLook(patch) { Object.assign(LOOK, patch); store.set(LOOK_KEY, LOOK); applyLook(); }
function applyLook() { if (typeof document === 'undefined') return; document.documentElement.classList.toggle('no-anim', !LOOK.anim); const b = document.body; if (!b) return; b.classList.toggle('no-anim', !LOOK.anim); b.dataset.mapa = LOOK.map; }
applyLook(); document.addEventListener('DOMContentLoaded', applyLook);
/* estilos do mapa dos restaurantes: 0 original, 1 suave (cores esbatidas), 2 minimalista (cinzentos claros) */
const MAP_STYLES = () => [[0, T('Original', 'Original'), T('As cores normais do mapa.', 'The usual map colours.')], [1, T('Suave', 'Soft'), T('Cores esbatidas, com um véu creme.', 'Faded colours with a cream veil.')], [2, T('Minimalista', 'Minimal'), T('Cinzentos claros: só ruas e água.', 'Light greys: just streets and water.')]];
function accLookSection() {
  return `<section class="acc-sec" id="aspeto"><h2>${T('Aspeto', 'Appearance')}</h2>
    <p class="muted mt-s">${T('Fica guardado neste navegador.', 'Saved in this browser.')}</p>
    <h3 class="mt">${T('Mapa dos restaurantes', 'Restaurants map')}</h3>${lookMapChoices()}
    <h3 class="mt">${T('Animações', 'Animations')}</h3>
    <label class="switch"><input type="checkbox" data-look-anim${LOOK.anim ? ' checked' : ''}>${T('Transições animadas entre páginas', 'Animated page transitions')}</label></section>`;
}
function lookMapChoices() {
  return `<div class="look-maps">${MAP_STYLES().map(([v, n, d]) => `<label class="look-map"><input type="radio" name="look-map" value="${v}" data-look-map${LOOK.map === v ? ' checked' : ''}><span class="lm-prev" data-mapa="${v}">${miniMapPreview()}</span><b>${n}</b><span class="small muted">${d}</span></label>`).join('')}</div>`;
}
const miniMapPreview = () => `<svg viewBox="0 0 120 70" aria-hidden="true"><g class="av-tiles"><rect width="120" height="70" fill="#EEEAE0"/><path d="M0 40 Q40 30 70 44 T120 38" stroke="#A8D0E6" stroke-width="9" fill="none"/><path d="M10 0 L30 70 M60 0 L55 70 M0 18 H120" stroke="#fff" stroke-width="4"/><rect x="72" y="8" width="26" height="16" fill="#C9E6B4"/><rect x="34" y="50" width="16" height="12" fill="#F3D9A6"/></g><circle cx="88" cy="52" r="5" fill="#3C6104"/></svg>`;
PAGE_EVENTS.change.push((e, t) => {
  if (t.matches('[data-look-map]')) { setLook({ map: +t.value }); toast(T('Estilo do mapa guardado', 'Map style saved')); if (PAGE === 'restaurantes' || PAGE === 'restaurante') rerenderKeep(`[data-look-map][value="${t.value}"]`); return true; }
  if (t.matches('[data-look-anim]')) { setLook({ anim: t.checked }); toast(t.checked ? T('Animações ligadas', 'Animations on') : T('Animações desligadas', 'Animations off')); return true; }
});

/* ---------- transições entre páginas (site): a página sai e a seguinte entra suavemente ---------- */
document.addEventListener('click', e => {
  const a = e.target.closest('a[href]'); if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank' || a.hasAttribute('download')) return;
  if (PAGE_DOC === 'app' || !LOOK.anim || document.startViewTransition) return;   // com View Transitions (Chrome) o próprio navegador anima
  const url = new URL(a.href, location.href); if (url.origin !== location.origin || (url.pathname === location.pathname && url.hash)) return;
  if (typeof hasPendingEdits === 'function' && hasPendingEdits()) return;
  e.preventDefault(); document.body.classList.add('saindo'); setTimeout(() => { location.href = a.href; }, 160);
});
window.addEventListener('pageshow', () => document.body && document.body.classList.remove('saindo'));

/* ---------- restaurantes: tipo de cozinha ---------- */
const KIND_TO_CUISINE = { 'peixe e marisco': 'peixe', 'cozinha portuguesa': 'portuguesa', 'vegetariano': 'vegetariana', 'vegetariana': 'vegetariana', 'vegano': 'vegana', 'vegana': 'vegana', 'bistro': 'bistro', 'bistrô': 'bistro', 'cozinha de autor': 'autor', 'almoços e pastelaria': 'pastelaria', 'café e refeições rápidas': 'cafe', 'petiscos': 'petiscos' };
const cuisineOf = r => (r && r.cuisine) || KIND_TO_CUISINE[norm((r && r.kind && r.kind.pt) || '')] || KIND_TO_CUISINE[((r && r.kind && r.kind.pt) || '').toLowerCase()] || 'portuguesa';
const cuisineName = r => { const c = CUISINES.find(x => x.id === cuisineOf(r)); return c ? L(c) : L(r.kind || { pt: '', en: '' }); };
const restHref = r => href('restaurante', 'id=' + encodeURIComponent(r.id));
const vegBadges = (o, small) => `${o && o.vegan ? `<span class="vtag vegan${small ? ' sm' : ''}" title="${T('Vegan', 'Vegan')}">${icon('leaf', 13)}${T('Vegan', 'Vegan')}</span>` : o && o.veg ? `<span class="vtag${small ? ' sm' : ''}" title="${T('Vegetariano', 'Vegetarian')}">${icon('leaf', 13)}${T('Vegetariano', 'Vegetarian')}</span>` : ''}`;
const restDishes = r => [Object.assign({ week: true }, r.dish || {}, { veg: !!r.dishVeg || !!r.dishVegan, vegan: !!r.dishVegan })].concat((r.dishes || []).map(d => Object.assign({}, d, { veg: !!d.veg || !!d.vegan, vegan: !!d.vegan }))).filter(d => d.pt || d.en);
const restVeg = r => restDishes(r).some(d => d.veg), restVegan = r => restDishes(r).some(d => d.vegan);

/* distância: posição do navegador (o mesmo cálculo da app) */
let restPos = null, restCuisine = 'all';
const kmTo = (a, r) => { const R6 = 6371, dLa = (r.lat - a.lat) * Math.PI / 180, dLo = (r.lon - a.lon) * Math.PI / 180, x = Math.sin(dLa / 2) ** 2 + Math.cos(a.lat * Math.PI / 180) * Math.cos(r.lat * Math.PI / 180) * Math.sin(dLo / 2) ** 2; return 2 * R6 * Math.asin(Math.sqrt(x)); };
const kmText = km => (km < 1 ? `${Math.round(km * 1000 / 10) * 10} m` : `${numFmt(Math.round(km * 10) / 10)} km`);
function askBrowserPosition() {
  return new Promise((ok, no) => {
    if (typeof NATIVO !== 'undefined' && NATIVO.isNative && NATIVO.position) return NATIVO.position().then(ok, no);
    if (!navigator.geolocation) return no(new Error('geo'));
    navigator.geolocation.getCurrentPosition(p => ok({ lat: p.coords.latitude, lon: p.coords.longitude }), no, { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 });
  });
}
function restaurantsShown() {
  let list = RESTAURANTS.filter(r => restCuisine === 'all' || (restCuisine === 'veg' ? restVeg(r) : restCuisine === 'vegan' ? restVegan(r) : cuisineOf(r) === restCuisine));
  if (restPos) list = list.slice().sort((a, b) => kmTo(restPos, a) - kmTo(restPos, b));
  return list;
}
function restFilters() {
  const used = CUISINES.filter(c => RESTAURANTS.some(r => cuisineOf(r) === c.id));
  const chip = (k, n, c) => `<button class="chip" data-rest-cuisine="${k}" aria-pressed="${restCuisine === k}">${n} <span class="small muted">${c}</span></button>`;
  return `<div class="chips mb-s" role="group" aria-label="${T('Filtrar por tipo de cozinha', 'Filter by cuisine')}">${chip('all', T('Todos', 'All'), RESTAURANTS.length)}${chip('veg', T('Com pratos vegetarianos', 'With vegetarian dishes'), RESTAURANTS.filter(restVeg).length)}${chip('vegan', T('Com pratos vegan', 'With vegan dishes'), RESTAURANTS.filter(restVegan).length)}${used.map(c => chip(c.id, esc(L(c)), RESTAURANTS.filter(r => cuisineOf(r) === c.id).length)).join('')}</div>
    <div class="row-gap mb">${restPos ? `<span class="small c-ok">${icon('locate', 16)} ${T('Ordenados pela distância a si', 'Sorted by distance from you')}</span><button class="link small" data-rest-noloc>${T('Esquecer a localização', 'Forget my location')}</button>` : `<button class="btn btn-line btn-sm c-campo" data-rest-loc>${icon('locate', 16)} ${T('Mostrar a distância a cada restaurante', 'Show the distance to each restaurant')}</button>`}</div>`;
}
function restListHTML(list) {
  return `<ol class="rest-list">${list.map((r, i) => { return `<li id="${r.id}" class="rest" data-rest-card="${r.id}"><span class="rn">${i + 1}</span><div>
    <h3><a href="${restHref(r)}">${esc(r.name)}</a></h3><p class="small muted">${esc(cuisineName(r))}. ${esc(L(r.area))}${restPos ? ` · <b class="c-campo">${kmText(kmTo(restPos, r))}</b>` : ''}</p>
    <p class="small"><b>${T('Prato da semana', 'Dish of the week')}:</b> ${esc(L(r.dish))} ${vegBadges({ veg: r.dishVeg, vegan: r.dishVegan }, true)}</p>
    <p class="small muted">${T('Selo desde', 'Seal since')} ${r.since ? fdate(parseISO(r.since + '-15'), { month: 'long', year: 'numeric' }) : '–'} · <a class="link" href="${restHref(r)}">${T('Ver o restaurante', 'See the restaurant')}</a></p></div></li>`; }).join('')}</ol>`;
}
PAGE_EVENTS.click.push((e, t, d) => {
  if (d.restCuisine) { restCuisine = d.restCuisine; rerenderKeep(`[data-rest-cuisine="${d.restCuisine}"]`); return true; }
  if ('restLoc' in d) { t.disabled = true; askBrowserPosition().then(p => { restPos = p; rerenderKeep('[data-rest-noloc]'); }, () => { t.disabled = false; toast(T('Não foi possível obter a sua localização. Verifique a permissão do navegador.', 'Could not get your location. Check the browser permission.')); }); return true; }
  if ('restNoloc' in d) { restPos = null; rerenderKeep('[data-rest-loc]'); return true; }
});

/* página de cada restaurante (/restaurante/?id=…) */
PAGES.restaurante = () => {
  const r = RESTAURANTS.find(x => x.id === (QS.get('id') || PID));
  if (!r) return { title: T('Restaurante não encontrado', 'Restaurant not found'), html: `<div class="wrap page-head"><h1>${T('Restaurante não encontrado', 'Restaurant not found')}</h1><a class="btn btn-green mt" href="${href('restaurantes')}">${T('Ver restaurantes', 'See restaurants')}</a></div>` };
  const dishes = restDishes(r), nVeg = dishes.filter(x => x.veg).length, nVegan = dishes.filter(x => x.vegan).length;
  const others = RESTAURANTS.filter(x => x.id !== r.id && cuisineOf(x) === cuisineOf(r)).concat(RESTAURANTS.filter(x => x.id !== r.id && cuisineOf(x) !== cuisineOf(r))).slice(0, 3);
  const html = `${crumbs([[T('Restaurantes', 'Restaurants'), 'restaurantes'], [r.name, '']])}
  <section class="wrap rest-hero">
    <div><span class="seal-mini">${sealSVG('mini', lang)}</span>
      <h1>${esc(r.name)}</h1>
      <p class="where big">${icon('utensils', 20)}${esc(cuisineName(r))} · ${icon('pin', 18)}${esc(L(r.area))}</p>
      <p class="muted">${T('Selo Daqui desde', 'Daqui Seal since')} ${r.since ? fdate(parseISO(r.since + '-15'), { month: 'long', year: 'numeric' }) : '–'}${restPos ? ` · ${T('a', '')} <b>${kmText(kmTo(restPos, r))}</b> ${T('de si', 'away')}` : ''}</p>
      <div class="row-gap mt-s">${nVeg ? `<span class="vtag">${icon('leaf', 14)}${T(`${nVeg} ${nVeg === 1 ? 'opção vegetariana' : 'opções vegetarianas'}`, `${nVeg} vegetarian ${nVeg === 1 ? 'option' : 'options'}`)}</span>` : ''}${nVegan ? `<span class="vtag vegan">${icon('leaf', 14)}${T(`${nVegan} ${nVegan === 1 ? 'opção vegan' : 'opções vegan'}`, `${nVegan} vegan ${nVegan === 1 ? 'option' : 'options'}`)}</span>` : ''}</div>
      ${restPos ? '' : `<button class="btn btn-line btn-sm c-campo mt-s" data-rest-loc>${icon('locate', 16)} ${T('A que distância fica?', 'How far is it?')}</button>`}</div>
    <div class="mapbox sm">${aveiroMapSVG([r], lang, r.id)}</div>
  </section>
  <section class="sec-tight"><div class="wrap">
    <h2>${T('Menu Daqui', 'Daqui menu')}</h2>
    <p class="lead mt-s">${T('Pratos feitos com fruta e legumes dos agricultores da Daqui.', 'Dishes made with fruit and vegetables from Daqui farmers.')}</p>
    <ul class="menu-list mt">${dishes.map(d => `<li class="${d.week ? 'week' : ''}"><div><b>${esc(L(d))}</b>${d.week ? ` <span class="tag">${T('Prato da semana', 'Dish of the week')}</span>` : ''}</div><div>${vegBadges(d)}</div></li>`).join('')}</ul>
    <p class="small muted mt">${T('Vegetariano: sem carne nem peixe. Vegan: sem ingredientes de origem animal. Informação dada pelo restaurante.', 'Vegetarian: no meat or fish. Vegan: no animal ingredients. Information provided by the restaurant.')}</p>
    ${others.length ? `<h2 class="mt-l">${T('Outros restaurantes com o Selo Daqui', 'Other restaurants with the Daqui Seal')}</h2>${restListHTML(others)}` : ''}
  </div></section><div class="spacer"></div>`;
  return { title: r.name, html, after: () => enhanceMaps() };
};

/* ---------- mapa de Aveiro: arrastar, aproximar e afastar dentro do quadro (rato, dedo e botões) ---------- */
function enhanceMaps(root = document) {
  root.querySelectorAll('svg.avmap:not([data-pz])').forEach(svg => {
    svg.dataset.pz = '1';
    const box = svg.parentElement; box.classList.add('pz-box');
    const W = 640, H = 548; let vb = { x: 0, y: 0, w: W, h: H };
    const set = () => { vb.w = Math.min(W, Math.max(W / 5, vb.w)); vb.h = vb.w * H / W; vb.x = Math.min(W - vb.w, Math.max(0, vb.x)); vb.y = Math.min(H - vb.h, Math.max(0, vb.y)); svg.setAttribute('viewBox', `${vb.x.toFixed(1)} ${vb.y.toFixed(1)} ${vb.w.toFixed(1)} ${vb.h.toFixed(1)}`); box.classList.toggle('zoomed', vb.w < W - 1); };
    const toSvg = (cx, cy) => { const r = svg.getBoundingClientRect(); return { x: vb.x + (cx - r.left) / r.width * vb.w, y: vb.y + (cy - r.top) / r.height * vb.h }; };
    const zoom = (k, cx, cy) => { const r = svg.getBoundingClientRect(); const p = cx == null ? { x: vb.x + vb.w / 2, y: vb.y + vb.h / 2 } : toSvg(cx, cy); const nw = Math.min(W, Math.max(W / 5, vb.w / k)); const fx = (p.x - vb.x) / vb.w, fy = (p.y - vb.y) / vb.h; vb.w = nw; vb.h = nw * H / W; vb.x = p.x - fx * vb.w; vb.y = p.y - fy * vb.h; set(); };
    const ctr = document.createElement('div'); ctr.className = 'pz-ctr';
    ctr.innerHTML = `<button type="button" aria-label="${T('Aproximar', 'Zoom in')}" data-z="in">${icon('plus', 18)}</button><button type="button" aria-label="${T('Afastar', 'Zoom out')}" data-z="out">${icon('minus', 18)}</button><button type="button" aria-label="${T('Ver tudo', 'Show all')}" data-z="reset">${icon('crosshair', 18)}</button>`;
    box.appendChild(ctr);
    ctr.addEventListener('click', e => { const b = e.target.closest('[data-z]'); if (!b) return; e.preventDefault(); e.stopPropagation(); if (b.dataset.z === 'in') zoom(1.6); else if (b.dataset.z === 'out') zoom(1 / 1.6); else { vb = { x: 0, y: 0, w: W, h: H }; set(); } });
    svg.addEventListener('wheel', e => { if (!e.ctrlKey && !box.classList.contains('zoomed') && e.deltaY > 0) return; e.preventDefault(); zoom(e.deltaY < 0 ? 1.25 : 0.8, e.clientX, e.clientY); }, { passive: false });
    const pts = new Map(); let start = null, moved = false;
    svg.addEventListener('pointerdown', e => { pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); moved = false; start = { vb: Object.assign({}, vb), pts: new Map(pts) }; if (pts.size === 1 && e.pointerType === 'mouse') svg.setPointerCapture(e.pointerId); });
    svg.addEventListener('pointermove', e => {
      if (!pts.has(e.pointerId) || !start) return; pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const r = svg.getBoundingClientRect();
      if (pts.size === 1) { const a = [...start.pts.values()][0], b = pts.get(e.pointerId); if (!a) return; const dx = (b.x - a.x) / r.width * start.vb.w, dy = (b.y - a.y) / r.height * start.vb.h;
        if (Math.abs(b.x - a.x) + Math.abs(b.y - a.y) > 4) moved = true; if (!moved || start.vb.w >= W - 1) return; vb.x = start.vb.x - dx; vb.y = start.vb.y - dy; set(); e.preventDefault(); }
      else if (pts.size === 2 && start.pts.size === 2) { const [p1, p2] = [...pts.values()], [s1, s2] = [...start.pts.values()]; const d0 = Math.hypot(s1.x - s2.x, s1.y - s2.y), d1 = Math.hypot(p1.x - p2.x, p1.y - p2.y); if (!d0) return; moved = true;
        vb = Object.assign({}, start.vb); zoom(d1 / d0, (p1.x + p2.x) / 2, (p1.y + p2.y) / 2); e.preventDefault(); }
    });
    const end = e => { pts.delete(e.pointerId); if (!pts.size) start = null; else start = { vb: Object.assign({}, vb), pts: new Map(pts) }; };
    svg.addEventListener('pointerup', end); svg.addEventListener('pointercancel', end);
    svg.addEventListener('click', e => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
    svg.style.touchAction = 'pan-y';
    box.addEventListener('touchstart', e => { if (e.touches.length > 1 || box.classList.contains('zoomed')) svg.style.touchAction = 'none'; else svg.style.touchAction = 'pan-y'; }, { passive: true });
  });
}
new MutationObserver(() => enhanceMaps()).observe(document.documentElement, { childList: true, subtree: true });

/* ---------- mapa de Portugal: o pino passa para a frente ao passar por cima (ou pela vinheta da quinta)
   e, ao fim de um momento, aparece um cartão com a informação do agricultor ---------- */
let pinTipT = null;
function pinFront(pin) { if (pin && pin.parentNode && pin.parentNode.lastElementChild !== pin) pin.parentNode.appendChild(pin); }
function pinTip(pin) {
  hidePinTip(); const f = F(pin.dataset.pin); if (!f) return;
  const crops = ofFarmer(f.id).map(p => L(p.name)).slice(0, 4).join(', ');
  const tip = document.createElement('div'); tip.className = 'pin-tip'; tip.setAttribute('role', 'tooltip');
  tip.innerHTML = `<span class="pt-pic">${farmPic(f)}</span><div><b>${esc(f.name)}</b><span class="small">${esc(f.farm)}, ${esc(f.place)}</span><span class="small muted">${esc(regionName(f.region))}${f.since ? ` · ${T('desde', 'since')} ${f.since}` : ''}</span>${crops ? `<span class="small">${esc(crops)}</span>` : ''}<span class="link small">${T('Ver a quinta', 'See the farm')}</span></div>`;
  document.body.appendChild(tip);
  const r = pin.getBoundingClientRect(), tw = tip.offsetWidth, th = tip.offsetHeight;
  let x = r.left + r.width / 2 - tw / 2, y = r.top - th - 10; if (y < 8) y = r.bottom + 10; x = Math.max(8, Math.min(innerWidth - tw - 8, x));
  tip.style.left = `${x + scrollX}px`; tip.style.top = `${y + scrollY}px`; requestAnimationFrame(() => tip.classList.add('on'));
}
function hidePinTip() { clearTimeout(pinTipT); $$('.pin-tip').forEach(t => t.remove()); }
document.addEventListener('mouseover', e => {
  if (!['agricultores', 'agricultor', 'restaurantes'].includes(PAGE)) return;
  const pin = e.target.closest('svg.ptmap .pin');
  if (pin) { pinFront(pin); if (!pin.contains(e.relatedTarget)) { hidePinTip(); pinTipT = setTimeout(() => pinTip(pin), 650); } return; }
  const card = e.target.closest('[data-farmer]');
  if (card) { const p = $(`svg.ptmap [data-pin="${card.dataset.farmer}"]`); pinFront(p); }
  if (!e.target.closest('.pin-tip')) hidePinTip();
});
document.addEventListener('scroll', hidePinTip, { passive: true });

/* ---------- sininho (notificações e promoções) ---------- */
function bellButton() {
  const u = currentUser(); if (!u) return '';
  const n = unreadNotifs(u);
  return `<button class="icon-btn bell" data-bell aria-label="${T('Notificações', 'Notifications')}${n ? `, ${n} ${T('por ler', 'unread')}` : ''}" aria-expanded="false">${icon('bell', 22)}${n ? `<span class="count">${n > 9 ? '9+' : n}</span>` : ''}</button>`;
}
function notifRoute(n) { const r = String(n.route || '').replace(/^\//, ''); if (!r || r === 'notificacoes') return ''; if (/^produto\//.test(r)) return href('produtos/' + r.split('/')[1]); if (/^(encomenda|encomendas)/.test(r)) return href('conta', 'sec=encomendas'); return href(r.split('?')[0], r.split('?')[1] || ''); }
function promoCard(p, u, big) {
  const c = claimOf(u, p.id), ok = promoValid(p);
  return `<div class="promo-card${big ? ' big' : ''}${c ? ' claimed' : ''}"><span class="pc-ic">${icon(p.kind === 'portes' ? 'truck' : 'gift', big ? 30 : 22)}</span><div><b>${esc(L(p.title))}</b><span class="small">${esc(L(p.text))}</span>
    <span class="small muted">${promoLabel(p)}${p.min ? ` · ${T('mín.', 'min.')} ${money(p.min)}` : ''} · ${T('até', 'until')} ${fdate(parseISO(p.until))}</span></div>
    ${!ok ? `<span class="tag">${T('terminou', 'ended')}</span>` : c ? `<span class="tag ok">${c.used ? T('usada', 'used') : T('reclamada', 'claimed')}</span>` : `<button class="btn btn-green btn-sm" data-claim="${p.id}">${T('Reclamar', 'Claim')}</button>`}</div>`;
}
function notifListHTML(u) {
  const list = myNotifs(u), open = PROMOS.filter(p => p.public && promoValid(p) && !claimOf(u, p.id));
  return `${open.length ? `<div class="bell-promos">${open.map(p => promoCard(p, u)).join('')}</div>` : ''}
    <form class="code-row bell-code" data-code-form><label class="sr" for="bell-code">${T('Código promocional', 'Promo code')}</label><input id="bell-code" placeholder="${T('Tem um código promocional?', 'Got a promo code?')}" autocomplete="off"><button class="btn btn-line btn-sm c-campo" type="submit">${T('Usar', 'Use')}</button></form>
    ${list.length ? `<ul class="notif-list">${list.map(n => { const to = notifRoute(n), pr = n.promo ? PROMOS.find(p => p.id === n.promo) : null; return `<li class="${n.read ? '' : 'unread'}">${to ? `<a href="${to}">` : '<div>'}<b>${esc(L(n.title))}</b><span class="small">${esc(L(n.text))}</span><span class="small muted">${fdate(String(n.at).slice(0, 10) ? new Date(n.at) : today(), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>${to ? '</a>' : '</div>'}
      ${pr && promoValid(pr) && !claimOf(u, pr.id) ? `<button class="btn btn-green btn-sm" data-claim="${pr.id}">${T('Reclamar', 'Claim')}</button>` : ''}<button class="icon-btn" data-notif-del="${n.id}" aria-label="${T('Apagar notificação', 'Delete notification')}">${icon('close', 16)}</button></li>`; }).join('')}</ul>`
      : `<p class="muted small">${T('Sem notificações.', 'No notifications.')}</p>`}`;
}
function openBell(btn) {
  const u = currentUser(); if (!u) return;
  let p = $('#bell-panel'); if (p) { p.remove(); btn.setAttribute('aria-expanded', 'false'); return; }
  p = document.createElement('div'); p.id = 'bell-panel'; p.className = 'bell-panel'; p.setAttribute('role', 'dialog'); p.setAttribute('aria-label', T('Notificações', 'Notifications'));
  p.innerHTML = `<div class="row-between"><h2>${T('Notificações', 'Notifications')}</h2><button class="icon-btn" data-bell-close aria-label="${T('Fechar', 'Close')}">${icon('close', 20)}</button></div><div class="bell-body">${notifListHTML(u)}</div>`;
  document.body.appendChild(p); btn.setAttribute('aria-expanded', 'true');
  const r = btn.getBoundingClientRect(); p.style.top = `${r.bottom + scrollY + 8}px`; p.style.right = `${Math.max(8, innerWidth - r.right - 8)}px`;
  setTimeout(() => { readNotifs(u); refreshBell(); }, 1500);
}
function refreshBell() { const b = $('[data-bell]'); if (b) b.outerHTML = bellButton(); const body = $('#bell-panel .bell-body'), u = currentUser(); if (body && u) body.innerHTML = notifListHTML(u); }
document.addEventListener('click', e => { const p = $('#bell-panel'); if (p && !e.target.closest('#bell-panel') && !e.target.closest('[data-bell]')) p.remove(); });
PAGE_EVENTS.click.push((e, t, d) => {
  if ('bell' in d) { openBell(t); return true; }
  if ('bellClose' in d) { $('#bell-panel')?.remove(); return true; }
  if (d.claim) { t.disabled = true; if ('promoClose' in d) closeModal(); claimPromo(d.claim).then(() => { toast(T('Promoção reclamada: escolha-a ao finalizar a encomenda.', 'Promotion claimed: pick it at checkout.')); refreshBell(); if (PAGE_DOC === 'app' || PAGE === 'conta') rerenderKeep(); }, err => { t.disabled = false; toast(err.message); }); return true; }
  if (d.notifDel) { deleteNotif(d.notifDel); refreshBell(); if (PAGE_DOC === 'app') rerenderKeep(); return true; }
});
PAGE_EVENTS.submit.push((e, f) => {
  if (!f.matches('[data-code-form]')) return; e.preventDefault();
  const i = f.querySelector('input'), code = (i.value || '').trim(); if (!code) return true;
  claimPromo(null, code).then(() => { toast(T('Código aceite: a promoção está na sua conta.', 'Code accepted: the promotion is in your account.')); i.value = ''; refreshBell(); if (PAGE_DOC === 'app' || PAGE === 'conta') rerenderKeep(); }, err => toast(err.message));
  return true;
});

/* ---------- conta: Saldo Daqui, Cooperativa e promoções ---------- */
function accWalletSection(u) {
  if (u.role === 'admin') return '';
  const bal = balanceOf(u), movs = walletOf(u).slice(0, 8), mine = myPromos(u);
  const kindName = m => ({ carregamento: T('Carregamento', 'Top-up'), compra: T('Compra', 'Purchase'), quota: T('Quota da Cooperativa', 'Co-op fee'), reembolso: T('Reembolso', 'Refund'), promo: T('Promoção', 'Promotion') })[m.kind] || m.kind;
  return `<section class="acc-sec" id="carteira"><h2>${T('Saldo Daqui e Cooperativa', 'Daqui balance and Co-op')}</h2>
    <div class="wallet mt-s"><div class="wallet-card"><span class="lbl">${T('Saldo Daqui', 'Daqui balance')}</span><strong>${money(bal)}</strong><span class="small">${T('Use-o em qualquer compra, sozinho ou com outro método de pagamento.', 'Use it on any purchase, on its own or with another payment method.')}</span>
        <button class="btn btn-gold btn-sm" data-topup>${icon('plus', 16)} ${T('Carregar saldo', 'Top up')}</button></div>
      <div class="coop-card${isMember(u) ? ' on' : ''}"><span class="lbl">${T('Cooperativa Daqui', 'Daqui Co-op')}</span>${isMember(u)
        ? `<strong>${T('É membro', 'You are a member')}</strong><span class="small">${T('Até', 'Until')} ${fdate(parseISO(u.coopUntil), { day: 'numeric', month: 'long', year: 'numeric' })}. ${T('Portes grátis em todas as encomendas.', 'Free delivery on every order.')}</span><button class="btn btn-line btn-sm c-campo" data-coop-pay>${T('Renovar por mais um ano', 'Renew for another year')}</button>`
        : `<strong>${money(SETTINGS.coopFee)}/${T('ano', 'year')}</strong><span class="small">${T('Portes grátis, prioridade no Colhe Connosco e voto na assembleia.', 'Free delivery, Join the Harvest priority and a vote at the assembly.')}</span><a class="btn btn-green btn-sm" href="${href('cooperativa')}">${T('Junta-te à Cooperativa', 'Join the Co-op')}</a>`}</div></div>
    ${movs.length ? `<h3 class="mt">${T('Movimentos', 'Transactions')}</h3><ul class="mov-list">${movs.map(m => `<li><span>${kindName(m)}<br><span class="small muted">${esc(m.desc)} · ${fdate(new Date(m.at), { day: 'numeric', month: 'short', year: 'numeric' })}${m.method ? ` · ${esc(payName(m.method))}` : ''}</span></span><b class="${m.balance > 0 ? 'c-ok' : m.balance < 0 ? 'c-tomato' : ''}">${m.balance ? (m.balance > 0 ? '+' : '') + money(m.balance) : money(m.value)}</b></li>`).join('')}</ul>` : ''}
    <h3 class="mt">${T('As minhas promoções', 'My promotions')}</h3>
    ${mine.length ? `<div class="bell-promos">${mine.map(x => promoCard(x.p, u)).join('')}</div>` : `<p class="muted small">${T('Ainda não reclamou promoções. Veja o sininho ou use um código.', 'No promotions claimed yet. Check the bell or use a code.')}</p>`}
    <form class="code-row mt-s" data-code-form><label class="sr" for="acc-code">${T('Código promocional', 'Promo code')}</label><input id="acc-code" placeholder="${T('Código promocional', 'Promo code')}" autocomplete="off"><button class="btn btn-line btn-sm c-campo" type="submit">${T('Usar código', 'Use code')}</button></form></section>`;
}
function payModal(kind) {
  const u = currentUser(), bal = balanceOf(u), fee = +SETTINGS.coopFee;
  const methods = PAY_METHODS().concat(kind === 'coop' && bal >= fee ? [['saldo', `${T('Saldo Daqui', 'Daqui balance')} (${money(bal)})`]] : []);
  openModal(`<div class="mbody"><h2>${kind === 'coop' ? T('Quota anual da Cooperativa', 'Co-op yearly fee') : T('Carregar o Saldo Daqui', 'Top up your Daqui balance')}</h2>
    <form class="form mt-s" data-pay-form="${kind}" novalidate>
      ${kind === 'coop' ? `<p class="lead">${money(fee)} ${T('por um ano', 'for one year')}</p>` : `<div class="field"><span class="lbl">${T('Valor', 'Amount')}</span><div class="chips">${[10, 20, 50, 100].map(v => `<label class="chip"><input type="radio" name="tp-v" value="${v}"${v === 20 ? ' checked' : ''} class="sr">${money(v)}</label>`).join('')}</div>
        <label class="small mt-s" for="tp-other">${T('Outro valor (5 € a 500 €)', 'Other amount (€5 to €500)')}</label><input id="tp-other" type="number" min="5" max="500" step="1" inputmode="decimal"></div>`}
      <div class="field"><span class="lbl">${T('Pagar com', 'Pay with')}</span><div class="radios">${methods.map(([v, n], i) => `<label><input type="radio" name="tp-m" value="${v}"${i === 0 ? ' checked' : ''}>${n}</label>`).join('')}</div></div>
      <p class="err" hidden></p><button class="btn btn-green btn-block" type="submit">${kind === 'coop' ? T('Pagar a quota', 'Pay the fee') : T('Carregar', 'Top up')}</button>
      <p class="small muted mt-s ta-c">${T('Demonstração: não é feito nenhum pagamento.', 'Demo: no payment is taken.')}</p></form></div>`, kind === 'coop' ? T('Cooperativa', 'Co-op') : T('Carregar saldo', 'Top up'));
}
PAGE_EVENTS.click.push((e, t, d) => {
  if ('topup' in d) { if (!currentUser()) return loginPrompt(T('Entre na sua conta para carregar o Saldo Daqui.', 'Sign in to top up your Daqui balance.')) || true; payModal('topup'); return true; }
  if ('coopPay' in d) { if (!currentUser()) return loginPrompt(T('Entre ou crie conta para se juntar à Cooperativa.', 'Sign in or create an account to join the Co-op.')) || true; payModal('coop'); return true; }
});
PAGE_EVENTS.submit.push((e, f) => {
  if (!f.matches('[data-pay-form]')) return; e.preventDefault();
  const kind = f.dataset.payForm, m = (f.querySelector('[name="tp-m"]:checked') || {}).value, err = $('.err', f), btn = $('button[type="submit"]', f);
  const fail = msg => { err.hidden = false; err.textContent = msg; btn.disabled = false; };
  btn.disabled = true;
  if (kind === 'coop') { payCoop(m).then(() => { closeModal(); toast(T('Bem-vindo à Cooperativa Daqui!', 'Welcome to the Daqui Co-op!')); rerenderKeep(); }, x => fail(x.message)); return true; }
  const other = +($('#tp-other')?.value || 0), v = other || +((f.querySelector('[name="tp-v"]:checked') || {}).value || 0);
  topUp(v, m).then(() => { closeModal(); toast(T(`Saldo carregado: +${money(v)}`, `Balance topped up: +${money(v)}`)); rerenderKeep(); }, x => fail(x.message));
  return true;
});

/* ---------- conta: faturas ---------- */
function accInvoicesSection(u) {
  if (u.role === 'admin') return '';
  const list = invoicesOf(u);
  const ic = k => ({ order: 'box', colhe: 'sprout', quota: 'users', topup: 'wallet', box: 'repeat' })[k] || 'receipt';
  return `<section class="acc-sec" id="faturas"><h2>${T('Faturas e recibos', 'Invoices and receipts')}</h2>
    <p class="muted mt-s">${T('Encomendas, caixas da subscrição, colheitas do Colhe Connosco, quota da Cooperativa e carregamentos do saldo. Pode ver e descarregar cada documento em PDF.', 'Orders, subscription boxes, Join the Harvest picks, Co-op fee and balance top-ups. You can view and download each document as a PDF.')}</p>
    ${list.length ? `<ul class="inv-list mt-s">${list.slice(0, 40).map(x => `<li><span class="inv-ic">${icon(ic(x.kind), 20)}</span><span><b>${esc(x.title)}</b><br><span class="small muted">${fdate(String(x.at).length > 10 ? new Date(x.at) : parseISO(x.at), { day: 'numeric', month: 'short', year: 'numeric' })}</span></span><b>${money(x.total)}</b>
      <span class="row-gap"><button class="btn btn-line btn-sm c-campo" data-invoice="${esc(x.key)}">${T('Ver', 'View')}</button><button class="btn btn-ghost btn-sm" data-invoice-pdf="${esc(x.key)}" aria-label="${T('Descarregar PDF', 'Download PDF')}">${icon('download', 16)} PDF</button></span></li>`).join('')}</ul>`
      : `<p class="muted small mt-s">${T('Ainda não tem documentos.', 'No documents yet.')}</p>`}</section>`;
}

/* ---------- conta: e-mail, telemóvel e dados de faturação (NIF) ---------- */
function contactForm(u) {
  const b = u.billing || {};
  return `<form class="form mt" data-contact-form novalidate><h3>${T('Contactos e faturação', 'Contacts and billing')}</h3>
    <div class="row"><div class="field"><label for="cf-email">${T('E-mail', 'Email')}</label><input id="cf-email" type="email" value="${esc(u.email || '')}" autocomplete="email"></div>
      <div class="field"><label for="cf-phone">${T('Telemóvel', 'Mobile')}</label><input id="cf-phone" type="tel" value="${esc(u.phone || '')}" required autocomplete="tel"></div></div>
    <div class="row"><div class="field"><label for="cf-nif">${T('NIF (para as faturas)', 'Tax number (for invoices)')}</label><input id="cf-nif" value="${esc(u.nif || '')}" inputmode="numeric" maxlength="11" placeholder="${T('Opcional', 'Optional')}"></div>
      <div class="field"><label for="cf-bname">${T('Nome na fatura', 'Name on invoice')}</label><input id="cf-bname" value="${esc(b.name || '')}" placeholder="${esc(u.name)}"></div></div>
    <div class="field"><label for="cf-baddr">${T('Morada de faturação', 'Billing address')}</label><input id="cf-baddr" value="${esc(b.address || '')}" placeholder="${T('Se for diferente da morada de entrega', 'If different from the delivery address')}"></div>
    <div class="row"><div class="field"><label for="cf-bpostal">${T('Código postal', 'Postcode')}</label><input id="cf-bpostal" value="${esc(b.postal || '')}" placeholder="3810-000"></div><div class="field"><label for="cf-btown">${T('Localidade', 'Town')}</label><input id="cf-btown" value="${esc(b.town || '')}"></div></div>
    <p class="err" hidden></p><button class="btn btn-green btn-sm" type="submit">${T('Guardar contactos', 'Save contacts')}</button></form>`;
}
/* NIF português: 9 algarismos com dígito de controlo */
function validNIF(n) { n = String(n).replace(/\D/g, ''); if (!/^[1235689]\d{8}$/.test(n) && !/^(45|70|71|72|74|75|77|79|90|91|98|99)\d{7}$/.test(n)) return false; let s = 0; for (let i = 0; i < 8; i++) s += +n[i] * (9 - i); const c = 11 - (s % 11); return (c >= 10 ? 0 : c) === +n[8]; }
PAGE_EVENTS.submit.push((e, f) => {
  if (!f.matches('[data-contact-form]')) return; e.preventDefault(); if (!validate(f)) return true;
  const u = currentUser(), err = $('.err', f), fail = m => { err.hidden = false; err.textContent = m; return true; };
  const email = $('#cf-email').value.trim().toLowerCase(), phone = normPhone($('#cf-phone').value), nif = $('#cf-nif').value.replace(/\D/g, '');
  if (email && !validEmail(email)) return fail(T('O e-mail não parece válido.', 'That email does not look valid.'));
  if (!/^[29]\d{8}$/.test(phone)) return fail(T('Indique um telemóvel português com 9 dígitos.', 'Enter a 9-digit Portuguese mobile number.'));
  if (nif && !validNIF(nif)) return fail(T('O NIF não é válido (confira os 9 algarismos).', 'The tax number is not valid (check the 9 digits).'));
  if (Object.values(USERS).some(x => x !== u && ((email && x.email === email) || x.phone === phone))) return fail(T('Esse e-mail ou telemóvel já pertence a outra conta.', 'That email or mobile already belongs to another account.'));
  const emailChanged = email !== (u.email || '');
  u.phone = phone; u.nif = nif; u.billing = { name: $('#cf-bname').value.trim(), address: $('#cf-baddr').value.trim(), postal: $('#cf-bpostal').value.trim(), town: $('#cf-btown').value.trim() };
  if (!u.billing.name && !u.billing.address) u.billing = null;
  const finish = msg => { saveUsers(); toast(msg); rerenderKeep(); };
  if (emailChanged && NUVEM.on && email) { const btn = $('button[type="submit"]', f); btn.disabled = true;
    NUVEM.changeEmail(email).then(() => { u.email = email; finish(T('Contactos guardados. Confirme o novo e-mail na mensagem que lhe enviámos.', 'Contacts saved. Confirm the new email from the message we sent you.')); }, x => { btn.disabled = false; fail(T('Não foi possível mudar o e-mail: ', 'Could not change the email: ') + x.message); });
    return true; }
  u.email = email; finish(T('Contactos guardados', 'Contacts saved')); return true;
});

/* ---------- avaliações de produtos e caixas ---------- */
function reviewsSection(p, app) {
  const list = reviewsOf(p.id), u = currentUser(), avg = reviewAvg(p.id), mine = u && myReview(u, p.id), can = u && !mine && boughtAndReceived(u, p.id) && u.role !== 'admin';
  return `<section class="${app ? 'a-sec' : 'sec-tight'}" id="avaliacoes"><div class="${app ? '' : 'wrap'}">
    <div class="row-between"><h2>${T('Avaliações', 'Reviews')}</h2>${list.length ? `<span>${stars(Math.round(avg))} <b>${numFmt(round2(avg))}</b> <span class="small muted">(${list.length})</span></span>` : ''}</div>
    ${can ? `<form class="form panel mt-s" data-review-form="${p.id}" novalidate><p class="lbl">${T('Já recebeu este produto. O que achou?', 'You have received this product. What did you think?')}</p>
      <div class="star-pick" role="radiogroup" aria-label="${T('Estrelas', 'Stars')}">${[1, 2, 3, 4, 5].map(n => `<label><input type="radio" name="rv-s" value="${n}" class="sr"${n === 5 ? ' checked' : ''}><span aria-hidden="true">★</span><span class="sr">${n}</span></label>`).join('')}</div>
      <div class="field"><label for="rv-c">${T('Comentário (opcional)', 'Comment (optional)')}</label><textarea id="rv-c" rows="3" maxlength="600"></textarea></div>
      <p class="small muted">${T('A avaliação só se envia uma vez. Aparece com o seu primeiro nome.', 'The review is sent only once. It shows with your first name.')}</p>
      <button class="btn btn-green btn-sm" type="submit">${T('Enviar avaliação', 'Send review')}</button></form>`
      : !u ? `<p class="small muted mt-s">${T('Só quem comprou e recebeu o produto pode avaliar.', 'Only people who bought and received the product can review it.')}</p>` : ''}
    ${list.length ? `<ul class="reviews mt-s">${list.map(r => `<li><div class="row-between"><b>${esc(r.name || T('Cliente', 'Customer'))}</b>${stars(r.stars)}</div>${r.comment ? `<p>${esc(r.comment)}</p>` : ''}<span class="small muted">${fdate(new Date(r.at), { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        ${r.reply ? `<div class="reply"><b>${T('Resposta da Daqui', 'Reply from Daqui')}</b><p>${esc(r.reply.text)}</p></div>` : ''}
        ${u && u.role === 'admin' ? `<form class="reply-form" data-review-reply="${r.id}"><label class="sr" for="rr-${r.id}">${T('Responder', 'Reply')}</label><textarea id="rr-${r.id}" rows="2" placeholder="${T('Responder em nome da Daqui', 'Reply on behalf of Daqui')}">${r.reply ? esc(r.reply.text) : ''}</textarea><button class="btn btn-line btn-sm c-campo" type="submit">${r.reply ? T('Atualizar resposta', 'Update reply') : T('Responder', 'Reply')}</button></form>` : ''}</li>`).join('')}</ul>`
      : `<p class="muted small mt-s">${T('Ainda não há avaliações.', 'No reviews yet.')}</p>`}</div></section>`;
}
/* depois de receber uma encomenda: convite para avaliar cada produto */
function reviewPrompts(u, o) {
  if (orderStage(o) < 3 || o.status === 'cancelada') return '';
  const todo = [...new Set(o.items.map(i => i.id))].map(P).filter(p => p && !myReview(u, p.id));
  return todo.length ? `<p class="small oc-rev">${icon('star', 14)} ${T('Avaliar', 'Review')}: ${todo.slice(0, 4).map(p => `<a class="link" href="${productHref(p)}#avaliacoes">${esc(L(p.name))}</a>`).join(', ')}</p>` : '';
}
PAGE_EVENTS.submit.push((e, f) => {
  if (f.matches('[data-review-form]')) { e.preventDefault(); const s = +(f.querySelector('[name="rv-s"]:checked') || {}).value || 5;
    addReview(f.dataset.reviewForm, s, $('#rv-c', f).value || ''); toast(T('Obrigado pela avaliação!', 'Thanks for your review!')); rerenderKeep(); return true; }
  if (f.matches('[data-review-reply]')) { e.preventDefault(); replyReview(f.dataset.reviewReply, f.querySelector('textarea').value || ''); toast(T('Resposta guardada', 'Reply saved')); rerenderKeep(); return true; }
});

/* ---------- Junta-te à Cooperativa ---------- */
const COOP_PERKS = () => [['truck', T('Portes grátis', 'Free delivery'), T('Em todas as encomendas e entregas de subscrição, em casa ou no ponto de recolha.', 'On every order and subscription delivery, at home or at the pick-up point.')],
  ['sprout', T('Prioridade no Colhe Connosco', 'Join the Harvest priority'), T('Os membros sabem primeiro das datas novas.', 'Members hear about new dates first.')],
  ['users', T('Voto na assembleia anual', 'A vote at the yearly assembly'), T('A Cooperativa decide em conjunto preços justos, novos produtores e novos pontos de recolha.', 'The Co-op decides together on fair prices, new growers and new pick-up points.')],
  ['gift', T('Promoções só para membros', 'Members-only promotions'), T('Recebe no sininho promoções e provas de produtos novos.', 'Get promotions and tastings of new products in your bell.')]];
function coopBand() {
  const u = currentUser();
  return `<section class="sec sec-gold"><div class="wrap join">
    <div><h2 class="c-campo">${T('Junta-te à Cooperativa', 'Join the Co-op')}</h2>
      <p class="lead c-folha mt-s">${T(`A Daqui é uma cooperativa: quem compra e quem produz decide em conjunto. A quota é de ${money(SETTINGS.coopFee)} por ano e dá portes grátis em todas as encomendas.`, `Daqui is a co-operative: the people who buy and the people who grow decide together. The fee is ${money(SETTINGS.coopFee)} a year and gives you free delivery on every order.`)}</p>
      <a class="link mt-s" href="${href('cooperativa')}">${T('Saber mais sobre a Cooperativa', 'More about the Co-op')}</a></div>
    <div class="panel coop-perks"><ul class="checks">${COOP_PERKS().map(([ic, h]) => `<li>${icon(ic, 18)}<span>${h}</span></li>`).join('')}</ul>
      ${u && isMember(u) ? `<p class="note done small">${icon('check', 18)}<span>${T('Já é membro até', 'You are a member until')} ${fdate(parseISO(u.coopUntil))}.</span></p>` : `<button class="btn btn-green btn-block mt-s" data-coop-pay>${T(`Juntar-me por ${money(SETTINGS.coopFee)}/ano`, `Join for ${money(SETTINGS.coopFee)}/year`)}</button>`}</div>
  </div></section>`;
}
PAGES.cooperativa = () => {
  const u = currentUser();
  const html = `${crumbs([[T('Cooperativa', 'Co-op'), 'cooperativa']])}
  <section class="sec-green on-dark"><div class="wrap seal-hero"><div><h1 class="c-pera">${T('Junta-te à Cooperativa Daqui', 'Join the Daqui Co-op')}</h1>
    <p class="lead mt">${T('Uma loja de quem compra e de quem produz. Os membros pagam uma quota anual, não pagam portes e têm voz nas decisões da Daqui.', 'A shop owned by the people who buy and the people who grow. Members pay a yearly fee, get free delivery and have a say in Daqui\'s decisions.')}</p>
    <div class="row-btns mt">${u && isMember(u) ? `<span class="tag ok">${T('Membro até', 'Member until')} ${fdate(parseISO(u.coopUntil))}</span><button class="btn btn-gold" data-coop-pay>${T('Renovar', 'Renew')}</button>` : `<button class="btn btn-gold" data-coop-pay>${T(`Juntar-me por ${money(SETTINGS.coopFee)}/ano`, `Join for ${money(SETTINGS.coopFee)}/year`)}</button>`}</div></div>
    ${sealSVG('hero', lang)}</div></section>
  <section class="sec"><div class="wrap"><h2 class="mb">${T('O que ganha', 'What you get')}</h2><div class="feat">${COOP_PERKS().map(([ic, h, p]) => `<div>${icon(ic, 32)}<h3>${h}</h3><p>${p}</p></div>`).join('')}</div>
    <div class="two mt-l"><div><h2>${T('Como funciona a quota', 'How the fee works')}</h2>
      <ul class="checks mt-s"><li>${icon('calendar', 18)}<span>${T(`${money(SETTINGS.coopFee)} por ano, a contar do dia em que paga.`, `${money(SETTINGS.coopFee)} a year, counted from the day you pay.`)}</span></li><li>${icon('receipt', 18)}<span>${T('A fatura fica na sua conta, em "Faturas".', 'The invoice is in your account, under "Invoices".')}</span></li><li>${icon('wallet', 18)}<span>${T('Pode pagar com MB WAY, Multibanco, cartão ou com o Saldo Daqui.', 'Pay with MB WAY, Multibanco, card or your Daqui balance.')}</span></li><li>${icon('repeat', 18)}<span>${T('Não renova sozinha: avisamos antes de terminar.', 'It does not renew on its own: we remind you before it ends.')}</span></li></ul></div>
      <div class="panel"><h3>${T('Saldo Daqui', 'Daqui balance')}</h3><p class="mt-s">${T('Carregue a conta com antecedência e pague as encomendas com o saldo, sozinho ou com outro método para o resto.', 'Top up your account in advance and pay for orders with your balance, on its own or with another method for the rest.')}</p><button class="btn btn-line c-campo mt-s" data-topup>${icon('wallet', 18)} ${T('Carregar saldo', 'Top up')}</button></div></div>
  </div></section><div class="spacer"></div>`;
  return { title: T('Cooperativa Daqui', 'Daqui Co-op'), html };
};
