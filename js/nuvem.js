/* ===== Daqui — ligação à base de dados Supabase ("modo nuvem") =====
   Só funciona com js/supabase-config.js preenchido. Sem isso (ou sem ligação, como no OnionShare), NUVEM.on fica
   false e o site usa os dados do navegador, como antes.

   Como funciona
   - Ao abrir uma página, NUVEM.start() lê o catálogo (produtos, agricultores, restaurantes, caixas, dias Colhe Connosco)
     e, com sessão iniciada, as contas, subscrições, inscrições, encomendas e pedidos que a pessoa pode ver
     (as regras de acesso estão na base de dados: cada conta vê o que é seu, a gestão vê tudo).
   - O resto do site continua a trabalhar com USERS, ORDERS, REQUESTS, PRODUCTS… Quando o código chama
     saveUsers(), saveOrders(), saveRequests() ou saveCatalog(), este ficheiro compara com o que veio da base de dados
     e envia só o que mudou.
   - Tempo real: o site recebe um aviso do Supabase sempre que uma tabela muda e volta a ler os dados;
     se o tempo real falhar, volta a ler de SUPABASE_ATUALIZAR_SEGUNDOS em SUPABASE_ATUALIZAR_SEGUNDOS segundos.
   - Não usa bibliotecas externas: fala diretamente com as APIs REST, Auth e Realtime do Supabase. */
const NUVEM = (() => {
  const BASE = (typeof SUPABASE_URL === 'string' ? SUPABASE_URL : '').trim().replace(/\/+$/, '');
  const KEY = (typeof SUPABASE_KEY === 'string' ? SUPABASE_KEY : '').trim();
  const POLL = Math.max(5, +(typeof SUPABASE_ATUALIZAR_SEGUNDOS !== 'undefined' ? SUPABASE_ATUALIZAR_SEGUNDOS : 30) || 30) * 1000;
  const SESS_KEY = 'daqui-nuvem-sessao', GUEST_KEY = 'daqui-encomendas-visitante';
    const N = { on: false, configured: /^https?:\/\//.test(BASE) && KEY.length > 20, live: false, error: '', failed: false };
  let sess = null, me = null, ocup = {}, ownAtLoad = {}, snap = {}, chain = Promise.resolve();

  /* ---------- pedidos HTTP ---------- */
  async function http(method, path, body, prefer, auth = true) {
    if (auth) await fresh();
    const h = { apikey: KEY, 'Content-Type': 'application/json' };
    if (auth && sess) h.Authorization = 'Bearer ' + sess.access_token;
    else if (/^eyJ/.test(KEY)) h.Authorization = 'Bearer ' + KEY;   // chave "anon" antiga (JWT); as chaves sb_publishable_ vão só no apikey
    if (prefer) h.Prefer = prefer;
    const r = await fetch(BASE + path, { method, headers: h, body: body === undefined ? undefined : JSON.stringify(body), keepalive: method !== 'GET' });   // keepalive: termina mesmo que a página mude
    const txt = await r.text(); let data = null;
    try { data = txt ? JSON.parse(txt) : null; } catch (e) { data = txt; }
    if (method !== 'GET' && r.ok) { const g = noteWrite(path); if (g.length) reloadGroups(g, 1200); }
    if (!r.ok) {
      if (method !== 'GET') noteWrite(path);
      const e = new Error((data && (data.message || data.msg || data.error_description || data.error)) || 'HTTP ' + r.status);
      e.status = r.status; e.code = data && (data.code || data.error_code || data.error); throw e;
    }
    return data;
  }
  const eq = v => 'eq.' + encodeURIComponent(v);
  const rest = (method, table, query, body, prefer) => http(method, `/rest/v1/${table}${query ? '?' + query : ''}`, body, prefer);
  const rpc = (fn, args) => http('POST', `/rest/v1/rpc/${fn}`, args);
  const authPost = (path, body) => http('POST', '/auth/v1/' + path, body, undefined, false);

  /* ---------- sessão ---------- */
  function setSession(d) {
    sess = { access_token: d.access_token, refresh_token: d.refresh_token, expires_at: d.expires_at || Math.floor(Date.now() / 1000) + (d.expires_in || 3600), user_id: d.user ? d.user.id : sess && sess.user_id };
    store.set(SESS_KEY, sess); rtToken();
  }
  function clearSession() { sess = null; me = null; store.del(SESS_KEY); store.del(SESSION_KEY); rtClose(); try { sessionStorage.removeItem('daqui-nuvem-copia'); sessionStorage.removeItem('daqui-nuvem-sujo'); } catch (e) {} }
  let refreshing = null;
  function refresh() {
    if (!sess) return Promise.resolve();
    if (!refreshing) refreshing = authPost('token?grant_type=refresh_token', { refresh_token: sess.refresh_token })
      .then(setSession, e => { if (e.status >= 400 && e.status < 500) clearSession(); else throw e; })
      .finally(() => { refreshing = null; });
    return refreshing;
  }
  async function fresh() { if (sess && sess.expires_at - 90 < Date.now() / 1000) await refresh(); }

  /* ---------- conversões base de dados <-> objetos do site ---------- */
  const BASE_IDS = { p: new Set(CATALOG_BASE.products.map(x => x.id)), f: new Set(CATALOG_BASE.farmers.map(x => x.id)), r: new Set(CATALOG_BASE.restaurants.map(x => x.id)) };
  const J = v => JSON.stringify(v);
  /* id do dia Colhe Connosco de uma inscrição (as antigas só tinham a data) */
  const hKey = h => h.day || (HARVEST_DAYS.find(d => d.date === h.date) || {}).id || h.date;
  const toProd = r => {
    const p = Object.assign({}, r.extra || {}, { id: r.id, cat: r.categoria, name: { pt: r.nome_pt, en: r.nome_en }, price: +r.preco, unit: r.unidade, farmer: r.agricultor,
      season: [r.epoca_inicio, r.epoca_fim], essential: !!r.essencial, organic: !!r.biologico, desc: { pt: r.desc_pt || '', en: r.desc_en || '' } });
    if (r.desenho) p.art = r.desenho;
    if (r.colheita != null && r.colheita !== '') p.harvest = /^\d+$/.test(r.colheita) ? +r.colheita : r.colheita;
    if (r.icone) p.icon = r.icone;
    if (r.foto) p.photo = r.foto;
    if (r.fora_stock) p.outOfStock = true;
    if (Array.isArray(r.divisao)) p.split = r.divisao;
    if (Array.isArray(r.produtores) && r.produtores.length) p.producers = r.produtores.map(o => ({ farmer: o.farmer, organic: !!o.organic, outOfStock: !!o.outOfStock }));
    if (Array.isArray(r.aliases) && r.aliases.length) p.aliases = r.aliases;
    if (!BASE_IDS.p.has(r.id)) p.isNew = true;
    return p;
  };
  const offersRow = v => (Array.isArray(v) && v.length ? v.map(o => ({ farmer: o.farmer, organic: !!o.organic, outOfStock: !!o.outOfStock })) : null);
  const fromProd = (p, ordem) => ({ id: p.id, categoria: p.cat, nome_pt: p.name.pt, nome_en: p.name.en || p.name.pt, preco: +p.price, unidade: p.unit || 'kg', agricultor: p.farmer || null,
    desenho: p.art || null, icone: p.icon || null, epoca_inicio: p.season[0], epoca_fim: p.season[1], colheita: p.harvest == null ? null : String(p.harvest),
    essencial: !!p.essential, biologico: !!p.organic, fora_stock: !!p.outOfStock, divisao: p.split || null, foto: p.photo || null, desc_pt: (p.desc || {}).pt || '', desc_en: (p.desc || {}).en || '', ordem,
    produtores: offersRow(p.producers) || (p.farmer ? [{ farmer: p.farmer, organic: !!p.organic, outOfStock: !!p.outOfStock }] : []), aliases: p.aliases || [] });
  const PROD_PATCH = { price: v => ({ preco: +v }), season: v => ({ epoca_inicio: v[0], epoca_fim: v[1] }), split: v => ({ divisao: v || null }), outOfStock: v => ({ fora_stock: !!v }),
    name: v => ({ nome_pt: v.pt, nome_en: v.en }), desc: v => ({ desc_pt: v.pt, desc_en: v.en }), unit: v => ({ unidade: v }), farmer: v => ({ agricultor: v }), icon: v => ({ icone: v || null }),
    essential: v => ({ essencial: !!v }), organic: v => ({ biologico: !!v }), harvest: v => ({ colheita: v == null ? null : String(v) }), art: v => ({ desenho: v || null }), cat: v => ({ categoria: v }),
    producers: v => ({ produtores: offersRow(v) || [] }), photo: v => ({ foto: v || null }), aliases: v => ({ aliases: v || [] }) };
  const toFarmer = r => Object.assign({}, r.extra || {}, { id: r.id, name: r.nome, farm: r.quinta, place: r.localidade, region: r.regiao, lat: r.lat, lon: r.lon, since: r.desde,
    crop: r.cultura, seed: r.semente, story: { pt: r.historia_pt || '', en: r.historia_en || '' } }, BASE_IDS.f.has(r.id) ? {} : { isNew: true });
  const fromFarmer = (f, ordem) => ({ id: f.id, nome: f.name, quinta: f.farm, localidade: f.place || '', regiao: f.region || 'aveiro', lat: f.lat, lon: f.lon, desde: f.since || null,
    cultura: f.crop || null, semente: f.seed || 0, historia_pt: (f.story || {}).pt || '', historia_en: (f.story || {}).en || '', extra: farmExtra(f).extra, ordem });
  const FARMER_PATCH = { name: v => ({ nome: v }), farm: v => ({ quinta: v }), place: v => ({ localidade: v }), story: v => ({ historia_pt: v.pt || '', historia_en: v.en || '' }), region: v => ({ regiao: v }), lat: v => ({ lat: v }), lon: v => ({ lon: v }),
    since: v => ({ desde: v ? +v : null }), cover: (v, f) => farmExtra(f), island: (v, f) => farmExtra(f) };
  const farmExtra = f => ({ extra: Object.assign({}, f && f.island ? { island: f.island } : {}, f && f.cover ? { cover: f.cover } : {}) });
  const restExtra = r => ({ extra: Object.assign({}, r && r.cuisine ? { cuisine: r.cuisine } : {}, r && r.dishVeg ? { dishVeg: true } : {}, r && r.dishVegan ? { dishVegan: true } : {}) });
  const toRest = r => Object.assign({}, r.extra || {}, { id: r.id, name: r.nome, lat: r.lat, lon: r.lon, kind: { pt: r.tipo_pt, en: r.tipo_en }, area: { pt: r.zona_pt, en: r.zona_en },
    dish: { pt: r.prato_pt, en: r.prato_en }, since: r.desde, dishes: r.pratos || [] }, BASE_IDS.r.has(r.id) ? {} : { isNew: true });
  const bi = (o, k) => (o || {})[k] || '';
  const fromRest = (r, ordem) => ({ id: r.id, nome: r.name, lat: r.lat, lon: r.lon, tipo_pt: bi(r.kind, 'pt'), tipo_en: bi(r.kind, 'en'), zona_pt: bi(r.area, 'pt'), zona_en: bi(r.area, 'en'),
    prato_pt: bi(r.dish, 'pt'), prato_en: bi(r.dish, 'en'), desde: r.since || null, pratos: r.dishes || [], extra: restExtra(r).extra, ordem });
  const REST_PATCH = { name: v => ({ nome: v }), kind: v => ({ tipo_pt: bi(v, 'pt'), tipo_en: bi(v, 'en') }), area: v => ({ zona_pt: bi(v, 'pt'), zona_en: bi(v, 'en') }),
    dish: v => ({ prato_pt: bi(v, 'pt'), prato_en: bi(v, 'en') }), dishes: v => ({ pratos: v || [] }), since: v => ({ desde: v }), lat: v => ({ lat: v }), lon: v => ({ lon: v }), cuisine: (v, r) => restExtra(r), dishVeg: (v, r) => restExtra(r), dishVegan: (v, r) => restExtra(r) };
  const toDay = r => ({ id: r.id || `${r.dia}-${r.agricultor}`, date: r.dia, farmer: r.agricultor, crop: r.cultura, what: { pt: r.produto_pt, en: r.produto_en }, time: r.horario, spots: r.lugares });
  const fromDay = d => ({ id: d.id || `${d.date}-${d.farmer}`, dia: d.date, agricultor: d.farmer, cultura: d.crop || null, produto_pt: (d.what || {}).pt || '', produto_en: (d.what || {}).en || '', horario: d.time, lugares: +d.spots });
  const mapPatch = (o, map, cur) => Object.entries(o).reduce((acc, [k, v]) => (map[k] ? Object.assign(acc, map[k](v, cur)) : acc), {});

  const toSub = r => ({ id: r.id, box: r.caixa, size: r.tamanho, kg: +r.kg, freq: r.frequencia, day: r.dia, deliver: r.entrega, point: r.ponto, address: r.morada, discovery: !!r.descoberta,
    pay: r.pagamento, locked: +r.preco_guardado, start: r.inicio, first: r.primeira, status: r.estado, lowered: !!r.baixou });
  const fromSub = (s, uid) => ({ id: s.id, user_id: uid, caixa: s.box, tamanho: s.size, kg: s.kg, frequencia: s.freq, dia: s.day, entrega: s.deliver, ponto: s.point || '', morada: s.address || '',
    descoberta: !!s.discovery, pagamento: s.pay || null, preco_guardado: +s.locked, inicio: s.start, primeira: s.first, estado: s.status || 'ativa', baixou: !!s.lowered });
  const toUser = (p, subs, harv) => ({ _id: p.id, name: p.nome, username: p.username, phone: p.telemovel || '', email: p.email || '', role: p.papel, created: p.criado,
    address: p.morada || null, favs: p.favoritos || [], exclude: p.excluidos || [], notify: p.avisos || [], partner: p.parceiro || null,
    nif: p.nif || '', billing: p.faturacao || null, coopUntil: p.cooperativa_ate || null,
    subs: subs.map(toSub), harvests: harv.map(toHarv) });
  /* inscrição Colhe Connosco: pessoas, avaliação do cliente e registo da colheita feito pela gestão */
  const toHarv = h => { const x = { day: h.dia_id || null, date: h.dia, people: h.pessoas }; if (h.avaliacao) { x.rating = h.avaliacao; x.comment = h.comentario || ''; x.ratedAt = h.avaliado; } if (h.registo) x.record = h.registo; if (h.resposta) x.reply = { text: h.resposta, at: h.respondido }; return x; };
  const harvRow = h => ({ pessoas: +h.people || 1, avaliacao: h.rating ? +h.rating : null, comentario: h.rating ? h.comment || '' : null, registo: h.record || null, resposta: h.reply && h.reply.text ? h.reply.text : null });
  const fromUser = u => ({ telemovel: u.phone || null, nome: u.name, email: u.email || null, morada: u.address || null, favoritos: u.favs || [], excluidos: u.exclude || [], avisos: u.notify || [],
    parceiro: u.partner || null, papel: u.role, nif: u.nif || null, faturacao: u.billing || null });
  const uidOf = un => (un && USERS[un] ? USERS[un]._id : null);
  const toOrder = r => {
    const o = { num: r.num, user: r.username || null, name: r.nome, phone: r.telemovel, email: r.email || '', created: r.criada, slot: r.data_entrega, day: r.dia, deliver: r.entrega,
      window: r.janela || '', point: r.ponto || '', address: r.morada || '', items: r.artigos || [], subtotal: +r.subtotal, fee: +r.taxa, total: +r.total, pay: r.pagamento, notes: r.notas || '', status: r.estado };
    if (r.etapa != null) o.stage = r.etapa;
    if (r.preferencias) o.prefs = r.preferencias;
    if (+r.cartao) o.boxesFee = +r.cartao; if (+r.saldo) o.balance = +r.saldo; if (+r.desconto) o.discount = +r.desconto; if (r.promo) o.promo = r.promo;
    if (r.user_id) o._uid = r.user_id;
    return o;
  };
  const fromOrder = o => ({ num: o.num, user_id: o._uid || uidOf(o.user), username: o.user || null, nome: o.name, telemovel: o.phone, email: o.email || null, criada: o.created,
    data_entrega: o.slot, dia: o.day, entrega: o.deliver, janela: o.window || null, ponto: o.point || null, morada: o.address || null, artigos: o.items, subtotal: +o.subtotal, taxa: +o.fee,
    total: +o.total, pagamento: o.pay || null, notas: o.notes || null, estado: o.status || 'ativa', etapa: typeof o.stage === 'number' ? o.stage : null, preferencias: o.prefs || null,
    cartao: +o.boxesFee || 0, saldo: +o.balance || 0, desconto: +o.discount || 0, promo: o.promo || null });
  const toReq = r => {
    const x = { id: r.id, type: r.tipo, created: r.criado, status: r.estado, user: r.username || null, fields: r.campos || {} };
    if (r.parceiro) x.partnerUser = r.parceiro; if (r.encomenda) x.order = r.encomenda; if (r.aprovado) x.approved = true; if (r.produto_id) x.productId = r.produto_id; if (r.user_id) x._uid = r.user_id;
    if (r.decisao) x.decision = r.decisao; if (r.resposta) x.reply = r.resposta; if (r.decidido) x.decidedAt = r.decidido;
    return x;
  };
  const fromReq = r => ({ id: r.id, tipo: r.type, criado: r.created, estado: r.status, user_id: r._uid || uidOf(r.user), username: r.user || null, parceiro: r.partnerUser || null,
    encomenda: r.order || null, aprovado: !!r.approved, produto_id: r.productId || null, campos: r.fields || {}, decisao: r.decision || null, resposta: r.reply || null, decidido: r.decidedAt || null });
  /* ---------- v11: inventário, avaliações, promoções, notificações, Saldo Daqui, caixas preparadas ---------- */
  const toLot = r => ({ id: r.id, farmer: r.agricultor, product: r.produto, qty: +r.quantidade, sold: +r.vendido || 0, harvest: r.colheita, cold: !!r.frio, lab: !!r.analise,
    transport: r.transporte || 'proprio', pickup: r.recolha || null, created: r.criado });
  const fromLot = l => ({ id: l.id, agricultor: l.farmer, produto: l.product, quantidade: +l.qty, colheita: l.harvest, frio: !!l.cold, analise: !!l.lab, transporte: l.transport || 'proprio', recolha: l.transport === 'recolha' ? l.pickup || null : null });
  const toReview = r => ({ id: r.id, product: r.produto, name: r.nome || '', stars: +r.estrelas, comment: r.comentario || '', at: r.criada, mine: !!r.minha, reply: r.resposta ? { text: r.resposta, at: r.respondida } : null });
  const toPromo = r => ({ id: r.id, title: { pt: r.titulo_pt, en: r.titulo_en || r.titulo_pt }, text: { pt: r.texto_pt || '', en: r.texto_en || r.texto_pt || '' }, kind: r.tipo, value: +r.valor, min: +r.minimo || 0,
    until: r.ate, code: r.codigo || '', public: !!r.publica, active: !!r.ativa, created: r.criada });
  const fromPromo = p => ({ id: p.id, titulo_pt: p.title.pt, titulo_en: p.title.en || p.title.pt, texto_pt: (p.text || {}).pt || '', texto_en: (p.text || {}).en || '', tipo: p.kind, valor: +p.value || 0, minimo: +p.min || 0,
    ate: p.until, codigo: p.code || null, publica: !!p.public, ativa: p.active !== false });
  const toNotif = r => ({ id: r.id, title: { pt: r.titulo_pt, en: r.titulo_en }, text: { pt: r.texto_pt, en: r.texto_en }, route: r.rota || '', promo: r.promo || null, read: !!r.lida, at: r.criada });
  const toMov = r => ({ id: r.id, user: r.user_id, kind: r.tipo, desc: r.descricao, value: +r.valor, balance: +r.saldo, method: r.metodo || '', ref: r.ref || '', at: r.criado });
  const toClaim = r => ({ promo: r.promo, user: r.user_id, at: r.reclamada, used: r.usada || null, order: r.encomenda || null });
  const toPrep = r => ({ id: r.id, sub: r.subscricao || null, order: r.encomenda || null, user: r.user_id, date: r.data, box: r.caixa || null, size: r.tamanho || null, items: r.artigos || [], stage: r.etapa == null ? 2 : +r.etapa, at: r.criada });
  const diff = (prev, row) => { const d = {}; for (const k of Object.keys(row)) if (J(row[k]) !== J(prev[k])) d[k] = row[k]; return Object.keys(d).length ? d : null; };
  const fill = (arr, items) => { arr.length = 0; items.forEach(x => arr.push(x)); };

  /* ---------- ler da base de dados ----------
     Tudo é pedido numa só ronda (os pedidos vão ao mesmo tempo). O que vem fica guardado neste separador
     (sessionStorage): ao mudar de página o site desenha logo com essa cópia e não pergunta nada ao Supabase.
     Volta a ler só o que mudou: depois de gravar alguma coisa, quando o tempo real avisa, com F5, ou ao fim de 30 min. */
  const opt = p => p.catch(() => null);   // tabela ou função que ainda não existe (SQL por correr): ignora
  const GROUPS = ['cat', 'lots', 'defs', 'reviews', 'promos', 'people', 'msgs', 'mine'];
  const FETCH = {
    cat: () => Promise.all([rest('GET', 'produtos', 'select=*&order=ordem.asc,id.asc'), rest('GET', 'agricultores', 'select=*&order=ordem.asc,id.asc'),
      rest('GET', 'restaurantes', 'select=*&order=ordem.asc,id.asc'), rest('GET', 'dias_colhe', 'select=*&order=dia.asc'),
      rest('GET', 'caixas_precos', 'select=*&order=caixa.asc,ordem.asc'), rest('GET', 'colhe_ocupacao', 'select=*'), opt(rest('GET', 'caixas', 'select=*&order=ordem.asc,criada.asc'))])
      .then(([prods, farms, rests, days, boxes, oc, custom]) => ({ prods, farms, rests, days, boxes, oc, custom: custom || [] })),
    lots: () => opt(rest('GET', 'lotes', 'select=*&order=colheita.asc,criado.asc')),
    defs: () => opt(rest('GET', 'definicoes', 'select=*')),
    reviews: () => Promise.all([opt(rest('GET', 'avaliacoes_publicas', 'select=*&order=criada.desc&limit=3000')), opt(rpc('colhe_avaliacoes', {}))]).then(([p, c]) => ({ p, c })),
    promos: () => opt(rest('GET', 'promocoes', 'select=*&order=criada.desc')),
    people: () => !sess ? Promise.resolve(null) : Promise.all([rest('GET', 'perfis', 'select=*&order=criado.asc,username.asc'), rest('GET', 'subscricoes', 'select=*&order=criada.asc'),
      rest('GET', 'inscricoes_colhe', 'select=*'), rest('GET', 'encomendas', 'select=*&order=criada.desc&limit=1000'), rest('GET', 'pedidos', 'select=*&order=criado.desc&limit=1000'),
      opt(rpc('colhe_resumo_agricultor', {}))]).then(([perfis, subs, harv, ords, reqs, farm]) => ({ perfis, subs, harv, ords, reqs, farm })),
    msgs: () => { if (sess) return rest('GET', 'mensagens', 'select=*&order=criada.asc&limit=2000'); const c = store.get('daqui-conversa', ''); return c ? opt(rpc('mensagens_convidado', { p_conversa: c })) : Promise.resolve([]); },
    mine: () => !sess ? Promise.resolve(null) : Promise.all([opt(rest('GET', 'notificacoes', 'select=*&order=criada.desc&limit=100')), opt(rest('GET', 'movimentos', 'select=*&order=criado.desc&limit=2000')),
      opt(rest('GET', 'promos_utilizador', 'select=*')), opt(rest('GET', 'preparacoes', 'select=*&order=data.desc&limit=2000'))]).then(([n, m, c, p]) => ({ n: n || [], m: m || [], c: c || [], p: p || [] }))
  };
  const APPLY = { cat: applyCat, lots: r => { if (typeof LOTS !== 'undefined') fill(LOTS, (r || []).map(toLot)); N.hasLots = Array.isArray(r); },
    defs: r => { if (typeof SETTINGS !== 'undefined' && Array.isArray(r)) { const g = r.find(x => x.chave === 'geral'); if (g) Object.assign(SETTINGS, g.valor); } },
    reviews: r => { if (typeof PRODUCT_REVIEWS !== 'undefined') fill(PRODUCT_REVIEWS, ((r && r.p) || []).map(toReview));
      N.harvestReviews = {}; ((r && r.c) || []).forEach(x => { (N.harvestReviews[x.dia_id] = N.harvestReviews[x.dia_id] || []).push({ name: x.nome || '', rating: +x.avaliacao, comment: x.comentario || '', reply: x.resposta || '', at: x.avaliado || '' }); }); },
    promos: r => { if (typeof PROMOS !== 'undefined') fill(PROMOS, (r || []).map(toPromo)); },
    people: applyPeople, msgs: r => { if (typeof MESSAGES !== 'undefined') fill(MESSAGES, (r || []).map(toMsg)); },
    mine: r => { if (typeof NOTIFS === 'undefined') return; fill(NOTIFS, r ? r.n.map(toNotif) : []); fill(WALLET, r ? r.m.map(toMov) : []); fill(CLAIMS, r ? r.c.map(toClaim) : []); fill(PREPS, r ? r.p.map(toPrep) : []); } };
  let RAW = {};
  /* conta as alterações locais: se o utilizador mudar algo enquanto uma releitura está a caminho, essa releitura
     não é aplicada (traria o valor antigo); a gravação que está na fila provoca outra releitura logo a seguir */
  let localGen = 0;
  const touched = () => { localGen++; };
  async function fetchGroups(list, force) {
    const g0 = localGen;
    const res = await Promise.all(list.map(g => FETCH[g]()));
    if (!force && localGen !== g0) return false;
    list.forEach((g, i) => { RAW[g] = res[i]; });
    /* os grupos dependem uns dos outros (ex.: as encomendas precisam das contas): aplica sempre por esta ordem */
    GROUPS.filter(g => list.includes(g)).forEach(g => { if (g in RAW) APPLY[g](RAW[g]); });
    saveCache(); return true;
  }
  function applyCat(c) {
    if (!c) return;
    const { prods, farms, rests, days, boxes, oc, custom } = c;
    if (!prods.length) { N.error = 'catalogo-vazio'; return; }
    /* caixas criadas na gestão (tabela "caixas", supabase/08); as 4 caixas da Daqui também podem ter linha aí (supabase/09: produtos e modo) */
    PRODUCTS.filter(p => p.custom).forEach(p => { delete BOX_SIZES[p.id]; });
    const own = custom.filter(r => !r.base && !STATIC_BOXES.includes(r.id)), base = custom.filter(r => r.base || STATIC_BOXES.includes(r.id));
    own.forEach(r => { BOX_SIZES[r.id] = []; });
    fill(FARMERS, farms.map(toFarmer));
    fill(PRODUCTS, PRODUCTS.filter(p => p.cat === 'caixas' && !p.custom).concat(own.map(r => boxProduct({ id: r.id, name: { pt: r.nome_pt, en: r.nome_en }, desc: { pt: r.desc_pt, en: r.desc_en }, items: r.produtos || [], mode: r.modo || 'fixo', icon: r.icone || '', sizes: [] })), prods.map(toProd)));
    base.forEach(r => { const b = PRODUCTS.find(p => p.id === r.id); if (b) { b.items = r.produtos || []; b.mode = r.modo || 'fixo'; b.boxCfg = true; } });
    fill(RESTAURANTS, rests.map(toRest));
    fill(HARVEST_DAYS, days.map(toDay));
    Object.keys(snap).filter(k => k.startsWith('d:')).forEach(k => delete snap[k]);
    HARVEST_DAYS.forEach(d => { snap['d:' + d.id] = J(fromDay(d)); });
    /* tamanhos: a base de dados manda (a gestão pode mudar pesos e acrescentar ou tirar tamanhos) */
    const seen = {};
    boxes.forEach(r => { const list = BOX_SIZES[r.caixa]; if (!list) return; if (!seen[r.caixa]) { seen[r.caixa] = 1; list.length = 0; } list.push({ s: r.tamanho, kg: +r.kg, price: +r.preco }); });
    PRODUCTS.filter(p => p.cat === 'caixas' && BOX_SIZES[p.id] && BOX_SIZES[p.id].length).forEach(b => { b.price = Math.min(...BOX_SIZES[b.id].map(z => z.price)); if (b.custom) b.kg = BOX_SIZES[b.id][0].kg; });
    ocup = {}; oc.forEach(x => { const k = x.dia_id || (HARVEST_DAYS.find(d => d.date === x.dia) || {}).id; if (k) ocup[k] = (ocup[k] || 0) + (+x.pessoas || 0); });
  }
  function guestOrders() { return store.get(GUEST_KEY, []).filter(x => x && x.num); }
  function rememberGuestOrder(o) { const list = guestOrders().filter(x => x.num !== o.num); list.unshift({ num: o.num, phone: o.phone }); store.set(GUEST_KEY, list.slice(0, 10)); }
  function applyPeople(r) {
    Object.keys(snap).filter(k => /^[usohr]:/.test(k)).forEach(k => delete snap[k]);
    let { perfis = [], subs = [], harv = [], ords = [], reqs = [], farm = null } = r || {};
    me = sess ? perfis.find(p => p.id === sess.user_id) || null : null;
    if (sess && !me) { perfis = subs = harv = ords = reqs = []; farm = null; }
    const users = {};
    perfis.forEach(p => { users[p.username] = toUser(p, subs.filter(s => s.user_id === p.id), harv.filter(h => h.user_id === p.id)); });
    for (const k of Object.keys(USERS)) if (!users[k]) delete USERS[k];
    for (const [k, u] of Object.entries(users)) { if (USERS[k]) { Object.keys(USERS[k]).forEach(x => delete USERS[k][x]); Object.assign(USERS[k], u); } else USERS[k] = u; }
    Object.values(USERS).forEach(u => {
      snap['u:' + u._id] = J(fromUser(u));
      u.subs.forEach(s => { snap['s:' + s.id] = J(fromSub(s, u._id)); });
      u.harvests.forEach(h => { snap[`h:${u._id}|${hKey(h)}`] = J(harvRow(h)); });
    });
    if (me) store.set(SESSION_KEY, me.username); else store.del(SESSION_KEY);
    ownAtLoad = {}; if (me && USERS[me.username]) USERS[me.username].harvests.forEach(h => { ownAtLoad[hKey(h)] = +h.people; });
    const orders = ords.map(toOrder), keepGuest = ORDERS.filter(o => o._tel && !orders.some(x => x.num === o.num));
    fill(ORDERS, orders.concat(keepGuest));
    ORDERS.forEach(o => { snap['o:' + o.num] = J(fromOrder(o)); });
    fill(REQUESTS, reqs.map(toReq));
    REQUESTS.forEach(q => { snap['r:' + q.id] = J(fromReq(q)); });
    N.farmerHarvest = me && me.papel === 'agricultor' && Array.isArray(farm) ? Object.fromEntries(farm.map(x => [x.dia_id || (HARVEST_DAYS.find(d => d.date === x.dia) || {}).id, { people: +x.pessoas || 0, n: +x.n || 0, avg: +x.media || 0, kg: +x.kg || 0, comments: x.comentarios || [] }])) : null;
  }
  /* mensagens ("Falar com a Daqui"): a gestão vê todas; cada conta vê as suas; sem conta, as da conversa guardada neste navegador */
  const toMsg = r => ({ id: r.id, conv: r.conversa, user: (Object.values(USERS).find(u => u._id === r.user_id) || {}).username || null, name: r.nome || '', contact: r.contacto || '', from: r.autor, text: r.texto, at: r.criada, read: !!r.lida });
  const loadMsgs = () => fetchGroups(['msgs'], true);
  async function loadGuestOrders() {
    for (const g of guestOrders().slice(0, 5)) { if (ORDERS.some(o => o.num === g.num && !o._tel)) continue; try { await lookupOrder(g.num, g.phone); } catch (e) {} }
  }

  /* ---------- cópia no separador ---------- */
  const CACHE_KEY = 'daqui-nuvem-copia', DIRTY_KEY = 'daqui-nuvem-sujo', CACHE_MAX = 30 * 60 * 1000;
  const ss = { get: k => { try { return JSON.parse(sessionStorage.getItem(k)); } catch (e) { return null; } }, set: (k, v) => { try { sessionStorage.setItem(k, J(v)); } catch (e) {} }, del: k => { try { sessionStorage.removeItem(k); } catch (e) {} } };
  let cacheT = 0;
  function saveCache() { if (!N.on) return; ss.set(CACHE_KEY, { uid: sess ? sess.user_id : null, t: cacheT || (cacheT = Date.now()), raw: RAW }); }
  const dirty = () => new Set(ss.get(DIRTY_KEY) || []);
  function markDirty(groups) { if (!groups.length) return; const d = dirty(); groups.forEach(g => d.add(g)); ss.set(DIRTY_KEY, [...d]); }
  function clearDirty(groups) { const d = dirty(); groups.forEach(g => d.delete(g)); ss.set(DIRTY_KEY, [...d]); }
  N.clearCache = () => { ss.del(CACHE_KEY); ss.del(DIRTY_KEY); };
  /* o que cada gravação muda: assim só esses grupos voltam a ser lidos */
  const TABLE_GROUPS = { produtos: ['cat'], agricultores: ['cat'], restaurantes: ['cat'], dias_colhe: ['cat', 'people'], caixas_precos: ['cat'], caixas: ['cat'], lotes: ['lots'], definicoes: ['defs'],
    avaliacoes_produtos: ['reviews'], promocoes: ['promos', 'mine'], perfis: ['people'], subscricoes: ['people'], inscricoes_colhe: ['people', 'reviews', 'cat'], encomendas: ['people', 'lots', 'mine'],
    pedidos: ['people'], mensagens: ['msgs'], notificacoes: ['mine'], movimentos: ['mine'], promos_utilizador: ['mine'], preparacoes: ['mine', 'lots'] };
  const RPC_GROUPS = { definir_stock: ['cat'], deixar_produto: ['cat'], juntar_produtos: ['cat', 'people', 'lots', 'reviews'], editar_dia_colhe: ['cat', 'people'], carregar_saldo: ['mine'], pagar_quota: ['mine', 'people'],
    reclamar_promo: ['mine', 'promos'], marcar_lidas: ['msgs'], enviar_mensagem_convidado: ['msgs'], confirmar_levantamento: ['people'], gerir_encomenda: ['people', 'lots'] };
  const wrote = {};   // tabela -> quando foi gravada por este separador (para ignorar o eco do tempo real)
  function noteWrite(path) {
    let m = path.match(/^\/rest\/v1\/rpc\/([a-z_]+)/), groups = [];
    if (m) groups = RPC_GROUPS[m[1]] || []; else if ((m = path.match(/^\/rest\/v1\/([a-z_]+)/))) { groups = TABLE_GROUPS[m[1]] || []; wrote[m[1]] = Date.now(); }
    markDirty(groups); return groups;
  }
  async function lookupOrder(num, phone) {
    const row = await rpc('encomenda_por_numero', { p_num: normOrder(num), p_tel: normPhone(phone) });
    if (!row) return null;
    const o = Object.assign(toOrder(row), { _tel: normPhone(phone) });
    const i = ORDERS.findIndex(x => x.num === o.num); if (i >= 0) ORDERS.splice(i, 1, o); else ORDERS.push(o);
    snap['o:' + o.num] = J(fromOrder(o));
    return o;
  }

  /* ---------- gravar na base de dados (por ordem, uma operação de cada vez) ---------- */
  const queue = (fn, quiet) => (chain = chain.then(fn).catch(e => { if (!quiet) report(e); }));
  function report(e) {
    console.error('[Daqui/Supabase]', e);
    const m = String(e && e.message || e);
    if (typeof toast === 'function') toast(/lugares/.test(m) ? m : T(`Não foi possível guardar na base de dados: ${m}`, `Could not save to the database: ${m}`));
    reloadSoon(true, true);
  }
  const isAdmin = () => !!(me && me.papel === 'admin');
  const canWriteUser = u => sess && (isAdmin() || u._id === sess.user_id);
  const canWriteOrder = o => sess && (isAdmin() || (o._uid ? o._uid === sess.user_id : !!(me && o.user === me.username)));
  N.syncUsers = () => { touched(); const rows = Object.values(USERS).filter(u => u._id).map(u => [u, fromUser(u), (u.subs || []).map(s => [s, fromSub(s, u._id)]), (u.harvests || []).map(h => Object.assign({}, h))]); return queue(async () => {
    for (const [u, row, subRows, hsCap] of rows) {
      if (!canWriteUser(u)) continue;
      const k = 'u:' + u._id, d = diff(JSON.parse(snap[k] || '{}'), row);
      if (d) { await rest('PATCH', 'perfis', 'id=' + eq(u._id), d, 'return=minimal'); snap[k] = J(row); }
      const subs = subRows.map(x => x[0]);
      for (const [s, r] of subRows) {
        const sk = 's:' + s.id;
        if (!snap[sk]) { await rest('POST', 'subscricoes', '', r, 'return=minimal'); snap[sk] = J(r); continue; }
        const sd = diff(JSON.parse(snap[sk]), r); if (sd) { await rest('PATCH', 'subscricoes', 'id=' + eq(s.id), sd, 'return=minimal'); snap[sk] = J(r); }
      }
      for (const sk of Object.keys(snap)) if (sk.startsWith('s:') && JSON.parse(snap[sk]).user_id === u._id && !subs.some(s => 's:' + s.id === sk)) {
        await rest('DELETE', 'subscricoes', 'id=' + eq(sk.slice(2)), undefined, 'return=minimal'); delete snap[sk];
      }
      const hs = hsCap, pre = `h:${u._id}|`;
      for (const h of hs) {
        const key = hKey(h), hk = pre + key, r = harvRow(h), dd = HD(key);
        if (!snap[hk]) { await rest('POST', 'inscricoes_colhe', '', { user_id: u._id, dia_id: key, dia: dd ? dd.date : h.date, pessoas: r.pessoas }, 'return=minimal'); snap[hk] = J({ pessoas: r.pessoas, avaliacao: null, comentario: null, registo: null, resposta: null }); }
        const d = diff(JSON.parse(snap[hk]), r);
        if (d) { await rest('PATCH', 'inscricoes_colhe', `user_id=${eq(u._id)}&dia_id=${eq(key)}`, d, 'return=minimal'); snap[hk] = J(r); }
      }
      for (const hk of Object.keys(snap)) if (hk.startsWith(pre) && !hs.some(h => pre + hKey(h) === hk)) {
        await rest('DELETE', 'inscricoes_colhe', `user_id=${eq(u._id)}&dia_id=${eq(hk.slice(pre.length))}`, undefined, 'return=minimal'); delete snap[hk];
      }
    }
  }); };
  /* as linhas são lidas no momento da gravação (e não quando chega a vez na fila): assim uma releitura da base de dados
     que esteja a meio não apaga uma alteração feita entretanto */
  N.syncOrders = () => { touched(); const rows = ORDERS.map(o => [o, fromOrder(o)]); return queue(async () => {
    for (const [o, row] of rows) {
      const k = 'o:' + o.num;
      if (!snap[k]) {
        if (!sess) row.user_id = null;
        await rest('POST', 'encomendas', '', row, 'return=minimal'); snap[k] = J(row);
        if (!sess) { o._tel = o.phone; rememberGuestOrder(o); }
        continue;
      }
      const d = diff(JSON.parse(snap[k]), row); if (!d) continue;
      if (canWriteOrder(o)) await rest('PATCH', 'encomendas', 'num=' + eq(o.num), d, 'return=minimal');
      else if (o._tel && d.etapa === 4) {
        const res = await rpc('confirmar_levantamento', { p_num: o.num, p_tel: o._tel });
        if (!res) throw new Error(T('ainda não é possível confirmar o levantamento', 'collection cannot be confirmed yet'));
      }
      else if (o._tel) {
        const res = await rpc('gerir_encomenda', { p_num: o.num, p_tel: o._tel, p_data: d.data_entrega || null, p_dia: d.dia || null, p_cancelar: d.estado === 'cancelada' });
        if (!res) throw new Error(T('a encomenda já não pode ser alterada', 'the order can no longer be changed'));
      }
      snap[k] = J(row);
    }
  }); };
  N.syncRequests = () => (touched(), queue(async () => {
    for (const r of REQUESTS) {
      const row = fromReq(r), k = 'r:' + r.id;
      if (!snap[k]) { if (!sess) row.user_id = null; await rest('POST', 'pedidos', '', row, 'return=minimal'); snap[k] = J(row); continue; }
      const d = diff(JSON.parse(snap[k]), row);
      if (d && isAdmin()) { await rest('PATCH', 'pedidos', 'id=' + eq(r.id), d, 'return=minimal'); snap[k] = J(row); }
    }
  }));
  N.pushCatalog = ch => (touched(), queue(async () => {
    const up = 'resolution=merge-duplicates,return=minimal';
    for (const f of ch.newFarmers || []) await rest('POST', 'agricultores', 'on_conflict=id', fromFarmer(f, FARMERS.length), up);
    for (const [id, o] of Object.entries(ch.farmers || {})) { const p = mapPatch(o, FARMER_PATCH, F(id)); if (Object.keys(p).length) await rest('PATCH', 'agricultores', 'id=' + eq(id), p, 'return=minimal'); }
    for (const p of ch.newProducts || []) await rest('POST', 'produtos', 'on_conflict=id', fromProd(p, PRODUCTS.length), up);
    /* vários produtos alterados (gestão, "Guardar alterações"): um só pedido com todas as linhas */
    const prodIds = Object.keys(ch.products || {}).filter(id => Object.keys(mapPatch(ch.products[id], PROD_PATCH)).length);
    if (prodIds.length > 1 && isAdmin()) await rest('POST', 'produtos', 'on_conflict=id', prodIds.map(id => P(id)).filter(Boolean).map(p => { const r = fromProd(p, 0); delete r.ordem; return r; }), up);
    else for (const id of prodIds) await rest('PATCH', 'produtos', 'id=' + eq(id), mapPatch(ch.products[id], PROD_PATCH), 'return=minimal');
    for (const [id, c] of Object.entries(ch.boxCfg || {})) { const b = P(id); if (!b) continue;
      await rest('POST', 'caixas', 'on_conflict=id', { id, nome_pt: b.name.pt, nome_en: b.name.en || b.name.pt, desc_pt: (b.desc || {}).pt || '', desc_en: (b.desc || {}).en || '', produtos: b.items || [], modo: b.mode || 'fixo', icone: b.icon || null, base: STATIC_BOXES.includes(id), ordem: 0 }, up); }
    for (const [id, list] of Object.entries(ch.boxSizes || {})) {
      await rest('DELETE', 'caixas_precos', 'caixa=' + eq(id), undefined, 'return=minimal');
      if (list.length) await rest('POST', 'caixas_precos', '', list.map((z, i) => ({ caixa: id, tamanho: z.s, kg: +z.kg, preco: +z.price, ordem: i })), 'return=minimal');
    }
    for (const b of ch.newBoxes || []) {
      await rest('POST', 'caixas', 'on_conflict=id', { id: b.id, nome_pt: b.name.pt, nome_en: b.name.en || b.name.pt, desc_pt: (b.desc || {}).pt || '', desc_en: (b.desc || {}).en || '', produtos: b.items || [], icone: b.icon || null, ordem: PRODUCTS.filter(p => p.custom).length }, up);
      await rest('POST', 'caixas_precos', 'on_conflict=caixa,tamanho', b.sizes.map((s, i) => ({ caixa: b.id, tamanho: s.s, kg: +s.kg, preco: +s.price, ordem: i })), up);
    }
    for (const id of ch.removedBoxes || []) { await rest('DELETE', 'caixas_precos', 'caixa=' + eq(id), undefined, 'return=minimal'); await rest('DELETE', 'caixas', 'id=' + eq(id), undefined, 'return=minimal'); }
    for (const [box, sizes] of Object.entries(ch.boxes || {})) for (const [sz, price] of Object.entries(sizes)) await rest('PATCH', 'caixas_precos', `caixa=${eq(box)}&tamanho=${eq(sz)}`, { preco: +price }, 'return=minimal');
    if (Array.isArray(ch.harvestDays)) {
      for (const d of ch.harvestDays) { const row = fromDay(d), k = 'd:' + row.id; if (snap[k] !== J(row)) { await rest('POST', 'dias_colhe', 'on_conflict=id', row, up); snap[k] = J(row); } }
      for (const k of Object.keys(snap)) if (k.startsWith('d:') && !ch.harvestDays.some(d => 'd:' + fromDay(d).id === k)) { await rest('DELETE', 'dias_colhe', 'id=' + eq(k.slice(2)), undefined, 'return=minimal'); delete snap[k]; }
    }
    for (const r of ch.newRestaurants || []) await rest('POST', 'restaurantes', 'on_conflict=id', fromRest(r, RESTAURANTS.length), up);
    for (const [id, o] of Object.entries(ch.restaurants || {})) { const p = mapPatch(o, REST_PATCH, RESTAURANTS.find(x => x.id === id)); if (Object.keys(p).length) await rest('PATCH', 'restaurantes', 'id=' + eq(id), p, 'return=minimal'); }
  }));
  /* fotografias das incidências: pasta pública "incidencias" do Storage (supabase/04-app.sql) */
  /* fotografias de telemóvel podem ter vários MB: reduz para no máximo 1600 px em JPEG antes de enviar (limite do balde: 5 MB) */
  function shrink(blob) {
    return new Promise(ok => {
      if (!blob || !/^image\//.test(blob.type || 'image/') || typeof document === 'undefined') return ok(null);
      const url = URL.createObjectURL(blob), img = new Image();
      img.onload = () => {
        try {
          const k = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
          if (k === 1 && blob.size < 1500000) { URL.revokeObjectURL(url); return ok(null); }
          const c = document.createElement('canvas'); c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
          c.toBlob(b => ok(b && b.size < blob.size ? b : null), 'image/jpeg', 0.82);
        } catch (e) { ok(null); }
      };
      img.onerror = () => { URL.revokeObjectURL(url); ok(null); };
      img.src = url;
    });
  }
  N.uploadPhoto = async (blob, ext = 'jpg', bucket = 'incidencias') => {
    const small = await shrink(blob);
    if (small) { blob = small; ext = 'jpg'; }
    if (!/^(jpe?g|png|webp)$/i.test(ext)) ext = 'jpg';
    await fresh();
    const name = `${new Date().toISOString().slice(0, 7)}/${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const h = { apikey: KEY, 'Content-Type': blob.type || 'image/jpeg', 'x-upsert': 'false' };
    if (sess) h.Authorization = 'Bearer ' + sess.access_token; else if (/^eyJ/.test(KEY)) h.Authorization = 'Bearer ' + KEY;
    const r = await fetch(`${BASE}/storage/v1/object/${bucket}/${name}`, { method: 'POST', headers: h, body: blob });
    if (!r.ok) throw new Error('Storage ' + r.status + ' ' + (await r.text()).slice(0, 120));
    return `${BASE}/storage/v1/object/public/${bucket}/${name}`;
  };
  /* telemóveis que recebem notificações (app Android) */
  N.registerDevice = (token, platform) => (sess ? rpc('registar_dispositivo', { p_token: token, p_plataforma: platform || 'android', p_lingua: lang }) : Promise.resolve());
  N.unregisterDevice = token => (sess ? rpc('remover_dispositivo', { p_token: token }).catch(() => {}) : Promise.resolve());
  N.hasSession = () => !!sess;
  N.loadMessages = () => queue(loadMsgs, true);
  N.reloadGroups = reloadGroups;
  N.sendMessage = (m, owner) => queue(async () => {
    if (sess) {
      const row = { conversa: m.conv, user_id: m.from === 'gestao' ? (owner && owner._id) || null : sess.user_id, nome: m.name || null, contacto: m.contact || null, autor: m.from, texto: m.text };
      const r = await rest('POST', 'mensagens', '', row, 'return=representation'); if (Array.isArray(r) && r[0]) { m.id = r[0].id; m.at = r[0].criada; }
    } else await rpc('enviar_mensagem_convidado', { p_conversa: m.conv, p_nome: m.name || '', p_contacto: m.contact || '', p_texto: m.text });
  });
  N.markRead = conv => queue(() => rpc('marcar_lidas', { p_conversa: conv }), true);
  /* agricultor: stock da sua parte de um produto (pode haver vários produtores) */
  N.setStock = (id, out) => queue(() => rpc('definir_stock', { p_produto: id, p_fora: !!out })).then(() => reloadSoon(true, false));
  /* agricultor: deixar de vender um produto (sai da lista de produtores; sem produtores, o produto fica sem stock) */
  N.leaveProduct = id => queue(() => rpc('deixar_produto', { p_produto: id })).then(() => reloadSoon(true, false));
  /* agricultor (ou gestão): editar um dia Colhe Connosco antes de começar; as inscrições mudam com ele */
  N.editHarvestDay = (id, d) => {
    snap['d:' + id] = J(fromDay(d));
    return queue(() => rpc('editar_dia_colhe', { p_id: id, p_novo_dia: d.date, p_horario: d.time, p_lugares: +d.spots, p_produto_pt: (d.what || {}).pt || '', p_produto_en: (d.what || {}).en || '', p_cultura: d.crop || null })).then(() => reloadSoon(true, true));
  };
  /* gestão: juntar produtos repetidos (produtores, favoritos, avisos e o endereço antigo passam para o que fica) */
  N.mergeProducts = (keep, drop) => queue(() => rpc('juntar_produtos', { p_manter: keep, p_juntar: drop })).then(() => reloadSoon(true, true));
  N.deleteProduct = id => queue(() => rest('DELETE', 'produtos', 'id=' + eq(id), undefined, 'return=minimal'));

  /* ---------- v11 ---------- */
  const stockError = e => { const m = String(e && e.message || '').match(/stock:([^:]+):([\d.]+)/); return m ? { product: m[1], left: +m[2] } : null; };
  N.stockError = stockError;
  /* encomenda nova: espera pela resposta (stock, saldo e promoção são confirmados pelo Supabase) */
  N.placeOrder = o => { let err = null; return queue(async () => { try { const row = fromOrder(o); if (!sess) row.user_id = null; await rest('POST', 'encomendas', '', row, 'return=minimal'); snap['o:' + o.num] = J(row); if (!sess) { o._tel = o.phone; rememberGuestOrder(o); } } catch (e) { err = e; } }).then(() => { if (err) throw err; }); };
  N.saveLot = l => queue(async () => { const row = fromLot(l); if (l._new) { const r = await rest('POST', 'lotes', '', row, 'return=representation'); delete l._new; if (Array.isArray(r) && r[0]) Object.assign(l, toLot(r[0])); } else await rest('PATCH', 'lotes', 'id=' + eq(l.id), row, 'return=minimal'); });
  N.deleteLot = id => queue(() => rest('DELETE', 'lotes', 'id=' + eq(id), undefined, 'return=minimal'));
  N.saveSettings = v => queue(() => rest('POST', 'definicoes', 'on_conflict=chave', { chave: 'geral', valor: v }, 'resolution=merge-duplicates,return=minimal'));
  N.addReview = (product, stars, comment) => queue(async () => { const r = await rest('POST', 'avaliacoes_produtos', '', { produto: product, user_id: sess.user_id, estrelas: stars, comentario: comment }, 'return=representation'); return r; });
  N.editReview = (id, stars, comment) => queue(() => rest('PATCH', 'avaliacoes_produtos', 'id=' + eq(id), { estrelas: stars, comentario: comment }, 'return=minimal'));
  N.deleteReview = id => queue(() => rest('DELETE', 'avaliacoes_produtos', 'id=' + eq(id), undefined, 'return=minimal'));
  N.replyReview = (id, text) => queue(() => rest('PATCH', 'avaliacoes_produtos', 'id=' + eq(id), { resposta: text }, 'return=minimal'));
  N.topUp = (v, m) => rpc('carregar_saldo', { p_valor: v, p_metodo: m }).then(x => { reloadGroups(['mine'], 0); return x; });
  N.payCoop = m => rpc('pagar_quota', { p_metodo: m }).then(x => { reloadGroups(['mine', 'people'], 0); return x; });
  N.claimPromo = (id, code) => rpc('reclamar_promo', { p_promo: id || null, p_codigo: code || null }).then(x => { reloadGroups(['mine', 'promos'], 0); return x; });
  N.savePromo = p => queue(() => rest('POST', 'promocoes', 'on_conflict=id', fromPromo(p), 'resolution=merge-duplicates,return=minimal'));
  N.readNotifs = ids => (ids.length ? queue(() => rest('PATCH', 'notificacoes', 'id=in.(' + ids.join(',') + ')', { lida: true }, 'return=minimal'), true) : Promise.resolve());
  N.deleteNotif = id => queue(() => rest('DELETE', 'notificacoes', 'id=' + eq(id), undefined, 'return=minimal'), true);
  N.savePrep = p => (touched(), queue(() => rest('POST', 'preparacoes', 'on_conflict=id', { id: p.id, subscricao: p.sub || null, encomenda: p.order || null, caixa: p.box || null, tamanho: p.size || null, user_id: p.user || null, data: p.date, artigos: p.items, etapa: p.stage || 2 }, 'resolution=merge-duplicates,return=minimal')));
  N.farmerSales = id => rpc('agricultor_vendas', { p_agricultor: id || null });
  N.deletePrep = id => queue(() => rest('DELETE', 'preparacoes', 'id=' + eq(id), undefined, 'return=minimal'));
  N.changeEmail = async email => { await http('PUT', '/auth/v1/user', { email }); };
  N.balance = () => (typeof WALLET === 'undefined' || !sess ? 0 : WALLET.filter(m => m.user === sess.user_id).reduce((a, m) => a + m.balance, 0));

  /* ---------- contas ---------- */
  N.signIn = async (login, pass) => {
    const l = String(login || '').trim(), tel = normPhone(l);
    const email = l.includes('@') ? l.toLowerCase() : await rpc('email_para_login', { p_login: l, p_tel: tel.length >= 9 ? tel : '' });
    if (!email) return null;
    try { setSession(await authPost('token?grant_type=password', { email, password: pass })); }
    catch (e) { if (e.status === 400 || e.status === 401) return null; throw e; }
    N.clearCache(); await fetchGroups(['people', 'mine', 'msgs', 'reviews'], true); rtConnect();
    return currentUser();
  };
  /* palavra-passe: confirma a atual (entrando outra vez com ela) e só depois grava a nova no Supabase Auth */
  N.changePassword = async (cur, nw) => {
    if (!sess) return 'session';
    const who = await http('GET', '/auth/v1/user'), email = who && who.email;
    if (!email) return 'session';
    try { setSession(await authPost('token?grant_type=password', { email, password: cur })); }
    catch (e) { if (e.status === 400 || e.status === 401) return 'cur'; throw e; }
    try { await http('PUT', '/auth/v1/user', { password: nw }); }
    catch (e) {
      const c = `${e.code || ''} ${e.message}`;
      if (/same_password|different from the old/i.test(c)) return 'same';
      if (/reauthentication/i.test(c)) return 'reauth';
      if (/weak|password/i.test(c)) return 'weak';
      throw e;
    }
    return '';
  };
  N.register = async data => {
    const e = registerErrors(data, false); if (Object.keys(e).length) return { errors: e };
    const un = String(data.username).trim().toLowerCase(), ph = normPhone(data.phone), email = String(data.email).trim().toLowerCase();
    const av = await rpc('login_disponivel', { p_username: un, p_tel: ph, p_email: email });
    if (!av.username) e.username = 'taken'; if (!av.telemovel) e.phone = 'taken'; if (!av.email) e.email = 'taken';
    if (Object.keys(e).length) return { errors: e };
    let d;
    try { d = await authPost('signup', { email, password: data.pass, data: { username: un, nome: String(data.name).trim(), telemovel: ph, papel: data.role, parceiro: partnerFromForm(data) } }); }
    catch (err) {
      const c = `${err.code || ''} ${err.message}`;
      if (/already|exists|registered/i.test(c)) return { errors: { email: 'taken' } };
      if (/email/i.test(c) && /invalid/i.test(c)) return { errors: { email: 'fmt' } };
      if (/password/i.test(c)) return { errors: { pass: 'weak' } };
      throw err;
    }
    if (!d || !d.access_token) return { errors: { email: 'confirm' } };
    setSession(d); N.clearCache(); await fetchGroups(['people', 'mine', 'msgs'], true);
    const u = currentUser(); if (u) partnerRequest(u);
    rtConnect();
    return u ? { user: u } : { errors: { auth: 1 } };
  };
  N.signOut = () => {
    if (sess) {
      const h = { apikey: KEY, 'Content-Type': 'application/json', Authorization: 'Bearer ' + sess.access_token };
      if (N.pushToken) fetch(BASE + '/rest/v1/rpc/remover_dispositivo', { method: 'POST', headers: h, body: J({ p_token: N.pushToken }), keepalive: true }).catch(() => {});
      fetch(BASE + '/auth/v1/logout', { method: 'POST', headers: h, keepalive: true }).catch(() => {});
    }
    clearSession();
  };

  /* ---------- tempo real (Supabase Realtime, protocolo Phoenix) ---------- */
  let ws = null, wsRef = 0, hb = null, retry = null, closing = false;
  function rtConnect() {
    if (!sess || !N.on || typeof WebSocket === 'undefined' || (ws && ws.readyState < 2)) return;
    closing = false;
    try { ws = new WebSocket(BASE.replace(/^http/, 'ws') + '/realtime/v1/websocket?apikey=' + encodeURIComponent(KEY) + '&vsn=1.0.0'); } catch (e) { return; }
    ws.onopen = () => {
      const ref = String(++wsRef);
      ws.send(J({ topic: 'realtime:daqui', event: 'phx_join', ref, join_ref: ref, payload: { config: { broadcast: { ack: false, self: false }, presence: { key: '', enabled: false },
        postgres_changes: Object.keys(TABLE_GROUPS).map(t => ({ event: '*', schema: 'public', table: t })), private: false }, access_token: sess && sess.access_token } }));
      clearInterval(hb); hb = setInterval(() => { if (ws && ws.readyState === 1) ws.send(J({ topic: 'phoenix', event: 'heartbeat', payload: {}, ref: String(++wsRef) })); }, 25000);
    };
    ws.onmessage = ev => {
      let m; try { m = JSON.parse(ev.data); } catch (e) { return; }
      if (m.topic !== 'realtime:daqui') return;
      if (m.event === 'phx_reply' && m.payload && m.payload.status === 'error') setLive(false);
      if (m.event === 'system' && m.payload) setLive(m.payload.status === 'ok');
      if (m.event === 'phx_reply' && m.payload && m.payload.status === 'ok' && m.payload.response && m.payload.response.postgres_changes) setLive(true);
      if (m.event === 'postgres_changes') { const t = m.payload && m.payload.data && m.payload.data.table; if (wrote[t] && Date.now() - wrote[t] < 5000) return; markDirty(TABLE_GROUPS[t] || []); reloadGroups(TABLE_GROUPS[t] || GROUPS); }
      if (m.event === 'phx_error' || m.event === 'phx_close') setLive(false);
    };
    ws.onclose = () => { setLive(false); clearInterval(hb); if (!closing) { clearTimeout(retry); retry = setTimeout(rtConnect, 15000); } };
    ws.onerror = () => {};
  }
  function rtToken() { if (ws && ws.readyState === 1 && sess) ws.send(J({ topic: 'realtime:daqui', event: 'access_token', payload: { access_token: sess.access_token }, ref: String(++wsRef) })); }
  function rtClose() { closing = true; clearTimeout(retry); clearInterval(hb); if (ws) try { ws.close(); } catch (e) {} ws = null; setLive(false); }
  function setLive(v) { if (N.live === v) return; N.live = v; $$('[data-nuvem-estado]').forEach(el => { el.outerHTML = N.badge(); }); }

  /* ---------- voltar a ler e redesenhar sem estragar o que a pessoa está a fazer ---------- */
  let want = new Set(), timer = null;
  function reloadGroups(groups, wait = 500) {
    groups.forEach(g => want.add(g));
    clearTimeout(timer);
    timer = setTimeout(() => {
      const list = GROUPS.filter(g => want.has(g)); want = new Set();
      if (!list.length) return;
      const before = signature();
      const msgsBefore = list.includes('msgs') && typeof MESSAGES !== 'undefined' ? J(MESSAGES.map(m => [m.id, m.read])) : null;
      queue(async () => {
        if (!(await fetchGroups(list))) { markDirty(list); reloadGroups(list, 1500); return; }
        clearDirty(list);
        /* mensagem nova (tempo real): o chat aberto atualiza-se sem esperar */
        if (msgsBefore !== null && msgsBefore !== J(MESSAGES.map(m => [m.id, m.read])) && typeof chatAfterNew === 'function') { chatAfterNew(); return; }
        if (signature() !== before) softRender();
        if (typeof refreshBell === 'function') refreshBell();
      }, true);
    }, wait);
  }
  const reloadSoon = (cat, people) => reloadGroups(cat && people ? GROUPS : [].concat(cat ? ['cat', 'lots'] : [], people ? ['people', 'msgs', 'mine'] : []));
  const signature = () => J([PRODUCTS, FARMERS, RESTAURANTS, HARVEST_DAYS, BOX_SIZES, USERS, ORDERS, REQUESTS, ocup, typeof MESSAGES === 'undefined' ? 0 : MESSAGES, N.harvestReviews || 0, N.farmerHarvest || 0,
    typeof LOTS === 'undefined' ? 0 : [LOTS, SETTINGS, PRODUCT_REVIEWS, PROMOS, NOTIFS, WALLET, CLAIMS, PREPS]]);
  function softRender() {
    const busy = $('#modal.on') || (document.activeElement && /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName) && document.activeElement.closest('main')) || (typeof hasPendingEdits === 'function' && hasPendingEdits());
    if (busy) { setTimeout(softRender, 2500); return; }
    if (typeof rerenderKeep === 'function') rerenderKeep(); else { const y = scrollY; render(); scrollTo(0, y); }
  }

  /* ---------- arranque ---------- */
  const isReload = () => { try { const e = performance.getEntriesByType('navigation')[0]; return !!e && e.type === 'reload'; } catch (x) { return false; } };
  N.start = async () => {
    if (!N.configured) return;
    sess = store.get(SESS_KEY, null);
    try {
      if (sess) await fresh();
      const c = ss.get(CACHE_KEY), uid = sess ? sess.user_id : null;
      const useCache = c && c.raw && c.raw.cat && c.uid === uid && !isReload() && Date.now() - c.t < CACHE_MAX;
      if (useCache) {
        /* mudança de página: desenha logo com a cópia; só lê o que ficou por atualizar depois de uma gravação */
        RAW = c.raw; cacheT = c.t; N.on = true;
        GROUPS.forEach(g => { if (g in RAW) APPLY[g](RAW[g]); });
        const d = GROUPS.filter(g => dirty().has(g) || !(g in RAW));
        if (d.length) reloadGroups(d, 0);
      } else {
        ss.del(CACHE_KEY); cacheT = Date.now(); RAW = {};
        try { await fetchGroups(GROUPS, true); }
        catch (e) { if (sess && (e.status === 401 || e.status === 403)) { clearSession(); RAW = {}; await fetchGroups(GROUPS, true); } else throw e; }
        N.on = true; saveCache(); clearDirty(GROUPS);
      }
      loadGuestOrders();
      if (sess) rtConnect();
      /* sem tempo real (ex.: rede que bloqueia WebSockets) volta a ler de vez em quando; com tempo real, nunca */
      setInterval(() => { if (sess && document.visibilityState === 'visible' && !N.live) reloadGroups(['people', 'msgs', 'mine', 'lots']); }, POLL);
    } catch (e) {
      console.warn('[Daqui/Supabase] sem ligação, a usar os dados do navegador:', e);
      N.on = false; N.failed = true; N.error = String(e && e.message || e);
    }
  };

  /* ---------- usado pelo resto do site ---------- */
  N.isAdmin = isAdmin;
  N.harvestPeople = id => { const own = me && USERS[me.username] ? (USERS[me.username].harvests || []).filter(h => hKey(h) === id).reduce((a, h) => a + (+h.people || 1), 0) : 0; return Math.max(0, (ocup[id] || 0) - (ownAtLoad[id] || 0) + own); };
  N.newOrderNumber = () => { let n; do { n = 'DQ' + (100000 + Math.floor(Math.random() * 900000)); } while (ORDERS.some(o => o.num === n)); return n; };
  N.newRequestId = () => 'P-' + (Date.now().toString(36) + Math.floor(Math.random() * 36).toString(36)).toUpperCase().slice(-7);
  N.lookupOrder = (num, phone) => lookupOrder(num, phone);
  N.refresh = () => reloadSoon(true, true);
  N.flush = () => chain;
  N.badge = () => !N.on ? '' : `<span class="nuvem-estado${N.live ? ' live' : ''}" data-nuvem-estado>${N.live ? T('Base de dados: tempo real', 'Database: live') : T(`Base de dados: atualiza a cada ${POLL / 1000} s`, `Database: refreshes every ${POLL / 1000} s`)}</span>`;
  N.banner = () => {
    if (N.failed) return `<div class="nuvem-aviso" role="status">${T('Sem ligação à base de dados. Está a ver os dados guardados neste navegador.', 'No connection to the database. You are seeing the data stored in this browser.')}</div>`;
    if (N.on && N.error === 'catalogo-vazio' && isAdmin()) return `<div class="nuvem-aviso" role="status">${T('A base de dados não tem produtos: corra supabase/02-catalogo.sql no SQL Editor do Supabase.', 'The database has no products: run supabase/02-catalogo.sql in the Supabase SQL Editor.')}</div>`;
    return '';
  };
  return N;
})();
