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
  const rows = Object.values(USERS).flatMap(c => (c.subs || []).filter(s => deliversOn(s, d)).map(s => ({ c, s })));
  const card = ({ c, s }) => {
    const b = P(s.box), id = `${s.id}-${ds}`, done = prepOf(s.id, ds), sz = (BOX_SIZES[s.box] || []).find(z => z.s === s.size);
    const items = prepDraft[id] || (done ? done.items.map(x => Object.assign({}, x)) : suggestBox(b, s.size, c));
    if (!prepDraft[id] && !done) prepDraft[id] = items;
    const kg = round2(items.reduce((a, i) => a + itemKg({ id: i.id, qty: i.qty }), 0));
    const whyTxt = w => ({ fav: T('favorito', 'favourite'), old: T('colheita mais antiga', 'older harvest'), season: T('a sair de época', 'leaving season') })[w];
    return `<article class="panel prep${done ? ' done' : ''}" data-prep="${id}">
      <div class="row-between"><div class="row-gap"><span class="thumb">${artFor(b)}</span><div><b>${esc(c.name)}</b> <span class="small muted">(${esc(c.username)})</span><br>
        <span class="small">${esc(L(b.name))}, ${sizeName(s.size)} (${sz ? sz.kg : s.kg} kg) · ${s.deliver === 'home' ? T('entrega em casa', 'home delivery') : esc(s.point || T('ponto de recolha', 'pick-up point'))}</span></div></div>
        <span class="status ${done ? 'ativa' : 'prog'}">${done ? T('Preparada', 'Prepared') : T('Por preparar', 'To prepare')}</span></div>
      ${(c.favs || []).length || (c.exclude || []).length ? `<p class="small muted mt-s">${(c.favs || []).length ? `${icon('heart', 14)} ${(c.favs || []).map(x => P(x) ? esc(L(P(x).name)) : '').filter(Boolean).slice(0, 8).join(', ')}` : ''}${(c.exclude || []).length ? ` · ${T('Prefere não receber', 'Rather not get')}: ${(c.exclude || []).map(x => P(x) ? esc(L(P(x).name)) : '').filter(Boolean).join(', ')}` : ''}</p>` : ''}
      <ul class="prep-items">${items.map((i, k) => { const p = P(i.id); if (!p) return ''; const low = tracksStock(p) && stockOf(p) < i.qty && !done;
        return `<li><span class="thumb sm">${artFor(p)}</span><select data-prep-prod="${id}|${k}" aria-label="${T('Produto', 'Product')}">${PRODUCTS.filter(x => x.cat !== 'caixas' && (available(x) || x.id === i.id)).sort((a, b2) => L(a.name).localeCompare(L(b2.name))).map(x => `<option value="${x.id}"${x.id === i.id ? ' selected' : ''}>${esc(L(x.name))}</option>`).join('')}</select>
          <input class="num" type="number" min="0.5" step="${byKg(p) ? 0.5 : 1}" value="${i.qty}" data-prep-qty="${id}|${k}" aria-label="${T('Quantidade', 'Quantity')}"> <span class="small">${byKg(p) ? 'kg' : unitWord(p.unit, i.qty)}</span>
          ${(i.why || []).map(w => `<span class="tag">${whyTxt(w)}</span>`).join('')}${low ? `<span class="tag warn">${T('stock', 'stock')}: ${stockText(p, stockOf(p))}</span>` : ''}
          ${done ? '' : `<button type="button" class="icon-btn" data-prep-rm="${id}|${k}" aria-label="${T('Tirar', 'Remove')}">${icon('close', 16)}</button>`}</li>`; }).join('')}</ul>
      <p class="small muted">${T('Peso estimado', 'Estimated weight')}: ${numFmt(kg)} kg ${sz ? `/ ${sz.kg} kg` : ''}</p>
      <div class="row-btns">${done ? `<button class="btn btn-line btn-sm" data-prep-undo="${id}">${T('Voltar a abrir', 'Reopen')}</button>`
        : `<button class="btn btn-green btn-sm" data-prep-ok="${id}|${s.id}|${c.username}">${icon('check', 16)} ${T('Aceitar e preparar', 'Accept and prepare')}</button>
           <button class="btn btn-line btn-sm" data-prep-add="${id}">${icon('plus', 14)} ${T('Produto', 'Product')}</button>
           <button class="btn btn-line btn-sm" data-prep-again="${id}|${s.id}|${c.username}">${icon('repeat', 14)} ${T('Nova sugestão', 'New suggestion')}</button>`}</div></article>`;
  };
  const todo = rows.filter(({ s }) => !prepOf(s.id, ds)).length;
  return `<section class="acc-sec"><h2>${T('Preparar caixas', 'Prepare boxes')}</h2>
    <p class="muted mt-s">${T('No dia antes de cada distribuição aparecem aqui as caixas das subscrições. A sugestão dá prioridade aos favoritos do cliente, nunca põe o que prefere não receber, usa só produtos com stock e começa pelas colheitas mais antigas e pelos produtos a sair de época. Ao aceitar, as quantidades saem do inventário.', 'The day before each delivery, the subscription boxes show up here. The suggestion favours the customer\'s favourites, never includes what they would rather not get, only uses products in stock and starts with the oldest harvests and products leaving season. Accepting takes the quantities out of the inventory.')}</p>
    <div class="range-row mt-s"><label class="lbl" for="prep-date">${T('Entrega de', 'Delivery on')}</label><input type="date" id="prep-date" data-prep-date value="${ds}">
      ${todo > 1 ? `<button class="btn btn-green btn-sm" data-prep-all="${ds}">${icon('check', 16)} ${T(`Aceitar as ${todo} sugestões`, `Accept all ${todo} suggestions`)}</button>` : ''}</div>
    ${rows.length ? `<p class="small mt-s"><b>${rows.length}</b> ${rows.length === 1 ? T('caixa', 'box') : T('caixas', 'boxes')} · ${todo} ${T('por preparar', 'to prepare')}</p><div class="prep-list">${rows.map(card).join('')}</div>`
      : `<p class="muted mt">${T(`Não há caixas de subscrição para ${fdate(d, { weekday: 'long', day: 'numeric', month: 'long' })}.`, `No subscription boxes for ${fdate(d, { weekday: 'long', day: 'numeric', month: 'long' })}.`)}</p>`}</section>`;
}
function acceptPrep(id, subId, un) {
  const c = USERS[un], items = (prepDraft[id] || []).filter(i => P(i.id) && i.qty > 0).map(i => ({ id: i.id, qty: +i.qty }));
  const p = { id, sub: subId, user: c ? (NUVEM.on ? c._id : c.username) : null, date: id.slice(-10), items, at: nowISO() };
  try { savePrep(p); delete prepDraft[id]; return true; }
  catch (e) { if (e.stock) toast(T(`Sem stock suficiente de ${L(P(e.stock.product).name)} (restam ${numFmt(e.stock.left)}).`, `Not enough ${L(P(e.stock.product).name)} in stock (${numFmt(e.stock.left)} left).`)); return false; }
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
    <div class="row-gap mt"><div class="field grow"><label for="inv-q">${T('Procurar produto', 'Search product')}</label><input id="inv-q" data-inv-q value="${esc(invQ)}" autocomplete="off"></div>
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
  if (d.prepAgain) { const [id, sid, un] = d.prepAgain.split('|'), c = USERS[un], s = (c.subs || []).find(x => x.id === sid); const cur = (prepDraft[id] || []).map(i => i.id);
    prepDraft[id] = suggestBox(P(s.box), s.size, c, cur.slice(0, 2)); rerenderKeep(); return true; }
  if (d.prepOk) { const [id, sid, un] = d.prepOk.split('|'); if (acceptPrep(id, sid, un)) toast(T('Caixa preparada', 'Box prepared')); rerenderKeep(); return true; }
  if (d.prepAll) { const day = parseISO(d.prepAll); let n = 0;
    Object.values(USERS).forEach(c => (c.subs || []).filter(s => deliversOn(s, day) && !prepOf(s.id, d.prepAll)).forEach(s => { const id = `${s.id}-${d.prepAll}`; if (!prepDraft[id]) prepDraft[id] = suggestBox(P(s.box), s.size, c); if (acceptPrep(id, s.id, c.username)) n++; }));
    toast(T(`${n} caixas preparadas`, `${n} boxes prepared`)); rerenderKeep(); return true; }
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
