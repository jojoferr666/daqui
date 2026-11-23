/* ===== Daqui — páginas: Entrar / Criar conta, A minha conta, Painel de gestão ===== */

/* ---------------- ENTRAR (/entrar) ---------------- */
let authMode = QS.get('modo') === 'registo' ? 'registo' : 'entrar';
let authErr = {}, authVals = {};
let authRole = ['agricultor', 'restaurante'].includes(QS.get('tipo')) ? QS.get('tipo') : 'cliente';
let NEXT = (() => { const n = QS.get('next') || ''; return /^[a-z0-9\-/]*$/.test(n) ? n : ''; })();
function afterLogin() {
  const pending = store.get('daqui-pending-sub', null);
  if (NEXT.startsWith('subscricao/') && pending) return go(NEXT, 'retomar=1');
  const u = currentUser(); go(NEXT || (u && u.partner ? 'parceiro' : 'conta'));
}
PAGES.entrar = () => {
  const u = currentUser();
  const errMsg = { req: T('Campo obrigatório.', 'Required.'), fmt: { username: T('Use 3 a 30 letras minúsculas, números, ponto ou hífen.', 'Use 3 to 30 lowercase letters, numbers, dots or hyphens.'), phone: T('Indique um número português com 9 dígitos.', 'Enter a 9-digit Portuguese number.'), email: T('Indique um e-mail válido, por exemplo nome@gmail.com.', 'Enter a valid email, for example name@gmail.com.') }, taken: { username: T('Este nome de utilizador já existe.', 'This username is taken.'), phone: T('Já existe uma conta com este número.', 'There is already an account with this number.'), email: T('Já existe uma conta com este e-mail.', 'There is already an account with this email.') }, short: T('Mínimo de 8 caracteres.', 'At least 8 characters.'), weak: T('Palavra-passe recusada: escolha outra mais longa ou mais difícil.', 'Password refused: choose a longer or harder one.'), match: T('As palavras-passe não coincidem.', 'Passwords don\'t match.'), confirm: T('Conta criada. Abra o e-mail de confirmação que enviámos e depois entre.', 'Account created. Open the confirmation email we sent, then sign in.') };
  const msg = k => { const c = authErr[k]; if (!c) return ''; const m = errMsg[c]; return `<span class="err" id="e-${k}">${typeof m === 'object' ? m[k] : m}</span>`; };
  const fld = (k, label, type = 'text', ac = '', hint = '') => `<div class="field"><label for="a-${k}">${label}</label>
    ${type === 'password' ? `<div class="pw"><input id="a-${k}" name="${k}" type="password" autocomplete="${ac}" value="${esc(authVals[k] || '')}"${authErr[k] ? ` aria-invalid="true" aria-describedby="e-${k}"` : ''}><button type="button" class="pw-t" data-pw="a-${k}" aria-label="${T('Mostrar palavra-passe', 'Show password')}">${icon('eye', 20)}</button></div>`
      : `<input id="a-${k}" name="${k}" type="${type}" autocomplete="${ac}" value="${esc(authVals[k] || '')}"${authErr[k] ? ` aria-invalid="true" aria-describedby="e-${k}"` : ''}>`}${hint ? `<span class="small muted">${hint}</span>` : ''}${msg(k)}</div>`;
  const html = `${crumbs([[T('Entrar', 'Sign in'), 'entrar']])}
  <div class="wrap auth">
    <div class="panel auth-box">
      ${u ? `<h1>${T('Já tem sessão iniciada', 'You are already signed in')}</h1><p class="lead mt-s">${T('Conta de', 'Account of')} <b>${esc(u.name)}</b> (${esc(u.username)}).</p>
        <div class="row-btns mt"><a class="btn btn-green" href="${href(u.partner ? 'parceiro' : 'conta')}">${u.partner ? T('Ir para a área de parceiro', 'Go to the partner area') : T('Ir para a minha conta', 'Go to my account')}</a><button class="btn btn-line c-campo" data-logout>${T('Terminar sessão', 'Sign out')}</button></div>` : `
      <div class="tabs" role="tablist"><button role="tab" data-auth="entrar" aria-selected="${authMode === 'entrar'}">${T('Entrar', 'Sign in')}</button><button role="tab" data-auth="registo" aria-selected="${authMode === 'registo'}">${T('Criar conta', 'Create account')}</button></div>
      ${NEXT.startsWith('subscricao/') ? `<p class="note small">${icon('repeat', 20)}<span>${T('Guardámos as escolhas da sua subscrição. Depois de entrar, só falta confirmar.', 'We saved your subscription choices. Once you sign in, you just need to confirm.')}</span></p>` : ''}
      ${authMode === 'entrar' ? `<form class="form" data-auth-form="entrar" novalidate>
          <h1 class="h2">${T('Entrar na sua conta', 'Sign in to your account')}</h1>
          ${fld('login', NUVEM.on ? T('Nome de utilizador, telemóvel ou e-mail', 'Username, mobile number or email') : T('Nome de utilizador ou telemóvel', 'Username or mobile number'), 'text', 'username')}
          ${fld('pass', T('Palavra-passe', 'Password'), 'password', 'current-password')}
          ${authErr.auth ? `<p class="err" role="alert">${T('Utilizador ou palavra-passe incorretos.', 'Incorrect username or password.')}</p>` : ''}
          ${authErr.net ? `<p class="err" role="alert">${T('Não foi possível ligar à base de dados. Verifique a internet e tente outra vez.', 'Could not reach the database. Check your connection and try again.')}</p>` : ''}
          <button class="btn btn-green btn-block" type="submit">${T('Entrar', 'Sign in')}</button>
          <p class="small muted ta-c">${T('Esqueceu-se da palavra-passe? Ligue para o', 'Forgot your password? Call')} ${PHONE}.</p></form>`
      : `<form class="form" data-auth-form="registo" novalidate>
          <h1 class="h2">${T('Criar conta', 'Create an account')}</h1>
          <fieldset class="plain"><legend class="lbl">${T('Tipo de conta', 'Account type')}</legend><div class="roles">${[['cliente', 'user', T('Cliente', 'Customer'), T('Compro fruta e legumes', 'I buy fruit and veg')], ['agricultor', 'tractor', T('Agricultor', 'Farmer'), T('Vendo o que produzo', 'I sell what I grow')], ['restaurante', 'utensils', T('Restaurante', 'Restaurant'), T('Quero o Selo Daqui', 'I want the Daqui seal')]].map(([k, i, n, dsc]) => `<label class="role"><span class="role-top"><input type="radio" name="role" value="${k}"${authRole === k ? ' checked' : ''}>${icon(i, 22)}<b>${n}</b></span><span class="small muted">${dsc}</span></label>`).join('')}</div></fieldset>
          ${fld('name', authRole === 'cliente' ? T('Nome', 'Name') : T('O seu nome', 'Your name'), 'text', 'name')}
          ${authRole === 'agricultor' ? `${fld('farm', T('Nome da quinta', 'Farm name'))}<div class="row">${fld('place', T('Localidade', 'Town'))}<div class="field"><label for="a-region">${T('Região', 'Region')}</label><select id="a-region" name="region">${Object.keys(REGIONS).map(r => `<option value="${r}"${authVals.region === r ? ' selected' : ''}>${regionName(r)}</option>`).join('')}</select></div></div>${fld('crops', T('O que produz', 'What you grow'))}` : ''}
          ${authRole === 'restaurante' ? `${fld('restName', T('Nome do restaurante', 'Restaurant name'))}<div class="row">${fld('place', T('Localidade', 'Town'))}${fld('kind', T('Tipo de cozinha', 'Cuisine'))}</div>` : ''}
          <div class="row">${fld('username', T('Nome de utilizador', 'Username'), 'text', 'username')}${fld('phone', T('Telemóvel', 'Mobile'), 'tel', 'tel')}</div>
          ${fld('email', NUVEM.on ? T('E-mail', 'Email') : T('E-mail (opcional)', 'Email (optional)'), 'email', 'email', NUVEM.on ? T('Também pode entrar com o e-mail.', 'You can also sign in with your email.') : '')}
          ${fld('pass', T('Palavra-passe', 'Password'), 'password', 'new-password', T('Mínimo de 8 caracteres.', 'At least 8 characters.'))}
          ${fld('pass2', T('Repetir palavra-passe', 'Repeat password'), 'password', 'new-password')}
          ${authRole !== 'cliente' ? `<p class="note small">${icon('shield', 20)}<span>${T('A equipa Daqui analisa o pedido. Enquanto isso, já pode preparar o seu perfil na área de parceiro.', 'The Daqui team reviews your application. Meanwhile, you can already prepare your profile in the partner area.')}</span></p>` : ''}
          ${authErr.net ? `<p class="err" role="alert">${T('Não foi possível ligar à base de dados. Verifique a internet e tente outra vez.', 'Could not reach the database. Check your connection and try again.')}</p>` : ''}
          <button class="btn btn-green btn-block" type="submit">${T('Criar conta', 'Create account')}</button></form>`}`}
    </div>
  </div><div class="spacer"></div>`;
  return { title: authMode === 'registo' ? T('Criar conta', 'Create account') : T('Entrar', 'Sign in'), html };
};
PAGE_EVENTS.click.push((e, t, d) => {
  if (d.auth) { authMode = d.auth; authErr = {}; render(); $(`[data-auth="${d.auth}"]`)?.focus(); return true; }
  if (d.pw) { const i = document.getElementById(d.pw); const show = i.type === 'password'; i.type = show ? 'text' : 'password'; t.setAttribute('aria-label', show ? T('Esconder palavra-passe', 'Hide password') : T('Mostrar palavra-passe', 'Show password')); return true; }
  if ('logout' in d) { signOut(); toast(T('Sessão terminada', 'Signed out')); setTimeout(() => go(''), 400); return true; }
});
PAGE_EVENTS.change.push((e, t) => {
  if (PAGE === 'entrar' && t.name === 'role') { const f = t.closest('form'); authVals = Object.assign({}, authVals, Object.fromEntries(new FormData(f).entries()), { pass: '', pass2: '' }); authRole = t.value; authErr = {}; render(); $(`input[name="role"][value="${t.value}"]`)?.focus(); }
});
PAGE_EVENTS.submit.push((e, f) => {
  if (!f.matches('[data-auth-form]')) return; e.preventDefault();
  const v = Object.fromEntries(new FormData(f).entries()); authVals = { ...v, pass: '', pass2: '' };
  const btn = $('button[type="submit"]', f); btn.disabled = true; btn.classList.add('busy');
  const fail = err => { console.error(err); authErr = { net: 1 }; render(); };
  if (f.dataset.authForm === 'entrar') {
    Promise.resolve(signIn(v.login, v.pass)).then(u => { if (u) { authErr = {}; afterLogin(); } else { authErr = { auth: 1 }; render(); $('#a-login')?.focus(); } }, fail);
  } else {
    Promise.resolve(register(v)).then(r => {
      if (r.user) { authErr = {}; toast(T('Conta criada', 'Account created')); setTimeout(afterLogin, 300); }
      else if (r.errors.email === 'confirm') { authMode = 'entrar'; authErr = {}; render(); toast(T('Conta criada. Confirme o e-mail e depois entre.', 'Account created. Confirm your email, then sign in.')); }
      else { authErr = r.errors; render(); $('[aria-invalid="true"]')?.focus(); }
    }, fail);
  }
  return true;
});

/* ---------------- A MINHA CONTA (/conta) ---------------- */
PAGES.conta = () => {
  const u = currentUser();
  if (!u) { location.replace(href('entrar', 'next=conta')); return { title: T('Entrar', 'Sign in'), html: '' }; }
  let changed = false; (u.subs || []).forEach(s => { if (refreshSub(s).changed) changed = true; }); if (changed) saveUsers();
  const nova = (u.subs || []).find(s => s.id === QS.get('nova'));
  const subCard = s => {
    const p = P(s.box), cur = boxCurrentPrice(s.box, s.size), lockEnd = addDays(parseISO(s.start), 365), fee = (q => q.ship.fee + q.boxes.fee)(quote([{ id: s.box, qty: 1, price: cur, opts: { kg: s.kg } }], s.deliver, u, null, false));
    const exclude = (u.exclude || []).map(id => P(id) ? L(P(id).name) : id).join(', ');
    return `<article class="subcard${s.status === 'pausada' ? ' paused' : ''}">
      <div class="sc-art">${artFor(p)}</div>
      <div class="sc-body">
        <div class="row-between"><h3>${esc(L(p.name))}</h3><span class="status ${s.status}">${s.status === 'ativa' ? T('Ativa', 'Active') : T('Pausada', 'Paused')}</span></div>
        <dl class="dl cols2">
          <div><dt>${T('Tamanho', 'Size')}</dt><dd>${sizeName(s.size)}, ${s.kg} kg</dd></div>
          <div><dt>${T('Frequência', 'Frequency')}</dt><dd><select data-sub-freq="${s.id}" aria-label="${T('Frequência', 'Frequency')}">${['sem', 'quinz', 'mens'].map(f => `<option value="${f}"${s.freq === f ? ' selected' : ''}>${freqName(f)}</option>`).join('')}</select></dd></div>
          <div><dt>${T('Dia', 'Day')}</dt><dd>${dayName(s.day)}</dd></div>
          <div><dt>${s.deliver === 'home' ? T('Entrega em casa', 'Home delivery') : T('Levantamento', 'Pick-up')}</dt><dd>${esc(s.deliver === 'home' ? s.address : s.point)}</dd></div>
          <div><dt>${T('Próxima entrega', 'Next delivery')}</dt><dd>${s.status === 'ativa' ? slotLabel(nextDelivery(s)) : T('Em pausa', 'On hold')}</dd></div>
          <div><dt>${T('Por entrega', 'Per delivery')}</dt><dd><b>${money(s.locked + fee)}</b>${fee ? ` <span class="small muted">(${T('inclui entrega', 'incl. delivery')})</span>` : ''}</dd></div>
        </dl>
        <p class="note small">${icon('lock', 20)}<span>${T(`Preço guardado: ${money(s.locked)} até ${fdate(lockEnd, { day: 'numeric', month: 'long', year: 'numeric' })}.`, `Saved price: ${money(s.locked)} until ${fdate(lockEnd, { day: 'numeric', month: 'long', year: 'numeric' })}.`)}
          ${cur > s.locked ? T(` O preço atual é ${money(cur)}: poupa ${money(cur - s.locked)} por entrega.`, ` The current price is ${money(cur)}: you save ${money(cur - s.locked)} per delivery.`) : s.lowered && cur === s.locked ? T(' O preço baixou e o seu preço guardado baixou com ele.', ' The price went down and your saved price went down with it.') : ''}</span></p>
        <p class="small muted">${exclude ? `${T('Não recebe', 'Not included')}: ${esc(exclude)}.` : T('Recebe todos os produtos da época.', 'Gets every seasonal product.')} <a class="link" href="#preferencias">${T('Alterar preferências', 'Change preferences')}</a></p>
        <div class="row-btns"><button class="btn btn-line btn-sm c-campo" data-sub-pause="${s.id}">${s.status === 'ativa' ? icon('pause', 16) + T('Pausar', 'Pause') : icon('play', 16) + T('Retomar', 'Resume')}</button>
          <button class="btn btn-line btn-sm c-tomato" data-sub-cancel="${s.id}">${T('Cancelar subscrição', 'Cancel subscription')}</button></div>
      </div></article>`;
  };
  const myOrders = ORDERS.filter(o => o.user === u.username).sort((a, b) => b.created.localeCompare(a.created));
  const orderCard = o => { const names = o.items.map(i => P(i.id) ? L(P(i.id).name) : i.id); const st = orderStage(o);
    return `<article class="ordcard"><div class="oc-thumbs">${o.items.slice(0, 3).map(i => P(i.id) ? `<span class="thumb">${artFor(P(i.id))}</span>` : '').join('')}</div>
      <div><div class="row-gap"><b>${o.num}</b><span class="status ${st === 4 ? 'pausada' : st === 3 ? 'ativa' : 'prog'}">${stageName(o)}</span></div>
        <p class="small muted">${T('Feita a', 'Placed on')} ${fdate(o.created, { day: 'numeric', month: 'long', year: 'numeric' })}. ${o.deliver === 'home' ? T('Entrega', 'Delivery') : T('Levantamento', 'Pick-up')}: ${slotLabel(o.slot)}.</p>
        <p class="small">${esc(names.slice(0, 4).join(', '))}${names.length > 4 ? ` ${T('e mais', 'and')} ${names.length - 4}` : ''}</p></div>
      <div class="oc-side"><b>${money(o.total)}</b><a class="btn btn-line btn-sm c-campo" href="${href('contacto', 'encomenda=' + o.num)}">${T('Seguir', 'Track')}</a><button class="link small" data-reorder="${o.num}">${T('Repetir encomenda', 'Order again')}</button><button class="link small" data-invoice="order|${o.num}">${icon('receipt', 14)} ${T('Fatura', 'Invoice')}</button></div>${reviewPrompts(u, o)}</article>`; };
  /* registos do Colhe Connosco: aparecem nas encomendas, com o valor pago e o identificador */
  const recCard = ({ h, d, rec }) => { const f = F(d.farmer) || { farm: d.farmer, place: '' }, pr = dayProduct(d);
    return `<article class="ordcard cc-rec"><div class="oc-thumbs"><span class="thumb">${pr ? artFor(pr) : icon('sprout', 28)}</span></div>
      <div><div class="row-gap"><b>${recId(h, d, u.username)}</b><span class="status ativa">${JTH()}</span></div>
        <p class="small muted">${T('Colhido a', 'Picked on')} ${fdate(d.date, { day: 'numeric', month: 'long', year: 'numeric' })}, ${esc(f.farm)}${f.place ? ', ' + esc(f.place) : ''}.</p>
        <p class="small">${recText(rec, d)}</p></div>
      <div class="oc-side"><b>${rec.price != null ? money(rec.price) : '–'}</b><a class="link small" href="#colhe">${T('Ver o dia', 'See the day')}</a>${rec.price != null ? `<button class="link small" data-invoice="colhe|${d.id}|${u.username}">${icon('receipt', 14)} ${T('Fatura', 'Invoice')}</button>` : ''}</div></article>`; };
  const ordFeed = myOrders.map(o => ({ at: String(o.created), html: orderCard(o) })).concat(harvestRecords(u).map(x => ({ at: x.d.date, html: recCard(x) }))).sort((a, b) => b.at.localeCompare(a.at));
  /* Colhe Connosco: inscrições, avaliação (abre no início do dia e fecha 48 h depois do fim) e registo da colheita feito pela equipa */
  const harvRow = h => { const dd = hDay(h); if (!dd) return ''; const f = F(dd.farmer) || { farm: dd.farmer, place: '' }, started = harvestStarted(dd), open = harvestRateOpen(dd), rec = h.record, k = dd.id.replace(/[^a-zA-Z0-9-]/g, '_');
    /* a avaliação só se envia uma vez: depois fica como está */
    const rate = !started ? '' : h.rating ? `<p class="small mt-s">${T('A sua avaliação', 'Your review')}: ${stars(+h.rating)}${h.comment ? ` «${esc(h.comment)}»` : ''}</p>${h.reply ? `<p class="review-reply small">${icon('chat', 16)}<span><b>${T('Resposta da Daqui', 'Reply from Daqui')}:</b> ${esc(h.reply.text)}</span></p>` : ''}`
      : open ? `<form class="rate-form mt-s" data-rate-form="${dd.id}"><fieldset class="plain"><legend class="small"><b>${T('Como correu? Avalie até', 'How did it go? Review it until')} ${fdate(harvestWindow(dd).close, { weekday: 'long', hour: '2-digit', minute: '2-digit' })}</b></legend>
        <div class="star-pick">${[5, 4, 3, 2, 1].map(n => `<input type="radio" id="rt-${k}-${n}" name="rt-${k}" value="${n}"><label for="rt-${k}-${n}" title="${n}">★<span class="sr">${n} ${T('estrelas', 'stars')}</span></label>`).join('')}</div></fieldset>
        <label class="sr" for="rc-${k}">${T('Comentário', 'Comment')}</label><textarea id="rc-${k}" rows="2" placeholder="${T('Conte como foi (opcional)', 'Tell us how it went (optional)')}"></textarea>
        <p class="small muted">${T('Depois de enviada, a avaliação já não pode ser alterada.', 'Once sent, the review can no longer be changed.')}</p>
        <p class="err" hidden></p><button class="btn btn-green btn-sm" type="submit">${T('Enviar avaliação', 'Send review')}</button></form>`
      : `<p class="small muted mt-s">${T('As avaliações deste dia já fecharam.', 'Reviews for this day are closed.')}</p>`;
    return `<li class="hrow"><div class="date sm"><b>${fdate(dd.date, { day: 'numeric' })}</b><span>${fdate(dd.date, { month: 'short' })}</span></div><div><b>${esc(L(dd.what))}</b>${started && !harvestPast(dd) ? ` <span class="status prog">${T('A decorrer', 'In progress')}</span>` : ''}<br><span class="small muted">${esc(f.farm)}${f.place ? ', ' + esc(f.place) : ''}. ${dd.time}. ${h.people} ${h.people > 1 ? T('pessoas', 'people') : T('pessoa', 'person')}.</span>
      ${rec ? `<p class="note done small mt-s">${icon('leaf', 20)}<span><b>${T('Registo da colheita', 'Harvest record')} ${recId(h, dd, u.username)}:</b> ${recText(rec, dd)} <a class="link" href="#encomendas">${T('Ver nas encomendas', 'See in orders')}</a></span></p>` : ''}${rate}</div>
      ${started ? '' : `<button class="link" data-harv-cancel="${dd.id}">${T('Cancelar', 'Cancel')}</button>`}</li>`; };
  const harvAll = (u.harvests || []).slice(), harvNext = harvAll.filter(h => { const dd = hDay(h); return dd && !harvestStarted(dd); }).sort((a, b) => hDay(a).date.localeCompare(hDay(b).date)),
    harvDone = harvAll.filter(h => { const dd = hDay(h); return dd && harvestStarted(dd); }).sort((a, b) => hDay(b).date.localeCompare(hDay(a).date));
  const harvRows = harvNext.map(harvRow).join('') + (harvDone.length ? `</ul><h3 class="mt">${T('Dias em que participou', 'Days you joined')}</h3><ul class="hlist mt-s">${harvDone.map(harvRow).join('')}` : '');
  const notif = (u.notify || []).map(P).filter(Boolean), favs = (u.favs || []).map(P).filter(Boolean), excl = (u.exclude || []).map(P).filter(Boolean);
  const prodOptions = keep => ['fruta', 'legumes'].map(c => `<optgroup label="${catName(c)}">${PRODUCTS.filter(p => p.cat === c && keep(p)).sort((a, b) => L(a.name).localeCompare(L(b.name))).map(p => `<option value="${p.id}">${esc(L(p.name))}</option>`).join('')}</optgroup>`).join('');
  const addr = u.address;
  const html = `${crumbs([[T('A minha conta', 'My account'), 'conta']])}
  <div class="wrap page-head row-between">
    <div><h1>${T('Olá', 'Hello')}, ${esc(u.name.split(' ')[0])}</h1><p class="muted">${esc(u.username)}, ${esc(u.phone.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3'))}</p></div>
    <div class="row-btns">${u.partner ? `<a class="btn btn-green" href="${href('parceiro')}">${u.partner.kind === 'agricultor' ? T('A minha quinta', 'My farm') : T('O meu restaurante', 'My restaurant')}</a>` : ''}<button class="btn btn-line c-campo" data-logout>${icon('logout', 18)}${T('Terminar sessão', 'Sign out')}</button></div>
  </div>
  <div class="wrap account">
    ${nova ? `<p class="note done" role="status">${icon('check', 22)}<span><b>${T('Subscrição confirmada', 'Subscription confirmed')}: ${esc(L(P(nova.box).name))}.</b> ${T('Primeira entrega', 'First delivery')}: ${slotLabel(nova.first)}. ${T('Preço guardado durante 12 meses.', 'Price saved for 12 months.')}</span></p>` : ''}
    ${u.role === 'admin' ? adminPanel() : `
    <nav class="acc-nav" aria-label="${T('Secções da conta', 'Account sections')}">${[['encomendas', 'box', T('Encomendas', 'Orders')], ['subscricoes', 'repeat', T('Subscrições', 'Subscriptions')], ['colhe', 'sprout', JTH()], ['preferencias', 'heart', T('Favoritos e avisos', 'Favourites and reminders')], ['carteira', 'wallet', T('Saldo e Cooperativa', 'Balance and Co-op')], ['faturas', 'receipt', T('Faturas', 'Invoices')], ['dados', 'user', T('Dados e palavra‑passe', 'Details and password')], ['aspeto', 'palette', T('Aspeto', 'Appearance')]].map(([k, ic, n]) => `<a class="acc-tab" href="#${k}">${icon(ic, 20)}<span>${n}</span></a>`).join('')}<button class="acc-tab chat" data-chat-open>${icon('chat', 20)}<span>${T('Falar com a Daqui', 'Talk to Daqui')}</span></button></nav>
    <section class="acc-sec" id="encomendas"><div class="row-between mb-s"><h2>${T('Histórico de encomendas', 'Order history')}</h2><a class="btn btn-green btn-sm" href="${href('produtos')}">${T('Nova encomenda', 'New order')}</a></div>
      ${ordFeed.length ? ordFeed.map(x => x.html).join('') : `<p class="muted">${T('Ainda não fez nenhuma encomenda com esta conta.', 'You haven\'t placed any orders with this account yet.')}</p>`}</section>
    <section class="acc-sec" id="subscricoes"><div class="row-between mb-s"><h2>${T('As minhas subscrições', 'My subscriptions')}</h2><a class="btn btn-green btn-sm" href="${href('subscricao')}">${T('Nova subscrição', 'New subscription')}</a></div>
      ${(u.subs || []).length ? u.subs.map(subCard).join('') : `<div class="empty"><h3>${T('Ainda não tem subscrições', 'No subscriptions yet')}</h3><p class="muted">${T('Escolha uma Caixa da Estação e receba todas as semanas, com preço garantido durante 12 meses.', 'Pick a Seasonal Box and get it every week, with a 12-month price guarantee.')}</p><a class="btn btn-green" href="${href('subscricao')}">${T('Ver caixas', 'See boxes')}</a></div>`}</section>
    <section class="acc-sec" id="colhe"><div class="row-between mb-s"><h2>${JTH()}</h2><a class="btn btn-line btn-sm c-campo" href="${href('colhe-connosco')}">${T('Ver próximos dias', 'See upcoming days')}</a></div>
      ${harvRows ? `<ul class="hlist">${harvRows}</ul>` : `<p class="muted">${T('Ainda não está inscrito em nenhum dia.', 'You are not signed up for any day yet.')}</p>`}</section>
    ${accWalletSection(u)}${accInvoicesSection(u)}
    <section class="acc-sec" id="preferencias"><h2>${T('Preferências para as caixas', 'Box preferences')}</h2>
      <p class="muted mt-s">${T('Valem para todas as caixas que receber: nas subscrições e nas caixas que comprar uma vez. A equipa Daqui vê estas preferências em cada encomenda de caixa.', 'They apply to every box you get: subscriptions and one-off box orders. The Daqui team sees these preferences on every box order.')}</p>
      ${BACK ? `<p class="note small mt-s">${icon('repeat', 20)}<span>${T('Quando terminar, volte para confirmar a subscrição.', 'When you are done, go back to confirm your subscription.')} <a class="btn btn-green btn-sm" href="${href(BACK, 'retomar=1')}">${T('Voltar à subscrição', 'Back to the subscription')}</a></span></p>` : ''}
      <div class="prefs-grid mt">
        <div><h3>${icon('heart', 20)} ${T('Favoritos', 'Favourites')}</h3>
          <p class="small muted mb-s">${T('Entram primeiro nas caixas quando estão na época. Também pode marcá-los com o coração em cada produto.', 'They go into your boxes first when in season. You can also mark them with the heart on any product.')}</p>
          ${favs.length ? `<ul class="favlist">${favs.map(p => `<li><span class="thumb">${artFor(p)}</span><span><a href="${productHref(p)}"><b>${esc(L(p.name))}</b></a><br><span class="small muted">${inSeason(p) ? T('Na época', 'In season') : T('Volta em', 'Back in') + ' ' + monthName(p.season[0])}</span></span><button class="rm" data-fav-rm="${p.id}" aria-label="${T('Remover', 'Remove')} ${esc(L(p.name))}">${icon('trash', 18)}</button></li>`).join('')}</ul>` : `<p class="muted">${T('Ainda não escolheu favoritos.', 'No favourites yet.')}</p>`}
          <div class="row-gap mt-s"><label class="sr" for="fav-add">${T('Adicionar favorito', 'Add a favourite')}</label><select id="fav-add" class="sel">${prodOptions(p => !favs.includes(p) && !(u.exclude || []).includes(p.id))}</select><button class="btn btn-green btn-sm" data-fav-add>${icon('heart', 16)}${T('Adicionar', 'Add')}</button></div></div>
        <div><h3>${icon('close', 20)} ${T('Não quero receber', 'I\'d rather not get')}</h3>
          <p class="small muted mb-s">${T('Escolha quantos quiser. Substituímos por outros produtos da época.', 'Pick as many as you like. We swap them for other seasonal produce.')}</p>
          ${excl.length ? `<ul class="favlist">${excl.map(p => `<li><span class="thumb">${artFor(p)}</span><span><b>${esc(L(p.name))}</b><br><span class="small muted">${catName(p.cat)}</span></span><button class="rm" data-excl-rm="${p.id}" aria-label="${T('Remover', 'Remove')} ${esc(L(p.name))}">${icon('trash', 18)}</button></li>`).join('')}</ul>${excl.length > 15 ? `<p class="note small">${icon('alert', 20)}<span>${T('Excluiu muitos produtos: as caixas podem repetir mais vezes os mesmos.', 'You excluded a lot: boxes may repeat the same produce more often.')}</span></p>` : ''}` : `<p class="muted">${T('Recebe todos os produtos da época.', 'You get every seasonal product.')}</p>`}
          <div class="row-gap mt-s"><label class="sr" for="excl-add">${T('Produto que não quer receber', 'Product you\'d rather not get')}</label><select id="excl-add" class="sel">${prodOptions(p => !(u.exclude || []).includes(p.id) && !favs.includes(p))}</select><button class="btn btn-line btn-sm c-campo" data-excl-add>${T('Não quero receber', 'Exclude')}</button></div></div>
      </div>
      <div class="mt-l" id="avisos"><h3>${icon('bell', 20)} ${T('Avisar-me quando voltar', 'Notify me when it\'s back')}</h3>
        <p class="small muted mb-s">${T('Produtos fora de época ou sem stock. Quando voltarem a estar disponíveis, recebe uma notificação na app (com as notificações ativas) e aparecem aqui como disponíveis.', 'Products out of season or out of stock. When they are available again you get a notification in the app (with notifications on) and they show here as available.')}</p>
        ${notif.length ? `<ul class="favlist">${notif.map(p => `<li><span class="thumb">${artFor(p)}</span><span><a href="${productHref(p)}"><b>${esc(L(p.name))}</b></a><br><span class="small ${available(p) ? 'c-ok' : 'muted'}">${available(p) ? T('Já está disponível', 'Available now') : !inSeason(p) ? T('Fora de época: volta em', 'Out of season: back in') + ' ' + monthName(p.season[0]) : T('Sem stock de momento', 'Out of stock for now')}</span></span><button class="rm" data-notify-rm="${p.id}" aria-label="${T('Remover aviso', 'Remove reminder')}: ${esc(L(p.name))}">${icon('trash', 18)}</button></li>`).join('')}</ul>` : `<p class="muted">${T('Ainda não pediu nenhum aviso. Nos produtos esgotados ou fora de época, carregue em "Avisar-me".', 'No reminders yet. On sold-out or out-of-season products, tap "Notify me".')}</p>`}
        ${(lst => lst.length ? `<div class="row-gap mt-s"><label class="sr" for="notify-add">${T('Produto para avisar', 'Product to be notified about')}</label><select id="notify-add" class="sel">${['fruta', 'legumes'].map(c => `<optgroup label="${catName(c)}">${lst.filter(p => p.cat === c).map(p => `<option value="${p.id}">${esc(L(p.name))} (${inSeason(p) ? T('sem stock', 'out of stock') : T('volta em', 'back in') + ' ' + monthName(p.season[0], 'short')})</option>`).join('')}</optgroup>`).join('')}</select><button class="btn btn-line btn-sm c-campo" data-notify-add>${icon('bell', 16)}${T('Avisar-me', 'Notify me')}</button></div>` : '')(PRODUCTS.filter(p => p.cat !== 'caixas' && !available(p) && !(u.notify || []).includes(p.id)).sort((a, b) => L(a.name).localeCompare(L(b.name))))}</div></section>
`}
    <section class="acc-sec" id="dados"><h2 class="mb-s">${T('Dados da conta', 'Account details')}</h2>
      <dl class="dl cols2"><div><dt>${T('Nome', 'Name')}</dt><dd>${esc(u.name)}</dd></div><div><dt>${T('Nome de utilizador', 'Username')}</dt><dd>${esc(u.username)}</dd></div><div><dt>${T('Cliente desde', 'Customer since')}</dt><dd>${fdate(u.created, { day: 'numeric', month: 'long', year: 'numeric' })}</dd></div>${isMember(u) ? `<div><dt>${T('Cooperativa', 'Co-op')}</dt><dd>${T('Membro até', 'Member until')} ${fdate(parseISO(u.coopUntil))}</dd></div>` : ''}</dl>
      ${contactForm(u)}
      ${passBox(u)}
      ${u.role === 'admin' ? '' : `<h3 class="mt">${T('Morada de entrega', 'Delivery address')}</h3>
      <p class="small muted">${T('É usada nas encomendas e subscrições com entrega em casa.', 'Used for orders and subscriptions with home delivery.')}</p>
      <form class="form mt-s" data-addr-form novalidate>
        <div class="field"><label for="ad-street">${T('Rua, número e andar', 'Street, number and floor')}</label><input id="ad-street" value="${esc(addr?.street || '')}" required autocomplete="street-address"></div>
        <div class="row"><div class="field"><label for="ad-postal">${T('Código postal', 'Postcode')}</label><input id="ad-postal" value="${esc(addr?.postal || '')}" required placeholder="3810-000"></div><div class="field"><label for="ad-town">${T('Localidade', 'Town')}</label><input id="ad-town" value="${esc(addr?.town || '')}" required></div></div>
        <p class="err" hidden></p>
        <div class="row-btns"><button class="btn btn-green btn-sm" type="submit">${addr ? T('Atualizar morada', 'Update address') : T('Guardar morada', 'Save address')}</button>${addr ? `<button type="button" class="btn btn-line btn-sm c-tomato" data-addr-rm>${T('Apagar morada', 'Delete address')}</button>` : ''}</div>
      </form>`}</section>
    ${accLookSection()}
  </div><div class="spacer"></div>`;
  return { title: T('A minha conta', 'My account'), html, after: () => { const sec = QS.get('sec'); if (sec) setTimeout(() => document.getElementById(sec)?.scrollIntoView(), 60); } };
};
/* alterar a palavra-passe (em "Dados da conta": clientes, agricultores, restaurantes e gestão; no site e na app) */
function passBox(u) {
  const pf = (id, label, ac, hint = '') => `<div class="field"><label for="${id}">${label}</label><div class="pw"><input id="${id}" type="password" autocomplete="${ac}" required><button type="button" class="pw-t" data-pw="${id}" aria-label="${T('Mostrar palavra-passe', 'Show password')}">${icon('eye', 20)}</button></div>${hint ? `<span class="small muted">${hint}</span>` : ''}</div>`;
  return `<details class="pw-box mt" id="palavra-passe"><summary>${icon('lock', 18)} ${T('Alterar palavra-passe', 'Change password')}</summary>
    <form class="form mt-s" data-pass-form novalidate>
      <input type="text" autocomplete="username" value="${esc(u.username)}" hidden>
      ${pf('pw-cur', T('Palavra-passe atual', 'Current password'), 'current-password')}
      ${pf('pw-new', T('Nova palavra-passe', 'New password'), 'new-password', T('Mínimo de 8 caracteres.', 'At least 8 characters.'))}
      ${pf('pw-new2', T('Repetir a nova palavra-passe', 'Repeat the new password'), 'new-password')}
      <p class="err" role="alert" hidden></p>
      <button class="btn btn-green btn-sm" type="submit">${T('Guardar nova palavra-passe', 'Save new password')}</button>
    </form></details>`;
}
PAGE_EVENTS.submit.push((e, f) => {
  if (!f.matches('[data-pass-form]')) return; e.preventDefault(); if (!validate(f)) return true;
  const err = $('.err', f), btn = $('button[type="submit"]', f), cur = $('#pw-cur', f), nw = $('#pw-new', f), nw2 = $('#pw-new2', f);
  const show = (msg, el) => { err.hidden = false; err.textContent = msg; if (el) { el.setAttribute('aria-invalid', 'true'); el.focus(); } return true; };
  if (nw.value.length < 8) return show(T('A nova palavra-passe tem de ter pelo menos 8 caracteres.', 'The new password must have at least 8 characters.'), nw);
  if (nw.value !== nw2.value) return show(T('As duas novas palavras-passe não são iguais.', 'The two new passwords don\'t match.'), nw2);
  const msgs = { cur: [T('A palavra-passe atual não está certa.', 'The current password is wrong.'), cur], short: [T('A nova palavra-passe tem de ter pelo menos 8 caracteres.', 'The new password must have at least 8 characters.'), nw],
    same: [T('A nova palavra-passe tem de ser diferente da atual.', 'The new password must be different from the current one.'), nw], weak: [T('A nova palavra-passe é demasiado fraca. Junte números ou outros caracteres.', 'The new password is too weak. Add numbers or other characters.'), nw],
    reauth: [T('Por segurança, termine a sessão, volte a entrar e tente outra vez.', 'For security, sign out, sign in again and try once more.')], session: [T('A sessão terminou. Volte a entrar e tente outra vez.', 'Your session ended. Sign in again and try once more.')] };
  btn.disabled = true; btn.classList.add('busy');
  Promise.resolve(changePassword(cur.value, nw.value)).then(r => {
    btn.disabled = false; btn.classList.remove('busy');
    if (r) { const [m, el] = msgs[r] || [T('Não foi possível alterar a palavra-passe.', 'Could not change the password.')]; return show(m, el); }
    f.reset(); err.hidden = true; f.closest('details')?.removeAttribute('open');
    toast(T('Palavra-passe alterada', 'Password changed'));
  }, x => { console.error(x); btn.disabled = false; btn.classList.remove('busy'); show(T('Não foi possível ligar à base de dados. Verifique a internet e tente outra vez.', 'Could not reach the database. Check your connection and try again.')); });
  return true;
});
let BACK = (() => { const b = QS.get('voltar') || ''; return /^subscricao\/[a-z0-9-]+$/.test(b) ? b : ''; })();
function rerenderKeep(sel) { const y = scrollY; render(); scrollTo(0, y); if (sel) $(sel)?.focus(); }
PAGE_EVENTS.click.push((e, t, d) => {
  if (PAGE !== 'conta') return; const u = currentUser(); if (!u) return;
  const sub = id => (u.subs || []).find(s => s.id === id);
  if (d.subPause) { const s = sub(d.subPause); s.status = s.status === 'ativa' ? 'pausada' : 'ativa'; saveUsers(); toast(s.status === 'ativa' ? T('Subscrição retomada', 'Subscription resumed') : T('Subscrição em pausa', 'Subscription paused')); rerenderKeep(`[data-sub-pause="${s.id}"]`); return true; }
  if (d.subCancel) { const s = sub(d.subCancel); openModal(`<div class="mbody"><h2>${T('Cancelar subscrição?', 'Cancel subscription?')}</h2><p>${T(`A ${L(P(s.box).name)} deixa de ser entregue. Se voltar a subscrever, o preço será o do dia.`, `The ${L(P(s.box).name)} will stop being delivered. If you subscribe again, you'll pay that day's price.`)}</p><div class="row-btns"><button class="btn btn-green" data-modal-close>${T('Manter subscrição', 'Keep subscription')}</button><button class="btn btn-line c-tomato" data-sub-cancel-ok="${s.id}">${T('Cancelar subscrição', 'Cancel subscription')}</button></div></div>`, T('Cancelar subscrição', 'Cancel subscription')); return true; }
  if (d.subCancelOk) { u.subs = u.subs.filter(s => s.id !== d.subCancelOk); saveUsers(); closeModal(); toast(T('Subscrição cancelada', 'Subscription cancelled')); rerenderKeep(); return true; }
  if ('notifyAdd' in d) { const id = $('#notify-add').value; if (id && !(u.notify || []).includes(id)) { u.notify = (u.notify || []).concat(id); saveUsers(); toast(T(`Aviso ativo: ${L(P(id).name)}`, `Reminder on: ${L(P(id).name)}`)); } rerenderKeep('#notify-add'); return true; }
  if (d.notifyRm) { u.notify = (u.notify || []).filter(x => x !== d.notifyRm); saveUsers(); rerenderKeep(); return true; }
  if (d.favRm) { u.favs = (u.favs || []).filter(x => x !== d.favRm); saveUsers(); rerenderKeep('#fav-add'); return true; }
  if (d.exclRm) { u.exclude = (u.exclude || []).filter(x => x !== d.exclRm); saveUsers(); rerenderKeep('#excl-add'); return true; }
  if ('exclAdd' in d) { const id = $('#excl-add').value; if (id) { u.exclude = [...(u.exclude || []), id]; u.favs = (u.favs || []).filter(x => x !== id); saveUsers(); toast(T(`Não vai receber: ${L(P(id).name)}`, `You won't get: ${L(P(id).name)}`)); rerenderKeep('#excl-add'); } return true; }
  if ('favAdd' in d) { const id = $('#fav-add').value; if (id) { u.favs = [...(u.favs || []), id]; u.exclude = (u.exclude || []).filter(x => x !== id); saveUsers(); toast(T(`Adicionado aos favoritos: ${L(P(id).name)}`, `Added to favourites: ${L(P(id).name)}`)); rerenderKeep('#fav-add'); } return true; }
  if (d.reorder) { const o = findOrder(d.reorder); o.items.forEach(i => { if (P(i.id) && (inSeason(P(i.id)) || P(i.id).cat === 'caixas')) addToCart(i.id, i.size ? { size: i.size } : { bio: !!i.bio }, i.qty); }); openCart(); return true; }
  if ('addrRm' in d) { u.address = null; saveUsers(); toast(T('Morada apagada', 'Address deleted')); rerenderKeep(); return true; }
});
PAGE_EVENTS.change.push((e, t) => {
  if (PAGE !== 'conta' || !t.dataset.subFreq) return; const u = currentUser(); const s = (u.subs || []).find(x => x.id === t.dataset.subFreq);
  s.freq = t.value; saveUsers(); toast(T('Frequência alterada', 'Frequency updated')); rerenderKeep(`[data-sub-freq="${s.id}"]`);
});
PAGE_EVENTS.submit.push((e, f) => {
  if (!f.matches('[data-rate-form]')) return; e.preventDefault();
  const u = currentUser(), dd = HD(f.dataset.rateForm), h = u && dd && (u.harvests || []).find(x => hIs(x, dd));
  if (!h || !dd) return true;
  const k = dd.id.replace(/[^a-zA-Z0-9-]/g, '_'), err = $('.err', f), v = +($(`input[name="rt-${k}"]:checked`, f) || {}).value;
  if (h.rating) { err.hidden = false; err.textContent = T('Já avaliou este dia.', 'You have already reviewed this day.'); return true; }
  if (!harvestRateOpen(dd)) { err.hidden = false; err.textContent = T('As avaliações deste dia já fecharam.', 'Reviews for this day are closed.'); return true; }
  if (!v) { err.hidden = false; err.textContent = T('Escolha de 1 a 5 estrelas.', 'Choose 1 to 5 stars.'); return true; }
  h.rating = v; h.comment = $(`#rc-${k}`, f).value.trim().slice(0, 600); h.ratedAt = nowISO(); saveUsers();
  toast(T('Obrigado pela avaliação!', 'Thank you for your review!')); rerenderKeep(); return true;
});
PAGE_EVENTS.submit.push((e, f) => {
  if (!f.matches('[data-addr-form]')) return; e.preventDefault(); if (!validate(f)) return true;
  const pc = $('#ad-postal').value.trim(); if (!/^\d{4}-\d{3}$/.test(pc)) { const err = $('.err', f); err.hidden = false; err.textContent = T('O código postal deve ter o formato 3810-000.', 'The postcode must look like 3810-000.'); $('#ad-postal').focus(); return true; }
  const u = currentUser(); u.address = { street: $('#ad-street').value.trim(), postal: pc, town: $('#ad-town').value.trim() }; saveUsers(); toast(T('Morada guardada', 'Address saved')); rerenderKeep(); return true;
});
