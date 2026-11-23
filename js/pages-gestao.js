/* ===== Daqui — painel da conta de gestão (aparece em /conta quando entra a conta "gestao") =====
   Separadores: Pedidos, Encomendas, Catálogo, Caixas, Colhe Connosco, Subscrições, Exportar.
   As alterações ao catálogo usam saveCatalog() (js/catalogo.js): ficam neste navegador até serem
   exportadas para js/alteracoes.js. */
const REQ_TYPES = () => ({ selo: T('Pedido de Selo Daqui', 'Daqui seal application'), agricultor: T('Adesão de agricultor', 'Farmer sign-up'), produto: T('Proposta de produto', 'Product proposal'),
  colhe: T('Proposta de Colhe Connosco', 'Join the Harvest proposal'), frio: T('Armazenamento em frio', 'Cold storage'), gerir: T('Gerir encomenda', 'Manage order'), seguimento: T('Seguimento', 'Tracking'),
  incidencia: T('Incidência', 'Problem report'), contacto: T('Mensagem', 'Message'), fundador: T('Membro fundador', 'Founding member') });
const ADMIN_TABS = ['pedidos', 'mensagens', 'encomendas', 'preparar', 'inventario', 'catalogo', 'caixas', 'parceiros', 'colhe', 'subscricoes', 'promocoes', 'contas', 'definicoes', 'exportar'];
const ADMIN_EXTRA = {};   // separadores acrescentados em js/pages-gestao2.js: { chave: [nome(), desenhar()] }
let adminTab = ADMIN_TABS.includes(QS.get('tab')) ? QS.get('tab') : 'pedidos';
let inboxFilter = 'novo', catQuery = '', catFilter = 'all', accFilter = 'all', inboxFrom = iso(addDays(today(), -7)), inboxTo = iso(today());
const monthOpts = sel => Array.from({ length: 12 }, (_, i) => `<option value="${i + 1}"${+sel === i + 1 ? ' selected' : ''}>${monthName(i + 1, 'short')}</option>`).join('');
const UNIT_OPTS = sel => [['kg', 'kg'], ['un', T('unidade', 'each')], ['molho', T('molho', 'bunch')], ['cuv', T('cuvete', 'punnet')]].map(([v, n]) => `<option value="${v}"${sel === v ? ' selected' : ''}>${n}</option>`).join('');

function adminPanel() {
  const clients = Object.values(USERS).filter(x => x.role !== 'admin');
  const subs = clients.flatMap(c => (c.subs || []).map(s => ({ c, s })));
  const nNew = REQUESTS.filter(r => r.status === 'novo').length;
  const nMsg = typeof chatUnread === 'function' ? chatUnread() : 0;
  const names = { pedidos: T('Pedidos e avisos', 'Requests'), mensagens: T('Mensagens', 'Messages'), encomendas: T('Encomendas', 'Orders'), catalogo: T('Catálogo', 'Catalogue'), caixas: T('Caixas e preços', 'Boxes and prices'), colhe: JTH(), subscricoes: T('Subscrições', 'Subscriptions'), contas: T('Contas', 'Accounts'), exportar: T('Guardar alterações', 'Save changes') };
  Object.entries(ADMIN_EXTRA).forEach(([k, [n]]) => { names[k] = n(); });
  localPrepNotice();
  const body = (Object.assign({ pedidos: tabPedidos, mensagens: tabMensagens, encomendas: tabEncomendas, catalogo: tabCatalogo, caixas: tabCaixas, colhe: tabColhe, subscricoes: tabSubs, contas: tabContas, exportar: tabExportar }, Object.fromEntries(Object.entries(ADMIN_EXTRA).map(([k, v]) => [k, v[1]])))[adminTab] || tabPedidos)();
  return `<section class="acc-sec"><div class="row-between"><h2>${T('Painel de gestão', 'Management panel')}</h2>${NUVEM.badge()}</div>
    <div class="kpis"><div><strong>${nNew}</strong><span>${T('pedidos novos', 'new requests')}</span></div><div><strong>${ORDERS.filter(o => orderStage(o) < STAGE_DONE).length}</strong><span>${T('encomendas por entregar', 'orders to deliver')}</span></div><div><strong>${subs.filter(x => x.s.status === 'ativa').length}</strong><span>${T('subscrições ativas', 'active subscriptions')}</span></div><div><strong>${clients.length}</strong><span>${T('contas registadas', 'registered accounts')}</span></div></div>
    <nav class="admin-tabs" role="tablist" aria-label="${T('Secções do painel', 'Panel sections')}">${ADMIN_TABS.map(k => `<button role="tab" data-admin-tab="${k}" aria-selected="${adminTab === k}">${names[k]}${k === 'pedidos' && nNew ? ` <span class="count-in">${nNew}</span>` : ''}${k === 'mensagens' && nMsg ? ` <span class="count-in">${nMsg}</span>` : ''}${k === 'exportar' && catalogChangeCount() ? ` <span class="count-in">${catalogChangeCount()}</span>` : ''}</button>`).join('')}</nav></section>
  ${body}`;
}

/* ---------- Pedidos ---------- */
/* pedidos de parceiros (adesões, selo, produtos, dias Colhe Connosco): Aprovar e publicar, Rejeitar ou só Marcar como tratado,
   com uma mensagem opcional que o parceiro vê na sua conta e recebe na notificação do telemóvel */
const PARTNER_REQ = ['agricultor', 'selo', 'produto', 'colhe'];
const decisionOf = r => r.decision || (r.approved ? 'aprovado' : '');
function canApprove(r) { return !decisionOf(r) && r.partnerUser && USERS[r.partnerUser] && PARTNER_REQ.includes(r.type); }
function approveLabel(r) { return { agricultor: T('Põe a quinta no mapa e abre a área do agricultor.', 'Adds the farm to the map and opens the farmer area.'), selo: T('Atribui o selo e põe o restaurante no mapa.', 'Awards the seal and puts the restaurant on the map.'), produto: T('Publica o produto na loja (ou junta o agricultor a um produto que já existe).', 'Publishes the product in the shop (or adds the farmer to an existing product).'), colhe: T('Cria o dia e abre as inscrições.', 'Creates the day and opens sign-ups.') }[r.type]; }
function decisionBadge(r) { const d = decisionOf(r); return d === 'aprovado' ? `<span class="status ativa">${T('Aprovado', 'Approved')}</span>` : d === 'rejeitado' ? `<span class="status pausada">${T('Rejeitado', 'Rejected')}</span>` : ''; }
/* produtos com o mesmo nome (sem contar "biológico"): sugestões para juntar */
function similarProducts(name) {
  const b = baseName(name || ''); if (!b) return [];
  return PRODUCTS.filter(p => p.cat !== 'caixas').filter(p => { const x = baseName(p.name.pt); return x === b || x.startsWith(b + ' ') || b.startsWith(x + ' '); });
}
function mergeChoice(r) {
  const f = r.fields || {}; if (r.type !== 'produto' || f.productId || !canApprove(r)) return '';
  const sim = similarProducts(f.namePt), others = PRODUCTS.filter(p => p.cat !== 'caixas' && !sim.includes(p)).sort((a, b) => L(a.name).localeCompare(L(b.name)));
  return `<div class="field mt-s"><label for="rq-merge-${r.id}">${T('Este produto já existe na loja?', 'Is this product already in the shop?')}</label>
    <select id="rq-merge-${r.id}"><option value="">${T('Não: criar um produto novo', 'No: create a new product')}</option>${sim.length ? `<optgroup label="${T('Parecidos', 'Similar')}">${sim.map((p, i) => `<option value="${p.id}"${i === 0 ? ' selected' : ''}>${esc(L(p.name))}</option>`).join('')}</optgroup>` : ''}<optgroup label="${T('Todos', 'All')}">${others.map(p => `<option value="${p.id}">${esc(L(p.name))}</option>`).join('')}</optgroup></select>
    <span class="small muted">${T('Se escolher um produto, o agricultor passa a ser mais um produtor dele, ao preço da Daqui.', 'If you pick a product, the farmer becomes one more producer of it, at the Daqui price.')}</span></div>`;
}
function tabPedidos() {
  const types = REQ_TYPES(), all = REQUESTS.slice().sort((a, b) => b.created.localeCompare(a.created)), labels = REQ_LABELS();
  const inR = r => { const d = String(r.created).slice(0, 10); return d >= inboxFrom && d <= inboxTo; };
  const counts = k => { const a = all.filter(inR); return k === 'novo' ? a.filter(r => r.status === 'novo').length : k === 'all' ? a.length : a.filter(r => r.type === k).length; };
  const inRange = r => { const d = String(r.created).slice(0, 10); return d >= inboxFrom && d <= inboxTo; };
  const shown = all.filter(inRange).filter(r => inboxFilter === 'all' ? true : inboxFilter === 'novo' ? r.status === 'novo' : r.type === inboxFilter);
  const who = r => { const uu = r.user && USERS[r.user]; return uu ? `${esc(uu.name)} (${esc(uu.username)})` : esc(r.fields?.name || r.fields?.person || T('Visitante sem conta', 'Guest')); };
  const card = r => `<article class="req${r.status === 'novo' ? ' is-new' : ''}">
    <div class="row-between"><div class="row-gap"><span class="rtype t-${r.type}">${types[r.type] || r.type}</span><b>${r.id}</b>${r.order ? `<span class="small">${T('Encomenda', 'Order')} ${r.order}</span>` : ''}${decisionBadge(r)}</div>
      <span class="small muted">${fdate(r.created, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span></div>
    <p class="small mt-s">${T('De', 'From')}: ${who(r)}</p>
    <dl class="req-f">${Object.entries(r.fields || {}).map(([k, v]) => `<div><dt>${esc(labels[k] || k)}</dt><dd>${k === 'photo' && /^(https?:\/\/|data:image\/)/.test(v) ? `<a href="${esc(v)}" target="_blank" rel="noopener"><img class="req-photo" src="${esc(v)}" alt="${r.type === 'produto' ? T('Fotografia do produto', 'Product photo') : T('Fotografia da incidência', 'Problem photo')}"></a>` : k === 'icon' && v ? `<img class="req-photo icon" src="${R}img/produtos/${esc(v)}.svg" alt="">` : esc(reqValue(k, v))}</dd></div>`).join('')}</dl>
    ${r.reply ? `<p class="note small mt-s">${icon('inbox', 18)}<span><b>${T('Mensagem enviada ao parceiro', 'Message sent to the partner')}:</b> ${esc(r.reply)}</span></p>` : ''}
    ${canApprove(r) ? `${mergeChoice(r)}<div class="field mt-s"><label for="rq-msg-${r.id}">${T('Mensagem para o parceiro (opcional)', 'Message to the partner (optional)')}</label><textarea id="rq-msg-${r.id}" rows="2" placeholder="${T('Aparece na conta do parceiro e na notificação do telemóvel.', 'Shows in the partner\'s account and in the phone notification.')}"></textarea></div>
      <p class="small muted">${approveLabel(r)}</p>` : ''}
    <div class="row-btns">${canApprove(r) ? `<button class="btn btn-green btn-sm" data-approve="${r.id}">${icon('check', 16)}${T('Aprovar e publicar', 'Approve and publish')}</button><button class="btn btn-line btn-sm c-tomato" data-reject="${r.id}">${icon('close', 16)}${T('Rejeitar', 'Reject')}</button>` : ''}
      <button class="btn btn-line btn-sm ${r.status === 'novo' ? 'c-campo' : ''}" data-req-toggle="${r.id}">${r.status === 'novo' ? T('Marcar como tratado', 'Mark as handled') : T('Reabrir', 'Reopen')}</button></div></article>`;
  return `<section class="acc-sec"><h2>${T('Pedidos e avisos', 'Requests and alerts')}</h2>
    <p class="muted mt-s">${T('Tudo o que é submetido no site: pedidos de selo, adesões de agricultores e restaurantes, propostas de produtos e de dias Colhe Connosco, incidências, gestão e seguimento de encomendas, mensagens e membros fundadores.', 'Everything submitted on the site: seal and farmer applications, product and Join the Harvest proposals, problem reports, order management and tracking, messages and founding members.')}</p>
    <div class="chips mt-s mb-s" role="group" aria-label="${T('Filtrar pedidos', 'Filter requests')}">${[['novo', T('Novos', 'New')], ['all', T('Todos', 'All')], ...Object.entries(types)].map(([k, n]) => `<button class="chip" data-inbox="${k}" aria-pressed="${inboxFilter === k}">${n} <span class="small muted">${counts(k)}</span></button>`).join('')}</div>
    <form class="range-row" data-inbox-range><span class="lbl">${T('Mostrar de', 'Show from')}</span><label class="sr" for="ib-from">${T('Início', 'Start')}</label><input type="date" id="ib-from" value="${inboxFrom}" max="${inboxTo}">
      <span class="lbl">${T('a', 'to')}</span><label class="sr" for="ib-to">${T('Fim', 'End')}</label><input type="date" id="ib-to" value="${inboxTo}" min="${inboxFrom}">
      <button type="button" class="chip" data-inbox-days="7" aria-pressed="${inboxFrom === iso(addDays(today(), -7)) && inboxTo === iso(today())}">${T('Últimos 7 dias', 'Last 7 days')}</button><button type="button" class="chip" data-inbox-days="30">${T('30 dias', '30 days')}</button><button type="button" class="chip" data-inbox-days="365">${T('Um ano', 'One year')}</button></form>
    <div class="inbox">${shown.length ? shown.map(card).join('') : `<p class="muted">${T('Nada neste intervalo.', 'Nothing in this date range.')}</p>`}</div></section>`;
}
function uniqueId(base, list) { let id = slugify(base) || 'novo', n = 2; while (list.some(x => x.id === id)) id = `${slugify(base)}-${n++}`; return id; }
/* produtos com vários produtores: grava a lista de produtores e o que depende dela */
function saveOffers(p, offers, extra = {}) {
  const o = Object.assign({ producers: offers, organic: offers.some(x => x.organic), outOfStock: !offers.length || offers.every(x => x.outOfStock), farmer: p.farmer && offers.some(x => x.farmer === p.farmer) ? p.farmer : offers.length ? offers[0].farmer : null }, extra);
  saveCatalog(ch => { ch.products = ch.products || {}; ch.products[p.id] = Object.assign(ch.products[p.id] || {}, o); });
}
/* mais um produtor (convencional ou biológico) num produto que já existe */
function addOffer(p, fid, organic) {
  const offers = offersOf(p).map(o => Object.assign({}, o));
  if (offers.some(o => o.farmer === fid && !!o.organic === !!organic)) return false;
  const extra = {};
  if (offersOf(p).length && !hasConv(p) && !organic) extra.price = round2(p.price / (1 + BIO_EXTRA));   // era só biológico: o preço passa a ser o do convencional
  offers.push({ farmer: fid, organic: !!organic });
  saveOffers(p, offers, extra); return true;
}
/* juntar produtos repetidos: "drop" passa a fazer parte de "keep" (produtores, favoritos, avisos; o endereço antigo continua a abrir) */
function mergeProducts(keep, drop) {
  if (!keep || !drop || keep === drop) return;
  const offers = offersOf(keep).map(o => Object.assign({}, o));
  offersOf(drop).forEach(o => { if (!offers.some(x => x.farmer === o.farmer && !!x.organic === !!o.organic)) offers.push(Object.assign({}, o)); });
  const price = hasConv(keep) ? keep.price : hasConv(drop) ? drop.price : keep.price;
  const aliases = [...new Set([...(keep.aliases || []), drop.id, ...(drop.aliases || [])])];
  const swap = l => [...new Set((l || []).map(x => (x === drop.id ? keep.id : x)))];
  Object.values(USERS).forEach(u => { u.favs = swap(u.favs); u.exclude = swap(u.exclude); u.notify = swap(u.notify); });
  if (NUVEM.on) {
    Object.assign(keep, { producers: offers, organic: offers.some(x => x.organic), price, aliases });
    const i = PRODUCTS.indexOf(drop); if (i >= 0) PRODUCTS.splice(i, 1);
    NUVEM.mergeProducts(keep.id, drop.id); return;
  }
  saveOffers(keep, offers, { price, aliases });
  saveCatalog(ch => { ch.removedProducts = [...new Set([...(ch.removedProducts || []), drop.id])]; if (ch.products) delete ch.products[drop.id]; ch.newProducts = (ch.newProducts || []).filter(x => x.id !== drop.id); });
  const i = PRODUCTS.indexOf(drop); if (i >= 0) PRODUCTS.splice(i, 1);
  saveUsers();
}
function duplicateGroups() {
  const items = PRODUCTS.filter(p => p.cat !== 'caixas'), g = {}, unit = p => p.unit || 'kg';
  items.forEach(p => { const k = baseName(p.name.pt) + '|' + unit(p); (g[k] = g[k] || []).push(p); });
  const groups = Object.values(g).filter(l => l.length > 1);
  /* um produto só biológico cujo nome é o início do nome de um único produto convencional (ex.: "Pera Rocha biológica" e "Pera Rocha do Oeste") */
  items.filter(p => hasBio(p) && !hasConv(p) && !groups.some(l => l.includes(p))).forEach(p => {
    const b = baseName(p.name.pt); if (b.split(' ').length < 2) return;
    const c = items.filter(x => x !== p && hasConv(x) && unit(x) === unit(p) && baseName(x.name.pt).startsWith(b + ' '));
    if (c.length === 1) groups.push([c[0], p]);
  });
  /* fica o mais antigo (o do catálogo original, com a sua página); o preço passa a ser o do convencional, se houver */
  return groups.map(l => l.slice().sort((a, b) => (!!a.isNew - !!b.isNew) || (PRODUCTS.indexOf(a) - PRODUCTS.indexOf(b)) || (hasConv(b) - hasConv(a))));
}
function rejectRequest(r, msg) {
  const u = r.partnerUser && USERS[r.partnerUser];
  if (u && u.partner && (r.type === 'agricultor' || r.type === 'selo')) { u.partner.rejected = true; u.partner.reply = msg || ''; saveUsers(); }
  Object.assign(r, { decision: 'rejeitado', reply: msg || '', decidedAt: nowISO(), status: 'tratado' }); saveRequests(); return true;
}
function approveRequest(r, msg = '') {
  const u = USERS[r.partnerUser], f = r.fields || {};
  if (r.type === 'agricultor') {
    const id = uniqueId(u.partner.farm, FARMERS), c = REGION_CENTER[u.partner.region] || REGION_CENTER.aveiro, j = () => (Math.random() - .5) * .3;
    const nf = { id, name: u.name, farm: u.partner.farm, place: u.partner.place, region: u.partner.region, lat: +(c[0] + j()).toFixed(3), lon: +(c[1] + j()).toFixed(3), since: new Date().getFullYear(), crop: 'alface', seed: Math.floor(Math.random() * 14),
      story: u.partner.story || { pt: `${u.partner.farm}, em ${u.partner.place}. Nova quinta parceira da Daqui.`, en: `${u.partner.farm} in ${u.partner.place}. A new Daqui partner farm.` } };
    if (ISLAND_REGIONS.includes(u.partner.region)) nf.island = u.partner.region;
    saveCatalog(ch => { ch.newFarmers = (ch.newFarmers || []).concat(nf); }); u.partner.farmerId = id; u.partner.approved = true;
  } else if (r.type === 'selo') {
    const id = uniqueId(u.partner.name, RESTAURANTS), y = new Date();
    const nr = { id, name: u.partner.name, lat: +(40.637 + Math.random() * .009).toFixed(4), lon: +(-8.659 + Math.random() * .013).toFixed(4), kind: { pt: u.partner.kind2 || 'Restaurante', en: u.partner.kind2 || 'Restaurant' }, area: { pt: u.partner.place, en: u.partner.place }, dish: { pt: 'Em breve', en: 'Coming soon' }, since: `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, '0')}` };
    Object.assign(nr, u.partner.draft || {}); delete u.partner.draft;
    saveCatalog(ch => { ch.newRestaurants = (ch.newRestaurants || []).concat(nr); }); u.partner.restId = id; u.partner.approved = true;
  } else if (r.type === 'produto') {
    const fid = u.partner.farmerId;
    if (!fid) { toast(T('Aprove primeiro a quinta deste agricultor.', 'Approve this farmer\'s farm first.')); return false; }
    /* pedidos antigos não têm o campo "organic": o nome diz se é biológico ("Pera Rocha biológica") */
    const organic = f.organic != null ? f.organic === 'sim' || f.organic === true : /biol[oó]gic|\bbio\b|organic/i.test(`${f.namePt || ''} ${f.nameEn || ''}`), sel = document.getElementById('rq-merge-' + r.id);
    const target = f.productId ? P(f.productId) : sel && sel.value ? P(sel.value) : null;
    if (target) { if (!addOffer(target, fid, organic)) toast(T(`${u.name} já vendia ${L(target.name)} (${bioName(organic).toLowerCase()}).`, `${u.name} already sold ${L(target.name)} (${bioName(organic).toLowerCase()}).`)); r.productId = target.id; }
    else {
      const [a, b] = String(f.season || '1-12').split('-').map(Number), id = uniqueId(f.namePt, PRODUCTS);
      const np = { id, cat: f.cat === 'legumes' ? 'legumes' : 'fruta', name: { pt: f.namePt, en: f.nameEn || f.namePt }, price: +f.price || 1, unit: f.unit || 'kg', farmer: fid, icon: f.icon || '_novo', season: [a || 1, b || 12], harvest: 2, essential: false, organic, producers: [{ farmer: fid, organic }], desc: { pt: f.desc || '', en: f.descEn || f.desc || '' } };
      if (f.photo && /^(https?:|data:image\/)/.test(f.photo)) np.photo = f.photo;
      saveCatalog(ch => { ch.newProducts = (ch.newProducts || []).concat(np); }); r.productId = id;
    }
  } else if (r.type === 'colhe') {
    if (!u.partner.farmerId) { toast(T('Aprove primeiro a quinta deste agricultor.', 'Approve this farmer\'s farm first.')); return false; }
    if (HARVEST_DAYS.some(d => d.date === f.date && d.farmer === u.partner.farmerId)) { toast(T('Esta quinta já tem um dia Colhe Connosco nessa data.', 'This farm already has a Join the Harvest day on that date.')); return false; }
    const p = P(f.product); const day = { id: newDayId(f.date, u.partner.farmerId), date: f.date, farmer: u.partner.farmerId, crop: p ? (p.art || 'alface') : 'alface', what: p ? { pt: p.name.pt, en: p.name.en } : { pt: f.product, en: f.product }, time: f.time || '10h–13h', spots: +f.spots || 20 };
    saveCatalog(ch => { ch.harvestDays = HARVEST_DAYS.map(d => Object.assign({}, d)).concat(day); });
  }
  if (u && u.partner && (r.type === 'agricultor' || r.type === 'selo')) { u.partner.rejected = false; u.partner.reply = msg || ''; }
  Object.assign(r, { approved: true, decision: 'aprovado', reply: msg || '', decidedAt: nowISO(), status: 'tratado' }); saveUsers(); saveRequests(); return true;
}

/* ---------- Encomendas ---------- */
function tabEncomendas() {
  const orders = ORDERS.slice().sort((a, b) => b.created.localeCompare(a.created)), stages = [...STAGES()];
  const val = o => o.status === 'cancelada' ? 'cancel' : typeof o.stage === 'number' ? String(o.stage) : 'auto';
  const auto = o => { const x = Object.assign({}, o, { stage: undefined, status: 'ativa' }); return stageName(x); };
  return `<section class="acc-sec"><h2>${T('Encomendas', 'Orders')}</h2>
    <p class="muted mt-s mb-s">${T('O estado muda sozinho conforme o dia de entrega ("Automático"). Pode também escolher o estado à mão: o cliente vê-o no seguimento e no histórico.', 'The status changes by itself according to the delivery day ("Automatic"). You can also set it by hand: the customer sees it in tracking and in their history.')}</p>
    <div class="tbl-wrap"><table class="tbl"><thead><tr><th>${T('Número', 'Number')}</th><th>${T('Cliente', 'Customer')}</th><th>${T('Entrega', 'Delivery')}</th><th>${T('Artigos', 'Items')}</th><th>Total</th><th>${T('Estado', 'Status')}</th></tr></thead><tbody>
    ${orders.map(o => `<tr><td><b>${o.num}</b><br><span class="small muted">${fdate(o.created)}</span></td><td>${esc(o.name)}${o.user ? '' : ` <span class="small muted">(${T('sem conta', 'guest')})</span>`}<br><span class="small muted">${esc(o.phone)}</span></td>
      <td>${o.deliver === 'home' ? `${T('Casa', 'Home')}: ${esc(o.address)}` : esc(o.point)}<br><span class="small muted">${slotLabel(o.slot)}${o.window ? ', ' + o.window : ''}</span></td>
      <td class="small">${o.items.map(itemText).join('<br>')}${boxPrefs(o)}${PREPS.filter(x => x.order === o.num).map(x => `<div class="prefs-mini">${icon('box', 14)} ${P(x.box) ? esc(L(P(x.box).name)) : ''}: ${x.items.map(i => P(i.id) ? esc(L(P(i.id).name)) : '').filter(Boolean).join(', ')}</div>`).join('')}</td><td>${money(o.total)}</td>
      <td><label class="sr" for="os-${o.num}">${T('Estado de', 'Status of')} ${o.num}</label><select id="os-${o.num}" class="sel sm" data-order-stage="${o.num}">
        <option value="auto"${val(o) === 'auto' ? ' selected' : ''}>${T('Automático', 'Automatic')} (${auto(o)})</option>${stages.map((n, i) => `<option value="${i}"${val(o) === String(i) ? ' selected' : ''}>${o.deliver === 'home' ? n : STAGES_PICK()[i]}</option>`).join('')}<option value="cancel"${val(o) === 'cancel' ? ' selected' : ''}>${T('Cancelada', 'Cancelled')}</option></select></td></tr>`).join('')}
    </tbody></table></div>${subBoxesAdmin()}</section>`;
}

/* preferências do cliente nas encomendas com caixas: as guardadas na encomenda ou, se não houver, as atuais da conta */
function prefsLines(prefs) {
  const names = l => (l || []).map(P).filter(Boolean).map(p => esc(L(p.name))).join(', ');
  const ex = names(prefs.exclude), fv = names(prefs.favs);
  return `<div class="prefs-mini"><span class="c-tomato"><b>${T('Não incluir', 'Leave out')}:</b> ${ex || T('nada', 'nothing')}</span><br><span><b>${T('Favoritos', 'Favourites')}:</b> ${fv || T('nenhum', 'none')}</span></div>`;
}
function boxPrefs(o) {
  if (!o.items.some(i => P(i.id) && P(i.id).cat === 'caixas')) return '';
  const u = o.user && USERS[o.user], prefs = o.prefs || (u ? { exclude: u.exclude, favs: u.favs } : null);
  return prefs ? prefsLines(prefs) : `<div class="prefs-mini muted">${T('Cliente sem conta: sem preferências', 'Guest customer: no preferences')}</div>`;
}

/* ---------- Catálogo ---------- */
function catRows() {
  const q = norm(catQuery), ch = NUVEM.on ? {} : LOCAL_CHANGES.products || {}, newIds = NUVEM.on ? PRODUCTS.filter(p => p.isNew).map(p => p.id) : (LOCAL_CHANGES.newProducts || []).map(x => x.id);
  return PRODUCTS.filter(p => p.cat !== 'caixas').filter(p => !q || norm(`${p.name.pt} ${p.name.en} ${p.id}`).includes(q))
    .filter(p => catFilter === 'all' || p.cat === catFilter || (catFilter === 'changed' && (ch[p.id] || newIds.includes(p.id))) || (catFilter === 'nostock' && p.outOfStock))
    .map(p => { const [a, b] = p.season, sp = splitOf(p), changed = ch[p.id] || newIds.includes(p.id);
      return `<tr data-row="${p.id}"><td><div class="row-gap nowrap"><button type="button" class="thumb thumb-btn" data-cat-img="${p.id}" title="${T('Mudar a imagem', 'Change the picture')}" aria-label="${T('Mudar a imagem de', 'Change the picture of')} ${esc(L(p.name))}">${artFor(p)}<span class="thumb-ed">${icon('edit', 12)}</span></button><span><a href="${productHref(p)}">${esc(L(p.name))}</a> <button type="button" class="icon-btn sm" data-prod-edit="${p.id}" aria-label="${T('Editar nome e detalhes de', 'Edit name and details of')} ${esc(L(p.name))}" title="${T('Editar nome e detalhes', 'Edit name and details')}">${icon('edit', 14)}</button><br><span class="small muted">${p.id}${changed ? ` · <b class="c-campo">${T('alterado', 'edited')}</b>` : ''}${p.isNew ? ` · ${T('novo', 'new')}` : ''}</span><br><span class="small">${offersOf(p).map(o => `${esc((F(o.farmer) || { name: o.farmer }).name)} <span class="muted">(${o.organic ? 'bio' : T('conv.', 'conv.')}${o.outOfStock ? ', ' + T('sem stock', 'no stock') : ''})</span>`).join(', ')}</span></span></div></td>
        <td><input class="num" type="number" step="0.01" min="0" value="${p.price}" data-cat-edit="${p.id}" data-f="price" aria-label="${T('Preço de', 'Price of')} ${esc(L(p.name))}"><span class="small muted">${unitLabel(p.unit)}${hasBio(p) && hasConv(p) ? `<br>${T('convencional; biológico', 'conventional; organic')} ${money(variantPrice(p, true))}` : hasBio(p) ? `<br>${T('biológico', 'organic')}` : ''}</span></td>
        <td class="nowrap"><select class="sel sm" data-cat-edit="${p.id}" data-f="s0" aria-label="${T('Início da época', 'Season start')}">${monthOpts(a)}</select> – <select class="sel sm" data-cat-edit="${p.id}" data-f="s1" aria-label="${T('Fim da época', 'Season end')}">${monthOpts(b)}</select></td>
        <td class="nowrap">${['sp0', 'sp1', 'sp2'].map((f, i) => `<input class="num pct" type="number" min="0" max="100" value="${sp[i]}" data-cat-edit="${p.id}" data-f="${f}" aria-label="${[T('Agricultor', 'Farmer'), T('Conservação e embalamento', 'Storage and packing'), 'Daqui'][i]} %">`).join('')}</td>
        <td><label class="switch sm"><input type="checkbox" data-cat-edit="${p.id}" data-f="stock"${p.outOfStock ? ' checked' : ''}>${T('Fora de stock', 'Out of stock')}</label>${inSeason(p) ? '' : `<br><span class="small muted">${T('fora de época', 'out of season')}</span>`}</td>
        <td>${newIds.includes(p.id) ? `<button class="rm" data-del-prod="${p.id}" aria-label="${T('Apagar', 'Delete')} ${esc(L(p.name))}">${icon('trash', 18)}</button>` : ''}</td></tr>`; }).join('');
}
function tabCatalogo() {
  return `<section class="acc-sec"><h2>${T('Catálogo de produtos', 'Product catalogue')}</h2>
    <p class="muted mt-s">${T('Altere preços, meses da época, a divisão do preço (agricultor / conservação e embalamento / Daqui, a somar 100%) e marque produtos da época como fora de stock. Cada alteração é aplicada logo no site, neste navegador.', 'Change prices, season months, the price split (farmer / storage and packing / Daqui, adding up to 100%) and mark in-season products as out of stock. Every change applies to the site straight away, in this browser.')}</p>
    <details class="panel mt"><summary class="lbl">${icon('plus', 18)} ${T('Adicionar produto novo', 'Add a new product')}</summary>
      <form class="form mt-s" data-newprod novalidate>
        <div class="row"><div class="field"><label for="np-pt">${T('Nome em português', 'Name in Portuguese')}</label><input id="np-pt" required></div><div class="field"><label for="np-en">${T('Nome em inglês', 'Name in English')}</label><input id="np-en" required></div></div>
        <div class="row"><div class="field"><label for="np-cat">${T('Categoria', 'Category')}</label><select id="np-cat"><option value="fruta">${T('Fruta', 'Fruit')}</option><option value="legumes">${T('Legumes', 'Vegetables')}</option></select></div>
          <div class="field"><label for="np-farmer">${T('Agricultor', 'Farmer')}</label><select id="np-farmer">${FARMERS.map(f => `<option value="${f.id}">${esc(f.name)} (${esc(f.place)})</option>`).join('')}</select></div></div>
        <div class="row"><div class="field"><label for="np-price">${T('Preço (€)', 'Price (€)')}</label><input id="np-price" type="number" step="0.01" min="0" required></div><div class="field"><label for="np-unit">${T('Unidade', 'Unit')}</label><select id="np-unit">${UNIT_OPTS('kg')}</select></div></div>
        <div class="row"><div class="field"><label for="np-s0">${T('Época: de', 'Season: from')}</label><select id="np-s0">${monthOpts(1)}</select></div><div class="field"><label for="np-s1">${T('até', 'to')}</label><select id="np-s1">${monthOpts(12)}</select></div></div>
        <div class="row"><div class="field"><label for="np-icon">${T('Ícone (ficheiro em img/produtos)', 'Icon (file in img/produtos)')}</label><div class="icon-pick"><span class="img-prev sm" id="np-prev"><img src="${R}img/produtos/_novo.svg" alt=""></span><select id="np-icon" data-icon-pick data-icon-prev="np-prev">${iconOptions('_novo')}</select></div>
          <label class="small" for="np-icon-f">${T('Ou escreva o nome do ficheiro (sem .svg)', 'Or type the file name (without .svg)')}</label><input id="np-icon-f" class="sel" data-icon-free="np-icon" placeholder="pessego-paraguaio" autocomplete="off"></div>
          <div class="field"><span class="lbl">${T('Etiquetas', 'Tags')}</span><label class="switch sm"><input type="checkbox" id="np-ess">${T('Essencial', 'Essential')}</label><label class="switch sm"><input type="checkbox" id="np-bio">${T('Biológico', 'Organic')}</label><span class="small muted">${T('Só biológico: indique o preço do biológico. O biológico custa mais 20% do que o convencional.', 'Organic only: enter the organic price. Organic costs 20% more than conventional.')}</span></div></div>
        <div class="row"><div class="field"><label for="np-dpt">${T('Descrição em português', 'Description in Portuguese')}</label><textarea id="np-dpt" rows="2"></textarea></div><div class="field"><label for="np-den">${T('Descrição em inglês', 'Description in English')}</label><textarea id="np-den" rows="2"></textarea></div></div>
        <p class="err" hidden></p><button class="btn btn-green" type="submit">${T('Adicionar ao catálogo', 'Add to catalogue')}</button>
      </form></details>
    ${dupPanel()}
    <div class="row-gap mt mb-s"><label class="sr" for="cat-q">${T('Procurar produto', 'Find a product')}</label><input id="cat-q" class="sel" type="search" placeholder="${T('Procurar produto…', 'Find a product…')}" value="${esc(catQuery)}" data-catq>
      <label class="sr" for="cat-f">${T('Filtro', 'Filter')}</label><select id="cat-f" class="sel" data-catf>${[['all', T('Todos', 'All')], ['fruta', T('Fruta', 'Fruit')], ['legumes', T('Legumes', 'Vegetables')], ['changed', NUVEM.on ? T('Produtos novos', 'New products') : T('Alterados neste navegador', 'Edited in this browser')], ['nostock', T('Fora de stock', 'Out of stock')]].map(([v, n]) => `<option value="${v}"${catFilter === v ? ' selected' : ''}>${n}</option>`).join('')}</select></div>
    <div class="tbl-wrap"><table class="tbl cat-tbl"><thead><tr><th>${T('Produto', 'Product')}</th><th>${T('Preço (€)', 'Price (€)')}</th><th>${T('Época', 'Season')}</th><th>${T('Divisão do preço (%)', 'Price split (%)')}<br><span class="small muted">${T('agricultor / frio / Daqui', 'farmer / cold / Daqui')}</span></th><th>Stock</th><th></th></tr></thead><tbody id="cat-body">${catRows()}</tbody></table></div></section>`;
}

function dupPanel() {
  const groups = duplicateGroups(); if (!groups.length) return '';
  return `<div class="panel mt"><h3>${icon('alert', 20)} ${T('Produtos repetidos', 'Duplicate products')}</h3>
    <p class="small muted">${T('Têm o mesmo nome (sem contar "biológico") e a mesma unidade. Ao juntar, os agricultores, favoritos e avisos passam para o primeiro e o cliente escolhe entre convencional e biológico.', 'They share the same name (ignoring "organic") and unit. Merging moves farmers, favourites and reminders to the first one, and customers choose between conventional and organic.')}</p>
    <ul class="hlist mt-s">${groups.map(l => `<li class="hrow"><span class="thumb">${artFor(l[0])}</span><div>${l.map((p, i) => `<b>${esc(L(p.name))}</b> <span class="small muted">(${p.id}${hasBio(p) ? ', ' + (hasConv(p) ? T('conv. e bio', 'conv. and organic') : 'bio') : ''})</span>${i < l.length - 1 ? ' + ' : ''}`).join('')}</div>
      <button class="btn btn-green btn-sm" data-merge="${l.map(p => p.id).join(',')}">${T('Juntar em', 'Merge into')} ${esc(L(l[0].name))}</button></li>`).join('')}</ul></div>`;
}

/* ---------- Caixas ---------- */
/* criar um tipo de caixa novo (ex.: frutos secos, aromáticas, fruta exótica): nome, produtos que pode levar e preço por tamanho */
let nbQuery = '', nbPick = new Set();
function nbList() {
  const q = norm(nbQuery);
  return ['fruta', 'legumes'].map(c => { const l = PRODUCTS.filter(p => p.cat === c && (!q || norm(`${p.name.pt} ${p.name.en}`).includes(q))).sort((a, b) => L(a.name).localeCompare(L(b.name)));
    return l.length ? `<fieldset class="nb-group"><legend>${catName(c)}</legend>${l.map(p => `<label class="nb-item"><input type="checkbox" value="${p.id}" data-nb-item${nbPick.has(p.id) ? ' checked' : ''}><span class="thumb">${artFor(p)}</span><span>${esc(L(p.name))}${inSeason(p) ? '' : ` <span class="small muted">(${T('fora de época', 'out of season')})</span>`}</span></label>`).join('')}</fieldset>` : ''; }).join('');
}
function newBoxForm() {
  const sz = [['P', 3, ''], ['M', 5, ''], ['G', 8, '']];
  return `<details class="panel mt"><summary class="lbl">${icon('plus', 18)} ${T('Criar uma caixa nova', 'Create a new box')}</summary>
    <form class="form mt-s" data-newbox novalidate>
      <p class="small muted">${T('Por exemplo: Caixa de Frutos Secos, Caixa de Aromáticas, Caixa de Fruta Exótica. A caixa aparece na loja, nas subscrições e na app; cada semana leva produtos da época escolhidos desta lista.', 'For example: Nuts Box, Herbs Box, Exotic Fruit Box. The box shows in the shop, subscriptions and the app; each week it carries seasonal products picked from this list.')}</p>
      <div class="row"><div class="field"><label for="nb-pt">${T('Nome em português', 'Name in Portuguese')}</label><input id="nb-pt" required placeholder="${T('Caixa de Frutos Secos', 'Caixa de Frutos Secos')}"></div><div class="field"><label for="nb-en">${T('Nome em inglês', 'Name in English')}</label><input id="nb-en" placeholder="Nuts Box"></div></div>
      <div class="row"><div class="field"><label for="nb-dpt">${T('Descrição em português', 'Description in Portuguese')}</label><textarea id="nb-dpt" rows="2"></textarea></div><div class="field"><label for="nb-den">${T('Descrição em inglês', 'Description in English')}</label><textarea id="nb-den" rows="2"></textarea></div></div>
      <fieldset class="plain"><legend class="lbl">${T('Tamanhos e preços', 'Sizes and prices')} <span class="small muted">(${T('o tamanho pequeno é obrigatório; deixe o preço vazio para não ter esse tamanho', 'the small size is required; leave the price empty to skip a size')})</span></legend>
        <div class="nb-sizes">${sz.map(([s, kg]) => `<div class="nb-size"><b>${sizeName(s)}</b><label class="field inl"><span class="lbl">kg</span><input class="num" type="number" min="0.1" step="0.1" id="nb-kg-${s}" value="${kg}"></label><label class="field inl"><span class="lbl">${T('Preço (€)', 'Price (€)')}</span><input class="num" type="number" min="0" step="0.10" id="nb-pr-${s}"${s === 'P' ? ' required' : ''}></label></div>`).join('')}</div></fieldset>
      <fieldset class="plain"><legend class="lbl">${T('Produtos que a caixa pode levar', 'Products the box can carry')} <span class="small muted" id="nb-count">(${nbPick.size} ${T('escolhidos', 'chosen')})</span></legend>
        <label class="sr" for="nb-q">${T('Procurar produto', 'Find a product')}</label><input id="nb-q" class="sel" type="search" placeholder="${T('Procurar produto…', 'Find a product…')}" value="${esc(nbQuery)}" data-nb-q>
        <div class="nb-list" id="nb-list">${nbList()}</div></fieldset>
      <p class="err" hidden></p><button class="btn btn-green" type="submit">${T('Criar caixa', 'Create box')}</button>
    </form></details>`;
}
function tabCaixas() {
  const subsOf = id => Object.values(USERS).flatMap(c => (c.subs || []).filter(s => s.box === id).map(s => ({ c, s })));
  return `<section class="acc-sec"><h2>${T('Caixas e preços das subscrições', 'Boxes and subscription prices')}</h2>
    <p class="muted mt-s">${T('Mude o preço atual de cada tamanho para testar o preço garantido: se subir, os subscritores continuam a pagar o preço guardado; se descer, passam a pagar o mais baixo e esse fica guardado.', 'Change the current price of each size to test the price guarantee: if it goes up, subscribers keep paying their saved price; if it goes down, they pay the lower price and it becomes their saved price.')}</p>
    ${newBoxForm()}
    ${allBoxes().map(b => { const list = subsOf(b.id); return `<div class="box-row">
      <div class="row-between"><div class="row-gap"><span class="thumb lg">${artFor(b)}</span><div><h3>${esc(L(b.name))}</h3>${b.custom ? `<span class="small muted">${T('Criada na gestão', 'Created by management')} · ${(b.items || []).length} ${T('produtos', 'products')}: ${(b.items || []).map(id => P(id)).filter(Boolean).slice(0, 6).map(x => esc(L(x.name))).join(', ')}${(b.items || []).length > 6 ? '…' : ''}</span>` : ''}</div></div>
        ${b.custom ? (list.length ? `<span class="small muted">${T('Tem subscritores: não pode ser apagada', 'Has subscribers: cannot be deleted')}</span>` : `<button class="btn btn-line btn-sm c-tomato" data-box-del="${b.id}">${icon('trash', 16)} ${T('Apagar caixa', 'Delete box')}</button>`) : ''}</div>
      <div class="row-gap mt-s">${BOX_SIZES[b.id].map(s => `<label class="field inl"><span class="lbl">${sizeName(s.s)}, ${s.kg} kg (€)</span><input class="num" type="number" step="0.10" min="0" value="${s.price}" data-box-price="${b.id}:${s.s}"></label>`).join('')}</div>
      ${boxEditor(b, list)}
      ${list.length ? `<table class="tbl mt-s"><thead><tr><th>${T('Subscritor', 'Subscriber')}</th><th>${T('Tamanho', 'Size')}</th><th>${T('Preço guardado', 'Saved price')}</th><th>${T('Preço atual', 'Current price')}</th><th>${T('Paga por caixa', 'Pays per box')}</th></tr></thead><tbody>${list.map(({ c, s }) => { refreshSub(s); const cur = boxCurrentPrice(s.box, s.size); return `<tr><td>${esc(c.name)}</td><td>${sizeName(s.size)}</td><td>${money(s.locked)}</td><td>${money(cur)}</td><td><b>${money(Math.min(cur, s.locked))}</b>${cur > s.locked ? ` <span class="small muted">(${T('poupa', 'saves')} ${money(cur - s.locked)})</span>` : ''}</td></tr>`; }).join('')}</tbody></table>` : `<p class="small muted mt-s">${T('Sem subscritores.', 'No subscribers.')}</p>`}
    </div>`; }).join('')}</section>`;
}

/* ---------- Colhe Connosco ---------- */
/* dias que já começaram: avaliações dos participantes e registo da colheita de cada um */
function harvestDoneCard(d) {
  const f = F(d.farmer), list = harvestList(d.id), sm = harvestSummary(d.id), past = harvestPast(d), key = d.id, pr = dayProduct(d);
  const rid = un => `${key}-${un}`.replace(/[^a-zA-Z0-9-]/g, '_');
  return `<article class="panel mt-s"><div class="row-between"><div><b>${slotLabel(d.date)}</b>, ${d.time}<br><span class="small muted">${f ? esc(f.farm) : d.farmer} · ${esc(L(d.what))}</span></div>
      <span class="status ${past ? 'pausada' : 'prog'}">${past ? T('Terminado', 'Finished') : T('A decorrer', 'In progress')}</span></div>
    ${list.length ? `<p class="small muted mt-s">${T('Registo de colheita: quilos e valor pago por cada participante. O valor é sugerido a partir do preço da loja', 'Harvest record: kilos and amount paid by each participant. The amount is suggested from the shop price')}${pr ? ` (${money(pr.price)}${unitLabel(pr.unit)})` : ''}. ${T('O cliente vê o registo nas suas encomendas.', 'The customer sees the record in their orders.')}</p>` : ''}
    <p class="small mt-s">${sm.people} ${T('participantes', 'participants')} · ${sm.n ? `${stars(Math.round(sm.avg))} ${numFmt(round2(sm.avg))} (${sm.n} ${sm.n === 1 ? T('avaliação', 'review') : T('avaliações', 'reviews')})` : T('sem avaliações', 'no reviews')}${sm.kg ? ` · ${numFmt(sm.kg)} kg ${T('registados', 'recorded')}` : ''}</p>
    ${list.length ? `<div class="tbl-wrap mt-s"><table class="tbl"><thead><tr><th>${T('Participante', 'Participant')}</th><th>${T('Avaliação', 'Review')}</th><th>${T('Registo de colheita', 'Harvest record')}</th></tr></thead><tbody>${list.map(x => { const h = (x.user.harvests || []).find(y => hIs(y, d)) || {}, rec = h.record || {};
      return `<tr><td><b>${esc(x.user.name)}</b><br><span class="small muted">${esc(x.user.phone)} · ${x.people} ${x.people > 1 ? T('pessoas', 'people') : T('pessoa', 'person')}</span></td>
        <td>${h.rating ? `<ul class="reviews compact">${reviewItem(d, { user: x.user.username, name: firstName(x.user.name), rating: +h.rating, comment: h.comment || '', reply: h.reply ? h.reply.text : '' }, true)}</ul>` : `<span class="small muted">${harvestRateOpen(d) ? T('ainda não avaliou', 'not reviewed yet') : T('sem avaliação', 'no review')}</span>`}</td>
        <td>${d.date !== iso(today()) ? (rec.at ? `<span class="small"><b>${numFmt(rec.kg || 0)} kg</b>${rec.price != null ? ` · ${money(rec.price)}` : ''}${rec.note ? ` · ${esc(rec.note)}` : ''}</span><br><span class="small muted">${recId(h, d, x.user.username)}</span>` : `<span class="small muted">${T('Sem registo.', 'Not recorded.')}</span>`)
          + `<p class="small muted">${icon('lock', 14)} ${d.date > iso(today()) ? T('O registo abre no dia do evento.', 'Recording opens on the day of the event.') : T('O registo só podia ser feito no dia do evento.', 'Records could only be made on the day of the event.')}</p>` : `<div class="row-gap"><label class="sr" for="rg-kg-${rid(x.user.username)}">kg</label><input class="num" id="rg-kg-${rid(x.user.username)}" type="number" min="0" step="0.1" value="${rec.kg ?? ''}" placeholder="kg" data-rg-kg="${rid(x.user.username)}"${pr ? ` data-rg-unit="${pr.price}"` : ''}>
          <label class="sr" for="rg-pr-${rid(x.user.username)}">${T('Valor pago (€)', 'Amount paid (€)')}</label><input class="num" id="rg-pr-${rid(x.user.username)}" type="number" min="0" step="0.01" value="${rec.price ?? ''}" placeholder="€"${rec.price != null ? ' data-touched="1"' : ''}>
          <label class="sr" for="rg-nt-${rid(x.user.username)}">${T('Nota', 'Note')}</label><input class="sel" id="rg-nt-${rid(x.user.username)}" value="${esc(rec.note || '')}" placeholder="${T('Nota (opcional)', 'Note (optional)')}">
          <button class="btn btn-line btn-sm c-campo" data-reg-save="${d.id}|${x.user.username}">${rec.at ? T('Atualizar', 'Update') : T('Registar', 'Record')}</button></div>
          ${rec.at ? `<span class="small muted">${recId(h, d, x.user.username)}</span>` : ''}`}</td></tr>`; }).join('')}</tbody></table></div>` : `<p class="small muted mt-s">${T('Sem inscritos.', 'No sign-ups.')}</p>`}
  </article>`;
}
function tabColhe() {
  const f0 = FARMERS[0], upcoming = HARVEST_DAYS.filter(d => !harvestStarted(d)), started = HARVEST_DAYS.filter(harvestStarted).sort((a, b) => b.date.localeCompare(a.date));
  const prodOpts = fid => ofFarmer(fid).map(p => `<option value="${p.id}">${esc(L(p.name))}</option>`).join('');
  return `<section class="acc-sec"><h2>${JTH()}</h2>
    <h3 class="mt-s">${T('Próximos dias', 'Upcoming days')}</h3><p class="muted mt-s mb-s">${T('Altere o número máximo de participantes, apague dias ou crie dias novos numa quinta parceira. Os agricultores também podem editar os seus dias até começarem.', 'Change the maximum number of participants, delete days or create new days on a partner farm. Farmers can also edit their own days until they start.')}</p>
    <div class="tbl-wrap"><table class="tbl"><thead><tr><th>${T('Dia', 'Day')}</th><th>${T('Quinta e produto', 'Farm and produce')}</th><th>${T('Horário', 'Time')}</th><th>${T('Máximo', 'Maximum')}</th><th>${T('Inscritos', 'Signed up')}</th><th></th></tr></thead><tbody>
    ${upcoming.map(d => { const f = F(d.farmer), list = harvestList(d.id), n = harvestPeople(d.id); return `<tr><td>${slotLabel(d.date)}</td><td>${f ? esc(f.farm) : d.farmer}<br><span class="small muted">${esc(L(d.what))}</span></td><td>${d.time}</td>
      <td><input class="num" type="number" min="${n}" value="${d.spots}" data-day-spots="${d.id}" aria-label="${T('Máximo de participantes', 'Maximum participants')}"></td>
      <td>${n}${list.length ? `<details><summary class="small link">${T('ver lista', 'see list')}</summary><ul class="small plain-ul">${list.map(x => `<li>${esc(x.user.name)}, ${esc(x.user.phone)} (${x.people})</li>`).join('')}</ul></details>` : ''}</td>
      <td><button class="rm" data-day-del="${d.id}" aria-label="${T('Apagar dia', 'Delete day')}">${icon('trash', 18)}</button></td></tr>`; }).join('')}</tbody></table></div>
    <form class="form panel mt" data-newday novalidate><h3>${T('Adicionar dia', 'Add a day')}</h3>
      <div class="row"><div class="field"><label for="nd-date">${T('Data', 'Date')}</label><input id="nd-date" type="date" min="${iso(today())}" required></div>
        ${timeFields('nd')}</div>
      <div class="row"><div class="field"><label for="nd-farm">${T('Quinta', 'Farm')}</label><select id="nd-farm" data-nd-farm>${FARMERS.map(f => `<option value="${f.id}">${esc(f.farm)} (${esc(f.name)})</option>`).join('')}</select></div>
        <div class="field"><label for="nd-prod">${T('Produto a colher', 'Produce to pick')}</label><select id="nd-prod">${prodOpts(f0.id)}</select></div></div>
      <div class="field"><label for="nd-spots">${T('Máximo de participantes', 'Maximum participants')}</label><input id="nd-spots" type="number" min="1" value="30" required></div>
      <p class="err" hidden></p><button class="btn btn-green" type="submit">${T('Criar dia', 'Create day')}</button></form></section>
    <section class="acc-sec"><h2>${T('A decorrer e colheitas passadas', 'In progress and past harvests')}</h2>
      <p class="muted mt-s">${T('Durante e depois de cada dia, registe o que cada participante colheu: o cliente vê o registo na sua conta. As avaliações abrem no início do dia e fecham 48 horas depois do fim.', 'During and after each day, record what each participant picked: the customer sees it in their account. Reviews open when the day starts and close 48 hours after it ends.')}</p>
      ${started.length ? started.map(harvestDoneCard).join('') : `<p class="muted mt-s">${T('Ainda não houve dias.', 'No days yet.')}</p>`}</section>`;
}

/* ---------- Subscrições ---------- */
function tabSubs() {
  const subs = Object.values(USERS).filter(x => x.role !== 'admin').flatMap(c => (c.subs || []).map(s => ({ c, s })));
  return `<section class="acc-sec"><h2 class="mb-s">${T('Todas as subscrições', 'All subscriptions')}</h2>
    ${subs.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>${T('Cliente', 'Customer')}</th><th>${T('Caixa', 'Box')}</th><th>${T('Tamanho', 'Size')}</th><th>${T('Frequência', 'Frequency')}</th><th>${T('Preço guardado', 'Saved price')}</th><th>${T('Estado', 'Status')}</th><th>${T('Preferências', 'Preferences')}</th></tr></thead><tbody>${subs.map(({ c, s }) => { refreshSub(s); return `<tr><td>${esc(c.name)}</td><td>${esc(L(P(s.box).name))}</td><td>${sizeName(s.size)}</td><td>${freqName(s.freq)}</td><td>${money(s.locked)}</td><td>${s.status === 'ativa' ? T('Ativa', 'Active') : T('Pausada', 'Paused')}</td><td class="small">${prefsLines({ exclude: c.exclude, favs: c.favs })}</td></tr>`; }).join('')}</tbody></table></div>` : `<p class="muted">${T('Sem subscrições.', 'No subscriptions.')}</p>`}</section>`;
}

/* ---------- Contas ---------- */
const ROLE_NAMES = () => ({ cliente: T('Cliente', 'Customer'), agricultor: T('Agricultor', 'Farmer'), restaurante: T('Restaurante', 'Restaurant'), admin: T('Gestão', 'Management') });
function tabContas() {
  const all = Object.values(USERS).sort((a, b) => (a.role + a.username).localeCompare(b.role + b.username)), roles = ROLE_NAMES();
  const shown = all.filter(u => accFilter === 'all' || u.role === accFilter || (accFilter === 'pendente' && u.partner && !u.partner.approved));
  const partnerOf = u => !u.partner ? '' : u.partner.kind === 'agricultor' ? (u.partner.farmerId && F(u.partner.farmerId) ? `<a href="${farmerHref(F(u.partner.farmerId))}">${esc(F(u.partner.farmerId).farm)}</a>` : esc(u.partner.farm || '')) : esc(u.partner.name || '');
  return `<section class="acc-sec"><h2>${T('Contas', 'Accounts')}</h2>
    <p class="muted mt-s">${NUVEM.on ? T('Todas as contas da base de dados. Cada quinta e cada restaurante tem a sua conta de parceiro. Para dar acesso de gestão a uma conta, veja o LEIA-ME (secção Supabase).', 'Every account in the database. Each farm and restaurant has its own partner account. To give an account management access, see the README (Supabase section).') : T('Contas guardadas neste navegador.', 'Accounts stored in this browser.')}</p>
    <div class="chips mt-s mb-s" role="group" aria-label="${T('Filtrar contas', 'Filter accounts')}">${[['all', T('Todas', 'All')], ...Object.entries(roles), ['pendente', T('Parceiros por aprovar', 'Partners to approve')]].map(([k, n]) => `<button class="chip" data-acc-filter="${k}" aria-pressed="${accFilter === k}">${n} <span class="small muted">${k === 'all' ? all.length : k === 'pendente' ? all.filter(u => u.partner && !u.partner.approved).length : all.filter(u => u.role === k).length}</span></button>`).join('')}</div>
    <div class="tbl-wrap"><table class="tbl"><thead><tr><th>${T('Nome', 'Name')}</th><th>${T('Utilizador e contactos', 'Username and contacts')}</th><th>${T('Tipo', 'Type')}</th><th>${T('Quinta ou restaurante', 'Farm or restaurant')}</th><th>${T('Atividade', 'Activity')}</th></tr></thead><tbody>
    ${shown.map(u => { const nOrd = ORDERS.filter(o => o.user === u.username).length, nSub = (u.subs || []).filter(s => s.status === 'ativa').length, nH = (u.harvests || []).length;
      return `<tr><td><b>${esc(u.name)}</b><br><span class="small muted">${T('desde', 'since')} ${fdate(u.created)}</span></td><td>${esc(u.username)}<br><span class="small muted">${esc(u.phone)}${u.email && !u.email.endsWith('@' + SEED_DOMAIN) ? ', ' + esc(u.email) : ''}</span></td>
        <td>${roles[u.role] || u.role}${u.partner ? `<br><span class="status ${u.partner.approved ? 'ativa' : 'prog'}">${u.partner.approved ? T('Aprovado', 'Approved') : T('Por aprovar', 'To approve')}</span>` : ''}</td><td>${partnerOf(u)}</td>
        <td class="small">${nOrd} ${T('encomendas', 'orders')}<br>${nSub} ${T('subscrições ativas', 'active subscriptions')}<br>${nH} ${T('inscrições Colhe Connosco', 'Join the Harvest sign-ups')}</td></tr>`; }).join('')}
    </tbody></table></div></section>`;
}

/* ---------- Exportar ---------- */
function tabExportar() {
  if (NUVEM.on) return `<section class="acc-sec"><h2>${T('Base de dados', 'Database')}</h2>
    <div class="prose mt-s"><p>${T('O site está ligado à base de dados Supabase. Tudo o que muda neste painel, nas contas e nas áreas de parceiro fica guardado logo, para toda a gente e em todos os dispositivos.', 'The site is connected to the Supabase database. Everything changed in this panel, in accounts and in partner areas is saved straight away, for everyone and on every device.')}</p>
      <p>${T('A versão sem base de dados (por exemplo no OnionShare) usa o ficheiro <code>js/alteracoes.js</code>. Para que mostre o catálogo atual, descarregue o ficheiro e substitua o da pasta do site.', 'The version without a database (for example on OnionShare) uses <code>js/alteracoes.js</code>. To make it show the current catalogue, download the file and replace the one in the site folder.')}</p></div>
    <div class="row-btns mt-s"><button class="btn btn-green" data-export-dl>${icon('box', 18)}${T('Descarregar alteracoes.js', 'Download alteracoes.js')}</button><button class="btn btn-line c-campo" data-export-copy>${T('Copiar o código', 'Copy the code')}</button></div>
    <label class="sr" for="export-code">${T('Código do ficheiro', 'File code')}</label><textarea id="export-code" class="code mt-s" rows="8" readonly>${esc(exportChangesFile())}</textarea></section>`;
  const n = catalogChangeCount();
  return `<section class="acc-sec"><h2>${T('Guardar as alterações no site', 'Save changes to the site')}</h2>
    <div class="prose mt-s">
      <p>${T('As alterações feitas neste painel ficam guardadas <b>neste navegador</b>. Não mudam os ficheiros do site: se abrir o site noutro navegador ou computador, ou se partilhar a pasta, elas não aparecem.', 'Changes made in this panel are stored <b>in this browser</b>. They don\'t change the site\'s files: in another browser or computer, or if you share the folder, they won\'t appear.')}</p>
      <p>${T('Para as tornar permanentes, descarregue o ficheiro <code>alteracoes.js</code> e substitua com ele o ficheiro <code>js/alteracoes.js</code> da pasta do site. A partir daí, as alterações fazem parte do site para toda a gente.', 'To make them permanent, download <code>alteracoes.js</code> and use it to replace <code>js/alteracoes.js</code> in the site folder. From then on, the changes are part of the site for everyone.')}</p>
      <p class="small muted">${T('Inclui: preços, épocas, stock, divisão do preço, produtos novos, preços das caixas, dias do Colhe Connosco, quintas e restaurantes aprovados e os perfis editados pelos parceiros. Contas, encomendas e pedidos são dados dos utilizadores e não entram no ficheiro (precisariam de um servidor).', 'Includes: prices, seasons, stock, price split, new products, box prices, Join the Harvest days, approved farms and restaurants and profiles edited by partners. Accounts, orders and requests are user data and are not in the file (they would need a server).')}</p></div>
    <p class="mt"><b>${n}</b> ${T('alterações neste navegador que ainda não estão no ficheiro.', 'changes in this browser not yet in the file.')}</p>
    <div class="row-btns mt-s"><button class="btn btn-green" data-export-dl>${icon('box', 18)}${T('Descarregar alteracoes.js', 'Download alteracoes.js')}</button><button class="btn btn-line c-campo" data-export-copy>${T('Copiar o código', 'Copy the code')}</button></div>
    <label class="sr" for="export-code">${T('Código do ficheiro', 'File code')}</label><textarea id="export-code" class="code mt-s" rows="10" readonly>${esc(exportChangesFile())}</textarea>
    <h3 class="mt-l">${T('Desfazer', 'Undo')}</h3>
    <div class="row-btns mt-s"><button class="btn btn-line btn-sm c-tomato" data-catalog-reset>${T('Desfazer as alterações ao catálogo deste navegador', 'Undo this browser\'s catalogue changes')}</button><button class="btn btn-line btn-sm c-tomato" data-reset-demo>${T('Repor contas, encomendas e pedidos de demonstração', 'Reset demo accounts, orders and requests')}</button></div></section>`;
}

/* ---------- eventos do painel ---------- */
const adminOnly = () => PAGE === 'conta' && currentUser()?.role === 'admin';
PAGE_EVENTS.click.push((e, t, d) => {
  if (d.catImg && adminOnly()) { const p = P(d.catImg), cur = p.icon || p.id;
    openModal(`<div class="mbody"><h2>${T('Imagem de', 'Picture of')} ${esc(L(p.name))}</h2>
      <p class="small muted">${T('Escolha um desenho da pasta img/produtos. Os ficheiros novos que puser nessa pasta aparecem nesta lista (no site publicado no GitHub, ou depois de correr node ferramentas/listar-icones.js).', 'Pick a drawing from the img/produtos folder. New files you put there show in this list (on the site published on GitHub, or after running node ferramentas/listar-icones.js).')}</p>
      <div class="icon-pick mt-s"><span class="img-prev" id="ci-prev"><img src="${R}img/produtos/${esc(cur)}.svg" alt=""></span><div class="img-pick-c"><label for="ci-icon">${T('Desenho', 'Drawing')}</label><select id="ci-icon" data-icon-pick data-icon-prev="ci-prev">${iconOptions(cur)}</select>
        <label class="small" for="ci-free">${T('Ou escreva o nome do ficheiro (sem .svg)', 'Or type the file name (without .svg)')}</label><input id="ci-free" class="sel" data-icon-free="ci-icon" autocomplete="off"></div></div>
      ${p.photo ? `<p class="small muted mt-s">${T('Este produto usa uma fotografia; ao guardar, passa a usar o desenho escolhido.', 'This product uses a photo; saving switches it to the chosen drawing.')}</p>` : ''}
      <div class="row-btns mt"><button class="btn btn-green" data-site-page="conta" data-cat-img-save="${p.id}">${T('Guardar imagem', 'Save picture')}</button><button class="btn btn-line c-campo" data-modal-close>${T('Cancelar', 'Cancel')}</button></div></div>`, T('Imagem do produto', 'Product picture'));
    return true; }
  if (d.catImgSave && adminOnly()) { const v = $('#ci-icon').value; saveCatalog(ch => { ch.products = ch.products || {}; ch.products[d.catImgSave] = Object.assign(ch.products[d.catImgSave] || {}, { icon: v, photo: '' }); }); closeModal(); toast(T('Imagem alterada', 'Picture changed')); $('#cat-body') ? ($('#cat-body').innerHTML = catRows()) : rerenderKeep(); return true; }
  if (d.boxDel && adminOnly()) { const b = P(d.boxDel); if (!b || !b.custom) return true;
    if (t.dataset.confirm !== '1') { t.dataset.confirm = '1'; t.innerHTML = `${icon('trash', 16)} ${T('Confirmar: apagar', 'Confirm: delete')}`; return true; }
    saveCatalog(ch => { ch.newBoxes = (ch.newBoxes || []).filter(x => x.id !== b.id); ch.removedBoxes = (ch.removedBoxes || []).concat(b.id); if (ch.boxes) delete ch.boxes[b.id]; });
    if (!NUVEM.on) { const i = PRODUCTS.indexOf(b); if (i >= 0) PRODUCTS.splice(i, 1); delete BOX_SIZES[b.id]; }
    toast(T('Caixa apagada', 'Box deleted')); rerenderKeep(); return true; }
  if (!adminOnly()) return;
  if (d.adminTab) { adminTab = d.adminTab; rerenderKeep(`[data-admin-tab="${d.adminTab}"]`); return true; }
  if (d.accFilter) { accFilter = d.accFilter; rerenderKeep(`[data-acc-filter="${d.accFilter}"]`); return true; }
  if (d.inbox) { inboxFilter = d.inbox; rerenderKeep(`[data-inbox="${d.inbox}"]`); return true; }
  if (d.reqToggle) { const r = REQUESTS.find(x => x.id === d.reqToggle); r.status = r.status === 'novo' ? 'tratado' : 'novo'; saveRequests(); rerenderKeep(); return true; }
  if (d.approve) { const r = REQUESTS.find(x => x.id === d.approve), msg = ($('#rq-msg-' + r.id)?.value || '').trim(); if (approveRequest(r, msg)) toast(T('Aprovado e publicado. O parceiro foi avisado.', 'Approved and published. The partner has been notified.')); rerenderKeep(); return true; }
  if (d.reject) { const r = REQUESTS.find(x => x.id === d.reject), msg = ($('#rq-msg-' + r.id)?.value || '').trim(); rejectRequest(r, msg); toast(T('Pedido rejeitado. O parceiro foi avisado.', 'Request rejected. The partner has been notified.')); rerenderKeep(); return true; }
  if (d.merge) { const [keep, ...drop] = d.merge.split(',').map(P); drop.forEach(x => mergeProducts(keep, x)); toast(T(`Produtos juntados em ${L(keep.name)}`, `Products merged into ${L(keep.name)}`)); rerenderKeep(); return true; }
  if (d.regSave) { const [id, un] = d.regSave.split('|'), u = USERS[un], dd = HD(id), h = u && dd && (u.harvests || []).find(x => hIs(x, dd)); if (!h) return true;
    const rid = `${id}-${un}`.replace(/[^a-zA-Z0-9-]/g, '_'), kg = $('#rg-kg-' + rid).value, pr = $('#rg-pr-' + rid).value, note = $('#rg-nt-' + rid).value.trim();
    h.record = kg === '' && pr === '' && !note ? null : { id: recId(h, dd, un), kg: kg === '' ? null : round2(Math.max(0, +kg)), price: pr === '' ? null : round2(Math.max(0, +pr)), note, at: nowISO() }; if (!h.record) delete h.record; saveUsers(); toast(T(`Registo guardado: ${u.name}`, `Record saved: ${u.name}`)); rerenderKeep(`[data-reg-save="${d.regSave}"]`); return true; }
  if (d.delProd && NUVEM.on) { NUVEM.deleteProduct(d.delProd); const i = PRODUCTS.findIndex(p => p.id === d.delProd); if (i >= 0) PRODUCTS.splice(i, 1); toast(T('Produto apagado', 'Product deleted')); rerenderKeep(); return true; }
  if (d.delProd) { saveCatalog(ch => { ch.newProducts = (ch.newProducts || []).filter(x => x.id !== d.delProd); if (ch.products) delete ch.products[d.delProd]; }); const i = PRODUCTS.findIndex(p => p.id === d.delProd); if (i >= 0 && !(SAVED_CHANGES.newProducts || []).some(x => x.id === d.delProd)) PRODUCTS.splice(i, 1); toast(T('Produto apagado', 'Product deleted')); rerenderKeep(); return true; }
  if (d.dayDel) { const n = harvestPeople(d.dayDel); if (n && !t.dataset.confirm) { t.dataset.confirm = '1'; toast(T(`Este dia tem ${n} inscritos. Carregue outra vez para apagar.`, `This day has ${n} people signed up. Click again to delete.`)); return true; }
    saveCatalog(ch => { ch.harvestDays = HARVEST_DAYS.filter(x => x.id !== d.dayDel).map(x => Object.assign({}, x)); }); toast(T('Dia apagado', 'Day deleted')); rerenderKeep(); return true; }
  if ('exportDl' in d) { const blob = new Blob([exportChangesFile()], { type: 'text/javascript' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'alteracoes.js'; document.body.appendChild(a); a.click(); a.remove(); toast(T('Ficheiro descarregado: substitua js/alteracoes.js', 'File downloaded: replace js/alteracoes.js')); return true; }
  if ('exportCopy' in d) { const ta = $('#export-code'); ta.select(); try { navigator.clipboard.writeText(ta.value).then(() => toast(T('Código copiado', 'Code copied')), () => { document.execCommand('copy'); toast(T('Código copiado', 'Code copied')); }); } catch (err) { document.execCommand('copy'); toast(T('Código copiado', 'Code copied')); } return true; }
  if ('catalogReset' in d) { resetCatalog(); location.reload(); return true; }
  if ('resetDemo' in d) { resetDemo(); store.set(SESSION_KEY, 'gestao'); toast(T('Dados de demonstração repostos', 'Demo data reset')); rerenderKeep(); return true; }
});
PAGE_EVENTS.change.push((e, t) => {
  if (!adminOnly()) return;
  const d = t.dataset;
  if (d.orderStage) { const o = findOrder(d.orderStage); if (t.value === 'cancel') { o.status = 'cancelada'; delete o.stage; } else { o.status = 'ativa'; if (t.value === 'auto') delete o.stage; else o.stage = +t.value; } saveOrders(); notifyStageLocal(o); toast(`${o.num}: ${stageName(o)}`); return; }
  if (d.catEdit) {
    const id = d.catEdit, p = P(id), row = t.closest('tr');
    if (d.f === 'price') { const v = Math.max(0, +t.value || 0); editCatalog(ch => { ch.products = ch.products || {}; ch.products[id] = Object.assign(ch.products[id] || {}, { price: +v.toFixed(2) }); }); toast(T(`Preço de ${L(p.name)}: ${money(v)}`, `${L(p.name)} price: ${money(v)}`)); }
    if (d.f === 's0' || d.f === 's1') { const a = +$('[data-f="s0"]', row).value, b = +$('[data-f="s1"]', row).value; editCatalog(ch => { ch.products = ch.products || {}; ch.products[id] = Object.assign(ch.products[id] || {}, { season: [a, b] }); }); toast(T(`Época de ${L(p.name)}: ${monthName(a, 'short')}–${monthName(b, 'short')}`, `${L(p.name)} season: ${monthName(a, 'short')}–${monthName(b, 'short')}`)); }
    if (d.f.startsWith('sp')) { const sp = ['sp0', 'sp1', 'sp2'].map(k => Math.round(+$(`[data-f="${k}"]`, row).value || 0)); const sum = sp.reduce((x, y) => x + y, 0);
      $$('.pct', row).forEach(i => i.toggleAttribute('aria-invalid', sum !== 100));
      if (sum !== 100) { toast(T(`A soma dá ${sum}%: tem de dar 100%`, `The total is ${sum}%: it must be 100%`)); return; }
      editCatalog(ch => { ch.products = ch.products || {}; ch.products[id] = Object.assign(ch.products[id] || {}, { split: sp }); }); toast(T(`Divisão de ${L(p.name)}: ${sp.join(' / ')}`, `${L(p.name)} split: ${sp.join(' / ')}`)); }
    if (d.f === 'stock') { if (p.producers && p.producers.length) saveOffers(p, p.producers.map(o => Object.assign({}, o, { outOfStock: t.checked }))); else editCatalog(ch => { ch.products = ch.products || {}; ch.products[id] = Object.assign(ch.products[id] || {}, { outOfStock: t.checked }); }); toast(t.checked ? T(`${L(p.name)}: fora de stock`, `${L(p.name)}: out of stock`) : T(`${L(p.name)}: com stock`, `${L(p.name)}: in stock`)); }
    return;
  }
  if (d.catf !== undefined && t.id === 'cat-f') { catFilter = t.value; $('#cat-body').innerHTML = catRows(); return; }
  if (d.boxPrice) { const [id, sz] = d.boxPrice.split(':'), v = Math.max(0, +t.value || 0); editCatalog(ch => { ch.boxes = ch.boxes || {}; ch.boxes[id] = Object.assign(ch.boxes[id] || {}, { [sz]: +v.toFixed(2) }); }); Object.values(USERS).forEach(c => (c.subs || []).forEach(sb => refreshSub(sb))); saveUsers(); toast(T('Preço da caixa atualizado', 'Box price updated')); rerenderKeep(`[data-box-price="${d.boxPrice}"]`); return; }
  if (d.daySpots) { const v = Math.max(+t.min || 1, +t.value || 1); editCatalog(ch => { ch.harvestDays = HARVEST_DAYS.map(x => Object.assign({}, x, x.id === d.daySpots ? { spots: v } : {})); }); toast(T(`Máximo de participantes: ${v}`, `Maximum participants: ${v}`)); return; }
  if (d.ndFarm !== undefined && t.id === 'nd-farm') { $('#nd-prod').innerHTML = ofFarmer(t.value).map(p => `<option value="${p.id}">${esc(L(p.name))}</option>`).join(''); return; }
});
PAGE_EVENTS.input.push((e, t) => {
  if (adminOnly() && t.id === 'cat-q') { catQuery = t.value; $('#cat-body').innerHTML = catRows(); }
  /* registo de colheita: o valor pago é sugerido (quilos × preço da loja) até a gestão o escrever à mão */
  if (t.dataset.rgKg) { const pr = $('#rg-pr-' + t.dataset.rgKg); if (pr && !pr.dataset.touched && t.dataset.rgUnit && t.value !== '') pr.value = round2(+t.value * +t.dataset.rgUnit).toFixed(2); }
  if (t.id && t.id.startsWith('rg-pr-')) t.dataset.touched = '1';
});
PAGE_EVENTS.change.push((e, t) => {
  if (!adminOnly() || !t.matches('[data-nb-item]')) return;
  t.checked ? nbPick.add(t.value) : nbPick.delete(t.value); const c = $('#nb-count'); if (c) c.textContent = `(${nbPick.size} ${T('escolhidos', 'chosen')})`;
});
/* escolher o ícone de um produto: pré-visualização e nome de ficheiro escrito à mão */
PAGE_EVENTS.change.push((e, t) => { if (t.matches('select[data-icon-prev]')) { const im = $('#' + t.dataset.iconPrev + ' img'); if (im) im.src = `${R}img/produtos/${t.value}.svg`; } });
PAGE_EVENTS.input.push((e, t) => {
  if (!t.matches('[data-icon-free]')) return;
  const v = t.value.trim().replace(/\.svg$/i, '').replace(/[^a-z0-9_-]/gi, ''), s = $('#' + t.dataset.iconFree); if (!s || !v) return;
  if (![...s.options].some(o => o.value === v)) s.insertAdjacentHTML('beforeend', `<option value="${esc(v)}">${esc(v)}.svg</option>`);
  s.value = v; s.dispatchEvent(new Event('change', { bubbles: true }));
});
PAGE_EVENTS.input.push((e, t) => { if (adminOnly() && t.matches('[data-nb-q]')) { nbQuery = t.value; $('#nb-list').innerHTML = nbList(); } });
PAGE_EVENTS.submit.push((e, f) => {
  if (!adminOnly()) return;
  if (f.matches('[data-newbox]')) {
    e.preventDefault(); const err = $('.err', f), fail = (m, el) => { err.hidden = false; err.textContent = m; if (el) el.focus(); return true; };
    const pt = $('#nb-pt').value.trim(); if (!pt) return fail(T('Escreva o nome da caixa.', 'Enter the box name.'), $('#nb-pt'));
    if (PRODUCTS.some(p => p.cat === 'caixas' && norm(p.name.pt) === norm(pt))) return fail(T('Já existe uma caixa com esse nome.', 'There is already a box with that name.'), $('#nb-pt'));
    const sizes = ['P', 'M', 'G'].map(s => ({ s, kg: +$('#nb-kg-' + s).value || 0, price: $('#nb-pr-' + s).value })).filter(x => x.price !== '').map(x => ({ s: x.s, kg: x.kg, price: round2(Math.max(0, +x.price)) }));
    if (!sizes.length || sizes[0].s !== 'P') return fail(T('Indique pelo menos o preço do tamanho pequeno.', 'Enter at least the small size price.'), $('#nb-pr-P'));
    if (sizes.some(x => !(x.kg > 0))) return fail(T('Indique os quilos de cada tamanho.', 'Enter the kilos for each size.'));
    if (nbPick.size < 2) return fail(T('Escolha pelo menos 2 produtos.', 'Pick at least 2 products.'), $('#nb-q'));
    const id = uniqueId(/^caixa\b/i.test(pt) ? pt : 'caixa ' + pt, PRODUCTS);
    const nb = { id, name: { pt, en: $('#nb-en').value.trim() || pt }, desc: { pt: $('#nb-dpt').value.trim(), en: $('#nb-den').value.trim() }, items: [...nbPick], sizes };
    saveCatalog(ch => { ch.newBoxes = (ch.newBoxes || []).filter(x => x.id !== id).concat(nb); });
    nbPick = new Set(); nbQuery = ''; toast(T(`Caixa criada: ${pt}`, `Box created: ${nb.name.en}`)); rerenderKeep(); return true;
  }
  if (f.matches('[data-newprod]')) {
    e.preventDefault(); if (!validate(f)) return true;
    const id = uniqueId($('#np-pt').value, PRODUCTS);
    const np = { id, cat: $('#np-cat').value, name: { pt: $('#np-pt').value.trim(), en: $('#np-en').value.trim() }, price: +(+$('#np-price').value).toFixed(2), unit: $('#np-unit').value, farmer: $('#np-farmer').value, icon: $('#np-icon').value,
      season: [+$('#np-s0').value, +$('#np-s1').value], harvest: 2, essential: $('#np-ess').checked, organic: $('#np-bio').checked, producers: [{ farmer: $('#np-farmer').value, organic: $('#np-bio').checked }], desc: { pt: $('#np-dpt').value.trim(), en: $('#np-den').value.trim() } };
    saveCatalog(ch => { ch.newProducts = (ch.newProducts || []).concat(np); }); catFilter = 'changed'; toast(T(`Produto adicionado: ${np.name.pt}`, `Product added: ${np.name.en}`)); rerenderKeep('#cat-q'); return true;
  }
  if (f.matches('[data-newday]')) {
    e.preventDefault(); if (!validate(f)) return true;
    const p = P($('#nd-prod').value), date = $('#nd-date').value;
    if (timeBad('nd')) { const err = $('.err', f); err.hidden = false; err.textContent = timeBad('nd'); $('#nd-fim').focus(); return true; }
    if (HARVEST_DAYS.some(x => x.date === date && x.farmer === $('#nd-farm').value)) { const err = $('.err', f); err.hidden = false; err.textContent = T('Esta quinta já tem um dia Colhe Connosco nessa data. Pode haver vários dias na mesma data, mas em quintas diferentes.', 'This farm already has a Join the Harvest day on that date. Several days can share a date, but on different farms.'); return true; }
    const day = { id: newDayId(date, $('#nd-farm').value), date, farmer: $('#nd-farm').value, crop: p ? p.art || 'alface' : 'alface', what: p ? { pt: p.name.pt, en: p.name.en } : { pt: '-', en: '-' }, time: timeText($('#nd-ini').value, $('#nd-fim').value), spots: +$('#nd-spots').value || 20 };
    saveCatalog(ch => { ch.harvestDays = HARVEST_DAYS.map(x => Object.assign({}, x)).concat(day); }); toast(T('Dia Colhe Connosco criado', 'Join the Harvest day created')); rerenderKeep(); return true;
  }
});
