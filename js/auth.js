/* ===== Daqui — contas, encomendas e pedidos =====
   Dois modos (ver LEIA-ME.md):
   - LOCAL: sem base de dados, tudo fica no localStorage deste navegador (também no OnionShare);
   - SUPABASE: com js/supabase-config.js preenchido, js/nuvem.js carrega e grava tudo na base de dados.
   As funções saveUsers/saveOrders/saveRequests, signIn, register e signOut escolhem o modo sozinhas. */

/* SHA-256 em JavaScript puro (funciona também fora de HTTPS, ex.: ficheiro local ou .onion) */
function sha256(str) {
  const utf8 = unescape(encodeURIComponent(str));
  const rr = (v, a) => (v >>> a) | (v << (32 - a));
  const K = [], H = [], comp = {};
  for (let c = 2, n = 0; n < 64; c++) {
    if (!comp[c]) { for (let i = 0; i < 313; i += c) comp[i] = c; H[n] = (Math.pow(c, .5) * 4294967296) | 0; K[n++] = (Math.pow(c, 1 / 3) * 4294967296) | 0; }
  }
  let hash = H.slice(0, 8); const words = [];
  let s = utf8 + '\x80'; while (s.length % 64 - 56) s += '\x00';
  for (let i = 0; i < s.length; i++) words[i >> 2] |= s.charCodeAt(i) << ((3 - i) % 4) * 8;
  words[words.length] = ((utf8.length * 8) / 4294967296) | 0; words[words.length] = (utf8.length * 8) | 0;
  for (let j = 0; j < words.length;) {
    const w = words.slice(j, j += 16), old = hash; hash = hash.slice(0, 8);
    for (let i = 0; i < 64; i++) {
      const w15 = w[i - 15], w2 = w[i - 2], a = hash[0], e = hash[4];
      const t1 = hash[7] + (rr(e, 6) ^ rr(e, 11) ^ rr(e, 25)) + ((e & hash[5]) ^ (~e & hash[6])) + K[i]
        + (w[i] = i < 16 ? w[i] : (w[i - 16] + (rr(w15, 7) ^ rr(w15, 18) ^ (w15 >>> 3)) + w[i - 7] + (rr(w2, 17) ^ rr(w2, 19) ^ (w2 >>> 10))) | 0);
      const t2 = (rr(a, 2) ^ rr(a, 13) ^ rr(a, 22)) + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
      hash = [(t1 + t2) | 0].concat(hash); hash[4] = (hash[4] + t1) | 0; hash.length = 8;
    }
    hash = hash.map((x, i) => (x + old[i]) | 0);
  }
  return hash.map(x => (x >>> 0).toString(16).padStart(8, '0')).join('');
}

const AUTH_KEY = 'daqui-users', SESSION_KEY = 'daqui-session';
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
  del(k) { try { localStorage.removeItem(k); } catch (e) {} }
};
const normPhone = s => { let d = String(s || '').replace(/\D/g, ''); if (d.length === 12 && d.startsWith('351')) d = d.slice(3); return d; };
const newSalt = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
const hashPass = (salt, pass) => sha256(salt + ':' + pass);

function makeUser(name, username, phone, pass, extra = {}) {
  const salt = newSalt();
  return Object.assign({ name, username: username.toLowerCase(), phone: normPhone(phone), email: '', salt, hash: hashPass(salt, pass), role: 'cliente', created: new Date().toISOString().slice(0, 10), subs: [], harvests: [], notify: [], favs: [], exclude: [], address: null }, extra);
}
/* pessoas de contacto dos restaurantes parceiros (as dos agricultores estão em FARMERS) */
const PARTNER_PEOPLE = { 'mesa-da-ria': 'Carla Neves', 'tasca-da-horta': 'Sofia Marques', 'moliceiro-verde': 'Tiago Lopes', 'sal-e-campo': 'Inês Barros', 'fonte-nova': 'Pedro Faria', 'cantina-do-parque': 'Marta Simões', 'cafe-campus': 'Hugo Rebelo', 'estacao-74': 'Beatriz Lima' };
const SEED_DOMAIN = 'contas.daqui.pt';   // e-mail das contas de demonstração na base de dados: <utilizador>@contas.daqui.pt
/* contas de demonstração: 3 clientes, a gestão, uma conta por agricultor (agr.<id>) e uma por restaurante (rest.<id>).
   ferramentas/gerar-sql.js usa esta lista para criar as mesmas contas na base de dados (supabase/03-contas.sql). */
function seedAccounts() {
  const list = [
    { name: 'Maria Silva', username: 'maria', phone: '912 345 678', pass: 'daqui2026', extra: {
      subs: [{ id: 's-maria-1', box: 'caixa-mista', size: 'P', kg: 4, freq: 'sem', day: 'qui', deliver: 'pickup', point: 'Aveiro, Rossio', discovery: true, pay: 'mbway', locked: 11.50, start: '2026-06-10', first: '2026-06-11', status: 'ativa' }],
      harvests: [{ day: '2026-11-28-luis', date: '2026-11-28', people: 2 }], notify: ['cereja'], favs: ['pera-rocha', 'laranja', 'alho-frances'], exclude: ['beterraba'], address: { street: 'Rua do Carmo 21, 2.º Esq.', postal: '3800-127', town: 'Aveiro' } } },
    { name: 'João Costa', username: 'joao', phone: '913 222 111', pass: 'daqui2026', extra: {
      subs: [{ id: 's-joao-1', box: 'caixa-fruta', size: 'M', kg: 5, freq: 'quinz', day: 'sab', deliver: 'home', address: 'Rua do Campo 12, 3810 Aveiro', discovery: true, pay: 'mb', locked: 14.50, start: '2026-03-02', first: '2026-03-07', status: 'ativa' }],
      harvests: [{ date: '2026-11-28', people: 4 }, { date: '2026-12-05', people: 1 }] } },
    { name: 'Ana Rocha', username: 'anarocha', phone: '936 555 444', pass: 'daqui2026', extra: {
      subs: [{ id: 's-ana-1', box: 'caixa-legumes', size: 'G', kg: 8, freq: 'mens', day: 'qui', deliver: 'pickup', point: 'Ílhavo', discovery: false, pay: 'entrega', locked: 16.90, start: '2026-09-01', first: '2026-09-03', status: 'pausada' }],
      harvests: [{ date: '2026-12-12', people: 3 }], exclude: ['nabo'] } },
    { name: 'Equipa Daqui', username: 'gestao', phone: '234 000 000', pass: 'gestao2026', extra: { role: 'admin' } }
  ];
  FARMERS.filter(f => !f.isNew).forEach((f, i) => list.push({ name: f.name, username: 'agr.' + f.id, phone: '914 000 ' + (101 + i), pass: 'daqui2026',
    extra: { role: 'agricultor', partner: { kind: 'agricultor', farmerId: f.id, farm: f.farm, place: f.place, region: f.region, approved: true } } }));
  RESTAURANTS.filter(r => !r.isNew).forEach((r, i) => list.push({ name: PARTNER_PEOPLE[r.id] || r.name, username: 'rest.' + r.id, phone: '234 000 ' + (101 + i), pass: 'daqui2026',
    extra: { role: 'restaurante', partner: { kind: 'restaurante', restId: r.id, name: r.name, place: 'Aveiro', approved: true } } }));
  return list;
}
const seedUser = a => makeUser(a.name, a.username, a.phone, a.pass, JSON.parse(JSON.stringify(a.extra)));
function seedUsers() { const o = {}; seedAccounts().forEach(a => { o[a.username] = seedUser(a); }); return o; }
let USERS = store.get(AUTH_KEY, null);
if (!USERS || typeof USERS !== 'object') { USERS = seedUsers(); store.set(AUTH_KEY, USERS); }
const saveUsers = () => (NUVEM.on ? NUVEM.syncUsers() : store.set(AUTH_KEY, USERS));

function findUser(login) {
  const l = String(login || '').trim().toLowerCase(); if (!l) return null;
  if (USERS[l]) return USERS[l];
  const ph = normPhone(l); if (ph.length < 9) return null;
  return Object.values(USERS).find(u => u.phone === ph) || null;
}
function currentUser() { const u = store.get(SESSION_KEY, null); return u && USERS[u] ? USERS[u] : null; }
function signIn(login, pass) { if (NUVEM.on) return NUVEM.signIn(login, pass); const u = findUser(login); if (!u || u.hash !== hashPass(u.salt, pass)) return null; store.set(SESSION_KEY, u.username); return u; }
function signOut() { if (NUVEM.on) NUVEM.signOut(); store.del(SESSION_KEY); }
/* devolve { erros: {campo: código} } ou { user } */
const validEmail = s => /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(String(s || '').trim());
/* verificações de formato comuns aos dois modos; devolve { campo: código } */
/* trocar a palavra-passe da conta com sessão iniciada: confirma a atual e grava a nova.
   Devolve '' quando corre bem, ou o motivo: 'cur' (atual errada), 'short', 'same', 'weak', 'session'. */
async function changePassword(cur, nw) {
  if (String(nw || '').length < 8) return 'short';
  if (nw === cur) return 'same';
  if (NUVEM.on) return NUVEM.changePassword(cur, nw);
  const u = currentUser(); if (!u) return 'session';
  if (u.hash !== hashPass(u.salt, cur)) return 'cur';
  u.salt = newSalt(); u.hash = hashPass(u.salt, nw); saveUsers(); return '';
}
function registerErrors({ name, username, phone, email, pass, pass2, role, farm, place, restName }, local = true) {
  const e = {}; const un = String(username || '').trim().toLowerCase(); const ph = normPhone(phone);
  if (!String(name || '').trim()) e.name = 'req';
  if (!/^[a-z0-9._-]{3,30}$/.test(un)) e.username = 'fmt'; else if (local && USERS[un]) e.username = 'taken';
  if (!/^[29]\d{8}$/.test(ph)) e.phone = 'fmt'; else if (local && Object.values(USERS).some(u => u.phone === ph)) e.phone = 'taken';
  if (!local && !validEmail(email)) e.email = 'fmt'; else if (local && email && !validEmail(email)) e.email = 'fmt';
  if (String(pass || '').length < 8) e.pass = 'short';
  if (pass !== pass2) e.pass2 = 'match';
  role = ['agricultor', 'restaurante'].includes(role) ? role : 'cliente';
  if (role === 'agricultor') { if (!String(farm || '').trim()) e.farm = 'req'; if (!String(place || '').trim()) e.place = 'req'; }
  if (role === 'restaurante') { if (!String(restName || '').trim()) e.restName = 'req'; if (!String(place || '').trim()) e.place = 'req'; }
  return e;
}
function partnerFromForm({ role, farm, place, region, crops, restName, kind }) {
  if (role === 'agricultor') return { kind: 'agricultor', farm: String(farm).trim(), place: String(place).trim(), region: REGIONS[region] ? region : 'aveiro', crops: String(crops || '').trim(), approved: false };
  if (role === 'restaurante') return { kind: 'restaurante', name: String(restName).trim(), place: String(place).trim(), kind2: String(kind || '').trim(), approved: false };
  return null;
}
function partnerRequest(u) {
  if (u.role === 'agricultor') addRequest('agricultor', { name: u.name, phone: u.phone, farm: u.partner.farm, town: u.partner.place, region: u.partner.region, crops: u.partner.crops }, { partnerUser: u.username });
  if (u.role === 'restaurante') addRequest('selo', { restaurant: u.partner.name, person: u.name, phone: u.phone, town: u.partner.place, kind: u.partner.kind2 }, { partnerUser: u.username });
}
/* devolve { errors: {campo: código} } ou { user }; com a base de dados devolve uma Promise com o mesmo */
function register(data) {
  data = Object.assign({}, data, { role: ['agricultor', 'restaurante'].includes(data.role) ? data.role : 'cliente' });
  if (NUVEM.on) return NUVEM.register(data);
  const e = registerErrors(data, true); if (Object.keys(e).length) return { errors: e };
  const un = String(data.username).trim().toLowerCase(), ph = normPhone(data.phone), role = data.role;
  const u = makeUser(String(data.name).trim(), un, ph, data.pass, { role, email: String(data.email || '').trim() });
  const partner = partnerFromForm(data); if (partner) u.partner = partner;
  USERS[un] = u; saveUsers(); store.set(SESSION_KEY, un);
  partnerRequest(u);
  return { user: u };
}

/* ---- subscrições ---- */
const DAY_NUM = { qui: 4, sab: 6 };
const FREQ_DAYS = { sem: 7, quinz: 14, mens: 28 };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const parseISO = s => new Date(s + 'T12:00:00');
function today() { const d = new Date(); d.setHours(12, 0, 0, 0); return d; }
function boxCurrentPrice(box, size) { const s = (BOX_SIZES[box] || []).find(x => x.s === size); return s ? s.price : 0; }
function firstDelivery(day, from = today()) { let d = addDays(from, 3); while (d.getDay() !== DAY_NUM[day]) d = addDays(d, 1); return d; }
function nextDelivery(sub) {
  let d = parseISO(sub.first); const t = today(); const step = FREQ_DAYS[sub.freq] || 7;
  while (d < t) d = addDays(d, step); return d;
}
/* Preço garantido: 12 meses a partir do início. Se o preço atual descer abaixo do guardado, o guardado passa a ser o mais baixo. */
function refreshSub(sub) {
  const cur = boxCurrentPrice(sub.box, sub.size); let changed = false;
  let lockEnd = addDays(parseISO(sub.start), 365);
  while (lockEnd <= today()) { sub.start = iso(lockEnd); sub.locked = cur; sub.lowered = false; lockEnd = addDays(lockEnd, 365); changed = true; }
  if (cur && cur < sub.locked) { sub.locked = cur; sub.lowered = true; changed = true; }
  return { changed, current: cur, lockEnd };
}
/* Colhe Connosco: pessoas inscritas num dia (id do dia) e lista de inscritos (só a gestão vê nomes) */
function harvestPeople(id) { if (NUVEM.on && !NUVEM.isAdmin()) return NUVEM.harvestPeople(id); const d = HD(id); if (!d) return 0; return Object.values(USERS).reduce((n, u) => n + (u.harvests || []).filter(h => hIs(h, d)).reduce((a, h) => a + (+h.people || 1), 0), 0); }
function harvestList(id) { const d = HD(id); if (!d) return []; return Object.values(USERS).flatMap(u => (u.harvests || []).filter(h => hIs(h, d)).map(h => ({ user: u, people: h.people }))); }

/* ---- dias de distribuição ---- */
function slotOptions(now = new Date()) {
  const out = [];
  for (let i = 1; i <= 16 && out.length < 3; i++) {
    const d = new Date(now); d.setDate(d.getDate() + i); d.setHours(12, 0, 0, 0);
    for (const [key, cfg] of Object.entries(DISTRIBUTION.days)) {
      if (d.getDay() !== cfg.dow) continue;
      const cut = new Date(d); cut.setDate(cut.getDate() - (cfg.dow - cfg.cutoff[0])); cut.setHours(cfg.cutoff[1], 0, 0, 0);
      if (now < cut) out.push({ date: iso(d), day: key, cutoff: cut });
    }
  }
  return out;
}

/* ---- encomendas e pedidos (guardados neste navegador) ---- */
const ORDERS_KEY = 'daqui-orders', REQ_KEY = 'daqui-requests';
const nowISO = () => new Date().toISOString();
function seedOrders() {
  const t = today(), past = n => { const d = addDays(t, -n); d.setHours(10, 30); return d; };
  const s1 = slotOptions(past(18))[0], s2 = slotOptions(past(1))[0], s3 = slotOptions(past(9))[0];
  const items = (...l) => l.map(([id, qty]) => { const p = PRODUCTS.find(x => x.id === id); return { id, qty, price: p.price }; });
  const mk = (num, user, name, phone, created, slot, deliver, it, extra = {}) => { const sub = it.reduce((s, i) => s + i.price * i.qty, 0), fee = deliver === 'home' ? DELIVERY_FEE : 0;
    return Object.assign({ num, user, name, phone, created: created.toISOString(), slot: slot.date, day: slot.day, deliver, window: deliver === 'home' ? '17h–21h' : '', point: deliver === 'pickup' ? 'Aveiro, Rossio' : '', address: deliver === 'home' ? 'Rua do Carmo 21, 2.º Esq., 3800-127 Aveiro' : '', items: it, subtotal: +sub.toFixed(2), fee, total: +(sub + fee).toFixed(2), pay: 'mbway', notes: '', status: 'ativa' }, extra); };
  return [
    mk('DQ104851', 'maria', 'Maria Silva', '912345678', past(18), s1, 'home', items(['pera-rocha', 2], ['maca-gala', 2], ['alface', 1], ['cenoura', 1], ['laranja', 3])),
    mk('DQ104858', 'joao', 'João Costa', '913222111', past(9), s3, 'pickup', items(['batata', 3], ['cebola', 1], ['couve-portuguesa', 1], ['kiwi', 1])),
    mk('DQ104866', 'maria', 'Maria Silva', '912345678', past(1), s2, 'home', items(['diospiro', 1], ['tangerina', 2], ['alho-frances', 1], ['castanha', 1]))
  ];
}
function seedRequests() {
  const ago = n => addDays(today(), -n).toISOString();
  return [
    { id: 'P-1001', type: 'incidencia', created: ago(15), status: 'tratado', user: 'maria', order: 'DQ104851', fields: { product: 'pera-rocha', what: 'Duas peras chegaram tocadas.', remedy: 'sub', photo: '' } },
    { id: 'P-1002', type: 'selo', created: ago(2), status: 'novo', user: null, fields: { restaurant: 'Taberna do Moliço', person: 'Rui Pinho', phone: '918765432', town: 'Ílhavo' } },
    { id: 'P-1003', type: 'agricultor', created: ago(1), status: 'novo', user: null, fields: { name: 'Carla Matos', phone: '965432100', town: 'Sever do Vouga', area: '1-5', crops: 'Mirtilo, kiwi' } },
    { id: 'P-1004', type: 'produto', created: ago(1), status: 'novo', user: 'agr.joaquim', partnerUser: 'agr.joaquim', fields: { productId: 'pera-rocha', namePt: 'Pera Rocha do Oeste', nameEn: 'Rocha pear from the Oeste', organic: 'sim' } },
    { id: 'P-1005', type: 'produto', created: ago(1), status: 'novo', user: 'agr.ines', partnerUser: 'agr.ines', fields: { namePt: 'Batata-doce biológica', nameEn: 'Organic sweet potato', cat: 'legumes', price: '1.99', unit: 'kg', season: '9-3', desc: 'Da Horta Viva, em Mira.', organic: 'sim' } }
  ];
}
let ORDERS = store.get(ORDERS_KEY, null); if (!Array.isArray(ORDERS)) { ORDERS = seedOrders(); store.set(ORDERS_KEY, ORDERS); }
let REQUESTS = store.get(REQ_KEY, null); if (!Array.isArray(REQUESTS)) { REQUESTS = seedRequests(); store.set(REQ_KEY, REQUESTS); }
const saveOrders = () => (NUVEM.on ? NUVEM.syncOrders() : store.set(ORDERS_KEY, ORDERS));
const saveRequests = () => (NUVEM.on ? NUVEM.syncRequests() : store.set(REQ_KEY, REQUESTS));
function resetDemo() {
  USERS = seedUsers(); saveUsers(); ORDERS = seedOrders(); saveOrders(); REQUESTS = seedRequests(); saveRequests();
}
/* atualizar dados guardados por versões anteriores do site (modo local) */
(() => {
  let ch = false;
  const rename = (from, to) => { const u = USERS[from]; if (!u || USERS[to]) return; u.username = to; USERS[to] = u; delete USERS[from];
    ORDERS.forEach(o => { if (o.user === from) o.user = to; }); REQUESTS.forEach(r => { if (r.user === from) r.user = to; if (r.partnerUser === from) r.partnerUser = to; }); saveOrders(); saveRequests(); ch = true; };
  if (USERS.joaquim?.partner?.farmerId === 'joaquim') rename('joaquim', 'agr.joaquim');
  if (USERS.mesadaria?.partner?.restId === 'mesa-da-ria') rename('mesadaria', 'rest.mesa-da-ria');
  if (store.get(SESSION_KEY, '') === 'joaquim' && USERS['agr.joaquim']) store.set(SESSION_KEY, 'agr.joaquim');
  if (store.get(SESSION_KEY, '') === 'mesadaria' && USERS['rest.mesa-da-ria']) store.set(SESSION_KEY, 'rest.mesa-da-ria');
  seedAccounts().forEach(a => { if (!USERS[a.username]) { USERS[a.username] = seedUser(a); ch = true; } });
  Object.values(USERS).forEach(u => {
    if (!Array.isArray(u.exclude)) { u.exclude = [...new Set((u.subs || []).flatMap(s => s.exclude || []))]; ch = true; }
    (u.subs || []).forEach(s => { if ('exclude' in s) { delete s.exclude; ch = true; } });
    if (!('favs' in u)) { u.favs = []; ch = true; }
  });
  if (ch) saveUsers();
})();
function newOrderNumber() { if (NUVEM.on) return NUVEM.newOrderNumber(); const max = ORDERS.reduce((m, o) => Math.max(m, +String(o.num).slice(2) || 0), 104866); return 'DQ' + (max + 1 + Math.floor(Math.random() * 3)); }
const normOrder = s => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
const findOrder = num => ORDERS.find(o => o.num === normOrder(num)) || null;
function orderStage(o, now = new Date()) {
  /* etapas: 0 Recebida, 1 Em preparação, 2 Preparada, 3 Em distribuição (no levantamento: pronta para levantar), 4 Entregue/Levantada, 5 Cancelada */
  if (o.status === 'cancelada') return 5;
  if (typeof o.stage === 'number') return o.stage;
  const slot = new Date(o.slot + 'T08:00:00'), prep = new Date(slot); prep.setDate(prep.getDate() - 1); const done = new Date(o.slot + 'T21:00:00');
  return now < prep ? 0 : now < slot ? 1 : now < done ? 3 : 4;
}
function addRequest(type, fields, extra = {}) {
  const max = REQUESTS.reduce((m, r) => Math.max(m, +String(r.id).slice(2) || 0), 1000);
  const r = Object.assign({ id: NUVEM.on ? NUVEM.newRequestId() : 'P-' + (max + 1), type, created: nowISO(), status: 'novo', user: (currentUser() || {}).username || null, fields }, extra);
  REQUESTS.push(r); saveRequests(); return r;
}
