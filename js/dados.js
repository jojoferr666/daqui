/* ===== Daqui — dados da v11: inventário, Saldo Daqui, Cooperativa, promoções, notificações, avaliações e preços =====
   Funciona nos dois modos, como o resto do site:
   - com base de dados (NUVEM.on): as listas abaixo são preenchidas por js/nuvem.js e as gravações vão para o Supabase;
   - sem base de dados: tudo fica guardado neste navegador (localStorage), para demonstração. */

/* ---------- definições da gestão ---------- */
const SETTINGS_KEY = 'daqui-definicoes';
const SETTINGS = Object.assign({ homeFee: 3.90, pointFee: 1.90, freeFrom: 25, coopFee: 30, coopFreeShipping: true, lockLots: false }, store.get(SETTINGS_KEY, {}));
function saveSettings(patch) { Object.assign(SETTINGS, patch); if (NUVEM.on) NUVEM.saveSettings(Object.assign({}, SETTINGS)); else store.set(SETTINGS_KEY, SETTINGS); }

/* ---------- inventário: entregas (lotes) dos agricultores ----------
   Cada lote: { id, farmer, product, qty, sold, harvest:'AAAA-MM-DD', cold, lab, transport:'proprio'|'recolha', pickup, created }.
   O stock de um produto é o que falta vender em todos os lotes. Produtos sem lotes não controlam stock (como antes). */
const LOTS_KEY = 'daqui-lotes';
const LOTS = [];
const isoDay = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const newLotId = () => 'L-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
/* sem base de dados: na primeira visita cada agricultor "entregou" 100 de cada produto que vende, com a data de colheita que o produto já tinha */
function seedLots() {
  const out = [];
  PRODUCTS.filter(p => p.cat !== 'caixas').forEach(p => {
    const h = harvestOf(p) || (p.harvest == null ? addDays(today(), -3) : null) || addDays(today(), -3);
    farmersOf(p).forEach(fid => out.push({ id: newLotId(), farmer: fid, product: p.id, qty: 100, sold: 0, harvest: isoDay(h), cold: isStored(p), lab: false, transport: 'proprio', pickup: null, created: nowISO() }));
  });
  return out;
}
function loadLocalLots() { const s = store.get(LOTS_KEY, null); fill2(LOTS, Array.isArray(s) ? s : seedLots()); if (!Array.isArray(s)) store.set(LOTS_KEY, LOTS); }
const fill2 = (arr, items) => { arr.length = 0; items.forEach(x => arr.push(x)); };
const saveLotsLocal = () => store.set(LOTS_KEY, LOTS);
const lotsOf = (pid, fid) => LOTS.filter(l => l.product === pid && (!fid || l.farmer === fid));
const lotLeft = l => Math.max(0, round2(l.qty - (l.sold || 0)));
const tracksStock = p => !!p && p.cat !== 'caixas' && lotsOf(p.id).length > 0;
const stockOf = p => (tracksStock(p) ? round2(lotsOf(p.id).reduce((a, l) => a + lotLeft(l), 0)) : Infinity);
const inCart = id => cart.filter(i => i.id === id).reduce((a, i) => a + i.qty, 0);
/* colheita mais recente de um produto (ou só de um agricultor); null se não houver lotes */
function latestHarvest(pid, fid) {
  const ls = lotsOf(pid, fid).filter(l => l.harvest); if (!ls.length) return null;
  const s = ls.map(l => l.harvest).sort().pop(); return parseISO(s);
}
function saveLot(l) {
  const i = LOTS.findIndex(x => x.id === l.id); if (i >= 0) LOTS[i] = l; else LOTS.push(l);
  if (NUVEM.on) return NUVEM.saveLot(l); saveLotsLocal(); return Promise.resolve();
}
function deleteLot(id) { const i = LOTS.findIndex(x => x.id === id); if (i >= 0) LOTS.splice(i, 1); if (NUVEM.on) return NUVEM.deleteLot(id); saveLotsLocal(); return Promise.resolve(); }
/* sem base de dados: tira dos lotes mais antigos (o Supabase faz o mesmo no trigger daqui_encomenda_stock) */
function takeStockLocal(items) {
  const used = [];
  for (const it of items) {
    const p = P(it.id); if (!tracksStock(p)) continue;
    let left = +it.qty;
    if (stockOf(p) < left) throw Object.assign(new Error('stock'), { stock: { product: p.id, left: stockOf(p) } });
    for (const l of lotsOf(p.id).slice().sort((a, b) => (a.harvest + a.created).localeCompare(b.harvest + b.created))) {
      if (left <= 0) break; const take = Math.min(left, lotLeft(l)); if (take <= 0) continue;
      l.sold = round2((l.sold || 0) + take); left = round2(left - take); used.push({ lote: l.id, qtd: take });
    }
  }
  saveLotsLocal(); return used;
}
function giveBackLocal(used) { (used || []).forEach(u => { const l = LOTS.find(x => x.id === u.lote); if (l) l.sold = Math.max(0, round2((l.sold || 0) - u.qtd)); }); saveLotsLocal(); }
/* o cabaz pede mais do que há? devolve [{ p, want, left }] */
function cartStockProblems() {
  const want = {}; cart.forEach(i => { const p = P(i.id); if (tracksStock(p)) want[p.id] = round2((want[p.id] || 0) + i.qty); });
  return Object.entries(want).map(([id, w]) => ({ p: P(id), want: w, left: stockOf(P(id)) })).filter(x => x.want > x.left);
}
const stockText = (p, n) => (byKg(p) ? `${numFmt(n)} kg` : `${numFmt(n)} ${unitWord(p.unit, n)}`);
const unitWord = (u, n) => ({ un: T(n === 1 ? 'unidade' : 'unidades', n === 1 ? 'unit' : 'units'), molho: T(n === 1 ? 'molho' : 'molhos', n === 1 ? 'bunch' : 'bunches'), cuv: T(n === 1 ? 'cuvete' : 'cuvetes', n === 1 ? 'punnet' : 'punnets'), kg: 'kg' })[u] || u;

/* ---------- avaliações de produtos e caixas ---------- */
const PREV_KEY = 'daqui-avaliacoes-produtos';
const PRODUCT_REVIEWS = [];
const reviewsOf = pid => PRODUCT_REVIEWS.filter(r => r.product === pid).sort((a, b) => String(b.at).localeCompare(String(a.at)));
/* pode avaliar: comprou e já recebeu (encomenda entregue/levantada) e ainda não avaliou */
function boughtAndReceived(u, pid) {
  if (!u) return false;
  return ORDERS.some(o => (o.user === u.username || (u._id && o._uid === u._id)) && o.status !== 'cancelada' && o.items.some(i => i.id === pid) && orderStage(o) >= 3);
}
const myReview = (u, pid) => PRODUCT_REVIEWS.find(r => r.product === pid && (NUVEM.on ? r.mine : r.user === (u && u.username)));
async function addReview(pid, stars, comment) {
  const u = currentUser(); if (!u) return;
  const r = { id: 'R' + Date.now().toString(36), product: pid, user: u.username, name: firstName(u.name), stars, comment: comment.trim().slice(0, 600), at: nowISO(), mine: true, reply: null };
  PRODUCT_REVIEWS.unshift(r);
  if (NUVEM.on) return NUVEM.addReview(pid, stars, r.comment);
  store.set(PREV_KEY, PRODUCT_REVIEWS);
}
function replyReview(id, text) {
  const r = PRODUCT_REVIEWS.find(x => String(x.id) === String(id)); if (!r) return;
  r.reply = text.trim() ? { text: text.trim().slice(0, 600), at: nowISO() } : null;
  if (NUVEM.on) return NUVEM.replyReview(r.id, text.trim());
  store.set(PREV_KEY, PRODUCT_REVIEWS);
  if (r.reply) pushNotifLocal(r.user, T('A Daqui respondeu à sua avaliação', 'Daqui replied to your review'), r.reply.text, 'produtos/' + r.product);
}
const reviewAvg = pid => { const rs = reviewsOf(pid); return rs.length ? rs.reduce((a, r) => a + r.stars, 0) / rs.length : 0; };

/* ---------- Saldo Daqui, Cooperativa, promoções e notificações ---------- */
const WALLET_KEY = 'daqui-movimentos', PROMOS_KEY = 'daqui-promocoes', CLAIMS_KEY = 'daqui-promos-reclamadas', NOTIFS_KEY = 'daqui-notificacoes', PREPS_KEY = 'daqui-preparacoes';
const WALLET = [], PROMOS = [], CLAIMS = [], NOTIFS = [], PREPS = [];
const PAY_METHODS = () => [['mbway', 'MB WAY'], ['multibanco', T('Referência Multibanco', 'Multibanco reference')], ['cartao', T('Cartão', 'Card')]];
const payName = m => ({ mbway: 'MB WAY', multibanco: 'Multibanco', mb: 'Multibanco', cartao: T('Cartão', 'Card'), saldo: T('Saldo Daqui', 'Daqui balance'), entrega: T('Na entrega', 'On delivery') })[m] || m || '';
const uidOf = u => (u ? (NUVEM.on ? u._id : u.username) : null);
const walletOf = u => WALLET.filter(m => m.user === uidOf(u)).sort((a, b) => String(b.at).localeCompare(String(a.at)));
const balanceOf = u => round2(walletOf(u).reduce((a, m) => a + m.balance, 0));
const isMember = u => !!(u && u.coopUntil && parseISO(u.coopUntil) >= today());
function addMovLocal(u, m) { WALLET.push(Object.assign({ id: 'M' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), user: uidOf(u), at: nowISO(), ref: '', method: '' }, m)); store.set(WALLET_KEY, WALLET); }
async function topUp(value, method) {
  const u = currentUser(); value = round2(+value);
  if (!(value >= 5 && value <= 500)) throw new Error(T('O carregamento tem de ser entre 5 € e 500 €.', 'Top-ups must be between €5 and €500.'));
  if (NUVEM.on) { await NUVEM.topUp(value, method); WALLET.push({ id: 'tmp', user: u._id, kind: 'carregamento', desc: 'Carregamento do Saldo Daqui', value, balance: value, method, at: nowISO() }); return; }
  addMovLocal(u, { kind: 'carregamento', desc: 'Carregamento do Saldo Daqui', value, balance: value, method });
}
async function payCoop(method) {
  const u = currentUser(), fee = +SETTINGS.coopFee;
  if (method === 'saldo' && balanceOf(u) < fee) throw new Error(T('Não tem saldo suficiente.', 'Not enough balance.'));
  const start = u.coopUntil && parseISO(u.coopUntil) > today() ? parseISO(u.coopUntil) : today(), end = new Date(start.getFullYear() + 1, start.getMonth(), start.getDate(), 12);
  if (NUVEM.on) { const d = await NUVEM.payCoop(method); u.coopUntil = d; return; }
  addMovLocal(u, { kind: 'quota', desc: 'Quota anual da Cooperativa Daqui', value: fee, balance: method === 'saldo' ? -fee : 0, method, ref: `${isoDay(start)}/${isoDay(end)}` });
  u.coopUntil = isoDay(end); saveUsers();
}

/* promoções: { id, title{pt,en}, text{pt,en}, kind:'percent'|'valor'|'portes', value, min, until:'AAAA-MM-DD', code, public, active } */
const promoValid = p => !!p && p.active !== false && parseISO(p.until) >= today();
const claimOf = (u, pid) => CLAIMS.find(c => c.promo === pid && c.user === uidOf(u));
const myPromos = u => CLAIMS.filter(c => c.user === uidOf(u)).map(c => ({ c, p: PROMOS.find(x => x.id === c.promo) })).filter(x => x.p);
const usablePromos = u => myPromos(u).filter(x => !x.c.used && promoValid(x.p)).map(x => x.p);
const promoLabel = p => (p.kind === 'percent' ? `-${numFmt(p.value)}%` : p.kind === 'valor' ? `-${money(p.value)}` : T('Portes grátis', 'Free delivery'));
async function claimPromo(id, code) {
  const u = currentUser(); if (!u) return null;
  if (NUVEM.on) {
    try { const pid = await NUVEM.claimPromo(id, code); if (!CLAIMS.some(c => c.promo === pid && c.user === u._id)) CLAIMS.push({ promo: pid, user: u._id, at: nowISO(), used: null }); return pid; }
    catch (e) { throw new Error(/expirada/.test(e.message) ? T('Esta promoção já terminou.', 'This promotion has ended.') : T('Código inválido.', 'Invalid code.')); }
  }
  const p = code ? PROMOS.find(x => x.code && x.code.toUpperCase() === code.trim().toUpperCase()) : PROMOS.find(x => x.id === id && x.public);
  if (!p || p.active === false) throw new Error(T('Código inválido.', 'Invalid code.'));
  if (!promoValid(p)) throw new Error(T('Esta promoção já terminou.', 'This promotion has ended.'));
  if (!claimOf(u, p.id)) { CLAIMS.push({ promo: p.id, user: u.username, at: nowISO(), used: null }); store.set(CLAIMS_KEY, CLAIMS); }
  return p.id;
}
function savePromo(p) {
  const i = PROMOS.findIndex(x => x.id === p.id), isNew = i < 0; if (isNew) PROMOS.unshift(p); else PROMOS[i] = p;
  if (NUVEM.on) return NUVEM.savePromo(p);
  store.set(PROMOS_KEY, PROMOS);
  if (isNew && p.public) Object.values(USERS).filter(x => x.role === 'cliente').forEach(x => pushNotifLocal(x.username, L(p.title), L(p.text), 'notificacoes', p.id));
}
const newPromoCode = () => 'DAQUI-' + Math.random().toString(36).slice(2, 7).toUpperCase();

/* notificações (sininho): { id, user, title{pt,en}, text{pt,en}, route, promo, read, at } */
const myNotifs = u => (NUVEM.on ? NOTIFS.slice() : NOTIFS.filter(n => n.user === (u && u.username))).sort((a, b) => String(b.at).localeCompare(String(a.at)));
const unreadNotifs = u => myNotifs(u).filter(n => !n.read).length;
function pushNotifLocal(user, title, text, route, promo) {
  if (NUVEM.on || !user) return;
  NOTIFS.unshift({ id: 'N' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), user, title: { pt: title, en: title }, text: { pt: text || '', en: text || '' }, route: route || '', promo: promo || null, read: false, at: nowISO() });
  NOTIFS.splice(200); store.set(NOTIFS_KEY, NOTIFS);
}
function readNotifs(u) { const ids = myNotifs(u).filter(n => !n.read).map(n => n.id); myNotifs(u).forEach(n => { n.read = true; }); if (NUVEM.on) NUVEM.readNotifs(ids); else store.set(NOTIFS_KEY, NOTIFS); }
function deleteNotif(id) { const i = NOTIFS.findIndex(n => String(n.id) === String(id)); if (i >= 0) NOTIFS.splice(i, 1); if (NUVEM.on) NUVEM.deleteNotif(id); else store.set(NOTIFS_KEY, NOTIFS); }

/* ---------- preços: caixas de cartão, portes, promoção e saldo ---------- */
const UNIT_KG = { kg: 1, un: 0.5, molho: 0.25, cuv: 0.25 };
const itemKg = i => { const p = P(i.id); if (!p) return 0; if (p.cat === 'caixas') return (+i.opts?.kg || +i.kg || 0) * (i.qty || 1); return (UNIT_KG[p.unit] || 0.5) * i.qty; };
/* caixas de cartão Daqui: 5 kg a 0,85 € e 10 kg a 1,00 €; usa sempre a combinação mais barata
   (duas de 5 kg custam 1,70 €, mais do que uma de 10 kg: por isso, acima de 5 kg de resto usa-se uma de 10 kg) */
const BOX5 = 0.85, BOX10 = 1.00;
function cardboard(kg) {
  kg = Math.max(0, +kg || 0); if (!kg) return { n5: 0, n10: 0, fee: 0, kg: 0 };
  let n10 = Math.floor(kg / 10), r = round2(kg - n10 * 10), n5 = 0;
  if (r > 5) n10++; else if (r > 0) n5 = 1;
  return { n5, n10, fee: round2(n5 * BOX5 + n10 * BOX10), kg: round2(kg) };
}
const cardboardText = c => [c.n10 ? `${c.n10} × 10 kg` : '', c.n5 ? `${c.n5} × 5 kg` : ''].filter(Boolean).join(' + ');
/* portes: casa ou ponto de recolha; grátis acima do valor definido pela gestão, para membros da Cooperativa ou com promoção de portes */
function shippingFor(where, sub, u, promo) {
  const base = where === 'home' ? +SETTINGS.homeFee : +SETTINGS.pointFee;
  if (sub >= +SETTINGS.freeFrom) return { fee: 0, why: 'min', base };
  if (SETTINGS.coopFreeShipping && isMember(u)) return { fee: 0, why: 'coop', base };
  if (promo && promo.kind === 'portes' && sub >= (promo.min || 0)) return { fee: 0, why: 'promo', base };
  return { fee: round2(base), why: '', base };
}
const feeText = where => money(where === 'home' ? SETTINGS.homeFee : SETTINGS.pointFee);
/* total de uma compra: { sub, boxes:{…}, ship:{…}, discount, total, balanceUsed, toPay } */
function quote(items, where, u, promo, useBalance) {
  const sub = round2(items.reduce((s, i) => s + i.price * i.qty, 0));
  const boxes = cardboard(items.reduce((s, i) => s + itemKg(i), 0));
  const ok = promo && promoValid(promo) && sub >= (promo.min || 0) ? promo : null;
  const ship = shippingFor(where, sub, u, ok);
  const discount = !ok ? 0 : ok.kind === 'percent' ? round2(sub * ok.value / 100) : ok.kind === 'valor' ? round2(Math.min(sub, ok.value)) : 0;
  const total = round2(Math.max(0, sub - discount) + boxes.fee + ship.fee);
  const balanceUsed = useBalance && u ? round2(Math.min(total, Math.max(0, balanceOf(u)))) : 0;
  return { sub, boxes, ship, discount, promo: ok, total, balanceUsed, toPay: round2(total - balanceUsed) };
}

/* ---------- caixas preparadas (gestão, no dia antes da entrega) ---------- */
const prepOf = (subId, date) => PREPS.find(p => p.sub === subId && p.date === date);
function savePrep(p) {
  const i = PREPS.findIndex(x => x.id === p.id), old = i >= 0 ? PREPS[i] : null;
  if (!NUVEM.on) { if (old) giveBackLocal(old.lots); p.lots = takeStockLocal(p.items); }
  if (i >= 0) PREPS[i] = p; else PREPS.push(p);
  if (NUVEM.on) return NUVEM.savePrep(p);
  store.set(PREPS_KEY, PREPS); return Promise.resolve();
}
function deletePrep(id) { const i = PREPS.findIndex(x => x.id === id); if (i < 0) return; if (!NUVEM.on) giveBackLocal(PREPS[i].lots); PREPS.splice(i, 1); if (NUVEM.on) return NUVEM.deletePrep(id); store.set(PREPS_KEY, PREPS); }
/* meses que faltam para o produto sair de época (0 = último mês) */
function seasonLeft(p) { if (!p.season) return 12; const [, b] = p.season; return (b - NOW_M + 12) % 12; }
/* sugestão de conteúdo: favoritos primeiro, nunca os "prefiro não receber", só com stock, colheitas mais antigas e
   produtos a sair de época primeiro; o peso da caixa é dividido pelos produtos escolhidos */
function suggestBox(box, size, u, exclude = []) {
  const sz = (BOX_SIZES[box.id] || []).find(z => z.s === size) || (BOX_SIZES[box.id] || [])[0] || { kg: 5 };
  const favs = new Set((u && u.favs) || []), no = new Set([...((u && u.exclude) || []), ...exclude]);
  let pool = box.mode === 'favoritos' ? [...new Set([...favs, ...boxProducts(box).map(p => p.id)])].map(P).filter(Boolean) : boxProducts(box);
  pool = pool.filter(p => p.cat !== 'caixas' && !no.has(p.id) && available(p) && stockOf(p) > 0);
  const age = p => { const ls = lotsOf(p.id).filter(l => lotLeft(l) > 0); return ls.length ? (today() - parseISO(ls.map(l => l.harvest).sort()[0])) / 864e5 : 0; };
  const score = p => (favs.has(p.id) ? 100 : 0) + Math.min(60, age(p) * 2) + (12 - seasonLeft(p)) * 3;
  pool.sort((a, b) => score(b) - score(a));
  const n = Math.max(3, Math.min(pool.length, Math.round(sz.kg / 1.2)));
  const pick = pool.slice(0, n);
  const per = Math.max(0.5, Math.round((sz.kg / Math.max(1, pick.length)) * 2) / 2);
  return pick.map(p => ({ id: p.id, qty: byKg(p) ? Math.min(per, stockOf(p)) : Math.max(1, Math.min(Math.round(per / (UNIT_KG[p.unit] || 0.5)), stockOf(p))), why: [favs.has(p.id) ? 'fav' : '', age(p) > 10 ? 'old' : '', seasonLeft(p) === 0 ? 'season' : ''].filter(Boolean) }));
}

/* ---------- arranque sem base de dados ---------- */
function loadLocalExtras() {
  loadLocalLots();
  fill2(PRODUCT_REVIEWS, store.get(PREV_KEY, []));
  fill2(WALLET, store.get(WALLET_KEY, []));
  fill2(PROMOS, store.get(PROMOS_KEY, null) || [{ id: 'PR-BEMVINDO', title: { pt: 'Bem-vindo à Daqui: 10% na primeira encomenda', en: 'Welcome to Daqui: 10% off your first order' }, text: { pt: 'Reclame no sininho e use até ao fim do mês.', en: 'Claim it from the bell and use it by the end of the month.' }, kind: 'percent', value: 10, min: 15, until: isoDay(new Date(today().getFullYear(), today().getMonth() + 1, 0, 12)), code: 'BEMVINDO10', public: true, active: true, created: nowISO() }]);
  fill2(CLAIMS, store.get(CLAIMS_KEY, []));
  fill2(NOTIFS, store.get(NOTIFS_KEY, []));
  fill2(PREPS, store.get(PREPS_KEY, []));
}
