/* ===== Daqui — gestão (v11): preparar caixas, inventário, parceiros, promoções e definições =====
   Separadores acrescentados ao painel de gestão (js/pages-gestao.js → ADMIN_EXTRA). As alterações feitas nos campos
   (caixas, parceiros) ficam por guardar e vão juntas com o botão "Guardar alterações" (js/catalogo.js → editCatalog). */

/* ---------- caixas: tamanhos (peso e preço), produtos e modo "favoritos" ---------- */
const SIZE_CODES = ['P', 'M', 'G', 'XG', 'F'];
function boxEditor(b, subs) {
  const sizes = BOX_SIZES[b.id] || [], used = new Set(subs.map(x => x.s.size)), items = new Set(b.items || boxProducts(b).map(p => p.id));
  const q = (boxEdQ[b.id] || '').trim(), qn = norm(q);
  const list = PRODUCTS.filter(p => p.cat !== 'caixas' && (!qn || norm(L(p.name)).includes(qn) || norm(p.name.pt).includes(qn))).sort((x, y) => (items.has(y.id) - items.has(x.id)) || L(x.name).localeCompare(L(y.name)));
  return `<details class="panel mt-s box-ed"${boxEdOpen === b.id ? ' open' : ''} data-box-ed="${b.id}"><summary class="lbl">${icon('edit', 16)} ${T('Editar tamanhos e produtos', 'Edit sizes and products')}</summary>
    <h4 class="mt-s">${T('Tamanhos', 'Sizes')}</h4>
    <div class="tbl-wrap"><table class="tbl sizes-tbl"><thead><tr><th>${T('Tamanho', 'Size')}</th><th>kg</th><th>${T('Preço (€)', 'Price (€)')}</th><th></th></tr></thead><tbody>
      ${sizes.map((z, i) => `<tr><td><b>${sizeName(z.s)}</b> <span class="small muted">(${z.s})</span></td>
        <td><input class="num" type="number" min="0.5" step="0.5" value="${z.kg}" data-bs-kg="${b.id}|${i}" aria-label="${T('Peso', 'Weight')} ${sizeName(z.s)}"></td>
        <td><input class="num" type="number" min="0" step="0.10" value="${z.price}" data-bs-price="${b.id}|${i}" aria-label="${T('Preço', 'Price')} ${sizeName(z.s)}"></td>
        <td>${used.has(z.s) ? `<span class="small muted">${T('com subscritores', 'has subscribers')}</span>` : sizes.length > 1 ? `<button type="button" class="btn btn-sm btn-ghost c-tomato" data-bs-del="${b.id}|${i}">${icon('trash', 14)} ${T('Tirar', 'Remove')}</button>` : ''}</td></tr>`).join('')}
    </tbody></table></div>
    ${sizes.length < SIZE_CODES.length ? `<button type="button" class="btn btn-line btn-sm c-campo mt-s" data-bs-add="${b.id}">${icon('plus', 14)} ${T('Acrescentar tamanho', 'Add a size')}</button>` : ''}
    <h4 class="mt">${T('O que leva a caixa', 'What goes in the box')}</h4>
    <div class="radios"><label><input type="radio" name="bm-${b.id}" value="fixo" data-bm="${b.id}"${b.mode !== 'favoritos' ? ' checked' : ''}>${T('Produtos da lista abaixo (os da época)', 'Products from the list below (those in season)')}</label>
      <label><input type="radio" name="bm-${b.id}" value="favoritos" data-bm="${b.id}"${b.mode === 'favoritos' ? ' checked' : ''}>${T('Escolhidos entre os favoritos de cada cliente (a lista completa o que faltar)', 'Picked from each customer\'s favourites (the list fills any gap)')}</label></div>
    <div class="field mt-s"><label for="bq-${b.id}">${T('Procurar produto', 'Search product')}</label><input id="bq-${b.id}" data-bq="${b.id}" value="${esc(q)}" autocomplete="off"></div>
    <div class="nb-list">${list.slice(0, 80).map(p => `<label class="nb-item"><input type="checkbox" data-bi="${b.id}" value="${p.id}"${items.has(p.id) ? ' checked' : ''}><span class="thumb sm">${artFor(p)}</span>${esc(L(p.name))}</label>`).join('')}</div>
    <p class="small muted mt-s">${items.size} ${T('produtos escolhidos', 'products chosen')}. ${T('As alterações ficam por guardar até carregar em "Guardar alterações".', 'Changes stay unsaved until you press "Save changes".')}</p></details>`;
}
let boxEdOpen = '';
const boxEdQ = {};
function boxSizesEdit(id, fn) { const list = (BOX_SIZES[id] || []).map(z => Object.assign({}, z)); fn(list); boxEdOpen = id; editCatalog(ch => { ch.boxSizes = { [id]: list }; }); }
function boxItemsEdit(id, fn) { const b = P(id); const items = new Set(b.items || boxProducts(b).map(p => p.id)); fn(items); boxEdOpen = id; editCatalog(ch => { ch.boxCfg = { [id]: { items: [...items], mode: b.mode || 'fixo' } }; }); }

/* ---------- preparar caixas: no dia antes da entrega ---------- */
const deliversOn = (s, d) => { if (s.status !== 'ativa') return false; const f = parseISO(s.first), step = FREQ_DAYS[s.freq] || 7, diff = Math.round((d - f) / 864e5); return diff >= 0 && diff % step === 0; };
function nextDistribution() { let d = addDays(today(), 1); for (let i = 0; i < 8; i++, d = addDays(d, 1)) if ([4, 6].includes(d.getDay())) return d; return addDays(today(), 1); }
let prepDate = '', prepDraft = {};
function tabPreparar() {
  const d = prepDate ? parseISO(prepDate) : nextDistribution(), ds = iso(d);
  const subs = Object.values(USERS).flatMap(c => (c.subs || []).filter(s => deliversOn(s, d)).map(s => ({ c, s })));
  const orders = ORDERS.filter(o => o.slot === ds && o.status !== 'cancelada').sort((a, b) => a.num.localeCompare(b.num));
  const whyTxt = w => ({ fav: T('favorito', 'favourite'), old: T('colheita mais antiga', 'older harvest'), season: T('a sair de época', 'leaving season') })[w];
  const itemsHTML = (id, items, locked) => `<ul class="prep-items">${items.map((i, k) => { const p = P(i.id); if (!p) return ''; const low = tracksStock(p) && stockOf(p) < i.qty && !locked;
    return locked ? `<li><span class="thumb sm">${artFor(p)}</span>${esc(L(p.name))} <b>${byKg(p) ? numFmt(i.qty) + ' kg' : `${numFmt(i.qty)} ${unitWord(p.unit, i.qty)}`}</b></li>`
      : `<li><span class="thumb sm">${artFor(p)}</span><select data-prep-prod="${id}|${k}" aria-label="${T('Produto', 'Product')}">${PRODUCTS.filter(x => x.cat !== 'caixas' && (available(x) || x.id === i.id)).sort((a, b2) => L(a.name).localeCompare(L(b2.name))).map(x => `<option value="${x.id}"${x.id === i.id ? ' selected' : ''}>${esc(L(x.name))}</option>`).join('')}</select>
        <input class="num" type="number" min="0.5" step="${byKg(p) ? 0.5 : 1}" value="${i.qty}" data-prep-qty="${id}|${k}" aria-label="${T('Quantidade', 'Quantity')}"> <span class="small">${byKg(p) ? 'kg' : unitWord(p.unit, i.qty)}</span>
        ${(i.why || []).map(w => `<span class="tag">${whyTxt(w)}</span>`).join('')}${low ? `<span class="tag warn">${T('stock', 'stock')}: ${stockText(p, stockOf(p))}</span>` : ''}
        <button type="button" class="icon-btn" data-prep-rm="${id}|${k}" aria-label="${T('Tirar', 'Remove')}">${icon('close', 16)}</button></li>`; }).join('')}</ul>
    ${locked ? '' : `<button type="button" class="btn btn-line btn-sm" data-prep-add="${id}">${icon('plus', 14)} ${T('Produto', 'Product')}</button>`}`;
  /* gostos do cliente para uma caixa: os da encomenda (guardados no momento da compra) ou os da conta */
  const prefsLine = pr => !pr ? `<p class="small muted">${T('Cliente sem conta: sem preferências.', 'Guest customer: no preferences.')}</p>`
    : (pr.favs || []).length || (pr.exclude || []).length ? `<p class="small muted">${(pr.favs || []).length ? `${icon('heart', 14)} ${(pr.favs || []).map(y => P(y) ? esc(L(P(y).name)) : '').filter(Boolean).slice(0, 8).join(', ')}` : ''}${(pr.exclude || []).length ? `${(pr.favs || []).length ? ' · ' : ''}${T('Prefere não receber', 'Rather not get')}: ${(pr.exclude || []).map(y => P(y) ? esc(L(P(y).name)) : '').filter(Boolean).join(', ')}` : ''}</p>`
    : `<p class="small muted">${T('Sem favoritos nem exclusões.', 'No favourites or exclusions.')}</p>`;
  /* uma caixa (de subscrição ou comprada à unidade): conteúdo editável, peso estimado e nova sugestão */
  const boxBlock = (id, b, size, pr, items, locked, again, head) => {
    const sz = (BOX_SIZES[b.id] || []).find(z => z.s === size), kg = round2(items.reduce((a, i) => a + itemKg({ id: i.id, qty: i.qty }), 0));
    return `<div class="prep-box">${head || `<div class="row-gap prep-box-h"><span class="thumb">${artFor(b)}</span><span><b>${esc(L(b.name))}</b><br><span class="small muted">${sizeName(size)}${sz ? ` (${sz.kg} kg)` : ''}</span></span></div>`}
      ${prefsLine(pr)}
      ${itemsHTML(id, items, locked)}
      <p class="small muted">${T('Peso estimado', 'Estimated weight')}: ${numFmt(kg)} kg${sz ? ` / ${sz.kg} kg` : ''}</p>
      ${locked || !again ? '' : `<div class="row-btns"><button type="button" class="btn btn-line btn-sm" data-prep-again="${again}">${icon('repeat', 14)} ${T('Nova sugestão', 'New suggestion')}</button></div>`}</div>`;
  };
  const draft = (id, box, size, u) => { const done = PREPS.find(p => p.id === id); if (!prepDraft[id]) prepDraft[id] = done ? done.items.map(x => Object.assign({}, x)) : suggestBox(box, size, u); return { done, items: prepDraft[id] }; };
  const stageTag = st => `<span class="status ${st >= 3 ? 'ativa' : st === 2 ? 'ativa' : 'prog'}">${[T('Por preparar', 'To prepare'), T('Por preparar', 'To prepare'), T('Preparada', 'Packed'), T('Em distribuição', 'Out for delivery'), T('Entregue', 'Delivered')][st] || ''}</span>`;
  const who = (name, un, extra) => `<div><b>${esc(name)}</b>${un ? ` <span class="small muted">(${esc(un)})</span>` : ''}<br><span class="small">${extra}</span></div>`;
  /* encomendas da loja: produtos (já escolhidos) e caixas compradas à unidade (conteúdo escolhido aqui) */
  const orderCard = o => {
    const st = Math.min(orderStage(o), 4), locked = st >= 2, c = orderPrefs(o);
    const boxes = []; o.items.forEach((i, n) => { const p = P(i.id); if (p && p.cat === 'caixas') for (let k = 0; k < (i.qty || 1); k++) boxes.push({ id: `${o.num}-${n}-${k}`, p, size: i.size || (BOX_SIZES[p.id] || [{}])[0].s }); });
    const prods = o.items.filter(i => P(i.id) && P(i.id).cat !== 'caixas');
    return `<article class="panel prep${locked ? ' done' : ''}"><div class="row-between">${who(o.name, o.user, `${o.num} · ${o.deliver === 'home' ? T('entrega em casa', 'home delivery') + (o.window ? `, ${o.window}` : '') : esc(o.point || '')}`)}${stageTag(st)}</div>
      ${prods.length ? `<p class="lbl mt-s">${T('Produtos', 'Products')}</p><ul class="prep-items">${prods.map(i => `<li><span class="thumb sm">${artFor(P(i.id))}</span>${itemText(i)}</li>`).join('')}</ul>` : ''}
      ${boxes.map(b => { const x = draft(b.id, b.p, b.size, c); return boxBlock(b.id, b.p, b.size, c, locked ? (x.done ? x.done.items : x.items) : x.items, locked, `${b.id}|order|${o.num}`); }).join('')}
      <div class="row-btns mt-s">${locked ? (st === 2 ? `<button class="btn btn-line btn-sm" data-prep-order-undo="${o.num}">${T('Voltar a abrir', 'Reopen')}</button>` : '')
        : `<button class="btn btn-green btn-sm" data-prep-order="${o.num}">${icon('check', 16)} ${T('Marcar como preparada', 'Mark as packed')}</button>`}</div></article>`;
  };
  /* caixas das subscrições */
  const subCard = ({ c, s }) => {
    const b = P(s.box), id = `${s.id}-${ds}`, sz = (BOX_SIZES[s.box] || []).find(z => z.s === s.size), x = draft(id, b, s.size, c), st = x.done ? x.done.stage : 0, locked = !!x.done;
    const head = `<div class="row-between"><div class="row-gap"><span class="thumb">${artFor(b)}</span>${who(c.name, c.username, `${esc(L(b.name))}, ${sizeName(s.size)}${sz ? ` (${sz.kg} kg)` : ''} · ${s.deliver === 'home' ? T('entrega em casa', 'home delivery') : esc(s.point || T('ponto de recolha', 'pick-up point'))}`)}</div>${stageTag(st)}</div>`;
    return `<article class="panel prep${locked ? ' done' : ''}" data-prep="${id}">
      ${boxBlock(id, b, s.size, c, locked ? x.done.items : x.items, locked, `${id}|${s.id}|${c.username}`, head)}
      <div class="row-btns">${locked ? (st === 2 ? `<button class="btn btn-line btn-sm" data-prep-undo="${id}">${T('Voltar a abrir', 'Reopen')}</button>` : '')
        : `<button class="btn btn-green btn-sm" data-prep-ok="${id}|${s.id}|${c.username}">${icon('check', 16)} ${T('Aceitar e preparar', 'Accept and prepare')}</button>`}</div></article>`;
  };
  const todoSubs = subs.filter(({ s }) => !prepOf(s.id, ds)).length, todoOrd = orders.filter(o => orderStage(o) < 2).length;
  const ready = orders.filter(o => orderStage(o) === 2).length + PREPS.filter(p => p.date === ds && p.stage === 2).length;
  const out = orders.filter(o => orderStage(o) === 3).length + PREPS.filter(p => p.date === ds && p.stage === 3).length;
  return `<section class="acc-sec"><h2>${T('Preparar caixas', 'Prepare boxes')}</h2>
    <p class="muted mt-s">${T('Todas as encomendas da loja, as caixas compradas à unidade e as caixas das subscrições passam por aqui antes de seguirem. A sugestão das caixas dá prioridade aos favoritos, nunca põe o que o cliente prefere não receber, usa só produtos com stock e começa pelas colheitas mais antigas. Ao preparar, as quantidades saem do inventário.', 'Every shop order, single box and subscription box goes through here before leaving. Box suggestions favour favourites, never include what the customer would rather not get, only use products in stock and start with the oldest harvests. Packing takes the quantities out of the inventory.')}</p>
    <div class="range-row mt-s"><label class="lbl" for="prep-date">${T('Distribuição de', 'Delivery run on')}</label><input type="date" id="prep-date" data-prep-date value="${ds}"></div>
    <div class="kpis prep-kpis"><div><strong>${todoOrd + todoSubs}</strong><span>${T('por preparar', 'to prepare')}</span></div><div><strong>${ready}</strong><span>${T('preparadas', 'packed')}</span></div><div><strong>${out}</strong><span>${T('em distribuição', 'out for delivery')}</span></div></div>
    <div class="row-btns mt-s">${todoSubs > 1 ? `<button class="btn btn-line btn-sm c-campo" data-prep-all="${ds}">${icon('check', 16)} ${T(`Aceitar as ${todoSubs} sugestões das subscrições`, `Accept all ${todoSubs} subscription suggestions`)}</button>` : ''}
      ${ready ? `<button class="btn btn-green btn-sm" data-prep-ship="${ds}">${icon('truck', 16)} ${T(`Enviar ${ready} para distribuição`, `Send ${ready} out for delivery`)}</button>` : ''}
      ${out ? `<button class="btn btn-line btn-sm" data-prep-delivered="${ds}">${icon('check', 16)} ${T(`Marcar ${out} como entregues`, `Mark ${out} as delivered`)}</button>` : ''}</div>
    <h3 class="mt">${T('Encomendas da loja', 'Shop orders')} <span class="small muted">(${orders.length})</span></h3>
    ${orders.length ? `<div class="prep-list">${orders.map(orderCard).join('')}</div>` : `<p class="muted small">${T('Sem encomendas para este dia.', 'No orders for this day.')}</p>`}
    <h3 class="mt">${T('Caixas das subscrições', 'Subscription boxes')} <span class="small muted">(${subs.length})</span></h3>
    ${subs.length ? `<div class="prep-list">${subs.map(subCard).join('')}</div>` : `<p class="muted small">${T(`Não há caixas de subscrição para ${fdate(d, { weekday: 'long', day: 'numeric', month: 'long' })}.`, `No subscription boxes for ${fdate(d, { weekday: 'long', day: 'numeric', month: 'long' })}.`)}</p>`}</section>`;
}
function acceptPrep(id, subId, un, extra) {
  const c = USERS[un], items = (prepDraft[id] || []).filter(i => P(i.id) && i.qty > 0).map(i => ({ id: i.id, qty: +i.qty }));
  const s = c && subId ? (c.subs || []).find(x => x.id === subId) : null;
  const p = Object.assign({ id, sub: subId || null, user: c ? (NUVEM.on ? c._id : c.username) : null, date: id.slice(-10), box: s ? s.box : null, size: s ? s.size : null, items, stage: 2, at: nowISO() }, extra || {});
  try { savePrep(p); delete prepDraft[id]; return true; }
  catch (e) { if (e.stock) toast(T(`Sem stock suficiente de ${L(P(e.stock.product).name)} (restam ${numFmt(e.stock.left)}).`, `Not enough ${L(P(e.stock.product).name)} in stock (${numFmt(e.stock.left)} left).`)); return false; }
}
/* encomenda preparada: guarda o conteúdo das caixas compradas à unidade e passa a "Preparada" */
function prepareOrder(num) {
  const o = findOrder(num); if (!o) return false;
  for (const [n, i] of o.items.entries()) { const p = P(i.id); if (!p || p.cat !== 'caixas') continue;
    for (let k = 0; k < (i.qty || 1); k++) { const id = `${o.num}-${n}-${k}`; if (!prepDraft[id]) prepDraft[id] = suggestBox(p, i.size, orderPrefs(o));
      if (!acceptPrep(id, null, o.user, { date: o.slot, order: o.num, box: p.id, size: i.size || null, user: o.user && USERS[o.user] ? (NUVEM.on ? USERS[o.user]._id : o.user) : null })) return false; } }
  o.stage = 2; saveOrders(); notifyStageLocal(o); return true;
}
function setStageForDate(ds, from, to) {
  ORDERS.filter(o => o.slot === ds && o.status !== 'cancelada' && orderStage(o) === from).forEach(o => { o.stage = to; notifyStageLocal(o); });
  saveOrders();
  PREPS.filter(p => p.date === ds && p.stage === from).forEach(p => savePrep(Object.assign({}, p, { stage: to })));
}

/* ---------- inventário (gestão): stock por produto e todas as entregas ---------- */
let invQ = '', invFarmer = '';
function tabInventario() {
  const qn = norm(invQ);
  const prods = PRODUCTS.filter(p => p.cat !== 'caixas' && lotsOf(p.id).length && (!qn || norm(L(p.name)).includes(qn)));
  const lots = LOTS.filter(l => (!invFarmer || l.farmer === invFarmer) && (!qn || norm(L((P(l.product) || { name: { pt: '' } }).name)).includes(qn))).sort((a, b) => b.harvest.localeCompare(a.harvest));
  return `<section class="acc-sec"><h2>${T('Inventário', 'Inventory')}</h2>
    <p class="muted mt-s">${T('Cada entrega de um agricultor é um lote com data de colheita. O stock é o que falta vender; as encomendas e as caixas preparadas tiram primeiro dos lotes mais antigos.', 'Each farmer supply is a batch with a harvest date. Stock is what is left to sell; orders and prepared boxes take from the oldest batches first.')}</p>
    <label class="switch mt-s"><input type="checkbox" data-lock-lots${SETTINGS.lockLots ? ' checked' : ''}>${T('Bloquear alterações dos agricultores ao peso e à data de colheita das entregas já submetidas', 'Lock farmers\' changes to the weight and harvest date of supplies already sent')}</label>
    <div class="row-gap mt inv-filters"><div class="field grow"><label for="inv-q">${T('Procurar produto', 'Search product')}</label><input id="inv-q" data-inv-q value="${esc(invQ)}" autocomplete="off"></div>
      <div class="field"><label for="inv-f">${T('Agricultor', 'Farmer')}</label><select id="inv-f" data-inv-f><option value="">${T('Todos', 'All')}</option>${FARMERS.map(f => `<option value="${f.id}"${invFarmer === f.id ? ' selected' : ''}>${esc(f.name)}</option>`).join('')}</select></div></div>
    <h3 class="mt">${T('Stock por produto', 'Stock by product')}</h3>
    <div class="tbl-wrap"><table class="tbl"><thead><tr><th>${T('Produto', 'Product')}</th><th>${T('Em stock', 'In stock')}</th><th>${T('Colheita mais recente', 'Latest harvest')}</th><th>${T('Lote mais antigo', 'Oldest batch')}</th><th>${T('Época', 'Season')}</th></tr></thead><tbody>
      ${prods.map(p => { const ls = lotsOf(p.id).filter(l => lotLeft(l) > 0), old = ls.map(l => l.harvest).sort()[0], st = stockOf(p);
        return `<tr><td><a href="${productHref(p)}">${esc(L(p.name))}</a></td><td class="${st < 15 ? 'c-tomato' : ''}"><b>${stockText(p, st)}</b></td><td>${latestHarvest(p.id) ? fdate(latestHarvest(p.id)) : '–'}</td><td>${old ? fdate(parseISO(old)) : '–'}</td><td>${seasonLeft(p) === 0 ? `<span class="tag warn">${T('último mês', 'last month')}</span>` : seasonText(p)}</td></tr>`; }).join('')}
    </tbody></table></div>
    <h3 class="mt">${T('Entregas', 'Supplies')} <span class="small muted">(${lots.length})</span></h3>
    <div class="tbl-wrap"><table class="tbl"><thead><tr><th>${T('Produto', 'Product')}</th><th>${T('Agricultor', 'Farmer')}</th><th>${T('Colheita', 'Harvest')}</th><th>${T('Entregue', 'Supplied')}</th><th>${T('Vendido', 'Sold')}</th><th>${T('Transporte', 'Transport')}</th><th></th></tr></thead><tbody>
      ${lots.slice(0, 300).map(l => { const p = P(l.product), f = F(l.farmer); if (!p) return '';
        return `<tr><td>${esc(L(p.name))}${l.cold ? ` ${icon('snow', 14)}` : ''}${l.lab ? ` ${icon('doc', 14)}` : ''}</td><td>${f ? esc(f.name) : esc(l.farmer)}</td><td><input type="date" value="${l.harvest}" max="${iso(today())}" data-lot-date="${l.id}" aria-label="${T('Data de colheita', 'Harvest date')}"></td>
          <td><input class="num" type="number" min="${l.sold || 0.5}" step="0.5" value="${l.qty}" data-lot-qty="${l.id}" aria-label="${T('Quantidade', 'Quantity')}"> <span class="small">${byKg(p) ? 'kg' : unitWord(p.unit, l.qty)}</span></td>
          <td>${numFmt(l.sold || 0)}</td><td class="small">${l.transport === 'recolha' ? `${T('Recolha', 'Collect')} ${l.pickup ? fdate(parseISO(l.pickup)) : ''}` : T('Agricultor entrega', 'Farmer delivers')}</td>
          <td>${!(l.sold > 0) ? `<button class="btn btn-sm btn-ghost c-tomato" data-adm-lot-del="${l.id}">${icon('trash', 14)}</button>` : ''}</td></tr>`; }).join('')}
    </tbody></table></div></section>`;
}

/* ---------- parceiros: história e "agricultor desde" de cada quinta; "Selo desde" e cozinha de cada restaurante ---------- */
function tabParceiros() {
  return `<section class="acc-sec"><h2>${T('Agricultores e restaurantes', 'Farmers and restaurants')}</h2>
    <p class="muted mt-s">${T('Edite os textos e datas que aparecem nas páginas públicas. As alterações ficam por guardar até carregar em "Guardar alterações".', 'Edit the texts and dates shown on the public pages. Changes stay unsaved until you press "Save changes".')}</p>
    <h3 class="mt">${T('Agricultores', 'Farmers')}</h3>
    ${FARMERS.map(f => `<details class="panel mt-s"><summary><span class="row-gap"><span class="thumb">${farmPic(f)}</span><b>${esc(f.name)}</b> <span class="small muted">${esc(f.farm)}, ${esc(f.place)}</span></span></summary>
      <div class="form mt-s"><div class="row"><div class="field"><label for="ps-since-${f.id}">${T('Agricultor desde', 'Farming since')}</label><input id="ps-since-${f.id}" type="number" min="1900" max="${today().getFullYear()}" value="${f.since || ''}" data-ps-farmer="${f.id}" data-k="since"></div>
        <div class="field"><label for="ps-reg-${f.id}">${T('Região', 'Region')}</label><select id="ps-reg-${f.id}" data-ps-farmer="${f.id}" data-k="region">${Object.keys(REGIONS).map(k => `<option value="${k}"${f.region === k ? ' selected' : ''}>${regionName(k)}</option>`).join('')}</select></div></div>
      <div class="row"><div class="field"><label for="ps-spt-${f.id}">${T('A nossa história (português)', 'Our story (Portuguese)')}</label><textarea id="ps-spt-${f.id}" rows="4" data-ps-farmer="${f.id}" data-k="story.pt">${esc((f.story || {}).pt || '')}</textarea></div>
        <div class="field"><label for="ps-sen-${f.id}">${T('A nossa história (inglês)', 'Our story (English)')}</label><textarea id="ps-sen-${f.id}" rows="4" data-ps-farmer="${f.id}" data-k="story.en">${esc((f.story || {}).en || '')}</textarea></div></div></div></details>`).join('')}
    <h3 class="mt">${T('Restaurantes com o Selo Daqui', 'Restaurants with the Daqui Seal')}</h3>
    ${RESTAURANTS.map(r => `<details class="panel mt-s"><summary><b>${esc(r.name)}</b> <span class="small muted">${esc(cuisineName(r))} · ${T('Selo desde', 'Seal since')} ${r.since ? fdate(parseISO(r.since + '-15'), { month: 'long', year: 'numeric' }) : '–'}</span></summary>
      <div class="form mt-s"><div class="row"><div class="field"><label for="ps-rs-${r.id}">${T('Selo Daqui desde', 'Daqui Seal since')}</label><input id="ps-rs-${r.id}" type="month" value="${esc(r.since || '')}" max="${iso(today()).slice(0, 7)}" data-ps-rest="${r.id}" data-k="since"></div>
        <div class="field"><label for="ps-rc-${r.id}">${T('Tipo de cozinha', 'Cuisine')}</label><select id="ps-rc-${r.id}" data-ps-rest="${r.id}" data-k="cuisine">${CUISINES.map(c => `<option value="${c.id}"${cuisineOf(r) === c.id ? ' selected' : ''}>${esc(L(c))}</option>`).join('')}</select></div></div></div></details>`).join('')}
  </section>`;
}

/* ---------- promoções e códigos ---------- */
let promoForm = null;
function tabPromocoes() {
  const f = promoForm || { id: '', title: { pt: '', en: '' }, text: { pt: '', en: '' }, kind: 'percent', value: 10, min: 0, until: iso(addDays(today(), 14)), code: '', public: true, active: true };
  const claims = id => CLAIMS.filter(c => c.promo === id), stateOf = p => !p.active ? T('desativada', 'off') : parseISO(p.until) < today() ? T('terminou', 'ended') : T('ativa', 'active');
  return `<section class="acc-sec"><h2>${T('Promoções e códigos promocionais', 'Promotions and promo codes')}</h2>
    <p class="muted mt-s">${T('As promoções públicas aparecem no sininho de todos os clientes (e, na app, numa janela ao abrir). Cada cliente reclama a promoção e usa-a numa compra até à data limite. As promoções com código só aparecem a quem tiver o código.', 'Public promotions show in every customer\'s bell (and, in the app, in a card on opening). Each customer claims the promotion and uses it on one purchase before the deadline. Promotions with a code only reach people who have the code.')}</p>
    <form class="form panel mt" data-promo-form novalidate><h3>${f.id ? T('Editar promoção', 'Edit promotion') : T('Nova promoção', 'New promotion')}</h3>
      <div class="row"><div class="field"><label for="pm-tpt">${T('Título (português)', 'Title (Portuguese)')}</label><input id="pm-tpt" value="${esc(f.title.pt)}" required></div><div class="field"><label for="pm-ten">${T('Título (inglês)', 'Title (English)')}</label><input id="pm-ten" value="${esc(f.title.en)}"></div></div>
      <div class="row"><div class="field"><label for="pm-xpt">${T('Texto (português)', 'Text (Portuguese)')}</label><input id="pm-xpt" value="${esc(f.text.pt)}"></div><div class="field"><label for="pm-xen">${T('Texto (inglês)', 'Text (English)')}</label><input id="pm-xen" value="${esc(f.text.en)}"></div></div>
      <div class="row"><div class="field"><label for="pm-kind">${T('Tipo', 'Type')}</label><select id="pm-kind">${[['percent', T('Desconto em %', '% off')], ['valor', T('Desconto em €', '€ off')], ['portes', T('Portes grátis', 'Free delivery')]].map(([v, n]) => `<option value="${v}"${f.kind === v ? ' selected' : ''}>${n}</option>`).join('')}</select></div>
        <div class="field"><label for="pm-val">${T('Valor', 'Value')}</label><input id="pm-val" type="number" min="0" step="0.5" value="${f.value}"></div>
        <div class="field"><label for="pm-min">${T('Compra mínima (€)', 'Minimum order (€)')}</label><input id="pm-min" type="number" min="0" step="1" value="${f.min}"></div>
        <div class="field"><label for="pm-until">${T('Válida até', 'Valid until')}</label><input id="pm-until" type="date" min="${iso(today())}" value="${f.until}" required></div></div>
      <div class="row"><div class="field"><label for="pm-code">${T('Código (opcional)', 'Code (optional)')}</label><div class="code-row"><input id="pm-code" value="${esc(f.code)}" autocomplete="off"><button type="button" class="btn btn-line btn-sm c-campo" data-promo-gen>${T('Gerar', 'Generate')}</button></div></div>
        <div class="field"><span class="lbl">${T('Quem vê', 'Who sees it')}</span><label class="switch sm"><input type="checkbox" id="pm-pub"${f.public ? ' checked' : ''}>${T('Pública: aparece no sininho de todos', 'Public: shows in everyone\'s bell')}</label><label class="switch sm"><input type="checkbox" id="pm-act"${f.active ? ' checked' : ''}>${T('Ativa', 'Active')}</label></div></div>
      <p class="err" hidden></p><div class="row-btns"><button class="btn btn-green btn-sm" type="submit">${f.id ? T('Guardar promoção', 'Save promotion') : T('Criar promoção', 'Create promotion')}</button>${f.id ? `<button type="button" class="btn btn-line btn-sm" data-promo-new>${T('Nova', 'New')}</button>` : ''}</div></form>
    ${PROMOS.length ? `<div class="tbl-wrap mt"><table class="tbl"><thead><tr><th>${T('Promoção', 'Promotion')}</th><th>${T('Desconto', 'Discount')}</th><th>${T('Código', 'Code')}</th><th>${T('Até', 'Until')}</th><th>${T('Reclamada / usada', 'Claimed / used')}</th><th></th></tr></thead><tbody>
      ${PROMOS.map(p => `<tr><td><b>${esc(L(p.title))}</b><br><span class="small muted">${p.public ? T('pública', 'public') : T('só com código', 'code only')} · ${stateOf(p)}</span></td><td>${promoLabel(p)}${p.min ? `<br><span class="small muted">${T('mín.', 'min.')} ${money(p.min)}</span>` : ''}</td><td>${p.code ? `<code>${esc(p.code)}</code>` : '–'}</td><td>${fdate(parseISO(p.until))}</td><td>${claims(p.id).length} / ${claims(p.id).filter(c => c.used).length}</td>
        <td><button class="btn btn-sm btn-ghost" data-promo-edit="${p.id}">${icon('edit', 14)} ${T('Editar', 'Edit')}</button></td></tr>`).join('')}</tbody></table></div>` : `<p class="muted mt">${T('Ainda não há promoções.', 'No promotions yet.')}</p>`}</section>`;
}

/* ---------- definições: portes, quota da Cooperativa e bloqueio das entregas ---------- */
function tabDefinicoes() {
  return `<section class="acc-sec"><h2>${T('Definições da loja', 'Shop settings')}</h2>
    <form class="form panel mt" data-settings-form novalidate>
      <div class="row"><div class="field"><label for="st-home">${T('Entrega em casa (€)', 'Home delivery (€)')}</label><input id="st-home" type="number" min="0" step="0.10" value="${SETTINGS.homeFee}" required></div>
        <div class="field"><label for="st-point">${T('Entrega no ponto de recolha (€)', 'Pick-up point delivery (€)')}</label><input id="st-point" type="number" min="0" step="0.10" value="${SETTINGS.pointFee}" required></div>
        <div class="field"><label for="st-free">${T('Portes grátis a partir de (€)', 'Free delivery from (€)')}</label><input id="st-free" type="number" min="0" step="1" value="${SETTINGS.freeFrom}" required></div></div>
      <div class="row"><div class="field"><label for="st-coop">${T('Quota anual da Cooperativa (€)', 'Co-op yearly fee (€)')}</label><input id="st-coop" type="number" min="0" step="1" value="${SETTINGS.coopFee}" required></div>
        <div class="field"><span class="lbl">${T('Vantagens e regras', 'Perks and rules')}</span><label class="switch sm"><input type="checkbox" id="st-coopship"${SETTINGS.coopFreeShipping ? ' checked' : ''}>${T('Membros da Cooperativa não pagam portes', 'Co-op members get free delivery')}</label>
          <label class="switch sm"><input type="checkbox" id="st-lock"${SETTINGS.lockLots ? ' checked' : ''}>${T('Bloquear alterações às entregas já submetidas pelos agricultores', 'Lock changes to supplies already sent by farmers')}</label></div></div>
      <p class="small muted">${T('Caixas de cartão: 5 kg a 0,85 € e 10 kg a 1,00 € (fixo).', 'Cardboard boxes: 5 kg €0.85 and 10 kg €1.00 (fixed).')}</p>
      <button class="btn btn-green btn-sm" type="submit">${T('Guardar definições', 'Save settings')}</button></form></section>`;
}

Object.assign(ADMIN_EXTRA, {
  preparar: [() => T('Preparar caixas', 'Prepare boxes'), tabPreparar], inventario: [() => T('Inventário', 'Inventory'), tabInventario],
  parceiros: [() => T('Parceiros', 'Partners'), tabParceiros], promocoes: [() => T('Promoções', 'Promotions'), tabPromocoes], definicoes: [() => T('Definições', 'Settings'), tabDefinicoes]
});

/* ---------- eventos ---------- */
PAGE_EVENTS.click.push((e, t, d) => {
  if (PAGE !== 'conta' || !adminOnly()) return;
  if (d.inboxDays) { inboxTo = iso(today()); inboxFrom = iso(addDays(today(), -+d.inboxDays)); rerenderKeep(`[data-inbox-days="${d.inboxDays}"]`); return true; }
  if (d.bsAdd) { const used = new Set((BOX_SIZES[d.bsAdd] || []).map(z => z.s)), code = SIZE_CODES.find(c => !used.has(c)); const last = (BOX_SIZES[d.bsAdd] || []).slice(-1)[0] || { kg: 5, price: 15 };
    boxSizesEdit(d.bsAdd, l => { l.push({ s: code, kg: +last.kg + 3, price: round2(+last.price + 6) }); l.sort((a, b2) => a.kg - b2.kg); }); rerenderKeep(); return true; }
  if (d.bsDel) { const [id, i] = d.bsDel.split('|'); boxSizesEdit(id, l => l.splice(+i, 1)); rerenderKeep(); return true; }
  if (d.prepRm) { const [id, k] = d.prepRm.split('|'); (prepDraft[id] || []).splice(+k, 1); rerenderKeep(); return true; }
  if (d.prepAdd) { const id = d.prepAdd, have = new Set((prepDraft[id] || []).map(i => i.id)); const p = PRODUCTS.find(x => x.cat !== 'caixas' && available(x) && !have.has(x.id)); if (p) (prepDraft[id] = prepDraft[id] || []).push({ id: p.id, qty: byKg(p) ? 1 : 1, why: [] }); rerenderKeep(); return true; }
  /* nova sugestão: para uma caixa de subscrição (id|subscrição|cliente) ou comprada à unidade (id|order|número) */
  if (d.prepAgain) { const [id, sid, ref] = d.prepAgain.split('|'), ids = (prepDraft[id] || []).map(i => i.id);
    /* troca o que não é favorito (os favoritos ficam); se só houver favoritos, troca o último */
    const favOf = pr => new Set((pr && pr.favs) || []), rot = pr => { const f = favOf(pr), nf = ids.filter(x => !f.has(x)); return nf.length ? nf : ids.slice(-1); };
    const cur = sid === 'order' ? rot(orderPrefs(findOrder(ref) || { items: [] })) : rot(USERS[ref]);
    if (sid === 'order') { const o = findOrder(ref), n = +id.split('-').slice(-2)[0], it = o && o.items[n]; if (!it) return true;
      prepDraft[id] = suggestBox(P(it.id), it.size || (BOX_SIZES[it.id] || [{}])[0].s, orderPrefs(o), cur); }
    else { const c = USERS[ref], s = c && (c.subs || []).find(x => x.id === sid); if (!s) return true; prepDraft[id] = suggestBox(P(s.box), s.size, c, cur); }
    rerenderKeep(); return true; }
  if (d.prepOk) { const [id, sid, un] = d.prepOk.split('|'); if (acceptPrep(id, sid, un)) toast(T('Caixa preparada', 'Box prepared')); rerenderKeep(); return true; }
  if (d.prepAll) { const day = parseISO(d.prepAll); let n = 0;
    Object.values(USERS).forEach(c => (c.subs || []).filter(s => deliversOn(s, day) && !prepOf(s.id, d.prepAll)).forEach(s => { const id = `${s.id}-${d.prepAll}`; if (!prepDraft[id]) prepDraft[id] = suggestBox(P(s.box), s.size, c); if (acceptPrep(id, s.id, c.username)) n++; }));
    toast(T(`${n} caixas preparadas`, `${n} boxes prepared`)); rerenderKeep(); return true; }
  if (d.prepOrder) { if (prepareOrder(d.prepOrder)) toast(T('Encomenda preparada', 'Order packed')); rerenderKeep(); return true; }
  if (d.prepOrderUndo) { const o = findOrder(d.prepOrderUndo); PREPS.filter(p => p.order === o.num).map(p => p.id).forEach(id => deletePrep(id)); o.stage = 1; saveOrders(); toast(T('A encomenda voltou a "Em preparação" (stock reposto).', 'The order is back to "Being packed" (stock restored).')); rerenderKeep(); return true; }
  if (d.prepShip) { setStageForDate(d.prepShip, 2, 3); toast(T('Enviadas para distribuição: os clientes foram avisados.', 'Sent out for delivery: customers were notified.')); rerenderKeep(); return true; }
  if (d.prepDelivered) { setStageForDate(d.prepDelivered, 3, 4); toast(T('Marcadas como entregues', 'Marked as delivered')); rerenderKeep(); return true; }
  if (d.prepUndo) { deletePrep(d.prepUndo); toast(T('A caixa voltou a ficar por preparar (o stock foi reposto).', 'The box is back to "to prepare" (stock restored).')); rerenderKeep(); return true; }
  if (d.admLotDel) { const l = LOTS.find(x => x.id === d.admLotDel); if (l && !(l.sold > 0)) { deleteLot(l.id); toast(T('Entrega apagada', 'Supply deleted')); rerenderKeep(); } return true; }
  if ('promoGen' in d) { const i = $('#pm-code'); if (i) i.value = newPromoCode(); return true; }
  if ('promoNew' in d) { promoForm = null; rerenderKeep('#pm-tpt'); return true; }
  if (d.promoEdit) { promoForm = JSON.parse(JSON.stringify(PROMOS.find(p => p.id === d.promoEdit))); rerenderKeep('#pm-tpt'); scrollTo({ top: $('[data-promo-form]').getBoundingClientRect().top + scrollY - 90 }); return true; }
});
PAGE_EVENTS.change.push((e, t) => {
  if (PAGE !== 'conta' || !adminOnly()) return;
  const d = t.dataset;
  if (t.id === 'ib-from' || t.id === 'ib-to') { if (t.value) { if (t.id === 'ib-from') inboxFrom = t.value; else inboxTo = t.value; if (inboxFrom > inboxTo) [inboxFrom, inboxTo] = [inboxTo, inboxFrom]; rerenderKeep('#' + t.id); } return true; }
  if (d.bsKg || d.bsPrice) { const [id, i] = (d.bsKg || d.bsPrice).split('|'), v = Math.max(0, +t.value || 0); boxSizesEdit(id, l => { if (d.bsKg) l[+i].kg = v; else l[+i].price = round2(v); }); if (d.bsKg) rerenderKeep(); return true; }
  if (d.bi) { boxItemsEdit(d.bi, set => { if (t.checked) set.add(t.value); else set.delete(t.value); }); rerenderKeep(`[data-bi="${d.bi}"][value="${t.value}"]`); return true; }
  if (d.bm) { const b = P(d.bm); boxEdOpen = d.bm; editCatalog(ch => { ch.boxCfg = { [d.bm]: { items: b.items || boxProducts(b).map(p => p.id), mode: t.value } }; }); return true; }
  if ('prepDate' in d) { prepDate = t.value; prepDraft = {}; rerenderKeep('#prep-date'); return true; }
  if (d.prepProd) { const [id, k] = d.prepProd.split('|'); const it = (prepDraft[id] || [])[+k]; if (it) { it.id = t.value; it.why = []; } rerenderKeep(`[data-prep-prod="${d.prepProd}"]`); return true; }
  if (d.prepQty) { const [id, k] = d.prepQty.split('|'); const it = (prepDraft[id] || [])[+k]; if (it) it.qty = Math.max(0, +t.value || 0); rerenderKeep(`[data-prep-qty="${d.prepQty}"]`); return true; }
  if ('lockLots' in d) { saveSettings({ lockLots: t.checked }); toast(t.checked ? T('Alterações às entregas bloqueadas', 'Supply changes locked') : T('Alterações às entregas desbloqueadas', 'Supply changes unlocked')); return true; }
  if ('invF' in d) { invFarmer = t.value; rerenderKeep('#inv-f'); return true; }
  if (d.lotDate || d.lotQty) { const l = LOTS.find(x => x.id === (d.lotDate || d.lotQty)); if (!l) return true;
    if (d.lotQty) { const v = round2(+t.value); if (v < (l.sold || 0) || !(v > 0)) { toast(T('A quantidade não pode ser menor do que o vendido.', 'The quantity cannot be lower than what was sold.')); t.value = l.qty; return true; } l.qty = v; } else l.harvest = t.value;
    saveLot(l); toast(T('Entrega atualizada', 'Supply updated')); return true; }
  if (d.psFarmer) { const id = d.psFarmer, f = F(id), k = d.k; let o;
    if (k === 'since') o = { since: +t.value || null }; else if (k === 'region') o = { region: t.value, island: ISLAND_REGIONS.includes(t.value) ? t.value : '' };
    else { const st = Object.assign({}, f.story || {}); st[k.split('.')[1]] = t.value.trim(); o = { story: st }; }
    editCatalog(ch => { ch.farmers = { [id]: o }; }); return true; }
  if (d.psRest) { const id = d.psRest, k = d.k; let o;
    if (k === 'since') o = { since: t.value || null }; else { const c = CUISINES.find(x => x.id === t.value); o = { cuisine: t.value, kind: { pt: c.pt, en: c.en } }; }
    editCatalog(ch => { ch.restaurants = { [id]: o }; }); return true; }
});
PAGE_EVENTS.input.push((e, t) => {
  if (PAGE !== 'conta' || !adminOnly()) return;
  if (t.dataset.bq) { boxEdQ[t.dataset.bq] = t.value; boxEdOpen = t.dataset.bq; rerenderKeep('#bq-' + t.dataset.bq); return true; }
  if ('invQ' in t.dataset) { invQ = t.value; rerenderKeep('#inv-q'); return true; }
});
PAGE_EVENTS.submit.push((e, f) => {
  if (PAGE !== 'conta' || !adminOnly()) return;
  if (f.matches('[data-settings-form]')) { e.preventDefault(); if (!validate(f)) return true;
    saveSettings({ homeFee: round2(+$('#st-home').value), pointFee: round2(+$('#st-point').value), freeFrom: round2(+$('#st-free').value), coopFee: round2(+$('#st-coop').value), coopFreeShipping: $('#st-coopship').checked, lockLots: $('#st-lock').checked });
    toast(T('Definições guardadas', 'Settings saved')); rerenderKeep(); return true; }
  if (f.matches('[data-promo-form]')) { e.preventDefault(); if (!validate(f)) return true;
    const err = $('.err', f), code = $('#pm-code').value.trim().toUpperCase();
    if (code && PROMOS.some(p => p.code && p.code.toUpperCase() === code && p.id !== (promoForm && promoForm.id))) { err.hidden = false; err.textContent = T('Esse código já existe.', 'That code already exists.'); return true; }
    if (!$('#pm-pub').checked && !code) { err.hidden = false; err.textContent = T('Uma promoção que não é pública precisa de um código.', 'A promotion that is not public needs a code.'); return true; }
    const p = { id: (promoForm && promoForm.id) || 'PR-' + Date.now().toString(36).toUpperCase(), title: { pt: $('#pm-tpt').value.trim(), en: $('#pm-ten').value.trim() || $('#pm-tpt').value.trim() }, text: { pt: $('#pm-xpt').value.trim(), en: $('#pm-xen').value.trim() || $('#pm-xpt').value.trim() },
      kind: $('#pm-kind').value, value: Math.max(0, +$('#pm-val').value || 0), min: Math.max(0, +$('#pm-min').value || 0), until: $('#pm-until').value, code, public: $('#pm-pub').checked, active: $('#pm-act').checked, created: (promoForm && promoForm.created) || nowISO() };
    if (p.kind === 'percent' && p.value > 90) { err.hidden = false; err.textContent = T('O desconto não pode passar de 90%.', 'The discount cannot be over 90%.'); return true; }
    savePromo(p); promoForm = null; toast(T('Promoção guardada', 'Promotion saved')); rerenderKeep(); return true; }
});

/* ---------- Encomendas (gestão): caixas das subscrições, com o estado de cada uma ---------- */
function subBoxesAdmin() {
  const rows = Object.values(USERS).flatMap(c => subDeliveries(c).map(x => Object.assign({ c }, x))).filter(x => x.stage > 0 || x.date <= iso(addDays(today(), 14))).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 200);
  return `<h3 class="mt-l">${T('Caixas das subscrições', 'Subscription boxes')} <span class="small muted">(${rows.length})</span></h3>
    <div class="tbl-wrap"><table class="tbl"><thead><tr><th>${T('Entrega', 'Delivery')}</th><th>${T('Cliente', 'Customer')}</th><th>${T('Caixa', 'Box')}</th><th>${T('Conteúdo', 'Contents')}</th><th>${T('Estado', 'Status')}</th></tr></thead><tbody>
    ${rows.map(x => `<tr><td>${fdate(parseISO(x.date), { weekday: 'short', day: 'numeric', month: 'short' })}</td><td>${esc(x.c.name)}<br><span class="small muted">${x.s.deliver === 'home' ? T('Casa', 'Home') : esc(x.s.point || '')}</span></td><td>${esc(L(P(x.box).name))}, ${sizeName(x.size)}</td>
      <td class="small">${x.items.length ? x.items.map(i => P(i.id) ? `${esc(L(P(i.id).name))} ${numFmt(i.qty)}` : '').join(', ') : `<a class="link" href="${href('conta', 'tab=preparar')}">${T('Preparar', 'Prepare')}</a>`}</td>
      <td>${x.stage >= 2 ? `<select class="sel sm" data-box-stage="${x.id}" aria-label="${T('Estado', 'Status')}">${[2, 3, 4].map(n => `<option value="${n}"${x.stage === n ? ' selected' : ''}>${BOX_STAGES()[n]}</option>`).join('')}</select>` : `<span class="status prog">${BOX_STAGES()[x.stage]}</span>`}</td></tr>`).join('')}
    </tbody></table></div>`;
}
PAGE_EVENTS.change.push((e, t) => {
  if (PAGE !== 'conta' || !t.dataset.boxStage || !adminOnly()) return;
  const p = PREPS.find(x => x.id === t.dataset.boxStage); if (p) { savePrep(Object.assign({}, p, { stage: +t.value })); toast(T('Estado da caixa atualizado', 'Box status updated')); }
  return true;
});

/* ---------- catálogo: nome e detalhes de qualquer produto (não só dos novos) ---------- */
function prodEditModal(id) {
  const p = P(id); if (!p) return;
  const v = (o, l) => esc((o && o[l]) || '');
  openModal(`<div class="mbody"><h2>${T('Nome e detalhes', 'Name and details')}</h2><p class="small muted">${esc(p.id)}</p>
    <form class="form mt-s" data-prod-edit-form="${p.id}" novalidate>
      <div class="row"><div class="field"><label for="pe-npt">${T('Nome (português)', 'Name (Portuguese)')}</label><input id="pe-npt" value="${v(p.name, 'pt')}" required></div><div class="field"><label for="pe-nen">${T('Nome (inglês)', 'Name (English)')}</label><input id="pe-nen" value="${v(p.name, 'en')}" required></div></div>
      <div class="field"><label for="pe-dpt">${T('Descrição (português)', 'Description (Portuguese)')}</label><textarea id="pe-dpt" rows="3">${v(p.desc, 'pt')}</textarea></div>
      <div class="field"><label for="pe-den">${T('Descrição (inglês)', 'Description (English)')}</label><textarea id="pe-den" rows="3">${v(p.desc, 'en')}</textarea></div>
      <div class="row"><div class="field"><label for="pe-cat">${T('Categoria', 'Category')}</label><select id="pe-cat">${['fruta', 'legumes'].map(c => `<option value="${c}"${p.cat === c ? ' selected' : ''}>${catName(c)}</option>`).join('')}</select></div>
        <div class="field"><label for="pe-unit">${T('Vende-se ao/à', 'Sold by')}</label><select id="pe-unit">${[['kg', T('quilo', 'kilo')], ['un', T('unidade', 'unit')], ['molho', T('molho', 'bunch')], ['cuv', T('cuvete', 'punnet')]].map(([x, n]) => `<option value="${x}"${p.unit === x ? ' selected' : ''}>${n}</option>`).join('')}</select></div></div>
      <div class="field"><label for="pe-al">${T('Outros nomes para a pesquisa (separados por vírgulas)', 'Other names for search (comma separated)')}</label><input id="pe-al" value="${esc((p.aliases || []).join(', '))}"></div>
      <div class="row-gap"><label class="switch sm"><input type="checkbox" id="pe-ess"${p.essential ? ' checked' : ''}>${T('Essencial (entra na Caixa Essencial)', 'Essential (goes in the Essentials Box)')}</label></div>
      <p class="err" hidden></p><div class="row-btns mt-s"><button class="btn btn-green" type="submit">${T('Guardar', 'Save')}</button><button type="button" class="btn btn-line c-campo" data-modal-close>${T('Cancelar', 'Cancel')}</button></div></form></div>`, T('Editar produto', 'Edit product'));
}
PAGE_EVENTS.click.push((e, t, d) => { if (d.prodEdit && adminOnly()) { prodEditModal(d.prodEdit); return true; } });
PAGE_EVENTS.submit.push((e, f) => {
  if (!f.matches('[data-prod-edit-form]') || !adminOnly()) return; e.preventDefault(); if (!validate(f)) return true;
  const id = f.dataset.prodEditForm, o = { name: { pt: $('#pe-npt').value.trim(), en: $('#pe-nen').value.trim() }, desc: { pt: $('#pe-dpt').value.trim(), en: $('#pe-den').value.trim() || $('#pe-dpt').value.trim() },
    cat: $('#pe-cat').value, unit: $('#pe-unit').value, essential: $('#pe-ess').checked, aliases: $('#pe-al').value.split(',').map(x => x.trim()).filter(Boolean) };
  saveCatalog(ch => { ch.products = ch.products || {}; ch.products[id] = Object.assign(ch.products[id] || {}, o); });
  closeModal(); toast(T('Produto atualizado', 'Product updated')); rerenderKeep(); return true;
});
