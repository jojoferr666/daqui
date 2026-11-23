/* ===== Daqui — páginas: Início, Produtos, Produto, Subscrição, Configurar subscrição ===== */
const PAGES = {};

/* ---------------- INÍCIO ---------------- */
PAGES.inicio = () => {
  const ids = ['caixa-mista', 'caixa-essencial', 'caixa-fruta', 'caixa-legumes'];
  const extra = PRODUCTS.filter(p => p.cat !== 'caixas' && inSeason(p) && p.essential).concat(PRODUCTS.filter(p => p.cat !== 'caixas' && inSeason(p) && !p.essential && ['diospiro', 'kiwi', 'castanha', 'tangerina', 'grelos', 'abobora'].includes(p.id)));
  const railItems = ids.map(P).concat(extra).slice(0, 15).map(pcard);
  const yes = `<span class="yes" role="img" aria-label="${T('Sim', 'Yes')}">${icon('check', 18)}</span>`, no = `<span class="no" role="img" aria-label="${T('Não', 'No')}">${icon('x', 16)}</span>`;
  const rows = [T('Preço justo para o agricultor', 'A fair price for the farmer'), T('A quinta e a data de colheita em cada produto', 'The farm and harvest date on every product'), T('Divisão do preço à vista', 'The price split in plain sight'), T('Preço da subscrição garantido 12 meses', 'Subscription price guaranteed for 12 months'), T('Encomenda por telefone, com uma pessoa', 'Order by phone, with a real person'), T('Levantamento gratuito', 'Free pick-up')];
  const html = `
  <section class="hero wrap" aria-label="${T('Destaques', 'Highlights')}">
    <div class="slider" data-tone="green" aria-roledescription="carousel"><div class="slides">
      <div class="slide s-green on-dark on" data-tone="green" aria-roledescription="slide" aria-label="1 / 3">
        <div><h1>${T('Do campo para a sua casa.', 'From the field to your door.')}</h1>
          <p>${T('Fruta e legumes de agricultores portugueses, com a quinta e a data de colheita em cada produto. Levante sem custo ou receba em casa.', 'Fruit and vegetables from Portuguese farmers, with the farm and harvest date on every product. Pick up for free or have it delivered.')}</p>
          <div class="ctas"><a class="btn btn-gold" href="${href('produtos')}">${T('Ver produtos', 'Browse the shop')}</a><a class="btn btn-line c-pera" href="${href('subscricao')}">${T('Conhecer a subscrição', 'See subscriptions')}</a></div></div>
        <div class="art">${crateSVG('mista')}<span class="string"></span>${otag(P('pera-rocha'), true)}</div>
      </div>
      <div class="slide s-gold" data-tone="gold" aria-roledescription="slide" aria-label="2 / 3">
        <div><h1>${T('Descobertas da Estação', 'Seasonal Discoveries')}</h1>
          <p>${T('Uma caixa por semana, quinzena ou mês, com os seus favoritos e um produto da época para experimentar. O preço fica garantido durante 12 meses.', 'A box every week, fortnight or month, with your favourites and one seasonal product to try. Your price is guaranteed for 12 months.')}</p>
          <div class="ctas"><a class="btn btn-green" href="${href('subscricao')}">${T('Escolher a minha caixa', 'Choose my box')}</a></div></div>
        <div class="art">${crateSVG('fruta')}</div>
      </div>
      <div class="slide s-sage" data-tone="sage" aria-roledescription="slide" aria-label="3 / 3">
        <div><h1>${T('Prefere encomendar por telefone?', 'Rather order by phone?')}</h1>
          <p>${T('Fale com uma pessoa da nossa equipa, que o ajuda a escolher. Entregamos num dia fixo da semana, sem precisar de aplicação.', 'Talk to someone on our team who will help you choose. We deliver on a fixed day each week, no app needed.')}</p>
          <span class="phone-big">${PHONE}</span><p class="small muted mt-s">${T('Segunda a sexta, 9h–18h. Sábado, 9h–13h.', 'Monday to Friday, 9 am–6 pm. Saturday, 9 am–1 pm.')}</p></div>
        <div class="art">${phoneSVG()}</div>
      </div></div>
      <div class="slider-ui"><button class="arr" data-slide-prev aria-label="${T('Destaque anterior', 'Previous slide')}">${icon('chevL', 18)}</button>
        <div class="dots">${[0, 1, 2].map(i => `<button data-slide="${i}" aria-label="${T('Destaque', 'Slide')} ${i + 1}"${i === 0 ? ' aria-current="true"' : ''}></button>`).join('')}</div>
        <button class="arr" data-slide-next aria-label="${T('Destaque seguinte', 'Next slide')}">${icon('chevR', 18)}</button></div>
    </div>
  </section>

  <section class="sec-tight"><div class="wrap values">
    ${[['coins', T('Preço justo para o agricultor', 'A fair price for farmers'), T('Uma fatia maior do preço fica com quem produz.', 'A bigger share of the price stays with the grower.')],
       ['euro', T('Preço justo para quem compra', 'A fair price for you'), T('Sem intermediários a mais entre o campo e a sua mesa.', 'No extra middlemen between the field and your table.')],
       ['leaf', T('Máxima frescura e qualidade', 'Peak freshness and quality'), T('Colhido para si e guardado nas condições certas.', 'Picked for you and stored in the right conditions.')],
       ['pin', T('100% local, origem à vista', '100% local, visible origin'), T('Sabe sempre quem cultivou e quando colheu.', 'You always know who grew it and when it was picked.')],
       ['shield', T('Garantia de saúde', 'Health guarantee'), T('Controlo de qualidade e segurança alimentar em cada lote.', 'Quality and food-safety checks on every batch.')]]
      .map(([i, h, p]) => `<div class="value"><span class="disc">${icon(i, 28)}</span><h3>${h}</h3><p>${p}</p></div>`).join('')}
  </div></section>

  <section class="sec sec-sage"><div class="wrap">
    <div class="sec-head"><div><h2>${T('Compre diretamente aos agricultores', 'Buy straight from the farmers')}</h2>
      <p class="lead">${T('Comece pelas Caixas da Estação. A seguir, os essenciais da semana e o que está na época.', 'Start with the Seasonal Boxes. Then this week\'s essentials and what\'s in season.')}</p></div>${railUI('prod')}</div>
    ${rail('prod', railItems)}
    <div class="row-between mt">
      <div class="legend"><span><i class="lg-farm"></i>${T('Agricultor', 'Farmer')}</span><span><i class="lg-store"></i>${T('Conservação e embalamento', 'Storage and packing')}</span><span><i class="lg-daqui"></i>Daqui</span><span>${T('(divisão ilustrativa do valor sem IVA; os preços já incluem IVA)', '(illustrative split of the price before VAT; prices include VAT)')}</span></div>
      <a class="btn btn-green" href="${href('produtos')}">${T('Ver todos os produtos', 'See all products')}</a></div>
  </div></section>

  <section class="sec"><div class="wrap">
    <h2 class="mb">${T('Porquê comprar na Daqui e não no supermercado?', 'Why buy from Daqui instead of the supermarket?')}</h2>
    <table class="compare"><thead><tr><th scope="col"><span class="sr">${T('Critério', 'Criterion')}</span></th><th scope="col" class="them">${T('Grandes superfícies', 'Supermarkets')}</th><th scope="col" class="us"><img src="${LOGO_GOLD}" alt="Daqui"></th></tr></thead>
      <tbody>${rows.map(r => `<tr><th scope="row">${r}</th><td class="them">${no}</td><td class="us">${yes}</td></tr>`).join('')}</tbody></table>
  </div></section>

  <section class="sec sec-green on-dark"><div class="wrap euro">
    <div><h2 class="c-pera">${T('Somos intermediários, com as contas à vista', 'We are a middleman, with open books')}</h2>
      <p class="lead mt-s">${T('Entre o campo e a prateleira perde-se a maior parte do preço. A nossa margem sai daí, não de preços mais altos, e mostramos sempre a divisão.', 'Most of the price is lost between field and shelf. Our margin comes out of that gap, not out of higher prices, and we always show you the split.')}</p>
      <div class="facts">
        <div class="fact"><strong>~28%</strong><span>${T('do preço da pera Rocha e da maçã fica com o produtor', 'of the price of Rocha pears and apples goes to the grower')}</span></div>
        <div class="fact"><strong>−20%</strong><span>${T('de fruta e legumes por 50 €, de 2022 para 2024', 'less fruit and veg for €50, from 2022 to 2024')}</span></div>
        <div class="fact"><strong>24%</strong><span>${T('dos residentes tem 65 anos ou mais', 'of residents are aged 65 or over')}</span></div>
        <div class="fact"><strong>39–43%</strong><span>${T('do preço vai para a conservação e o embalamento', 'of the price goes on storage and packing')}</span></div></div>
      <p class="src">${T('Fontes: Observatório Agroalimentar; DECO PROTESTE; INE (2024).', 'Sources: Observatório Agroalimentar; DECO PROTESTE; INE (2024).')}</p></div>
    <div class="ebar">
      <h3>${T('Hoje, no preço de 1 kg de pera Rocha', 'Today, in the price of 1 kg of Rocha pears')}</h3>
      <div class="bar"><div class="seg-farm w28">28%<small>${T('Produtor', 'Grower')}</small></div><div class="seg-store w41">39–43%<small>${T('Conservação e embalamento', 'Storage and packing')}</small></div><div class="seg-retail w31">29–33%<small>${T('Retalho', 'Retail')}</small></div></div>
      <h3>${T('Na Daqui, a mesma pera (exemplo)', 'At Daqui, the same pear (example)')}</h3>
      <div class="bar"><div class="seg-farm w54">54%<small>${T('Agricultor', 'Farmer')}</small></div><div class="seg-store w24">24%<small>${T('Frio e embalagem', 'Cold and packing')}</small></div><div class="seg-daqui w22">22%<small>Daqui</small></div></div>
      <p class="src">${T('A divisão da Daqui é ilustrativa: o modelo de taxas ainda está a ser definido.', 'The Daqui split is illustrative: the fee model is still being defined.')}</p></div>
  </div></section>

  <section class="sec"><div class="wrap">
    <div class="sec-head"><div><h2>${T('Histórias de quem planta', 'Stories from the people who grow it')}</h2><p class="lead">${T('Do Minho ao Algarve, e da Madeira. Conheça as famílias por trás de cada caixa.', 'From the north to the Algarve, and Madeira. Meet the families behind every box.')}</p></div>${railUI('farm')}</div>
    ${rail('farm', FARMERS.map(f => fcard(f, true)))}
    <div class="mt"><a class="btn btn-green" href="${href('agricultores')}">${T('Ver o mapa dos agricultores', 'See the farmers map')}</a></div>
  </div></section>

  <section class="sec sec-sage"><div class="wrap">
    <h2 class="mb">${T('Como funciona', 'How it works')}</h2>
    <ol class="steps">
      <li><h3>${T('Escolha', 'Choose')}</h3><p>${T('No site, na aplicação ou por telefone, até terça-feira às 18h.', 'On the website, in the app or by phone, by Tuesday at 6 pm.')}</p></li>
      <li><h3>${T('O agricultor colhe', 'The farmer picks')}</h3><p>${T('Os legumes de folha são colhidos na véspera da entrega.', 'Leafy greens are picked the day before delivery.')}</p></li>
      <li><h3>${T('Preparamos a encomenda', 'We pack your order')}</h3><p>${T('No nosso armazém refrigerado, com controlo de qualidade.', 'In our cold-storage warehouse, with quality checks.')}</p></li>
      <li><h3>${T('Levanta ou recebe em casa', 'Pick up or get it delivered')}</h3><p>${T('Levantamento grátis ou entrega ao domicílio por 2,90 €.', 'Free pick-up or home delivery for €2.90.')}</p></li>
    </ol>
  </div></section>

  <section class="sec"><div class="wrap">
    <h2>${T('Encomende como preferir', 'Order the way you like')}</h2><p class="lead mt-s mb">${T('Quem gosta de aplicações e quem prefere falar com uma pessoa têm o mesmo serviço.', 'People who love apps and people who prefer talking to someone get the same service.')}</p>
    <div class="channels">${[['app', T('Aplicação', 'App'), T('Veja produtos e encomende em minutos', 'Browse and order in minutes')], ['phone', T('Linha telefónica', 'Phone line'), T('Fale com uma pessoa real', 'Talk to a real person')], ['flyer', T('Folhetos', 'Flyers'), T('Na sua junta e no comércio local', 'At your parish and local shops')], ['utensils', T('Restaurantes', 'Restaurants'), T('Procure o Selo Daqui no menu', 'Look for the Daqui seal on the menu')], ['instagram', T('Redes sociais', 'Social media'), T('Histórias e produtos da época', 'Stories and seasonal produce')], ['sprout', JTH(), T('Dias abertos nas quintas', 'Open days on the farms')]].map(([i, b, s]) => `<div class="channel">${icon(i, 30)}<b>${b}</b><span>${s}</span></div>`).join('')}</div>
  </div></section>

  <section class="sec-tight"><div class="wrap">
    <h2 class="mb">${T('Quer fazer parte da mudança na agricultura local?', 'Want to be part of changing local farming?')}</h2>
    <div class="duo">
      <div class="card g on-dark">${icon('tractor', 40)}<h3>${T('Sou agricultor', 'I\'m a farmer')}</h3><p>${T('Venda diretamente a quem come o que planta, com uma margem maior e armazenamento em frio.', 'Sell directly to the people who eat what you grow, with a bigger margin and cold storage.')}</p><a class="btn btn-gold" href="${href('agricultores', 'adesao=1')}">${T('Inscrever a minha quinta', 'Sign up my farm')}</a></div>
      <div class="card y">${icon('utensils', 40)}<h3>${T('Tenho um restaurante', 'I run a restaurant')}</h3><p>${T('Mostre aos clientes a origem dos seus ingredientes com o Selo Daqui.', 'Show diners where your ingredients come from with the Daqui seal.')}</p><a class="btn btn-green" href="${href('restaurantes')}">${T('Conhecer o Selo Daqui', 'About the Daqui seal')}</a></div>
    </div>
  </div></section>

  ${coopBand()}

  <section class="sec-tight"><div class="wrap row-between">
    <div><h2>${T('Siga-nos em @daqui.pt', 'Follow us at @daqui.pt')}</h2><p class="muted mt-s">${T('Histórias dos agricultores, produtos da época e datas do Colhe Connosco.', 'Farmer stories, seasonal produce and Join the Harvest dates.')}</p></div>
    <div class="social-row">${[['instagram', 'Instagram'], ['tiktok', 'TikTok'], ['facebook', 'Facebook']].map(([s, n]) => `<a href="#" data-social="${s}">${icon(s, 20)}${n}</a>`).join('')}</div>
  </div></section>

  <section class="sec sec-sage"><div class="wrap">
    <div class="sec-head"><h2>${T('Perguntas frequentes', 'Frequently asked questions')}</h2><a class="btn btn-line c-campo" href="${href('faq')}">${T('Ver todas', 'See all')}</a></div>
    ${faqList(FAQ.filter(f => f.home))}
  </div></section>`;
  return { title: T('Fruta e legumes do campo para a sua casa', 'Fruit and vegetables from the field to your home'), html };
};
function foundersForm(id = 'f-found') {
  const u = currentUser();
  return `<form class="form panel" data-form="founders" id="${id}" novalidate>
    <div class="row"><div class="field"><label for="${id}-n">${T('Nome', 'Name')}</label><input id="${id}-n" name="name" required autocomplete="name" value="${u ? esc(u.name) : ''}"></div>
      <div class="field"><label for="${id}-c">${T('E-mail ou telemóvel', 'Email or mobile')}</label><input id="${id}-c" name="contact" required value="${u ? esc(u.phone) : ''}"></div></div>
    <div class="field"><span class="lbl" id="${id}-pl">${T('Como prefere encomendar?', 'How would you rather order?')}</span>
      <div class="radios" role="radiogroup" aria-labelledby="${id}-pl"><label><input type="radio" name="pref" value="app" checked>${T('Site ou aplicação', 'Website or app')}</label><label><input type="radio" name="pref" value="tel">${T('Telefone', 'Phone')}</label></div></div>
    <p class="err" hidden></p><button class="btn btn-green" type="submit">${T('Juntar-me à lista', 'Join the list')}</button>
  </form>`;
}

/* ---------------- PRODUTOS ---------------- */
const shop = { min: 0, cats: new Set(QS.get('cat') && QS.get('cat') !== 'essenciais' ? [QS.get('cat')] : []), avail: new Set(), modes: new Set(), regions: new Set(), essential: QS.get('cat') === 'essenciais', max: 10, sort: 'rel', q: QS.get('q') || '', shown: 24 };
PAGES.produtos = () => {
  const cnt = fn => PRODUCTS.filter(fn).length;
  const chk = (group, val, label, n) => `<label><input type="checkbox" data-filter="${group}" value="${val}"${shop[group].has(val) ? ' checked' : ''}>${label}<span class="n">${n}</span></label>`;
  const tiles = [['caixas', T('Caixas da Estação', 'Seasonal boxes'), crateSVG('mista')], ['fruta', T('Fruta', 'Fruit'), produceSVG('pera')], ['legumes', T('Legumes', 'Vegetables'), produceSVG('alface')], ['essenciais', T('Essenciais', 'Essentials'), produceSVG('batata')]];
  const html = `${crumbs([[T('Produtos', 'Shop'), 'produtos']])}
  <div class="wrap page-head"><h1>${T('Produtos', 'Shop')}</h1><p class="lead">${T(`${PRODUCTS.length} produtos de quintas portuguesas. Cada um mostra quem o cultivou, quando foi colhido e se está na época.`, `${PRODUCTS.length} products from Portuguese farms. Each one shows who grew it, when it was picked and whether it's in season.`)}</p></div>
  <div class="wrap">
    <div class="cats">${tiles.map(([k, n, svg]) => `<button class="cat" data-cat="${k}" aria-pressed="false"><span><span class="cat-name">${n}</span><span class="cat-n">${k === 'essenciais' ? cnt(p => p.essential) : cnt(p => p.cat === k)} ${T('produtos', 'products')}</span></span>${svg}</button>`).join('')}</div>
    <div class="shop">
      <aside class="filters" id="filters" aria-label="${T('Filtros', 'Filters')}">
        <div class="fgroup"><h3>${T('Categoria', 'Category')}</h3>${chk('cats', 'caixas', T('Caixas da Estação', 'Seasonal boxes'), cnt(p => p.cat === 'caixas'))}${chk('cats', 'fruta', T('Fruta', 'Fruit'), cnt(p => p.cat === 'fruta'))}${chk('cats', 'legumes', T('Legumes', 'Vegetables'), cnt(p => p.cat === 'legumes'))}</div>
        <div class="fgroup"><h3>${T('Disponibilidade', 'Availability')}</h3>${chk('avail', 'now', T('Disponível agora', 'Available now'), cnt(available))}${chk('avail', 'nostock', T('Fora de stock', 'Out of stock'), cnt(p => inSeason(p) && soldOut(p)))}${chk('avail', 'off', T('Fora de época', 'Out of season'), cnt(p => !inSeason(p)))}</div>
        <div class="fgroup"><h3>${T('Modo de produção', 'Farming method')}</h3>${chk('modes', 'conv', T('Convencional', 'Conventional'), cnt(hasConv))}${chk('modes', 'bio', T('Biológico', 'Organic'), cnt(hasBio))}</div>
        <div class="fgroup"><h3>${T('Região', 'Region')}</h3>${Object.keys(REGIONS).map(r => chk('regions', r, regionName(r), cnt(p => offersOf(p).some(o => F(o.farmer) && F(o.farmer).region === r)))).join('')}</div>
        <div class="fgroup"><h3>${T('Preço', 'Price')}: <span id="pricev">${money(shop.min)} – ${money(shop.max)}</span></h3>
          <label class="small" for="minp">${T('Desde', 'From')}</label><input id="minp" type="range" min="0" max="10" step="0.5" value="${shop.min}" data-filter-min>
          <label class="small" for="maxp">${T('Até', 'Up to')}</label><input id="maxp" type="range" min="0.5" max="10" step="0.5" value="${shop.max}" data-filter-range>
          <p class="small muted">${T('As caixas aparecem sempre.', 'Boxes always show.')}</p></div>
        <button class="link mt-s" data-reset>${T('Limpar filtros', 'Clear filters')}</button>
      </aside>
      <div>
        <div class="toolbar"><div class="row-gap"><h2 id="count" aria-live="polite"></h2><button class="btn btn-line btn-sm filter-toggle" data-filters-toggle aria-controls="filters" aria-expanded="false">${icon('filter', 18)}${T('Filtros', 'Filters')}</button></div>
          <label class="row-gap"><span class="small muted">${T('Ordenar', 'Sort')}</span><select data-sort>${[['rel', T('Mais relevantes', 'Most relevant')], ['az', T('Alfabética, A–Z', 'Alphabetical, A–Z')], ['za', T('Alfabética, Z–A', 'Alphabetical, Z–A')], ['pa', T('Preço, mais baixo', 'Price, low to high')], ['pd', T('Preço, mais alto', 'Price, high to low')], ['new', T('Colheita mais recente', 'Most recently picked')]].map(([v, n]) => `<option value="${v}"${shop.sort === v ? ' selected' : ''}>${n}</option>`).join('')}</select></label></div>
        <div id="qline"></div><div class="grid" id="results"></div><div id="more" class="ta-c mt"></div>
        <div class="legend mt"><span><i class="lg-farm"></i>${T('Agricultor', 'Farmer')}</span><span><i class="lg-store"></i>${T('Conservação e embalamento', 'Storage and packing')}</span><span><i class="lg-daqui"></i>Daqui</span><span>${T('A barra de cada produto mostra uma divisão ilustrativa do valor sem IVA. Os preços mostrados já incluem IVA.', 'The bar on each product shows an illustrative split of the price before VAT. The prices shown already include VAT.')}</span></div>
      </div>
    </div>
  </div><div class="spacer"></div>`;
  return { title: T('Produtos', 'Shop'), html, after: renderResults };
};
/* filtros da loja (site e app): categoria, disponibilidade, modo de produção, região e intervalo de preços */
const availKey = p => (!inSeason(p) ? 'off' : soldOut(p) ? 'nostock' : 'now');
function prodMatches(p, s) {
  if (s.cats.size && !s.cats.has(p.cat)) return false;
  if (s.essential && !p.essential) return false;
  if (s.avail.size && !s.avail.has(availKey(p))) return false;
  if (s.modes.size && !((s.modes.has('bio') && hasBio(p)) || (s.modes.has('conv') && hasConv(p)))) return false;
  if (s.regions.size && !offersOf(p).some(o => F(o.farmer) && s.regions.has(F(o.farmer).region))) return false;
  if (p.cat !== 'caixas' && (shownPrice(p) > s.max || shownPrice(p) < (s.min || 0))) return false;
  return true;
}
function relRank(p) { return p.cat === 'caixas' ? 0 : !inSeason(p) ? 3 : soldOut(p) ? 2.5 : p.essential ? 1 : 2; }
function filtered() {
  const q = norm(shop.q.trim());
  let list = PRODUCTS.filter(p => {
    if (!prodMatches(p, shop)) return false;
    if (q) { const fs = offersOf(p).map(o => F(o.farmer)).filter(Boolean); const hay = norm(`${p.name.pt} ${p.name.en} ${p.cat} ${hasBio(p) ? 'bio biologico organic' : ''} ${fs.map(f => f.name + ' ' + f.place + ' ' + L(REGIONS[f.region])).join(' ')}`); if (!q.split(/\s+/).every(w => hay.includes(w))) return false; }
    return true;
  });
  const nm = p => L(p.name), hv = p => harvestOf(p)?.getTime() || 0;
  const s = { rel: (a, b) => relRank(a) - relRank(b), az: (a, b) => nm(a).localeCompare(nm(b)), za: (a, b) => nm(b).localeCompare(nm(a)), pa: (a, b) => shownPrice(a) - shownPrice(b), pd: (a, b) => shownPrice(b) - shownPrice(a), new: (a, b) => hv(b) - hv(a) }[shop.sort];
  return [...list].sort(s);
}
function renderResults() {
  const list = filtered(), r = $('#results'); if (!r) return;
  $('#count').textContent = `${list.length} ${list.length === 1 ? T('produto', 'product') : T('produtos', 'products')}`;
  $('#qline').innerHTML = shop.q ? `<p class="note mb-s">${icon('search', 20)}<span>${T('Resultados para', 'Results for')} <b>${esc(shop.q)}</b>. <button class="link" data-clear-q>${T('Limpar pesquisa', 'Clear search')}</button></span></p>` : '';
  r.innerHTML = list.length ? list.slice(0, shop.shown).map(pcard).join('') : `<div class="empty span-all"><h3>${T('Nenhum produto com estes filtros', 'No products match these filters')}</h3><p class="muted">${T('Retire um filtro ou aumente o preço máximo para ver mais produtos.', 'Remove a filter or raise the maximum price to see more products.')}</p><button class="btn btn-green" data-reset>${T('Limpar filtros', 'Clear filters')}</button></div>`;
  $('#more').innerHTML = list.length > shop.shown ? `<p class="small muted">${T(`A mostrar ${shop.shown} de ${list.length}`, `Showing ${shop.shown} of ${list.length}`)}</p><button class="btn btn-line c-campo mt-s" data-more>${T('Mostrar mais produtos', 'Show more products')}</button>` : '';
  $$('.cat').forEach(b => { const k = b.dataset.cat; b.setAttribute('aria-pressed', k === 'essenciais' ? shop.essential : (shop.cats.size === 1 && shop.cats.has(k))); });
}
PAGE_EVENTS.click.push((e, t, d) => {
  if (PAGE !== 'produtos') return;
  if (d.cat) { const k = d.cat; if (k === 'essenciais') shop.essential = !shop.essential; else { const only = shop.cats.size === 1 && shop.cats.has(k); shop.cats = only ? new Set() : new Set([k]); } $$('[data-filter="cats"]').forEach(c => c.checked = shop.cats.has(c.value)); shop.shown = 24; renderResults(); return true; }
  if ('reset' in d) { ['cats', 'avail', 'modes', 'regions'].forEach(k => shop[k].clear()); shop.essential = false; shop.min = 0; shop.max = 10; shop.q = ''; shop.shown = 24; render(); return true; }
  if ('clearQ' in d) { shop.q = ''; $$('[data-search] input').forEach(i => i.value = ''); renderResults(); return true; }
  if ('more' in d) { shop.shown += 24; renderResults(); $$('#results .pcard')[shop.shown - 24]?.querySelector('.pname')?.focus(); return true; }
  if ('filtersToggle' in d) { const o = $('#filters').classList.toggle('open'); t.setAttribute('aria-expanded', o); return true; }
});
PAGE_EVENTS.change.push((e, t) => {
  if (PAGE !== 'produtos') return;
  if (t.dataset.filter) { const s = shop[t.dataset.filter]; t.checked ? s.add(t.value) : s.delete(t.value); shop.shown = 24; renderResults(); }
  if (t.matches('[data-sort]')) { shop.sort = t.value; renderResults(); }
});
PAGE_EVENTS.input.push((e, t) => {
  if (PAGE !== 'produtos' || !t.matches('[data-filter-range], [data-filter-min]')) return;
  if (t.matches('[data-filter-min]')) { shop.min = +t.value; if (shop.min > shop.max) { shop.max = shop.min; $('#maxp').value = shop.max; } }
  else { shop.max = +t.value; if (shop.max < shop.min) { shop.min = shop.max; $('#minp').value = shop.min; } }
  $('#pricev').textContent = `${money(shop.min)} – ${money(shop.max)}`; shop.shown = 24; renderResults();
});

/* ---------------- PRODUTO (/produtos/<id>) ---------------- */
const pd = { size: (P(PID) && BOX_SIZES[PID]) ? (BOX_SIZES[PID].find(s => s.s === QS.get('tamanho')) || BOX_SIZES[PID][0]).s : 'P', qty: 1, bio: null };
/* escolha entre convencional e biológico (quando o produto tem os dois) */
function bioChoice(p, bio, attr) {
  if (!(hasBio(p) && hasConv(p))) return '';
  return `<div class="field"><span class="lbl">${T('Modo de produção', 'Farming method')}</span><div class="seg">${[false, true].map(b => `<button type="button" ${attr}="${b ? 1 : 0}" aria-pressed="${bio === b}"${offerOn(p, b) ? '' : ' disabled'}>${bioName(b)}<small>${money(variantPrice(p, b))}${unitLabel(p.unit)}${b ? ` (+${Math.round(BIO_EXTRA * 100)}%)` : ''}${offerOn(p, b) ? '' : ' · ' + T('esgotado', 'sold out')}</small></button>`).join('')}</div></div>`;
}
PAGES.produto = () => {
  const p = P(PID);
  if (!p) return { title: T('Produto não encontrado', 'Product not found'), html: `${crumbs([[T('Produtos', 'Shop'), 'produtos'], ['?', '']])}<div class="wrap page-head"><h1>${T('Produto não encontrado', 'Product not found')}</h1><p class="lead">${T('Este produto já não existe no catálogo.', 'This product is no longer in the catalogue.')}</p><a class="btn btn-green mt" href="${href('produtos')}">${T('Ver produtos', 'Browse the shop')}</a></div>` };
  const isBox = p.cat === 'caixas', on = inSeason(p), f = p.farmer ? F(p.farmer) : null, [a, b, c] = splitOf(p);
  if (pd.bio === null || (!isBox && !offerOn(p, pd.bio) && offerOn(p, !pd.bio))) pd.bio = isBox ? false : defaultBio(p);
  if (!isBox && pd.qty < qtyStep(p)) pd.qty = qtyStep(p);
  const sz = isBox ? BOX_SIZES[p.id].find(s => s.s === pd.size) : null, price = isBox ? sz.price : variantPrice(p, pd.bio);
  const buy = isBox ? `
      <div class="field"><span class="lbl">${T('Tamanho', 'Size')}</span><div class="seg">${BOX_SIZES[p.id].map(s => `<button data-pd-size="${s.s}" aria-pressed="${s.s === sz.s}">${sizeName(s.s)}<small>${s.kg} kg, ${money(s.price)}</small></button>`).join('')}</div></div>
      <div class="price"><strong class="big">${money(price)}</strong><span>${sz.kg} kg, ${money(price / sz.kg)}/kg</span></div>
      <div class="buy-two">
        <div class="panel"><h3>${T('Subscrever', 'Subscribe')}</h3><p class="small muted">${T('Todas as semanas, quinzenas ou meses. Preço garantido durante 12 meses.', 'Every week, fortnight or month. Price guaranteed for 12 months.')}</p><a class="btn btn-green btn-block" href="${href('subscricao/' + p.id, 'tamanho=' + sz.s)}">${icon('repeat', 18)}${T('Configurar subscrição', 'Set up subscription')}</a></div>
        <div class="panel"><h3>${T('Compra única', 'One-off')}</h3><p class="small muted">${T('Uma caixa, sem compromisso.', 'One box, no commitment.')}</p><button class="btn btn-line btn-block c-campo" data-pd-add="${p.id}">${icon('basket', 18)}${T('Adicionar ao cabaz', 'Add to basket')}</button></div>
      </div>`
    : on && soldOut(p) ? `<div class="price"><strong class="big">${money(price)}</strong><span>${unitLabel(p.unit)}</span></div>
      <div class="note">${icon('alert', 22)}<span>${noProducer(p) ? T('Sem stock: de momento nenhum agricultor o fornece.', 'Out of stock: no farmer supplies it at the moment.') : T('Esgotado esta semana. Volta assim que o agricultor tiver nova colheita.', 'Sold out this week. Back as soon as the farmer has a new harvest.')}</span></div>
      <button class="btn btn-green" data-notify="${p.id}" aria-pressed="${notifyOn(p.id)}">${icon('bell', 18)}${notifyOn(p.id) ? T('Aviso ativo', 'Reminder on') : T('Avisar-me quando houver stock', 'Notify me when back in stock')}</button>`
    : on ? `${bioChoice(p, pd.bio, 'data-pd-bio')}<div class="price"><strong class="big">${money(price)}</strong><span>${unitLabel(p.unit)}${hasBio(p) ? `, ${bioName(pd.bio).toLowerCase()}` : ''}</span></div>
      ${byKg(p) ? `<p class="small muted">${T('Pode encomendar ao meio quilo (por exemplo 2,5 kg).', 'You can order by the half kilo (for example 2.5 kg).')}</p>` : ''}
      ${tracksStock(p) ? `<p class="stock-line small${stockOf(p) < 15 ? ' low' : ''}">${icon('basket', 16)}${stockOf(p) < 15 ? T(`Últimos ${stockText(p, stockOf(p))} em stock`, `Last ${stockText(p, stockOf(p))} in stock`) : T(`Em stock: ${stockText(p, stockOf(p))}`, `In stock: ${stockText(p, stockOf(p))}`)}</p>` : ''}
      <div class="row-gap"><div class="qty m0"><button data-pd-qty="-1" aria-label="${byKg(p) ? T('Menos meio quilo', 'Half a kilo less') : T('Menos um', 'One less')}">${icon('minus', 16)}</button><span>${fmtQty(pd.qty, p)}</span><button data-pd-qty="1" aria-label="${byKg(p) ? T('Mais meio quilo', 'Half a kilo more') : T('Mais um', 'One more')}">${icon('plus', 16)}</button></div>
        <button class="btn btn-green grow" data-pd-add="${p.id}">${icon('basket', 18)}${T('Adicionar ao cabaz', 'Add to basket')}</button></div>`
      : `<div class="note">${icon('calendar', 22)}<span>${T(`Fora de época. ${L(p.name)} volta em ${monthName(p.season[0])}.`, `Out of season. ${L(p.name)} is back in ${monthName(p.season[0])}.`)}</span></div>
      <button class="btn btn-green" data-notify="${p.id}" aria-pressed="${notifyOn(p.id)}">${icon('bell', 18)}${notifyOn(p.id) ? T('Aviso ativo', 'Reminder on') : T('Avisar-me quando voltar', 'Notify me when it\'s back')}</button>`;
  const more = f ? ofFarmer(f.id).filter(x => x.id !== p.id) : [];
  const nOffers = farmersOf(p).length;
  const same = PRODUCTS.filter(x => x.cat === (isBox ? 'fruta' : p.cat) && x.id !== p.id && inSeason(x)).slice(0, 10);
  const html = `${crumbs([[T('Produtos', 'Shop'), 'produtos'], [catName(p.cat), 'produtos', 'cat=' + p.cat], [L(p.name), '']])}
  <section class="wrap pdp">
    <div class="pdp-art${isBox ? ' box' : ''}${on ? '' : ' is-off'}">${badges(p)}${artFor(p)}</div>
    <div class="pdp-info">
      <div class="pdp-title"><h1>${esc(L(p.name))}</h1>${favBtn(p.id, true)}</div>
      ${otag(p)}
      <p class="lead">${esc(L(p.desc || { pt: '', en: '' }))}</p>
      ${isBox ? '' : `<div><p class="lbl">${T('Época', 'Season')}: ${seasonText(p)}</p>${seasonStrip(p)}</div>`}
      ${buy}
      ${on ? `<div><p class="lbl">${T('Para onde vai o seu dinheiro', 'Where your money goes')}</p>${splitBar(p, false)}
        <div class="legend mt-s"><span><i class="lg-farm"></i>${T('Agricultor', 'Farmer')} ${a}%</span><span><i class="lg-store"></i>${T('Conservação e embalamento', 'Storage and packing')} ${b}%</span><span><i class="lg-daqui"></i>Daqui ${c}%</span></div>
        <p class="small muted mt-s">${T('Divisão ilustrativa.', 'Illustrative split.')} ${VAT_NOTE()}</p></div>` : ''}
      ${isBox ? '' : nOffers ? `<div class="farmers-minis">${nOffers > 1 ? `<p class="lbl">${T(`Produzido por ${nOffers} agricultores`, `Grown by ${nOffers} farmers`)}</p>` : ''}${farmersOf(p).map(fid => { const x = F(fid), kinds = offersOf(p).filter(o => o.farmer === fid).map(o => bioName(o.organic).toLowerCase()); const lh = latestHarvest(p.id, fid); return `<a class="farmer-mini" href="${farmerHref(x)}"><span class="fm-pic">${farmPic(x)}</span><span><b>${esc(x.name)}</b><br><span class="small muted">${esc(x.farm)}, ${esc(x.place)}${hasBio(p) && hasConv(p) ? ` · ${kinds.join(T(' e ', ' and '))}` : ''}</span>${lh ? `<br><span class="small fm-harv">${icon('calendar', 14)}${T('Colheita mais recente', 'Latest harvest')}: ${fdate(lh)}</span>` : ''}<br><span class="link small">${T('Conhecer o agricultor', 'Meet the farmer')}</span></span></a>`; }).join('')}</div>`
        : `<p class="note mt-s">${icon('alert', 22)}<span>${T('De momento nenhum agricultor fornece este produto.', 'No farmer supplies this product at the moment.')}</span></p>`}
      ${productTabs(p)}
    </div>
  </section>
  ${reviewsSection(p)}
  ${more.length ? `<section class="sec-tight"><div class="wrap"><h2 class="mb">${T('Mais de', 'More from')} ${esc(f.name)}</h2><div class="grid">${more.map(pcard).join('')}</div></div></section>` : ''}
  ${same.length ? `<section class="sec sec-sage"><div class="wrap"><div class="sec-head"><h2>${T('Também nesta época', 'Also in season')}</h2>${railUI('same')}</div>${rail('same', same.map(pcard))}</div></section>` : ''}`;
  return { title: L(p.name), html };
};
PAGE_EVENTS.click.push((e, t, d) => {
  if (PAGE !== 'produto') return;
  if (d.pdSize || d.pdQty || d.pdBio) { const st = qtyStep(P(PID)); if (d.pdSize) pd.size = d.pdSize; if (d.pdQty) pd.qty = Math.max(st, round2(pd.qty + +d.pdQty * st)); if (d.pdBio) pd.bio = d.pdBio === '1'; const y = scrollY; render(); scrollTo(0, y); $(d.pdSize ? `[data-pd-size="${d.pdSize}"]` : d.pdBio ? `[data-pd-bio="${d.pdBio}"]` : `[data-pd-qty="${d.pdQty}"]`)?.focus(); return true; }
  if (d.pdAdd) { const p = P(d.pdAdd); const qty = p.cat === 'caixas' ? 1 : pd.qty; addToCart(d.pdAdd, p.cat === 'caixas' ? { size: pd.size } : { bio: pd.bio }, qty); addedModal(p, qty, pd.bio); return true; }
});

/* ---------------- SUBSCRIÇÃO ---------------- */
const planState = { 'caixa-mista': { size: 'P', freq: 'sem' }, 'caixa-essencial': { size: 'P', freq: 'sem' }, 'caixa-fruta': { size: 'M', freq: 'quinz' }, 'caixa-legumes': { size: 'M', freq: 'sem' } };
/* todas as caixas com preços (as 4 da Daqui e as criadas na gestão) */
const allBoxes = () => PRODUCTS.filter(p => p.cat === 'caixas' && BOX_SIZES[p.id] && BOX_SIZES[p.id].length);
const planOf = id => planState[id] || (planState[id] = { size: BOX_SIZES[id][0].s, freq: 'sem' });
function planCard(id) {
  const p = P(id), st = planOf(id), sz = BOX_SIZES[id].find(s => s.s === st.size) || BOX_SIZES[id][0];
  const ticks = { 'caixa-mista': [T('Pelo menos 6 variedades da época', 'At least 6 seasonal varieties'), T('Uma Descoberta da Estação com receita', 'One Seasonal Discovery with a recipe')], 'caixa-essencial': [T('Os 8 produtos essenciais da semana', 'The 8 weekly essentials'), T('Sempre os mesmos, para quem gosta de rotina', 'Always the same, for people who like routine')], 'caixa-fruta': [T('Pelo menos 4 frutas da época', 'At least 4 seasonal fruits'), T('Fruta pronta a comer na semana', 'Fruit ready to eat that week')], 'caixa-legumes': [T('Pelo menos 4 legumes da época', 'At least 4 seasonal vegetables'), T('Ideal para sopas e acompanhamentos', 'Great for soups and side dishes')] }[id]
    || [T(`${boxProducts(p).length} produtos da época à escolha`, `${boxProducts(p).length} seasonal products to choose from`), L(p.desc) || T('Uma caixa criada pela equipa Daqui', 'A box put together by the Daqui team')];
  return `<article class="plan" data-plan="${id}">
    <a class="pimg box" href="${productHref(p)}" tabindex="-1" aria-hidden="true">${artFor(p)}</a>
    <div class="pb"><h3>${esc(L(p.name))}</h3>
      <ul class="ticks">${[...ticks, T('Preço garantido durante 12 meses', 'Price guaranteed for 12 months')].map(x => `<li>${icon('check', 18)}${x}</li>`).join('')}</ul>
      <div class="field"><span class="lbl">${T('Tamanho', 'Size')}</span><div class="seg">${BOX_SIZES[id].map(s => `<button data-plan-size="${id}:${s.s}" aria-pressed="${s.s === sz.s}">${sizeName(s.s)}<small>${s.kg} kg, ${money(s.price)}</small></button>`).join('')}</div></div>
      <div class="field"><span class="lbl">${T('Frequência', 'Frequency')}</span><div class="seg">${['sem', 'quinz', 'mens'].map(f => `<button data-plan-freq="${id}:${f}" aria-pressed="${st.freq === f}">${freqName(f)}</button>`).join('')}</div></div>
      <div class="total"><span>${T('Por entrega', 'Per delivery')}</span><strong>${money(sz.price)}</strong></div>
      <a class="btn btn-green" href="${href('subscricao/' + id, `tamanho=${sz.s}&freq=${st.freq}`)}">${T('Subscrever', 'Subscribe')}</a>
    </div></article>`;
}
PAGES.subscricao = () => {
  const base = BOX_SIZES['caixa-mista'][0].price, up = +(base + 0.5).toFixed(2), down = +(base - 0.4).toFixed(2);
  const html = `${crumbs([[T('Subscrição', 'Subscription'), 'subscricao']])}
  <section class="wrap page-head subhero">
    <div><h1>${T('O melhor do campo, sem complicações', 'The best of the countryside, without the hassle')}</h1>
      <p class="lead mt-s">${T('Escolha uma caixa e a frequência. Nós tratamos do resto: os seus favoritos, um produto novo da época em cada entrega e um dia fixo para levantar ou receber em casa.', 'Choose a box and how often. We take care of the rest: your favourites, a new seasonal product in every delivery and a fixed day to pick up or get it delivered.')}</p>
      <span class="pill-note">${icon('lock', 20)}${T('Preço garantido durante 12 meses', 'Price guaranteed for 12 months')}</span></div>
    <div>${crateSVG('legumes')}</div>
  </section>
  <section class="sec sec-sage"><div class="wrap">
    <div class="sec-head"><div><h2>${T('Escolha a sua caixa', 'Choose your box')}</h2><p class="lead">${T('No passo seguinte escolhe o dia, o local de entrega e o que não quer receber.', 'In the next step you choose the day, where to receive it and anything you\'d rather not get.')}</p></div></div>
    <div class="plans" id="plans">${allBoxes().map(b => planCard(b.id)).join('')}</div>
  </div></section>
  <section class="sec"><div class="wrap">
    <div class="two"><div><h2>${T('Preço garantido durante 12 meses', 'Price guaranteed for 12 months')}</h2>
      <p class="lead mt-s">${T('Quando subscreve, o preço da sua caixa fica guardado durante um ano. Só muda se o preço baixar, e aí muda a seu favor.', 'When you subscribe, your box price is saved for a year. It only changes if the price goes down, and then it changes in your favour.')}</p></div>
      <ol class="lock-steps">
        <li><span class="ls-tag">${T('Hoje', 'Today')}</span><b>${T('Subscreve a', 'You subscribe at')} ${money(base)}</b><span class="muted">${T('Este passa a ser o seu preço guardado.', 'This becomes your saved price.')}</span></li>
        <li><span class="ls-tag up">${T('Se subir', 'If it rises')}</span><b>${T('O preço passa a', 'The price goes to')} ${money(up)}</b><span class="muted">${T(`Continua a pagar ${money(base)} até ao fim dos 12 meses.`, `You keep paying ${money(base)} until the 12 months are up.`)}</span></li>
        <li><span class="ls-tag down">${T('Se descer', 'If it falls')}</span><b>${T('O preço passa a', 'The price goes to')} ${money(down)}</b><span class="muted">${T(`Passa a pagar ${money(down)}, e esse fica a ser o seu novo preço guardado.`, `You pay ${money(down)}, and that becomes your new saved price.`)}</span></li>
      </ol></div>
  </div></section>
  <section class="sec sec-green on-dark"><div class="wrap">
    <h2 class="c-pera mb">${T('Como subscrever', 'How to subscribe')}</h2>
    <ol class="steps">
      <li><h3>${T('Escolha a caixa', 'Pick a box')}</h3><p>${T('Mista, só fruta ou só legumes, no tamanho certo para a sua casa.', 'Mixed, fruit only or vegetables only, in the right size for your household.')}</p></li>
      <li><h3>${T('Configure a entrega', 'Set up delivery')}</h3><p>${T('Frequência, dia, levantamento ou entrega em casa.', 'Frequency, day, pick-up or home delivery.')}</p></li>
      <li><h3>${T('Entre na sua conta', 'Sign in')}</h3><p>${T('Com o nome de utilizador ou telemóvel e a palavra-passe.', 'With your username or mobile number and password.')}</p></li>
      <li><h3>${T('Receba e gira', 'Receive and manage')}</h3><p>${T('Pause, mude ou cancele quando quiser na sua conta.', 'Pause, change or cancel whenever you like in your account.')}</p></li>
    </ol>
    <p class="note on-green mt">${icon('phone', 22)}<span>${T(`Prefere tratar de tudo por telefone? Ligue para o ${PHONE}.`, `Rather sort it all out by phone? Call ${PHONE}.`)}</span></p>
  </div></section>
  <section class="sec"><div class="wrap two">
    <div><h2>${T('Ainda tem dúvidas?', 'Still have questions?')}</h2>
      <div class="panel mt"><h3>${T('Já é subscritor?', 'Already a subscriber?')}</h3><p class="muted mt-s mb-s">${T('Pause, mude a frequência ou cancele na sua conta.', 'Pause, change the frequency or cancel in your account.')}</p><a class="btn btn-green" href="${href('conta')}">${T('Gerir a minha subscrição', 'Manage my subscription')}</a></div></div>
    ${faqList(FAQ.filter(f => f.cat === 'sub' || f.k === 'envio'))}
  </div></section>`;
  return { title: T('Subscrição', 'Subscription'), html };
};
PAGE_EVENTS.click.push((e, t, d) => {
  if (PAGE !== 'subscricao' || !(d.planSize || d.planFreq)) return;
  const [id, v] = (d.planSize || d.planFreq).split(':'); if (d.planSize) planState[id].size = v; else planState[id].freq = v;
  t.closest('[data-plan]').outerHTML = planCard(id); $(`[data-plan="${id}"] [data-plan-${d.planSize ? 'size' : 'freq'}="${id}:${v}"]`)?.focus(); return true;
});

/* ---------------- CONFIGURAR SUBSCRIÇÃO (/subscricao/<caixa>) ---------------- */
const PENDING_KEY = 'daqui-pending-sub';
function makeCfg() {
  const sizes = BOX_SIZES[PID] || [];
  const base = { box: PID, size: (sizes.find(s => s.s === QS.get('tamanho')) || sizes[0] || {}).s, freq: ['sem', 'quinz', 'mens'].includes(QS.get('freq')) ? QS.get('freq') : 'sem', day: 'qui', deliver: 'pickup', point: PICKUP_POINTS[1], address: '', postal: '', town: '', discovery: true, pay: 'mbway' };
  if (QS.get('retomar')) { const p = store.get(PENDING_KEY, null); if (p && p.box === PID) return Object.assign(base, p); }
  return base;
}
let cfg = makeCfg();
function subSummary() {
  const p = P(PID), sz = BOX_SIZES[PID].find(s => s.s === cfg.size), q = quote([{ id: PID, qty: 1, price: sz.price, opts: { kg: sz.kg } }], cfg.deliver, currentUser(), null, false), fee = q.ship.fee + q.boxes.fee;
  const per = { sem: 52 / 12, quinz: 26 / 12, mens: 13 / 12 }[cfg.freq], first = firstDelivery(cfg.day), lockEnd = addDays(today(), 365);
  return `<div class="sum-art">${artFor(p)}</div><h3>${esc(L(p.name))}</h3>
    <dl class="dl">
      <div><dt>${T('Tamanho', 'Size')}</dt><dd>${sizeName(sz.s)}, ${sz.kg} kg</dd></div>
      <div><dt>${T('Frequência', 'Frequency')}</dt><dd>${freqName(cfg.freq)}, ${dayName(cfg.day).toLowerCase()}</dd></div>
      <div><dt>${T('Primeira entrega', 'First delivery')}</dt><dd>${fdate(first, { weekday: 'long', day: 'numeric', month: 'long' })}</dd></div>
      ${q.boxes.fee ? `<div><dt>${T('Caixa de cartão', 'Cardboard box')} <span class="small muted">(${cardboardText(q.boxes)})</span></dt><dd>${money(q.boxes.fee)}</dd></div>` : ''}
      <div><dt>${cfg.deliver === 'home' ? T('Entrega em casa', 'Home delivery') : T('Ponto de recolha', 'Pick-up point')}</dt><dd>${q.ship.fee ? money(q.ship.fee) : T('Grátis', 'Free')}</dd></div>
      <div class="tot"><dt>${T('Por entrega', 'Per delivery')}</dt><dd>${money(sz.price + fee)}</dd></div>
      <div><dt>${T('Por mês (aprox.)', 'Per month (approx.)')}</dt><dd>${money((sz.price + fee) * per)}</dd></div>
    </dl>
    <p class="note small">${icon('lock', 20)}<span>${T(`Preço guardado até ${fdate(lockEnd, { day: 'numeric', month: 'long', year: 'numeric' })}. Se baixar, paga menos.`, `Price saved until ${fdate(lockEnd, { day: 'numeric', month: 'long', year: 'numeric' })}. If it drops, you pay less.`)}</span></p>`;
}
PAGES.subscrever = () => {
  const p = P(PID);
  if (p && BOX_SIZES[PID] && BOX_SIZES[PID].length && !BOX_SIZES[PID].some(s => s.s === cfg.size)) cfg = makeCfg();   // caixas da base de dados: os tamanhos só chegam depois de carregar
  if (!p || !BOX_SIZES[PID] || !BOX_SIZES[PID].length) return { title: T('Caixa não encontrada', 'Box not found'), html: `<div class="wrap page-head"><h1>${T('Caixa não encontrada', 'Box not found')}</h1><a class="btn btn-green mt" href="${href('subscricao')}">${T('Ver caixas', 'See boxes')}</a></div>` };
  const u = currentUser();
  if (u && u.address && !cfg.address && !cfg.addrTouched) { cfg.address = u.address.street; cfg.postal = u.address.postal; cfg.town = u.address.town; }
  const html = `${crumbs([[T('Subscrição', 'Subscription'), 'subscricao'], [L(p.name), '']])}
  <div class="wrap page-head"><h1>${T('Configurar a subscrição', 'Set up your subscription')}</h1><p class="lead">${esc(L(p.name))}. ${esc(L(p.desc))}</p></div>
  <div class="wrap subflow">
    <form class="subform" id="subform" novalidate>
      <fieldset><legend><span class="n">1</span>${T('Tamanho', 'Size')}</legend><div class="seg">${BOX_SIZES[PID].map(s => `<button type="button" data-cfg="size:${s.s}" aria-pressed="${cfg.size === s.s}">${sizeName(s.s)}<small>${s.kg} kg, ${money(s.price)}</small></button>`).join('')}</div></fieldset>
      <fieldset><legend><span class="n">2</span>${T('Frequência e dia', 'Frequency and day')}</legend>
        <div class="seg">${['sem', 'quinz', 'mens'].map(f => `<button type="button" data-cfg="freq:${f}" aria-pressed="${cfg.freq === f}">${freqName(f)}</button>`).join('')}</div>
        <div class="seg mt-s">${['qui', 'sab'].map(dd => `<button type="button" data-cfg="day:${dd}" aria-pressed="${cfg.day === dd}">${dayName(dd)}</button>`).join('')}</div></fieldset>
      <fieldset><legend><span class="n">3</span>${T('Como recebe', 'How you receive it')}</legend>
        <div class="radios"><label><input type="radio" name="cfg-deliver" value="pickup"${cfg.deliver === 'pickup' ? ' checked' : ''}>${T('Ponto de recolha', 'Pick-up point')} (+${feeText('pickup')})</label><label><input type="radio" name="cfg-deliver" value="home"${cfg.deliver === 'home' ? ' checked' : ''}>${T('Entrega em casa', 'Home delivery')} (+${feeText('home')})</label></div>
        ${cfg.deliver === 'pickup' ? `<div class="field mt-s"><label for="cfg-point">${T('Ponto de recolha', 'Collection point')}</label><select id="cfg-point" data-cfg-field="point">${PICKUP_POINTS.map(x => `<option${x === cfg.point ? ' selected' : ''}>${x}</option>`).join('')}</select></div>`
          : `<div class="field mt-s"><label for="cfg-address">${T('Morada', 'Address')}</label><input id="cfg-address" data-cfg-field="address" value="${esc(cfg.address)}" required autocomplete="street-address"></div>
             <div class="row"><div class="field"><label for="cfg-postal">${T('Código postal', 'Postcode')}</label><input id="cfg-postal" data-cfg-field="postal" value="${esc(cfg.postal)}" required autocomplete="postal-code" placeholder="3810-000"></div>
             <div class="field"><label for="cfg-town">${T('Localidade', 'Town')}</label><input id="cfg-town" data-cfg-field="town" value="${esc(cfg.town)}" required></div></div>
             ${u ? `<label class="switch mt-s"><input type="checkbox" data-cfg-check="saveAddr"${cfg.saveAddr !== false ? ' checked' : ''}>${u.address ? T('Atualizar a morada guardada na conta', 'Update the address saved on my account') : T('Guardar esta morada na minha conta', 'Save this address to my account')}</label>` : ''}`}</fieldset>
      <fieldset><legend><span class="n">4</span>${T('Preferências', 'Preferences')}</legend>
        ${prefsSummary(u, 'subscricao/' + PID)}
        <label class="switch mt-s"><input type="checkbox" data-cfg-check="discovery"${cfg.discovery ? ' checked' : ''}>${T('Incluir uma Descoberta da Estação em cada caixa', 'Include a Seasonal Discovery in every box')}</label></fieldset>
      <fieldset><legend><span class="n">5</span>${T('Pagamento', 'Payment')}</legend>
        <div class="radios">${[['mbway', 'MB WAY'], ['mb', T('Referência Multibanco', 'Multibanco reference')], ['entrega', T('Na entrega', 'On delivery')]].map(([v, n]) => `<label><input type="radio" name="cfg-pay" value="${v}"${cfg.pay === v ? ' checked' : ''}>${n}</label>`).join('')}</div>
        <p class="small muted mt-s">${T('Demonstração: não é feito nenhum pagamento.', 'Demo: no payment is taken.')}</p></fieldset>
      <fieldset><legend><span class="n">6</span>${T('A sua conta', 'Your account')}</legend>
        ${u ? `<p>${T('Vai subscrever como', 'You are subscribing as')} <b>${esc(u.name)}</b> (${esc(u.username)}).</p>`
            : `<p>${T('Para confirmar precisa de entrar na sua conta. Guardamos estas escolhas enquanto entra.', 'To confirm you need to sign in. We keep these choices while you do.')}</p>
               <div class="row-btns mt-s"><button type="button" class="btn btn-line c-campo" data-cfg-login="entrar">${T('Entrar', 'Sign in')}</button><button type="button" class="btn btn-line c-campo" data-cfg-login="registo">${T('Criar conta', 'Create account')}</button></div>`}</fieldset>
      <p class="err" hidden></p>
    </form>
    <aside class="subsum panel" aria-live="polite"><div id="subsum">${subSummary()}</div>
      <button class="btn btn-green btn-block mt" data-cfg-confirm>${u ? T('Confirmar subscrição', 'Confirm subscription') : T('Entrar e confirmar', 'Sign in and confirm')}</button>
      <p class="small muted mt-s ta-c">${T('Pode pausar ou cancelar quando quiser.', 'Pause or cancel whenever you like.')}</p></aside>
  </div><div class="spacer"></div>`;
  return { title: `${T('Subscrever', 'Subscribe')}: ${L(p.name)}`, html };
};
function cfgRerender(sel) { const y = scrollY; render(); scrollTo(0, y); if (sel) $(sel)?.focus(); }
function goLoginWithCfg(mode) { store.set(PENDING_KEY, cfg); go('entrar', `${mode === 'registo' ? 'modo=registo&' : ''}next=${encodeURIComponent('subscricao/' + PID)}`); }
PAGE_EVENTS.click.push((e, t, d) => {
  if (PAGE !== 'subscrever') return;
  if (d.cfg) { const [k, v] = d.cfg.split(':'); cfg[k] = v; cfgRerender(`[data-cfg="${d.cfg}"]`); return true; }
  if (d.cfgLogin) { goLoginWithCfg(d.cfgLogin); return true; }
  if (d.prefsBack) { store.set(PENDING_KEY, cfg); go('conta', 'sec=preferencias&voltar=' + encodeURIComponent(d.prefsBack)); return true; }
  if ('cfgConfirm' in d) {
    const u = currentUser(); if (!u) { goLoginWithCfg('entrar'); return true; }
    const f = $('#subform'); if (cfg.deliver === 'home' && !validate(f)) return true;
    const sz = BOX_SIZES[PID].find(s => s.s === cfg.size), now = today();
    const sub = { id: 's-' + Date.now().toString(36), box: PID, size: sz.s, kg: sz.kg, freq: cfg.freq, day: cfg.day, deliver: cfg.deliver, point: cfg.deliver === 'pickup' ? cfg.point : '', address: cfg.deliver === 'home' ? `${cfg.address}, ${cfg.postal} ${cfg.town}` : '', discovery: cfg.discovery, pay: cfg.pay, locked: sz.price, start: iso(now), first: iso(firstDelivery(cfg.day, now)), status: 'ativa' };
    if (cfg.deliver === 'home' && cfg.saveAddr !== false) u.address = { street: cfg.address, postal: cfg.postal, town: cfg.town };
    u.subs = u.subs || []; u.subs.push(sub); saveUsers(); store.del(PENDING_KEY); go('conta', 'nova=' + sub.id); return true;
  }
});
PAGE_EVENTS.change.push((e, t) => {
  if (PAGE !== 'subscrever') return;
  if (t.name === 'cfg-deliver') { cfg.deliver = t.value; cfgRerender(`input[name="cfg-deliver"][value="${t.value}"]`); }
  if (t.name === 'cfg-pay') cfg.pay = t.value;
  if (t.dataset.cfgField === 'point') { cfg.point = t.value; $('#subsum').innerHTML = subSummary(); }
  if (t.dataset.cfgCheck) cfg[t.dataset.cfgCheck] = t.checked;
});
PAGE_EVENTS.input.push((e, t) => { if (PAGE === 'subscrever' && t.dataset.cfgField && t.tagName === 'INPUT') { cfg[t.dataset.cfgField] = t.value; cfg.addrTouched = true; } });

/* ---------------- abas da página de produto ---------------- */
function boxProducts(p) {
  if (p.items) return PRODUCTS.filter(x => p.items.includes(x.id) && inSeason(x)).sort((a, b) => relRank(a) - relRank(b));
  if (p.id === 'caixa-essencial') return PRODUCTS.filter(x => x.essential);
  const cats = { 'caixa-fruta': ['fruta'], 'caixa-legumes': ['legumes'] }[p.id] || ['fruta', 'legumes'];
  return PRODUCTS.filter(x => cats.includes(x.cat) && inSeason(x)).sort((a, b) => relRank(a) - relRank(b));
}
/* informação do produto: análises, mais sobre o produto e envio (a mesma no site e na app) */
function productInfo(p) {
  const isBox = p.cat === 'caixas', a = typeof ANALYSES !== 'undefined' ? ANALYSES[p.id] : null, f = p.farmer ? F(p.farmer) : null;
  const tips = GROUP_TIPS[isBox ? 'caixas' : GROUP_OF[p.id] || p.cat] || GROUP_TIPS.fruta, slots = slotOptions();
  const PN = { pesticidas: [T('Resíduos de pesticidas', 'Pesticide residues'), T('Não detetados nas 520 substâncias pesquisadas', 'None detected across the 520 substances tested')],
    metais: [T('Metais pesados (chumbo e cádmio)', 'Heavy metals (lead and cadmium)'), T('Abaixo dos valores de referência', 'Below reference values')],
    nitratos: [T('Nitratos', 'Nitrates'), T('Abaixo do limite para folhas verdes', 'Below the limit for leafy greens')],
    microbiologia: [T('Microbiologia (E. coli)', 'Microbiology (E. coli)'), T('Dentro dos critérios de higiene', 'Within hygiene criteria')],
    brix: [T('Doçura (°Brix)', 'Sweetness (°Brix)'), T('Medida para confirmar a maturação', 'Measured to confirm ripeness')] };
  const analyses = isBox
    ? `<p>${T('Cada produto da caixa tem o seu próprio boletim de análise, na página do produto.', 'Every product in the box has its own lab report, on the product\'s page.')}</p>
       <ul class="plain-list mt-s">${boxProducts(p).slice(0, 8).map(x => `<li>${icon('shield', 18)}<a class="link" href="${productHref(x)}">${esc(L(x.name))}</a></li>`).join('')}</ul>`
    : a ? `<p>${T(`Cada lote é analisado por um laboratório independente antes de entrar no nosso armazém. Último boletim: n.º ${a.n}, ensaio de ${fdate(a.date, { day: 'numeric', month: 'long', year: 'numeric' })}.`, `Every batch is tested by an independent lab before it enters our warehouse. Latest report: no. ${a.n}, tested on ${fdate(a.date, { day: 'numeric', month: 'long', year: 'numeric' })}.`)}</p>
       <ul class="checks">${a.params.map(k => `<li>${icon('check', 18)}<span><b>${PN[k][0]}</b><br><span class="small muted">${PN[k][1]}</span></span></li>`).join('')}</ul>
       <a class="btn btn-line btn-sm c-campo" href="${R}docs/analises/${p.id}.pdf" target="_blank" rel="noopener">${icon('flyer', 18)}${T('Abrir boletim de análise (PDF)', 'Open lab report (PDF)')}</a>
       <p class="small muted mt-s">${T('Documento de exemplo, com dados fictícios.', 'Sample document with fictional data.')}</p>`
    : `<p>${T('O boletim deste produto ainda está a ser preparado.', 'The report for this product is still being prepared.')}</p>`;
  const unitTxt = { kg: T('Ao quilo. Pesamos na preparação e cobramos o peso real.', 'By the kilo. We weigh it when packing and charge the actual weight.'), un: T('À unidade.', 'Each.'), molho: T('Ao molho.', 'By the bunch.'), cuv: T('Em cuvete de cartão.', 'In a cardboard punnet.'), cx: T('À caixa.', 'By the box.') }[p.unit];
  const more = isBox
    ? `<dl class="dl"><div><dt>${T('Tamanhos', 'Sizes')}</dt><dd>${BOX_SIZES[p.id].map(x => `${sizeName(x.s)} ${x.kg} kg`).join(', ')}</dd></div>
        <div><dt>${T('Composição', 'Contents')}</dt><dd>${esc(L(p.desc))}</dd></div>
        <div><dt>${T('Esta semana pode incluir', 'This week may include')}</dt><dd>${boxProducts(p).slice(0, 6).map(x => esc(L(x.name))).join(', ')}</dd></div></dl>
       <p class="mt-s">${tips.keep[lang]}</p><p class="mt-s">${tips.use[lang]}</p>`
    : `<dl class="dl">
        <div><dt>${T('Origem', 'Origin')}</dt><dd>${offersOf(p).map(o => F(o.farmer)).filter((x, i, a) => x && a.indexOf(x) === i).map(x => `${esc(x.farm)}, ${esc(x.place)} (${regionName(x.region)})`).join('; ')}</dd></div>
        <div><dt>${T('Época', 'Season')}</dt><dd>${seasonText(p)}</dd></div>
        <div><dt>${T('Modo de produção', 'Farming method')}</dt><dd>${hasBio(p) && hasConv(p) ? T(`Convencional (proteção integrada) ou biológico, à escolha (+${Math.round(BIO_EXTRA * 100)}%)`, `Conventional (integrated pest management) or organic, your choice (+${Math.round(BIO_EXTRA * 100)}%)`) : hasBio(p) ? T('Biológico', 'Organic') : T('Convencional, com proteção integrada', 'Conventional, integrated pest management')}</dd></div>
        <div><dt>${T('Venda', 'Sold')}</dt><dd>${unitTxt}</dd></div></dl>
       <h4>${T('Como conservar', 'How to store it')}</h4><p>${tips.keep[lang]}</p>
       <h4>${T('Como escolher', 'How to choose')}</h4><p>${tips.pick[lang]}</p>
       <h4>${T('Sugestões', 'Ideas')}</h4><p>${tips.use[lang]}</p>`;
  const ship = `<dl class="dl">
      <div><dt>${T('Dias de distribuição', 'Delivery days')}</dt><dd>${T('Quinta-feira e sábado', 'Thursday and Saturday')}</dd></div>
      <div><dt>${T('Se encomendar agora', 'If you order now')}</dt><dd>${slotLabel(slots[0])}</dd></div>
      <div><dt>${T('Entrega em casa', 'Home delivery')}</dt><dd>${feeText('home')}, ${T('entre as', 'between')} ${DISTRIBUTION.windows.join(T(' ou ', ' or '))}</dd></div>
      <div><dt>${T('Ponto de recolha', 'Pick-up point')}</dt><dd>${feeText('pickup')}: ${T('quinta', 'Thu')} ${DISTRIBUTION.days.qui.pickup}, ${T('sábado', 'Sat')} ${DISTRIBUTION.days.sab.pickup}</dd></div>
      <div><dt>${T('Portes grátis', 'Free delivery')}</dt><dd>${T(`a partir de ${money(SETTINGS.freeFrom)} e para membros da Cooperativa`, `over ${money(SETTINGS.freeFrom)} and for Co-op members`)}</dd></div>
      <div><dt>${T('Caixas de cartão', 'Cardboard boxes')}</dt><dd>${T('5 kg 0,85 €; 10 kg 1,00 € (devolvidas na encomenda seguinte)', '5 kg €0.85; 10 kg €1.00 (refunded on your next order)')}</dd></div></dl>
    <ul class="checks mt-s">
      <li>${icon('calendar', 18)}<span>${T('Encomendas até terça-feira às 18h seguem na quinta; até quinta-feira às 18h seguem no sábado.', 'Orders by Tuesday 6 pm go out on Thursday; by Thursday 6 pm, on Saturday.')}</span></li>
      <li>${icon('pin', 18)}<span>${T('Entregamos nos concelhos de', 'We deliver in')} ${DISTRIBUTION.area.join(', ')}. ${T('Pontos de recolha', 'Collection points')}: ${PICKUP_POINTS.join(', ')}.</span></li>
      <li>${icon('snow', 18)}<span>${T('Do armazém até si em carrinhas refrigeradas, para não quebrar a cadeia de frio.', 'From our warehouse to you in refrigerated vans, so the cold chain is never broken.')}</span></li>
      <li>${icon('box', 18)}<span>${T('Caixas de cartão reutilizáveis e sacos de papel. Devolva a caixa na entrega seguinte.', 'Reusable cardboard boxes and paper bags. Hand the box back at your next delivery.')}</span></li>
      <li>${icon('route', 18)}<span>${T('Cada encomenda tem um número para seguir a entrega na página de contacto.', 'Every order has a number to track the delivery on the contact page.')}</span></li>
      <li>${icon('alert', 18)}<span>${T('Se algo chegar em mau estado, comunique nas 48 horas seguintes: substituímos ou devolvemos o valor.', 'If something arrives damaged, tell us within 48 hours: we replace it or refund you.')}</span></li>
    </ul>`;
  return [['shield', T('Análises e segurança alimentar', 'Lab tests and food safety'), analyses], ['leaf', T('Mais sobre o produto', 'More about this product'), more], ['truck', T('Envio e entrega', 'Shipping and delivery'), ship]];
}
function productTabs(p) {
  const sec = ([ic, title, body]) => `<details><summary>${icon(ic, 20)}<span>${title}</span><span class="pm">${icon('plus', 18)}</span></summary><div class="pt-body">${body}</div></details>`;
  return `<div class="ptabs">${productInfo(p).map(sec).join('')}</div>`;
}

/* ---------------- FINALIZAR ENCOMENDA (/finalizar) ---------------- */
const co = (() => { const u = currentUser(), sl = slotOptions();
  return { deliver: store.get('daqui-deliver', 'pickup'), slot: sl[0].date, window: DISTRIBUTION.windows[0], point: PICKUP_POINTS[1], useSaved: !!(u && u.address), street: '', postal: '', town: '', saveAddr: true, name: '', phone: '', email: '', pay: 'mbway', notes: '', promo: '', useBalance: false, code: '', codeErr: '', stockErr: false }; })();
const coPromo = () => (co.promo ? PROMOS.find(p => p.id === co.promo) : null);
const coQuote = () => quote(cart.map(i => ({ id: i.id, qty: i.qty, price: i.price, opts: i.opts })), co.deliver, currentUser(), coPromo(), co.useBalance);
/* linhas do resumo de preços (checkout, subscrição e faturas) */
function priceLines(q, where) {
  const why = { min: T(`grátis a partir de ${money(SETTINGS.freeFrom)}`, `free over ${money(SETTINGS.freeFrom)}`), coop: T('grátis para membros da Cooperativa', 'free for Co-op members'), promo: T('promoção', 'promotion') }[q.ship.why];
  return `<div><dt>${T('Subtotal', 'Subtotal')}</dt><dd>${money(q.sub)}</dd></div>
    ${q.discount ? `<div class="disc"><dt>${T('Desconto', 'Discount')} (${esc(L(q.promo.title))})</dt><dd>-${money(q.discount)}</dd></div>` : ''}
    ${q.boxes.fee ? `<div><dt>${T('Caixas de cartão', 'Cardboard boxes')} <span class="small muted">(${cardboardText(q.boxes)})</span></dt><dd>${money(q.boxes.fee)}</dd></div>` : ''}
    <div><dt>${where === 'home' ? T('Entrega em casa', 'Home delivery') : T('Entrega no ponto de recolha', 'Delivery to the pick-up point')}${why ? ` <span class="small muted">(${why})</span>` : ''}</dt><dd>${q.ship.fee ? money(q.ship.fee) : T('Grátis', 'Free')}</dd></div>`;
}
function coSummary() {
  const q = coQuote();
  return `<h3>${T('Resumo', 'Summary')}</h3>
    <ul class="co-items">${cart.map(i => { const p = P(i.id); return `<li><span class="thumb">${artFor(p)}</span><span>${esc(L(p.name))}${i.opts.size ? ` (${sizeName(i.opts.size)})` : ''}${i.opts.bio ? ` (${T('biológico', 'organic')})` : ''}<br><span class="small muted">${fmtQty(i.qty, p)} × ${money(i.price)}${byKg(p) ? '/kg' : ''}</span></span><b>${money(round2(i.price * i.qty))}</b></li>`; }).join('')}</ul>
    <dl class="dl">${priceLines(q, co.deliver)}
      <div><dt>${T('Dia', 'Day')}</dt><dd>${slotLabel(co.slot)}</dd></div><div class="tot"><dt>Total</dt><dd>${money(q.total)}</dd></div>
      ${q.balanceUsed ? `<div class="disc"><dt>${T('Pago com o Saldo Daqui', 'Paid with your Daqui balance')}</dt><dd>-${money(q.balanceUsed)}</dd></div><div class="tot"><dt>${T('A pagar', 'To pay')}</dt><dd>${money(q.toPay)}</dd></div>` : ''}</dl>
    <p class="small muted">${T('As caixas de cartão Daqui (5 kg 0,85 €; 10 kg 1,00 €) são descontadas na encomenda seguinte quando as devolve.', 'Daqui cardboard boxes (5 kg €0.85; 10 kg €1.00) are refunded on your next order when you return them.')}</p>`;
}
PAGES.finalizar = () => {
  const u = currentUser(), num = QS.get('encomenda');
  if (num) {
    const o = findOrder(num);
    if (!o) return { title: T('Encomenda', 'Order'), html: `<div class="wrap page-head"><h1>${T('Encomenda não encontrada', 'Order not found')}</h1><a class="btn btn-green mt" href="${href('produtos')}">${T('Ver produtos', 'Browse the shop')}</a></div>` };
    return { title: `${T('Encomenda', 'Order')} ${o.num}`, html: `${crumbs([[T('Finalizar encomenda', 'Check out'), 'finalizar']])}
      <section class="wrap page-head confirm">
        <span class="big-check">${icon('check', 40)}</span>
        <h1>${T('Encomenda confirmada', 'Order confirmed')}</h1>
        <p class="lead">${T('O número da sua encomenda é', 'Your order number is')} <b class="ordnum">${o.num}</b>. ${T('Guarde-o para seguir ou alterar a encomenda.', 'Keep it to track or change your order.')}</p>
        <div class="panel mt">${trackHTML(o)}</div>
        <div class="row-btns mt"><a class="btn btn-green" href="${href('contacto', 'encomenda=' + o.num)}">${icon('route', 18)}${T('Seguir encomenda', 'Track order')}</a>${u ? `<a class="btn btn-line c-campo" href="${href('conta', 'sec=encomendas')}">${T('As minhas encomendas', 'My orders')}</a>` : ''}<a class="btn btn-line c-campo" href="${href('produtos')}">${T('Continuar a comprar', 'Keep shopping')}</a></div>
        <p class="note small mt">${icon('alert', 20)}<span>${NUVEM.on ? T('Demonstração: nenhum pagamento foi feito. A encomenda já está no painel da equipa Daqui.', 'Demo: no payment was taken. The order is already in the Daqui team panel.') : T('Demonstração: nenhum pagamento foi feito. A encomenda fica guardada neste navegador.', 'Demo: no payment was taken. The order is stored in this browser.')}</span></p>
      </section><div class="spacer"></div>` };
  }
  if (!cart.length) return { title: T('Finalizar encomenda', 'Check out'), html: `${crumbs([[T('Finalizar encomenda', 'Check out'), 'finalizar']])}<div class="wrap page-head"><h1>${T('O seu cabaz está vazio', 'Your basket is empty')}</h1><p class="lead">${T('Junte produtos ao cabaz para finalizar uma encomenda.', 'Add products to your basket to check out.')}</p><a class="btn btn-green mt" href="${href('produtos')}">${T('Ver produtos', 'Browse the shop')}</a></div><div class="spacer"></div>` };
  const slots = slotOptions(), sl = slots.find(x => x.date === co.slot) || slots[0];
  const saved = u && u.address, showFields = co.deliver === 'home' && !(saved && co.useSaved);
  const html = `${crumbs([[T('Finalizar encomenda', 'Check out'), 'finalizar']])}
  <div class="wrap page-head"><h1>${T('Finalizar encomenda', 'Check out')}</h1></div>
  <div class="wrap subflow">
    <form class="subform" id="coform" novalidate>
      <fieldset><legend><span class="n">1</span>${T('Como quer receber', 'How you want it')}</legend>
        <div class="radios"><label><input type="radio" name="co-deliver" value="pickup"${co.deliver === 'pickup' ? ' checked' : ''}>${T('Ponto de recolha', 'Pick-up point')} (+${feeText('pickup')})</label><label><input type="radio" name="co-deliver" value="home"${co.deliver === 'home' ? ' checked' : ''}>${T('Entrega em casa', 'Home delivery')} (+${feeText('home')})</label></div>
        <p class="small muted mt-s">${T(`Portes grátis em compras a partir de ${money(SETTINGS.freeFrom)} e para membros da Cooperativa.`, `Free delivery on orders over ${money(SETTINGS.freeFrom)} and for Co-op members.`)}</p></fieldset>
      <fieldset><legend><span class="n">2</span>${T('Dia de entrega', 'Delivery day')}</legend>
        <div class="slots">${slots.map(x => `<label class="slot"><input type="radio" name="co-slot" value="${x.date}"${x.date === sl.date ? ' checked' : ''}><span><b>${slotLabel(x)}</b><br><span class="small muted">${T('Encomende até', 'Order by')} ${fdate(x.cutoff, { weekday: 'long' })} ${T('às 18h', 'at 6 pm')}</span></span></label>`).join('')}</div>
        ${co.deliver === 'home' ? `<p class="lbl mt">${T('Janela horária', 'Time window')}</p><div class="radios">${DISTRIBUTION.windows.map(w => `<label><input type="radio" name="co-window" value="${w}"${co.window === w ? ' checked' : ''}>${w}</label>`).join('')}</div>`
          : `<div class="field mt-s"><label for="co-point">${T('Ponto de recolha', 'Collection point')}</label><select id="co-point" data-co="point">${PICKUP_POINTS.map(x => `<option${x === co.point ? ' selected' : ''}>${x}</option>`).join('')}</select><span class="small muted">${T('Horário de levantamento', 'Pick-up hours')}: ${DISTRIBUTION.days[sl.day].pickup}</span></div>`}</fieldset>
      ${co.deliver === 'home' ? `<fieldset><legend><span class="n">3</span>${T('Morada de entrega', 'Delivery address')}</legend>
        ${saved && co.useSaved ? `<div class="addr-card">${icon('pin', 20)}<div><b>${T('Morada guardada', 'Saved address')}</b><br>${esc(saved.street)}<br>${esc(saved.postal)} ${esc(saved.town)}</div><button type="button" class="link" data-co-newaddr>${T('Usar outra morada', 'Use another address')}</button></div>`
          : `<div class="field"><label for="co-street">${T('Rua, número e andar', 'Street, number and floor')}</label><input id="co-street" data-co="street" value="${esc(co.street)}" required autocomplete="street-address"></div>
             <div class="row"><div class="field"><label for="co-postal">${T('Código postal', 'Postcode')}</label><input id="co-postal" data-co="postal" value="${esc(co.postal)}" required placeholder="3810-000" autocomplete="postal-code"></div><div class="field"><label for="co-town">${T('Localidade', 'Town')}</label><input id="co-town" data-co="town" value="${esc(co.town)}" required></div></div>
             ${u ? `<label class="switch"><input type="checkbox" data-co-check="saveAddr"${co.saveAddr ? ' checked' : ''}>${saved ? T('Substituir a morada guardada na conta', 'Replace the address saved on my account') : T('Guardar esta morada na minha conta', 'Save this address to my account')}</label>` : ''}
             ${saved ? `<button type="button" class="link mt-s" data-co-usesaved>${T('Usar a morada guardada', 'Use my saved address')}</button>` : ''}`}
        <p class="small muted mt-s">${T('Entregamos nos concelhos de', 'We deliver in')} ${DISTRIBUTION.area.join(', ')}.</p></fieldset>` : ''}
      <fieldset><legend><span class="n">${co.deliver === 'home' ? 4 : 3}</span>${T('Os seus dados', 'Your details')}</legend>
        ${u ? `<p>${T('Encomenda em nome de', 'Order in the name of')} <b>${esc(u.name)}</b> (${esc(u.phone)}). ${T('Fica no seu histórico de encomendas.', 'It goes into your order history.')}</p>`
          : `<div class="row"><div class="field"><label for="co-name">${T('Nome', 'Name')}</label><input id="co-name" data-co="name" value="${esc(co.name)}" required autocomplete="name"></div><div class="field"><label for="co-phone">${T('Telemóvel', 'Mobile')}</label><input id="co-phone" data-co="phone" type="tel" value="${esc(co.phone)}" required autocomplete="tel"></div></div>
             <div class="field"><label for="co-email">${T('E-mail (opcional)', 'Email (optional)')}</label><input id="co-email" data-co="email" type="email" value="${esc(co.email)}" autocomplete="email"></div>
             <p class="small muted">${T('Tem conta?', 'Have an account?')} <a class="link" href="${href('entrar', 'next=finalizar')}">${T('Entre para guardar a encomenda no seu histórico', 'Sign in to keep this order in your history')}</a>.</p>`}</fieldset>
      ${cart.some(i => P(i.id) && P(i.id).cat === 'caixas') ? `<div class="mt-s">${prefsSummary(u)}</div>` : ''}
      <fieldset><legend><span class="n">${co.deliver === 'home' ? 5 : 4}</span>${T('Pagamento', 'Payment')}</legend>
        ${coPayBlock(u)}
        <div class="field mt"><label for="co-notes">${T('Notas para a entrega (opcional)', 'Delivery notes (optional)')}</label><textarea id="co-notes" data-co="notes" rows="2">${esc(co.notes)}</textarea></div></fieldset>
      ${(probs => `<p class="err"${probs.length ? '' : ' hidden'}>${stockErrHTML(probs)}</p>`)(cartStockProblems())}
    </form>
    <aside class="subsum panel" aria-live="polite"><div id="cosum">${coSummary()}</div>
      <button class="btn btn-green btn-block mt" data-co-confirm>${T('Confirmar encomenda', 'Place order')}</button>
      <p class="small muted mt-s ta-c">${T('Demonstração: não é feito nenhum pagamento.', 'Demo: no payment is taken.')}</p></aside>
  </div><div class="spacer"></div>`;
  return { title: T('Finalizar encomenda', 'Check out'), html };
};
/* promoção, Saldo Daqui e método de pagamento (o resto, se o saldo não chegar) */
function coPayBlock(u) {
  const q = coQuote(), bal = u ? balanceOf(u) : 0, promos = u ? usablePromos(u) : [];
  const promoBox = !u ? `<p class="small muted">${T('Entre na sua conta para usar promoções e o Saldo Daqui.', 'Sign in to use promotions and your Daqui balance.')}</p>`
    : `<div class="field"><label for="co-promo">${T('Promoção', 'Promotion')}</label><select id="co-promo" data-co-promo><option value="">${T('Sem promoção', 'No promotion')}</option>${promos.map(p => `<option value="${p.id}"${co.promo === p.id ? ' selected' : ''}${cartTotals().sub < (p.min || 0) ? ' disabled' : ''}>${esc(L(p.title))} (${promoLabel(p)}${p.min ? `, ${T('mín.', 'min.')} ${money(p.min)}` : ''}; ${T('até', 'until')} ${fdate(parseISO(p.until))})</option>`).join('')}</select></div>
       <div class="code-row"><label class="sr" for="co-code">${T('Código promocional', 'Promo code')}</label><input id="co-code" data-co-code placeholder="${T('Código promocional', 'Promo code')}" value="${esc(co.code)}" autocomplete="off"><button type="button" class="btn btn-line c-campo" data-co-apply>${T('Aplicar', 'Apply')}</button></div>
       ${co.codeErr ? `<p class="err small">${esc(co.codeErr)}</p>` : ''}`;
  const balBox = u && bal > 0 ? `<label class="switch mt-s"><input type="checkbox" data-co-check="useBalance"${co.useBalance ? ' checked' : ''}>${T(`Descontar do Saldo Daqui (disponível: ${money(bal)})`, `Use my Daqui balance (available: ${money(bal)})`)}</label>` : '';
  const rest = !co.useBalance || q.toPay > 0;
  return `${promoBox}${balBox}
    ${rest ? `<p class="lbl mt">${co.useBalance && q.balanceUsed ? T(`Pagar o resto (${money(q.toPay)}) com`, `Pay the rest (${money(q.toPay)}) with`) : T('Pagar com', 'Pay with')}</p>
      <div class="radios">${[['mbway', 'MB WAY'], ['mb', T('Referência Multibanco', 'Multibanco reference')], ['cartao', T('Cartão', 'Card')], ['entrega', T('Na entrega', 'On delivery')]].map(([v, n]) => `<label><input type="radio" name="co-pay" value="${v}"${co.pay === v ? ' checked' : ''}>${n}</label>`).join('')}</div>`
      : `<p class="note small mt-s">${icon('check', 18)}<span>${T('O Saldo Daqui paga a encomenda toda.', 'Your Daqui balance covers the whole order.')}</span></p>`}`;
}
function coRerender(sel) { const y = scrollY; render(); scrollTo(0, y); if (sel) $(sel)?.focus(); }
PAGE_EVENTS.change.push((e, t) => {
  if (PAGE !== 'finalizar') return;
  if (t.name === 'co-deliver') { co.deliver = t.value; deliver = t.value; saveCart(); coRerender(`input[name="co-deliver"][value="${t.value}"]`); }
  if (t.name === 'co-slot') { co.slot = t.value; coRerender(`input[name="co-slot"][value="${t.value}"]`); }
  if (t.name === 'co-window') co.window = t.value;
  if (t.name === 'co-pay') co.pay = t.value;
  if (t.dataset.co === 'point') co.point = t.value;
  if (t.dataset.coCheck) { co[t.dataset.coCheck] = t.checked; if (t.dataset.coCheck === 'useBalance') coRerender('[data-co-check="useBalance"]'); }
  if ('coPromo' in t.dataset) { co.promo = t.value; coRerender('#co-promo'); }
});
PAGE_EVENTS.input.push((e, t) => { if (PAGE === 'finalizar' && t.dataset.co && t.dataset.co !== 'point') co[t.dataset.co] = t.value; });
PAGE_EVENTS.click.push((e, t, d) => {
  if (PAGE !== 'finalizar') return;
  if ('coNewaddr' in d) { co.useSaved = false; coRerender('#co-street'); return true; }
  if ('coUsesaved' in d) { co.useSaved = true; coRerender('[data-co-newaddr]'); return true; }
  if ('coApply' in d) {
    const code = ($('#co-code')?.value || '').trim(); co.code = code; co.codeErr = '';
    if (!code) return true;
    claimPromo(null, code).then(pid => { co.promo = pid; co.code = ''; toast(T('Código aplicado', 'Code applied')); coRerender('#co-promo'); }, e => { co.codeErr = e.message; coRerender('#co-code'); });
    return true;
  }
  if (d.coFix) { const [key, left] = d.coFix.split('::'); const i = cart.find(x => x.key === key); if (i) { if (+left > 0) i.qty = +left; else cart.splice(cart.indexOf(i), 1); saveCart(); refreshCartUI(); } coRerender(); return true; }
  if ('coConfirm' in d) {
    const f = $('#coform'), err = $('.err', f), u = currentUser();
    if (!validate(f)) return true;
    const bad = [];
    if (co.deliver === 'home' && $('#co-postal') && !/^\d{4}-\d{3}$/.test(co.postal.trim())) bad.push(['#co-postal', T('O código postal deve ter o formato 3810-000.', 'The postcode must look like 3810-000.')]);
    if (!u && !/^[29]\d{8}$/.test(normPhone(co.phone))) bad.push(['#co-phone', T('Indique um telemóvel português com 9 dígitos.', 'Enter a 9-digit Portuguese mobile number.')]);
    if (bad.length) { err.hidden = false; err.textContent = bad.map(b => b[1]).join(' '); $(bad[0][0]).setAttribute('aria-invalid', 'true'); $(bad[0][0]).focus(); return true; }
    const probs = cartStockProblems();
    if (probs.length) { coStockError(probs); return true; }
    const sl = slotOptions().find(x => x.date === co.slot) || slotOptions()[0], q = coQuote();
    const addr = co.deliver !== 'home' ? '' : (u && u.address && co.useSaved) ? `${u.address.street}, ${u.address.postal} ${u.address.town}` : `${co.street.trim()}, ${co.postal.trim()} ${co.town.trim()}`;
    if (u && co.deliver === 'home' && !(u.address && co.useSaved) && co.saveAddr) { u.address = { street: co.street.trim(), postal: co.postal.trim(), town: co.town.trim() }; saveUsers(); }
    const o = { num: newOrderNumber(), user: u ? u.username : null, name: u ? u.name : co.name.trim(), phone: u ? u.phone : normPhone(co.phone), email: co.email.trim(), created: nowISO(), slot: sl.date, day: sl.day, deliver: co.deliver,
      window: co.deliver === 'home' ? co.window : '', point: co.deliver === 'pickup' ? co.point : '', address: addr, items: cart.map(i => Object.assign({ id: i.id, qty: i.qty, price: i.price, size: i.opts.size || '' }, i.opts.bio ? { bio: true } : {})),
      subtotal: q.sub, fee: q.ship.fee, total: q.total, pay: q.toPay > 0 ? co.pay : 'saldo', notes: co.notes.trim(), status: 'ativa' };
    if (q.boxes.fee) o.boxesFee = q.boxes.fee; if (q.discount || q.promo) { o.discount = q.discount; o.promo = q.promo.id; } if (q.balanceUsed) o.balance = q.balanceUsed;
    if (u && o.items.some(i => P(i.id) && P(i.id).cat === 'caixas')) o.prefs = { exclude: (u.exclude || []).slice(), favs: (u.favs || []).slice() };   // a gestão vê as preferências do cliente
    const btn = $('[data-co-confirm]'); if (btn) btn.disabled = true;
    placeOrder(o).then(() => { cart = []; saveCart(); store.set('daqui-last-order', o.num); co.promo = ''; co.useBalance = false; go('finalizar', 'encomenda=' + o.num); },
      e => { if (btn) btn.disabled = false; if (e.stock) { const p = P(e.stock.product); coStockError([{ p, want: inCart(p.id), left: e.stock.left }]); }
        else { err.hidden = false; err.textContent = /saldo/.test(e.message) ? T('O Saldo Daqui não chega para esta encomenda.', 'Your Daqui balance is not enough for this order.') : T('Não foi possível registar a encomenda: ', 'Could not place the order: ') + e.message; } });
    return true;
  }
});

/* stock insuficiente: diz quanto resta e deixa ajustar o cabaz */
function coStockError(probs) {
  const err = $('#coform .err'); if (!err) return;
  err.hidden = false; err.innerHTML = stockErrHTML(probs);
  err.scrollIntoView({ block: 'center' });
}
const stockErrHTML = probs => probs.map(x => `${esc(L(x.p.name))}: ${x.left > 0 ? T(`só restam ${stockText(x.p, x.left)}`, `only ${stockText(x.p, x.left)} left`) : T('esgotou', 'sold out')}. <button type="button" class="link" data-co-fix="${esc((cart.find(i => i.id === x.p.id) || {}).key || '')}::${x.left}">${x.left > 0 ? T('Ajustar o cabaz', 'Adjust basket') : T('Tirar do cabaz', 'Remove from basket')}</button>`).join('<br>');
/* gravar a encomenda: com base de dados, o Supabase confirma stock, saldo e promoção de uma só vez (trigger daqui_encomenda_stock) */
async function placeOrder(o) {
  const u = currentUser();
  if (NUVEM.on) {
    try { await NUVEM.placeOrder(o); }
    catch (e) { const st = NUVEM.stockError(e); if (st) { NUVEM.reloadGroups(['lots'], 0); throw Object.assign(new Error('stock'), { stock: st }); } throw e; }
    ORDERS.push(o);
    if (o.balance && u) WALLET.push({ id: 'tmp' + o.num, user: u._id, kind: 'compra', desc: 'Encomenda ' + o.num, value: o.total, balance: -o.balance, method: 'saldo', ref: o.num, at: nowISO() });
    if (o.promo && u) { const c = claimOf(u, o.promo); if (c) c.used = nowISO(); }
    o.items.forEach(i => { const p = P(i.id); if (tracksStock(p)) { let left = i.qty; lotsOf(p.id).sort((a, b) => a.harvest.localeCompare(b.harvest)).forEach(l => { const t = Math.min(left, lotLeft(l)); l.sold = round2((l.sold || 0) + t); left -= t; }); } });
    return;
  }
  o.lots = takeStockLocal(o.items);
  if (o.balance && u) { if (balanceOf(u) < o.balance) { giveBackLocal(o.lots); throw new Error('saldo'); } addMovLocal(u, { kind: 'compra', desc: 'Encomenda ' + o.num, value: o.total, balance: -o.balance, method: 'saldo', ref: o.num }); }
  if (o.promo && u) { const c = claimOf(u, o.promo); if (c) { c.used = nowISO(); c.order = o.num; store.set(CLAIMS_KEY, CLAIMS); } }
  ORDERS.push(o); saveOrders();
  if (u) pushNotifLocal(u.username, T(`Encomenda ${o.num} recebida`, `Order ${o.num} received`), T(`Entrega: ${fdate(parseISO(o.slot), { weekday: 'long' })}.`, `Delivery: ${fdate(parseISO(o.slot), { weekday: 'long' })}.`), 'conta?sec=encomendas');
}
/* depois de adicionar ao cabaz na página de produto: seguir para o checkout ou continuar a comprar */
function addedModal(p, qty, bio) {
  const t = cartTotals(), n = itemCount(cart);
  const sz = p.cat === 'caixas' ? BOX_SIZES[p.id].find(s => s.s === pd.size) : null;
  openModal(`<div class="mbody added">
    <h2>${icon('check', 26)}${T('Adicionado ao cabaz', 'Added to your basket')}</h2>
    <div class="added-item"><span class="thumb">${artFor(p)}</span><div><b>${esc(L(p.name))}</b>${sz ? ` (${sizeName(sz.s)}, ${sz.kg} kg)` : ''}${!sz && bio ? ` (${T('biológico', 'organic')})` : ''}<br><span class="muted">${fmtQty(qty, p)} × ${money(sz ? sz.price : variantPrice(p, bio))}${sz ? '' : unitLabel(p.unit)}</span></div></div>
    <p class="muted">${T(`O cabaz tem ${n} ${n === 1 ? 'artigo' : 'artigos'}, subtotal ${money(t.sub)}. Próxima entrega: ${slotLabel(slotOptions()[0])}.`, `Your basket has ${n} ${n === 1 ? 'item' : 'items'}, subtotal ${money(t.sub)}. Next delivery: ${slotLabel(slotOptions()[0])}.`)}</p>
    <div class="row-btns"><a class="btn btn-green" href="${href('finalizar')}">${T('Finalizar encomenda', 'Check out')}</a><button class="btn btn-line c-campo" data-modal-close>${T('Continuar a comprar', 'Keep shopping')}</button><button class="link" data-cart-open-from-modal>${T('Ver cabaz', 'View basket')}</button></div>
  </div>`, T('Adicionado ao cabaz', 'Added to your basket'));
}
PAGE_EVENTS.click.push((e, t, d) => { if ('cartOpenFromModal' in d) { closeModal(); openCart(); return true; } });
