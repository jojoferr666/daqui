/* ===== Daqui — faturas em PDF (demonstração) =====
   Gera faturas profissionais para encomendas, caixas de subscrição, colheitas do Colhe Connosco e quota da Cooperativa,
   e recibos dos carregamentos do Saldo Daqui. O PDF é escrito aqui mesmo (sem bibliotecas): texto em Helvetica,
   linhas e retângulos. No site descarrega o ficheiro; na app Android abre a janela de partilha (guardar, enviar…).
   Documentos de demonstração: não têm valor fiscal. */
const COMPANY = { name: 'Daqui, Cooperativa de Distribuição Agrícola, CRL', addr: 'Rua da Pega 12, 3800-000 Aveiro', nif: '599 000 000', email: 'faturas@daqui.pt' };
const VAT_FOOD = 6, VAT_STD = 23;

/* ---------- documentos de uma conta ---------- */
function invoicesOf(u) {
  const out = [];
  ORDERS.filter(o => (o.user === u.username || (u._id && o._uid === u._id)) && o.status !== 'cancelada').forEach(o => out.push({ key: `order|${o.num}`, kind: 'order', at: String(o.created), title: T(`Encomenda ${o.num}`, `Order ${o.num}`), total: +o.total }));
  harvestRecords(u).filter(x => x.rec && x.rec.price != null).forEach(x => out.push({ key: `colhe|${x.d.id}|${u.username}`, kind: 'colhe', at: x.d.date, title: `${JTH()}: ${L(x.d.what)}`, total: +x.rec.price }));
  walletOf(u).forEach(m => { if (m.kind === 'quota') out.push({ key: `mov|${m.id}`, kind: 'quota', at: String(m.at), title: T('Quota anual da Cooperativa', 'Co-op yearly fee'), total: m.value }); if (m.kind === 'carregamento') out.push({ key: `mov|${m.id}`, kind: 'topup', at: String(m.at), title: T('Carregamento do Saldo Daqui', 'Daqui balance top-up'), total: m.value }); });
  PREPS.filter(p => p.user === uidOf(u) && p.date <= iso(today())).forEach(p => { const s = (u.subs || []).find(x => x.id === p.sub); if (s) out.push({ key: `prep|${p.id}|${u.username}`, kind: 'box', at: p.date, title: `${L(P(s.box).name)} (${fdate(parseISO(p.date))})`, total: s.locked }); });
  return out.sort((a, b) => b.at.localeCompare(a.at));
}
/* número da fatura: série por tipo de documento, derivado da referência (estável entre visitas) */
const docNo = (series, ref) => { let h = 0; for (const c of String(ref)) h = (h * 31 + c.charCodeAt(0)) % 99991; return `${series} 2026/${String(h).padStart(5, '0')}`; };
/* linhas da fatura: [{ desc, qty, unit, price (com IVA), vat }] e totais */
function invoiceData(key) {
  const [kind, a, b] = key.split('|'), u = currentUser();
  const buyer = u ? { name: (u.billing && u.billing.name) || u.name, nif: u.nif || '', addr: u.billing ? `${u.billing.address || ''}${u.billing.postal ? ', ' + u.billing.postal : ''} ${u.billing.town || ''}`.trim() : u.address ? `${u.address.street}, ${u.address.postal} ${u.address.town}` : '' } : { name: '', nif: '', addr: '' };
  if (kind === 'order') {
    const o = findOrder(a); if (!o) return null;
    const lines = o.items.map(i => { const p = P(i.id); return { desc: p ? `${L(p.name)}${i.size ? ` (${sizeName(i.size)})` : ''}${i.bio ? ` (${T('biológico', 'organic')})` : ''}` : i.id, qty: i.qty, unit: p && byKg(p) ? 'kg' : T('un.', 'pc'), price: i.price, vat: VAT_FOOD }; });
    if (+o.discount) lines.push({ desc: T('Desconto (promoção)', 'Discount (promotion)'), qty: 1, unit: '', price: -o.discount, vat: VAT_FOOD });
    if (+o.boxesFee) lines.push({ desc: T('Caixas de cartão Daqui', 'Daqui cardboard boxes'), qty: 1, unit: '', price: +o.boxesFee, vat: VAT_STD });
    if (+o.fee) lines.push({ desc: o.deliver === 'home' ? T('Entrega em casa', 'Home delivery') : T('Entrega no ponto de recolha', 'Delivery to pick-up point'), qty: 1, unit: '', price: +o.fee, vat: VAT_STD });
    return { type: T('Fatura-recibo', 'Invoice-receipt'), no: docNo('FR', o.num), date: o.created, ref: o.num, buyer: Object.assign(buyer, o.user ? {} : { name: o.name }), lines, paid: [[payName(o.balance && o.total - o.balance <= 0 ? 'saldo' : o.pay), round2(o.total - (+o.balance || 0))], ...(o.balance ? [[payName('saldo'), +o.balance]] : [])].filter(x => x[1] > 0) };
  }
  if (kind === 'colhe') {
    const d = HD(a), uu = USERS[b] || u, h = uu && (uu.harvests || []).find(x => hIs(x, d)), rec = h && h.record; if (!d || !rec) return null;
    return { type: T('Fatura-recibo', 'Invoice-receipt'), no: docNo('FR', recId(h, d, uu.username)), date: d.date, ref: recId(h, d, uu.username), buyer,
      lines: [{ desc: `${JTH()}: ${L(d.what)} (${(F(d.farmer) || {}).farm || d.farmer})`, qty: +rec.kg || 1, unit: 'kg', price: rec.kg ? round2(rec.price / rec.kg) : rec.price, vat: VAT_FOOD, total: +rec.price }], paid: [[T('Pago no local', 'Paid on site'), +rec.price]] };
  }
  if (kind === 'mov') {
    const m = WALLET.find(x => String(x.id) === a); if (!m) return null;
    if (m.kind === 'carregamento') return { type: T('Recibo', 'Receipt'), no: docNo('RC', m.id), date: m.at, ref: '', buyer, receipt: true, lines: [{ desc: T('Carregamento do Saldo Daqui (pagamento antecipado)', 'Daqui balance top-up (prepayment)'), qty: 1, unit: '', price: m.value, vat: 0 }], paid: [[payName(m.method), m.value]] };
    const [ini, fim] = (m.ref || '').split('/');
    return { type: T('Fatura-recibo', 'Invoice-receipt'), no: docNo('FR', 'Q' + m.id), date: m.at, ref: '', buyer,
      lines: [{ desc: `${T('Quota anual da Cooperativa Daqui', 'Daqui Co-op yearly fee')}${ini ? ` (${fdate(parseISO(ini))} – ${fdate(parseISO(fim))})` : ''}`, qty: 1, unit: '', price: m.value, vat: VAT_STD }], paid: [[payName(m.method), m.value]] };
  }
  if (kind === 'prep') {
    const pr = PREPS.find(x => x.id === a), uu = USERS[b] || u, s = pr && uu && (uu.subs || []).find(x => x.id === pr.sub); if (!s) return null;
    const q = quote([{ id: s.box, qty: 1, price: s.locked, opts: { kg: s.kg } }], s.deliver, uu, null, false);
    const lines = [{ desc: `${L(P(s.box).name)}, ${sizeName(s.size)} (${s.kg} kg): ${pr.items.map(i => P(i.id) ? L(P(i.id).name) : i.id).join(', ')}`, qty: 1, unit: '', price: s.locked, vat: VAT_FOOD }];
    if (q.boxes.fee) lines.push({ desc: T('Caixa de cartão Daqui', 'Daqui cardboard box'), qty: 1, unit: '', price: q.boxes.fee, vat: VAT_STD });
    if (q.ship.fee) lines.push({ desc: s.deliver === 'home' ? T('Entrega em casa', 'Home delivery') : T('Entrega no ponto de recolha', 'Delivery to pick-up point'), qty: 1, unit: '', price: q.ship.fee, vat: VAT_STD });
    return { type: T('Fatura-recibo', 'Invoice-receipt'), no: docNo('FR', pr.id), date: pr.date, ref: s.id, buyer, lines, paid: [[payName(s.pay || 'mbway'), q.total]] };
  }
  return null;
}
function invoiceTotals(d) {
  const rows = d.lines.map(l => { const tot = l.total != null ? l.total : round2(l.price * l.qty); const base = round2(tot / (1 + l.vat / 100)); return Object.assign({}, l, { tot, base, tax: round2(tot - base) }); });
  const byVat = {}; rows.forEach(r => { const k = r.vat; byVat[k] = byVat[k] || { base: 0, tax: 0 }; byVat[k].base = round2(byVat[k].base + r.base); byVat[k].tax = round2(byVat[k].tax + r.tax); });
  return { rows, byVat, total: round2(rows.reduce((a, r) => a + r.tot, 0)) };
}
const fmtE = v => money(v).replace(/ /g, ' ');

/* ---------- vista no ecrã ---------- */
function invoiceHTML(d) {
  const t = invoiceTotals(d);
  return `<div class="invoice">
    <div class="inv-head"><div><img src="${LOGO_GOLD}" alt="Daqui" width="96"><p class="small">${esc(COMPANY.name)}<br>${esc(COMPANY.addr)}<br>NIF ${COMPANY.nif}</p></div>
      <div class="ta-r"><h2>${esc(d.type)}</h2><p><b>${esc(d.no)}</b><br><span class="small muted">${fdate(String(d.date).slice(0, 10) ? parseISO(String(d.date).slice(0, 10)) : today(), { day: 'numeric', month: 'long', year: 'numeric' })}</span>${d.ref ? `<br><span class="small muted">${T('Referência', 'Reference')}: ${esc(d.ref)}</span>` : ''}</p></div></div>
    <div class="inv-buyer"><span class="lbl">${T('Cliente', 'Customer')}</span><b>${esc(d.buyer.name || T('Consumidor final', 'Final consumer'))}</b><span class="small">${T('NIF', 'Tax no.')}: ${esc(d.buyer.nif || T('consumidor final', 'final consumer'))}${d.buyer.addr ? `<br>${esc(d.buyer.addr)}` : ''}</span></div>
    <table class="tbl inv-tbl"><thead><tr><th>${T('Descrição', 'Description')}</th><th class="ta-r">${T('Qtd.', 'Qty')}</th><th class="ta-r">${T('Preço', 'Price')}</th><th class="ta-r">${T('IVA', 'VAT')}</th><th class="ta-r">Total</th></tr></thead>
      <tbody>${t.rows.map(r => `<tr><td>${esc(r.desc)}</td><td class="ta-r">${numFmt(r.qty)}${r.unit ? ' ' + r.unit : ''}</td><td class="ta-r">${money(r.price)}</td><td class="ta-r">${r.vat}%</td><td class="ta-r">${money(r.tot)}</td></tr>`).join('')}</tbody></table>
    <div class="inv-sum"><dl class="dl">${Object.entries(t.byVat).map(([v, x]) => `<div><dt>${T('Base', 'Base')} ${v}%</dt><dd>${money(x.base)}</dd></div><div><dt>${T('IVA', 'VAT')} ${v}%</dt><dd>${money(x.tax)}</dd></div>`).join('')}
      <div class="tot"><dt>Total</dt><dd>${money(t.total)}</dd></div>${d.paid.map(([m, v]) => `<div><dt>${T('Pago com', 'Paid with')} ${esc(m)}</dt><dd>${money(v)}</dd></div>`).join('')}</dl></div>
    <p class="small muted mt">${T('Documento de demonstração, sem valor fiscal (projeto académico IPA, Universidade de Aveiro). Preços com IVA incluído.', 'Demonstration document with no tax value (IPA academic project, University of Aveiro). Prices include VAT.')} ATCUD: DEMO-${d.no.replace(/\D/g, '')}</p></div>`;
}
function openInvoice(key) {
  const d = invoiceData(key); if (!d) { toast(T('Documento não encontrado.', 'Document not found.')); return; }
  openModal(`<div class="mbody">${invoiceHTML(d)}<div class="row-btns mt"><button class="btn btn-green" data-invoice-pdf="${esc(key)}">${icon('download', 18)} ${T('Descarregar PDF', 'Download PDF')}</button><button class="btn btn-line c-campo" data-modal-close>${T('Fechar', 'Close')}</button></div></div>`, d.type);
}

/* ---------- PDF (A4, Helvetica, texto em WinAnsi para os acentos e o €) ---------- */
const HW = [278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584];
const HB = [278,333,474,556,556,889,722,238,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,333,333,584,584,584,611,975,722,722,722,722,667,611,778,722,278,556,722,611,833,722,778,667,778,722,667,611,722,667,944,667,667,611,333,278,333,584,556,333,556,611,556,611,556,333,611,611,278,278,556,278,889,611,611,611,611,389,556,333,611,556,778,556,556,500,389,280,389,584];
const winAnsi = ch => { const c = ch.charCodeAt(0); if (c < 128) return c; if (ch === '€') return 128; if (ch === '–') return 150; if (ch === '—') return 151; if (ch === '‘' || ch === '’') return 39; if (ch === '“' || ch === '”') return 34; if (ch === '…') return 133; return c <= 255 ? c : 63; };
const baseCh = ch => ch.normalize('NFD')[0];
function textW(s, size, bold) { const w = bold ? HB : HW; let t = 0; for (const ch of String(s)) { const b = baseCh(ch), c = b.charCodeAt(0); t += ch === '€' ? 556 : c >= 32 && c <= 126 ? w[c - 32] : 556; } return t * size / 1000; }
function pdfStr(s) { let o = ''; for (const ch of String(s)) { const c = winAnsi(ch); if (c === 40 || c === 41 || c === 92) o += '\\' + String.fromCharCode(c); else if (c < 32 || c > 126) o += '\\' + c.toString(8).padStart(3, '0'); else o += String.fromCharCode(c); } return o; }
function wrap(s, size, bold, maxW) { const words = String(s).split(' '), lines = []; let cur = ''; for (const w of words) { const t = cur ? cur + ' ' + w : w; if (textW(t, size, bold) > maxW && cur) { lines.push(cur); cur = w; } else cur = t; } if (cur) lines.push(cur); return lines; }
function invoicePDF(d) {
  const t = invoiceTotals(d), W = 595.28, H = 841.89, M = 48; let ops = [], y = H - M;
  const txt = (s, x, yy, size = 10, bold = false, color = '0.17 0.20 0.10', align = 'l') => { const xx = align === 'r' ? x - textW(s, size, bold) : x; ops.push(`BT ${color} rg /${bold ? 'F2' : 'F1'} ${size} Tf ${xx.toFixed(2)} ${yy.toFixed(2)} Td (${pdfStr(s)}) Tj ET`); };
  const rect = (x, yy, w, h, color) => ops.push(`${color} rg ${x} ${yy} ${w} ${h} re f`);
  const line = (x1, y1, x2, y2, color = '0.78 0.80 0.70', wd = 0.7) => ops.push(`${color} RG ${wd} w ${x1} ${y1} m ${x2} ${y2} l S`);
  /* cabeçalho verde com o nome */
  rect(0, H - 92, W, 92, '0.235 0.380 0.016');
  txt('Daqui', M, H - 52, 28, true, '0.97 0.84 0.30'); txt(T('Fruta e legumes do campo para a sua casa', 'Fruit and vegetables from the field to your home'), M, H - 72, 9, false, '1 1 1');
  txt(d.type, W - M, H - 50, 16, true, '1 1 1', 'r'); txt(d.no, W - M, H - 70, 11, false, '0.97 0.84 0.30', 'r');
  y = H - 120;
  txt(COMPANY.name, M, y, 9, true); txt(COMPANY.addr, M, y - 13, 9); txt('NIF ' + COMPANY.nif + '  ·  ' + COMPANY.email, M, y - 26, 9);
  const dt = String(d.date).slice(0, 10);
  txt(T('Data', 'Date') + ': ' + fdate(parseISO(dt), { day: 'numeric', month: 'long', year: 'numeric' }), W - M, y, 9, false, undefined, 'r');
  if (d.ref) txt(T('Referência', 'Reference') + ': ' + d.ref, W - M, y - 13, 9, false, undefined, 'r');
  y -= 56;
  rect(M, y - 52, W - 2 * M, 62, '0.96 0.95 0.89');
  txt(T('Cliente', 'Customer'), M + 12, y - 6, 8, true, '0.40 0.45 0.30');
  txt(d.buyer.name || T('Consumidor final', 'Final consumer'), M + 12, y - 21, 11, true);
  txt(T('NIF', 'Tax no.') + ': ' + (d.buyer.nif || T('consumidor final', 'final consumer')), M + 12, y - 35, 9);
  if (d.buyer.addr) txt(d.buyer.addr, M + 12, y - 47, 9);
  y -= 80;
  /* tabela */
  const cx = [M, W - M - 230, W - M - 160, W - M - 80, W - M];
  rect(M, y - 6, W - 2 * M, 20, '0.235 0.380 0.016');
  [[T('Descrição', 'Description'), cx[0] + 6, 'l'], [T('Qtd.', 'Qty'), cx[1] + 40, 'r'], [T('Preço', 'Price'), cx[2] + 60, 'r'], [T('IVA', 'VAT'), cx[3] + 30, 'r'], ['Total', cx[4] - 6, 'r']].forEach(([s, x, a]) => txt(s, x, y, 9, true, '1 1 1', a));
  y -= 22;
  t.rows.forEach(r => {
    const ls = wrap(r.desc, 9.5, false, cx[1] - cx[0] - 20);
    ls.forEach((l, i) => txt(l, cx[0] + 6, y - i * 12, 9.5));
    txt(numFmt(r.qty) + (r.unit ? ' ' + r.unit : ''), cx[1] + 40, y, 9.5, false, undefined, 'r');
    txt(fmtE(r.price), cx[2] + 60, y, 9.5, false, undefined, 'r'); txt(r.vat + '%', cx[3] + 30, y, 9.5, false, undefined, 'r'); txt(fmtE(r.tot), cx[4] - 6, y, 9.5, true, undefined, 'r');
    y -= Math.max(1, ls.length) * 12 + 6; line(M, y + 8, W - M, y + 8);
    if (y < 200) { y = 200; }
  });
  /* resumo do IVA e total */
  y -= 10; let sy = y;
  Object.entries(t.byVat).forEach(([v, x]) => { txt(`${T('Base tributável', 'Taxable base')} ${v}%`, W - M - 170, sy, 9); txt(fmtE(x.base), W - M, sy, 9, false, undefined, 'r'); sy -= 13; txt(`${T('IVA', 'VAT')} ${v}%`, W - M - 170, sy, 9); txt(fmtE(x.tax), W - M, sy, 9, false, undefined, 'r'); sy -= 15; });
  rect(W - M - 180, sy - 10, 180, 24, '0.97 0.84 0.30'); txt('Total', W - M - 170, sy - 2, 12, true); txt(fmtE(t.total), W - M - 8, sy - 2, 12, true, undefined, 'r'); sy -= 34;
  d.paid.forEach(([m, v]) => { txt(`${T('Pago com', 'Paid with')} ${m}`, W - M - 170, sy, 9); txt(fmtE(v), W - M, sy, 9, false, undefined, 'r'); sy -= 13; });
  /* rodapé */
  line(M, 70, W - M, 70);
  txt(T('Documento de demonstração, sem valor fiscal. Projeto académico IPA, Universidade de Aveiro.', 'Demonstration document with no tax value. IPA academic project, University of Aveiro.'), M, 56, 8, false, '0.45 0.48 0.38');
  txt(`ATCUD: DEMO-${d.no.replace(/\D/g, '')}  ·  ${T('Preços com IVA incluído', 'Prices include VAT')}`, M, 44, 8, false, '0.45 0.48 0.38');
  txt(T('Obrigado por comprar a quem produz.', 'Thank you for buying from the people who grow it.'), W - M, 44, 8, true, '0.235 0.380 0.016', 'r');
  /* montar o ficheiro */
  const content = ops.join('\n');
  const objs = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`, `<< /Title (${pdfStr(d.type + ' ' + d.no)}) /Producer (Daqui) >>`];
  let pdf = '%PDF-1.4\n%âãÏÓ\n'; const offs = [];
  objs.forEach((o, i) => { offs.push(pdf.length); pdf += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const xref = pdf.length;
  pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${offs.map(o => String(o).padStart(10, '0') + ' 00000 n \n').join('')}trailer\n<< /Size ${objs.length + 1} /Root 1 0 R /Info 7 0 R >>\nstartxref\n${xref}\n%%EOF`;
  const bytes = new Uint8Array(pdf.length); for (let i = 0; i < pdf.length; i++) bytes[i] = pdf.charCodeAt(i) & 255;
  return new Blob([bytes], { type: 'application/pdf' });
}
async function downloadInvoice(key) {
  const d = invoiceData(key); if (!d) return;
  const blob = invoicePDF(d), name = `Daqui-${d.no.replace(/[^A-Z0-9]+/gi, '-')}.pdf`;
  if (typeof NATIVO !== 'undefined' && NATIVO.isNative && NATIVO.shareFile) { try { await NATIVO.shareFile(blob, name); return; } catch (e) { console.warn(e); } }
  const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000);
}
PAGE_EVENTS.click.push((e, t, d) => {
  if (d.invoice) { openInvoice(d.invoice); return true; }
  if (d.invoicePdf) { downloadInvoice(d.invoicePdf); return true; }
});
