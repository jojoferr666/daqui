/* ===== Daqui — núcleo do site: idioma, ligações, cabeçalho/rodapé, cabaz, janelas =====
   Textos: cada texto aparece como T('português', 'english').
   As páginas estão em js/pages.js. Dados em js/data.js. Contas em js/auth.js. */
const LOGO_GOLD = (document.body.dataset.root || './') + 'img/logo-dourado.png';
let lang = store.get('daqui-lang', 'pt') === 'en' ? 'en' : 'pt';
const T = (pt, en) => (lang === 'en' ? en : pt);
const L = o => (o ? (o[lang] ?? o.pt) : '');
const PHONE = '234 000 000';
/* frases que mudam conforme o site está ligado à base de dados (js/nuvem.js) ou guarda tudo no navegador */
const REQ_NOTE = () => NUVEM.on ? T('O pedido já está no painel da equipa Daqui.', 'The request is already in the Daqui team panel.') : T('Demonstração: o pedido fica visível no painel da conta de gestão, neste navegador.', 'Demo: the request shows up in the management account panel, in this browser.');
const EMAIL = 'ola@daqui.pt';

/* ---------- páginas e ligações (/produtos em vez de #produtos) ---------- */
let QS = new URLSearchParams(location.search);   // let: a app (js/app-movel.js) muda-o em cada ecrã
/* produtos e agricultores criados na gestão não têm pasta própria: abrem como /produtos?id=… e /agricultores?id=… */
const PAGE_DOC = document.body.dataset.page || 'inicio';
let PAGE = PAGE_DOC === 'produtos' && QS.get('id') ? 'produto' : PAGE_DOC === 'agricultores' && QS.get('id') ? 'agricultor' : PAGE_DOC === 'subscricao' && QS.get('caixa') ? 'subscrever' : PAGE_DOC;
let PID = document.body.dataset.id || QS.get('id') || QS.get('caixa') || '';
const R = document.body.dataset.root || './';
const FILE = location.protocol === 'file:';
/* as caixas criadas na gestão não têm pasta própria em /subscricao: abrem como /subscricao?caixa=… */
const STATIC_BOXES = BOXES.map(b => b.id);
function href(path = '', query = '') {
  const sb = /^subscricao\/(.+)$/.exec(path);
  if (sb && !STATIC_BOXES.includes(sb[1])) { query = 'caixa=' + encodeURIComponent(sb[1]) + (query ? '&' + query : ''); path = 'subscricao'; }
  const base = path ? R + path + (FILE ? '/index.html' : '') : (FILE ? R + 'index.html' : R);
  return base + (query ? '?' + query : '');
}
/* com base de dados, espera que as gravações pendentes terminem antes de mudar de página */
const go = (path, query) => { const nav = () => { location.href = href(path, query); }; if (NUVEM.on) NUVEM.flush().then(nav, nav); else nav(); };
const productHref = p => p.isNew ? href('produtos', 'id=' + p.id) : href('produtos/' + p.id);
const farmerHref = f => f.isNew ? href('agricultores', 'id=' + f.id) : href('agricultores/' + f.id);

/* ---------- formatação ---------- */
const money = v => new Intl.NumberFormat(lang === 'en' ? 'en-GB' : 'pt-PT', { style: 'currency', currency: 'EUR' }).format(v);
const monthName = (m, form = 'long') => new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'pt-PT', { month: form }).format(new Date(2026, m - 1, 15)).replace('.', '');
function fdate(d, o) {
  d = typeof d === 'string' ? (d.includes('T') ? new Date(d) : parseISO(d)) : d; const loc = lang === 'en' ? 'en-GB' : 'pt-PT';
  if (!o) return `${d.getDate()} ${new Intl.DateTimeFormat(loc, { month: 'short' }).format(d).replace('.', '')}`;
  return new Intl.DateTimeFormat(loc, o).format(d).replace('.', '');
}
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const norm = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
/* produtos juntados (repetidos) continuam a abrir pelo id antigo: p.aliases */
const P = id => PRODUCTS.find(p => p.id === id) || PRODUCTS.find(p => (p.aliases || []).includes(id));
const JTH = () => T('Colhe Connosco', 'Join the Harvest');
const F = id => FARMERS.find(f => f.id === id);
const unitLabel = u => ({ kg: '/kg', un: T('/unidade', '/each'), cx: T('/caixa', '/box'), molho: T('/molho', '/bunch'), cuv: T('/cuvete', '/punnet') }[u] || '');
const regionName = r => L(REGIONS[r]);
const freqName = f => ({ sem: T('Semanal', 'Weekly'), quinz: T('Quinzenal', 'Every 2 weeks'), mens: T('Mensal', 'Monthly') }[f]);
const sizeName = s => ({ P: T('Pequena', 'Small'), M: T('Média', 'Medium'), G: T('Grande', 'Large'), XG: T('Extra grande', 'Extra large'), F: T('Família', 'Family') }[s] || s);
const dayName = d => ({ qui: T('Quinta-feira', 'Thursday'), sab: T('Sábado', 'Saturday') }[d]);
const catName = c => ({ fruta: T('Fruta', 'Fruit'), legumes: T('Legumes', 'Vegetables'), caixas: T('Caixas da Estação', 'Seasonal boxes') }[c]);

/* ---------- época, colheita e divisão do preço ---------- */
const NOW_M = today().getMonth() + 1;
const available = p => inSeason(p) && !p.outOfStock && !noProducer(p) && !(typeof LOTS !== 'undefined' && tracksStock(p) && stockOf(p) <= 0);
/* produto sem nenhum agricultor que o forneça (todos deixaram de o vender): fica sem stock */
const soldOut = p => !!p && (p.outOfStock || noProducer(p) || (typeof LOTS !== 'undefined' && tracksStock(p) && stockOf(p) <= 0));   // esgotado, sem produtor ou sem stock nas entregas
const noProducer = p => !!p && p.cat !== 'caixas' && !offersOf(p).length;
function inSeason(p) { if (!p.season) return true; const [a, b] = p.season; return a <= b ? NOW_M >= a && NOW_M <= b : NOW_M >= a || NOW_M <= b; }
function harvestOf(p) {
  /* com o inventário (js/dados.js): a colheita mais recente entregue pelos agricultores */
  if (typeof LOTS !== 'undefined' && p.cat !== 'caixas' && LOTS.length) { const lh = latestHarvest(p.id); if (lh) return lh; }
  if (p.harvest == null || !inSeason(p)) return null;
  if (typeof p.harvest === 'number') return addDays(today(), -p.harvest);
  const [m, d] = p.harvest.split('-').map(Number); let h = new Date(today().getFullYear(), m - 1, d, 12);
  if (h > today()) h = new Date(today().getFullYear() - 1, m - 1, d, 12); return h;
}
const isStored = p => {
  if (typeof LOTS !== 'undefined' && LOTS.length && p.cat !== 'caixas') { const ls = lotsOf(p.id); if (ls.length) { const last = ls.slice().sort((a, b) => a.harvest.localeCompare(b.harvest)).pop(); return !!last.cold; } }
  const h = harvestOf(p); return !!h && typeof p.harvest === 'string' && (today() - h) / 864e5 > 20; };
function splitOf(p) {
  if (Array.isArray(p.split) && p.split.length === 3) return p.split;
  if (p.cat === 'caixas') return { 'caixa-mista': [57, 15, 28], 'caixa-essencial': [56, 19, 25], 'caixa-fruta': [56, 18, 26], 'caixa-legumes': [59, 11, 30] }[p.id] || [57, 16, 27];
  if (p.farmer && F(p.farmer) && F(p.farmer).island) return [52, 18, 30];
  return isStored(p) ? [54, 22, 24] : [60, 10, 30];
}
/* ---------- produtores e modo de produção ----------
   p.producers = [{ farmer, organic, outOfStock }]: o mesmo produto pode vir de vários agricultores (só informativo;
   o cliente não escolhe o agricultor). Sem p.producers, há um só produtor: p.farmer (biológico se p.organic).
   p.price é o preço do convencional quando há convencional; num produto só biológico é o preço do biológico.
   O biológico custa mais 20% do que o convencional (BIO_EXTRA). */
const BIO_EXTRA = 0.2;
const round2 = v => { const n = +v; return Number.isFinite(n) ? Math.round(+(n.toFixed(10) + 'e2')) / 100 : 0; };   // 1,89 × 2,5 = 4,73 (e não 4,72)
function offersOf(p) {
  if (!p || p.cat === 'caixas') return [];
  return Array.isArray(p.producers) && p.producers.length ? p.producers : p.farmer ? [{ farmer: p.farmer, organic: !!p.organic, outOfStock: !!p.outOfStock }] : [];
}
const hasConv = p => offersOf(p).some(o => !o.organic);
const hasBio = p => offersOf(p).some(o => o.organic);
const offerOn = (p, bio) => !p.outOfStock && offersOf(p).some(o => !!o.organic === !!bio && !o.outOfStock);
const defaultBio = p => !hasConv(p) || (!offerOn(p, false) && offerOn(p, true));
function variantPrice(p, bio) {
  if (!p || p.cat === 'caixas') return p ? p.price : 0;
  return hasConv(p) ? (bio ? round2(p.price * (1 + BIO_EXTRA)) : p.price) : (bio ? p.price : round2(p.price / (1 + BIO_EXTRA)));
}
const shownPrice = p => (p.cat === 'caixas' ? p.price : variantPrice(p, defaultBio(p)));
/* produtos de um agricultor (como produtor principal ou como mais um produtor) */
const producedBy = (p, fid) => offersOf(p).some(o => o.farmer === fid);
const ofFarmer = fid => PRODUCTS.filter(p => p.cat !== 'caixas' && producedBy(p, fid));
/* nome sem "biológico", para encontrar produtos repetidos (ex.: "Cenoura" e "Cenoura biológica") */
const baseName = s => norm(s).replace(/\b(biologic[oa]s?|bio|organic[oa]?s?)\b/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim();
/* quantidades: os produtos ao quilo vendem-se de meio em meio quilo (ex.: 2,5 kg) */
const KG_STEP = 0.5;
const byKg = p => !!p && p.unit === 'kg' && p.cat !== 'caixas';
const qtyStep = p => (byKg(p) ? KG_STEP : 1);
const numFmt = v => new Intl.NumberFormat(lang === 'en' ? 'en-GB' : 'pt-PT', { maximumFractionDigits: 2 }).format(v);
const fmtQty = (q, p) => (byKg(p) ? `${numFmt(q)} kg` : numFmt(q));
const itemCount = items => (items || []).reduce((n, i) => n + (byKg(P(i.id)) ? 1 : +i.qty || 0), 0);
/* uma linha de encomenda: "2,5 kg × Pera Rocha (biológico)" */
function itemText(i) { const p = P(i.id); return `${fmtQty(i.qty, p)} × ${esc(p ? L(p.name) : i.id)}${i.size ? ` (${sizeName(i.size)})` : ''}${i.bio ? ` (${T('biológico', 'organic')})` : ''}`; }
const bioName = bio => (bio ? T('Biológico', 'Organic') : T('Convencional', 'Conventional'));
/* "Produzido por": um nome por agricultor (com convencional e/ou biológico quando o produto tem os dois) */
const farmersOf = p => offersOf(p).map(o => o.farmer).filter((x, i, a) => F(x) && a.indexOf(x) === i);
function producersLine(p) {
  const both = hasBio(p) && hasConv(p);
  return farmersOf(p).map(fid => { const f = F(fid), kinds = offersOf(p).filter(o => o.farmer === fid).map(o => bioName(o.organic).toLowerCase());
    return `<a href="${farmerHref(f)}">${esc(f.name)}</a> <span class="small muted">(${esc(f.place)}${both ? ': ' + kinds.join(T(' e ', ' and ')) : ''})</span>`; }).join(', ');
}
/* ---------- Colhe Connosco: cada dia tem um id (pode haver vários dias na mesma data, em quintas diferentes) ----------
   As inscrições guardam o id do dia (day) e a data (date); inscrições antigas só com a data apontam para o primeiro dia dessa data. */
const dayIdOf = d => d.id || `${d.date}-${d.farmer}`;
const HD = id => HARVEST_DAYS.find(d => d.id === id);
const hDay = h => (h.day ? HD(h.day) : HARVEST_DAYS.find(d => d.date === h.date)) || null;
const hIs = (h, d) => (h.day ? h.day === d.id : (hDay(h) || {}).id === d.id);
const newDayId = (date, farmer) => { let id = `${date}-${farmer}`, n = 2; while (HD(id)) id = `${date}-${farmer}-${n++}`; return id; };
/* ---------- Colhe Connosco: início e fim de cada dia (a partir do horário "9h30–12h30") ----------
   Avaliações: abrem no início do dia e fecham 48 horas depois do fim. */
function harvestWindow(d) {
  const m = String(d.time || '').match(/(\d{1,2})h(\d{2})?\D+(\d{1,2})h(\d{2})?/), base = parseISO(d.date);
  const at = (h, mi) => { const x = new Date(base); x.setHours(+h, +(mi || 0), 0, 0); return x; };
  const start = m ? at(m[1], m[2]) : at(0, 0), end = m ? at(m[3], m[4]) : at(23, 59);
  return { start, end, close: new Date(end.getTime() + 48 * 3600e3) };
}
/* horário livre: "09:30" e "12:30" → "9h30–12h30"; e ao contrário, para preencher o formulário de edição */
const hhmm = v => { const [h, m] = v.split(':'); return +h + 'h' + (m === '00' ? '' : m); };
const timeText = (a, b) => hhmm(a) + '–' + hhmm(b);
function timeParts(t) {
  const m = String(t || '').match(/(\d{1,2})h(\d{2})?\D+(\d{1,2})h(\d{2})?/), p = (h, mi) => String(h).padStart(2, '0') + ':' + (mi || '00');
  return m ? [p(m[1], m[2]), p(m[3], m[4])] : ['10:00', '13:00'];
}
/* campos "Início" e "Fim" (hora livre) usados nos formulários do Colhe Connosco */
const timeFields = (pre, t) => { const [a, b] = t ? timeParts(t) : ['10:00', '13:00'];
  return `<div class="field"><label for="${pre}-ini">${T('Início', 'Start')}</label><input id="${pre}-ini" type="time" value="${a}" required></div><div class="field"><label for="${pre}-fim">${T('Fim', 'End')}</label><input id="${pre}-fim" type="time" value="${b}" required></div>`; };
const timeBad = pre => $(`#${pre}-fim`).value <= $(`#${pre}-ini`).value ? T('A hora de fim tem de ser depois da hora de início.', 'The end time must be after the start time.') : '';
const harvestStarted = d => new Date() >= harvestWindow(d).start;
const harvestPast = d => new Date() >= harvestWindow(d).end;
const harvestRateOpen = d => { const w = harvestWindow(d), n = new Date(); return n >= w.start && n <= w.close; };
/* produto de um dia Colhe Connosco (pelo nome) e registos de colheita de um cliente (identificador CC-aammdd-nnnn; aparecem nas encomendas) */
const dayProduct = d => P(d.product) || PRODUCTS.find(p => p.cat !== 'caixas' && p.name.pt === (d.what || {}).pt) || null;
function recId(h, d, un) { if (h.record && h.record.id) return h.record.id; let n = 0; for (const c of String(un) + d.id) n = (n * 31 + c.charCodeAt(0)) % 9000; return `CC-${d.date.slice(2).replace(/-/g, '')}-${1000 + n}`; }
const recText = (rec, d) => [rec.kg != null ? `${numFmt(rec.kg)} kg ${T('de', 'of')} ${esc(L(d.what))}` : '', rec.price != null ? `${money(rec.price)} ${T('pagos', 'paid')}` : '', rec.note ? esc(rec.note) : ''].filter(Boolean).join(' · ');
function harvestRecords(u) { return (u.harvests || []).filter(h => h.record).map(h => ({ h, d: hDay(h), rec: h.record })).filter(x => x.d).sort((a, b) => String(b.rec.at || b.d.date).localeCompare(String(a.rec.at || a.d.date))); }
/* texto do IVA, junto a cada divisão do preço */
const VAT_NOTE = () => T('A divisão é feita sobre o valor sem IVA. Os preços mostrados já incluem IVA (6%).', 'The split is of the price before VAT. The prices shown already include VAT (6%).');
/* avaliações de um dia Colhe Connosco, para mostrar em público: primeiro nome, estrelas, comentário e resposta da Daqui.
   Com base de dados, quem não é da gestão recebe-as já resumidas (função colhe_avaliacoes, sem dados pessoais). */
const firstName = s => String(s || '').trim().split(/\s+/)[0] || '';
function harvestReviews(id) {
  if (NUVEM.on && !NUVEM.isAdmin()) return ((NUVEM.harvestReviews || {})[id] || []).slice();
  const d = HD(id); if (!d) return [];
  return Object.values(USERS).flatMap(u => (u.harvests || []).filter(h => hIs(h, d) && h.rating).map(h => ({ user: u.username, name: firstName(u.name), rating: +h.rating, comment: h.comment || '', reply: h.reply ? h.reply.text : '', at: h.ratedAt || '' })))
    .sort((a, b) => String(b.at).localeCompare(String(a.at)));
}
const stars = n => `<span class="stars" role="img" aria-label="${n} ${T('de 5 estrelas', 'out of 5 stars')}">${[1, 2, 3, 4, 5].map(i => `<i class="${i <= n ? 'on' : ''}">★</i>`).join('')}</span>`;
/* resumo de um dia: participantes, avaliações (sem nomes) e quilos registados */
function harvestSummary(id) {
  if (NUVEM.on && !NUVEM.isAdmin() && NUVEM.farmerHarvest && NUVEM.farmerHarvest[id]) return NUVEM.farmerHarvest[id];
  const d = HD(id); if (!d) return { people: 0, n: 0, avg: 0, comments: [], kg: 0 };
  const rows = Object.values(USERS).flatMap(u => (u.harvests || []).filter(h => hIs(h, d)).map(h => Object.assign({ user: u }, h)));
  const rated = rows.filter(h => h.rating);
  return { people: rows.reduce((n, h) => n + (+h.people || 1), 0), n: rated.length, avg: rated.length ? rated.reduce((a, h) => a + +h.rating, 0) / rated.length : 0,
    comments: rated.map(h => ({ rating: +h.rating, comment: h.comment || '' })), kg: round2(rows.reduce((a, h) => a + (h.record && +h.record.kg || 0), 0)) };
}
const seasonText = p => { const [a, b] = p.season; return a === 1 && b === 12 ? T('Todo o ano', 'All year round') : `${monthName(a, 'short')}–${monthName(b, 'short')}`; };

/* ---------- componentes ---------- */
function otag(p, big = false) {
  if (p.cat === 'caixas') return `<span class="otag${big ? ' big' : ''}"><b>${T('Vários agricultores', 'Several farmers')}</b><span>${T('Composição muda todas as semanas', 'The selection changes every week')}</span></span>`;
  const f = F(p.farmer) || F((offersOf(p)[0] || {}).farmer), h = harvestOf(p), more = offersOf(p).filter(o => o.farmer !== (f && f.id)).map(o => o.farmer).filter((x, i, a) => a.indexOf(x) === i).length;
  if (!f) return '';
  const line = h ? `${T('Colheita mais recente', 'Latest harvest')}: ${fdate(h)}${isStored(p) ? T(', conservação em frio', ', cold-stored') : ''}` : `${T('Fora de época, volta em', 'Out of season, back in')} ${monthName(p.season[0])}`;
  return `<span class="otag${big ? ' big' : ''}${h ? '' : ' off'}"><b>${esc(f.name)}, ${esc(f.place)}${more ? ` ${T(`e mais ${more}`, `and ${more} more`)}` : ''}</b><span>${line}</span></span>`;
}
/* foto de capa do agricultor: um dos desenhos ("art:<cultura>:<semente>") ou uma fotografia enviada; sem capa, o desenho da quinta */
const COVER_ART = [['pera', 0], ['macaGala', 1], ['alface', 2], ['laranja', 12], ['uvaBranca', 11], ['cereja', 9], ['castanha', 13], ['mirtilo', 6], ['banana', 14], ['abobora', 7]];
function farmPic(f, cls = '') {
  const c = f && f.cover;
  if (c && /^art:/.test(c)) { const [, crop, seed] = c.split(':'); return farmSVG(+seed || 0, crop, cls); }
  if (c) return `<img class="cover-img ${cls}" src="${esc(c)}" alt="" loading="lazy" decoding="async">`;
  return farmSVG((f && f.seed) || 0, (f && f.crop) || 'pera', cls);
}
/* ícone de cada produto: ficheiro img/produtos/<id>.svg (pode ser editado ou substituído) */
function artFor(p, cls = '') { if (p.custom && !p.icon && !p.photo) return crateSVG(p.items || [], 'picon crate ' + cls); return p.photo ? `<img class="picon photo ${cls}" src="${esc(p.photo)}" alt="" loading="lazy" decoding="async">` : `<img class="picon ${cls}" src="${R}img/produtos/${p.icon || p.id}.svg" alt="" loading="lazy" decoding="async">`; }
/* desenhos que existem em img/produtos (um por produto) para escolher a imagem de um produto novo */
/* desenho de uma caixa: as 4 caixas da Daqui têm o seu; as criadas na gestão mostram os produtos escolhidos */
const boxArt = (p, cls = '') => p.custom ? crateSVG(p.items || [], cls) : crateSVG(p.box || 'mista', cls);
/* ícones que existem em img/produtos: os dos produtos, os de img/produtos/lista.json e (no GitHub Pages) todos os .svg da pasta no GitHub.
   Assim, um ícone novo posto na pasta aparece logo para escolher. */
let ICON_FILES = [];
const iconLabel = f => (f.charAt(0).toUpperCase() + f.slice(1)).replace(/-/g, ' ');
function addIconFiles(list) {
  let n = 0; list.forEach(([f, name]) => { if (!f || /^caixa-/.test(f) || f === '_novo') return; const ex = ICON_FILES.find(x => x[0] === f); if (ex) { if (name && ex[1] === iconLabel(f)) ex[1] = name; } else { ICON_FILES.push([f, name || iconLabel(f)]); n++; } });
  if (n) refreshIconSelects();
}
function loadIconList() {
  fetch(R + 'img/produtos/lista.json', { cache: 'no-cache' }).then(r => (r.ok ? r.json() : [])).then(l => addIconFiles((Array.isArray(l) ? l : []).map(x => (typeof x === 'string' ? [x, ''] : [x.f, x.n])))).catch(() => {});
  const gh = /^([^.]+)\.github\.io$/i.exec(location.hostname); if (!gh) return;
  const seg = new URL(R, location.href).pathname.split('/').filter(Boolean)[0], repo = seg || `${gh[1]}.github.io`, KEY = 'daqui-icones-gh';
  try { const c = JSON.parse(sessionStorage.getItem(KEY) || 'null'); if (c && Date.now() - c.t < 6e5) return addIconFiles(c.l); } catch (e) {}
  fetch(`https://api.github.com/repos/${gh[1]}/${repo}/contents/img/produtos`).then(r => (r.ok ? r.json() : [])).then(l => {
    const list = (Array.isArray(l) ? l : []).filter(x => x.type === 'file' && /\.svg$/i.test(x.name)).map(x => [x.name.replace(/\.svg$/i, ''), '']);
    try { sessionStorage.setItem(KEY, JSON.stringify({ t: Date.now(), l: list })); } catch (e) {}
    addIconFiles(list); }).catch(() => {});
}
const ICON_CHOICES = () => {
  const out = [['_novo', T('Desenho genérico', 'Generic drawing')]], seen = new Set(['_novo']);
  PRODUCTS.filter(p => p.cat !== 'caixas').map(p => [p.icon || p.id, L(p.name)]).concat(ICON_FILES).sort((a, b) => a[1].localeCompare(b[1], 'pt')).forEach(x => { if (!seen.has(x[0])) { seen.add(x[0]); out.push(x); } });
  return out;
};
const iconOptions = sel => ICON_CHOICES().map(([v, n]) => `<option value="${esc(v)}"${v === sel ? ' selected' : ''}>${esc(n)} (${esc(v)}.svg)</option>`).join('') + (sel && !ICON_CHOICES().some(x => x[0] === sel) ? `<option value="${esc(sel)}" selected>${esc(sel)}.svg</option>` : '');
function refreshIconSelects() { $$('select[data-icon-pick]').forEach(s => { const v = s.value; s.innerHTML = iconOptions(v); }); }
setTimeout(loadIconList, 0);
/* fotografia escolhida no telemóvel/computador: reduzida para no máximo 900 px (JPEG) antes de guardar ou enviar */
function shrinkImage(file, max = 900) {
  return new Promise((ok, no) => { const url = URL.createObjectURL(file), img = new Image();
    img.onload = () => { const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight)), c = document.createElement('canvas'); c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url); c.toBlob(b => (b ? ok(b) : no(new Error('imagem'))), 'image/jpeg', 0.8); };
    img.onerror = () => { URL.revokeObjectURL(url); no(new Error('imagem')); }; img.src = url; });
}
const blobToDataURL = b => new Promise(ok => { const r = new FileReader(); r.onload = () => ok(r.result); r.readAsDataURL(b); });
const isFav = id => { const u = currentUser(); return !!u && (u.favs || []).includes(id); };
function favBtn(id, big = false) { const on = isFav(id); return `<button class="fav${big ? ' big' : ''}" data-fav="${id}" aria-pressed="${on}" aria-label="${on ? T('Remover dos favoritos', 'Remove from favourites') : T('Adicionar aos favoritos', 'Add to favourites')}">${icon('heart', big ? 22 : 18)}</button>`; }
function toggleFav(id) {
  const u = currentUser(), p = P(id);
  if (!u) return loginPrompt(T('Entre na sua conta para guardar favoritos. Os favoritos entram primeiro nas suas caixas.', 'Sign in to save favourites. Favourites go first into your boxes.'));
  u.favs = u.favs || []; const on = u.favs.includes(id); u.favs = on ? u.favs.filter(x => x !== id) : [...u.favs, id]; saveUsers();
  $$(`[data-fav="${id}"]`).forEach(b => { b.setAttribute('aria-pressed', !on); b.setAttribute('aria-label', !on ? T('Remover dos favoritos', 'Remove from favourites') : T('Adicionar aos favoritos', 'Add to favourites')); });
  toast(on ? T(`Removido dos favoritos: ${L(p.name)}`, `Removed from favourites: ${L(p.name)}`) : T(`Adicionado aos favoritos: ${L(p.name)}`, `Added to favourites: ${L(p.name)}`));
}
/* dias de entrega e estado das encomendas */
const slotLabel = sl => `${fdate(sl.date || sl, { weekday: 'long' })}, ${fdate(sl.date || sl, { day: 'numeric', month: 'long' })}`;
const STAGES = () => [T('Recebida', 'Received'), T('Em preparação', 'Being packed'), T('Em distribuição', 'Out for delivery'), T('Entregue', 'Delivered')];
const STAGES_PICK = () => [T('Recebida', 'Received'), T('Em preparação', 'Being packed'), T('Pronta para levantar', 'Ready to collect'), T('Levantada', 'Collected')];
function stageName(o) { const s = orderStage(o); return s === 4 ? T('Cancelada', 'Cancelled') : (o.deliver === 'home' ? STAGES() : STAGES_PICK())[s]; }
function trackHTML(o) {
  const st = orderStage(o), names = o.deliver === 'home' ? STAGES() : STAGES_PICK();
  const when = o.deliver === 'home' ? `${slotLabel(o.slot)}, ${o.window}` : `${slotLabel(o.slot)}, ${DISTRIBUTION.days[o.day]?.pickup || ''}, ${o.point}`;
  return `<div class="track">
    <div class="row-between"><h3>${T('Encomenda', 'Order')} ${o.num}</h3><span class="status ${st === 4 ? 'pausada' : 'ativa'}">${stageName(o)}</span></div>
    ${st === 4 ? `<p class="muted">${T('Esta encomenda foi cancelada.', 'This order was cancelled.')}</p>` : `<ol class="steps-track">${names.map((n, i) => `<li class="${i < st || st === 3 ? 'done' : i === st ? 'now' : ''}"><span class="dot">${i < st || st === 3 ? icon('check', 14) : ''}</span>${n}</li>`).join('')}</ol>`}
    <dl class="dl cols2">
      <div><dt>${o.deliver === 'home' ? T('Entrega', 'Delivery') : T('Levantamento', 'Pick-up')}</dt><dd>${esc(when)}</dd></div>
      ${o.deliver === 'home' ? `<div><dt>${T('Morada', 'Address')}</dt><dd>${esc(o.address)}</dd></div>` : ''}
      <div><dt>${T('Artigos', 'Items')}</dt><dd>${itemCount(o.items)}</dd></div>
      <div><dt>Total</dt><dd>${money(o.total)}</dd></div>
    </dl></div>`;
}
function badges(p) {
  const b = [];
  if (!inSeason(p)) b.push(`<span class="badge off">${T('Fora de época', 'Out of season')}</span>`);
  else if (soldOut(p)) b.push(`<span class="badge nostock">${T('Fora de stock', 'Out of stock')}</span>`);
  if (p.essential) b.push(`<span class="badge">${T('Essencial', 'Essential')}</span>`);
  if (hasBio(p)) b.push(`<span class="badge bio">${hasConv(p) ? T('Também biológico', 'Organic too') : T('Biológico', 'Organic')}</span>`);
  if (p.cat === 'caixas') b.push(`<span class="badge sub">${T('Também em subscrição', 'Also by subscription')}</span>`);
  return b.length ? `<span class="badges">${b.join('')}</span>` : '';
}
function splitBar(p, caption = true) {
  const [a, b, c] = splitOf(p);
  return `<div class="split" role="img" aria-label="${T(`Divisão do preço: agricultor ${a}%, conservação e embalamento ${b}%, Daqui ${c}%`, `Price split: farmer ${a}%, storage and packing ${b}%, Daqui ${c}%`)}"><i style="width:${a}%"></i><i style="width:${b}%"></i><i style="width:${c}%"></i></div>
  ${caption ? `<p class="split-cap">${T('O agricultor recebe', 'The farmer gets')} ${a}% ${T('do preço', 'of the price')}</p>` : ''}`;
}
/* favoritos e produtos que não quer receber (escolhidos na conta) — usado na subscrição e no checkout */
function prefsSummary(u, back = '') {
  if (!u) return `<div class="fav-box">${icon('heart', 20)}<div>${T('Depois de entrar, escolha na sua conta os produtos favoritos e os que não quer receber. Valem para todas as caixas.', 'Once signed in, pick in your account your favourite products and the ones you\'d rather not get. They apply to every box.')}</div></div>`;
  const names = l => l.map(P).filter(Boolean).map(p => esc(L(p.name))).join(', ');
  const favs = names(u.favs || []), excl = names(u.exclude || []);
  const link = back ? `<button type="button" class="link" data-prefs-back="${esc(back)}">${T('Alterar na minha conta', 'Change in my account')}</button>` : `<a class="link" href="${href('conta', 'sec=preferencias')}">${T('Alterar na minha conta', 'Change in my account')}</a>`;
  return `<div class="fav-box">${icon('heart', 20)}<div><p><b>${T('Favoritos', 'Favourites')}:</b> ${favs || T('nenhum', 'none')}.</p><p><b>${T('Não quer receber', 'Not wanted')}:</b> ${excl || T('nenhum', 'none')}.</p><p class="small muted">${T('Valem para todas as suas caixas.', 'They apply to all your boxes.')} ${link}</p></div></div>`;
}
function notifyOn(id) { const u = currentUser(); return !!u && (u.notify || []).includes(id); }
function pcard(p) {
  const on = inSeason(p), url = productHref(p);
  const unitExtra = p.cat === 'caixas' ? `<span>${p.kg} kg, ${money(p.price / p.kg)}/kg</span>` : `<span>${unitLabel(p.unit)}</span>`;
  const btn = p.cat === 'caixas'
    ? `<a class="btn btn-green btn-sm" href="${url}">${T('Escolher tamanho', 'Choose size')}</a>`
    : on && soldOut(p) ? `<button class="btn btn-line btn-sm" data-notify="${p.id}" aria-pressed="${notifyOn(p.id)}">${icon('bell', 18)}${notifyOn(p.id) ? T('Aviso ativo', 'Reminder on') : T('Esgotado: avisar-me', 'Sold out: notify me')}</button>`
    : on ? `<button class="btn btn-green btn-sm" data-add="${p.id}">${icon('basket', 18)}${T('Adicionar ao cabaz', 'Add to basket')}</button>`
      : `<button class="btn btn-line btn-sm" data-notify="${p.id}" aria-pressed="${notifyOn(p.id)}">${icon('bell', 18)}${notifyOn(p.id) ? T('Aviso ativo', 'Reminder on') : T('Avisar-me', 'Notify me')}</button>`;
  return `<article class="pcard${on ? '' : ' is-off'}">${favBtn(p.id)}
    <a class="pimg${p.cat === 'caixas' ? ' box' : ''}" href="${url}" tabindex="-1" aria-hidden="true">${badges(p)}${artFor(p)}</a>
    <div class="pbody">
      <a class="pname" href="${url}">${esc(L(p.name))}</a>
      ${otag(p)}
      <div class="price"><strong>${p.cat === 'caixas' ? T('desde ', 'from ') : ''}${money(shownPrice(p))}</strong>${unitExtra}</div>
      ${on ? splitBar(p) : `<p class="split-cap">${T('Época', 'Season')}: ${seasonText(p)}</p>`}
      ${btn}
    </div>
  </article>`;
}
function fcard(f, withStory = false) {
  const crops = ofFarmer(f.id).map(p => L(p.name)).slice(0, 4).join(', ');
  return `<article class="fcard" data-farmer="${f.id}">
    <div class="pic">${farmPic(f)}</div>
    <div class="fb">
      <h3><a class="fname" href="${farmerHref(f)}">${esc(f.name)}</a></h3>
      <span class="where">${icon('pin', 18)}${esc(f.farm)}, ${esc(f.place)}</span>
      ${withStory ? `<p class="story">${esc(L(f.story).split('. ')[0])}.</p>` : ''}
      <span class="crops">${esc(crops)}</span>
    </div>
  </article>`;
}
function rail(id, items) { return `<div class="rail-wrap" data-rail="${id}"><div class="rail" id="rail-${id}" tabindex="0" aria-label="${T('Lista deslizante', 'Scrolling list')}">${items.join('')}</div></div>`; }
function railUI(id) { return `<div class="rail-ui" data-rail-ui="${id}"><button class="arr" data-rail-prev="${id}" aria-label="${T('Anterior', 'Previous')}">${icon('chevL', 20)}</button><span class="ctr" aria-live="polite"></span><button class="arr" data-rail-next="${id}" aria-label="${T('Seguinte', 'Next')}">${icon('chevR', 20)}</button></div>`; }
function crumbs(trail) {
  const items = [[T('Início', 'Home'), '']].concat(trail);
  return `<nav class="crumbs wrap" aria-label="${T('Caminho', 'Breadcrumb')}">${items.map(([n, p, q], i) => i === items.length - 1 ? `<span aria-current="page">${esc(n)}</span>` : `<a href="${href(p, q)}">${esc(n)}</a>`).join(' / ')}</nav>`;
}
function faqList(items) { return `<div class="faq">${items.map(f => `<details><summary>${esc(L(f.q))}<span class="pm">${icon('plus', 18)}</span></summary><p class="ans">${esc(L(f.a))}</p></details>`).join('')}</div>`; }
const demoNote = () => T('Isto é uma demonstração do site da Daqui: nada foi enviado.', 'This is a demo of the Daqui website: nothing was sent.');
function seasonStrip(p) {
  const letters = lang === 'en' ? 'JFMAMJJASOND' : 'JFMAMJJASOND';
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const isIn = m => { if (!p.season) return true; const [a, b] = p.season; return a <= b ? m >= a && m <= b : m >= a || m <= b; };
  return `<div class="strip" role="img" aria-label="${T('Época', 'Season')}: ${seasonText(p)}">${months.map(m => `<span class="${isIn(m) ? 'in' : ''}${m === NOW_M ? ' now' : ''}" title="${monthName(m)}">${letters[m - 1]}</span>`).join('')}</div>`;
}

/* ---------- pedidos: nomes dos campos e valores nas duas línguas ---------- */
const FORM_KEYS = { 'f-n': 'name', 'f-c': 'contact', 'fa-n': 'name', 'fa-t': 'phone', 'fa-l': 'town', 'fa-a': 'area', 'fa-p': 'crops', 'r-n': 'restaurant', 'r-p': 'person', 'r-t': 'phone', 'r-l': 'town', 'c-n': 'name', 'c-e': 'contact', 'c-m': 'message' };
const REQ_LABELS = () => ({ name: T('Nome', 'Name'), phone: T('Telemóvel', 'Mobile'), contact: T('E-mail ou telemóvel', 'Email or mobile'), town: T('Localidade', 'Town'), area: T('Área aproximada', 'Approximate area'),
  crops: T('O que produz', 'What they grow'), restaurant: T('Restaurante', 'Restaurant'), person: T('Responsável', 'Contact person'), message: T('Mensagem', 'Message'), pref: T('Prefere encomendar', 'Prefers to order'),
  order: T('Encomenda', 'Order'), result: T('Resultado', 'Result'), state: T('Estado', 'Status'), action: T('Ação', 'Action'), from: T('De', 'From'), to: T('Para', 'To'), product: T('Produto', 'Product'),
  what: T('O que aconteceu', 'What happened'), remedy: T('Preferência', 'Preference'), photo: T('Fotografia', 'Photo'), icon: T('Desenho na loja', 'Shop drawing'), farm: T('Quinta', 'Farm'), region: T('Região', 'Region'), kind: T('Tipo de cozinha', 'Cuisine'),
  date: T('Data', 'Date'), time: T('Horário', 'Time'), spots: T('Lugares', 'Places'), price: T('Preço sugerido', 'Suggested price'), unit: T('Unidade', 'Unit'), season: T('Época', 'Season'), qty: T('Quantidade', 'Quantity'),
  period: T('Período', 'Period'), namePt: T('Nome (PT)', 'Name (PT)'), nameEn: T('Nome (EN)', 'Name (EN)'), cat: T('Categoria', 'Category'), desc: T('Descrição', 'Description'), descEn: T('Descrição (EN)', 'Description (EN)'),
  organic: T('Modo de produção', 'Farming method'), productId: T('Produto do catálogo', 'Catalogue product') });
function reqValue(k, v) {
  const maps = { area: { lt1: T('Menos de 1 ha', 'Under 1 ha'), '1-5': '1–5 ha', '5-20': '5–20 ha', gt20: T('Mais de 20 ha', 'Over 20 ha') }, pref: { app: T('Site ou aplicação', 'Website or app'), tel: T('Telefone', 'Phone') },
    result: { viewed: T('Consultada', 'Viewed'), notfound: T('Não encontrada', 'Not found') }, action: { reslot: T('Mudança do dia de entrega', 'Delivery day changed'), cancel: T('Cancelamento', 'Cancellation') },
    remedy: { sub: T('Substituir na próxima entrega', 'Replace next delivery'), ref: T('Reembolso', 'Refund') }, cat: { fruta: T('Fruta', 'Fruit'), legumes: T('Legumes', 'Vegetables') },
    unit: { kg: 'kg', un: T('unidade', 'each'), molho: T('molho', 'bunch'), cuv: T('cuvete', 'punnet') } };
  if (maps[k] && maps[k][v]) return maps[k][v];
  if ((k === 'product' || k === 'productId') && P(v)) return L(P(v).name);
  if (k === 'organic') return v === 'sim' || v === true ? T('Biológico', 'Organic') : T('Convencional', 'Conventional');
  if (k === 'region' && REGIONS[v]) return regionName(v);
  if ((k === 'from' || k === 'to' || k === 'date') && /^\d{4}-\d{2}-\d{2}$/.test(v)) return slotLabel(v);
  if (k === 'state' && /^\d$/.test(String(v))) return [...STAGES(), T('Cancelada', 'Cancelled')][+v];
  if (k === 'season' && /^\d+-\d+$/.test(v)) { const [a, b] = v.split('-').map(Number); return `${monthName(a, 'short')}–${monthName(b, 'short')}`; }
  if (k === 'photo' && !v) return T('Sem fotografia', 'No photo');
  if (k === 'price' && !isNaN(+v)) return money(+v);
  return v;
}

/* ---------- cabeçalho e rodapé ---------- */
const NAV = () => [
  ['', T('Início', 'Home'), 'inicio'], ['produtos', T('Produtos', 'Shop'), 'produtos'], ['subscricao', T('Subscrição', 'Subscription'), 'subscricao'],
  ['agricultores', T('Os nossos agricultores', 'Our farmers'), 'agricultores'], ['restaurantes', T('Restaurantes', 'Restaurants'), 'restaurantes'],
  ['colhe-connosco', T('Colhe Connosco', 'Join the Harvest'), 'colhe-connosco'], ['sobre', T('Sobre nós', 'About us'), 'sobre'], ['contacto', T('Contacto', 'Contact'), 'contacto']
];
const SECTION = { produto: 'produtos', agricultor: 'agricultores', subscrever: 'subscricao' }[PAGE] || PAGE;
function langToggle() { return `<div class="lang" role="group" aria-label="${T('Idioma', 'Language')}"><button data-lang="pt" aria-pressed="${lang === 'pt'}" lang="pt">PT</button><button data-lang="en" aria-pressed="${lang === 'en'}" lang="en">EN</button></div>`; }
function searchBox(id) {
  return `<form class="search" data-search role="search" action="${href('produtos')}">
    ${icon('search', 20)}<label class="sr" for="${id}">${T('Pesquisar produtos', 'Search products')}</label>
    <input id="${id}" name="q" type="search" autocomplete="off" placeholder="${T('Pesquisar fruta, legumes, agricultores…', 'Search fruit, vegetables, farmers…')}" value="${esc(PAGE === 'produtos' ? QS.get('q') || '' : '')}">
    <div class="suggest"><h4>${T('Pesquisas rápidas', 'Quick searches')}</h4>
      <div class="chips"><a class="chip" href="${href('produtos', 'q=pera')}">Pera Rocha</a><a class="chip" href="${href('produtos', 'q=' + T('maca', 'apple'))}">${T('Maçã', 'Apple')}</a>
        <a class="chip" href="${href('subscricao')}">${T('Subscrição', 'Subscription')}</a><a class="chip" href="${href('contacto')}">${T('Contacto', 'Contact')}</a></div>
      <ul class="sug-list"></ul></div>
  </form>`;
}
function header() {
  const count = itemCount(cart), u = currentUser();
  const newReq = u && u.role === 'admin' ? REQUESTS.filter(r => r.status === 'novo').length : 0;
  const nav = NAV().map(([p, n, k]) => `<li><a href="${href(p)}"${SECTION === k ? ' aria-current="page"' : ''}>${n}</a></li>`).join('');
  return `<div class="announce on-dark">${T('A Caixa Mista da Estação é a forma mais fácil de conhecer a Daqui.', 'The Mixed Seasonal Box is the easiest way to get to know Daqui.')} <a href="${href('produtos/caixa-mista')}">${T('Ver a caixa', 'See the box')}</a></div>
  <header class="hdr on-dark">
    <div class="wrap hdr-row">
      <button class="icon-btn menu-btn" data-menu aria-label="${T('Abrir menu', 'Open menu')}" aria-expanded="false">${icon('menu', 26)}</button>
      <a class="logo" href="${href()}" aria-label="Daqui, ${T('início', 'home')}"><img src="${LOGO_GOLD}" alt="Daqui"></a>
      ${searchBox('q-desk')}
      <div class="hdr-actions">
        <a class="hdr-help" href="${href('contacto')}"><span>${T('Ajuda? Ligue-nos', 'Help? Call us')}</span><strong>${PHONE}</strong></a>
        ${langToggle()}
        ${typeof bellButton === 'function' ? bellButton() : ''}
        <a class="acct-link" href="${href(!u ? 'entrar' : u.partner ? 'parceiro' : 'conta')}" aria-label="${u ? T('A minha conta', 'My account') : T('Entrar', 'Sign in')}${newReq ? `, ${newReq} ${T('pedidos novos', 'new requests')}` : ''}">${icon('user', 24)}<span>${u ? esc(u.name.split(' ')[0]) : T('Entrar', 'Sign in')}</span>${newReq ? `<span class="count">${newReq}</span>` : ''}</a>
        <button class="icon-btn" data-cart-open aria-label="${T('Abrir cabaz', 'Open basket')}, ${count} ${T('artigos', 'items')}">${icon('basket', 26)}${count ? `<span class="count">${count}</span>` : ''}</button>
      </div>
    </div>
    <div class="wrap mob-search">${searchBox('q-mob')}</div>
    <nav class="nav" aria-label="${T('Principal', 'Main')}"><div class="wrap"><ul>${nav}
      <li class="socials">${['instagram', 'tiktok', 'facebook'].map(s => `<a href="#" data-social="${s}" aria-label="${s}">${icon(s, 20)}</a>`).join('')}</li></ul></div></nav>
  </header>
  <div class="mnav on-dark" id="mnav" aria-hidden="true">
    <div class="scrim"></div>
    <div class="panel" role="dialog" aria-label="Menu">
      <div class="mnav-top"><img src="${LOGO_GOLD}" alt="Daqui"><button class="icon-btn" data-menu-close aria-label="${T('Fechar menu', 'Close menu')}">${icon('close', 24)}</button></div>
      ${langToggle()}
      <ul>${NAV().map(([p, n, k]) => `<li><a href="${href(p)}"${SECTION === k ? ' aria-current="page"' : ''}>${n}</a></li>`).join('')}
        <li><a href="${href(!u ? 'entrar' : u.partner ? 'parceiro' : 'conta')}">${!u ? T('Entrar / Criar conta', 'Sign in / Create account') : u.partner ? T('Área de parceiro', 'Partner area') : T('A minha conta', 'My account')}</a></li><li><a href="${href('faq')}">${T('Perguntas frequentes', 'FAQ')}</a></li></ul>
      <p>${T('Encomendas por telefone', 'Phone orders')}<br><strong class="mnav-phone">${PHONE}</strong></p>
    </div>
  </div>`;
}
function footer() {
  const soc = ['instagram', 'tiktok', 'facebook'].map(s => `<a href="#" data-social="${s}" aria-label="${s}">${icon(s, 20)}</a>`).join('');
  return `<footer class="ftr on-dark"><div class="wrap">
    <div class="cols">
      <div class="brand"><img src="${LOGO_GOLD}" alt="Daqui"><p>${T('Fruta e legumes do campo para a sua casa, a preço justo para quem produz e para quem compra.', 'Fruit and vegetables from the field to your home, at a fair price for those who grow and those who buy.')}</p>
        <p class="ftr-contact">${T('Linha Daqui', 'Daqui line')}: <strong>${PHONE}</strong><br>${EMAIL}</p></div>
      <div><h3>${T('Loja', 'Shop')}</h3><ul><li><a href="${href('produtos')}">${T('Todos os produtos', 'All products')}</a></li><li><a href="${href('subscricao')}">${T('Caixas da Estação', 'Seasonal boxes')}</a></li><li><a href="${href('colhe-connosco')}">${JTH()}</a></li><li><a href="${href('restaurantes')}">${T('Selo Daqui', 'Daqui seal')}</a></li></ul></div>
      <div><h3>${T('Ajudamos com', 'We can help with')}</h3><ul><li><a href="${href('contacto')}">${T('Incidências e reembolsos', 'Issues and refunds')}</a></li><li><a href="${href('conta')}">${T('A minha conta', 'My account')}</a></li><li><a href="${href('faq')}">${T('Perguntas frequentes', 'FAQ')}</a></li><li><a href="${href('agricultores', 'adesao=1')}">${T('Inscrever-me como agricultor', 'Sign up as a farmer')}</a></li></ul></div>
      <div><h3>${T('Políticas', 'Policies')}</h3><ul><li><a href="${href('termos')}">${T('Termos de utilização', 'Terms of use')}</a></li><li><a href="${href('privacidade')}">${T('Privacidade', 'Privacy')}</a></li><li><a href="${href('cookies')}">Cookies</a></li><li><a href="${href('devolucoes')}">${T('Devoluções', 'Refunds')}</a></li></ul></div>
      <div><h3>${T('Pagamentos', 'Payments')}</h3><div class="pay"><span>MB WAY</span><span>Multibanco</span><span>Visa</span><span>Mastercard</span><span>PayPal</span><span>${T('Na entrega', 'On delivery')}</span></div>
        <h3 class="mt">${T('Siga-nos', 'Follow us')}</h3><div class="socials">${soc}</div></div>
    </div>
    <div class="bottom"><span>© 2026 Daqui</span><span>${T('Projeto académico de Inglês: Projeto de Aplicação (IPA), Universidade de Aveiro. Empresa, pessoas, preços e contactos fictícios.', 'Academic project for English: Applied Project (IPA), University of Aveiro. The company, people, prices and contacts are fictional.')}</span></div>
  </div></footer>`;
}

/* ---------- cabaz ---------- */
let cart = store.get('daqui-cart', []).filter(i => i && P(i.id));
let deliver = store.get('daqui-deliver', 'pickup');
const saveCart = () => { store.set('daqui-cart', cart); store.set('daqui-deliver', deliver); };
function addToCart(id, opts = {}, qty = 1) {
  const p = P(id); let price = p.price; id = p.id; opts = Object.assign({}, opts);
  if (p.cat === 'caixas') { const sz = BOX_SIZES[id].find(s => s.s === (opts.size || 'P')) || BOX_SIZES[id][0]; price = sz.price; opts.size = sz.s; opts.kg = sz.kg; delete opts.bio; }
  else { const bio = opts.bio === undefined ? defaultBio(p) : !!opts.bio && hasBio(p); if (bio) opts.bio = true; else delete opts.bio; price = variantPrice(p, bio); qty = Math.max(qtyStep(p), round2(qty)); }
  if (typeof LOTS !== 'undefined' && tracksStock(p)) { const room = round2(stockOf(p) - inCart(id)); if (room <= 0) { toast(T(`${L(p.name)}: já tem no cabaz tudo o que há em stock.`, `${L(p.name)}: your basket already has all the stock.`)); return; } if (qty > room) { qty = room; toast(T(`Só restam ${stockText(p, stockOf(p))} de ${L(p.name)}.`, `Only ${stockText(p, stockOf(p))} of ${L(p.name)} left.`)); } }
  const key = [id, opts.size || '', opts.bio ? 'bio' : ''].join('|'); const ex = cart.find(i => i.key === key);
  if (ex) ex.qty = round2(ex.qty + qty); else cart.push({ key, id, qty, price, opts });
  saveCart(); refreshCartUI(); toast(T(`Adicionado ao cabaz: ${L(p.name)}`, `Added to your basket: ${L(p.name)}`));
}
function cartTotals() { if (!cart.length) return { sub: 0, del: 0, tot: 0, boxes: { fee: 0 } }; const q = quote(cart, deliver, currentUser(), null, false); return { sub: q.sub, del: q.ship.fee, tot: q.total, boxes: q.boxes, why: q.ship.why }; }
function drawerHTML() {
  const t = cartTotals();
  const items = cart.map(i => { const p = P(i.id); return `<div class="citem"><a class="thumb" href="${productHref(p)}" tabindex="-1">${artFor(p)}</a>
    <div><h3><a href="${productHref(p)}">${esc(L(p.name))}</a></h3><div class="opt">${i.opts.size ? `${sizeName(i.opts.size)}, ${i.opts.kg} kg; ${T('compra única', 'one-off')}` : `${money(i.price)}${unitLabel(p.unit)}${i.opts.bio ? `, ${T('biológico', 'organic')}` : hasBio(p) ? `, ${T('convencional', 'conventional')}` : ''}`}</div>
      <div class="qty"><button data-qty="-1" data-key="${esc(i.key)}" aria-label="${byKg(p) ? T('Menos meio quilo', 'Half a kilo less') : T('Menos um', 'One less')}">${icon('minus', 16)}</button><span>${fmtQty(i.qty, p)}</span><button data-qty="1" data-key="${esc(i.key)}" aria-label="${byKg(p) ? T('Mais meio quilo', 'Half a kilo more') : T('Mais um', 'One more')}">${icon('plus', 16)}</button></div></div>
    <div class="ta-r"><b>${money(round2(i.price * i.qty))}</b><br><button class="rm" data-remove="${esc(i.key)}" aria-label="${T('Remover', 'Remove')} ${esc(L(p.name))}">${icon('trash', 18)}</button></div></div>`; }).join('');
  return `<div class="dh"><h2 id="cart-title">${T('O seu cabaz', 'Your basket')}</h2><button class="icon-btn" data-cart-close aria-label="${T('Fechar cabaz', 'Close basket')}">${icon('close', 24)}</button></div>
  <div class="db">
    <div class="promo">${crateSVG('mista')}<div><b>${T('Prefere receber todas as semanas?', 'Want it every week?')}</b><span class="small">${T('Subscreva uma Caixa da Estação com preço garantido durante 12 meses.', 'Subscribe to a Seasonal Box with a 12-month price guarantee.')}</span><br><a class="link" href="${href('subscricao')}">${T('Ver subscrições', 'See subscriptions')}</a></div></div>
    ${cart.length ? items : `<div class="empty"><h3>${T('O seu cabaz está vazio', 'Your basket is empty')}</h3><p class="muted">${T('Comece pelos essenciais da semana.', 'Start with this week\'s essentials.')}</p><a class="btn btn-green" href="${href('produtos')}">${T('Ver produtos', 'Browse the shop')}</a></div>`}
    ${cart.length ? `<fieldset class="plain"><legend class="lbl">${T('Como quer receber?', 'How would you like it?')}</legend>
      <div class="radios"><label><input type="radio" name="deliver" value="pickup"${deliver === 'pickup' ? ' checked' : ''}>${T('Ponto de recolha', 'Pick-up point')} (+${feeText('pickup')})</label><label><input type="radio" name="deliver" value="home"${deliver === 'home' ? ' checked' : ''}>${T('Entrega em casa', 'Home delivery')} (+${feeText('home')})</label></div>
      <p class="small muted">${t.sub < SETTINGS.freeFrom ? T(`Faltam ${money(SETTINGS.freeFrom - t.sub)} para os portes grátis.`, `${money(SETTINGS.freeFrom - t.sub)} more for free delivery.`) : T('Portes grátis nesta encomenda.', 'Free delivery on this order.')}</p></fieldset>
      <p class="note small">${icon('clock', 20)}<span>${T(`Distribuímos à quinta-feira e ao sábado. Se encomendar agora: ${slotLabel(slotOptions()[0])}.`, `We deliver on Thursdays and Saturdays. Order now for ${slotLabel(slotOptions()[0])}.`)}</span></p>` : ''}
  </div>
  ${cart.length ? `<div class="df"><div class="sum"><span>${T('Subtotal', 'Subtotal')}</span><span>${money(t.sub)}</span></div>${t.boxes.fee ? `<div class="sum"><span>${T('Caixas de cartão', 'Cardboard boxes')} (${cardboardText(t.boxes)})</span><span>${money(t.boxes.fee)}</span></div>` : ''}<div class="sum"><span>${T('Entrega', 'Delivery')}</span><span>${t.del ? money(t.del) : T('Grátis', 'Free')}</span></div><div class="sum tot"><span>Total</span><span>${money(t.tot)}</span></div>
    <a class="btn btn-green btn-block" href="${href('finalizar')}">${T('Finalizar encomenda', 'Check out')}</a></div>` : ''}`;
}
function refreshCartUI() {
  const d = $('#drawer'); if (d.classList.contains('on')) d.innerHTML = drawerHTML();
  const count = itemCount(cart);
  $$('[data-cart-open]').forEach(b => { b.setAttribute('aria-label', `${T('Abrir cabaz', 'Open basket')}, ${count} ${T('artigos', 'items')}`); const c = $('.count', b); if (count) { if (c) c.textContent = count; else b.insertAdjacentHTML('beforeend', `<span class="count">${count}</span>`); } else if (c) c.remove(); });
}
let lastFocus = null;
function openCart() { lastFocus = document.activeElement; const d = $('#drawer'); d.innerHTML = drawerHTML(); d.classList.add('on'); d.removeAttribute('inert'); $('#overlay').classList.add('on'); setTimeout(() => $('[data-cart-close]', d)?.focus(), 30); }
function closeCart() { const d = $('#drawer'); d.classList.remove('on'); d.setAttribute('inert', ''); $('#overlay').classList.remove('on'); lastFocus?.focus?.(); }

/* ---------- janelas (modal), avisos ---------- */
function openModal(html, label) {
  lastFocus = document.activeElement; const m = $('#modal');
  $('.box', m).innerHTML = `<button class="icon-btn x" data-modal-close aria-label="${T('Fechar', 'Close')}">${icon('close', 22)}</button>` + html;
  $('.box', m).setAttribute('aria-label', label || ''); m.classList.add('on'); document.body.style.overflow = 'hidden';
  setTimeout(() => $('[data-modal-close]', m).focus(), 20);
}
function closeModal() { $('#modal').classList.remove('on'); document.body.style.overflow = ''; lastFocus?.focus?.(); }
let toastT;
function toast(msg) { const t = $('#toast'); t.innerHTML = icon('check', 20) + `<span>${esc(msg)}</span>`; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 2800); }
function loginPrompt(text) {
  const next = encodeURIComponent(currentPath());
  openModal(`<div class="mbody"><h2>${T('Entre na sua conta', 'Sign in to your account')}</h2><p>${text}</p>
    <div class="row-btns"><a class="btn btn-green" href="${href('entrar', 'next=' + next)}">${T('Entrar', 'Sign in')}</a><a class="btn btn-line" href="${href('entrar', 'modo=registo&next=' + next)}">${T('Criar conta', 'Create account')}</a></div></div>`, T('Entrar', 'Sign in'));
}
/* caminho da página atual, relativo à raiz do site (ex.: "colhe-connosco" ou "produtos/kiwi") */
function currentPath() { const m = { produto: 'produtos/', agricultor: 'agricultores/', subscrever: 'subscricao/' }; return PAGE === 'inicio' ? '' : m[PAGE] ? m[PAGE] + PID : PAGE; }
function toggleNotify(id) {
  const u = currentUser(); const p = P(id);
  if (!u) return loginPrompt(T(`Entre na sua conta para receber um aviso quando ${L(p.name)} voltar.`, `Sign in to get a reminder when ${L(p.name)} is back.`));
  u.notify = u.notify || []; const on = u.notify.includes(id);
  u.notify = on ? u.notify.filter(x => x !== id) : [...u.notify, id]; saveUsers();
  $$(`[data-notify="${id}"]`).forEach(b => { b.setAttribute('aria-pressed', !on); b.innerHTML = icon('bell', 18) + (on ? T('Avisar-me', 'Notify me') : T('Aviso ativo', 'Reminder on')); });
  toast(on ? T('Aviso removido', 'Reminder removed') : inSeason(p) ? T('Avisamos quando voltar a haver stock', 'We\'ll let you know when it\'s back in stock') : T(`Avisamos quando voltar em ${monthName(p.season[0])}`, `We'll let you know when it's back in ${monthName(p.season[0])}`));
}

/* ---------- carrosséis ---------- */
let sliderTimer = null;
function setupSlider() {
  clearInterval(sliderTimer); const sl = $('.slider'); if (!sl) return;
  const slides = $$('.slide', sl); let i = 0, paused = false;
  const show = n => { i = (n + slides.length) % slides.length; slides.forEach((s, k) => { s.classList.toggle('on', k === i); s.setAttribute('aria-hidden', k !== i); s.inert = k !== i; }); sl.dataset.tone = slides[i].dataset.tone; $$('.dots button', sl).forEach((d, k) => { if (k === i) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current'); }); };
  show(0);
  sl.addEventListener('click', e => { const b = e.target.closest('[data-slide],[data-slide-prev],[data-slide-next]'); if (!b) return; if (b.hasAttribute('data-slide')) show(+b.dataset.slide); else show(i + (b.hasAttribute('data-slide-next') ? 1 : -1)); clearInterval(sliderTimer); paused = true; });
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) sliderTimer = setInterval(() => { if (!paused && !sl.matches(':hover') && !sl.contains(document.activeElement)) show(i + 1); }, 7000);
}
function setupRails() {
  $$('[data-rail]').forEach(w => {
    const id = w.dataset.rail, r = $('.rail', w), ui = $(`[data-rail-ui="${id}"]`); if (!ui || !r.children.length) return;
    const ctr = $('.ctr', ui), prev = $('[data-rail-prev]', ui), next = $('[data-rail-next]', ui);
    const step = () => r.children[0].getBoundingClientRect().width + 20;
    const upd = () => { const n = r.children.length; ctr.textContent = `${Math.min(Math.round(r.scrollLeft / step()) + 1, n)} / ${n}`; prev.disabled = r.scrollLeft < 4; next.disabled = r.scrollLeft + r.clientWidth >= r.scrollWidth - 4; };
    r.addEventListener('scroll', () => requestAnimationFrame(upd), { passive: true });
    const by = d => r.scrollBy({ left: d * step(), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    prev.onclick = () => by(-1); next.onclick = () => by(1); upd(); setTimeout(upd, 80);
  });
}

/* ---------- pesquisa ---------- */
function suggest(input) {
  const ul = $('.sug-list', input.closest('[data-search]')), q = norm(input.value.trim());
  if (!q) { ul.innerHTML = ''; return; }
  const hits = PRODUCTS.filter(p => { const f = p.farmer ? F(p.farmer) : null; return norm(`${p.name.pt} ${p.name.en} ${f ? f.name + ' ' + f.place : ''}`).includes(q); }).slice(0, 5);
  ul.innerHTML = hits.length ? hits.map(p => `<li><a href="${productHref(p)}">${artFor(p)}<span><b>${esc(L(p.name))}</b><br><span class="small muted">${money(p.price)}${unitLabel(p.unit)}${inSeason(p) ? '' : ' · ' + T('fora de época', 'out of season')}</span></span></a></li>`).join('') : `<li class="small muted pad">${T('Sem resultados. Prima Enter para ver todos os produtos.', 'No matches. Press Enter to see all products.')}</li>`;
}

/* ---------- desenhar a página ---------- */
function render() {
  document.documentElement.lang = lang === 'en' ? 'en' : 'pt-PT';
  const page = PAGES[PAGE] || PAGES.inicio;
  const out = page();
  $('#app').innerHTML = header() + `<main id="main" tabindex="-1">${NUVEM.banner()}${out.html}</main>` + footer();
  document.title = `Daqui | ${out.title}`;
  setupSlider(); setupRails(); if (out.after) out.after();
  if (typeof chatRefreshUI === 'function') chatRefreshUI();
}
function setLang(l) {
  if (l === lang) return; lang = l; store.set('daqui-lang', l); const y = scrollY; const open = $('#drawer').classList.contains('on');
  closeModal(); render(); scrollTo(0, y); if (open) $('#drawer').innerHTML = drawerHTML(); toast(l === 'en' ? 'Language: English' : 'Idioma: Português');
}
function openMenu() { const m = $('#mnav'); m.classList.add('open'); m.setAttribute('aria-hidden', 'false'); $('[data-menu]')?.setAttribute('aria-expanded', 'true'); setTimeout(() => $('.panel [data-menu-close]', m)?.focus(), 20); }
function closeMenu() { const m = $('#mnav'); if (!m) return; m.classList.remove('open'); m.setAttribute('aria-hidden', 'true'); $('[data-menu]')?.setAttribute('aria-expanded', 'false'); }

/* ---------- eventos comuns (as páginas acrescentam os seus em PAGE_EVENTS) ---------- */
const PAGE_EVENTS = { click: [], change: [], input: [], submit: [] };
document.addEventListener('click', e => {
  if (e.target.id === 'overlay') return closeCart();
  if (e.target.matches('.modal .scrim')) return closeModal();
  if (e.target.matches('.mnav .scrim')) return closeMenu();
  const t = e.target.closest('button, a'); if (!t) return;
  const d = t.dataset;
  if (d.lang) return setLang(d.lang);
  if ('menu' in d) return openMenu();
  if ('menuClose' in d) return closeMenu();
  if ('cartOpen' in d) return openCart();
  if ('cartClose' in d) return closeCart();
  if ('modalClose' in d) return closeModal();
  if (d.add) return addToCart(d.add);
  if (d.notify) return toggleNotify(d.notify);
  if (d.fav) return toggleFav(d.fav);
  if (d.qty) { const i = cart.find(x => x.key === d.key); if (i) { const st = qtyStep(P(i.id)); i.qty = round2(i.qty + +d.qty * st); if (i.qty < st) cart = cart.filter(x => x !== i); } saveCart(); refreshCartUI(); $(`[data-qty="${d.qty}"][data-key="${CSS.escape(d.key)}"]`)?.focus(); return; }
  if (d.remove) { cart = cart.filter(x => x.key !== d.remove); saveCart(); refreshCartUI(); $('[data-cart-close]')?.focus(); return; }
  if (d.social) { e.preventDefault(); return toast(T('Perfil fictício nesta demonstração', 'Fictional profile in this demo')); }
  for (const h of PAGE_EVENTS.click) if (h(e, t, d) === true) return;
});
document.addEventListener('change', e => {
  if (e.target.name === 'deliver') { deliver = e.target.value; saveCart(); refreshCartUI(); $(`#drawer input[value="${deliver}"]`)?.focus(); }
  PAGE_EVENTS.change.forEach(h => h(e, e.target));
});
document.addEventListener('input', e => { if (e.target.closest('[data-search]')) suggest(e.target); PAGE_EVENTS.input.forEach(h => h(e, e.target)); });
document.addEventListener('focusin', e => { const s = e.target.closest('[data-search]'); $$('[data-search]').forEach(x => x.classList.toggle('open', x === s)); });
document.addEventListener('mousedown', e => { if (!e.target.closest('[data-search]')) $$('[data-search]').forEach(s => s.classList.remove('open')); });
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if ($('#modal').classList.contains('on')) closeModal(); else if ($('#drawer').classList.contains('on')) closeCart(); else { closeMenu(); $$('[data-search]').forEach(s => s.classList.remove('open')); }
});
document.addEventListener('submit', e => {
  const f = e.target;
  if (f.matches('[data-search]')) { e.preventDefault(); const q = $('input', f).value.trim(); go('produtos', q ? 'q=' + encodeURIComponent(q) : ''); return; }
  for (const h of PAGE_EVENTS.submit) if (h(e, f) === true) return;
});
/* formulários simples (demonstração) */
function validate(f) {
  const err = $('.err', f); const bad = [...f.querySelectorAll('[required]')].filter(i => !i.value.trim());
  f.querySelectorAll('[aria-invalid]').forEach(i => i.removeAttribute('aria-invalid'));
  if (!bad.length) { if (err) err.hidden = true; return true; }
  bad.forEach(i => i.setAttribute('aria-invalid', 'true'));
  if (err) { err.hidden = false; err.textContent = T('Preencha os campos assinalados: ', 'Please fill in: ') + bad.map(i => (f.querySelector(`label[for="${i.id}"]`)?.textContent || '').replace(/[?:]$/, '')).filter(Boolean).join(', ') + '.'; }
  bad[0].focus(); return false;
}
PAGE_EVENTS.submit.push((e, f) => {
  if (!f.matches('form[data-form]')) return;
  e.preventDefault(); if (!validate(f)) return true;
  const name = ((f.querySelector('[name="person"]') || f.querySelector('[name="name"]'))?.value || '').trim().split(' ')[0];
  const type = { founders: 'fundador', farmer: 'agricultor', restaurant: 'selo', contact: 'contacto' }[f.dataset.form];
  let req = null;
  if (type) { const fields = {}; $$('input, select, textarea', f).forEach(i => { if (i.type === 'radio' && !i.checked) return; const k = i.type === 'radio' ? i.name : FORM_KEYS[i.id.replace(/^f-found(-m)?-/, 'f-')] || i.id; if (k && i.value.trim()) fields[k] = i.value.trim(); }); req = addRequest(type, fields); }
  const msgs = { founders: T('Lugar reservado na lista de membros fundadores.', 'Your place on the founding-members list is reserved.'), farmer: T('Pedido de visita registado.', 'Visit request recorded.'), restaurant: T('Pedido do selo registado.', 'Seal application recorded.'), contact: T('Mensagem pronta a enviar.', 'Message ready to send.'), help: T('Pedido registado.', 'Request recorded.') };
  f.outerHTML = `<div class="note done" role="status">${icon('check', 22)}<span><b>${name ? T('Obrigado, ', 'Thank you, ') + esc(name) + '. ' : ''}${msgs[f.dataset.form] || ''}</b>${req ? ` ${T('Referência', 'Reference')}: ${req.id}.` : ''}<br>${REQ_NOTE()}</span></div>`;
  return true;
});

/* Compatibilidade com CSP restrita (ex.: OnionShare): os atributos style="" escritos via innerHTML
   são reaplicados por CSSOM, que a política de segurança permite. */
function applyInlineStyles(root) {
  if (root.nodeType !== 1) return;
  const els = root.hasAttribute('style') ? [root, ...root.querySelectorAll('[style]')] : root.querySelectorAll('[style]');
  els.forEach(el => { const v = el.getAttribute('style'); if (v) el.style.cssText = v; });
}
new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(applyInlineStyles))).observe(document.documentElement, { childList: true, subtree: true });

/* arranque: com base de dados, primeiro lê os dados (js/nuvem.js) e só depois desenha a página */
document.addEventListener('DOMContentLoaded', () => {
  $('#drawer').setAttribute('inert', '');
  if (PAGE_DOC === 'app') return;   // a app para telemóvel arranca em js/app-movel.js
  let done = false;
  const first = () => { done = true; clearTimeout(slow); if (!NUVEM.on) loadLocalExtras(); render(); document.body.classList.add('pronto'); if (location.hash) setTimeout(() => document.getElementById(location.hash.slice(1))?.scrollIntoView(), 60); };
  /* "A carregar…" só aparece se os dados demorarem (com a cópia do separador, a página desenha logo) */
  const slow = setTimeout(() => { if (!done) $('#app').innerHTML = `<div class="loading-page" role="status"><img src="${LOGO_GOLD}" alt="Daqui" width="140"><p>${T('A carregar…', 'Loading…')}</p></div>`; }, 250);
  if (!NUVEM.configured) return first();
  NUVEM.start().then(first, first);
});
