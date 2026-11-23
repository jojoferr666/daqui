/* ===== Daqui — área de parceiro (/parceiro) para contas de agricultor e de restaurante =====
   Agricultor: perfil da quinta, stock dos seus produtos, propor produtos novos e dias Colhe Connosco, pedir armazenamento em frio.
   Restaurante: estado do Selo Daqui, perfil, prato da semana e pratos do menu com produtos Daqui.
   O que é publicado diretamente (perfil, stock, prato) usa saveCatalog(); o resto vai para os pedidos da gestão. */
PAGES.parceiro = () => {
  const u = currentUser();
  if (!u) { location.replace(href('entrar', 'next=parceiro')); return { title: T('Entrar', 'Sign in'), html: '' }; }
  if (!u.partner) return { title: T('Área de parceiro', 'Partner area'), html: `${crumbs([[T('Área de parceiro', 'Partner area'), 'parceiro']])}<div class="wrap page-head"><h1>${T('Área de parceiro', 'Partner area')}</h1>
    <p class="lead">${T('Esta área é para agricultores e restaurantes parceiros. Crie uma conta de parceiro para vender na Daqui ou pedir o Selo Daqui.', 'This area is for partner farmers and restaurants. Create a partner account to sell on Daqui or apply for the Daqui seal.')}</p>
    <div class="row-btns mt"><a class="btn btn-green" href="${href('entrar', 'modo=registo&tipo=agricultor')}">${T('Sou agricultor', 'I\'m a farmer')}</a><a class="btn btn-green" href="${href('entrar', 'modo=registo&tipo=restaurante')}">${T('Tenho um restaurante', 'I run a restaurant')}</a><a class="btn btn-line c-campo" href="${href('conta')}">${T('A minha conta', 'My account')}</a></div></div><div class="spacer"></div>` };
  const pt = u.partner, farmer = pt.kind === 'agricultor', status = partnerStatusNote(u);
  const html = `${crumbs([[T('Área de parceiro', 'Partner area'), 'parceiro']])}
  <div class="wrap page-head row-between"><div><h1>${farmer ? esc(pt.farm) : esc(pt.name)}</h1><p class="muted">${farmer ? T('Área do agricultor', 'Farmer area') : T('Área do restaurante', 'Restaurant area')}. ${esc(u.name)} (${esc(u.username)})</p></div>
    <div class="row-btns"><a class="btn btn-line c-campo" href="${href('conta')}">${T('Encomendas e conta', 'Orders and account')}</a><button class="btn btn-line c-campo" data-logout>${icon('logout', 18)}${T('Terminar sessão', 'Sign out')}</button></div></div>
  <div class="wrap account">${status}${farmer ? farmerArea(u) : restaurantArea(u)}</div><div class="spacer"></div>`;
  return { title: T('Área de parceiro', 'Partner area'), html };
};

/* estado da adesão: aprovada, em análise ou não aprovada (com a mensagem da equipa Daqui, se houver) */
function partnerStatusNote(u) {
  const pt = u.partner, farmer = pt.kind === 'agricultor';
  const msg = pt.reply ? `<br><span class="small">${T('Mensagem da equipa Daqui', 'Message from the Daqui team')}: «${esc(pt.reply)}»</span>` : '';
  if (pt.approved) return `<p class="note done">${icon('check', 22)}<span><b>${farmer ? T('Quinta parceira aprovada.', 'Approved partner farm.') : T('Selo Daqui atribuído.', 'Daqui seal awarded.')}</b> ${T('O que publicar aqui aparece logo no site.', 'What you publish here shows on the site straight away.')}${msg}</span></p>`;
  if (pt.rejected) return `<p class="note warn">${icon('alert', 22)}<span><b>${T('O seu pedido não foi aprovado.', 'Your application was not approved.')}</b>${msg}<br><button class="link" data-partner-retry>${T('Pedir nova análise', 'Ask for a new review')}</button> · <button class="link" data-chat-open>${T('Falar com a Daqui', 'Talk to Daqui')}</button></span></p>`;
  return `<p class="note">${icon('clock', 22)}<span><b>${T('Pedido em análise pela equipa Daqui.', 'Application under review by the Daqui team.')}</b> ${T('Já pode preparar o seu perfil. Fica visível no site depois da aprovação.', 'You can already prepare your profile. It becomes visible on the site once approved.')}</span></p>`;
}
/* as secções da área de parceiro, uma a uma (a app para telemóvel mostra cada uma no seu separador) */
function partnerSections(u) { const html = u.partner.kind === 'agricultor' ? farmerArea(u) : restaurantArea(u); return html.split('<section class="acc-sec"').slice(1).map(x => '<section class="acc-sec"' + x); }
function myRequests(u, type) { return REQUESTS.filter(r => r.partnerUser === u.username && r.type === type).sort((a, b) => b.created.localeCompare(a.created)); }
function reqStatus(r) { const d = r.decision || (r.approved ? 'aprovado' : ''); return d === 'aprovado' ? `<span class="status ativa">${T('Aprovado', 'Approved')}</span>` : d === 'rejeitado' ? `<span class="status pausada">${T('Não aprovado', 'Not approved')}</span>` : r.status === 'tratado' ? `<span class="status pausada">${T('Analisado', 'Reviewed')}</span>` : `<span class="status prog">${T('Em análise', 'Under review')}</span>`; }
const reqReply = r => (r.reply ? `<br><span class="small">${T('Equipa Daqui', 'Daqui team')}: «${esc(r.reply)}»</span>` : '');
/* um produto, na lista do agricultor: só as ofertas dele contam para o stock */
const myOffers = (p, fid) => offersOf(p).filter(o => o.farmer === fid);
function setMyStock(p, fid, out) {
  const offers = offersOf(p).map(o => Object.assign({}, o, o.farmer === fid ? { outOfStock: out } : {}));
  if (NUVEM.on) { Object.assign(p, { producers: offers, outOfStock: offers.every(o => o.outOfStock) }); NUVEM.setStock(p.id, out); return; }
  saveOffers(p, offers);
}
/* agricultor: deixar de vender um produto (por exemplo, deixou de trabalhar o pomar). Sem nenhum produtor, o produto fica sem stock. */
function leaveProduct(p, fid) {
  const offers = offersOf(p).filter(o => o.farmer !== fid).map(o => Object.assign({}, o));
  if (NUVEM.on) { Object.assign(p, { producers: offers, organic: offers.some(o => o.organic), outOfStock: !offers.length || offers.every(o => o.outOfStock), farmer: offers.some(o => o.farmer === p.farmer) ? p.farmer : offers.length ? offers[0].farmer : null }); NUVEM.leaveProduct(p.id); return; }
  saveOffers(p, offers);
}
/* agricultor ou gestão: editar um dia Colhe Connosco antes de começar (data, horário, lugares, produto) */
function editHarvestDay(id, patch) {
  const d = HD(id); if (!d) return false;
  if (patch.date !== d.date && HARVEST_DAYS.some(x => x.id !== id && x.date === patch.date && x.farmer === d.farmer)) return T('A sua quinta já tem um dia Colhe Connosco nessa data.', 'Your farm already has a Join the Harvest day on that date.');
  /* as inscrições ficam ligadas ao dia (pelo id); só a data guardada nelas muda */
  const move = () => Object.values(USERS).forEach(u => (u.harvests || []).forEach(h => { if (hIs(h, d)) { h.day = id; h.date = patch.date || d.date; } }));
  if (NUVEM.on) { move(); Object.assign(d, patch); HARVEST_DAYS.sort((a, b) => a.date.localeCompare(b.date)); NUVEM.editHarvestDay(id, d); return true; }
  move(); saveCatalog(ch => { ch.harvestDays = HARVEST_DAYS.map(x => Object.assign({}, x, x.id === id ? patch : {})); }); saveUsers(); return true;
}
let editDay = '', showNewProd = false, ppIcon = '_novo', ppPhoto = null, ppPhotoUrl = '';
function setPPPhoto(blob) { if (ppPhotoUrl) URL.revokeObjectURL(ppPhotoUrl); ppPhoto = blob; ppPhotoUrl = blob ? URL.createObjectURL(blob) : ''; }

function farmerArea(u) {
  const pt = u.partner, f = pt.farmerId ? F(pt.farmerId) : null, story = f ? f.story : (pt.story || { pt: '', en: '' });
  const mine = f ? ofFarmer(f.id) : [];
  const days = f ? HARVEST_DAYS.filter(d => d.farmer === f.id && !harvestStarted(d)) : [], done = f ? HARVEST_DAYS.filter(d => d.farmer === f.id && harvestStarted(d)).sort((a, b) => b.date.localeCompare(a.date)) : [];
  const offerOpts = ['fruta', 'legumes'].map(c => `<optgroup label="${catName(c)}">${PRODUCTS.filter(p => p.cat === c && !(f && myOffers(p, f.id).length >= 2)).sort((a, b) => L(a.name).localeCompare(L(b.name))).map(p => { const my = f ? myOffers(p, f.id) : []; return `<option value="${p.id}">${esc(L(p.name))}${my.length ? ` (${T('já vende', 'you already sell')} ${bioName(my[0].organic).toLowerCase()})` : ''}</option>`; }).join('')}</optgroup>`).join('');
  const dayRow = d => { const n = harvestPeople(d.id), ed = editDay === d.id;
    return `<li class="hrow${ed ? ' editing' : ''}"><div class="date sm"><b>${fdate(d.date, { day: 'numeric' })}</b><span>${fdate(d.date, { month: 'short' })}</span></div><div><b>${esc(L(d.what))}</b><br><span class="small muted">${d.time}. ${n} ${T('de', 'of')} ${d.spots} ${T('lugares ocupados', 'places taken')}.</span>
      ${ed ? `<form class="form mt-s" data-edit-day="${d.id}" novalidate>
        <div class="row"><div class="field"><label for="ed-date">${T('Data', 'Date')}</label><input id="ed-date" type="date" min="${iso(today())}" value="${d.date}" required></div>${timeFields('ed', d.time)}</div>
        <div class="row"><div class="field"><label for="ed-prod">${T('Produto a colher', 'Produce to pick')}</label><select id="ed-prod"><option value="">${esc(L(d.what))}</option>${mine.map(p => `<option value="${p.id}">${esc(L(p.name))}</option>`).join('')}</select></div><div class="field"><label for="ed-spots">${T('Máximo de participantes', 'Maximum participants')}</label><input id="ed-spots" type="number" min="${Math.max(1, n)}" value="${d.spots}" required></div></div>
        ${n ? `<p class="small muted">${T(`Os ${n} inscritos recebem um aviso com a alteração.`, `The ${n} people signed up get a notice of the change.`)}</p>` : ''}
        <p class="err" hidden></p><div class="row-btns"><button class="btn btn-green btn-sm" type="submit">${T('Guardar alterações', 'Save changes')}</button><button type="button" class="btn btn-line btn-sm" data-edit-day-cancel>${T('Cancelar', 'Cancel')}</button></div></form>` : ''}</div>
      ${ed ? '' : `<button class="link" data-edit-day-open="${d.id}">${T('Editar', 'Edit')}</button>`}</li>`; };
  const doneRow = d => { const sm = harvestSummary(d.id);
    return `<li class="hrow"><div class="date sm"><b>${fdate(d.date, { day: 'numeric' })}</b><span>${fdate(d.date, { month: 'short' })}</span></div><div><b>${esc(L(d.what))}</b> ${harvestPast(d) ? '' : `<span class="status prog">${T('A decorrer', 'In progress')}</span>`}<br>
      <span class="small muted">${sm.people} ${T('participantes', 'participants')}${sm.kg ? ` · ${numFmt(sm.kg)} kg ${T('colhidos', 'picked')}` : ''}</span><br>
      ${sm.n ? `${stars(Math.round(sm.avg))} <span class="small">${numFmt(round2(sm.avg))} (${sm.n} ${sm.n === 1 ? T('avaliação', 'review') : T('avaliações', 'reviews')})</span>${sm.comments.filter(c => c.comment).map(c => `<p class="small mt-s">«${esc(c.comment)}» ${stars(c.rating)}</p>`).join('')}` : `<span class="small muted">${harvestRateOpen(d) ? T('As avaliações dos participantes aparecem aqui.', 'Participants\' reviews show here.') : T('Sem avaliações.', 'No reviews.')}</span>`}</div></li>`; };
  return `
  <section class="acc-sec"><div class="row-between mb-s"><h2>${T('Perfil da quinta', 'Farm profile')}</h2>${f ? `<a class="link" href="${farmerHref(f)}">${T('Ver a minha página pública', 'See my public page')}</a>` : ''}</div>
    ${farmProfileForm(u, f, story)}</section>
  <section class="acc-sec"><h2>${T('Os meus produtos', 'My produce')}</h2>
    ${mine.length ? `<p class="muted mt-s mb-s">${T('Marque um produto como fora de stock quando não tiver colheita para a semana. O preço é acordado com a Daqui.', 'Mark a product as out of stock when you have no harvest for the week. Prices are agreed with Daqui.')}</p>
      <ul class="prodlist">${mine.map(p => { const my = myOffers(p, f.id), out = my.every(o => o.outOfStock), others = offersOf(p).filter(o => o.farmer !== f.id).map(o => F(o.farmer)).filter(Boolean);
        return `<li><span class="thumb">${artFor(p)}</span><span><a href="${productHref(p)}"><b>${esc(L(p.name))}</b></a><br><span class="small muted">${my.map(o => `${bioName(o.organic)} ${money(variantPrice(p, o.organic))}${unitLabel(p.unit)}`).join(', ')}; ${T('época', 'season')} ${seasonText(p)}</span>${others.length ? `<br><span class="small muted">${T('Também produzido por', 'Also grown by')} ${others.map(x => esc(x.name)).filter((x, i, a) => a.indexOf(x) === i).join(', ')}</span>` : ''}</span>
        <span class="prod-acts">${inSeason(p) ? `<button class="btn btn-sm ${out ? 'btn-green' : 'btn-line c-tomato'}" data-my-stock="${p.id}">${out ? T('Repor stock', 'Back in stock') : T('Marcar fora de stock', 'Mark out of stock')}</button>` : `<span class="small muted">${T('Fora de época', 'Out of season')}</span>`}
          <button class="btn btn-sm btn-ghost c-tomato" data-leave-prod="${p.id}">${icon('trash', 16)} ${T('Deixar de vender', 'Stop selling')}</button></span></li>`; }).join('')}</ul>`
      : `<p class="muted mt-s">${pt.approved ? T('Ainda não tem produtos publicados. Proponha o primeiro abaixo.', 'No products published yet. Propose your first one below.') : T('Os seus produtos aparecem aqui depois de a quinta ser aprovada.', 'Your products appear here once the farm is approved.')}</p>`}
    <details class="panel mt"${showNewProd ? ' open' : ''}><summary class="lbl">${icon('plus', 18)} ${T('Adicionar um produto', 'Add a product')}</summary>
      <form class="form mt-s" data-offer-prod novalidate>
        <p class="small muted">${T('Escolha um produto que a Daqui já vende. O preço é o da Daqui para esse produto; o biológico custa mais 20%. A equipa Daqui confirma o pedido.', 'Pick a product Daqui already sells. The price is Daqui\'s price for it; organic costs 20% more. The Daqui team confirms the request.')}</p>
        <div class="row"><div class="field"><label for="op-prod">${T('Produto', 'Product')}</label><select id="op-prod" required><option value="">${T('Escolher…', 'Choose…')}</option>${offerOpts}</select></div>
          <div class="field"><span class="lbl">${T('Modo de produção', 'Farming method')}</span><label class="switch sm"><input type="checkbox" id="op-bio">${T('O meu é biológico (certificado)', 'Mine is organic (certified)')}</label></div></div>
        <p class="err" hidden></p><button class="btn btn-green btn-sm" type="submit">${T('Pedir para vender este produto', 'Ask to sell this product')}</button></form>
      <p class="small mt">${T('Não encontra o produto na lista?', 'Can\'t find the product in the list?')} <button type="button" class="link" data-new-prod-toggle aria-expanded="${showNewProd}">${T('Propor um produto novo', 'Propose a new product')}</button></p>
      <form class="form mt-s" data-prop-prod novalidate${showNewProd ? '' : ' hidden'}>
        <p class="small muted">${T('Só para produtos que ainda não existem na Daqui: aqui sim, sugere o preço.', 'Only for products Daqui does not sell yet: here you do suggest the price.')}</p>
        <div class="row"><div class="field"><label for="pp-pt">${T('Nome em português', 'Name in Portuguese')}</label><input id="pp-pt" required></div><div class="field"><label for="pp-en">${T('Nome em inglês', 'Name in English')}</label><input id="pp-en" required></div></div>
        <div class="row"><div class="field"><label for="pp-cat">${T('Categoria', 'Category')}</label><select id="pp-cat"><option value="fruta">${T('Fruta', 'Fruit')}</option><option value="legumes">${T('Legumes', 'Vegetables')}</option></select></div><div class="field"><label for="pp-price">${T('Preço sugerido (€)', 'Suggested price (€)')}</label><input id="pp-price" type="number" step="0.01" min="0" required></div></div>
        <label class="switch sm"><input type="checkbox" id="pp-bio">${T('É biológico (indique o preço do biológico)', 'It is organic (enter the organic price)')}</label>
        <div class="row"><div class="field"><label for="pp-unit">${T('Unidade', 'Unit')}</label><select id="pp-unit">${UNIT_OPTS('kg')}</select></div><div class="field"><span class="lbl">${T('Época', 'Season')}</span><div class="row-gap"><select id="pp-s0" class="sel sm" aria-label="${T('De', 'From')}">${monthOpts(1)}</select>–<select id="pp-s1" class="sel sm" aria-label="${T('Até', 'To')}">${monthOpts(12)}</select></div></div></div>
        <div class="row"><div class="field"><label for="pp-dpt">${T('Descrição em português', 'Description in Portuguese')}</label><textarea id="pp-dpt" rows="2"></textarea></div><div class="field"><label for="pp-den">${T('Descrição em inglês', 'Description in English')}</label><textarea id="pp-den" rows="2"></textarea></div></div>
        <fieldset class="plain img-pick"><legend class="lbl">${T('Imagem na loja', 'Picture in the shop')}</legend>
          <span class="img-prev" id="pp-prev">${ppPhotoUrl ? `<img src="${ppPhotoUrl}" alt="${T('Fotografia escolhida', 'Chosen photo')}">` : `<img src="${R}img/produtos/${esc(ppIcon)}.svg" alt="">`}</span>
          <div class="img-pick-c">
            ${ppPhotoUrl ? `<p class="small">${T('Vai ser usada a sua fotografia.', 'Your photo will be used.')} <button type="button" class="link" data-pp-photo-rm>${T('Usar um desenho', 'Use a drawing')}</button></p>`
              : `<div class="field"><label for="pp-icon">${T('Desenho', 'Drawing')}</label><select id="pp-icon" data-pp-icon data-icon-pick>${iconOptions(ppIcon)}</select></div>`}
            <label class="btn btn-line btn-sm c-campo">${icon('camera', 16)} ${ppPhotoUrl ? T('Escolher outra fotografia', 'Choose another photo') : T('Ou carregar uma fotografia', 'Or upload a photo')}<input type="file" id="pp-photo" accept="image/*" class="sr"></label>
            <p class="small muted">${T('A equipa Daqui confirma a imagem com o produto.', 'The Daqui team confirms the picture with the product.')}</p></div></fieldset>
        <p class="err" hidden></p><button class="btn btn-green btn-sm" type="submit">${T('Enviar proposta', 'Send proposal')}</button></form></details>
    ${myRequests(u, 'produto').length ? `<h3 class="mt">${T('Os meus pedidos de produtos', 'My product requests')}</h3><ul class="hlist mt-s">${myRequests(u, 'produto').map(r => `<li class="hrow"><span>${icon('leaf', 20)}</span><div><b>${esc(r.fields.productId && P(r.fields.productId) ? L(P(r.fields.productId).name) : lang === 'en' && r.fields.nameEn ? r.fields.nameEn : r.fields.namePt)}</b> <span class="small muted">(${bioName(r.fields.organic === 'sim').toLowerCase()})</span><br><span class="small muted">${fdate(r.created)}${r.fields.productId ? ', ' + T('produto da loja', 'shop product') : r.fields.price ? ', ' + T('produto novo', 'new product') + ' ' + money(+r.fields.price) : ''}</span>${reqReply(r)}</div>${reqStatus(r)}</li>`).join('')}</ul>` : ''}</section>
  <section class="acc-sec"><h2>${JTH()}</h2>
    <h3 class="mt-s">${T('Próximos dias', 'Upcoming days')}</h3>
    ${days.length ? `<p class="small muted">${T('Pode editar cada dia até começar.', 'You can edit each day until it starts.')}</p><ul class="hlist mt-s">${days.map(dayRow).join('')}</ul>` : `<p class="muted mt-s">${T('Não tem dias marcados.', 'No days scheduled.')}</p>`}
    ${myRequests(u, 'colhe').filter(r => !r.decision && !r.approved).length ? `<p class="small muted mt-s">${T('Propostas em análise', 'Proposals under review')}: ${myRequests(u, 'colhe').filter(r => !r.decision && !r.approved).map(r => slotLabel(r.fields.date)).join('; ')}</p>` : ''}
    ${myRequests(u, 'colhe').filter(r => r.decision === 'rejeitado').map(r => `<p class="small mt-s">${reqStatus(r)} ${slotLabel(r.fields.date)}${reqReply(r)}</p>`).join('')}
    <h3 class="mt">${T('Colheitas passadas', 'Past harvests')}</h3>
    ${done.length ? `<ul class="hlist mt-s">${done.map(doneRow).join('')}</ul>` : `<p class="muted mt-s">${T('Ainda não houve dias na sua quinta.', 'No days on your farm yet.')}</p>`}
    <details class="panel mt"><summary class="lbl">${icon('calendar', 18)} ${T('Propor um dia Colhe Connosco', 'Propose a Join the Harvest day')}</summary>
      <form class="form mt-s" data-prop-day novalidate>
        <div class="row"><div class="field"><label for="pd-date">${T('Data', 'Date')}</label><input id="pd-date" type="date" min="${iso(today())}" required></div>${timeFields('pd')}</div>
        <div class="row"><div class="field"><label for="pd-prod">${T('Produto a colher', 'Produce to pick')}</label>${mine.length ? `<select id="pd-prod">${mine.map(p => `<option value="${p.id}">${esc(L(p.name))}</option>`).join('')}</select>` : `<input id="pd-prod" required>`}</div><div class="field"><label for="pd-spots">${T('Máximo de participantes', 'Maximum participants')}</label><input id="pd-spots" type="number" min="1" value="25" required></div></div>
        <p class="err" hidden></p><button class="btn btn-green btn-sm" type="submit">${T('Enviar proposta', 'Send proposal')}</button></form></details></section>
  ${f ? lotsSection(f, mine) : ''}`;
}

/* ---------- perfil da quinta: região, posição no mapa, "agricultor desde" e foto de capa ---------- */
let fpDraft = null;   // { region, lat, lon, cover, coverFile } enquanto se edita (sobrevive a redesenhar a página)
function fpState(f, pt) {
  if (!fpDraft) fpDraft = { region: (f && f.region) || pt.region || 'aveiro', lat: f ? f.lat : null, lon: f ? f.lon : null, cover: (f && f.cover) || '', coverUrl: '' };
  if (fpDraft.lat == null) { const c = REGION_CENTER[fpDraft.region] || REGION_CENTER.aveiro; fpDraft.lat = c[0]; fpDraft.lon = c[1]; }
  return fpDraft;
}
function farmProfileForm(u, f, story) {
  const pt = u.partner, st = fpState(f, pt), me = Object.assign({}, f || { id: '_eu', name: u.name, farm: pt.farm, place: pt.place, seed: 0, crop: 'pera' }, { region: st.region, lat: st.lat, lon: st.lon, island: ISLAND_REGIONS.includes(st.region) ? st.region : '', cover: st.coverUrl || st.cover, href: '#' });
  const others = farmersForMap().filter(x => !f || x.id !== f.id);
  const covers = COVER_ART.map(([crop, seed]) => { const v = `art:${crop}:${seed}`; return `<label class="cover-opt"><input type="radio" name="fp-cover" value="${v}"${st.cover === v && !st.coverUrl ? ' checked' : ''}><span>${farmSVG(seed, crop)}</span></label>`; }).join('');
  return `<form class="form" data-farm-profile novalidate>
      <div class="row"><div class="field"><label for="fp-farm">${T('Nome da quinta', 'Farm name')}</label><input id="fp-farm" value="${esc(f ? f.farm : pt.farm)}" required></div><div class="field"><label for="fp-place">${T('Localidade', 'Town')}</label><input id="fp-place" value="${esc(f ? f.place : pt.place)}" required></div></div>
      <div class="row"><div class="field"><label for="fp-region">${T('Região', 'Region')}</label><select id="fp-region" data-fp-region>${Object.keys(REGIONS).map(k => `<option value="${k}"${st.region === k ? ' selected' : ''}>${regionName(k)}</option>`).join('')}</select></div>
        <div class="field"><label for="fp-since">${T('Agricultor desde (ano)', 'Farming since (year)')}</label><input id="fp-since" type="number" min="1900" max="${today().getFullYear()}" value="${esc((f && f.since) || pt.since || '')}" inputmode="numeric"></div></div>
      <div class="row"><div class="field"><label for="fp-spt">${T('A nossa história (português)', 'Our story (Portuguese)')}</label><textarea id="fp-spt" rows="4">${esc(story.pt)}</textarea></div><div class="field"><label for="fp-sen">${T('A nossa história (inglês)', 'Our story (English)')}</label><textarea id="fp-sen" rows="4">${esc(story.en)}</textarea></div></div>
      <div class="fp-two">
        <fieldset class="plain"><legend class="lbl">${T('Posição no mapa de Portugal', 'Position on the map of Portugal')}</legend>
          <p class="small muted">${T('Toque no mapa onde fica a quinta. Para as ilhas, toque no quadro da Madeira ou dos Açores.', 'Tap the map where your farm is. For the islands, tap the Madeira or Azores box.')}</p>
          <div class="pin-pick" data-pin-pick>${portugalMapSVG(others.concat(me), lang, me.id)}</div>
          <p class="small muted">${numFmt(round2(st.lat))}, ${numFmt(round2(st.lon))}</p></fieldset>
        <fieldset class="plain"><legend class="lbl">${T('Foto de capa', 'Cover picture')}</legend>
          <div class="cover-now">${farmPic(me)}</div>
          <div class="cover-opts">${covers}</div>
          <label class="btn btn-line btn-sm c-campo mt-s">${icon('camera', 16)} ${T('Carregar uma fotografia', 'Upload a photo')}<input type="file" id="fp-photo" accept="image/*" class="sr" data-fp-photo></label>
          ${st.coverUrl || (st.cover && !/^art:/.test(st.cover)) ? `<p class="small">${T('Vai ser usada a sua fotografia.', 'Your photo will be used.')}</p>` : ''}</fieldset>
      </div>
      <p class="err" hidden></p><button class="btn btn-green btn-sm" type="submit">${T('Guardar perfil', 'Save profile')}</button></form>`;
}
/* toque no mapa: converte o ponto do desenho em latitude/longitude (continente, quadro da Madeira ou dos Açores) */
function mapPointToGeo(svg, ev) {
  const pt = svg.createSVGPoint(); pt.x = ev.clientX; pt.y = ev.clientY;
  const m = svg.getScreenCTM(); if (!m) return null; const { x, y } = pt.matrixTransform(m.inverse());
  if (x >= 8 && x <= 136 && y >= 10 && y <= 86) return { region: 'acores', lat: 39.85 - (y - 30) / 17.5, lon: (x - 16) / 17.5 - 31.5 };
  if (x >= 10 && x <= 106 && y >= 452 && y <= 510) return { region: 'madeira', lat: 32.9 - (y - 470) / 60, lon: (x - 18) / 60 - 17.3 };
  return { lat: 42.35 - y / 100, lon: x / 77 - 10.65 };
}
document.addEventListener('click', e => {
  const box = e.target.closest('[data-pin-pick]'); if (!box || !fpDraft) return;
  e.preventDefault(); const svg = box.querySelector('svg'); const g = mapPointToGeo(svg, e); if (!g) return;
  fpDraft.lat = +g.lat.toFixed(4); fpDraft.lon = +g.lon.toFixed(4);
  if (g.region) fpDraft.region = g.region; else if (ISLAND_REGIONS.includes(fpDraft.region)) fpDraft.region = 'aveiro';
  const keep = ['fp-farm', 'fp-place', 'fp-since', 'fp-spt', 'fp-sen'].map(id => [id, $('#' + id)?.value]);
  rerenderKeep('[data-pin-pick]'); keep.forEach(([id, v]) => { if ($('#' + id) && v != null) $('#' + id).value = v; });
}, true);

/* ---------- entregas à Daqui (inventário): cada entrega é um lote com data de colheita ---------- */
let lotEdit = '';
function lotsSection(f, mine) {
  const lots = LOTS.filter(l => l.farmer === f.id).sort((a, b) => b.harvest.localeCompare(a.harvest) || String(b.created).localeCompare(String(a.created)));
  const locked = !!SETTINGS.lockLots;
  const row = l => { const p = P(l.product); if (!p) return ''; const ed = lotEdit === l.id && !locked;
    return `<li class="lot${ed ? ' editing' : ''}"><span class="thumb">${artFor(p)}</span><div class="lot-b"><b>${esc(L(p.name))}</b>
      <span class="small muted">${T('Colheita', 'Harvest')}: ${fdate(parseISO(l.harvest))} · ${stockText(p, l.qty)} ${T('entregues', 'supplied')} · ${T('restam', 'left')} ${stockText(p, lotLeft(l))}</span>
      <span class="lot-tags">${l.cold ? `<span class="tag">${icon('snow', 14)}${T('Refrigeração', 'Refrigerated')}</span>` : ''}${l.lab ? `<a class="tag" href="${R}docs/analises/${p.id}.pdf" target="_blank" rel="noopener">${icon('doc', 14)}${T('Análise de laboratório', 'Lab analysis')}</a>` : ''}<span class="tag">${icon('route', 14)}${l.transport === 'recolha' ? T(`Recolha pela Daqui a ${fdate(parseISO(l.pickup))}`, `Daqui collects on ${fdate(parseISO(l.pickup))}`) : T('Entrega na central Daqui', 'Delivered to the Daqui hub')}</span></span>
      ${ed ? `<form class="form row mt-s" data-lot-save="${l.id}" novalidate><div class="field"><label for="le-qty">${T('Quantidade', 'Quantity')} (${unitWord(p.unit, 2)})</label><input id="le-qty" type="number" min="${Math.max(0.5, l.sold || 0)}" step="${byKg(p) ? 0.5 : 1}" value="${l.qty}" required></div>
        <div class="field"><label for="le-date">${T('Data de colheita', 'Harvest date')}</label><input id="le-date" type="date" max="${iso(today())}" value="${l.harvest}" required></div>
        <div class="row-btns"><button class="btn btn-green btn-sm" type="submit">${T('Guardar', 'Save')}</button><button type="button" class="btn btn-line btn-sm" data-lot-cancel>${T('Cancelar', 'Cancel')}</button></div></form>` : ''}</div>
      <span class="prod-acts">${!locked && !ed ? `<button class="btn btn-sm btn-ghost" data-lot-edit="${l.id}">${icon('edit', 16)} ${T('Alterar', 'Edit')}</button>` : ''}${!(l.sold > 0) ? `<button class="btn btn-sm btn-ghost c-tomato" data-lot-del="${l.id}">${icon('trash', 16)} ${T('Apagar', 'Delete')}</button>` : ''}</span></li>`; };
  return `<section class="acc-sec" id="entregas"><h2>${T('Entregas à Daqui', 'Supplies to Daqui')}</h2>
    <p class="muted mt-s">${T('Diga à Daqui quanto tem para fornecer de cada produto e quando foi colhido. Pode fazer várias entregas do mesmo produto (por exemplo, pêssegos colhidos em datas diferentes).', 'Tell Daqui how much of each product you can supply and when it was picked. You can make several supplies of the same product (for example, peaches picked on different dates).')}</p>
    ${locked ? `<p class="note small mt-s">${icon('lock', 18)}<span>${T('A equipa Daqui bloqueou alterações às quantidades e datas das entregas já submetidas.', 'The Daqui team has locked changes to the quantities and dates of supplies already sent.')}</span></p>` : ''}
    ${mine.length ? `<details class="panel mt" open><summary class="lbl">${icon('plus', 18)} ${T('Nova entrega', 'New supply')}</summary>
      <form class="form mt-s" data-lot-new novalidate>
        <div class="row"><div class="field"><label for="ln-prod">${T('Produto', 'Product')}</label><select id="ln-prod" data-ln-prod required>${mine.map(p => `<option value="${p.id}">${esc(L(p.name))}</option>`).join('')}</select></div>
          <div class="field"><label for="ln-qty">${T('Quantidade', 'Quantity')} (<span data-ln-unit>${unitWord(mine[0].unit, 2)}</span>)</label><input id="ln-qty" type="number" min="0.5" step="0.5" required inputmode="decimal"></div>
          <div class="field"><label for="ln-date">${T('Data de colheita', 'Harvest date')}</label><input id="ln-date" type="date" max="${iso(today())}" value="${iso(today())}" required></div></div>
        <div class="row"><label class="switch sm"><input type="checkbox" id="ln-cold">${T('Precisa de refrigeração', 'Needs refrigeration')}</label>
          <label class="switch sm"><input type="checkbox" id="ln-lab">${T('Gerar análise de laboratório', 'Generate a lab analysis')}</label></div>
        <fieldset class="plain"><legend class="lbl">${T('Transporte até à central da Daqui', 'Transport to the Daqui hub')}</legend>
          <div class="radios"><label><input type="radio" name="ln-tr" value="proprio" checked data-ln-tr>${T('Levo eu', 'I deliver it')}</label><label><input type="radio" name="ln-tr" value="recolha" data-ln-tr>${T('A Daqui recolhe na quinta', 'Daqui collects at the farm')}</label></div>
          <div class="field mt-s" data-ln-pick hidden><label for="ln-pick">${T('Data de recolha (estafeta ou camião)', 'Collection date (courier or truck)')}</label><input id="ln-pick" type="date" min="${iso(addDays(today(), 1))}"></div></fieldset>
        <p class="err" hidden></p><button class="btn btn-green btn-sm" type="submit">${T('Registar entrega', 'Register supply')}</button></form></details>` : `<p class="muted mt-s">${T('Primeiro adicione os produtos que produz.', 'First add the products you grow.')}</p>`}
    ${lots.length ? `<h3 class="mt">${T('As minhas entregas', 'My supplies')}</h3><ul class="lots mt-s">${lots.map(row).join('')}</ul>` : ''}</section>`;
}
function restaurantArea(u) {
  const pt = u.partner, r = pt.restId ? RESTAURANTS.find(x => x.id === pt.restId) : null, src = r || pt.draft || {};
  const v = (k, l) => esc((src[k] && src[k][l]) || '');
  const dishes = (r ? r.dishes : (pt.draft || {}).dishes) || [];
  const myOrders = ORDERS.filter(o => o.user === u.username);
  return `
  <section class="acc-sec"><div class="row-between mb-s"><h2>${T('Selo Daqui', 'Daqui seal')}</h2>${r ? `<a class="link" href="${restHref(r)}">${T('Ver a página do restaurante', 'See the restaurant page')}</a>` : ''}</div>
    <div class="row-gap">${sealSVG('part', lang).replace('<svg', '<svg style="width:88px;height:88px"')}<div><p><b>${r ? T(`Selo ativo desde ${fdate(r.since + '-15', { month: 'long', year: 'numeric' })}.`, `Seal active since ${fdate(r.since + '-15', { month: 'long', year: 'numeric' })}.`) : T('O selo é atribuído depois da aprovação.', 'The seal is awarded once you are approved.')}</b></p>
      <p class="small muted">${T('Mostre o selo à porta e no menu. Os clientes veem o seu restaurante no mapa da Daqui.', 'Show the seal on your door and menu. Diners see your restaurant on the Daqui map.')}</p></div></div></section>
  <section class="acc-sec"><h2>${T('O que aparece no site', 'What shows on the site')}</h2>
    <form class="form mt-s" data-rest-profile novalidate>
      <div class="row"><div class="field"><label for="rp-cuisine">${T('Tipo de cozinha', 'Cuisine')}</label><select id="rp-cuisine">${CUISINES.map(c => `<option value="${c.id}"${cuisineOf(src) === c.id ? ' selected' : ''}>${esc(L(c))}</option>`).join('')}</select><span class="small muted">${T('Aparece no filtro da página dos restaurantes.', 'Shows in the restaurants page filter.')}</span></div></div>
      <div class="row"><div class="field"><label for="rp-apt">${T('Zona ou morada (português)', 'Area or address (Portuguese)')}</label><input id="rp-apt" value="${v('area', 'pt')}"></div><div class="field"><label for="rp-aen">${T('Zona ou morada (inglês)', 'Area or address (English)')}</label><input id="rp-aen" value="${v('area', 'en')}"></div></div>
      <div class="row"><div class="field"><label for="rp-dpt">${T('Prato da semana (português)', 'Dish of the week (Portuguese)')}</label><input id="rp-dpt" value="${v('dish', 'pt')}" required></div><div class="field"><label for="rp-den">${T('Prato da semana (inglês)', 'Dish of the week (English)')}</label><input id="rp-den" value="${v('dish', 'en')}" required></div></div>
      <div class="row-gap"><label class="switch sm"><input type="checkbox" id="rp-veg"${src.dishVeg ? ' checked' : ''}>${T('Vegetariano', 'Vegetarian')}</label><label class="switch sm"><input type="checkbox" id="rp-vegan"${src.dishVegan ? ' checked' : ''}>Vegan</label></div>
      <p class="small muted">${T('Dica: diga de que quinta vem o ingrediente, por exemplo "com couve da Família Pereira".', 'Tip: say which farm the ingredient comes from, e.g. "with the Pereira family\'s kale".')}</p>
      <p class="err" hidden></p><button class="btn btn-green btn-sm" type="submit">${T('Publicar', 'Publish')}</button></form></section>
  <section class="acc-sec"><h2>${T('Pratos do menu com produtos Daqui', 'Menu dishes with Daqui produce')}</h2>
    ${dishes.length ? `<ul class="hlist mt-s">${dishes.map((x, i) => `<li class="hrow"><span>${icon('utensils', 20)}</span><div><b>${esc(x.pt)}</b> ${vegBadges(x, true)}<br><span class="small muted">${esc(x.en)}</span></div><button class="link" data-dish-rm="${i}">${T('Remover', 'Remove')}</button></li>`).join('')}</ul>` : `<p class="muted mt-s">${T('Ainda não acrescentou pratos.', 'No dishes added yet.')}</p>`}
    <form class="form mt" data-dish-add novalidate><div class="row"><div class="field"><label for="ds-pt">${T('Prato (português)', 'Dish (Portuguese)')}</label><input id="ds-pt" required></div><div class="field"><label for="ds-en">${T('Prato (inglês)', 'Dish (English)')}</label><input id="ds-en" required></div></div>
      <div class="row-gap"><label class="switch sm"><input type="checkbox" id="ds-veg">${T('Vegetariano', 'Vegetarian')}</label><label class="switch sm"><input type="checkbox" id="ds-vegan">Vegan</label></div>
      <p class="err" hidden></p><button class="btn btn-green btn-sm" type="submit">${T('Acrescentar prato', 'Add dish')}</button></form></section>
  <section class="acc-sec"><h2>${T('Encomendas para a cozinha', 'Orders for the kitchen')}</h2>
    <p class="muted mt-s">${T(`Encomende na loja como qualquer cliente. Entregamos à quinta-feira e ao sábado. Já fez ${myOrders.length} ${myOrders.length === 1 ? 'encomenda' : 'encomendas'}.`, `Order in the shop like any customer. We deliver on Thursdays and Saturdays. You have placed ${myOrders.length} ${myOrders.length === 1 ? 'order' : 'orders'}.`)}</p>
    <div class="row-btns mt-s"><a class="btn btn-green btn-sm" href="${href('produtos')}">${T('Ir à loja', 'Go to the shop')}</a><a class="btn btn-line btn-sm c-campo" href="${href('conta', 'sec=encomendas')}">${T('Histórico de encomendas', 'Order history')}</a></div></section>`;
}

function saveRest(u, patch) {
  const pt = u.partner;
  if (pt.restId) saveCatalog(ch => { ch.restaurants = ch.restaurants || {}; ch.restaurants[pt.restId] = Object.assign(ch.restaurants[pt.restId] || {}, patch); });
  else { pt.draft = Object.assign(pt.draft || {}, patch); saveUsers(); }
}
PAGE_EVENTS.click.push((e, t, d) => {
  if (PAGE !== 'parceiro') return; const u = currentUser(); if (!u || !u.partner) return;
  if (d.myStock) { const p = P(d.myStock), fid = u.partner.farmerId, v = !myOffers(p, fid).every(o => o.outOfStock); setMyStock(p, fid, v); toast(v ? T(`${L(p.name)}: fora de stock`, `${L(p.name)}: out of stock`) : T(`${L(p.name)}: com stock`, `${L(p.name)}: in stock`)); rerenderKeep(`[data-my-stock="${p.id}"]`); return true; }
  if (d.leaveProd) { const p = P(d.leaveProd), others = offersOf(p).filter(o => o.farmer !== u.partner.farmerId).length;
    openModal(`<div class="mbody"><h2>${T('Deixar de vender', 'Stop selling')} ${esc(L(p.name))}?</h2>
      <p class="mt-s">${T('O produto sai da sua lista e a sua quinta deixa de aparecer como produtora.', 'The product leaves your list and your farm no longer shows as a grower.')} ${others ? T('Continua na loja com os outros agricultores que o vendem.', 'It stays in the shop with the other farmers who sell it.') : T('Como mais nenhum agricultor o vende, fica sem stock na loja até alguém voltar a fornecê-lo.', 'As no other farmer sells it, it shows as out of stock until someone supplies it again.')}</p>
      <p class="small muted mt-s">${T('Se voltar a ter este produto, peça-o outra vez em "Adicionar um produto".', 'If you have it again, ask for it again under "Add a product".')}</p>
      <div class="row-btns mt"><button class="btn btn-line c-tomato" data-site-page="parceiro" data-leave-ok="${p.id}">${T('Deixar de vender', 'Stop selling')}</button><button class="btn btn-line c-campo" data-modal-close>${T('Cancelar', 'Cancel')}</button></div></div>`, T('Deixar de vender', 'Stop selling'));
    return true; }
  if (d.leaveOk) { const p = P(d.leaveOk); leaveProduct(p, u.partner.farmerId); closeModal(); toast(T(`Deixou de vender ${L(p.name)}`, `You stopped selling ${L(p.name)}`)); rerenderKeep(); return true; }
  if ('ppPhotoRm' in d) { setPPPhoto(null); rerenderKeep('#pp-icon'); return true; }
  if ('newProdToggle' in d) { showNewProd = !showNewProd; rerenderKeep('[data-new-prod-toggle]'); return true; }
  if (d.editDayOpen) { editDay = d.editDayOpen; rerenderKeep('#ed-date'); return true; }
  if (d.lotEdit) { lotEdit = d.lotEdit; rerenderKeep('#le-qty'); return true; }
  if ('lotCancel' in d) { lotEdit = ''; rerenderKeep(); return true; }
  if (d.lotDel) { const l = LOTS.find(x => x.id === d.lotDel); if (!l || l.sold > 0) return true;
    if (t.dataset.confirm !== '1') { t.dataset.confirm = '1'; t.innerHTML = icon('trash', 16) + ' ' + T('Confirmar', 'Confirm'); return true; }
    deleteLot(l.id); toast(T('Entrega apagada', 'Supply deleted')); rerenderKeep(); return true; }
  if ('editDayCancel' in d) { editDay = ''; rerenderKeep(); return true; }
  if ('partnerRetry' in d) { u.partner.rejected = false; delete u.partner.reply; saveUsers(); partnerRequest(u); toast(T('Pedido enviado outra vez à equipa Daqui', 'Application sent to the Daqui team again')); rerenderKeep(); return true; }
  if (d.dishRm !== undefined) { const r = RESTAURANTS.find(x => x.id === u.partner.restId); const list = ((r ? r.dishes : (u.partner.draft || {}).dishes) || []).filter((_, i) => i !== +d.dishRm); saveRest(u, { dishes: list }); rerenderKeep(); return true; }
});
PAGE_EVENTS.change.push((e, t) => {
  if (PAGE !== 'parceiro') return;
  if (t.matches('[data-ln-prod]')) { const p = P(t.value), u = $('[data-ln-unit]'); if (u && p) u.textContent = unitWord(p.unit, 2); const q = $('#ln-qty'); if (q && p) { q.step = byKg(p) ? 0.5 : 1; q.min = byKg(p) ? 0.5 : 1; } }
  if (t.matches('[data-ln-tr]')) { const b = $('[data-ln-pick]'); if (b) { b.hidden = t.value !== 'recolha'; $('#ln-pick').required = t.value === 'recolha'; } }
  const keepFp = () => ['fp-farm', 'fp-place', 'fp-since', 'fp-spt', 'fp-sen'].map(id => [id, $('#' + id)?.value]);
  const restoreFp = k => k.forEach(([id, v]) => { if ($('#' + id) && v != null) $('#' + id).value = v; });
  if (t.matches('[data-fp-region]') && fpDraft) { const k = keepFp(); fpDraft.region = t.value; const c = REGION_CENTER[t.value]; if (c) { fpDraft.lat = c[0]; fpDraft.lon = c[1]; } rerenderKeep('#fp-region'); restoreFp(k); return; }
  if (t.name === 'fp-cover' && fpDraft) { const k = keepFp(); fpDraft.cover = t.value; fpDraft.coverUrl = ''; fpDraft.coverFile = null; rerenderKeep(`input[name="fp-cover"][value="${t.value}"]`); restoreFp(k); return; }
  if (t.matches('[data-fp-photo]') && t.files[0] && fpDraft) { const k = keepFp();
    shrinkImage(t.files[0]).then(b => { fpDraft.coverFile = b; fpDraft.coverUrl = URL.createObjectURL(b); fpDraft.cover = ''; rerenderKeep('#fp-photo'); restoreFp(k); }, () => toast(T('Esta imagem não pode ser usada.', 'This image cannot be used.'))); return; }
  if (t.matches('[data-pp-icon]')) { ppIcon = t.value; const pv = $('#pp-prev img'); if (pv) pv.src = `${R}img/produtos/${ppIcon}.svg`; }
  if (t.id === 'pp-photo' && t.files[0]) { const keep = ['pp-pt', 'pp-en', 'pp-price', 'pp-dpt', 'pp-den'].map(id => [id, ($('#' + id) || {}).value]);
    shrinkImage(t.files[0]).then(b => { setPPPhoto(b); rerenderKeep('#pp-photo'); keep.forEach(([id, v]) => { if ($('#' + id) && v != null) $('#' + id).value = v; }); }, () => toast(T('Esta imagem não pode ser usada.', 'This image cannot be used.'))); }
});
PAGE_EVENTS.submit.push((e, f) => {
  if (PAGE !== 'parceiro') return; const u = currentUser(); if (!u || !u.partner) return;
  const done = msg => { toast(msg); rerenderKeep(); return true; };
  const fail = (msg) => { const err = $('.err', f); err.hidden = false; err.textContent = msg; return true; };
  if (f.matches('[data-farm-profile]')) { e.preventDefault(); if (!validate(f)) return true;
    const st = fpDraft || {}, since = +$('#fp-since').value || null;
    if (since && (since < 1900 || since > today().getFullYear())) return (() => { const err = $('.err', f); err.hidden = false; err.textContent = T('Indique um ano válido.', 'Enter a valid year.'); return true; })();
    const patch = { farm: $('#fp-farm').value.trim(), place: $('#fp-place').value.trim(), story: { pt: $('#fp-spt').value.trim(), en: $('#fp-sen').value.trim() || $('#fp-spt').value.trim() },
      region: st.region, lat: st.lat, lon: st.lon, island: ISLAND_REGIONS.includes(st.region) ? st.region : '', since };
    const finish = cover => {
      if (cover !== undefined) patch.cover = cover;
      u.partner.farm = patch.farm; u.partner.place = patch.place; u.partner.story = patch.story; u.partner.region = patch.region; if (since) u.partner.since = since; saveUsers();
      if (u.partner.farmerId) saveCatalog(ch => { ch.farmers = ch.farmers || {}; ch.farmers[u.partner.farmerId] = Object.assign(ch.farmers[u.partner.farmerId] || {}, patch); });
      fpDraft = null; done(T('Perfil guardado', 'Profile saved'));
    };
    if (st.coverFile) { const btn = $('button[type="submit"]', f); btn.disabled = true;
      (NUVEM.on ? NUVEM.uploadPhoto(st.coverFile, 'jpg', 'produtos') : blobToDataURL(st.coverFile)).then(url => finish(url), () => { btn.disabled = false; toast(T('Não foi possível enviar a fotografia.', 'Could not upload the photo.')); });
      return true; }
    finish(st.cover || undefined); return true; }
  if (f.matches('[data-lot-new]')) { e.preventDefault(); if (!validate(f)) return true;
    const p = P($('#ln-prod').value), qty = round2(+$('#ln-qty').value), tr = (f.querySelector('[name="ln-tr"]:checked') || {}).value || 'proprio', pick = $('#ln-pick').value, date = $('#ln-date').value;
    if (!(qty > 0)) return fail(T('Indique a quantidade.', 'Enter the quantity.'));
    if (date > iso(today())) return fail(T('A data de colheita não pode ser no futuro.', 'The harvest date cannot be in the future.'));
    if (tr === 'recolha' && (!pick || pick <= iso(today()))) return fail(T('Escolha a data em que a Daqui deve recolher (a partir de amanhã).', 'Choose the date Daqui should collect (from tomorrow).'));
    const l = { id: newLotId(), _new: true, farmer: u.partner.farmerId, product: p.id, qty, sold: 0, harvest: date, cold: $('#ln-cold').checked, lab: $('#ln-lab').checked, transport: tr, pickup: tr === 'recolha' ? pick : null, created: nowISO() };
    saveLot(l); return done(l.lab ? T('Entrega registada. A análise de laboratório fica disponível na entrega.', 'Supply registered. The lab analysis is available on the supply.') : T('Entrega registada', 'Supply registered')); }
  if (f.matches('[data-lot-save]')) { e.preventDefault(); if (!validate(f)) return true;
    const l = LOTS.find(x => x.id === f.dataset.lotSave); if (!l) return true;
    if (SETTINGS.lockLots) return fail(T('As alterações às entregas estão bloqueadas pela equipa Daqui.', 'Changes to supplies are locked by the Daqui team.'));
    const qty = round2(+$('#le-qty').value), date = $('#le-date').value;
    if (qty < (l.sold || 0)) return fail(T(`Já foram vendidos ${numFmt(l.sold)}: a quantidade não pode ser menor.`, `${numFmt(l.sold)} already sold: the quantity cannot be lower.`));
    if (date > iso(today())) return fail(T('A data de colheita não pode ser no futuro.', 'The harvest date cannot be in the future.'));
    l.qty = qty; l.harvest = date; lotEdit = ''; saveLot(l); return done(T('Entrega atualizada', 'Supply updated')); }
  if (f.matches('[data-offer-prod]')) { e.preventDefault(); if (!validate(f)) return true;
    const p = P($('#op-prod').value), bio = $('#op-bio').checked, fid = u.partner.farmerId;
    if (fid && myOffers(p, fid).some(o => !!o.organic === bio)) return fail(T(`Já vende ${L(p.name)} (${bioName(bio).toLowerCase()}).`, `You already sell ${L(p.name)} (${bioName(bio).toLowerCase()}).`));
    if (myRequests(u, 'produto').some(r => !r.decision && !r.approved && r.fields.productId === p.id && (r.fields.organic === 'sim') === bio)) return fail(T('Já pediu este produto: está em análise.', 'You already asked for this product: it is under review.'));
    addRequest('produto', { productId: p.id, namePt: p.name.pt, nameEn: p.name.en, organic: bio ? 'sim' : 'nao' }, { partnerUser: u.username });
    return done(T('Pedido enviado à equipa Daqui', 'Request sent to the Daqui team')); }
  if (f.matches('[data-prop-prod]')) { e.preventDefault(); if (!validate(f)) return true;
    const namePt = $('#pp-pt').value.trim(), b = baseName(namePt), same = PRODUCTS.filter(p => { if (p.cat === 'caixas') return false; const x = baseName(p.name.pt); return x === b || (b.split(' ').length > 1 && (x.startsWith(b + ' ') || b.startsWith(x + ' '))); });
    if (same.length) return fail(T(`Já existe na Daqui: ${same.map(p => L(p.name)).join(', ')}. Escolha-o na lista acima (e marque se o seu é biológico).`, `Already on Daqui: ${same.map(p => L(p.name)).join(', ')}. Pick it in the list above (and tick if yours is organic).`));
    const fields = { namePt, nameEn: $('#pp-en').value.trim(), cat: $('#pp-cat').value, price: $('#pp-price').value, unit: $('#pp-unit').value, season: `${$('#pp-s0').value}-${$('#pp-s1').value}`, desc: $('#pp-dpt').value.trim(), descEn: $('#pp-den').value.trim(), organic: $('#pp-bio').checked ? 'sim' : 'nao', icon: ppIcon };
    const send = photo => { if (photo) fields.photo = photo; addRequest('produto', fields, { partnerUser: u.username }); showNewProd = false; ppIcon = '_novo'; setPPPhoto(null); done(T('Proposta enviada à equipa Daqui', 'Proposal sent to the Daqui team')); };
    if (!ppPhoto) { send(''); return true; }
    const btn = $('button[type="submit"]', f); btn.disabled = true; btn.classList.add('busy');
    /* com base de dados: a fotografia vai para o Storage (pasta "produtos"); sem base de dados: fica guardada no pedido, reduzida */
    (NUVEM.on ? NUVEM.uploadPhoto(ppPhoto, 'jpg', 'produtos') : blobToDataURL(ppPhoto)).then(send, err => { console.error(err); btn.disabled = false; btn.classList.remove('busy'); fail(T('Não foi possível enviar a fotografia. Tente outra vez ou escolha um desenho.', 'The photo could not be sent. Try again or pick a drawing.')); });
    return true; }
  if (f.matches('[data-edit-day]')) { e.preventDefault(); if (!validate(f)) return true; if (timeBad('ed')) return fail(timeBad('ed'));
    const old = f.dataset.editDay, d0 = HD(old); if (!d0) return true;
    if (harvestStarted(d0)) return fail(T('Este dia já começou: já não pode ser alterado.', 'This day has already started: it can no longer be changed.'));
    const date = $('#ed-date').value, n = harvestPeople(old), spots = Math.max(+$('#ed-spots').value || 1, n, 1), pr = P($('#ed-prod').value);
    if (date < iso(today())) return fail(T('Escolha uma data a partir de hoje.', 'Pick a date from today.'));
    const patch = { date, time: timeText($('#ed-ini').value, $('#ed-fim').value), spots }; if (pr) Object.assign(patch, { what: { pt: pr.name.pt, en: pr.name.en }, crop: pr.art || d0.crop });
    const r = editHarvestDay(old, patch); if (r !== true) return fail(r || T('Não foi possível guardar.', 'Could not save.'));
    editDay = ''; return done(T('Dia Colhe Connosco atualizado', 'Join the Harvest day updated')); }
  if (f.matches('[data-prop-day]')) { e.preventDefault(); if (!validate(f)) return true; if (timeBad('pd')) return fail(timeBad('pd'));
    if (HARVEST_DAYS.some(x => x.farmer === u.partner.farmerId && x.date === $('#pd-date').value)) return fail(T('A sua quinta já tem um dia Colhe Connosco nessa data.', 'Your farm already has a Join the Harvest day on that date.'));
    addRequest('colhe', { date: $('#pd-date').value, product: $('#pd-prod').value, time: timeText($('#pd-ini').value, $('#pd-fim').value), spots: $('#pd-spots').value }, { partnerUser: u.username });
    return done(T('Proposta enviada à equipa Daqui', 'Proposal sent to the Daqui team')); }
  if (f.matches('[data-rest-profile]')) { e.preventDefault(); if (!validate(f)) return true;
    const cz = CUISINES.find(c => c.id === $('#rp-cuisine').value) || CUISINES[0], vegan = $('#rp-vegan').checked;
    saveRest(u, { cuisine: cz.id, kind: { pt: cz.pt, en: cz.en }, area: { pt: $('#rp-apt').value.trim(), en: $('#rp-aen').value.trim() }, dish: { pt: $('#rp-dpt').value.trim(), en: $('#rp-den').value.trim() }, dishVeg: vegan || $('#rp-veg').checked, dishVegan: vegan });
    return done(u.partner.restId ? T('Publicado no mapa de restaurantes', 'Published on the restaurants map') : T('Guardado: fica visível depois da aprovação', 'Saved: visible once approved')); }
  if (f.matches('[data-dish-add]')) { e.preventDefault(); if (!validate(f)) return true;
    const r = RESTAURANTS.find(x => x.id === u.partner.restId); const list = ((r ? r.dishes : (u.partner.draft || {}).dishes) || []).concat(Object.assign({ pt: $('#ds-pt').value.trim(), en: $('#ds-en').value.trim() }, $('#ds-vegan').checked ? { veg: true, vegan: true } : $('#ds-veg').checked ? { veg: true } : {}));
    saveRest(u, { dishes: list }); return done(T('Prato acrescentado', 'Dish added')); }
});
