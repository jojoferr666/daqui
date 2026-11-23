/* ===== Daqui — páginas: Agricultores, Agricultor, Restaurantes, Colhe Connosco, Sobre, Contacto, FAQ, Políticas ===== */

/* ---------------- AGRICULTORES ---------------- */
let farmerRegion = 'all';
const farmersForMap = () => FARMERS.map(f => Object.assign({}, f, { href: farmerHref(f) }));
PAGES.agricultores = () => {
  const regions = Object.keys(REGIONS).filter(r => FARMERS.some(f => f.region === r));
  const list = FARMERS.filter(f => farmerRegion === 'all' || f.region === farmerRegion);
  const html = `${crumbs([[T('Os nossos agricultores', 'Our farmers'), 'agricultores']])}
  <div class="wrap page-head"><h1>${T('Os nossos agricultores', 'Our farmers')}</h1>
    <p class="lead">${T(`${FARMERS.length} quintas, do Minho ao Algarve e à Madeira. Toque num ponto do mapa para conhecer quem cultiva cada produto.`, `${FARMERS.length} farms, from the north to the Algarve and Madeira. Tap a pin on the map to meet the people who grow each product.`)}</p></div>
  <div class="wrap">
    <div class="chips mb" role="group" aria-label="${T('Filtrar por região', 'Filter by region')}">${[['all', T('Todas as regiões', 'All regions')]].concat(regions.map(r => [r, regionName(r)])).map(([k, n]) => `<button class="chip" data-region="${k}" aria-pressed="${farmerRegion === k}">${n}</button>`).join('')}</div>
    <div class="farm-layout">
      <div class="map-col"><div class="map-sticky">${portugalMapSVG(farmersForMap().filter(f => farmerRegion === 'all' || f.region === farmerRegion), lang, '')}</div></div>
      <div class="grid farm-grid">${list.map(f => fcard(f, true)).join('')}</div>
    </div>
  </div>
  <section class="sec sec-green on-dark mt-xl"><div class="wrap">
    <h2 class="c-pera">${T('É agricultor? Venda a quem come o que planta.', 'Are you a farmer? Sell to the people who eat what you grow.')}</h2>
    <p class="lead mt-s mb">${T('Hoje, o produtor de pera Rocha e de maçã fica com cerca de 28% do preço final. Queremos que fique com muito mais.', 'Today, Rocha pear and apple growers keep about 28% of the final price. We want them to keep much more.')}</p>
    <div class="feat">${[['coins', T('Uma margem maior', 'A bigger margin'), T('Vende sem intermediários a mais e vê a divisão do preço de cada produto.', 'Sell without extra middlemen and see the price split for every product.')], ['snow', T('Armazenamento em frio', 'Cold storage'), T('Use as nossas câmaras frigoríficas se não tiver capacidade própria.', 'Use our cold rooms if you don\'t have your own capacity.')], ['users', T('Clientes diretos', 'Direct customers'), T('Famílias, restaurantes e visitantes do Colhe Connosco.', 'Households, restaurants and Join the Harvest visitors.')], ['phone', T('Ajuda por telefone', 'Help by phone'), T('Um agente de campo regista os seus produtos consigo.', 'A field agent lists your produce with you.')]].map(([i, h, p]) => `<div class="item"><span class="ico">${icon(i, 26)}</span><h3>${h}</h3><p>${p}</p></div>`).join('')}</div>
  </div></section>
  <section class="sec sec-sage" id="adesao"><div class="wrap join">
    <div><h2>${T('Inscrever a minha quinta', 'Sign up my farm')}</h2><p class="lead mt-s">${T('Deixe o seu contacto. Um agente de campo liga-lhe para marcar uma visita.', 'Leave your details. A field agent will call you to arrange a visit.')}</p><p class="mt-s">${T('Prefere ligar?', 'Rather call?')} <strong>${PHONE}</strong></p></div>
    <form class="form panel" data-form="farmer" novalidate>
      <div class="row"><div class="field"><label for="fa-n">${T('Nome', 'Name')}</label><input id="fa-n" name="name" required autocomplete="name"></div><div class="field"><label for="fa-t">${T('Telemóvel', 'Mobile')}</label><input id="fa-t" name="tel" type="tel" required autocomplete="tel"></div></div>
      <div class="row"><div class="field"><label for="fa-l">${T('Localidade', 'Town')}</label><input id="fa-l" name="loc" required></div><div class="field"><label for="fa-a">${T('Área aproximada', 'Approximate area')}</label><select id="fa-a"><option value="lt1">${T('Menos de 1 ha', 'Under 1 ha')}</option><option value="1-5">1–5 ha</option><option value="5-20">5–20 ha</option><option value="gt20">${T('Mais de 20 ha', 'Over 20 ha')}</option></select></div></div>
      <div class="field"><label for="fa-p">${T('O que produz?', 'What do you grow?')}</label><input id="fa-p" name="crops" required placeholder="${T('Ex.: pera, couve, batata', 'E.g. pears, cabbage, potatoes')}"></div>
      <p class="err" hidden></p><button class="btn btn-green" type="submit">${T('Pedir uma visita', 'Request a visit')}</button>
    </form>
  </div></section>`;
  return { title: T('Os nossos agricultores', 'Our farmers'), html, after: () => { if (QS.get('adesao')) setTimeout(() => $('#adesao')?.scrollIntoView(), 50); } };
};
PAGE_EVENTS.click.push((e, t, d) => { if (PAGE === 'agricultores' && d.region) { farmerRegion = d.region; const y = scrollY; render(); scrollTo(0, y); $(`[data-region="${d.region}"]`)?.focus(); return true; } });
document.addEventListener('mouseover', e => {
  if (PAGE !== 'agricultores' && PAGE !== 'restaurantes') return;
  const c = e.target.closest('[data-farmer], [data-rest-card]'); $$('.pin.hl').forEach(p => p.classList.remove('hl'));
  if (c) $(`[data-pin="${c.dataset.farmer}"], [data-rest="${c.dataset.restCard}"]`)?.classList.add('hl');
});

/* ---------------- AGRICULTOR (/agricultores/<id>) ---------------- */
PAGES.agricultor = () => {
  const f = F(PID);
  if (!f) return { title: T('Agricultor não encontrado', 'Farmer not found'), html: `<div class="wrap page-head"><h1>${T('Agricultor não encontrado', 'Farmer not found')}</h1><a class="btn btn-green mt" href="${href('agricultores')}">${T('Ver agricultores', 'See farmers')}</a></div>` };
  const prods = ofFarmer(f.id).sort((a, b) => relRank(a) - relRank(b));
  const days = HARVEST_DAYS.filter(h => h.farmer === f.id && !harvestPast(h));
  const html = `${crumbs([[T('Os nossos agricultores', 'Our farmers'), 'agricultores'], [f.name, '']])}
  <section class="wrap farmer-hero">
    <div class="fh-pic">${farmPic(f)}</div>
    <div><h1>${esc(f.name)}</h1>
      <p class="where big">${icon('pin', 20)}${esc(f.farm)}, ${esc(f.place)} (${regionName(f.region)})</p>
      ${f.since ? `<p class="muted">${T('Agricultor desde', 'Farming since')} ${f.since}</p>` : ''}
      <p class="lead mt-s">${esc(L(f.story))}</p></div>
  </section>
  <section class="sec-tight"><div class="wrap">
    <h2 class="mb">${T('Produtos', 'Produce')}</h2>
    <div class="farm-layout rev farmer-prods"><div class="grid">${prods.map(pcard).join('')}</div>
      <div class="map-col"><div class="map-sticky"><h2 class="sr">${T('Localização', 'Location')}</h2>${portugalMapSVG(farmersForMap(), lang, f.id)}</div></div></div>
    ${days.length ? `<h2 class="mt-l mb">${JTH()}</h2><div class="days">${days.map(dayCard).join('')}</div>` : ''}
  </div></section>
  <section class="sec sec-sage"><div class="wrap"><div class="sec-head"><h2>${T('Outros agricultores', 'Other farmers')}</h2>${railUI('farm')}</div>${rail('farm', FARMERS.filter(x => x.id !== f.id).map(x => fcard(x)))}</div></section>`;
  return { title: f.name, html };
};

/* ---------------- RESTAURANTES ---------------- */
PAGES.restaurantes = () => {
  const html = `${crumbs([[T('Restaurantes', 'Restaurants'), 'restaurantes']])}
  <section class="sec-green on-dark seal-band"><div class="wrap seal-hero">
    <div><h1 class="c-pera">${T('Selo Daqui para restaurantes', 'The Daqui seal for restaurants')}</h1>
      <p class="lead mt">${T('Mostre aos seus clientes de onde vem o que servem. O selo é atribuído aos restaurantes que compram fruta e legumes pela Daqui e indica a quinta e a data de colheita dos ingredientes.', 'Show your diners where their food comes from. The seal goes to restaurants that buy fruit and vegetables through Daqui, and it shows the farm and harvest date of the ingredients.')}</p>
      <div class="row-btns mt"><a class="btn btn-gold" href="#pedir-selo">${T('Pedir o selo', 'Apply for the seal')}</a><a class="btn btn-line c-pera" href="#parceiros">${T('Ver restaurantes parceiros', 'See partner restaurants')}</a></div></div>
    ${sealSVG('hero', lang)}
  </div></section>
  <section class="sec" id="parceiros"><div class="wrap">
    <h2>${T('Restaurantes parceiros em Aveiro', 'Partner restaurants in Aveiro')}</h2>
    <p class="lead mt-s mb">${T('Restaurantes com o Selo Daqui na cidade de Aveiro, e o prato da semana feito com produtos dos nossos agricultores.', 'Restaurants with the Daqui seal in Aveiro, and this week\'s dish made with our farmers\' produce.')}</p>
    <div class="rest-layout">
      <div class="map-col"><div class="mapbox map-sticky">${aveiroMapSVG(restaurantsShown().map(r => Object.assign({}, r, { href: restHref(r) })), lang, '')}</div></div>
      <div>${restFilters()}${restListHTML(restaurantsShown())}</div>
    </div>
    <p class="src">${T('Restaurantes e localizações fictícios, para demonstração.', 'Fictional restaurants and locations, for demonstration.')}</p>
  </div></section>
  <section class="sec sec-sage"><div class="wrap two">
    <div><h2>${T('O que os seus clientes veem', 'What your diners see')}</h2>
      <p class="lead mt-s">${T('Cada prato pode dizer quem cultivou os legumes e quando foram colhidos.', 'Each dish can say who grew the vegetables and when they were picked.')}</p>
      <div class="feat mt">${[['shield', T('Confiança', 'Trust'), T('Verificado por uma entidade certificadora independente.', 'Checked by an independent certification body.')], ['store', T('Promoção gratuita', 'Free promotion'), T('O seu restaurante aparece no mapa e na aplicação da Daqui.', 'Your restaurant appears on the Daqui map and app.')]].map(([i, h, p]) => `<div class="item"><span class="ico">${icon(i, 26)}</span><h3>${h}</h3><p>${p}</p></div>`).join('')}</div></div>
    <div class="menu-mock"><h4>${T('Menu de inverno', 'Winter menu')}</h4>
      <div class="line"><span>${T('Sopa de alho-francês', 'Leek soup')}<small>${T('Alho-francês de Inês Carvalho, Mira.', 'Leeks from Inês Carvalho, Mira.')}</small></span><b>${money(3.5)}</b></div>
      <div class="line"><span>${T('Salada de inverno', 'Winter salad')}<small>${T('Alface da Família Pereira, Lourinhã.', 'Lettuce from the Pereira family, Lourinhã.')}</small></span><b>${money(6.9)}</b></div>
      <div class="line"><span>${T('Tarte de pera Rocha', 'Rocha pear tart')}<small>${T('Pera de Joaquim Santos, Cadaval.', 'Pears from Joaquim Santos, Cadaval.')}</small></span><b>${money(4.5)}</b></div>
      <div class="seal-line">${sealSVG('mini', lang)}${T('Restaurante com Selo Daqui', 'Daqui seal restaurant')}</div></div>
  </div></section>
  <section class="sec"><div class="wrap"><h2 class="mb">${T('Como obter o selo', 'How to get the seal')}</h2>
    <ol class="steps"><li><h3>${T('Registe o restaurante', 'Register your restaurant')}</h3><p>${T('Preencha o formulário ou ligue-nos.', 'Fill in the form or give us a call.')}</p></li><li><h3>${T('Compre pela Daqui', 'Buy through Daqui')}</h3><p>${T('Fruta e legumes entregues na sua cozinha todas as semanas.', 'Fruit and vegetables delivered to your kitchen every week.')}</p></li><li><h3>${T('Verificação de origem', 'Origin check')}</h3><p>${T('Uma entidade certificadora confirma a origem e as datas.', 'A certification body confirms origin and dates.')}</p></li><li><h3>${T('Receba o selo', 'Receive the seal')}</h3><p>${T('Autocolante para a porta, texto para o menu e lugar no mapa.', 'A door sticker, menu wording and a place on the map.')}</p></li></ol>
  </div></section>
  <section class="sec sec-sage" id="pedir-selo"><div class="wrap join">
    <div><h2>${T('Pedir o Selo Daqui', 'Apply for the Daqui seal')}</h2><p class="lead mt-s">${T('Deixe os dados do restaurante e entramos em contacto.', 'Leave your restaurant\'s details and we\'ll get in touch.')}</p></div>
    <form class="form panel" data-form="restaurant" novalidate>
      <div class="row"><div class="field"><label for="r-n">${T('Nome do restaurante', 'Restaurant name')}</label><input id="r-n" name="name" required></div><div class="field"><label for="r-p">${T('Responsável', 'Contact person')}</label><input id="r-p" name="person" required autocomplete="name"></div></div>
      <div class="row"><div class="field"><label for="r-t">${T('Telemóvel', 'Mobile')}</label><input id="r-t" type="tel" required autocomplete="tel"></div><div class="field"><label for="r-l">${T('Localidade', 'Town')}</label><input id="r-l" required></div></div>
      <p class="err" hidden></p><button class="btn btn-green" type="submit">${T('Pedir o selo', 'Apply for the seal')}</button>
    </form>
  </div></section>`;
  return { title: T('Restaurantes e Selo Daqui', 'Restaurants and the Daqui seal'), html };
};

/* ---------------- COLHE CONNOSCO ---------------- */
function dayCard(dd) {
  const f = F(dd.farmer) || { farm: dd.farmer, place: '' }, u = currentUser(), mine = u && (u.harvests || []).find(h => hIs(h, dd)), taken = harvestPeople(dd.id), full = taken >= dd.spots;
  return `<div class="day">
    <div class="date"><b>${fdate(dd.date, { day: 'numeric' })}</b><span>${fdate(dd.date, { month: 'short' })}</span></div>
    <div><h3>${esc(L(dd.what))}</h3><p class="meta">${esc(f.farm)}, ${esc(f.place)}<br>${fdate(dd.date, { weekday: 'long' })}, ${dd.time}</p>
      <div class="occ" role="img" aria-label="${taken} ${T('de', 'of')} ${dd.spots} ${T('lugares ocupados', 'places taken')}"><i style="width:${Math.min(100, taken / dd.spots * 100)}%"></i></div>
      <p class="small muted">${taken} ${T('de', 'of')} ${dd.spots} ${T('lugares ocupados', 'places taken')}</p></div>
    ${mine ? `<p class="note small span2">${icon('check', 20)}<span>${T(`Está inscrito (${mine.people} ${mine.people > 1 ? 'pessoas' : 'pessoa'}).`, `You're signed up (${mine.people} ${mine.people > 1 ? 'people' : 'person'}).`)} <button class="link" data-harv-cancel="${dd.id}">${T('Cancelar inscrição', 'Cancel sign-up')}</button></span></p>`
      : `<button class="btn btn-green btn-sm span2" data-harvest="${dd.id}"${full ? ' disabled' : ''}>${full ? T('Esgotado', 'Full') : T('Inscrever-me', 'Sign me up')}</button>`}
  </div>`;
}
PAGES['colhe-connosco'] = () => {
  const upcoming = HARVEST_DAYS.filter(h => !harvestPast(h)), next = upcoming[0];
  const html = `${crumbs([[JTH(), 'colhe-connosco']])}
  <section class="wrap page-head subhero">
    <div><h1>${T('Colhe Connosco', 'Join the Harvest')}</h1>
      <p class="lead mt-s">${T('Em dias marcados, as quintas abrem as portas a quem cá vive e a quem nos visita. Traga os seus sacos, colha com o agricultor e pague o peso à saída.', 'On set days, the farms open their gates to locals and visitors. Bring your bags, pick alongside the farmer and pay by weight on the way out.')}</p>
      ${next ? `<span class="pill-note">${icon('calendar', 20)}${T('Próximo dia', 'Next day')}: ${fdate(next.date, { weekday: 'long', day: 'numeric', month: 'long' })}</span>` : ''}</div>
    <div class="banner r43">${farmSVG(5, 'diospiro')}</div>
  </section>
  <section class="sec sec-sage"><div class="wrap"><h2 class="mb">${T('Como funciona', 'How it works')}</h2>
    <ol class="steps"><li><h3>${T('Inscreva-se na sua conta', 'Sign up in your account')}</h3><p>${T('Os lugares são limitados para não sobrecarregar a quinta.', 'Places are limited so the farm isn\'t overwhelmed.')}</p></li><li><h3>${T('Traga sacos ou cestos', 'Bring bags or baskets')}</h3><p>${T('Reutilizáveis, de preferência. Nós levamos a balança.', 'Reusable if possible. We bring the scales.')}</p></li><li><h3>${T('Colha com o agricultor', 'Pick with the farmer')}</h3><p>${T('Ele mostra-lhe como e conta a história da quinta.', 'They show you how and tell you the farm\'s story.')}</p></li><li><h3>${T('Pese e pague à saída', 'Weigh and pay on the way out')}</h3><p>${T('Paga só o que levar, por MB WAY ou em numerário.', 'Pay only for what you take, by MB WAY or cash.')}</p></li></ol>
  </div></section>
  <section class="sec"><div class="wrap">
    <div class="sec-head"><div><h2>${T('Próximos dias', 'Upcoming days')}</h2><p class="lead">${T('Os dias dependem do tempo. Se houver alteração, avisamos por mensagem.', 'Days depend on the weather. If anything changes, we\'ll text you.')}</p></div>
      ${currentUser() ? `<a class="btn btn-line c-campo" href="${href('conta')}">${T('As minhas inscrições', 'My sign-ups')}</a>` : ''}</div>
    <div class="days" id="days">${upcoming.length ? upcoming.map(dayCard).join('') : `<p class="muted">${T('Ainda não há dias marcados. Volte em breve.', 'No days scheduled yet. Check back soon.')}</p>`}</div>
  </div></section>
  ${pastHarvestsSection()}`;
  return { title: JTH(), html };
};
/* dias que já passaram, no fundo da página: avaliação média, comentários e respostas da Daqui (a gestão pode responder aqui) */
let pastShown = 4;
function pastHarvestsSection() {
  const past = HARVEST_DAYS.filter(harvestPast).sort((a, b) => b.date.localeCompare(a.date));
  if (!past.length) return '';
  return `<section class="sec sec-sage" id="dias-passados"><div class="wrap">
    <div class="sec-head"><div><h2>${T('Dias passados', 'Past days')}</h2><p class="lead">${T('O que disseram os participantes de cada dia Colhe Connosco.', 'What participants said about each Join the Harvest day.')}</p></div></div>
    <div class="past-days">${past.slice(0, pastShown).map(pastDayCard).join('')}</div>
    ${past.length > pastShown ? `<p class="mt"><button class="btn btn-line c-campo" data-past-more>${T('Ver mais dias passados', 'See more past days')} (${past.length - pastShown})</button></p>` : ''}
  </div></section>`;
}
function reviewItem(d, r, admin) {
  return `<li class="review"><div class="review-h">${stars(r.rating)}<b>${esc(r.name || T('Participante', 'Participant'))}</b></div>
    ${r.comment ? `<p class="review-t">«${esc(r.comment)}»</p>` : ''}
    ${r.reply ? `<p class="review-reply">${icon('chat', 16)}<span><b>${T('Resposta da Daqui', 'Reply from Daqui')}:</b> ${esc(r.reply)}</span></p>` : ''}
    ${admin && r.user ? `<form class="reply-form" data-colhe-reply="${d.id}|${esc(r.user)}"><label class="sr" for="cr-${esc(d.id)}-${esc(r.user)}">${T('Resposta a', 'Reply to')} ${esc(r.name)}</label><textarea id="cr-${esc(d.id)}-${esc(r.user)}" rows="2" placeholder="${T('Responder a este comentário…', 'Reply to this comment…')}">${esc(r.reply || '')}</textarea><button class="btn btn-line btn-sm c-campo" type="submit">${r.reply ? T('Atualizar resposta', 'Update reply') : T('Responder', 'Reply')}</button></form>` : ''}</li>`;
}
function pastDayCard(d) {
  const f = F(d.farmer) || { farm: d.farmer, place: '' }, rv = harvestReviews(d.id), n = rv.length, avg = n ? rv.reduce((a, r) => a + r.rating, 0) / n : 0;
  const admin = !!(currentUser() && currentUser().role === 'admin');
  return `<article class="past-day"><div class="past-day-h"><div class="date"><b>${fdate(d.date, { day: 'numeric' })}</b><span>${fdate(d.date, { month: 'short' })}</span><span class="y">${d.date.slice(0, 4)}</span></div>
      <div><h3>${esc(L(d.what))}</h3><p class="small muted">${esc(f.farm)}${f.place ? ', ' + esc(f.place) : ''} · ${d.time}</p>
        <p class="past-avg">${n ? `${stars(Math.round(avg))} <b>${numFmt(round2(avg))}</b> <span class="small muted">(${n} ${n === 1 ? T('avaliação', 'review') : T('avaliações', 'reviews')})</span>` : `<span class="small muted">${T('Ainda sem avaliações.', 'No reviews yet.')}</span>`}</p></div></div>
    ${rv.some(r => r.comment || r.reply || admin) ? `<ul class="reviews">${rv.filter(r => r.comment || r.reply || admin).map(r => reviewItem(d, r, admin)).join('')}</ul>` : ''}</article>`;
}
PAGE_EVENTS.click.push((e, t, d) => { if ('pastMore' in d) { pastShown += 6; const y = scrollY; render(); scrollTo(0, y); return true; } });
/* gestão: responder a um comentário de um dia passado (aqui e no separador Colhe Connosco da gestão) */
PAGE_EVENTS.submit.push((e, f) => {
  if (!f.matches('[data-colhe-reply]')) return; e.preventDefault();
  const me = currentUser(); if (!me || me.role !== 'admin') return true;
  const [id, un] = f.dataset.colheReply.split('|'), dd = HD(id), u = USERS[un], h = u && dd && (u.harvests || []).find(x => hIs(x, dd)); if (!h) return true;
  const text = $('textarea', f).value.trim().slice(0, 600);
  if (text) h.reply = { text, at: nowISO() }; else delete h.reply;
  saveUsers(); toast(text ? T('Resposta publicada', 'Reply published') : T('Resposta apagada', 'Reply removed')); rerenderKeep(); return true;
});
function refreshDays() { const el = $('#days'); if (el) el.innerHTML = HARVEST_DAYS.filter(h => !harvestPast(h)).map(dayCard).join(''); else { const y = scrollY; render(); scrollTo(0, y); } }
PAGE_EVENTS.click.push((e, t, d) => {
  if (d.harvest) {
    const u = currentUser(), dd = HD(d.harvest); if (!dd) return true;
    if (!u) { loginPrompt(T('Para se inscrever no Colhe Connosco precisa de uma conta. Assim aparece na lista de inscritos do dia.', 'To sign up for Join the Harvest you need an account, so you appear on that day\'s list.')); return true; }
    const left = dd.spots - harvestPeople(dd.id);
    openModal(`<div class="mbody"><h2>${esc(L(dd.what))}, ${fdate(dd.date, { weekday: 'long', day: 'numeric', month: 'long' })}</h2><p class="muted">${esc((F(dd.farmer) || {}).farm || '')}, ${esc((F(dd.farmer) || {}).place || '')}. ${dd.time}.</p>
      <form class="form" data-harv-form="${dd.id}"><p>${T('Inscrição em nome de', 'Signing up as')} <b>${esc(u.name)}</b>.</p>
      <div class="field"><label for="hv-p">${T('Número de pessoas', 'Number of people')}</label><select id="hv-p">${Array.from({ length: Math.min(6, left) }, (_, i) => `<option>${i + 1}</option>`).join('')}</select></div>
      <button class="btn btn-green" type="submit">${T('Confirmar inscrição', 'Confirm sign-up')}</button></form></div>`, JTH());
    return true;
  }
  if (d.harvCancel) { const u = currentUser(); if (u) { const dd = HD(d.harvCancel); u.harvests = (u.harvests || []).filter(h => !(dd ? hIs(h, dd) : h.day === d.harvCancel)); saveUsers(); toast(T('Inscrição cancelada', 'Sign-up cancelled')); PAGE === 'conta' ? (() => { const y = scrollY; render(); scrollTo(0, y); })() : refreshDays(); } return true; }
});
PAGE_EVENTS.submit.push((e, f) => {
  if (!f.matches('[data-harv-form]')) return; e.preventDefault();
  const u = currentUser(); if (!u) return true;
  const dd = HD(f.dataset.harvForm); if (!dd) return true;
  u.harvests = (u.harvests || []).filter(h => !hIs(h, dd)).concat({ day: dd.id, date: dd.date, people: +$('#hv-p', f).value });
  saveUsers(); closeModal(); refreshDays(); toast(T('Inscrição confirmada', 'Sign-up confirmed')); return true;
});

/* ---------------- SOBRE NÓS ---------------- */
PAGES.sobre = () => ({ title: T('Sobre nós', 'About us'), html: `${crumbs([[T('Sobre nós', 'About us'), 'sobre']])}
  <div class="wrap page-head"><h1>${T('A nossa história', 'Our story')}</h1><p class="lead">${T('Queremos que o consumo local seja a escolha mais simples, acessível e justa, para quem compra e para quem produz.', 'We want local food to be the simplest, most affordable and fairest choice, for the people who buy it and the people who grow it.')}</p></div>
  <div class="wrap"><div class="banner">${farmSVG(2, 'pera')}</div></div>
  <section class="sec"><div class="wrap two"><h2>${T('Começámos por uma conta que não batia certo', 'It started with numbers that didn\'t add up')}</h2>
    <div class="prose"><p>${T('A Daqui nasceu como um projeto de estudantes da Universidade de Aveiro. Reparámos que, numa pera Rocha, o produtor fica com cerca de 28% do preço final, enquanto as famílias pagam cada vez mais: em 2024, 50 € compravam menos 20% de fruta e legumes do que em 2022.', 'Daqui began as a student project at the University of Aveiro. We noticed that a Rocha pear grower keeps about 28% of the final price, while households pay more and more: in 2024, €50 bought 20% less fruit and veg than in 2022.')}</p>
      <p>${T('Quisemos juntar as duas pontas. Os agricultores vendem diretamente, guardamos a fruta nas nossas câmaras frigoríficas e entregamos em casa ou deixamos pronto para levantar. Quem levanta não paga mais nada. Quem prefere entrega paga uma pequena taxa.', 'We wanted to bring both ends together. Farmers sell directly, we keep the fruit in our cold rooms, and we deliver to your door or have it ready to collect. Pick-up costs nothing extra. Delivery has a small fee.')}</p>
      <p>${T('E porque nem toda a gente usa aplicações, pode sempre encomendar por telefone e falar com uma pessoa.', 'And because not everyone uses apps, you can always order by phone and talk to a person.')}</p></div></div></section>
  <section class="sec sec-sage"><div class="wrap mvv">
    <div class="card"><h3>${T('Missão', 'Mission')}</h3><p>${T('Levar fruta e legumes diretamente do campo à casa dos nossos clientes, garantindo preços justos para os agricultores e para o consumidor final, máxima frescura e qualidade, origem 100% local e transparente e garantia de saúde.', 'Offering fruits and vegetables directly from the field to our customers\' homes, guaranteeing fair prices for farmers and the end consumer, maximum freshness and quality, 100% local and transparent origin and a health guarantee.')}</p></div>
    <div class="card"><h3>${T('Visão', 'Vision')}</h3><p>${T('Um sistema alimentar mais justo e sustentável, em que os produtores locais são bem pagos pelo seu trabalho e os consumidores têm acesso fácil a produtos frescos, acessíveis e da região.', 'A fairer, more sustainable food system where local producers are fairly rewarded for their work and consumers have easy access to fresh, affordable, locally grown produce.')}</p></div>
    <div class="card"><h3>${T('Valores', 'Values')}</h3><ul>${[[T('Justiça', 'Fairness'), T('um retorno justo para quem produz', 'a fair return for producers')], [T('Transparência', 'Transparency'), T('preços e percurso à vista', 'prices and journey in plain sight')], [T('Proximidade', 'Locality'), T('produzido e consumido em Portugal', 'grown and eaten in Portugal')], [T('Sustentabilidade', 'Sustainability'), T('menos desperdício e transporte', 'less waste and transport')], [T('Acessibilidade', 'Accessibility'), T('fresco, barato e fácil de comprar', 'fresh, affordable and easy to buy')], [T('Comunidade', 'Community'), T('mais laços entre quem produz e quem compra', 'stronger ties between growers and buyers')]].map(([a, b]) => `<li><b>${a}</b>: ${b}</li>`).join('')}</ul></div>
  </div></section>
  <section class="sec"><div class="wrap"><h2>${T('Um modelo em que todos ganham', 'A model where everyone wins')}</h2><p class="lead mt-s mb">${T('Agricultores e restaurantes são nossos parceiros, mas também beneficiam da plataforma.', 'Farmers and restaurants are our partners, but they also benefit from the platform.')}</p>
    <div class="mvv">${[['hand', T('Consumidores', 'Shoppers'), [T('Favoritos em subscrição com preço garantido', 'Favourites on a subscription with a guaranteed price'), T('Descobertas da Estação em cada caixa', 'Seasonal Discoveries in every box'), T('Levantamento grátis ou entrega ao domicílio', 'Free pick-up or home delivery')]], ['tractor', T('Agricultores', 'Farmers'), [T('Uma margem maior para quem produz', 'A bigger margin for growers'), T('Armazenamento em frio', 'Cold storage'), T('Acesso direto aos clientes', 'Direct access to customers')]], ['utensils', T('Restaurantes', 'Restaurants'), [T('O Selo Daqui de frescura e transparência', 'The Daqui seal of freshness and transparency'), T('Os clientes sabem o que estão a comer', 'Diners know exactly what they\'re eating'), T('Um lugar no mapa da Daqui', 'A place on the Daqui map')]]].map(([i, h, l]) => `<div class="card"><span class="c-campo">${icon(i, 34)}</span><h3 class="mt-s">${h}</h3><ul>${l.map(x => `<li>${x}</li>`).join('')}</ul></div>`).join('')}</div></div></section>
  <section class="sec sec-sage"><div class="wrap"><h2 class="mb">${T('O que nos torna diferentes', 'What makes us different')}</h2>
    <div class="feat">${[['pin', T('Uma promessa que se verifica', 'A promise you can check'), T('Cada produto mostra a quinta e a data de colheita.', 'Every product shows the farm and harvest date.')], ['utensils', T('Restaurantes que nos recomendam', 'Restaurants that recommend us'), T('Com o Selo Daqui, os restaurantes divulgam os agricultores.', 'With the Daqui seal, restaurants promote our farmers.')], ['snow', T('Câmaras frigoríficas próprias', 'Our own cold storage'), T('Fruta portuguesa todo o ano, e armazenamento para os agricultores.', 'Portuguese fruit all year round, plus storage for farmers.')], ['phone', T('Telefone e aplicação', 'Phone and app'), T('Chegamos às pessoas que as aplicações deixam de fora.', 'We reach the people app-only services leave out.')]].map(([i, h, p]) => `<div class="item"><span class="ico">${icon(i, 26)}</span><h3>${h}</h3><p>${p}</p></div>`).join('')}</div></div></section>
  <section class="sec"><div class="wrap two"><div><h2>${T('O nosso armazém', 'Our warehouse')}</h2>
      <div class="prose mt-s"><p>${T('Estamos a planear um centro hortofrutícola na zona de Vagos e Oliveira do Bairro, com câmaras frigoríficas, uma linha de calibragem e embalamento, uma loja e escritórios.', 'We are planning a fresh-produce centre near Vagos and Oliveira do Bairro, with cold rooms, a sizing and packing line, a shop and offices.')}</p><p>${T('Até lá, alugamos câmaras frigoríficas perto das quintas.', 'Until then, we rent cold rooms near the farms.')}</p></div>
      <p class="src">${T('Valores estimados pela equipa, sujeitos a confirmação.', 'Team estimates, subject to confirmation.')}</p></div>
    <div class="specs">${[['25 000 m²', T('de terreno', 'plot')], ['10 000 m²', T('de edifício', 'building')], ['5 000 m²', T('de câmaras frigoríficas', 'of cold rooms')], ['~10 000 t', T('de capacidade estimada', 'estimated capacity')]].map(([a, b]) => `<div class="spec"><strong>${a}</strong><span>${b}</span></div>`).join('')}</div></div></section>
  <section class="sec sec-green on-dark"><div class="wrap"><h2 class="c-pera">${T('Os nossos primeiros 90 dias', 'Our first 90 days')}</h2>
    <p class="lead mt-s mb">${T('Começamos sem avaliações nem clientes habituais, por isso o plano é provar o modelo primeiro e crescer depois.', 'We start with no reviews and no regular customers, so the plan is to prove the model first and grow after.')}</p>
    <ol class="timeline">${[[T('Provar', 'Prove'), T('Dias 0–30', 'Days 0–30'), [T('Abrir a lista de membros fundadores', 'Open the founding-members list'), T('Assinar com 3 a 5 quintas piloto', 'Sign 3 to 5 pilot farms'), T('Escolher o modelo de taxas', 'Choose the fee model')]], [T('Construir', 'Build'), T('Dias 31–60', 'Days 31–60'), [T('Testar o selo com os primeiros restaurantes', 'Pilot the seal with the first restaurants'), T('Escrever o protocolo de qualidade', 'Write the quality protocol'), T('Abrir a linha telefónica', 'Open the phone line')]], [T('Lançar', 'Launch'), T('Dias 61–90', 'Days 61–90'), [T('Enviar as primeiras Caixas da Estação', 'Ship the first Seasonal Boxes'), T('Contratar quintas numa segunda região', 'Contract farms in a second region'), T('Focar em 5 a 10 produtos essenciais', 'Focus on 5 to 10 essential products')]]].map(([h, w, l]) => `<li><h3>${h}</h3><p class="when">${w}</p><ul>${l.map(x => `<li>${x}</li>`).join('')}</ul></li>`).join('')}</ol></div></section>` });

/* ---------------- CONTACTO ---------------- */
PAGES.contacto = () => ({ title: T('Contacto', 'Contact'), html: `${crumbs([[T('Contacto', 'Contact'), 'contacto']])}
  <div class="wrap page-head"><h1>${T('Precisa de ajuda?', 'Need help?')}</h1><p class="lead">${T('Escolha o assunto. Se preferir, ligue-nos: do outro lado está sempre uma pessoa.', 'Pick a topic. Or call us: there is always a person on the other end.')}</p></div>
  <div class="wrap help">${[['box', 'order', T('Encomenda', 'Order'), T('Alterar ou cancelar uma encomenda até terça às 18h.', 'Change or cancel an order until Tuesday at 6 pm.'), T('Gerir encomenda', 'Manage order')], ['route', 'track', T('Seguimento', 'Tracking'), T('Saber onde está a sua entrega.', 'See where your delivery is.'), T('Seguir entrega', 'Track delivery')], ['alert', 'issue', T('Incidência', 'Problem'), T('Algum produto chegou danificado ou em falta?', 'Did something arrive damaged or missing?'), T('Comunicar incidência', 'Report a problem')], ['help', 'faq', T('Dúvidas', 'Questions'), T('Respostas sobre produtos, entregas e pagamentos.', 'Answers about products, deliveries and payments.'), T('Ver perguntas', 'See questions')], ['repeat', 'sub', T('Subscrição', 'Subscription'), T('Pausar, mudar ou cancelar a sua caixa.', 'Pause, change or cancel your box.'), T('Ir para a minha conta', 'Go to my account')]].map(([i, k, h, p, b]) => `<div class="card"><span class="ico">${icon(i, 24)}</span><h3>${h}</h3><p>${p}</p>${k === 'faq' ? `<a class="btn btn-line btn-sm c-campo" href="${href('faq')}">${b}</a>` : k === 'sub' ? `<a class="btn btn-line btn-sm c-campo" href="${href('conta')}">${b}</a>` : `<button class="btn btn-line btn-sm c-campo" data-help="${k}">${b}</button>`}</div>`).join('')}</div>
  <section class="sec sec-green on-dark mt-xl"><div class="wrap two">
    <div><h2 class="c-pera">${T('Prefere falar com uma pessoa?', 'Rather talk to a person?')}</h2><p class="lead mt-s">${T('Na Linha Daqui também recebemos encomendas e subscrições.', 'The Daqui line takes orders and subscriptions too.')}</p>
      <span class="phone-big c-pera">${PHONE}</span>
      <div class="hours"><div><span>${T('Segunda a sexta', 'Monday to Friday')}</span><b>9h–18h</b></div><div><span>${T('Sábado', 'Saturday')}</span><b>9h–13h</b></div><div><span>${T('Domingo e feriados', 'Sunday and holidays')}</span><b>${T('Fechado', 'Closed')}</b></div></div></div>
    <form class="form panel c-folha" data-form="contact" novalidate><h3>${T('Escreva-nos', 'Write to us')}</h3>
      <div class="row"><div class="field"><label for="c-n">${T('Nome', 'Name')}</label><input id="c-n" name="name" required autocomplete="name"></div><div class="field"><label for="c-e">${T('E-mail ou telemóvel', 'Email or mobile')}</label><input id="c-e" required></div></div>
      <div class="field"><label for="c-m">${T('Mensagem', 'Message')}</label><textarea id="c-m" required></textarea></div>
      <p class="err" hidden></p><button class="btn btn-green" type="submit">${T('Enviar mensagem', 'Send message')}</button><p class="small muted">${T('Também por e-mail', 'Also by email')}: ${EMAIL}</p></form>
  </div></section>
  <section class="sec"><div class="wrap two"><div><h2>${T('Pontos de recolha', 'Collection points')}</h2><p class="lead mt-s">${T('Levantamento grátis à quinta-feira, das 16h às 20h.', 'Free pick-up on Thursdays, 4 pm to 8 pm.')}</p>
      <ul class="plain-list mt">${PICKUP_POINTS.map(x => `<li>${icon('pin', 18)}${x}</li>`).join('')}</ul></div>
    <div class="mapbox">${aveiroMapSVG([{ id: 'rossio', name: T('Ponto de recolha de Aveiro, Rossio', 'Aveiro collection point, Rossio'), lat: 40.6424, lon: -8.6553, href: '#rossio' }], lang, 'rossio', { icon: true })}</div></div></section>`, after: () => {
    /* abre o seguimento uma só vez: o endereço deixa de ter ?encomenda=…, para a janela não voltar a abrir quando a página é redesenhada (base de dados, língua…) */
    const n = QS.get('encomenda'); if (!n || autoTracked) return; autoTracked = true;
    if (PAGE_DOC !== 'app') { QS.delete('encomenda'); try { history.replaceState(null, '', location.pathname + (QS.toString() ? '?' + QS : '') + location.hash); } catch (e) {} }
    helpModal('track', n, true); } });
let autoTracked = false;
/* gerir encomenda, seguimento e incidências: procuram a encomenda pelo número e telemóvel e ficam registados no painel de gestão */
function helpModal(kind, preNum = '', auto = false) {
  const u = currentUser(), own = u ? ORDERS.filter(o => o.user === u.username).sort((a, b) => b.created.localeCompare(a.created)) : [];
  const titles = { order: T('Gerir encomenda', 'Manage order'), track: T('Seguir entrega', 'Track delivery'), issue: T('Comunicar incidência', 'Report a problem') };
  if (auto && preNum) { const o = findOrder(preNum); if (o && ((u && o.user === u.username) || store.get('daqui-last-order', '') === o.num)) return showOrder(kind, o, true); }
  const sel = own.length && !preNum, ownsPre = !!(preNum && u && findOrder(preNum)?.user === u.username);
  const prodOpts = (o) => (o ? o.items.map(i => P(i.id)).filter(Boolean) : PRODUCTS).map(p => `<option value="${p.id}">${esc(L(p.name))}</option>`).join('');
  openModal(`<div class="mbody"><h2>${titles[kind]}</h2>
    <p class="muted">${kind === 'issue' ? T('Diga-nos o que aconteceu. Substituímos o produto ou devolvemos o valor.', 'Tell us what happened. We replace the item or refund you.') : T('Indique a encomenda. O número começa por DQ e está no e-mail ou mensagem de confirmação.', 'Enter your order. The number starts with DQ and is in your confirmation message.')}</p>
    <form class="form" data-help-form="${kind}" novalidate>
      ${sel ? `<div class="field"><label for="h-sel">${T('A sua encomenda', 'Your order')}</label><select id="h-sel">${own.map(o => `<option value="${o.num}">${o.num}, ${fdate(o.created)}, ${money(o.total)}</option>`).join('')}<option value="">${T('Outra encomenda…', 'Another order…')}</option></select></div>` : ''}
      <div class="field" data-other${sel ? ' hidden' : ''}><label for="h-num">${T('Número da encomenda', 'Order number')}</label><input id="h-num" placeholder="DQ104866" value="${esc(preNum)}"${sel ? '' : ' required'}></div>
      <div class="field" data-other${sel || ownsPre ? ' hidden' : ''}><label for="h-phone">${T('Telemóvel usado na encomenda', 'Mobile used for the order')}</label><input id="h-phone" type="tel" autocomplete="tel"${sel || ownsPre ? '' : ' required'}></div>
      ${kind === 'issue' ? `<div class="field"><label for="h-prod">${T('Produto', 'Product')}</label><select id="h-prod">${prodOpts(sel ? own[0] : preNum ? findOrder(preNum) : null)}</select></div>
        <div class="field"><label for="h-d">${T('O que aconteceu?', 'What happened?')}</label><textarea id="h-d" required></textarea></div>
        <div class="field"><span class="lbl">${T('Prefere', 'You prefer')}</span><div class="radios"><label><input type="radio" name="h-pref" value="sub" checked>${T('Substituir na próxima entrega', 'A replacement next delivery')}</label><label><input type="radio" name="h-pref" value="ref">${T('Reembolso', 'A refund')}</label></div></div>
        <div class="field"><label for="h-f">${T('Fotografia (opcional)', 'Photo (optional)')}</label><input id="h-f" type="file" accept="image/*"></div>` : ''}
      <p class="err" hidden></p>
      <button class="btn btn-green" type="submit">${kind === 'issue' ? T('Enviar incidência', 'Send report') : kind === 'track' ? T('Seguir', 'Track') : T('Procurar encomenda', 'Find order')}</button>
    </form></div>`, titles[kind]);
}
function showOrder(kind, o, logIt) {
  if (logIt) addRequest(kind === 'track' ? 'seguimento' : 'gerir', { order: o.num, result: 'viewed', state: String(orderStage(o)) }, { order: o.num });
  const st = orderStage(o), slots = slotOptions().filter(x => x.date !== o.slot);
  const manage = kind !== 'order' ? '' : st <= 1
    ? `<div class="panel mt"><h3>${T('Alterar a encomenda', 'Change the order')}</h3>
        <div class="field mt-s"><label for="o-slot">${T('Mudar o dia de entrega', 'Change the delivery day')}</label><select id="o-slot">${slots.map(x => `<option value="${x.date}|${x.day}">${slotLabel(x)}</option>`).join('')}</select></div>
        <div class="row-btns mt-s"><button class="btn btn-green btn-sm" data-ord-reslot="${o.num}">${T('Guardar novo dia', 'Save new day')}</button><button class="btn btn-line btn-sm c-tomato" data-ord-cancel="${o.num}">${T('Cancelar encomenda', 'Cancel order')}</button></div></div>`
    : st < STAGE_DONE ? `<p class="note mt">${icon('phone', 20)}<span>${T(`A encomenda já está preparada. Para alterações, ligue para o ${PHONE}.`, `The order is already being packed. For changes, call ${PHONE}.`)}</span></p>` : '';
  openModal(`<div class="mbody">${trackHTML(o)}${orderBoxesHTML(o) ? `<div class="panel mt">${orderBoxesHTML(o)}</div>` : ''}${manage}
    ${st === STAGE_DONE ? `<p class="small muted mt">${T('Algum problema com esta encomenda?', 'Any problem with this order?')} <button class="link" data-help="issue" data-num="${o.num}">${T('Comunicar incidência', 'Report a problem')}</button></p>` : ''}</div>`, `${T('Encomenda', 'Order')} ${o.num}`);
}
PAGE_EVENTS.click.push((e, t, d) => {
  if (d.help) { helpModal(d.help, d.num || ''); return true; }
  if (d.ordReslot) { const o = findOrder(d.ordReslot), [date, day] = $('#o-slot').value.split('|'); const before = o.slot; o.slot = date; o.day = day; saveOrders();
    addRequest('gerir', { order: o.num, action: 'reslot', from: before, to: date }, { order: o.num }); toast(T('Dia de entrega alterado', 'Delivery day changed')); showOrder('order', o, false); return true; }
  if (d.ordCancel) { const o = findOrder(d.ordCancel); o.status = 'cancelada'; saveOrders();
    addRequest('gerir', { order: o.num, action: 'cancel' }, { order: o.num }); toast(T('Encomenda cancelada', 'Order cancelled')); showOrder('order', o, false); return true; }
});
PAGE_EVENTS.change.push((e, t) => {
  if (t.id === 'h-sel') { const other = !t.value; $$('[data-other]').forEach(x => { x.hidden = !other; $('input', x).required = other; });
    const prod = $('#h-prod'); if (prod) { const o = findOrder(t.value); prod.innerHTML = (o ? o.items.map(i => P(i.id)) : PRODUCTS).filter(Boolean).map(p => `<option value="${p.id}">${esc(L(p.name))}</option>`).join(''); } }
});
PAGE_EVENTS.submit.push((e, f) => {
  if (!f.matches('[data-help-form]')) return; e.preventDefault(); if (!validate(f)) return true;
  const kind = f.dataset.helpForm, u = currentUser(), err = $('.err', f), sel = $('#h-sel', f);
  const num = sel && sel.value ? sel.value : $('#h-num', f).value, phone = sel && sel.value ? '' : $('#h-phone', f).value;
  const o = findOrder(num), ok = o && ((sel && sel.value) || (u && o.user === u.username) || normPhone(phone) === o.phone);
  const type = { order: 'gerir', track: 'seguimento', issue: 'incidencia' }[kind];
  const notFound = () => { addRequest(type, { order: normOrder(num), phone: normPhone(phone), result: 'notfound' }); err.hidden = false; err.textContent = T(`Não encontrámos a encomenda ${normOrder(num)} com esse telemóvel. Confirme os dados ou ligue para o ${PHONE}.`, `We couldn't find order ${normOrder(num)} with that mobile number. Check the details or call ${PHONE}.`); };
  const proceed = o => {
    if (kind === 'issue') {
      const file = $('#h-f', f).files[0];
      /* com base de dados, a fotografia vai para o Storage e o pedido guarda o endereço */
      if (file && NUVEM.on && !f.dataset.uploaded) {
        const btn = $('button[type="submit"]', f); btn.disabled = true;
        NUVEM.uploadPhoto(file, (file.name.split('.').pop() || 'jpg').toLowerCase()).then(url => { f.dataset.uploaded = url; proceed(o); }, err => { console.error(err); btn.disabled = false; f.dataset.uploaded = '-'; toast(T('Não foi possível enviar a fotografia; a incidência segue sem ela.', 'The photo could not be sent; the report goes without it.')); proceed(o); });
        return;
      }
      const photo = f.dataset.uploaded && f.dataset.uploaded !== '-' ? f.dataset.uploaded : file?.name || '';
      const r = addRequest('incidencia', { product: $('#h-prod', f).value, what: $('#h-d', f).value.trim(), remedy: $('input[name="h-pref"]:checked', f).value, photo }, { order: o.num });
      $('.mbody').innerHTML = `<h2>${T('Incidência registada', 'Problem reported')}</h2><p class="note done mt">${icon('check', 22)}<span><b>${T('Referência', 'Reference')} ${r.id}</b>, ${T('encomenda', 'order')} ${o.num}. ${T('A equipa responde em 24 horas úteis.', 'The team replies within one working day.')}<br>${REQ_NOTE()}</span></p>`;
      return;
    }
    showOrder(kind, o, true);
  };
  if (ok) { proceed(o); return true; }
  /* com base de dados: um visitante sem conta procura a encomenda pelo número e telemóvel */
  if (NUVEM.on && normPhone(phone).length >= 9) {
    const btn = $('button[type="submit"]', f); btn.disabled = true;
    NUVEM.lookupOrder(num, phone).then(o2 => { btn.disabled = false; if (o2) proceed(o2); else notFound(); }, () => { btn.disabled = false; notFound(); });
    return true;
  }
  notFound(); return true;
});

/* ---------------- FAQ e POLÍTICAS ---------------- */
let faqCat = 'all';
PAGES.faq = () => {
  const cats = [['all', T('Todas', 'All')], ['enc', T('Encomendas e entregas', 'Orders and delivery')], ['sub', T('Subscrição e conta', 'Subscription and account')], ['prod', T('Produtos e origem', 'Products and origin')], ['parc', T('Agricultores e restaurantes', 'Farmers and restaurants')]];
  return { title: T('Perguntas frequentes', 'FAQ'), html: `${crumbs([[T('Perguntas frequentes', 'FAQ'), 'faq']])}
  <div class="wrap page-head"><h1>${T('Perguntas frequentes', 'Frequently asked questions')}</h1><p class="lead">${T(`Não encontra a resposta? Ligue para o ${PHONE}.`, `Can't find the answer? Call ${PHONE}.`)}</p></div>
  <div class="wrap pb-xl"><div class="chips mb" role="group" aria-label="${T('Temas', 'Topics')}">${cats.map(([k, n]) => `<button class="chip" data-faqcat="${k}" aria-pressed="${faqCat === k}">${n}</button>`).join('')}</div>
    <div id="faqlist">${faqList(FAQ.filter(f => faqCat === 'all' || f.cat === faqCat))}</div></div>` };
};
PAGE_EVENTS.click.push((e, t, d) => { if (PAGE === 'faq' && d.faqcat) { faqCat = d.faqcat; $$('[data-faqcat]').forEach(b => b.setAttribute('aria-pressed', b.dataset.faqcat === faqCat)); $('#faqlist').innerHTML = faqList(FAQ.filter(f => faqCat === 'all' || f.cat === faqCat)); return true; } });
PAGES.politicas = () => {
  const S = (h, p, id) => `<h2 id="${id}">${h}</h2><p>${p}</p>`;
  return { title: T('Políticas', 'Policies'), html: `${crumbs([[T('Políticas', 'Policies'), 'politicas']])}
  <div class="wrap page-head legal"><h1>${T('Políticas', 'Policies')}</h1>
    <p class="note mt">${icon('alert', 22)}<span>${T('Textos de exemplo para um projeto académico. Não constituem termos legais.', 'Sample texts for an academic project. They are not legal terms.')}</span></p>
    ${S(T('Termos de utilização', 'Terms of use'), T('Os produtos são frescos e sazonais, podendo variar ligeiramente em calibre e peso. Cobramos sempre o peso real.', 'Products are fresh and seasonal and may vary slightly in size and weight. We always charge the actual weight.'), 'termos')}
    ${S(T('Subscrições e preço garantido', 'Subscriptions and price guarantee'), T('O preço de cada subscrição fica guardado durante 12 meses a contar do início. Se o preço da caixa descer nesse período, passa a pagar o preço mais baixo. Pode pausar ou cancelar a qualquer momento.', 'Each subscription price is saved for 12 months from the start date. If the box price drops in that period, you pay the lower price. You can pause or cancel at any time.'), 'subscricoes')}
    ${S(T('Privacidade', 'Privacy'), T('Usamos os seus dados apenas para encomendas, entregas e contactos sobre o serviço. Nesta demonstração, as contas ficam guardadas só no seu navegador.', 'We use your data only for orders, deliveries and service messages. In this demo, accounts are stored only in your browser.'), 'privacidade')}
    ${S('Cookies', T('Este site guarda no navegador o idioma, o cabaz e as contas de demonstração.', 'This site stores your language, basket and demo accounts in your browser.'), 'cookies')}
    ${S(T('Devoluções e reembolsos', 'Refunds'), T('Se um produto chegar danificado, envie uma fotografia nas 48 horas seguintes. Substituímos na entrega seguinte ou devolvemos o valor.', 'If a product arrives damaged, send us a photo within 48 hours. We replace it in your next delivery or refund it.'), 'devolucoes')}
  </div><div class="spacer"></div>`, after: () => { const sec = QS.get('sec'); if (sec) setTimeout(() => document.getElementById(sec)?.scrollIntoView({ block: 'start' }), 60); } };
};

/* ===================================================================================
   FALAR COM A DAQUI — mensagens entre clientes (ou parceiros) e a conta de gestão
   - Site: botão redondo no canto inferior direito, em todas as páginas.
   - App: Conta → "Falar com a Daqui" (ecrã #/mensagens). Gestão: separador Mensagens.
   - Sem base de dados as mensagens ficam neste navegador (demonstração). Com base de dados vão para a
     tabela "mensagens" (supabase/06-melhorias.sql); um visitante sem conta usa um código de conversa
     guardado no navegador.
   =================================================================================== */
const MSG_KEY = 'daqui-mensagens', CONV_KEY = 'daqui-conversa', GUEST_INFO_KEY = 'daqui-conversa-visitante';
let MESSAGES = (() => { const l = store.get(MSG_KEY, []); return Array.isArray(l) ? l : []; })();   // [{ id, conv, user, name, contact, from: 'cliente'|'gestao', text, at, read }]
const saveMessages = () => { if (!NUVEM.on) store.set(MSG_KEY, MESSAGES); };
let chatOpen = false, adminConv = '', chatTimer = null;
const newUUID = () => (crypto && crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16); }));
/* conversa da pessoa: a conta (com base de dados, o id da conta) ou, sem conta, um código guardado neste navegador */
function myConv(create = false) {
  const u = currentUser();
  if (u) return NUVEM.on ? u._id : 'u:' + u.username;
  let c = store.get(CONV_KEY, ''); if (!c && create) { c = newUUID(); store.set(CONV_KEY, c); } return c;
}
const convMsgs = conv => MESSAGES.filter(m => m.conv === conv).sort((a, b) => String(a.at).localeCompare(String(b.at)));
function convOwner(conv) { const m = MESSAGES.find(x => x.conv === conv && x.user); return m && USERS[m.user] ? USERS[m.user] : Object.values(USERS).find(u => u._id === conv || 'u:' + u.username === conv) || null; }
function convName(conv) { const u = convOwner(conv), g = MESSAGES.find(x => x.conv === conv && x.from === 'cliente' && x.name); return u ? `${u.name} (${u.username})` : g ? `${g.name}${g.contact ? ', ' + g.contact : ''} · ${T('sem conta', 'guest')}` : T('Visitante', 'Guest'); }
function chatUnread() {
  const u = currentUser();
  if (u && u.role === 'admin') return MESSAGES.filter(m => m.from === 'cliente' && !m.read).length;
  const c = myConv(); return c ? convMsgs(c).filter(m => m.from === 'gestao' && !m.read).length : 0;
}
function chatSend(text, conv, from) {
  const u = currentUser(), g = store.get(GUEST_INFO_KEY, {}), owner = from === 'gestao' ? convOwner(conv) : u;
  const m = { id: 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), conv, user: owner ? owner.username : null, name: from === 'gestao' ? 'Daqui' : u ? u.name : g.name || '', contact: from === 'gestao' || u ? '' : g.contact || '', from, text: String(text).slice(0, 2000), at: nowISO(), read: false };
  MESSAGES.push(m); saveMessages(); if (NUVEM.on) NUVEM.sendMessage(m, owner); return m;
}
function chatMarkRead(conv, from) {
  let ch = false; MESSAGES.forEach(m => { if (m.conv === conv && m.from === from && !m.read) { m.read = true; ch = true; } });
  if (ch) { saveMessages(); if (NUVEM.on) NUVEM.markRead(conv); }
}
function chatThread(conv, meFrom) {
  const list = convMsgs(conv), when = m => fdate(m.at, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const hello = meFrom === 'cliente' ? `<div class="msg them"><p>${T('Olá! Escreva aqui a sua pergunta: a equipa Daqui responde nesta conversa, nos dias úteis das 9h às 18h.', 'Hi! Write your question here: the Daqui team answers in this conversation, on working days from 9 am to 6 pm.')}</p></div>` : '';
  return `<div class="msgs" id="msgs" aria-live="polite">${hello}${list.map(m => `<div class="msg ${m.from === meFrom ? 'me' : 'them'}"><p>${esc(m.text).replace(/\n/g, '<br>')}</p><span class="msg-t">${m.from === meFrom ? '' : m.from === 'gestao' ? 'Daqui · ' : esc(m.name || '') + ' · '}${when(m)}</span></div>`).join('')}
    ${!list.length && meFrom === 'gestao' ? `<p class="muted small">${T('Sem mensagens.', 'No messages.')}</p>` : ''}</div>`;
}
function chatForm(conv, from) {
  return `<form class="chat-f" data-chat-form data-conv="${esc(conv)}" data-as="${from}" novalidate><label class="sr" for="chat-text-${from}">${T('Mensagem', 'Message')}</label>
    <textarea id="chat-text-${from}" rows="2" maxlength="2000" placeholder="${from === 'gestao' ? T('Responder…', 'Reply…') : T('Escreva a sua mensagem…', 'Write your message…')}" required></textarea>
    <button class="btn btn-green btn-sm" type="submit" aria-label="${T('Enviar', 'Send')}">${icon('send', 18)}<span>${T('Enviar', 'Send')}</span></button></form>`;
}
/* o conteúdo da conversa do cliente (usado na janela do site e no ecrã da app) */
function chatBody() {
  const u = currentUser(), g = store.get(GUEST_INFO_KEY, null);
  const note = NUVEM.on ? '' : `<p class="small muted chat-demo">${T('Demonstração: as mensagens ficam neste navegador e aparecem no separador Mensagens da conta de gestão.', 'Demo: messages stay in this browser and show up in the management account\'s Messages tab.')}</p>`;
  if (!u && !(g && g.name)) return `${note}<form class="form chat-guest" data-chat-guest novalidate><p>${T('Para lhe podermos responder, diga-nos quem é.', 'So we can answer you, tell us who you are.')}</p>
    <div class="field"><label for="cg-n">${T('Nome', 'Name')}</label><input id="cg-n" required autocomplete="name"></div>
    <div class="field"><label for="cg-c">${T('E-mail ou telemóvel', 'Email or mobile')}</label><input id="cg-c" required autocomplete="email"></div>
    <p class="err" hidden></p><button class="btn btn-green btn-sm" type="submit">${T('Começar conversa', 'Start chatting')}</button>
    <p class="small muted">${T('Tem conta?', 'Have an account?')} <a class="link" href="${href('entrar', 'next=' + encodeURIComponent(typeof currentPath === 'function' ? currentPath() : ''))}">${T('Entre', 'Sign in')}</a> ${T('para ver as mensagens em todos os dispositivos.', 'to see your messages on every device.')}</p></form>`;
  const conv = myConv(true);
  return `${note}${chatThread(conv, 'cliente')}${chatForm(conv, 'cliente')}`;
}
/* site: botão e janela (ficam fora de #app, para não desaparecerem quando a página é redesenhada) */
function chatRefreshUI() {
  if (PAGE_DOC === 'app') return;
  let w = $('#chat'); if (!w) { w = document.createElement('div'); w.id = 'chat'; document.body.appendChild(w); }
  const u = currentUser(), n = chatUnread(), admin = u && u.role === 'admin';
  const fab = admin ? `<a class="chat-fab" href="${href('conta', 'tab=mensagens')}" aria-label="${T('Mensagens dos clientes', 'Customer messages')}${n ? `, ${n} ${T('por ler', 'unread')}` : ''}">${icon('chat', 26)}${n ? `<span class="count">${n}</span>` : ''}</a>`
    : `<button class="chat-fab" data-chat-toggle aria-expanded="${chatOpen}" aria-controls="chat-box" aria-label="${T('Falar com a Daqui', 'Talk to Daqui')}${n ? `, ${n} ${T('mensagens novas', 'new messages')}` : ''}">${icon(chatOpen ? 'close' : 'chat', 26)}${n && !chatOpen ? `<span class="count">${n}</span>` : ''}</button>`;
  const box = chatOpen && !admin ? `<section class="chat-box" id="chat-box" role="dialog" aria-label="${T('Falar com a Daqui', 'Talk to Daqui')}"><header class="chat-h"><span><b>${T('Falar com a Daqui', 'Talk to Daqui')}</b><span class="small">${T('Respondemos nos dias úteis, 9h–18h', 'We reply on working days, 9 am–6 pm')}</span></span><button class="icon-btn" data-chat-toggle aria-label="${T('Fechar', 'Close')}">${icon('close', 22)}</button></header><div class="chat-in">${chatBody()}</div></section>` : '';
  const keep = $('#chat-text-cliente')?.value || '';
  w.innerHTML = box + fab;
  if (keep && $('#chat-text-cliente')) $('#chat-text-cliente').value = keep;
  const m = $('#msgs', w); if (m) m.scrollTop = m.scrollHeight;
}
function chatOpenNow() {
  if (PAGE_DOC === 'app') { location.hash = currentUser()?.role === 'admin' ? '#/g/mensagens' : '#/mensagens'; return; }
  chatOpen = true; chatRefreshUI(); const c = myConv(); if (c) chatMarkRead(c, 'gestao'); chatRefreshUI(); setTimeout(() => ($('#chat-text-cliente') || $('#cg-n'))?.focus(), 30); chatPoll();
}
/* com base de dados: enquanto a conversa está aberta, procura respostas novas */
function chatPoll() {
  clearInterval(chatTimer); if (!NUVEM.on) return;
  chatTimer = setInterval(() => {
    const open = (PAGE_DOC === 'app' && /^#\/(mensagens|g\/mensagens)/.test(location.hash)) || chatOpen || (PAGE === 'conta' && typeof adminTab !== 'undefined' && adminTab === 'mensagens' && currentUser()?.role === 'admin');
    if (!open || document.visibilityState !== 'visible') { if (!open) clearInterval(chatTimer); return; }
    if (NUVEM.live) return;   // com tempo real as mensagens novas chegam sozinhas (js/nuvem.js)
    const before = JSON.stringify(MESSAGES.map(m => [m.id, m.read]));
    NUVEM.loadMessages().then(() => { if (JSON.stringify(MESSAGES.map(m => [m.id, m.read])) === before) return; chatAfterNew(); });
  }, 6000);
}
function chatAfterNew() {
  const u = currentUser();
  if (PAGE_DOC === 'app' || (u && u.role === 'admin' && PAGE === 'conta')) { const busy = document.activeElement && /^(TEXTAREA|INPUT)$/.test(document.activeElement.tagName) && document.activeElement.value; if (!busy) rerenderKeep(); }
  else { const c = myConv(); if (c && chatOpen) chatMarkRead(c, 'gestao'); chatRefreshUI(); }
}
/* gestão: separador Mensagens (site e app) */
function tabMensagens() {
  const convs = [...new Set(MESSAGES.map(m => m.conv))].map(c => { const l = convMsgs(c); return { c, last: l[l.length - 1], unread: l.filter(m => m.from === 'cliente' && !m.read).length }; }).sort((a, b) => String(b.last.at).localeCompare(String(a.last.at)));
  if (!adminConv || !convs.some(x => x.c === adminConv)) adminConv = convs[0] ? convs[0].c : '';
  if (adminConv) chatMarkRead(adminConv, 'cliente');
  setTimeout(chatPoll, 0);
  const owner = adminConv && convOwner(adminConv);
  return `<section class="acc-sec"><h2>${T('Mensagens', 'Messages')}</h2>
    <p class="muted mt-s">${T('Conversas iniciadas no botão "Falar com a Daqui" do site e da app. O cliente recebe a resposta na conversa (e no telemóvel, se tiver a app com notificações).', 'Conversations started from the "Talk to Daqui" button on the site and in the app. The customer gets the reply in the conversation (and on their phone, if they have the app with notifications).')}</p>
    ${convs.length ? `<div class="inbox-chat mt">
      <ul class="conv-list" role="list">${convs.map(x => `<li><button class="conv${x.c === adminConv ? ' on' : ''}" data-chat-conv="${esc(x.c)}" aria-pressed="${x.c === adminConv}"><b>${esc(convName(x.c))}</b><span class="small muted">${esc(String(x.last.text).slice(0, 60))}</span><span class="small muted">${fdate(x.last.at, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>${x.unread ? `<span class="count-in">${x.unread}</span>` : ''}</button></li>`).join('')}</ul>
      <div class="conv-thread"><div class="row-between"><h3>${esc(convName(adminConv))}</h3>${owner ? `<span class="small muted">${esc(owner.phone || '')}${owner.partner ? ` · ${owner.partner.kind === 'agricultor' ? T('agricultor', 'farmer') : T('restaurante', 'restaurant')}` : ''}</span>` : ''}</div>
        ${chatThread(adminConv, 'gestao')}${chatForm(adminConv, 'gestao')}</div></div>` : `<p class="muted mt">${T('Ainda não há mensagens.', 'No messages yet.')}</p>`}</section>`;
}
PAGE_EVENTS.click.push((e, t, d) => {
  if ('chatToggle' in d) { if (chatOpen) { chatOpen = false; chatRefreshUI(); $('.chat-fab')?.focus(); } else chatOpenNow(); return true; }
  if ('chatOpen' in d) { chatOpenNow(); return true; }
  if (d.chatConv !== undefined) { adminConv = d.chatConv; rerenderKeep(`[data-chat-conv="${CSS.escape(d.chatConv)}"]`); chatPoll(); return true; }
});
PAGE_EVENTS.submit.push((e, f) => {
  if (f.matches('[data-chat-guest]')) { e.preventDefault(); if (!validate(f)) return true; store.set(GUEST_INFO_KEY, { name: $('#cg-n').value.trim(), contact: $('#cg-c').value.trim() }); PAGE_DOC === 'app' ? rerenderKeep('#chat-text-cliente') : (chatRefreshUI(), $('#chat-text-cliente')?.focus()); return true; }
  if (!f.matches('[data-chat-form]')) return;
  e.preventDefault(); const ta = $('textarea', f), text = ta.value.trim(); if (!text) { ta.focus(); return true; }
  chatSend(text, f.dataset.conv || myConv(true), f.dataset.as === 'gestao' ? 'gestao' : 'cliente'); ta.value = '';
  if (PAGE_DOC === 'app' || f.dataset.as === 'gestao') rerenderKeep(`#${ta.id}`); else { chatRefreshUI(); $('#chat-text-cliente')?.focus(); }
  chatPoll(); return true;
});
document.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey && e.target.matches && e.target.matches('.chat-f textarea')) { e.preventDefault(); e.target.form.requestSubmit(); } });
