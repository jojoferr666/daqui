/* ===== Daqui — app para telemóvel (web app em /app e app Android) =====
   Usa os mesmos dados e funções do site (data.js, nuvem.js, auth.js, app.js e as páginas) com outro aspeto:
   uma página única com ecrãs (#/inicio, #/loja, #/produto/kiwi…), barra de separadores em baixo e o cabaz num botão.

   Como está organizada
   - href() passa a devolver endereços da app (#/…): os links das páginas do site levam aos ecrãs certos.
   - render() passa a ser appRender(): desenha o ecrã do endereço atual.
   - Ecrãs próprios da app: boas-vindas, início, loja, produto, mapa, conta, encomenda (com "deslizar para confirmar"),
     incidência (com câmara) e os separadores de agricultor, restaurante e gestão.
   - Ecrãs que reaproveitam páginas do site (com o aspeto da app): entrar, finalizar, subscrever, caixas, Colhe Connosco,
     agricultor, sobre, FAQ, políticas, contacto, secções da conta, área de parceiro e painel de gestão. */

const INTRO_KEY = 'daqui-app-boas-vindas';
const PICKUP_COORDS = { 'Armazém Daqui, Vagos': [40.5545, -8.6826], 'Aveiro, Rossio': [40.6424, -8.6553], 'Ílhavo': [40.6003, -8.6667], 'Oliveira do Bairro': [40.5146, -8.4937], 'Mira': [40.4286, -8.7373], 'Águeda': [40.5747, -8.4448] };
const AVEIRO = { lat: 40.6405, lon: -8.6538 };
let appPos = store.get('daqui-app-posicao', null);   // { lat, lon } da última vez que deu a localização
let cfgFor = '', lojaCat = 'tudo', lojaQ = '', mapaV = 'recolha', introStep = 0, detQty = 1, detSize = '', detBio = null, detFor = '', incPhoto = null, incPhotoUrl = '';

/* ---------- endereços: caminhos do site → ecrãs da app ---------- */
href = function (path = '', query = '') {
  const qs = new URLSearchParams(query), parts = String(path).split('/').filter(Boolean), [a, b] = parts;
  let r;
  if (!a) r = 'inicio';
  else if (a === 'produtos') { const id = b || qs.get('id'); qs.delete('id'); r = id ? 'produto/' + id : 'loja'; }
  else if (a === 'subscricao') r = b ? 'subscrever/' + b : 'caixas';
  else if (a === 'agricultores') { const id = b || qs.get('id'); qs.delete('id'); if (id) r = 'agricultor/' + id; else { r = 'mapa'; qs.set('v', 'quintas'); } }
  else if (a === 'restaurantes') { r = 'mapa'; qs.set('v', 'restaurantes'); }
  else if (a === 'restaurante') { const id = qs.get('id'); qs.delete('id'); r = id ? 'restaurante/' + id : 'mapa'; if (!id) qs.set('v', 'restaurantes'); }
  else if (a === 'cooperativa') r = 'cooperativa';
  else if (a === 'colhe-connosco') r = 'colhe';
  else if (a === 'conta') { if (qs.get('tab') && roleOf() === 'admin') { r = 'g/' + qs.get('tab'); qs.delete('tab'); } else { const s = qs.get('sec'); qs.delete('sec'); r = s ? 'conta/' + s : 'conta'; } }
  else if (a === 'parceiro') r = roleHome();
  else if (a === 'finalizar') { const n = qs.get('encomenda'); if (n) { qs.delete('encomenda'); qs.set('nova', '1'); r = 'encomenda/' + n; } else r = 'finalizar'; }
  else if (a === 'contacto' && qs.get('encomenda')) { r = 'encomenda/' + qs.get('encomenda'); qs.delete('encomenda'); }
  else if (a === 'entrar') r = 'entrar';
  else r = 'info/' + a;
  const s = qs.toString();
  return '#/' + r + (s ? '?' + s : '');
};
const appHash = () => { const h = location.hash.replace(/^#\/?/, ''), i = h.indexOf('?'); return { path: i < 0 ? h : h.slice(0, i), query: new URLSearchParams(i < 0 ? '' : h.slice(i + 1)) }; };
const roleOf = (u = currentUser()) => (!u ? 'cliente' : u.role === 'admin' ? 'admin' : u.partner && u.role === 'agricultor' ? 'agricultor' : u.partner && u.role === 'restaurante' ? 'restaurante' : 'cliente');
const roleHome = (u = currentUser()) => ({ cliente: 'inicio', agricultor: 'p/produtos', restaurante: 'r/perfil', admin: 'g/pedidos' }[roleOf(u)]);
const TABS = () => ({
  cliente: [['inicio', 'home', T('Início', 'Home')], ['loja', 'basket', T('Loja', 'Shop')], ['mapa', 'map', T('Mapa', 'Map')], ['conta', 'user', T('Conta', 'Account')]],
  agricultor: [['p/produtos', 'leaf', T('Produtos', 'Produce')], ['p/entregas', 'truck', T('Entregas', 'Supplies')], ['p/colhe', 'sprout', T('Colhe', 'Harvest')], ['p/conta', 'user', T('Conta', 'Account')]],
  restaurante: [['r/perfil', 'utensils', T('Perfil', 'Profile')], ['r/pratos', 'list', T('Pratos', 'Dishes')], ['loja', 'basket', T('Loja', 'Shop')], ['r/conta', 'user', T('Conta', 'Account')]],
  admin: [['g/pedidos', 'inbox', T('Pedidos', 'Requests')], ['g/encomendas', 'box', T('Encomendas', 'Orders')], ['g/catalogo', 'leaf', T('Catálogo', 'Catalogue')], ['g/mais', 'menu', T('Mais', 'More')]]
});
function activeTab(path, role) {
  const tabs = TABS()[role].map(t => t[0]), first = path.split('/')[0];
  if (tabs.includes(path)) return path;
  if (/^(produto|caixas|subscrever|finalizar)/.test(path)) return tabs.includes('loja') ? 'loja' : '';
  if (/^(agricultor|colhe)/.test(path) && role === 'cliente') return path.startsWith('colhe') ? 'inicio' : 'mapa';
  if (first === 'g') return 'g/mais';
  return tabs.find(t => t.endsWith('conta')) || '';
}
/* histórico dentro da app: para o botão "voltar" (da app e do Android) */
const appStack = [location.hash];
let appReplacing = false;
const appReplace = h => { appReplacing = true; location.replace(h); };
const isTabRoot = () => { const p = appHash().path; return Object.values(TABS()).some(l => l.some(t => t[0] === p)); };
const appCanGoBack = () => appStack.length > 1 && !isTabRoot();
/* devolve false quando já está no início do seu tipo de conta (o Android fecha então a app) */
function appBack() {
  if (appCanGoBack()) { history.back(); return true; }
  const home = '#/' + roleHome(); if (location.hash !== home) { location.hash = home; return true; }
  return false;
}

/* ---------- utilitários ---------- */
function distKm(a, b) { const R = 6371, r = x => x * Math.PI / 180, dLa = r(b.lat - a.lat), dLo = r(b.lon - a.lon); const h = Math.sin(dLa / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dLo / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); }
const fmtKm = km => (km < 1 ? `${Math.round(km * 1000)} m` : `${km < 10 ? km.toFixed(1).replace('.', lang === 'en' ? '.' : ',') : Math.round(km)} km`);
const here = () => appPos || AVEIRO;
function pickupList() { return PICKUP_POINTS.map(n => { const c = PICKUP_COORDS[n] || [AVEIRO.lat, AVEIRO.lon]; return { name: n, lat: c[0], lon: c[1], km: distKm(here(), { lat: c[0], lon: c[1] }) }; }).sort((a, b) => a.km - b.km); }
function restList() { return RESTAURANTS.map(r => Object.assign({ km: distKm(here(), r) }, r)).sort((a, b) => a.km - b.km); }
function farmList() { return FARMERS.map(f => Object.assign({ km: distKm(here(), f) }, f)).sort((a, b) => a.km - b.km); }
function askPosition() {
  NATIVO.position().then(p => { appPos = p; store.set('daqui-app-posicao', p); toast(T('Localização atualizada', 'Location updated')); rerenderKeep(); },
    () => toast(T('Sem acesso à localização: usamos o centro de Aveiro.', 'No location access: using Aveiro city centre.')));
}
const greeting = () => { const h = new Date().getHours(); return h < 13 ? T('Bom dia', 'Good morning') : h < 20 ? T('Boa tarde', 'Good afternoon') : T('Boa noite', 'Good evening'); };
const myOrders = u => ORDERS.filter(o => (u ? o.user === u.username : !o.user)).sort((a, b) => String(b.created).localeCompare(String(a.created)));
const pickupHours = day => (DISTRIBUTION.days[day] || {}).pickup || '';
const canSwipe = o => o.deliver === 'pickup' && o.status !== 'cancelada' && orderStage(o) === 3;
const sec = (title, body, extra = '') => `<section class="a-sec"><div class="a-sec-h"><h2>${title}</h2>${extra}</div>${body}</section>`;

/* ---------- cartões ---------- */
function prodCard(p) {
  const on = inSeason(p), box = p.cat === 'caixas', f = p.farmer ? F(p.farmer) : null;
  const action = box ? `<a class="a-add" href="${productHref(p)}" aria-label="${T('Escolher tamanho', 'Choose size')}: ${esc(L(p.name))}">${icon('chevR', 20)}</a>`
    : available(p) ? `<button class="a-add" data-add="${p.id}" aria-label="${T('Adicionar ao cabaz', 'Add to basket')}: ${esc(L(p.name))}">${icon('plus', 20)}</button>`
    : `<button class="a-add off" data-notify="${p.id}" aria-pressed="${notifyOn(p.id)}" aria-label="${T('Avisar-me', 'Notify me')}: ${esc(L(p.name))}">${icon('bell', 18)}</button>`;
  const more = offersOf(p).map(o => o.farmer).filter((x, i, a) => a.indexOf(x) === i).length - 1;
  return `<article class="a-card${on && !soldOut(p) ? '' : ' is-off'}">
    <a class="a-card-img${box ? ' box' : ''}" href="${productHref(p)}">${artFor(p)}${!on ? `<span class="a-flag">${T('Volta em', 'Back in')} ${monthName(p.season[0], 'short')}</span>` : soldOut(p) ? `<span class="a-flag">${T('Esgotado', 'Sold out')}</span>` : hasBio(p) ? `<span class="a-flag bio">${hasConv(p) ? T('Também bio', 'Organic too') : T('Bio', 'Organic')}</span>` : ''}</a>
    ${favBtn(p.id)}
    <a class="a-card-body" href="${productHref(p)}"><b>${esc(L(p.name))}</b><span class="muted">${box ? `${p.kg} kg, ${T('vários agricultores', 'several farmers')}` : f ? esc(f.place) + (more > 0 ? ` ${T(`e mais ${more}`, `+${more}`)}` : '') : ''}</span>
      <span class="a-price">${box ? T('desde', 'from') + ' ' : ''}${money(shownPrice(p))}<small>${box ? '' : unitLabel(p.unit)}</small></span></a>${action}</article>`;
}
function boxCard(b) {
  const next = slotOptions()[0];
  return `<a class="a-box" href="${productHref(b)}"><span class="a-box-art">${boxArt(b)}</span>
    <span class="a-box-body"><b>${esc(L(b.name))}</b><span class="muted small">${esc(L(b.desc)).slice(0, 90)}${L(b.desc).length > 90 ? '…' : ''}</span>
    <span class="a-box-foot"><span class="a-price">${T('desde', 'from')} ${money(b.price)}</span>${next ? `<span class="a-chip">${icon('calendar', 14)}${slotLabel(next.date)}</span>` : ''}</span></span></a>`;
}
function orderMini(o) {
  const st = orderStage(o);
  return `<a class="a-order" href="#/encomenda/${o.num}"><span class="a-order-ic">${icon(o.deliver === 'home' ? 'truck' : 'store', 22)}</span>
    <span><b>${o.num}</b><span class="muted small">${slotLabel(o.slot)}${o.deliver === 'pickup' ? `, ${esc(o.point)}` : ''}</span></span>
    <span class="status ${stageCls(st)}">${stageName(o)}</span></a>`;
}
function stepsBar(o) { const st = orderStage(o); if (st === STAGE_CANCEL) return ''; return `<div class="a-steps" aria-hidden="true">${[0, 1, 2, 3, 4].map(i => `<i class="${i <= st ? 'on' : ''}"></i>`).join('')}</div>`; }

/* ---------- ecrãs próprios da app ---------- */
function scrIntro() {
  const slides = [
    { art: farmSVG(0, 'pera'), t: T('Do campo para sua casa', 'From the field to your home'), p: T('Fruta e legumes de agricultores portugueses, colhidos na época e entregues em poucos dias.', 'Fruit and veg from Portuguese farmers, picked in season and delivered within days.') },
    { art: `<div class="a-intro-split">${splitBar({ cat: 'fruta', split: [60, 10, 30] }, false)}<p><b>60%</b> ${T('do preço fica com quem produz', 'of the price goes to the grower')}</p></div>`, t: T('Preço justo, à vista', 'A fair price, in the open'), p: T('Em cada produto vê quanto fica com o agricultor, com a conservação e com a Daqui.', 'On every product you see how much goes to the farmer, to storage and to Daqui.') },
    { art: crateSVG('mista'), t: T('Caixas da Estação', 'Seasonal Boxes'), p: T('Escolha os favoritos e o que não quer receber. Levante num ponto perto de si ou receba em casa.', 'Pick your favourites and what you\'d rather not get. Collect nearby or get it delivered.') }
  ];
  if (introStep === 0) return { title: 'Daqui', bare: true, html: `<div class="a-intro a-intro-lang"><img class="a-intro-logo" src="${LOGO_GOLD}" alt="Daqui">
    <h1>Olá! / Hello!</h1><p>Escolha a língua / Choose your language</p>
    <div class="a-intro-langs"><button class="a-big-btn" data-intro-lang="pt" lang="pt">Português</button><button class="a-big-btn" data-intro-lang="en" lang="en">English</button></div></div>` };
  const s = slides[introStep - 1], last = introStep === slides.length;
  return { title: 'Daqui', bare: true, html: `<div class="a-intro"><button class="a-intro-skip link" data-intro-end>${T('Saltar', 'Skip')}</button>
    <div class="a-intro-art">${s.art}</div><h1>${s.t}</h1><p>${s.p}</p>
    <div class="a-dots" aria-hidden="true">${slides.map((x, i) => `<i class="${i === introStep - 1 ? 'on' : ''}"></i>`).join('')}</div>
    ${last ? `<button class="a-big-btn" data-intro-end>${T('Começar a explorar', 'Start exploring')}</button><button class="a-big-btn ghost" data-intro-end="entrar">${T('Já tenho conta', 'I have an account')}</button>`
      : `<button class="a-big-btn" data-intro-next>${T('Seguinte', 'Next')}</button>`}</div>` };
}

/* pontos por baixo do cartão deslizante do início (encomenda e subscrições) */
function nextRailDots() {
  const r = $('[data-next-rail]'); if (!r) return;
  const dots = $$('.a-next-dots i'), upd = () => { const i = Math.round(r.scrollLeft / Math.max(1, r.firstElementChild.offsetWidth + 12)); dots.forEach((d, k) => d.classList.toggle('on', k === Math.min(i, dots.length - 1))); };
  r.addEventListener('scroll', upd, { passive: true }); upd();
}
function scrInicio(u) {
  const orders = myOrders(u).filter(o => orderStage(o) < STAGE_DONE), next = orders.sort((a, b) => a.slot.localeCompare(b.slot))[0];
  /* todas as subscrições (ativas e em pausa): desliza-se entre elas no cartão do topo */
  const subs = u ? (u.subs || []).filter(s => s.status === 'ativa' || s.status === 'pausada').sort((a, b) => (a.status === 'ativa' ? 0 : 1) - (b.status === 'ativa' ? 0 : 1)) : [];
  const days = next ? Math.max(0, Math.round((parseISO(next.slot) - today()) / 864e5)) : null;
  const cards = [];
  if (next) cards.push(`<a class="a-next" href="#/encomenda/${next.num}">
      <span class="a-next-top"><span class="muted small">${T('Próxima entrega', 'Next delivery')}</span><span class="status prog">${stageName(next)}</span></span>
      <b class="a-next-day">${days === 0 ? T('Hoje', 'Today') : days === 1 ? T('Amanhã', 'Tomorrow') : T(`Daqui a ${days} dias`, `In ${days} days`)}, ${slotLabel(next.slot)}</b>
      <span class="small">${next.num}, ${next.deliver === 'pickup' ? `${T('levantamento em', 'collect at')} ${esc(next.point)} (${pickupHours(next.day)})` : `${T('entrega em casa', 'home delivery')}${next.window ? ', ' + next.window : ''}`}</span>
      ${stepsBar(next)}${canSwipe(next) ? `<span class="a-next-cta">${T('Já está pronta: deslize para confirmar no ponto de recolha', 'Ready now: swipe to confirm at the collection point')} ${icon('chevR', 16)}</span>` : ''}</a>`);
  subs.forEach((s, i) => { const on = s.status === 'ativa', b = P(s.box);
    cards.push(`<a class="a-next${on ? '' : ' paused'}" href="#/conta/subscricoes">
      <span class="a-next-top"><span class="muted small">${subs.length > 1 ? T(`A sua subscrição ${i + 1} de ${subs.length}`, `Your subscription ${i + 1} of ${subs.length}`) : T('A sua subscrição', 'Your subscription')}</span><span class="status ${on ? 'ativa' : 'pausada'}">${on ? T('Ativa', 'Active') : T('Em pausa', 'On hold')}</span></span>
      <b class="a-next-day">${esc(b ? L(b.name) : s.box)}${s.size ? `, ${sizeName(s.size)}` : ''}</b>
      <span class="small">${on ? `${T('Próxima entrega', 'Next delivery')}: ${slotLabel(nextDelivery(s))}` : T('Em pausa. Toque para retomar quando quiser.', 'On hold. Tap to resume whenever you like.')}</span>
      <span class="small muted">${freqName(s.freq)}, ${dayName(s.day).toLowerCase()} · ${s.deliver === 'pickup' ? esc(s.point) : T('entrega em casa', 'home delivery')}</span></a>`); });
  if (!cards.length) cards.push(`<div class="a-next empty"><b class="a-next-day">${T('A primeira caixa é a mais fácil', 'Your first box is the easiest')}</b><span class="small">${T('Escolha uma Caixa da Estação e levante-a num ponto perto de si.', 'Pick a Seasonal Box and collect it near you.')}</span><a class="btn btn-green btn-sm mt-s" href="#/caixas">${T('Ver caixas', 'See boxes')}</a></div>`);
  const nextCard = cards.length > 1 ? `<div class="a-next-rail" data-next-rail aria-label="${T('Próxima entrega e subscrições: deslize para ver mais', 'Next delivery and subscriptions: swipe to see more')}" tabindex="0">${cards.join('')}</div>
      <div class="a-dots a-next-dots" aria-hidden="true">${cards.map((x, i) => `<i class="${i === 0 ? 'on' : ''}"></i>`).join('')}</div>` : cards[0];
  const boxes = PRODUCTS.filter(p => p.cat === 'caixas');
  const near = pickupList().slice(0, 2), rests = restList().slice(0, 2);
  const favs = u ? (u.favs || []).map(P).filter(p => p && available(p)) : [];
  const season = favs.length ? favs : PRODUCTS.filter(p => p.cat !== 'caixas' && p.essential && available(p)).slice(0, 8);
  return { title: T('Início', 'Home'), hero: true, html: `
    <header class="a-hero"><div class="a-hero-in"><img src="${LOGO_GOLD}" alt="Daqui" class="a-hero-logo"><div class="a-hero-actions">${appBell(u)}</div></div>
      <h1>${greeting()}${u ? ', ' + esc(u.name.split(' ')[0]) + memberStar(u) : ''}</h1><p>${T('Fruta e legumes da época, do campo para si.', 'Seasonal fruit and veg, from the field to you.')}</p></header>
    <div class="a-pad a-next-wrap">${nextCard}</div>
    ${coopAppCard(u)}
    ${sec(T('Caixas da semana', 'This week\'s boxes'), `<div class="a-rail">${boxes.map(boxCard).join('')}</div>`, `<a class="link small" href="#/caixas">${T('Subscrever', 'Subscribe')}</a>`)}
    ${sec(T('Perto de si', 'Near you'), `<div class="a-list">${near.map(p => `<a class="a-row" href="#/mapa?v=recolha"><span class="a-row-ic">${icon('store', 20)}</span><span><b>${esc(p.name)}</b><span class="muted small">${T('Ponto de recolha', 'Collection point')}, ${T('qui.', 'Thu')} ${pickupHours('qui')}, ${T('sáb.', 'Sat')} ${pickupHours('sab')}</span></span><span class="a-km">${fmtKm(p.km)}</span></a>`).join('')}
      ${rests.map(r => `<a class="a-row" href="#/mapa?v=restaurantes"><span class="a-row-ic gold">${icon('utensils', 20)}</span><span><b>${esc(r.name)}</b><span class="muted small">${esc(L(r.dish))}</span></span><span class="a-km">${fmtKm(r.km)}</span></a>`).join('')}</div>
      ${appPos ? '' : `<button class="a-locate" data-app-locate>${icon('locate', 18)}${T('Usar a minha localização', 'Use my location')}</button>`}`, `<a class="link small" href="#/mapa">${T('Mapa', 'Map')}</a>`)}
    ${sec(favs.length ? T('Os seus favoritos na época', 'Your favourites in season') : T('Essenciais da época', 'Seasonal essentials'), `<div class="a-rail small">${season.map(prodCard).join('')}</div>`, `<a class="link small" href="#/loja">${T('Ver loja', 'Shop')}</a>`)}
    ${colheCard()}`, after: nextRailDots };
}

/* loja: pesquisa, atalhos de categoria e filtros como no site (categoria, disponibilidade, modo de produção, região e preço) */
const lf = { cats: new Set(), avail: new Set(), modes: new Set(), regions: new Set(), min: 0, max: 10, essential: false };
const lfCount = () => lf.cats.size + lf.avail.size + lf.modes.size + lf.regions.size + (lf.min > 0 || lf.max < 10 ? 1 : 0);
function lojaList(u) {
  const q = norm(lojaQ.trim()), favs = u ? u.favs || [] : [];
  return PRODUCTS.filter(p => (lojaCat === 'tudo' || p.cat === lojaCat || (lojaCat === 'bio' && hasBio(p)) || (lojaCat === 'favoritos' && favs.includes(p.id))) && prodMatches(p, lf)
      && (!q || norm(`${p.name.pt} ${p.name.en} ${offersOf(p).map(o => F(o.farmer)).filter(Boolean).map(f => f.place + ' ' + f.name + ' ' + L(REGIONS[f.region] || '')).join(' ')}`).includes(q)))
    .sort((a, b) => (a.cat === 'caixas' ? 0 : available(a) ? 1 : 2) - (b.cat === 'caixas' ? 0 : available(b) ? 1 : 2));
}
function lojaFilters() {
  const cnt = fn => PRODUCTS.filter(fn).length;
  const chk = (g, v, label, n) => `<label class="a-fchk"><input type="checkbox" data-lf="${g}" value="${v}"${lf[g].has(v) ? ' checked' : ''}><span>${label}</span><span class="n">${n}</span></label>`;
  const n = lojaList(currentUser()).length;
  return `<div class="mbody a-filters"><h2>${T('Filtros', 'Filters')}</h2>
    <fieldset><legend>${T('Categoria', 'Category')}</legend>${chk('cats', 'caixas', T('Caixas da Estação', 'Seasonal boxes'), cnt(p => p.cat === 'caixas'))}${chk('cats', 'fruta', T('Fruta', 'Fruit'), cnt(p => p.cat === 'fruta'))}${chk('cats', 'legumes', T('Legumes', 'Vegetables'), cnt(p => p.cat === 'legumes'))}</fieldset>
    <fieldset><legend>${T('Disponibilidade', 'Availability')}</legend>${chk('avail', 'now', T('Disponível agora', 'Available now'), cnt(available))}${chk('avail', 'nostock', T('Fora de stock', 'Out of stock'), cnt(p => inSeason(p) && soldOut(p)))}${chk('avail', 'off', T('Fora de época', 'Out of season'), cnt(p => !inSeason(p)))}</fieldset>
    <fieldset><legend>${T('Modo de produção', 'Farming method')}</legend>${chk('modes', 'conv', T('Convencional', 'Conventional'), cnt(hasConv))}${chk('modes', 'bio', T('Biológico', 'Organic'), cnt(hasBio))}</fieldset>
    <fieldset><legend>${T('Região', 'Region')}</legend>${Object.keys(REGIONS).map(r => chk('regions', r, regionName(r), cnt(p => offersOf(p).some(o => F(o.farmer) && F(o.farmer).region === r)))).filter(x => !/<span class="n">0<\/span>/.test(x)).join('')}</fieldset>
    <fieldset><legend>${T('Preço', 'Price')}: <span id="lf-pv">${money(lf.min)} – ${money(lf.max)}</span></legend>
      <label class="small" for="lf-min">${T('Desde', 'From')}</label><input id="lf-min" type="range" min="0" max="10" step="0.5" value="${lf.min}" data-lf-range="min">
      <label class="small" for="lf-max">${T('Até', 'Up to')}</label><input id="lf-max" type="range" min="0.5" max="10" step="0.5" value="${lf.max}" data-lf-range="max">
      <p class="small muted">${T('As caixas aparecem sempre.', 'Boxes always show.')}</p></fieldset>
    <div class="a-filters-foot"><button type="button" class="btn btn-line c-campo" data-lf-reset>${T('Limpar', 'Clear')}</button><button type="button" class="btn btn-green" data-modal-close id="lf-go">${T(`Ver ${n} produtos`, `Show ${n} products`)}</button></div></div>`;
}
function lojaRefresh() { const y = scrollY; render(); scrollTo(0, y); const n = lojaList(currentUser()).length, g = $('#lf-go'); if (g) g.textContent = T(`Ver ${n} produtos`, `Show ${n} products`); }
function scrLoja(u) {
  const cats = [['tudo', T('Tudo', 'All')], ['caixas', T('Caixas', 'Boxes')], ['fruta', T('Fruta', 'Fruit')], ['legumes', T('Legumes', 'Veg')], ['bio', T('Biológico', 'Organic')], ['favoritos', T('Favoritos', 'Favourites')]];
  const list = lojaList(u), nf = lfCount();
  return { title: T('Loja', 'Shop'), fab: true, html: `
    <div class="a-sticky"><div class="a-search-row"><label class="a-search">${icon('search', 20)}<span class="sr">${T('Procurar', 'Search')}</span><input type="search" id="a-q" value="${esc(lojaQ)}" placeholder="${T('Procurar fruta, legumes, quinta…', 'Search fruit, veg, farm…')}" autocomplete="off"></label>
      <button class="a-filter-btn" data-lf-open aria-label="${T('Filtros', 'Filters')}${nf ? `, ${nf} ${T('ativos', 'on')}` : ''}">${icon('filter', 20)}<span>${T('Filtros', 'Filters')}</span>${nf ? `<i class="a-dot">${nf}</i>` : ''}</button></div>
      <div class="a-chips" role="group" aria-label="${T('Categorias', 'Categories')}">${cats.map(([k, n]) => `<button class="a-chip-btn" data-loja-cat="${k}" aria-pressed="${lojaCat === k}">${n}</button>`).join('')}</div></div>
    <div class="a-pad"><p class="muted small mb-s">${list.length} ${T('produtos', 'products')}${nf ? ` · <button class="link" data-lf-reset>${T('limpar filtros', 'clear filters')}</button>` : ''}. ${T('Distribuímos à quinta-feira e ao sábado.', 'We deliver on Thursdays and Saturdays.')}</p>
    ${list.length ? `<div class="a-grid">${list.map(prodCard).join('')}</div>` : `<div class="a-empty">${icon('search', 30)}<p>${lojaCat === 'favoritos' && !u ? T('Entre na sua conta para ver os favoritos.', 'Sign in to see your favourites.') : nf ? T('Nenhum produto com estes filtros.', 'No products match these filters.') : T('Nada encontrado. Experimente outra palavra.', 'Nothing found. Try another word.')}</p>${nf ? `<button class="btn btn-green" data-lf-reset>${T('Limpar filtros', 'Clear filters')}</button>` : ''}</div>`}</div>` };
}

function scrProduto(id, u) {
  const p = P(id);
  if (!p) return { title: T('Produto', 'Product'), back: true, html: `<div class="a-empty">${icon('leaf', 30)}<p>${T('Este produto já não existe.', 'This product no longer exists.')}</p><a class="btn btn-green" href="#/loja">${T('Ver loja', 'Shop')}</a></div>` };
  const box = p.cat === 'caixas', on = inSeason(p), f = p.farmer ? F(p.farmer) : null, h = harvestOf(p), a = typeof ANALYSES !== 'undefined' ? ANALYSES[p.id] : null;
  const [sa, sb, sc] = splitOf(p), sizes = box ? BOX_SIZES[p.id] : null;
  if (box && !sizes.some(s => s.s === detSize)) detSize = sizes[0].s;
  if (detFor !== p.id) { detFor = p.id; detQty = 1; detBio = null; }
  if (!box && (detBio === null || (!offerOn(p, detBio) && offerOn(p, !detBio)))) detBio = defaultBio(p);
  if (!box && detQty < qtyStep(p)) detQty = qtyStep(p);
  const unit = box ? sizes.find(s => s.s === detSize).price : variantPrice(p, detBio), total = round2(unit * detQty), nOff = farmersOf(p).length;
  const months = Array.from({ length: 12 }, (_, i) => { const m = i + 1, [x, y] = p.season || [1, 12], inS = x <= y ? m >= x && m <= y : m >= x || m <= y; return `<i class="${inS ? 'on' : ''}${m === NOW_M ? ' now' : ''}" title="${monthName(m)}">${monthName(m, 'narrow')}</i>`; }).join('');
  const pool = box ? PRODUCTS.filter(x => x.cat !== 'caixas' && available(x) && (p.items ? p.items.includes(x.id) : p.id === 'caixa-essencial' ? x.essential : p.id === 'caixa-fruta' ? x.cat === 'fruta' : p.id === 'caixa-legumes' ? x.cat === 'legumes' : true) && !(u && (u.exclude || []).includes(x.id))) : [];
  const sample = p.id === 'caixa-mista' ? pool.filter(x => x.cat === 'fruta').slice(0, 4).concat(pool.filter(x => x.cat === 'legumes').slice(0, 4)) : pool.slice(0, 8);
  return { title: L(p.name), back: true, noBar: true, html: `
    <div class="a-pdp-hero${box ? ' box' : ''}"><button class="a-round" data-app-back aria-label="${T('Voltar', 'Back')}">${icon('chevL', 24)}</button>${favBtn(p.id, true)}${box ? boxArt(p) : artFor(p)}</div>
    <div class="a-pdp">
      <h1>${esc(L(p.name))}</h1>
      ${box ? `<p class="muted">${T('Vários agricultores; a composição muda todas as semanas.', 'Several farmers; the selection changes every week.')}</p>`
        : nOff ? `${nOff > 1 ? `<p class="lbl a-farms-h">${T(`Produzido por ${nOff} agricultores`, `Grown by ${nOff} farmers`)}</p>` : ''}<div class="a-farms">${farmersOf(p).map(fid => { const x = F(fid), kinds = offersOf(p).filter(o => o.farmer === fid).map(o => bioName(o.organic).toLowerCase()); const lh = latestHarvest(p.id, fid); return `<a class="a-farm" href="${farmerHref(x)}"><span class="a-farm-art">${farmPic(x)}</span><span><b>${esc(x.farm)}</b><span class="muted small">${esc(x.name)}, ${esc(x.place)}${hasBio(p) && hasConv(p) ? ` · ${kinds.join(T(' e ', ' and '))}` : ''}</span>${lh ? `<span class="small fm-harv">${T('Colheita mais recente', 'Latest harvest')}: ${fdate(lh)}</span>` : ''}</span>${icon('chevR', 18)}</a>`; }).join('')}</div>`
        : `<p class="note small">${icon('alert', 20)}<span>${T('De momento nenhum agricultor fornece este produto.', 'No farmer supplies this product at the moment.')}</span></p>`}
      <div class="a-pdp-price"><b>${money(unit)}</b><span>${box ? `${sizes.find(s => s.s === detSize).kg} kg` : unitLabel(p.unit) + (hasBio(p) ? `, ${bioName(detBio).toLowerCase()}` : '')}</span>${badges(p)}</div>
      ${!box && hasBio(p) && hasConv(p) ? `<fieldset class="a-sizes a-bio"><legend class="lbl">${T('Modo de produção', 'Farming method')}</legend>${[false, true].map(b => `<button type="button" data-det-bio="${b ? 1 : 0}" aria-pressed="${detBio === b}"${offerOn(p, b) ? '' : ' disabled'}><b>${bioName(b)}</b><span>${money(variantPrice(p, b))}${unitLabel(p.unit)}${b ? ` (+${Math.round(BIO_EXTRA * 100)}%)` : ''}${offerOn(p, b) ? '' : ' · ' + T('esgotado', 'sold out')}</span></button>`).join('')}</fieldset>` : ''}
      ${byKg(p) && available(p) ? `<p class="small muted">${T('Pode encomendar ao meio quilo (por exemplo 2,5 kg).', 'You can order by the half kilo (for example 2.5 kg).')}</p>` : ''}
      ${box ? `<fieldset class="a-sizes"><legend class="lbl">${T('Tamanho', 'Size')}</legend>${sizes.map(s => `<button type="button" data-det-size="${s.s}" aria-pressed="${detSize === s.s}"><b>${sizeName(s.s)}</b><span>${s.kg} kg, ${money(s.price)}</span></button>`).join('')}</fieldset>
        <a class="a-sub-cta" href="#/subscrever/${p.id}?tamanho=${detSize}">${icon('repeat', 20)}<span><b>${T('Receber todas as semanas', 'Get it every week')}</b><span class="small">${T('Subscrição com preço garantido durante 12 meses', 'Subscription with a 12-month price guarantee')}</span></span>${icon('chevR', 18)}</a>` : ''}
      <p class="a-lead">${esc(L(p.desc))}</p>
      ${box && sample.length ? `<h2 class="a-h2">${T('Esta semana pode levar', 'This week it may include')}</h2><div class="a-tags">${sample.map(x => `<span>${esc(L(x.name))}</span>`).join('')}</div>${u ? `<p class="small muted">${T('Respeita os produtos que não quer receber.', 'Respects the products you\'d rather not get.')} <a class="link" href="#/conta/preferencias">${T('Preferências', 'Preferences')}</a></p>` : ''}` : ''}
      ${!box ? `<h2 class="a-h2">${T('Época', 'Season')}</h2><div class="a-months">${months}</div>
        <p class="small muted">${h ? `${T('Colheita mais recente', 'Latest harvest')}: ${fdate(h)}${isStored(p) ? T(', conservada em frio', ', cold-stored') : ''}.` : T(`Fora de época. Volta em ${monthName(p.season[0])}.`, `Out of season. Back in ${monthName(p.season[0])}.`)}</p>` : ''}
      <h2 class="a-h2">${T('Para onde vai o seu dinheiro', 'Where your money goes')}</h2>
      ${splitBar(p, false)}<div class="a-split-cap"><span><i class="k1"></i>${T('Agricultor', 'Farmer')} ${sa}%</span><span><i class="k2"></i>${T('Conservação', 'Storage')} ${sb}%</span><span><i class="k3"></i>Daqui ${sc}%</span></div><p class="small muted a-vat">${VAT_NOTE()}</p>
      ${productInfo(p).map(([ic, title, body]) => `<details class="a-acc"><summary>${icon(ic, 18)}${title}</summary><div class="a-acc-body small">${body}</div></details>`).join('')}
      ${wrapSite('produto', reviewsSection(p, true))}
    </div>
    <div class="a-buy">${available(p) || box ? `<div class="qty"><button data-det-qty="-1" aria-label="${byKg(p) ? T('Menos meio quilo', 'Half a kilo less') : T('Menos um', 'One less')}">${icon('minus', 16)}</button><span aria-live="polite">${fmtQty(detQty, p)}</span><button data-det-qty="1" aria-label="${byKg(p) ? T('Mais meio quilo', 'Half a kilo more') : T('Mais um', 'One more')}">${icon('plus', 16)}</button></div>
      <button class="a-big-btn" data-det-add="${p.id}">${T('Adicionar', 'Add')} · ${money(total)}</button>`
      : `<button class="a-big-btn ghost" data-notify="${p.id}" aria-pressed="${notifyOn(p.id)}">${icon('bell', 18)} ${notifyOn(p.id) ? T('Aviso ativo', 'Reminder on') : on ? T('Sem stock: avisar-me', 'Out of stock: notify me') : T('Avisar-me quando voltar', 'Notify me when it\'s back')}</button>`}</div>` };
}

function scrMapa() {
  const views = [['recolha', T('Recolha', 'Collection')], ['restaurantes', T('Restaurantes', 'Restaurants')], ['quintas', T('Quintas', 'Farms')]];
  let body = '';
  if (mapaV === 'recolha') body = `<div class="a-list">${pickupList().map(p => `<div class="a-row"><span class="a-row-ic">${icon('store', 20)}</span><span><b>${esc(p.name)}</b><span class="muted small">${T('Quinta-feira', 'Thursday')} ${pickupHours('qui')}, ${T('sábado', 'Saturday')} ${pickupHours('sab')}</span></span><span class="a-km">${fmtKm(p.km)}</span></div>`).join('')}</div>
    <p class="small muted mt-s">${T('Escolhe o ponto de recolha ao finalizar a encomenda ou na subscrição.', 'You choose the collection point at checkout or in your subscription.')}</p>`;
  if (mapaV === 'restaurantes') body = `${appCuisineChips()}<div class="a-map">${aveiroMapSVG(restList().filter(appRestOk).map(r => Object.assign({}, r, { href: '#/restaurante/' + r.id })), lang, '')}</div><div class="a-list">${restList().filter(appRestOk).map(r => `<a class="a-row" id="${r.id}" href="#/restaurante/${r.id}"><span class="a-row-ic gold">${icon('utensils', 20)}</span><span><b>${esc(r.name)}</b><span class="muted small">${esc(cuisineName(r))}. ${esc(L(r.dish))} ${vegBadges({ veg: r.dishVeg, vegan: r.dishVegan }, true)}</span></span><span class="a-km">${fmtKm(r.km)}</span></a>`).join('')}</div>`;
  if (mapaV === 'quintas') body = `${appRegionChips()}<div class="a-map pt">${portugalMapSVG(farmersForMap().filter(f => appRegion === 'all' || f.region === appRegion), lang, '')}</div><div class="a-list">${farmList().filter(f => appRegion === 'all' || f.region === appRegion).map(f => `<a class="a-row" href="${farmerHref(f)}"><span class="a-row-ic">${icon('tractor', 20)}</span><span><b>${esc(f.farm)}</b><span class="muted small">${esc(f.name)}, ${esc(f.place)}</span></span><span class="a-km">${fmtKm(f.km)}</span></a>`).join('')}</div>`;
  return { title: T('Mapa', 'Map'), fab: true, html: `<div class="a-sticky"><div class="a-seg" role="tablist">${views.map(([k, n]) => `<button role="tab" data-mapa="${k}" aria-selected="${mapaV === k}">${n}</button>`).join('')}</div></div>
    <div class="a-pad">${appPos ? `<p class="small muted mb-s">${icon('locate', 14)} ${T('Distâncias a partir da sua localização.', 'Distances from your location.')} <button class="link" data-app-locate>${T('Atualizar', 'Update')}</button></p>` : `<button class="a-locate mb-s" data-app-locate>${icon('locate', 18)}${T('Usar a minha localização', 'Use my location')}</button><p class="small muted mb-s">${T('Sem localização, as distâncias contam a partir do centro de Aveiro.', 'Without your location, distances are from Aveiro city centre.')}</p>`}${body}</div>` };
}

/* ajuda e documentos legais: em todas as contas (cliente, agricultor, restaurante e gestão) */
function appHelpRows(chat = true) {
  const n = chat ? chatUnread() : 0;
  const list = [...(chat ? [['#/mensagens', 'chat', T('Falar com a Daqui', 'Talk to Daqui'), n ? `${n} ${n === 1 ? T('mensagem nova', 'new message') : T('mensagens novas', 'new messages')}` : T('Escreva-nos: respondemos aqui', 'Write to us: we reply here')]] : []),
    ['#/info/contacto', 'phone', T('Contacto e ajuda', 'Contact and help')], ['#/info/faq', 'help', T('Perguntas frequentes', 'FAQ')], ['#/info/sobre', 'leaf', T('Sobre a Daqui', 'About Daqui')]];
  const legal = [['termos', T('Termos de utilização', 'Terms of use')], ['privacidade', T('Privacidade', 'Privacy')], ['cookies', 'Cookies'], ['devolucoes', T('Devoluções e reembolsos', 'Refunds')]];
  const row = ([h, ic, t, sub]) => `<a class="a-row" href="${h}"><span class="a-row-ic">${icon(ic, 20)}</span><span><b>${t}</b>${sub ? `<span class="muted small">${sub}</span>` : ''}</span>${icon('chevR', 18)}</a>`;
  return `<div class="a-menu">${list.map(row).join('')}</div><h2 class="a-h2 a-menu-h">${T('Informação legal', 'Legal')}</h2><div class="a-menu">${legal.map(([k, t]) => row([`#/info/${k}`, 'shield', t])).join('')}</div>`;
}
function scrMensagens(u) {
  return { title: T('Falar com a Daqui', 'Talk to Daqui'), back: true, noTabs: false, html: `<div class="a-pad a-chat">${chatBody()}</div>`, after: () => { const c = myConv(); if (c) chatMarkRead(c, 'gestao'); const m = $('#msgs'); if (m) m.scrollTop = m.scrollHeight; chatPoll(); } };
}
function scrConta(u) {
  const rows = (list) => `<div class="a-menu">${list.map(([h, ic, t, sub]) => `<a class="a-row" href="${h}"><span class="a-row-ic">${icon(ic, 20)}</span><span><b>${t}</b>${sub ? `<span class="muted small">${sub}</span>` : ''}</span>${icon('chevR', 18)}</a>`).join('')}</div>`;
  const help = appHelpRows();
  const langRow = settingsRow();
  const pushRow = NATIVO.pushAvailable() && u ? `<button class="a-row" data-push-on><span class="a-row-ic">${icon('bell', 20)}</span><span><b>${T('Notificações', 'Notifications')}</b><span class="muted small">${NATIVO.pushState === 'on' ? T('Ativas neste telemóvel', 'On for this phone') : T('Toque para ativar', 'Tap to turn on')}</span></span>${icon('chevR', 18)}</button>` : '';
  if (!u) return { title: T('Conta', 'Account'), fab: true, html: `<div class="a-pad"><div class="a-guest">${icon('user', 34)}<h2>${T('Entre ou crie conta', 'Sign in or create an account')}</h2><p class="muted">${T('Para seguir encomendas, guardar favoritos e subscrever caixas.', 'To track orders, save favourites and subscribe to boxes.')}</p>
    <a class="a-big-btn" href="#/entrar">${T('Entrar', 'Sign in')}</a><a class="a-big-btn ghost" href="#/entrar?modo=registo">${T('Criar conta', 'Create account')}</a></div>
    ${myOrders(null).length ? sec(T('Encomendas feitas neste telemóvel', 'Orders placed on this phone'), `<div class="a-list">${myOrders(null).map(orderMini).join('')}</div>`) : ''}
    <div class="a-menu">${langRow}</div>${rows([['#/info/contacto', 'route', T('Seguir uma encomenda', 'Track an order'), T('Com o número e o telemóvel', 'With the number and mobile')]])}${help}</div>` };
  const orders = myOrders(u), nova = (u.subs || []).find(s => s.id === QS.get('nova'));
  return { title: T('Conta', 'Account'), fab: roleOf(u) === 'cliente', html: `<div class="a-pad">
    ${nova ? `<p class="note done">${icon('check', 22)}<span><b>${T('Subscrição confirmada', 'Subscription confirmed')}: ${esc(L(P(nova.box).name))}.</b> ${T('Primeira entrega', 'First delivery')}: ${slotLabel(nova.first)}.</span></p>` : ''}
    <div class="a-profile"><span class="a-avatar">${esc(u.name.split(' ').map(x => x[0]).slice(0, 2).join(''))}</span><span><b>${esc(u.name)}${memberStar(u)}</b><span class="muted small">${esc(u.username)}, ${esc(u.phone)}</span></span></div>
    ${coopAppCard(u)}
    ${rows([['#/conta/encomendas', 'box', T('Encomendas', 'Orders'), `${orders.length} ${orders.length === 1 ? T('encomenda', 'order') : T('encomendas', 'orders')}${(n => n ? `, ${n} ${n === 1 ? T('registo do Colhe Connosco', 'harvest record') : T('registos do Colhe Connosco', 'harvest records')}` : '')(harvestRecords(u).length)}`], ['#/conta/subscricoes', 'repeat', T('Subscrições', 'Subscriptions'), (n => `${n} ${n === 1 ? T('ativa', 'active') : T('ativas', 'active')}`)((u.subs || []).filter(s => s.status === 'ativa').length)],
      ['#/conta/preferencias', 'heart', T('Favoritos, exclusões e avisos', 'Favourites, exclusions and reminders'), `${(u.favs || []).length} ${(u.favs || []).length === 1 ? T('favorito', 'favourite') : T('favoritos', 'favourites')}, ${(u.exclude || []).length} ${T('excluídos', 'excluded')}, ${(u.notify || []).length} ${(u.notify || []).length === 1 ? T('aviso', 'reminder') : T('avisos', 'reminders')}`], ['#/conta/colhe', 'sprout', JTH(), (n => `${n} ${n === 1 ? T('inscrição', 'sign-up') : T('inscrições', 'sign-ups')}`)((u.harvests || []).length)], ['#/conta/carteira', 'wallet', T('Saldo e Cooperativa', 'Balance and Co-op'), `${money(balanceOf(u))}${isMember(u) ? ' · ' + T('membro', 'member') : ''}`], ['#/conta/faturas', 'receipt', T('Faturas', 'Invoices'), T('Ver e descarregar em PDF', 'View and download as PDF')], ['#/conta/avaliacoes', 'star', T('As minhas avaliações', 'My reviews'), T('Editar ou apagar', 'Edit or delete')], ['#/conta/dados', 'user', T('Dados e morada', 'Details and address'), T('E-mail, telemóvel, NIF e palavra-passe', 'Email, mobile, tax number and password')]])}
    <div class="a-menu">${langRow}</div>${help}
    <button class="a-big-btn ghost danger" data-logout>${icon('logout', 18)} ${T('Terminar sessão', 'Sign out')}</button></div>` };
}

/* registo de colheita do Colhe Connosco, na lista de encomendas (com o valor pago) */
function recMini({ h, d, rec }, u) {
  return `<a class="a-order" href="#/conta/colhe"><span class="a-order-ic">${icon('sprout', 22)}</span>
    <span><b>${recId(h, d, u.username)}</b><span class="muted small">${JTH()}, ${slotLabel(d.date)}. ${recText(rec, d)}</span></span>
    <b class="a-order-tot">${rec.price != null ? money(rec.price) : ''}</b></a>`;
}
function scrEncomendas(u) {
  const list = myOrders(u).map(o => ({ at: String(o.created), html: orderMini(o) })).concat(u ? harvestRecords(u).map(x => ({ at: x.d.date, html: recMini(x, u) })) : [], subDeliveries(u).map(x => ({ at: x.date, html: boxDeliveryCard(x, true) }))).sort((a, b) => b.at.localeCompare(a.at));
  return { title: T('Encomendas', 'Orders'), back: true, html: `<div class="a-pad">${list.length ? `<div class="a-list">${list.map(x => x.html).join('')}</div>` : `<div class="a-empty">${icon('box', 30)}<p>${T('Ainda não fez encomendas.', 'No orders yet.')}</p><a class="btn btn-green" href="#/loja">${T('Ir à loja', 'Go to the shop')}</a></div>`}
    <p class="small muted mt">${T('Procura uma encomenda feita sem conta?', 'Looking for an order placed without an account?')} <button class="link" data-help="track">${T('Procurar com o número', 'Find it by number')}</button></p></div>` };
}

function scrEncomenda(num, u) {
  const o = findOrder(num);
  if (!o) return { title: num, back: true, html: `<div class="a-pad"><div class="a-empty">${icon('route', 30)}<p>${T('Não encontrámos esta encomenda neste telemóvel. Procure-a com o número e o telemóvel usado.', 'We couldn\'t find this order on this phone. Look it up with its number and the mobile used.')}</p><button class="btn btn-green" data-help="track" data-num="${esc(num)}">${T('Procurar encomenda', 'Find order')}</button></div></div>` };
  const st = orderStage(o), nova = QS.get('nova');
  return { title: o.num, back: !nova, html: `<div class="a-pad">
    ${nova ? `<div class="a-done">${icon('check', 34)}<h2>${T('Encomenda confirmada', 'Order confirmed')}</h2><p class="muted">${T('Guarde o número para seguir ou alterar a encomenda.', 'Keep the number to track or change the order.')}</p></div>` : ''}
    ${canSwipe(o) ? `<div class="a-swipe-box"><p><b>${T('A sua encomenda está pronta', 'Your order is ready')}</b><br><span class="small">${esc(o.point)}, ${pickupHours(o.day)}. ${T('Deslize quando a receber no ponto de recolha.', 'Swipe when you receive it at the collection point.')}</span></p>
      <div class="a-swipe" data-swipe="${o.num}"><span class="a-swipe-label">${T('Deslize para confirmar o levantamento', 'Swipe to confirm collection')}</span><button class="a-swipe-knob" data-swipe-knob="${o.num}" aria-label="${T('Confirmar o levantamento', 'Confirm collection')}">${icon('chevR', 26)}</button></div></div>` : ''}
    ${st === STAGE_DONE && o.deliver === 'pickup' ? `<p class="note done">${icon('check', 22)}<span><b>${T('Levantada', 'Collected')}.</b> ${T('Bom proveito!', 'Enjoy!')}</span></p>` : ''}
    <div class="a-panel">${trackHTML(o)}</div>
    <div class="a-panel"><h2 class="a-h2">${T('Artigos', 'Items')}</h2><div class="a-items">${o.items.map(i => { const p = P(i.id); return `<div class="a-item"><span class="thumb">${p ? artFor(p) : ''}</span><span>${itemText(i)}</span><b>${money(round2(i.price * i.qty))}</b></div>`; }).join('')}</div>
      <div class="sum"><span>${T('Entrega', 'Delivery')}</span><span>${o.fee ? money(o.fee) : T('Grátis', 'Free')}</span></div><div class="sum tot"><span>Total</span><span>${money(o.total)}</span></div>
      ${o.prefs ? `<p class="small muted mt-s">${T('Nas caixas não vai', 'Boxes will leave out')}: ${(o.prefs.exclude || []).map(P).filter(Boolean).map(p => esc(L(p.name))).join(', ') || T('nada', 'nothing')}.</p>` : ''}${orderBoxesHTML(o)}</div>
    <div class="a-actions">${st <= 1 && o.status !== 'cancelada' ? `<button class="a-big-btn ghost" data-app-manage="${o.num}">${icon('calendar', 18)} ${T('Mudar o dia ou cancelar', 'Change the day or cancel')}</button>` : ''}
      ${st >= 3 && st <= STAGE_DONE ? `<a class="a-big-btn ghost" href="#/incidencia/${o.num}">${icon('camera', 18)} ${T('Comunicar um problema', 'Report a problem')}</a>` : ''}
      <button class="a-big-btn ghost" data-app-reorder="${o.num}">${icon('repeat', 18)} ${T('Repetir encomenda', 'Order again')}</button>
      ${nova ? `<a class="a-big-btn" href="#/inicio">${T('Voltar ao início', 'Back to home')}</a>` : ''}</div></div>` };
}

function scrIncidencia(num) {
  const o = findOrder(num);
  if (!o) return scrEncomenda(num);
  return { title: T('Comunicar um problema', 'Report a problem'), back: true, html: `<form class="a-pad form" data-app-incident="${o.num}" novalidate>
    <p class="muted">${T('Diga-nos o que aconteceu com a encomenda', 'Tell us what happened with order')} ${o.num}. ${T('Substituímos o produto ou devolvemos o valor.', 'We replace the item or refund you.')}</p>
    <div class="field"><label for="ai-prod">${T('Produto', 'Product')}</label><select id="ai-prod">${o.items.map(i => P(i.id)).filter(Boolean).map(p => `<option value="${p.id}">${esc(L(p.name))}</option>`).join('')}</select></div>
    <div class="field"><label for="ai-what">${T('O que aconteceu?', 'What happened?')}</label><textarea id="ai-what" rows="3" required></textarea></div>
    <div class="field"><span class="lbl">${T('Fotografia', 'Photo')}</span>
      <div class="a-photo">${incPhotoUrl ? `<img src="${incPhotoUrl}" alt="${T('Fotografia escolhida', 'Chosen photo')}"><button type="button" class="link" data-photo-rm>${T('Remover', 'Remove')}</button>` : ''}
        ${NATIVO.isNative ? `<div class="a-photo-btns"><button type="button" class="a-big-btn ghost" data-photo-take="camera">${icon('camera', 20)} ${incPhotoUrl ? T('Tirar outra', 'Take another') : T('Tirar fotografia', 'Take a photo')}</button><button type="button" class="a-big-btn ghost" data-photo-take="photos">${icon('grid', 20)} ${T('Galeria', 'Gallery')}</button></div>`
          : `<label class="a-big-btn ghost">${icon('camera', 20)} ${incPhotoUrl ? T('Tirar outra', 'Take another') : T('Tirar fotografia', 'Take a photo')}<input type="file" id="ai-file" accept="image/*" capture="environment" class="sr"></label>`}</div></div>
    <div class="field"><span class="lbl">${T('Prefere', 'You prefer')}</span><div class="radios"><label><input type="radio" name="ai-pref" value="sub" checked>${T('Substituir na próxima entrega', 'A replacement next delivery')}</label><label><input type="radio" name="ai-pref" value="ref">${T('Reembolso', 'A refund')}</label></div></div>
    <p class="err" hidden></p><button class="a-big-btn" type="submit">${T('Enviar', 'Send')}</button></form>` };
}

/* ---------- ecrãs que reaproveitam páginas do site ---------- */
/* o conteúdo reaproveitado fica dentro de <div data-site-page="…">: assim os eventos das páginas do site sabem a que página pertencem */
const wrapSite = (key, html) => `<div data-site-page="${key}">${html}</div>`;
function sitePage(key, pid) { PAGE = key; if (pid !== undefined) PID = pid; const o = PAGES[key](); return Object.assign({}, o, { html: wrapSite(key, o.html) }); }
function contaSection(id) {
  PAGE = 'conta'; const out = PAGES.conta(), t = document.createElement('template'); t.innerHTML = out.html;
  const s = t.content.querySelector('#' + id); return s ? wrapSite('conta', s.outerHTML) : '';
}
function partnerTab(u, idx) {
  PAGE = 'parceiro'; const s = partnerSections(u), pt = u.partner;
  const pend = pt.approved && !pt.reply ? '' : partnerStatusNote(u);
  return wrapSite('parceiro', pend + idx.map(i => s[i] || '').join(''));
}
function myProposals(u) {
  const types = REQ_TYPES(), list = REQUESTS.filter(r => r.partnerUser === u.username || r.user === u.username).sort((a, b) => b.created.localeCompare(a.created));
  return `<section class="acc-sec"><h2>${T('As minhas propostas e pedidos', 'My proposals and requests')}</h2>${list.length ? `<ul class="hlist mt-s">${list.map(r => `<li class="hrow"><span>${icon(r.type === 'produto' ? 'leaf' : r.type === 'colhe' ? 'calendar' : r.type === 'frio' ? 'snow' : 'inbox', 20)}</span><div><b>${types[r.type] || r.type}</b><br><span class="small muted">${esc(r.fields.productId && P(r.fields.productId) ? L(P(r.fields.productId).name) : r.fields.namePt || (P(r.fields.product) ? L(P(r.fields.product).name) : r.fields.product) || (r.fields.date ? slotLabel(r.fields.date) : '') || r.fields.farm || r.fields.restaurant || '')}${r.fields.organic ? ` (${bioName(r.fields.organic === 'sim').toLowerCase()})` : ''} · ${fdate(r.created)}</span>${reqReply(r)}</div>${reqStatus(r)}</li>`).join('')}</ul>` : `<p class="muted mt-s">${T('Ainda não fez propostas.', 'No proposals yet.')}</p>`}</section>`;
}
function adminMais() {
  const kp = `<div class="kpis"><div><strong>${REQUESTS.filter(r => r.status === 'novo').length}</strong><span>${T('pedidos novos', 'new requests')}</span></div><div><strong>${ORDERS.filter(o => orderStage(o) < STAGE_DONE).length}</strong><span>${T('por entregar', 'to deliver')}</span></div><div><strong>${Object.values(USERS).flatMap(c => c.subs || []).filter(s => s.status === 'ativa').length}</strong><span>${T('subscrições', 'subscriptions')}</span></div><div><strong>${Object.values(USERS).filter(x => x.role !== 'admin').length}</strong><span>${T('contas', 'accounts')}</span></div></div>`;
  const nm = chatUnread();
  const rows = [['#/g/mensagens', 'chat', T('Mensagens', 'Messages') + (nm ? ` <span class="count-in">${nm}</span>` : '')], ['#/g/preparar', 'box', T('Preparar caixas', 'Prepare boxes')], ['#/g/inventario', 'list', T('Inventário', 'Inventory')],
    ['#/g/promocoes', 'gift', T('Promoções e códigos', 'Promotions and codes')], ['#/g/parceiros', 'tractor', T('Agricultores e restaurantes', 'Farmers and restaurants')], ['#/g/definicoes', 'gear', T('Definições da loja', 'Shop settings')], ['#/g/caixas', 'box', T('Caixas e preços', 'Boxes and prices')], ['#/g/colhe', 'sprout', JTH()], ['#/g/subscricoes', 'repeat', T('Subscrições', 'Subscriptions')], ['#/g/contas', 'users', T('Contas', 'Accounts')], ['#/conta/dados', 'lock', T('Dados e palavra-passe', 'Details and password')], ['#/g/dados', 'app', NUVEM.on ? T('Base de dados', 'Database') : T('Guardar alterações', 'Save changes')]];
  return `<div class="a-pad">${NUVEM.badge()}${kp}<div class="a-menu">${rows.map(([h, ic, t]) => `<a class="a-row" href="${h}"><span class="a-row-ic">${icon(ic, 20)}</span><span><b>${t}</b></span>${icon('chevR', 18)}</a>`).join('')}</div>
    <div class="a-menu">${settingsRow()}${NATIVO.pushAvailable() && false ? `<button class="a-row" data-push-on><span class="a-row-ic">${icon('bell', 20)}</span><span><b>${T('Notificações', 'Notifications')}</b><span class="muted small">${NATIVO.pushState === 'on' ? T('Ativas neste telemóvel', 'On for this phone') : T('Toque para ativar', 'Tap to turn on')}</span></span>${icon('chevR', 18)}</button>` : ''}</div>
    ${appHelpRows(false)}
    <button class="a-big-btn ghost danger" data-logout>${icon('logout', 18)} ${T('Terminar sessão', 'Sign out')}</button></div>`;
}
function partnerConta(u, extra) {
  return `<div class="a-profile"><span class="a-avatar">${esc(u.name.split(' ').map(x => x[0]).slice(0, 2).join(''))}</span><span><b>${esc(u.name)}${memberStar(u)}</b><span class="muted small">${esc(u.username)}, ${esc(u.phone)}</span></span></div>
    ${extra}${contaSection('dados')}
    <div class="a-menu">${settingsRow()}${NATIVO.pushAvailable() && false ? `<button class="a-row" data-push-on><span class="a-row-ic">${icon('bell', 20)}</span><span><b>${T('Notificações', 'Notifications')}</b><span class="muted small">${NATIVO.pushState === 'on' ? T('Ativas neste telemóvel', 'On for this phone') : T('Toque para ativar', 'Tap to turn on')}</span></span>${icon('chevR', 18)}</button>` : ''}
      <a class="a-row" href="#/conta/encomendas"><span class="a-row-ic">${icon('box', 20)}</span><span><b>${T('Encomendas', 'Orders')}</b></span>${icon('chevR', 18)}</a></div>
    ${appHelpRows()}
    <button class="a-big-btn ghost danger" data-logout>${icon('logout', 18)} ${T('Terminar sessão', 'Sign out')}</button>`;
}

/* ---------- escolher o ecrã ---------- */
function appScreen(path, u) {
  const role = roleOf(u), [a, b] = path.split('/');
  PAGE = 'app';
  if ((a === 'g' && role !== 'admin') || (a === 'p' && role !== 'agricultor') || (a === 'r' && role !== 'restaurante')) return { redirect: roleHome(u) };
  if (a === 'boas-vindas') return scrIntro();
  if (a === 'inicio') return scrInicio(u);
  if (a === 'loja') return scrLoja(u);
  if (a === 'produto') return scrProduto(b, u);
  if (a === 'mapa') { if (QS.get('v')) mapaV = QS.get('v'); return scrMapa(); }
  if (a === 'conta' && !b) return scrConta(u);
  if (a === 'conta' && b === 'encomendas') return scrEncomendas(u);
  if (a === 'conta') { if (!u) return { redirect: 'entrar?next=conta' }; BACK = /^subscricao\/[a-z0-9-]+$/.test(QS.get('voltar') || '') ? QS.get('voltar') : ''; const names = { carteira: T('Saldo e Cooperativa', 'Balance and Co-op'), faturas: T('Faturas', 'Invoices'), avaliacoes: T('As minhas avaliações', 'My reviews'), subscricoes: T('Subscrições', 'Subscriptions'), preferencias: T('Favoritos, exclusões e avisos', 'Favourites, exclusions and reminders'), colhe: JTH(), dados: role === 'admin' ? T('Dados e palavra-passe', 'Details and password') : T('Dados e morada', 'Details and address') };
    return { title: names[b] || T('Conta', 'Account'), back: true, html: `<div class="a-pad">${contaSection(b) || ''}</div>` }; }
  if (a === 'mensagens') return role === 'admin' ? { redirect: 'g/mensagens' } : scrMensagens(u);
  if (a === 'definicoes') return scrDefinicoes(u);
  if (a === 'notificacoes') return u ? scrNotificacoes(u) : { redirect: 'entrar?next=notificacoes' };
  if (a === 'restaurante') { PID = b; QS = new URLSearchParams('id=' + b); const o = sitePage('restaurante'); return { title: o.title, back: true, html: o.html, after: o.after }; }
  if (a === 'cooperativa') { const o = sitePage('cooperativa'); return { title: T('Cooperativa', 'Co-op'), back: true, fab: true, html: o.html, after: o.after }; }
  if (a === 'p' && b === 'entregas') return { title: T('Entregas à Daqui', 'Supplies to Daqui'), html: `<div class="a-pad">${partnerTab(u, [3])}</div>` };
  if (a === 'encomenda') return scrEncomenda(b, u);
  if (a === 'incidencia') return scrIncidencia(b);
  if (a === 'caixas') { const o = sitePage('subscricao'); return { title: T('Caixas da Estação', 'Seasonal boxes'), back: true, fab: true, html: o.html, after: o.after }; }
  if (a === 'subscrever') { PAGE = 'subscrever'; PID = b; if (cfgFor !== location.hash) { cfg = makeCfg(); cfgFor = location.hash; }   /* só recomeça a configuração ao entrar no ecrã (não a cada escolha) */
    const o = PAGES.subscrever(); return { title: T('Subscrever', 'Subscribe'), back: true, html: wrapSite('subscrever', o.html) }; }
  if (a === 'finalizar') { const o = sitePage('finalizar'); return { title: T('Finalizar encomenda', 'Check out'), back: true, html: o.html, after: o.after }; }
  if (a === 'entrar') { if (QS.get('modo')) authMode = QS.get('modo') === 'registo' ? 'registo' : 'entrar'; if (QS.get('tipo')) authRole = QS.get('tipo'); NEXT = /^[a-z0-9\-/]*$/.test(QS.get('next') || '') ? QS.get('next') || '' : ''; const o = sitePage('entrar'); return { title: T('Entrar', 'Sign in'), back: true, html: o.html }; }
  if (a === 'colhe') { const o = sitePage('colhe-connosco'); return { title: JTH(), back: true, html: o.html, after: o.after }; }
  if (a === 'agricultor') { const o = sitePage('agricultor', b); return { title: o.title, back: true, html: o.html, after: o.after }; }
  if (a === 'info' && PAGES[b]) { const o = sitePage(b); return { title: o.title, back: true, html: o.html, after: o.after }; }
  /* agricultor */
  if (path === 'p/produtos') return { title: T('Os meus produtos', 'My produce'), html: `<div class="a-pad">${partnerTab(u, [1])}</div>` };
  if (path === 'p/colhe') return { title: JTH(), html: `<div class="a-pad">${partnerTab(u, [2])}</div>` };
  if (path === 'p/propostas') return { title: T('Propostas', 'Proposals'), back: true, html: `<div class="a-pad">${myProposals(u)}</div>` };
  if (path === 'p/conta') return { title: T('Conta', 'Account'), html: `<div class="a-pad">${partnerConta(u, farmerContaRows(u))}</div>` };
  if (path === 'p/perfil') return { title: T('Perfil da quinta', 'Farm profile'), back: true, html: `<div class="a-pad">${partnerTab(u, [0])}</div>` };
  if (path === 'p/pagamentos') { const f = u.partner.farmerId ? F(u.partner.farmerId) : null; return { title: T('Vendas e pagamentos', 'Sales and payments'), back: true, html: `<div class="a-pad">${f ? farmerPaySection(f) : ''}</div>` }; }
  /* restaurante */
  if (path === 'r/perfil') return { title: esc(u.partner.name || T('Restaurante', 'Restaurant')), html: `<div class="a-pad">${partnerTab(u, [0, 1])}</div>` };
  if (path === 'r/pratos') return { title: T('Pratos', 'Dishes'), html: `<div class="a-pad">${partnerTab(u, [2])}</div>` };
  if (path === 'r/conta') return { title: T('Conta', 'Account'), html: `<div class="a-pad">${partnerConta(u, '')}</div>` };
  /* gestão: as funções do painel do site (js/pages-gestao.js) */
  if (a === 'g') {
    PAGE = 'conta';
    const map = { pedidos: [tabPedidos, T('Pedidos', 'Requests')], mensagens: [tabMensagens, T('Mensagens', 'Messages')], encomendas: [tabEncomendas, T('Encomendas', 'Orders')], catalogo: [tabCatalogo, T('Catálogo', 'Catalogue')], caixas: [tabCaixas, T('Caixas e preços', 'Boxes and prices')],
      colhe: [tabColhe, JTH()], subscricoes: [tabSubs, T('Subscrições', 'Subscriptions')], contas: [tabContas, T('Contas', 'Accounts')], dados: [tabExportar, NUVEM.on ? T('Base de dados', 'Database') : T('Guardar alterações', 'Save changes')] };
    Object.entries(ADMIN_EXTRA).forEach(([k, [n, fn]]) => { map[k] = [fn, n()]; });
    if (b === 'mais') return { title: T('Gestão', 'Management'), html: adminMais() };
    const [fn, title] = map[b] || map.pedidos;
    return { title, back: !['pedidos', 'encomendas', 'catalogo'].includes(b), html: `<div class="a-pad">${wrapSite('conta', fn())}</div>` };
  }
  return { redirect: roleHome(u) };
}

/* ---------- desenhar ---------- */
let APP_READY = false;   // só desenha depois de ler a base de dados (js/nuvem.js)
render = function appRender() {
  if (!APP_READY) return;
  document.documentElement.lang = lang === 'en' ? 'en' : 'pt-PT';
  const { path, query } = appHash(); QS = query;
  if (!store.get(INTRO_KEY, false) && path !== 'boas-vindas') { appReplace('#/boas-vindas'); return; }
  const u = currentUser();
  if (!path) { appReplace('#/' + roleHome(u)); return; }
  const scr = appScreen(path, u);
  if (scr.redirect) { appReplace('#/' + scr.redirect); return; }
  const role = roleOf(u), tabs = TABS()[role], act = activeTab(path, role);
  const count = itemCount(cart), newReq = role === 'admin' ? REQUESTS.filter(r => r.status === 'novo').length : 0, newMsg = role === 'admin' ? chatUnread() : 0;
  const bar = scr.bare || scr.hero || scr.noBar ? '' : `<header class="a-bar"><div class="a-bar-in">${scr.back ? `<button class="a-bar-btn" data-app-back aria-label="${T('Voltar', 'Back')}">${icon('chevL', 26)}</button>` : `<img class="a-bar-logo" src="${LOGO_GOLD}" alt="Daqui">`}
    <h1 class="a-bar-title">${scr.title}</h1>${u && role !== 'cliente' && path !== 'notificacoes' ? appBarBell(u) : ''}${role === 'admin' && path.startsWith('g/') ? `<button class="a-bar-btn" data-app-refresh aria-label="${T('Atualizar', 'Refresh')}">${icon('repeat', 22)}</button>` : ''}</div></header>`;
  const nav = scr.bare ? '' : `<nav class="a-tabs" aria-label="${T('Secções', 'Sections')}">${tabs.map(([r, ic, n]) => `<a href="#/${r}"${act === r ? ' aria-current="page"' : ''}>${icon(ic, 24)}<span>${n}</span>${r === 'g/pedidos' && newReq ? `<i class="a-dot">${newReq}</i>` : ''}${r === 'g/mais' && newMsg ? `<i class="a-dot">${newMsg}</i>` : ''}</a>`).join('')}</nav>`;
  const fab = scr.fab && role !== 'admin' && role !== 'agricultor' ? `<button class="a-fab" data-cart-open aria-label="${T('Abrir cabaz', 'Open basket')}, ${count} ${T('artigos', 'items')}">${icon('basket', 26)}${count ? `<span class="count">${count}</span>` : ''}</button>` : '';
  $('#app').innerHTML = `${NUVEM.banner()}${bar}<main id="main" class="a-main${scr.hero ? ' has-hero' : ''}${scr.noBar ? ' no-bar' : ''}${scr.bare ? ' bare' : ''}" tabindex="-1">${scr.html}</main>${fab}${nav}`;
  document.title = `Daqui | ${String(scr.title).replace(/<[^>]+>/g, '')}`;
  document.body.classList.toggle('a-has-buy', !!$('.a-buy'));
  tableCards(); setupRails(); if (scr.after) try { scr.after(); } catch (e) { console.warn(e); }
  if (appAnim && LOOK.anim && !matchMedia('(prefers-reduced-motion: reduce)').matches) { const m = $('#main'); m.classList.add('a-enter-' + appAnim); setTimeout(() => m.classList.remove('a-enter-' + appAnim), 400); }
  appAnim = '';
  if (typeof refreshBell === 'function') { const b = $('.a-hero [data-app-bell]'); if (b) b.outerHTML = appBell(currentUser()); }
  NATIVO.bars(!!$('.a-pdp-hero'));   // ícones escuros na barra de estado quando o topo do ecrã é claro
};
/* tabelas largas (painel de gestão) viram cartões no telemóvel: cada célula recebe o nome da coluna */
function tableCards() { $$('#main table.tbl').forEach(t => { const hs = $$('thead th', t).map(th => (th.firstChild ? th.firstChild.textContent : '').trim()); $$('tbody tr', t).forEach(tr => $$('td', tr).forEach((td, i) => { if (hs[i]) td.dataset.label = hs[i]; })); t.classList.add('a-cards'); }); }

/* ---------- navegação ---------- */
window.addEventListener('hashchange', () => {
  const h = location.hash;
  const tabRoot = isTabRoot(h.replace(/^#\//, '').split('?')[0]);
  if (appReplacing) { appStack[appStack.length - 1] = h; appReplacing = false; appAnim = 'fade'; }
  else if (appStack.length > 1 && appStack[appStack.length - 2] === h) { appStack.pop(); appAnim = 'back'; }
  else { appStack.push(h); appAnim = tabRoot ? 'fade' : 'fwd'; }
  if ($('#modal').classList.contains('on')) closeModal(); if ($('#drawer').classList.contains('on')) closeCart();
  render(); scrollTo(0, 0);
});
/* eventos das páginas do site reaproveitadas: PAGE passa a ser a página de onde veio o clique */
['click', 'change', 'input', 'submit'].forEach(ev => document.addEventListener(ev, e => {
  const w = e.target.closest && e.target.closest('[data-site-page]'); if (w) PAGE = w.dataset.sitePage;
  if (ev === 'click') {   /* âncoras do site (#id) dentro da app: deslizar até ao elemento, sem mudar de ecrã */
    const a = e.target.closest && e.target.closest('a[href^="#"]');
    if (a && !a.getAttribute('href').startsWith('#/')) { e.preventDefault(); const el = document.getElementById(a.getAttribute('href').slice(1)); if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.classList.add('a-flash'); setTimeout(() => el.classList.remove('a-flash'), 1600); } }
  }
}, true));
afterLogin = function () {
  const pending = store.get('daqui-pending-sub', null);
  if (NEXT.startsWith('subscricao/') && pending) return go(NEXT, 'retomar=1');
  NATIVO.pushStart();
  if (NEXT && NEXT !== 'conta') return go(NEXT);
  location.hash = '#/' + roleHome();
};
const _setLang = setLang;
setLang = function (l) { _setLang(l); NATIVO.pushLanguage(); };

/* ---------- eventos ---------- */
PAGE_EVENTS.click.push((e, t, d) => {
  if ('appBack' in d) { appBack(); return true; }
  if ('appRefresh' in d) { if (NUVEM.on) NUVEM.refresh(); toast(T('A atualizar…', 'Refreshing…')); return true; }
  if (d.introLang) { store.set('daqui-lang', d.introLang); lang = d.introLang; introStep = 1; render(); return true; }
  if ('introNext' in d) { introStep++; render(); return true; }
  if ('introEnd' in d) { store.set(INTRO_KEY, true); introStep = 0; appReplace(d.introEnd === 'entrar' ? '#/entrar' : '#/' + roleHome()); return true; }
  if ('lfOpen' in d) { openModal(lojaFilters(), T('Filtros', 'Filters')); $('#modal .box').classList.add('a-sheet'); return true; }
  if ('lfReset' in d) { ['cats', 'avail', 'modes', 'regions'].forEach(k => lf[k].clear()); lf.min = 0; lf.max = 10; lojaCat = 'tudo'; if ($('#modal').classList.contains('on')) $('#modal .box').innerHTML = $('[data-modal-close]', $('#modal')).outerHTML + lojaFilters(); lojaRefresh(); return true; }
  if (d.lojaCat) { lojaCat = d.lojaCat; rerenderKeep(`[data-loja-cat="${d.lojaCat}"]`); return true; }
  if (d.mapa) { mapaV = d.mapa; history.replaceState(null, '', '#/mapa?v=' + d.mapa); render(); return true; }
  if ('appLocate' in d) { askPosition(); return true; }
  if (d.detSize) { detSize = d.detSize; rerenderKeep(`[data-det-size="${d.detSize}"]`); return true; }
  if (d.detQty) { const st = qtyStep(P(detFor)); detQty = Math.max(st, Math.min(st * 40, round2(detQty + +d.detQty * st))); rerenderKeep(`[data-det-qty="${d.detQty}"]`); return true; }
  if (d.detBio) { detBio = d.detBio === '1'; rerenderKeep(`[data-det-bio="${d.detBio}"]`); return true; }
  if (d.detAdd) { const p = P(d.detAdd); addToCart(p.id, p.cat === 'caixas' ? { size: detSize } : { bio: detBio }, detQty); detQty = 1; const f = $('.a-fab'); if (f) { f.classList.remove('bump'); void f.offsetWidth; f.classList.add('bump'); } return true; }
  if (d.appManage) { showOrder('order', findOrder(d.appManage), false); return true; }
  if (d.appReorder) { const o = findOrder(d.appReorder); o.items.forEach(i => { const p = P(i.id); if (p && (available(p) || p.cat === 'caixas')) addToCart(i.id, i.size ? { size: i.size } : { bio: !!i.bio }, i.qty); }); openCart(); return true; }
  if ('swipeKnob' in d && e.detail === 0) { confirmPickup(d.swipeKnob); return true; }   // teclado: Enter/Espaço no botão
  if ('photoTake' in d) { NATIVO.photo(d.photoTake).then(blob => { if (blob) setPhoto(blob); }).catch(err => { if (!/cancel/i.test(String(err))) toast(T('Não foi possível usar a câmara.', 'The camera could not be used.')); }); return true; }
  if ('photoRm' in d) { setPhoto(null); return true; }
  if ('pushOn' in d) { NATIVO.pushStart(true).then(() => rerenderKeep()); return true; }
});
PAGE_EVENTS.input.push((e, t) => { if (t.id === 'a-q') { lojaQ = t.value; const y = scrollY; render(); scrollTo(0, y); const i = $('#a-q'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); } });
PAGE_EVENTS.change.push((e, t) => {
  if (t.id === 'ai-file' && t.files[0]) setPhoto(t.files[0]);
  if (t.dataset.lf) { const s = lf[t.dataset.lf]; t.checked ? s.add(t.value) : s.delete(t.value); lojaRefresh(); }
});
PAGE_EVENTS.input.push((e, t) => {
  if (!t.dataset.lfRange) return;
  lf[t.dataset.lfRange] = +t.value;
  if (lf.min > lf.max) { if (t.dataset.lfRange === 'min') { lf.max = lf.min; $('#lf-max').value = lf.max; } else { lf.min = lf.max; $('#lf-min').value = lf.min; } }
  $('#lf-pv').textContent = `${money(lf.min)} – ${money(lf.max)}`; lojaRefresh();
});
PAGE_EVENTS.submit.push((e, f) => {
  if (!f.matches('[data-app-incident]')) return;
  e.preventDefault(); if (!validate(f)) return true;
  const o = findOrder(f.dataset.appIncident), btn = $('button[type="submit"]', f); btn.disabled = true;
  const send = photo => {
    const r = addRequest('incidencia', { product: $('#ai-prod').value, what: $('#ai-what').value.trim(), remedy: $('input[name="ai-pref"]:checked').value, photo }, { order: o.num });
    setPhoto(null);
    $('#main').innerHTML = `<div class="a-pad"><div class="a-done">${icon('check', 34)}<h2>${T('Problema comunicado', 'Problem reported')}</h2><p>${T('Referência', 'Reference')} <b>${r.id}</b>. ${T('A equipa responde em 24 horas úteis.', 'The team replies within one working day.')}</p><a class="a-big-btn" href="#/encomenda/${o.num}">${T('Voltar à encomenda', 'Back to the order')}</a></div></div>`;
  };
  if (incPhoto && NUVEM.on) NUVEM.uploadPhoto(incPhoto, (incPhoto.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg')).then(send, err => { console.error(err); toast(T('A fotografia não foi enviada; o problema segue sem ela.', 'The photo was not sent; the report goes without it.')); send(''); });
  else send(incPhoto ? (incPhoto.name || 'foto.jpg') : '');
  return true;
});
function setPhoto(blob) { if (incPhotoUrl) URL.revokeObjectURL(incPhotoUrl); incPhoto = blob; incPhotoUrl = blob ? URL.createObjectURL(blob) : ''; const what = $('#ai-what')?.value || ''; rerenderKeep(); if ($('#ai-what')) $('#ai-what').value = what; }

/* deslizar para confirmar o levantamento */
function confirmPickup(num) {
  const o = findOrder(num); if (!o || !canSwipe(o)) return;
  o.stage = STAGE_DONE; saveOrders();
  toast(T('Levantamento confirmado. Bom proveito!', 'Collection confirmed. Enjoy!')); rerenderKeep();
}
document.addEventListener('pointerdown', e => {
  const knob = e.target.closest('.a-swipe-knob'); if (!knob) return;
  const track = knob.parentElement, max = track.clientWidth - knob.offsetWidth - 8, x0 = e.clientX; let dx = 0;
  knob.setPointerCapture(e.pointerId); track.classList.add('dragging');
  const move = ev => { dx = Math.max(0, Math.min(max, ev.clientX - x0)); knob.style.transform = `translateX(${dx}px)`; track.style.setProperty('--p', (dx / max).toFixed(2)); };
  const up = () => { knob.removeEventListener('pointermove', move); knob.removeEventListener('pointerup', up); knob.removeEventListener('pointercancel', up); track.classList.remove('dragging');
    if (dx >= max * 0.85) { knob.style.transform = `translateX(${max}px)`; playSound('pickup'); confirmPickup(knob.dataset.swipeKnob); } else { knob.style.transform = ''; track.style.setProperty('--p', 0); } };
  knob.addEventListener('pointermove', move); knob.addEventListener('pointerup', up); knob.addEventListener('pointercancel', up);
});

/* ---------- arranque ---------- */
document.addEventListener('DOMContentLoaded', () => {
  $('#drawer').setAttribute('inert', '');
  $('#app').innerHTML = `<div class="loading-page" role="status"><img src="${LOGO_GOLD}" alt="Daqui" width="140"><p>${T('A carregar…', 'Loading…')}</p></div>`;
  const first = () => { APP_READY = true; if (!NUVEM.on) loadLocalExtras(); applyLook(); render(); setTimeout(promoPopup, LOOK.anim ? 2300 : 600); window.__daquiPronto = true; const f = document.querySelector('#daqui-falha[data-tipo="espera"]'); if (f) f.remove(); NATIVO.ready(); };
  (NUVEM.configured ? NUVEM.start() : Promise.resolve()).then(first, first);
  if ('serviceWorker' in navigator && !NATIVO.isNative && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
});

/* ===================================================================================
   v11: sininho, definições (língua, aspeto e permissões), filtros do mapa, transições,
   animação de abertura, sons e janela de promoções
   =================================================================================== */
let appAnim = '', appRegion = 'all', appCuisine = 'all';
function appBell(u) {
  if (!u) return `<a class="a-hero-btn" href="#/definicoes" aria-label="${T('Definições', 'Settings')}">${icon('gear', 22)}</a>`;
  const n = unreadNotifs(u) + PROMOS.filter(p => p.public && promoValid(p) && !claimOf(u, p.id) && !myNotifs(u).some(x => x.promo === p.id)).length;
  return `<a class="a-hero-btn" href="#/notificacoes" data-app-bell aria-label="${T('Notificações', 'Notifications')}${n ? `, ${n} ${T('por ler', 'unread')}` : ''}">${icon('bell', 22)}${n ? `<span class="count">${n > 9 ? '9+' : n}</span>` : ''}</a>`;
}
function settingsRow() { return `<a class="a-row" href="#/definicoes"><span class="a-row-ic">${icon('gear', 20)}</span><span><b>${T('Definições', 'Settings')}</b><span class="muted small">${T('Língua, aspeto e permissões da app', 'Language, appearance and app permissions')}</span></span>${icon('chevR', 18)}</a>`; }
/* Colhe Connosco no início: cartão grande com o próximo dia */
function colheCard() {
  const next = HARVEST_DAYS.filter(d => d.date >= iso(today())).sort((a, b) => a.date.localeCompare(b.date)), d = next[0];
  const f = d ? F(d.farmer) : null, left = d ? Math.max(0, d.spots - harvestPeople(d.id)) : 0;
  return `<section class="a-sec"><a class="a-colhe" href="#/colhe">
    <span class="a-colhe-art">${farmSVG(5, d && d.crop ? d.crop : 'diospiro')}</span>
    <span class="a-colhe-b"><span class="a-colhe-tag">${icon('sprout', 16)} ${JTH()}</span>
      <b>${T('Venha colher connosco', 'Come and pick with us')}</b>
      ${d ? `<span>${slotLabel(d.date)}, ${esc(d.time)}${f ? ` · ${esc(f.farm)}` : ''}</span><span class="small">${esc(L(d.what))} · ${left} ${left === 1 ? T('lugar livre', 'spot left') : T('lugares livres', 'spots left')}</span>`
        : `<span class="small">${T('Novas datas em breve.', 'New dates soon.')}</span>`}
      <span class="a-colhe-cta">${next.length > 1 ? T(`Ver os ${next.length} dias`, `See all ${next.length} days`) : T('Inscrever-me', 'Sign me up')} ${icon('chevR', 16)}</span></span></a></section>`;
}
/* mapa (quintas): filtro por região, como no site */
function appRegionChips() {
  const regions = Object.keys(REGIONS).filter(r => FARMERS.some(f => f.region === r));
  return `<div class="a-chips" role="group" aria-label="${T('Filtrar por região', 'Filter by region')}">${[['all', T('Todas', 'All')]].concat(regions.map(r => [r, regionName(r)])).map(([k, n]) => `<button class="chip" data-app-region="${k}" aria-pressed="${appRegion === k}">${n}</button>`).join('')}</div>`;
}
const appRestOk = r => appCuisine === 'all' || (appCuisine === 'veg' ? restVeg(r) : appCuisine === 'vegan' ? restVegan(r) : cuisineOf(r) === appCuisine);
function appCuisineChips() {
  const used = CUISINES.filter(c => RESTAURANTS.some(r => cuisineOf(r) === c.id));
  return `<div class="a-chips" role="group" aria-label="${T('Filtrar por tipo de cozinha', 'Filter by cuisine')}">${[['all', T('Todos', 'All')], ['veg', T('Vegetariano', 'Vegetarian')], ['vegan', 'Vegan']].concat(used.map(c => [c.id, L(c)])).map(([k, n]) => `<button class="chip" data-app-cuisine="${k}" aria-pressed="${appCuisine === k}">${esc(n)}</button>`).join('')}</div>`;
}
/* sininho */
function scrNotificacoes(u) {
  return { title: T('Notificações', 'Notifications'), back: true, html: `<div class="a-pad a-bell">${notifListHTML(u)}</div>`, after: () => setTimeout(() => readNotifs(u), 1200) };
}
/* definições: língua, aspeto (mapa, animações, sons) e permissões da app */
let permState = null;
function scrDefinicoes(u) {
  const pr = permState || {};
  const st = v => v === 'granted' ? `<span class="status ativa">${T('Permitido', 'Allowed')}</span>` : v === 'denied' ? `<span class="status pausada">${T('Bloqueado', 'Blocked')}</span>` : `<span class="status prog">${T('Por decidir', 'Not set')}</span>`;
  if (!permState) setTimeout(() => NATIVO.permissions().then(p => { permState = p; if (/^#\/definicoes/.test(location.hash)) rerenderKeep(); }), 0);
  return { title: T('Definições', 'Settings'), back: true, html: `<div class="a-pad">
    <h2 class="a-h2">${T('Língua', 'Language')}</h2>
    <div class="a-menu"><div class="a-row"><span class="a-row-ic">${icon('globe', 20)}</span><span><b>${T('Língua da app', 'App language')}</b><span class="muted small">${T('Português ou inglês', 'Portuguese or English')}</span></span>${langToggle()}</div></div>
    <h2 class="a-h2">${T('Aspeto', 'Appearance')}</h2>
    <div class="a-menu"><label class="a-row"><span class="a-row-ic">${icon('layers', 20)}</span><span><b>${T('Animações', 'Animations')}</b><span class="muted small">${T('Deslizar entre ecrãs e animação de abertura', 'Slide between screens and opening animation')}</span></span><input type="checkbox" class="a-switch" data-look-anim${LOOK.anim ? ' checked' : ''}></label>
      <label class="a-row"><span class="a-row-ic">${icon('sound', 20)}</span><span><b>${T('Sons', 'Sounds')}</b><span class="muted small">${T('Ao confirmar um levantamento e ao receber notificações', 'When confirming a pick-up and receiving notifications')}</span></span><input type="checkbox" class="a-switch" data-look-sound${LOOK.sound !== false ? ' checked' : ''}></label></div>
    <h2 class="a-h2">${T('Mapa dos restaurantes', 'Restaurants map')}</h2>${lookMapChoices()}
    <h2 class="a-h2">${T('Permissões da app', 'App permissions')}</h2>
    <div class="a-menu">
      <button class="a-row" data-perm="push"><span class="a-row-ic">${icon('bell', 20)}</span><span><b>${T('Notificações', 'Notifications')}</b><span class="muted small">${T('Encomendas, promoções e lembretes', 'Orders, promotions and reminders')}</span></span>${st(pr.push)}</button>
      <button class="a-row" data-perm="location"><span class="a-row-ic">${icon('locate', 20)}</span><span><b>${T('Localização', 'Location')}</b><span class="muted small">${T('Distâncias aos pontos de recolha e restaurantes', 'Distances to pick-up points and restaurants')}</span></span>${st(pr.location)}</button>
      <button class="a-row" data-perm="camera"><span class="a-row-ic">${icon('camera', 20)}</span><span><b>${T('Câmara', 'Camera')}</b><span class="muted small">${T('Fotografias de incidências e de produtos', 'Photos for problem reports and products')}</span></span>${st(pr.camera)}</button></div>
    <p class="small muted mt-s">${T('Se uma permissão estiver bloqueada, mude-a nas definições do telemóvel: Aplicações → Daqui → Permissões.', 'If a permission is blocked, change it in your phone settings: Apps → Daqui → Permissions.')}</p>
    ${appHelpRows(false)}</div>` };
}
/* sons curtos (WebAudio, sem ficheiros): confirmar levantamento e notificação recebida com a app aberta */
let audioCtx = null;
function playSound(kind) {
  if (LOOK.sound === false) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const notes = kind === 'pickup' ? [[659.25, 0], [830.61, 0.09], [987.77, 0.18], [1318.5, 0.3]] : [[880, 0], [1174.7, 0.12]];
    notes.forEach(([f, t0]) => {
      const o = audioCtx.createOscillator(), g = audioCtx.createGain(), t = audioCtx.currentTime + t0;
      o.type = 'sine'; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.25, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
      o.connect(g); g.connect(audioCtx.destination); o.start(t); o.stop(t + 0.4);
    });
    if (navigator.vibrate) navigator.vibrate(kind === 'pickup' ? [30, 40, 30] : 20);
  } catch (e) {}
}
/* janela de promoção ao abrir a app (como nas apps de entregas): reclamar já ou mais tarde (fica no sininho) */
const PROMO_SEEN_KEY = 'daqui-promos-vistas';
function promoPopup() {
  const u = currentUser(); if (!u || roleOf(u) !== 'cliente') return;
  const seen = store.get(PROMO_SEEN_KEY, []), p = PROMOS.find(x => x.public && promoValid(x) && !claimOf(u, x.id) && !seen.includes(x.id)); if (!p) return;
  store.set(PROMO_SEEN_KEY, seen.concat(p.id).slice(-50));
  openModal(`<div class="mbody a-promo-pop"><span class="a-promo-ic">${icon(p.kind === 'portes' ? 'truck' : 'gift', 40)}</span><p class="a-promo-val">${promoLabel(p)}</p><h2>${esc(L(p.title))}</h2><p>${esc(L(p.text))}</p>
    <p class="small muted">${p.min ? T(`Em compras a partir de ${money(p.min)}. `, `On orders over ${money(p.min)}. `) : ''}${T('Válida até', 'Valid until')} ${fdate(parseISO(p.until), { day: 'numeric', month: 'long' })}.</p>
    <button class="a-big-btn" data-claim="${p.id}" data-promo-close>${T('Reclamar agora', 'Claim now')}</button><button class="a-big-btn ghost" data-modal-close>${T('Mais tarde (fica no sininho)', 'Later (it stays in the bell)')}</button></div>`, T('Promoção', 'Promotion'));
}
/* animação de abertura: a pera do logótipo sobre o verde da Daqui */
function splash() {
  if (!LOOK.anim || matchMedia('(prefers-reduced-motion: reduce)').matches || sessionStorage.getItem('daqui-splash')) return;
  try { sessionStorage.setItem('daqui-splash', '1'); } catch (e) {}
  const d = document.createElement('div'); d.className = 'a-splash'; d.setAttribute('aria-hidden', 'true');
  d.innerHTML = `<div class="a-splash-in"><svg class="a-splash-pear" viewBox="0 0 120 150"><path class="sp-body" d="M60 30c-9 0-14 9-14 20 0 9-4 14-11 22-7 9-10 18-10 28 0 22 16 38 35 38s35-16 35-38c0-10-3-19-10-28-7-8-11-13-11-22 0-11-5-20-14-20z"/><path class="sp-stem" d="M60 31c0-8 2-15 7-21"/><path class="sp-leaf" d="M64 18c9-9 22-9 28-4-6 9-19 12-28 4z"/></svg><img src="${LOGO_GOLD}" alt="" class="a-splash-logo"></div>`;
  document.body.appendChild(d);
  setTimeout(() => d.classList.add('out'), 1500); setTimeout(() => d.remove(), 2100);
}
splash();
PAGE_EVENTS.click.push((e, t, d) => {
  if (PAGE_DOC !== 'app') return;
  if (d.appRegion) { appRegion = d.appRegion; rerenderKeep(`[data-app-region="${d.appRegion}"]`); return true; }
  if (d.appCuisine) { appCuisine = d.appCuisine; rerenderKeep(`[data-app-cuisine="${d.appCuisine}"]`); return true; }
  if ('promoClose' in d) { setTimeout(closeModal, 50); return; }
  if (d.perm) { NATIVO.askPermission(d.perm).then(() => NATIVO.permissions()).then(p => { permState = p; rerenderKeep(`[data-perm="${d.perm}"]`); }, () => toast(T('Não foi possível pedir a permissão.', 'Could not request the permission.'))); return true; }
});
PAGE_EVENTS.change.push((e, t) => {
  if (t.matches('[data-look-sound]')) { setLook({ sound: t.checked }); if (t.checked) playSound('notif'); return true; }
});

/* conta do agricultor: propostas, vendas e perfil da quinta ficam aqui (a barra de baixo tem só 4 separadores) */
function farmerContaRows(u) {
  const nProp = REQUESTS.filter(r => r.partnerUser === u.username && r.status === 'novo').length;
  return `<div class="a-menu">
    <a class="a-row" href="#/p/propostas"><span class="a-row-ic">${icon('inbox', 20)}</span><span><b>${T('Propostas e pedidos', 'Proposals and requests')}</b><span class="muted small">${nProp ? T(`${nProp} à espera de resposta`, `${nProp} awaiting reply`) : T('Produtos novos e outros pedidos à Daqui', 'New products and other requests to Daqui')}</span></span>${icon('chevR', 18)}</a>
    <a class="a-row" href="#/p/pagamentos"><span class="a-row-ic">${icon('receipt', 20)}</span><span><b>${T('Vendas e pagamentos', 'Sales and payments')}</b><span class="muted small">${T('Notas de pagamento em PDF', 'Payment notes as PDF')}</span></span>${icon('chevR', 18)}</a>
    <a class="a-row" href="#/p/perfil"><span class="a-row-ic">${icon('tractor', 20)}</span><span><b>${T('Perfil da quinta', 'Farm profile')}</b><span class="muted small">${T('Nome, região, posição no mapa e foto de capa', 'Name, region, map position and cover photo')}</span></span>${icon('chevR', 18)}</a></div>`;
}

/* sininho na barra de cima (gestão, agricultor e restaurante também recebem avisos) */
function appBarBell(u) { const n = unreadNotifs(u); return `<a class="a-bar-btn a-bar-bell" href="#/notificacoes" aria-label="${T('Notificações', 'Notifications')}${n ? `, ${n} ${T('por ler', 'unread')}` : ''}">${icon('bell', 22)}${n ? `<span class="count">${n > 9 ? '9+' : n}</span>` : ''}</a>`; }
