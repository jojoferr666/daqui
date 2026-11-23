/* ===== Daqui — biblioteca de ilustrações (SVG inline, estilo plano como o logótipo) =====
   Cada produto é desenhado numa caixa de 120x120. Para um produto novo, crie um desenho em ART
   e use o mesmo nome no campo "art" do produto em js/data.js. */
const C = {
  campo:'#3C6104', pera:'#F2C663', peraL:'#F8DC9A', folha:'#22380A', leaf:'#6E8B2E',
  leafL:'#9DB956', sage:'#EFF2DF', wood:'#C48A45', woodD:'#9C6A30', woodL:'#D9A764',
  red:'#C2412D', redL:'#DE6A4E', orange:'#E07B2A', orangeL:'#F09A4C', brown:'#8A6A3A'
};
const _stem = (d, c = C.folha, w = 3) => `<path d="${d}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round"/>`;
const _leaf = (x, y, r = 0, s = 1, c = C.leaf) => `<path transform="translate(${x} ${y}) rotate(${r}) scale(${s})" d="M0 0c6-9 16-11 22-8-5 8-14 11-22 8z" fill="${c}"/>`;
const _rnd = (seed => () => (seed = (seed * 9301 + 49297) % 233280) / 233280);

/* --- generators --- */
function apple(body, hi, extra = '') {
  return `<path d="M60 40c-9-7-27-7-33 7-7 15 0 35 10 46 8 8 15 9 23 5 8 4 15 3 23-5 10-11 17-31 10-46-6-14-24-14-33-7z" fill="${body}"/>${extra}
  <path d="M36 52c-4 9-2 22 5 32 3 4 7 7 11 8-9-7-14-22-10-36 1-3 2-5 4-7-4 0-8 1-10 3z" fill="${hi}"/>
  ${_stem('M60 41c0-9 2-15 7-19')}${_leaf(64, 30, 0, 1)}`;
}
function pear(body, hi) {
  return `<path d="M60 24c-7 0-9 7-9 15 0 9-5 13-11 21-6 8-9 15-9 24 0 16 13 26 29 26s29-10 29-26c0-9-3-16-9-24-6-8-11-12-11-21 0-8-2-15-9-15z" fill="${body}"/>
  <path d="M51 39c0 9-5 13-11 21-6 8-9 15-9 24 0 13 8 22 20 25-7-6-11-15-11-25 0-12 5-20 9-27 3-6 3-12 2-18z" fill="${hi}"/>
  ${_stem('M60 25c0-6 2-10 6-13')}${_leaf(64, 18, -10, 1)}`;
}
function citrus(c, hi, dot, o = {}) {
  const rx = o.rx || 34, ry = o.ry || 34, cy = o.cy || 68, rot = o.rot || 0;
  const r = _rnd(rx * 7 + ry);
  const dots = Array.from({ length: 16 }, () => { const a = r() * 6.28, d = r() * .8; return `<circle cx="${(60 + Math.cos(a) * rx * d).toFixed(1)}" cy="${(cy + Math.sin(a) * ry * d).toFixed(1)}" r="1.1" fill="${dot}"/>`; }).join('');
  const tips = o.tips ? `<ellipse cx="${60 - rx + 1}" cy="${cy}" rx="6" ry="5" fill="${c}"/><ellipse cx="${60 + rx - 1}" cy="${cy}" rx="6" ry="5" fill="${c}"/>` : '';
  return `<g transform="rotate(${rot} 60 ${cy})">${tips}<ellipse cx="60" cy="${cy}" rx="${rx}" ry="${ry}" fill="${c}"/>
  <ellipse cx="${60 - rx * .38}" cy="${cy - ry * .32}" rx="${rx * .32}" ry="${ry * .22}" fill="${hi}" transform="rotate(-30 ${60 - rx * .38} ${cy - ry * .32})"/>${dots}</g>
  ${o.noLeaf ? '' : `${_stem(`M60 ${cy - ry + 2}c0-4 1-7 3-9`, '#4A5A1A', 2.6)}${_leaf(62, cy - ry - 6, -20, 1.05)}`}`;
}
function stone(c, blush, hi, o = {}) {
  const rx = o.rx || 32, ry = o.ry || 33, cy = o.cy || 68;
  return `<ellipse cx="60" cy="${cy}" rx="${rx}" ry="${ry}" fill="${c}"/>
  <ellipse cx="${60 + rx * .3}" cy="${cy + ry * .1}" rx="${rx * .6}" ry="${ry * .7}" fill="${blush}" opacity=".75"/>
  <ellipse cx="${60 - rx * .45}" cy="${cy - ry * .35}" rx="${rx * .25}" ry="${ry * .18}" fill="${hi}" transform="rotate(-35 ${60 - rx * .45} ${cy - ry * .35})"/>
  <path d="M60 ${cy - ry + 3}c-8 14-8 ${ry + 14} 2 ${ry * 2 - 8}" stroke="rgba(0,0,0,.18)" stroke-width="2.4" fill="none"/>
  ${_stem(`M60 ${cy - ry + 2}c0-5 1-8 3-10`, '#5A4320', 2.6)}${o.noLeaf ? '' : _leaf(63, cy - ry - 6, -15, 1)}`;
}
function grapes(c, hi, leafC = C.leaf) {
  const pos = [[44, 46], [60, 44], [76, 46], [36, 60], [52, 60], [68, 60], [84, 60], [44, 74], [60, 74], [76, 74], [52, 88], [68, 88], [60, 101]];
  return `<path d="M60 40c4-10 6-16 4-22" stroke="#6B4E2A" stroke-width="3.2" fill="none" stroke-linecap="round"/>
  <path d="M64 26c10-14 28-14 36-6-6 2-8 6-6 12-10-2-18 0-30-6z" fill="${leafC}"/>
  ${pos.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9.5" fill="${c}"/><circle cx="${x - 3}" cy="${y - 3}" r="2.6" fill="${hi}"/>`).join('')}`;
}
function berries(c, hi, o = {}) {
  const pos = o.pos || [[40, 72], [62, 64], [82, 74], [50, 88], [72, 90], [58, 76]];
  return pos.map(([x, y], i) => o.bumpy
    ? `<g>${[[-7, -7], [7, -7], [0, 0], [-7, 7], [7, 7], [0, -13], [0, 13], [-12, 0], [12, 0]].map(([dx, dy]) => `<circle cx="${x + dx}" cy="${y + dy}" r="7" fill="${c}"/>`).join('')}${[[-7, -7], [7, 7], [0, -13]].map(([dx, dy]) => `<circle cx="${x + dx - 2}" cy="${y + dy - 2}" r="2" fill="${hi}"/>`).join('')}</g>`
    : `<circle cx="${x}" cy="${y}" r="${o.r || 12}" fill="${c}"/><circle cx="${x - 4}" cy="${y - 4}" r="2.8" fill="${hi}"/>${o.crown ? `<path d="M${x - 3} ${y - 9}l3 3 3-3" stroke="${o.crown}" stroke-width="1.8" fill="none"/>` : ''}`).join('') + (o.leaf ? _leaf(64, 40, -30, 1.3) + _leaf(56, 44, 200, 1.1, C.leafL) : '');
}
function bunch(leafC, o = {}) {
  const n = o.n || 7, shape = o.shape || 'oval', tie = o.tie || '#C9A26B';
  let out = '';
  for (let i = 0; i < n; i++) {
    const a = -70 + (140 / (n - 1)) * i, rad = (a - 90) * Math.PI / 180, len = (o.len || 62) * (0.85 + 0.15 * Math.cos(i * 1.7));
    const x = 60 + Math.cos(rad) * len, y = 100 + Math.sin(rad) * len;
    out += `<path d="M60 100L${x.toFixed(1)} ${y.toFixed(1)}" stroke="${o.stemC || '#7A9A3A'}" stroke-width="2.2"/>`;
    if (shape === 'oval') out += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${o.rx || 9}" ry="${o.ry || 15}" fill="${i % 2 ? leafC : (o.leafC2 || leafC)}" transform="rotate(${a} ${x.toFixed(1)} ${y.toFixed(1)})"/>`;
    if (shape === 'herb') out += [[0, 0], [-6, 4], [6, 4], [-3, -6], [4, -5]].map(([dx, dy]) => `<circle cx="${(x + dx).toFixed(1)}" cy="${(y + dy).toFixed(1)}" r="${o.r || 5.5}" fill="${(i + dx) % 2 ? leafC : (o.leafC2 || leafC)}"/>`).join('');
    if (shape === 'jag') out += `<path transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${a})" d="M0 16c-6-2-4-6-8-8 4-2 0-6 4-8-4-3 1-7 4-10 3 3 8 7 4 10 4 2 0 6 4 8-4 2-2 6-8 8z" fill="${i % 2 ? leafC : (o.leafC2 || leafC)}"/>`;
    if (o.flowers) out += [[0, -14], [-4, -10], [4, -11]].map(([dx, dy]) => `<circle cx="${(x + dx).toFixed(1)}" cy="${(y + dy).toFixed(1)}" r="3" fill="${o.flowers}"/>`).join('');
  }
  return out + `<rect x="51" y="90" width="18" height="9" rx="3" fill="${tie}"/><path d="M57 100l-3 12M63 100l3 12M60 100v12" stroke="${o.stemC || '#7A9A3A'}" stroke-width="3" stroke-linecap="round"/>`;
}
function pepper(c, hi) {
  return `<path d="M36 50c-6 16-4 36 4 48 6 8 12 6 16 2 3 4 6 4 8 0 4 4 10 6 16-2 8-12 10-32 4-48-6-12-42-12-48 0z" fill="${c}"/>
  <path d="M42 54c-4 14-2 30 4 40-8-8-10-26-4-40z" fill="${hi}"/>
  <path d="M46 46c6-6 22-6 28 0-4 4-24 4-28 0z" fill="#4F7A23"/>${_stem('M60 44c0-8 2-12 6-16', '#4F7A23', 4)}`;
}
function longVeg(c, hi, o = {}) {
  const r = _rnd(o.seed || 3);
  const dots = o.bumps ? Array.from({ length: 14 }, () => `<circle cx="${(30 + r() * 60).toFixed(1)}" cy="${(52 + r() * 30).toFixed(1)}" r="1.4" fill="${o.bumps}"/>`).join('') : '';
  return `<g transform="rotate(-28 60 66)"><rect x="18" y="52" width="88" height="30" rx="15" fill="${c}"/>
  <rect x="24" y="56" width="70" height="7" rx="3.5" fill="${hi}" opacity=".7"/>${dots}
  <rect x="100" y="60" width="10" height="14" rx="3" fill="${o.cap || '#5B7A2A'}"/>${o.flower ? `<circle cx="18" cy="67" r="6" fill="${o.flower}"/>` : ''}</g>`;
}
function pod(c, inner, o = {}) {
  const seeds = o.seeds || [[40, 70], [52, 64], [64, 60], [76, 58]];
  return `<path d="M20 86c16-30 52-50 88-48-4 30-46 58-88 48z" fill="${c}"/>
  <path d="M28 82c18-22 46-34 72-36" stroke="${o.line || 'rgba(0,0,0,.15)'}" stroke-width="2" fill="none"/>
  ${seeds.map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="${o.rx || 7}" ry="${o.ry || 7}" fill="${inner}"/>`).join('')}
  ${_stem('M106 38c4-4 6-8 6-12', '#5B7A2A', 3)}`;
}
function cabbageHead(c, c2, vein, o = {}) {
  return `<circle cx="60" cy="68" r="38" fill="${c}"/>
  <path d="M24 66c4-16 18-28 36-28s32 12 36 28c-10-8-22-12-36-12S34 58 24 66z" fill="${c2}"/>
  <circle cx="60" cy="${o.cy || 74}" r="${o.r || 24}" fill="${o.core || c2}"/>
  <path d="M60 50v48M60 66l-14-10M60 66l14-10M60 80l-12-8M60 80l12-8" stroke="${vein}" stroke-width="2" fill="none" stroke-linecap="round"/>
  ${o.wrinkle ? Array.from({ length: 10 }, (_, i) => `<path d="M${30 + (i % 5) * 14} ${58 + Math.floor(i / 5) * 22}q5-5 10 0" stroke="${vein}" stroke-width="1.6" fill="none"/>`).join('') : ''}`;
}
function melonSlice(rind, flesh, seeds) {
  return `<path d="M24 64a36 36 0 0 0 72 0z" fill="${rind}"/><path d="M29 64a31 31 0 0 0 62 0z" fill="${flesh}"/>
  ${seeds ? [[44, 72], [56, 80], [68, 78], [76, 70], [50, 70]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="1.6" ry="2.6" fill="${seeds}"/>`).join('') : ''}`;
}

/* --- the drawings --- */
const ART = {
  /* fruta */
  pera: pear(C.pera, C.peraL),
  macaGala: apple('#C9452F', '#E2704E', `<path d="M70 48c5 12 5 28 0 42M78 52c3 10 3 22 0 32M48 50c-3 12-2 26 2 38" stroke="#E8A23A" stroke-width="3" opacity=".45" fill="none"/>`),
  macaReineta: apple('#B4AD4E', '#CFC97A', `<circle cx="72" cy="64" r="2" fill="#8A7A36"/><circle cx="80" cy="78" r="1.8" fill="#8A7A36"/><circle cx="64" cy="84" r="2" fill="#8A7A36"/><circle cx="54" cy="66" r="1.6" fill="#8A7A36"/><circle cx="74" cy="90" r="1.6" fill="#8A7A36"/>`),
  macaGolden: apple('#E6C447', '#F4DD86', `<circle cx="72" cy="66" r="1.4" fill="#C9A332"/><circle cx="80" cy="80" r="1.4" fill="#C9A332"/><circle cx="62" cy="86" r="1.4" fill="#C9A332"/>`),
  macaFuji: apple('#D9785A', '#EE9D7A', `<path d="M66 46c6 14 6 30 0 46M76 50c4 12 4 26 0 38M52 48c-3 14-2 28 3 42" stroke="#B8432F" stroke-width="3.4" opacity=".55" fill="none"/>`),
  macaBravo: apple('#E3D68A', '#F1E8B4', `<ellipse cx="74" cy="70" rx="14" ry="20" fill="#D25A3E" opacity=".6"/>`),
  marmelo: `<path d="M60 26c-10 0-12 8-12 16-10 4-20 14-20 32 0 20 14 32 32 32s32-12 32-32c0-18-10-28-20-32 0-8-2-16-12-16z" fill="#E6C84A"/>
    <path d="M40 60c-4 14 0 30 12 38-12-4-18-18-16-30 1-4 2-6 4-8z" fill="#F2DC7E"/>${_stem('M60 27c0-6 1-10 4-12', '#5A4320')}${_leaf(63, 18, -10, 1.15)}
    <circle cx="72" cy="70" r="1.4" fill="#C9A332"/><circle cx="64" cy="86" r="1.4" fill="#C9A332"/><circle cx="80" cy="84" r="1.4" fill="#C9A332"/>`,
  kiwi: `<ellipse cx="44" cy="66" rx="26" ry="32" fill="#8A6A3A"/>
    <ellipse cx="44" cy="66" rx="26" ry="32" fill="none" stroke="#6E5230" stroke-width="2" stroke-dasharray="2 5"/>
    <circle cx="76" cy="70" r="30" fill="#8A6A3A"/><circle cx="76" cy="70" r="26" fill="#93B33A"/><circle cx="76" cy="70" r="10" fill="#E3EDB0"/>
    <g fill="#2C2A1A">${Array.from({ length: 12 }, (_, i) => { const a = i / 12 * Math.PI * 2, x = (76 + 15 * Math.cos(a)).toFixed(1), y = (70 + 15 * Math.sin(a)).toFixed(1); return `<ellipse cx="${x}" cy="${y}" rx="1.4" ry="2.4" transform="rotate(${i * 30 + 90} ${x} ${y})"/>`; }).join('')}</g>`,
  diospiro: `<path d="M60 36c26 0 40 14 40 34 0 22-18 34-40 34S20 92 20 70c0-20 14-34 40-34z" fill="#E2742A"/>
    <path d="M30 60c-4 12 0 26 12 34-6-10-8-22-4-34z" fill="#F09A4C"/>
    <path d="M60 38c-10-8-22-6-26 0 8 2 16 4 26 0zM60 38c10-8 22-6 26 0-8 2-16 4-26 0zM60 38c-6 6-8 12-6 16 4-2 6-8 6-16zM60 38c6 6 8 12 6 16-4-2-6-8-6-16z" fill="#5B6E22"/>
    ${_stem('M60 36c0-6 1-10 4-12', '#4A3A1A')}`,
  laranja: citrus('#EE8A2B', '#F7B36A', '#C96A18'),
  tangerina: citrus('#F07322', '#F8A060', '#C85A12', { rx: 36, ry: 27, cy: 72 }),
  clementina: `<g transform="translate(-14 8) scale(.8)">${citrus('#F28A2E', '#F8B46E', '#CC6A1A', { rx: 30, ry: 26, noLeaf: true })}</g><g transform="translate(26 -4) scale(.8)">${citrus('#F28A2E', '#F8B46E', '#CC6A1A', { rx: 30, ry: 26 })}</g>`,
  limao: citrus('#F2D43E', '#F8E78A', '#C9AA22', { rx: 36, ry: 26, rot: -20, tips: true }),
  abacate: `<path d="M38 34c-14 0-20 18-18 36 2 22 10 36 22 36s18-12 18-30c0-16-6-22-8-30-2-8-6-12-14-12z" fill="#3E5A1E"/>
    <path d="M82 30c-14 0-18 16-18 30-2 12-8 18-8 30 0 16 10 24 26 24s26-8 26-24c0-12-6-18-8-30 0-14-4-30-18-30z" fill="#4F6E22"/>
    <path d="M82 36c-10 0-13 12-13 24-2 10-7 16-7 28 0 13 8 19 20 19s20-6 20-19c0-12-5-18-7-28 0-12-3-24-13-24z" fill="#D8E08A"/>
    <circle cx="82" cy="86" r="11" fill="#8A5A2B"/><circle cx="79" cy="83" r="3" fill="#A9784A"/>`,
  roma: `<circle cx="60" cy="70" r="34" fill="#B8323A"/><path d="M50 38l-4-10 8 4 6-8 6 8 8-4-4 10z" fill="#9A2830"/>
    <path d="M34 62c-4 14 2 28 12 34-10-2-18-16-14-30z" fill="#D85A5E"/><circle cx="74" cy="64" r="3" fill="#D85A5E"/>`,
  nespera: `${_leaf(30, 46, -40, 2.2)}${_leaf(70, 38, -10, 2)}${[[46, 74], [70, 72], [58, 92]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="15" ry="13" fill="#F2A341"/><ellipse cx="${x - 5}" cy="${y - 4}" rx="4" ry="3" fill="#F8C67A"/><circle cx="${x}" cy="${y + 11}" r="2" fill="#6B4A2A"/>`).join('')}`,
  banana: `${[[0, 0], [8, 10], [16, 20]].map(([dx, dy]) => `<path transform="translate(${dx} ${dy})" d="M30 34c4 30 26 52 62 48 5 0 5-6 0-7-28-2-46-20-52-44-2-6-11-3-10 3z" fill="#F2CE4A" stroke="#D9A82E" stroke-width="1.5"/>`).join('')}
    <path d="M30 28h12v10H30z" fill="#7A6A2A"/><path d="M92 76l6 6" stroke="#4A3A1A" stroke-width="3" stroke-linecap="round"/>`,
  maracuja: `<circle cx="44" cy="64" r="28" fill="#5E2E58"/><circle cx="36" cy="54" r="5" fill="#7E4A78"/>
    <circle cx="80" cy="76" r="26" fill="#5E2E58"/><circle cx="80" cy="76" r="22" fill="#F2F0D8"/><circle cx="80" cy="76" r="18" fill="#E8B23A"/>
    ${[[74, 70], [86, 72], [80, 82], [72, 82], [88, 82], [80, 66]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.2" fill="#2C2A1A"/>`).join('')}`,
  anona: `<path d="M60 30c22 0 38 18 38 40 0 22-18 36-38 36S22 92 22 70c0-22 16-40 38-40z" fill="#8DB04A"/>
    ${Array.from({ length: 14 }, (_, i) => `<path d="M${34 + (i % 5) * 13 + (Math.floor(i / 5) % 2) * 6} ${52 + Math.floor(i / 5) * 16}q6 6 12 0" stroke="#5E7E2A" stroke-width="2" fill="none"/>`).join('')}
    ${_stem('M60 31c0-6 1-10 4-12', '#4A3A1A')}`,
  cereja: `${_stem('M44 76C48 50 60 34 74 24', '#5A6E22', 2.6)}${_stem('M78 82C76 56 76 40 74 24', '#5A6E22', 2.6)}${_leaf(74, 24, -20, 1.5)}
    <circle cx="44" cy="82" r="17" fill="#A8202E"/><circle cx="38" cy="76" r="4" fill="#D25060"/>
    <circle cx="78" cy="88" r="17" fill="#B8232F"/><circle cx="72" cy="82" r="4" fill="#D85A66"/>`,
  pessego: stone('#F4B860', '#E5704A', '#F9D9A0'),
  nectarina: stone('#E9A84A', '#C8432F', '#F4C67A', { rx: 30, ry: 31 }),
  ameixa: stone('#6B3A6E', '#874E8A', '#A27AA4', { rx: 28, ry: 34 }),
  alperce: `<g transform="translate(-12 6) scale(.82)">${stone('#F2A341', '#E07A3A', '#F8CB80', { noLeaf: true })}</g><g transform="translate(30 -2) scale(.82)">${stone('#F2A341', '#E07A3A', '#F8CB80')}</g>`,
  figo: `<path d="M44 30c-4 10-6 16-12 24-8 12-10 22-6 34 4 12 14 18 24 16 12-2 18-12 16-26-2-12-10-20-14-30-2-6-4-12-8-18z" fill="#6B3E5E"/>
    <path d="M30 70c0 14 8 26 20 30-14-4-22-16-20-30z" fill="#8A5A7A"/>${_stem('M44 31c0-4 1-6 3-8', '#4A5A1A')}
    <ellipse cx="86" cy="80" rx="22" ry="26" fill="#6B3E5E"/><ellipse cx="86" cy="80" rx="18" ry="22" fill="#F0D8C0"/><ellipse cx="86" cy="80" rx="13" ry="17" fill="#D9707A"/>
    ${[[82, 74], [90, 78], [84, 86], [88, 70], [80, 82]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.4" fill="#F4E4A0"/>`).join('')}`,
  melao: `<ellipse cx="60" cy="64" rx="44" ry="34" fill="#D9D37A"/><path d="M24 58c12-10 60-10 72 0M22 70c14 8 62 8 76 0M60 30v68" stroke="#B9B25A" stroke-width="2" fill="none"/>
    <ellipse cx="44" cy="52" rx="12" ry="6" fill="#ECE8A8"/><g transform="translate(14 36) scale(.75)">${melonSlice('#B9B25A', '#E8EFB0')}</g>`,
  meloa: `<circle cx="50" cy="62" r="36" fill="#D8B878"/>${Array.from({ length: 6 }, (_, i) => `<path d="M${22 + i * 10} 36q6 24 0 52" stroke="#B89A5A" stroke-width="1.6" fill="none"/>`).join('')}
    <g transform="translate(34 38) scale(.8)">${melonSlice('#B89A5A', '#F2A35A')}</g>`,
  melancia: `<ellipse cx="54" cy="56" rx="44" ry="32" fill="#3E6E2A"/>${[-24, -8, 8, 24].map(o => `<path d="M${54 + o} 26c-6 20-6 40 0 60" stroke="#2D5420" stroke-width="5" fill="none"/>`).join('')}
    <g transform="translate(28 40) scale(.85)">${melonSlice('#3E6E2A', '#E0484A', '#2C2A1A')}</g>`,
  uvaBranca: grapes('#C9D36A', '#E6EBA8'),
  uvaTinta: grapes('#5B2D5E', '#8A5A8E'),
  morango: `${[[40, 58, -12], [76, 66, 14]].map(([x, y, r]) => `<g transform="translate(${x - 60} ${y - 66}) rotate(${r} 60 66)">
    <path d="M60 104c-14-6-30-26-30-44 0-10 8-16 30-16s30 6 30 16c0 18-16 38-30 44z" fill="#D3332F"/>
    ${[[48, 60], [60, 58], [72, 60], [52, 72], [66, 72], [58, 86], [44, 68], [76, 68]].map(([a, b]) => `<ellipse cx="${a}" cy="${b}" rx="1.3" ry="2" fill="#F4D06A"/>`).join('')}
    <path d="M60 46l-14-4 8 8-12 2 12 4 6-4 6 4 12-4-12-2 8-8-14 4z" fill="#4F7A23"/></g>`).join('')}`,
  mirtilo: berries('#3E4E8C', '#7A8AC0', { r: 13, crown: '#24305A', leaf: true }),
  framboesa: berries('#D8435A', '#F08A9A', { bumpy: true, pos: [[40, 66], [78, 62], [58, 92]], leaf: true }),
  amora: berries('#3A1E3A', '#6A4A6A', { bumpy: true, pos: [[40, 66], [78, 62], [58, 92]], leaf: true }),
  castanha: `<path d="M44 40c14 8 26 20 26 34 0 14-12 22-26 22S18 88 18 74c0-14 12-26 26-34z" fill="#7A4A2A"/><ellipse cx="44" cy="90" rx="22" ry="7" fill="#C9A57A"/>
    <path d="M80 44c14 8 24 20 24 34 0 12-10 20-24 20S56 90 56 78c0-14 10-26 24-34z" fill="#8A5530"/><ellipse cx="80" cy="92" rx="20" ry="6" fill="#C9A57A"/>
    <path d="M34 56c-4 8-4 16 0 22" stroke="#A8724A" stroke-width="3" fill="none" stroke-linecap="round"/>`,
  noz: `${[[42, 64], [78, 74]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="26" fill="#C49A62"/><path d="M${x} ${y - 26}v52" stroke="#9A7440" stroke-width="2.4"/>
    <path d="M${x - 16} ${y - 12}q6 6 0 12q6 6 0 12M${x + 16} ${y - 12}q-6 6 0 12q-6 6 0 12" stroke="#9A7440" stroke-width="1.8" fill="none"/>`).join('')}`,
  /* legumes */
  batata: `<path d="M22 66c0-17 15-29 36-29 23 0 40 9 40 26 0 19-18 30-39 30S22 84 22 66z" fill="#C9A26B"/>
    <path d="M30 70c2 10 12 16 26 17-12-4-20-10-22-20-2 0-3 1-4 3z" fill="#DDBD8A"/>
    ${[[48, 56], [72, 62], [62, 80], [84, 72], [40, 74]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2" fill="#957143"/>`).join('')}`,
  batataVermelha: `<path d="M22 66c0-17 15-29 36-29 23 0 40 9 40 26 0 19-18 30-39 30S22 84 22 66z" fill="#B5554A"/>
    <path d="M30 70c2 10 12 16 26 17-12-4-20-10-22-20-2 0-3 1-4 3z" fill="#CC7A6A"/>
    ${[[48, 56], [72, 62], [62, 80], [84, 72]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2" fill="#8A3A33"/>`).join('')}`,
  batataDoce: `<path d="M14 78c8-22 34-36 62-36 18 0 30 6 32 14 2 10-10 20-30 28-24 10-50 12-64-6z" fill="#9B4F45"/>
    <path d="M24 78c10-12 30-22 50-24-18 6-34 14-44 26z" fill="#B96A5C"/>
    <path d="M44 66l6 4M66 58l5 5M84 60l3 5M56 80l3 4" stroke="#7A3A33" stroke-width="2" stroke-linecap="round"/>`,
  cebola: `<path d="M60 22c3 12 32 26 32 54 0 18-14 28-32 28S28 94 28 76c0-28 29-42 32-54z" fill="#D9A04A"/>
    <path d="M60 28c-9 15-18 30-18 48 0 15 7 25 18 28M60 28c9 15 18 30 18 48 0 15-7 25-18 28M60 30v74" stroke="#B37A2E" stroke-width="2.2" fill="none"/>
    ${_stem('M60 22c-1-5 1-10 4-12', '#8C6A2C', 2.6)}<path d="M54 104l-3 7M60 104v8M66 104l3 7" stroke="#8C6A2C" stroke-width="1.8" stroke-linecap="round"/>`,
  cebolaRoxa: `<path d="M60 22c3 12 32 26 32 54 0 18-14 28-32 28S28 94 28 76c0-28 29-42 32-54z" fill="#7A3B5E"/>
    <path d="M60 28c-9 15-18 30-18 48 0 15 7 25 18 28M60 28c9 15 18 30 18 48 0 15-7 25-18 28M60 30v74" stroke="#9E5A80" stroke-width="2.2" fill="none"/>
    ${_stem('M60 22c-1-5 1-10 4-12', '#5A3A2C', 2.6)}<path d="M54 104l-3 7M60 104v8M66 104l3 7" stroke="#8C6A5C" stroke-width="1.8" stroke-linecap="round"/>`,
  alho: `<path d="M60 26c2 10 34 26 34 50 0 18-16 28-34 28S26 94 26 76c0-24 32-40 34-50z" fill="#F1EAD6"/>
    <path d="M60 34c-8 14-16 28-16 44 0 14 6 22 16 26M60 34c8 14 16 28 16 44 0 14-6 22-16 26M44 50c-8 10-10 22-8 34M76 50c8 10 10 22 8 34" stroke="#D2C6A2" stroke-width="2" fill="none"/>
    ${_stem('M60 26c0-8 2-14 6-18', '#B8AC80', 4)}<path d="M52 104l-3 7M58 104v8M64 104v8M70 104l3 7" stroke="#B6A773" stroke-width="1.6" stroke-linecap="round"/>`,
  alhoFrances: `<path d="M40 106c-5-1-7-5-5-10l13-34 16 6-13 34c-2 4-6 5-11 4z" fill="#F4EBC8"/><path d="M48 62l16 6 5-14-16-6z" fill="#BFD37A"/>
    <path d="M53 49C50 30 44 18 36 10c11 5 19 18 22 37z" fill="#4E7A1A"/><path d="M58 50c4-18 12-31 22-38-4 12-10 26-15 40z" fill="#5E8A22"/>
    <path d="M62 54c12-12 26-18 40-18-12 6-24 14-33 23z" fill="#3F6614"/><path d="M36 104l-6 5M40 107l-2 7M45 107l2 6" stroke="#B6A773" stroke-width="1.6" stroke-linecap="round"/>`,
  cenoura: `<path d="M80 38c7 5 9 13 4 20L42 102c-4 4-9 0-6-4l31-53c4-7 8-10 13-7z" fill="${C.orange}"/>
    <path d="M58 62l8 4M50 76l7 3M44 88l5 3M68 50l7 4" stroke="#B85A18" stroke-width="2" stroke-linecap="round"/>
    <path d="M80 40c0-14 6-22 14-26-1 10-6 20-14 26z" fill="${C.leaf}"/><path d="M82 42c8-8 18-10 26-6-8 6-17 8-26 6z" fill="${C.leafL}"/><path d="M78 40c-4-10-2-20 4-26 2 9 1 18-4 26z" fill="#557320"/>`,
  beterraba: `${_stem('M56 44C50 30 42 22 34 18', '#B5345A', 3)}${_stem('M64 44c4-14 12-24 22-28', '#B5345A', 3)}
    <ellipse cx="32" cy="16" rx="10" ry="14" fill="#4F7A23" transform="rotate(-40 32 16)"/><ellipse cx="88" cy="16" rx="10" ry="14" fill="#5E8A2B" transform="rotate(40 88 16)"/>
    <circle cx="60" cy="72" r="30" fill="#8E2240"/><path d="M38 64c-2 12 4 22 12 26-8-2-14-16-12-26z" fill="#B04060"/>${_stem('M60 102c0 6-2 10-6 12', '#6E1A32', 2)}`,
  nabo: `${_stem('M56 44C50 30 42 22 34 18', '#7A9A3A', 3)}${_stem('M64 44c4-14 12-24 22-28', '#7A9A3A', 3)}
    <ellipse cx="32" cy="16" rx="10" ry="15" fill="#5E8A2B" transform="rotate(-40 32 16)"/><ellipse cx="88" cy="16" rx="10" ry="15" fill="#6E9A3A" transform="rotate(40 88 16)"/>
    <path d="M60 42c18 0 30 12 30 28 0 18-14 30-30 34-16-4-30-16-30-34 0-16 12-28 30-28z" fill="#F4EFE0"/>
    <path d="M30 66c0-14 12-24 30-24s30 10 30 24c-10-6-20-8-30-8s-20 2-30 8z" fill="#8E5A9E"/>${_stem('M60 104v10', '#C9BC98', 2)}`,
  rabanete: `${[[40, 74], [62, 82], [82, 70]].map(([x, y]) => `${_stem(`M${x} ${y - 14}l${(x - 60) / 4} -26`, '#7A9A3A', 2.4)}
    <ellipse cx="${x + (x - 60) / 4}" cy="${y - 46}" rx="7" ry="12" fill="#5E8A2B"/><circle cx="${x}" cy="${y}" r="15" fill="#D2384A"/>
    <path d="M${x - 9} ${y + 8}c4 6 14 6 18 0-2 6-6 10-9 10s-7-4-9-10z" fill="#F4EBE0"/><circle cx="${x - 5}" cy="${y - 5}" r="3" fill="#E8707A"/>`).join('')}`,
  nabicas: bunch('#5E8A2B', { leafC2: '#7FA640', rx: 10, ry: 17 }),
  grelos: bunch('#4F7A23', { leafC2: '#6E9A3A', rx: 8, ry: 14, flowers: '#E8D04A' }),
  espinafres: bunch('#2F5A1A', { leafC2: '#3F6E22', rx: 12, ry: 15, n: 6 }),
  agriao: bunch('#4F8A2A', { shape: 'herb', leafC2: '#6EA63A', r: 6 }),
  rucula: bunch('#4F7A23', { shape: 'jag', leafC2: '#6E9A3A' }),
  salsa: bunch('#3F7A1E', { shape: 'herb', leafC2: '#5E9A2B', r: 5 }),
  coentros: bunch('#5E9A2B', { shape: 'jag', leafC2: '#7AB040', len: 58 }),
  hortela: bunch('#4F8A3A', { leafC2: '#6EA650', rx: 8, ry: 12, n: 8 }),
  alface: `<path d="M18 72c0-24 18-42 42-42s42 18 42 42c0 18-14 32-42 32S18 90 18 72z" fill="#6F9A2E"/>
    <path d="M26 70c2-18 16-30 34-30s32 12 34 30c-6-4-12-6-18-4-4-6-10-8-16-8s-12 2-16 8c-6-2-12 0-18 4z" fill="#9DBE4F"/>
    <path d="M34 84c0-14 12-24 26-24s26 10 26 24c0 10-10 16-26 16s-26-6-26-16z" fill="#C3D872"/>
    <path d="M60 60v40M60 74l-12-8M60 74l12-8M60 86l-10-7M60 86l10-7" stroke="#EAF1C4" stroke-width="2" fill="none" stroke-linecap="round"/>`,
  alfaceRomana: `${[[-22, -16, '#6F9A2E'], [22, 16, '#6F9A2E'], [-10, -6, '#8DB04A'], [10, 6, '#8DB04A'], [0, 0, '#A9C25A']].map(([dx, r, c]) => `<ellipse cx="${60 + dx}" cy="58" rx="14" ry="44" fill="${c}" transform="rotate(${r} ${60 + dx} 100)"/>`).join('')}
    <path d="M60 22v82" stroke="#E6EFC0" stroke-width="3"/><path d="M60 50l-8-6M60 66l8-6M60 82l-8-6" stroke="#E6EFC0" stroke-width="2"/>`,
  alfaceIceberg: `<circle cx="60" cy="66" r="38" fill="#9DC05A"/><circle cx="60" cy="68" r="32" fill="#B7D47A"/>
    <path d="M30 60c10-16 50-16 60 0M28 74c12-12 52-12 64 0M34 88c10-8 42-8 52 0" stroke="#D8E8A8" stroke-width="2.4" fill="none"/>`,
  couve: cabbageHead('#4F7F2A', '#6E9A3A', '#CFE08C', { core: '#8DB04A' }),
  couveGalega: bunch('#2F5A1A', { leafC2: '#3E6E22', rx: 11, ry: 22, n: 5, len: 54, stemC: '#A9C27A' }),
  couveCoracao: `<path d="M60 20c24 14 38 36 38 56 0 18-16 30-38 30S22 94 22 76c0-20 14-42 38-56z" fill="#A9C870"/>
    <path d="M60 22c-6 20-6 50 0 84-22 0-38-12-38-30 0-20 14-40 38-54z" fill="#8DB04A"/>
    <path d="M22 80c4 16 18 26 38 26s34-10 38-26c-10 10-22 14-38 14S32 90 22 80z" fill="#5E8A2B"/>
    <path d="M60 26c10 22 14 46 10 72M48 40c-8 18-10 38-6 56" stroke="#E6EFC0" stroke-width="2" fill="none"/>`,
  couveLombarda: cabbageHead('#5E8A2E', '#7AA640', '#A9C870', { wrinkle: true, core: '#8DB04A' }),
  couveRoxa: cabbageHead('#5A2E5E', '#7A4A7E', '#B88AC0', { core: '#6B3A6E' }),
  couveFlor: `<path d="M18 70c4-24 20-36 42-36s38 12 42 36c-12 20-72 20-84 0z" fill="#5E8A2B"/>
    ${[[42, 62], [60, 56], [78, 62], [50, 74], [70, 74], [60, 66], [34, 74], [86, 74]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="12" fill="#F3EED8"/>`).join('')}
    ${[[42, 62], [60, 56], [78, 62], [60, 66]].map(([x, y]) => `<circle cx="${x - 3}" cy="${y - 3}" r="3" fill="#FFFDF2"/>`).join('')}
    <path d="M20 72c10 18 70 18 80 0-8 22-72 22-80 0z" fill="#4F7A23"/>`,
  brocolos: `<path d="M54 72l-4 34h20l-4-34z" fill="#9DBF5A"/><path d="M50 90l-10-6M70 90l10-6" stroke="#9DBF5A" stroke-width="5" stroke-linecap="round"/>
    <circle cx="42" cy="56" r="17" fill="#4F7A23"/><circle cx="78" cy="56" r="17" fill="#4F7A23"/><circle cx="60" cy="42" r="20" fill="#5D8A2B"/><circle cx="60" cy="64" r="16" fill="#46701E"/>
    ${[[52, 38], [66, 34], [38, 52], [80, 50], [62, 48]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" fill="#7EA640"/>`).join('')}`,
  tomate: `<path d="M60 34c22 0 38 14 38 34s-16 36-38 36-38-16-38-36 16-34 38-34z" fill="#C9452F"/>
    <path d="M40 44c-6 10-6 34 2 50M80 44c6 10 6 34-2 50M60 38v64" stroke="#A8352A" stroke-width="2" fill="none" opacity=".6"/>
    <path d="M32 62c2-12 10-20 20-22-8 6-12 14-12 24 0 8 3 15 8 20-10-4-17-12-16-22z" fill="#E26C52"/>
    <path d="M60 36l6-8 2 10 10-2-7 8 8 5-10 1-9 4-9-4-10-1 8-5-7-8 10 2 2-10z" fill="${C.leaf}"/>${_stem('M60 34c0-6 2-9 5-11')}`,
  tomateCherry: `${_stem('M20 30C40 26 70 26 100 34', '#5B7A2A', 3)}${[[30, 30, 54], [52, 28, 70], [74, 30, 58], [94, 33, 74]].map(([x, y, cy]) => `${_stem(`M${x} ${y}L${x} ${cy - 12}`, '#5B7A2A', 2)}<circle cx="${x}" cy="${cy}" r="13" fill="#D2392F"/><circle cx="${x - 4}" cy="${cy - 4}" r="3" fill="#EE7A62"/><path d="M${x - 6} ${cy - 12}l6 3 6-3" stroke="#4F7A23" stroke-width="2.4" fill="none"/>`).join('')}<circle cx="44" cy="92" r="13" fill="#D2392F"/><circle cx="40" cy="88" r="3" fill="#EE7A62"/><circle cx="76" cy="94" r="13" fill="#C9302A"/><circle cx="72" cy="90" r="3" fill="#EE7A62"/>`,
  tomateChucha: `${[[44, 68, -20], [76, 70, 18]].map(([x, y, r]) => `<g transform="rotate(${r} ${x} ${y})"><ellipse cx="${x}" cy="${y}" rx="18" ry="30" fill="#C9302A"/><ellipse cx="${x - 7}" cy="${y - 12}" rx="5" ry="8" fill="#E8685A"/><path d="M${x - 8} ${y - 30}l8 4 8-4-4 6h-8z" fill="#4F7A23"/></g>`).join('')}`,
  abobora: `<ellipse cx="60" cy="72" rx="44" ry="32" fill="#D9822B"/><ellipse cx="60" cy="72" rx="26" ry="32" fill="#E8973E"/><ellipse cx="60" cy="72" rx="10" ry="32" fill="#F0A957"/>
    <path d="M34 72c0-17 6-29 14-32M86 72c0-17-6-29-14-32" stroke="#B9641C" stroke-width="2" fill="none"/>
    <path d="M57 42c0-8-2-14 2-20 4 1 6 3 6 6-2 4-2 9-1 14z" fill="#6A5A26"/>${_leaf(64, 32, -10, 1.1)}`,
  aboboraManteiga: `<g transform="rotate(-30 60 66)"><path d="M48 20c10-4 18 0 20 8 2 10 0 22 4 34 12 6 18 18 16 30-2 14-14 22-28 22s-28-8-28-24c0-12 8-22 16-28 2-14-2-24-2-34 0-4 0-6 2-8z" fill="#E8B26A"/>
    <path d="M44 66c-8 6-12 16-10 26-4-10 0-22 10-26z" fill="#F4CC8E"/><circle cx="60" cy="92" r="6" fill="#D9984A"/><rect x="52" y="12" width="8" height="12" rx="2" fill="#6A5A26"/></g>`,
  courgette: longVeg('#4E7A23', '#8DB04A', { bumps: '#A9C870', cap: '#5B7A2A', flower: '#F2C64A' }),
  pepino: longVeg('#2F5A18', '#5E8A2B', { bumps: '#D8E8A8', cap: '#3E6418', seed: 7 }),
  beringela: `<path d="M74 34c18 10 26 30 22 50-4 18-20 26-36 22-18-4-26-18-20-36 4-14 14-20 18-30 4-8 8-10 16-6z" fill="#4A2A4E"/>
    <path d="M46 78c-2 10 2 20 10 24-10-2-16-14-10-24z" fill="#6E4A72"/>
    <path d="M70 32c-4-6 2-10 8-8 8-4 14 2 12 8 4 6-2 12-8 10-6 6-14 2-12-4z" fill="#5B7A2A"/>${_stem('M80 26c2-6 6-10 10-12', '#5B7A2A', 4)}`,
  pimentoVerde: pepper('#4F8A2A', '#7AB040'),
  pimentoVermelho: pepper('#C8352F', '#E86A5A'),
  feijaoVerde: `${[[-8, 0], [0, 6], [8, 12], [16, 2], [-14, 10]].map(([dx, dy], i) => `<path transform="translate(${dx} ${dy})" d="M30 ${30 + i * 2}c10 24 30 50 62 62" stroke="${i % 2 ? '#6E9A2E' : '#5E8A22'}" stroke-width="7" fill="none" stroke-linecap="round"/>`).join('')}`,
  ervilhas: pod('#7FAE3A', '#A9D05A', { seeds: [[42, 70], [54, 64], [66, 58], [78, 54], [90, 50]], rx: 6.5, ry: 6.5 }),
  favas: pod('#9DBF5A', '#D8E8A8', { seeds: [[42, 70], [58, 62], [74, 55], [90, 49]], rx: 8, ry: 5.5 }),
  milho: `<g transform="rotate(-30 60 64)"><path d="M48 14c14-4 26 4 26 24v50c0 12-8 20-14 20s-14-8-14-20V38c0-12 0-20 2-24z" fill="#F2C64A"/>
    ${Array.from({ length: 30 }, (_, i) => `<rect x="${49 + (i % 3) * 7}" y="${22 + Math.floor(i / 3) * 8}" width="5.5" height="6.5" rx="2" fill="#E0A82E"/>`).join('')}
    <path d="M60 108c-14-2-22-18-20-40 2 14 8 26 20 40zM60 108c14-2 22-18 20-40-2 14-8 26-20 40z" fill="#7FA640"/>
    <path d="M60 108c-20 0-30-28-26-60 4 26 12 44 26 60z" fill="#5E8A2B"/></g>`,
  espargos: `${[34, 44, 54, 64, 74, 84].map((x, i) => `<path d="M${x} 108L${50 + i * 4} ${22 + (i % 2) * 6}" stroke="#6E9A3A" stroke-width="7" stroke-linecap="round"/><path d="M${50 + i * 4 - 4} ${28 + (i % 2) * 6}l4-8 4 8z" fill="#4F6E22"/>`).join('')}<rect x="38" y="80" width="44" height="9" rx="3" fill="#C9A26B"/>`,
  aipo: `${[[-14, -8], [-5, -3], [5, 3], [14, 8]].map(([dx, r]) => `<path d="M${60 + dx} 108L${60 + dx * 1.6} 42" stroke="#B7D47A" stroke-width="10" stroke-linecap="round" transform="rotate(${r} 60 108)"/>`).join('')}
    ${[[38, 34], [54, 26], [70, 28], [84, 36], [46, 22], [76, 20]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="8" ry="11" fill="#5E8A2B"/>`).join('')}`,
  funcho: `${[44, 56, 64, 76].map((x, i) => `<path d="M${x} 66L${30 + i * 20} 20" stroke="#A9C870" stroke-width="5" stroke-linecap="round"/>`).join('')}
    ${[30, 50, 70, 90].map(x => `<path d="M${x} 20c-6-6-4-12 0-14M${x} 20c6-6 4-12 0-14M${x} 20c-8-2-10-6-10-10M${x} 20c8-2 10-6 10-10" stroke="#5E8A2B" stroke-width="1.8" fill="none"/>`).join('')}
    <path d="M60 58c22 0 32 14 32 26 0 14-14 22-32 22s-32-8-32-22c0-12 10-26 32-26z" fill="#EEF0D8"/><path d="M44 66c-6 8-8 20-4 30M76 66c6 8 8 20 4 30" stroke="#D2D8B0" stroke-width="2.4" fill="none"/>`,
  /* v4 */
  lima: citrus('#7DAA2E', '#A9CC5A', '#5A7E1A', { rx: 31, ry: 25, rot: -15, tips: true }),
  toranja: `${citrus('#F2B45A', '#F8D08E', '#D68A2E', { rx: 36, ry: 35, cy: 64, noLeaf: true })}<g transform="translate(58 58)"><circle cx="20" cy="22" r="22" fill="#F2B45A"/><circle cx="20" cy="22" r="19" fill="#F6E3C4"/><circle cx="20" cy="22" r="16" fill="#EF7E6A"/>${Array.from({ length: 8 }, (_, i) => { const a = i / 8 * 6.283; return `<path d="M20 22L${(20 + 16 * Math.cos(a)).toFixed(1)} ${(22 + 16 * Math.sin(a)).toFixed(1)}" stroke="#F6E3C4" stroke-width="1.5"/>`; }).join('')}</g>`,
  ameixaRC: `<g transform="translate(-14 10) scale(.72)">${stone('#B9C24A', '#E0C85A', '#DDE48A', { noLeaf: true })}</g><g transform="translate(26 -2) scale(.72)">${stone('#C2C850', '#E6CC5E', '#E2E890')}</g><g transform="translate(8 34) scale(.6)">${stone('#B0BA44', '#DCC456', '#DDE48A', { noLeaf: true })}</g>`,
  uvaMoscatel: grapes('#D9B84A', '#F0DC8A'),
  physalis: `${[[-18, 10, -20], [16, -4, 15]].map(([dx, dy, r]) => `<g transform="translate(${dx} ${dy}) rotate(${r} 60 66)"><path d="M60 26c-14 8-26 22-26 38 0 10 6 18 12 22 4-14 10-24 14-28 4 4 10 14 14 28 6-4 12-12 12-22 0-16-12-30-26-38z" fill="#D8C9A0"/><path d="M60 26c-4 12-6 26-6 38M60 26c4 12 6 26 6 38" stroke="#BFAE80" stroke-width="1.5" fill="none"/><circle cx="60" cy="74" r="14" fill="#F0A030"/><circle cx="56" cy="70" r="3.5" fill="#F8C870"/></g>`).join('')}`,
  medronho: `${_leaf(30, 40, -30, 2)}${_leaf(68, 34, 10, 1.8)}${[[44, 70, '#D8432F'], [74, 66, '#E86A2A'], [58, 92, '#F0A030'], [86, 90, '#D8432F']].map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="14" fill="${c}"/>${Array.from({ length: 9 }, (_, i) => `<circle cx="${(x + 9 * Math.cos(i * .7)).toFixed(1)}" cy="${(y + 9 * Math.sin(i * .7)).toFixed(1)}" r="1.4" fill="rgba(0,0,0,.18)"/>`).join('')}<circle cx="${x - 4}" cy="${y - 5}" r="3" fill="rgba(255,255,255,.35)"/>`).join('')}`,
  pimentoAmarelo: pepper('#E8C02E', '#F4D96A'),
  malagueta: `${[[0, 0, 0, '#C8252A'], [14, 12, 8, '#D8352F'], [-12, 16, -10, '#B81E24']].map(([dx, dy, r, c]) => `<g transform="translate(${dx} ${dy}) rotate(${r} 60 60)"><path d="M46 30c8-4 16 0 16 8 0 26 10 48 34 64-30-4-50-30-50-60 0-6 0-10 0-12z" fill="${c}"/><path d="M50 40c0 20 6 36 18 50" stroke="rgba(255,255,255,.3)" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M44 32c2-8 8-12 14-10-2 4-6 8-14 10z" fill="#4F7A23"/>${_stem('M50 26c-2-6 0-12 4-14', '#4F7A23', 3)}</g>`).join('')}`,
  couveBruxelas: `<path d="M58 108L62 18" stroke="#9DBF5A" stroke-width="8" stroke-linecap="round"/>${[[44, 30], [76, 34], [42, 54], [78, 58], [44, 78], [76, 82], [60, 96]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="13" fill="${i % 2 ? '#6E9A3A' : '#7FAE44'}"/><path d="M${x - 8} ${y}q8-8 16 0M${x - 6} ${y + 5}q6-6 12 0" stroke="#B9D47A" stroke-width="1.6" fill="none"/>`).join('')}`,
  acelga: bunch('#2F6A1E', { leafC2: '#3E7A26', rx: 13, ry: 20, n: 5, len: 56, stemC: '#E8E0C8', tie: '#C9A26B' }),
  chuchu: `<path d="M60 26c10 0 14 8 14 14 12 6 22 20 22 36 0 18-16 30-36 30S24 94 24 76c0-16 10-30 22-36 0-6 4-14 14-14z" fill="#B8D47A"/>
    <path d="M60 32v72M44 44c-8 14-10 34-4 56M76 44c8 14 10 34 4 56" stroke="#93B04A" stroke-width="2.4" fill="none"/>
    <path d="M38 64c-4 12-2 24 6 32-10-6-12-22-6-32z" fill="#D2E6A0"/>${_stem('M60 27c0-6 1-10 4-12', '#5B7A2A')}`,
  manjericao: bunch('#3E8A2A', { leafC2: '#5EA640', rx: 10, ry: 13, n: 7 })
};
/* aliases used by older parts of the site */
ART.maca = ART.macaGala; ART.macaVerde = ART.macaReineta;
const PRODUCE = ART;

function produceSVG(name, cls = '') {
  return `<svg class="${cls}" viewBox="0 0 120 120" aria-hidden="true" focusable="false">${ART[name] || ''}</svg>`;
}
function g(name, x, y, s = 1, rot = 0) {
  return `<g transform="translate(${x} ${y}) rotate(${rot} ${60 * s} ${60 * s}) scale(${s})">${ART[name] || ''}</g>`;
}

/* Crate of produce: viewBox 0 0 240 200 */
function crateSVG(mix = 'mista', cls = '') {
  const sets = {
    mista: [['alhoFrances', 22, -6, 0.95, -8], ['alface', 112, 8, 0.85, 0], ['pera', 60, 18, 0.8, -6], ['macaGala', 128, 30, 0.72, 10], ['cenoura', 150, -4, 0.8, 0], ['cebola', 30, 34, 0.62, -10], ['tomate', 92, 40, 0.6, 0]],
    fruta: [['pera', 24, 12, 0.82, -10], ['macaReineta', 74, 22, 0.74, 0], ['laranja', 118, 18, 0.76, 8], ['diospiro', 158, 30, 0.62, 0], ['kiwi', 50, 44, 0.56, 0], ['pera', 136, 0, 0.66, 12], ['macaGala', 96, 44, 0.56, 0]],
    essencial: [['alface', 14, 6, 0.8, 0], ['banana', 120, -8, 0.8, 0], ['cenoura', 156, 0, 0.78, 6], ['pera', 58, 14, 0.78, -8], ['laranja', 96, 30, 0.68, 0], ['macaGala', 140, 34, 0.62, 0], ['cebola', 32, 40, 0.58, 0], ['batata', 92, 52, 0.56, 0]],
    legumes: [['alhoFrances', 18, -10, 0.95, -6], ['couve', 96, 10, 0.8, 0], ['cenoura', 150, -8, 0.82, 0], ['brocolos', 52, 16, 0.72, 0], ['batata', 120, 40, 0.62, 0], ['cebola', 38, 40, 0.6, 0], ['abobora', 150, 40, 0.55, 0]]
  };
  /* lista de produtos (caixas criadas na gestão): os desenhos de img/produtos dentro da caixa */
  const SPOTS = [[6, 30, 78, -8], [60, 14, 80, 4], [118, 12, 78, -4], [166, 26, 70, 8], [30, 50, 70, 6], [92, 48, 72, -6], [146, 50, 68, 4]];
  const items = Array.isArray(mix)
    ? mix.map(id => typeof P === 'function' ? P(id) : null).filter(Boolean).slice(0, 7).map((p, i) => { const [x, y, w, r] = SPOTS[i], src = p.photo || `${typeof R === 'string' ? R : './'}img/produtos/${p.icon || p.id}.svg`;
        return `<image href="${src.replace(/"/g, '&quot;')}" x="${x}" y="${y}" width="${w}" height="${w}" transform="rotate(${r} ${x + w / 2} ${y + w / 2})" preserveAspectRatio="xMidYMid ${p.photo ? 'slice' : 'meet'}"/>`; }).join('')
    : (sets[mix] || sets.mista).map(a => g(...a)).join('');
  return `<svg class="${cls}" viewBox="0 0 240 200" aria-hidden="true" focusable="false">
    <ellipse cx="120" cy="188" rx="104" ry="9" fill="rgba(34,56,10,.14)"/>${items}
    <path d="M18 96h204l-10 88H28z" fill="${C.wood}"/><path d="M18 96h204v14H18z" fill="${C.woodL}"/>
    <path d="M24 128h192M26 154h188" stroke="${C.woodD}" stroke-width="3"/>
    <path d="M60 110v74M120 110v74M180 110v74" stroke="${C.woodD}" stroke-width="2" opacity=".55"/>
    <rect x="96" y="132" width="48" height="16" rx="4" fill="${C.woodD}" opacity=".7"/>
  </svg>`;
}

/* Farm landscape postcard: viewBox 0 0 320 200 */
function farmSVG(seed = 0, crop = 'pera', cls = '') {
  const skies = ['#F6E6B4', '#EAF0D2', '#F8E1C2', '#E5EED8', '#F4EBC8', '#EEF2DF', '#F7E3B0'];
  const hills = [['#7C9A3A', '#5D7D24'], ['#8BA64A', '#6A8A2C'], ['#9DAE52', '#73902F'], ['#6F8F30', '#557320']];
  const sky = skies[seed % skies.length], [h1, h2] = hills[seed % hills.length];
  const sunX = 40 + (seed * 47) % 220, t1 = 30 + (seed * 71) % 160, t2 = 120 + (seed * 37) % 150;
  return `<svg class="${cls}" viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
    <rect width="320" height="200" fill="${sky}"/><circle cx="${sunX}" cy="${40 + (seed * 13) % 30}" r="22" fill="${C.pera}"/>
    <path d="M0 ${104 + (seed % 3) * 6}c50-30 110-34 170-14s110 10 150-10v114H0z" fill="${h1}"/>
    <path d="M0 140c60-20 130-18 200-4 50 10 90 6 120-6v70H0z" fill="${h2}"/>
    ${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `<path d="M${-20 + i * 48} 200 L${120 + i * 14} 142" stroke="${C.campo}" stroke-width="5" opacity=".35"/>`).join('')}
    <g transform="translate(${t1} 80)"><rect x="-3" y="20" width="6" height="22" fill="#6B4E2A"/><circle cx="0" cy="12" r="18" fill="${C.campo}"/></g>
    <g transform="translate(${t2} 94)"><rect x="-2" y="12" width="4" height="16" fill="#6B4E2A"/><circle cx="0" cy="6" r="12" fill="#4B6F12"/></g>
    ${seed % 2 ? `<g transform="translate(${(t1 + 70) % 300} 108)"><path d="M0 0h26v18H0z" fill="#F4EBC8"/><path d="M-3 1l16-12 16 12z" fill="#B8432F"/><rect x="10" y="8" width="6" height="10" fill="#8A5A2B"/></g>` : ''}
    <g transform="translate(222 118) scale(.62)">${ART[crop] || ''}</g>
  </svg>`;
}

/* ---------- Mapa de Portugal (continental + Madeira) ---------- */
const PT_OUTLINE = [[41.87,-8.87],[41.69,-8.85],[41.53,-8.79],[41.38,-8.76],[41.18,-8.69],[41.0,-8.65],[40.84,-8.68],[40.64,-8.75],[40.43,-8.81],[40.15,-8.87],[39.92,-8.95],[39.75,-9.03],[39.6,-9.08],[39.43,-9.23],[39.37,-9.4],[39.2,-9.36],[38.96,-9.42],[38.78,-9.5],[38.7,-9.42],[38.69,-9.22],[38.76,-9.08],[38.9,-8.97],[38.8,-8.92],[38.66,-9.03],[38.64,-9.24],[38.48,-9.19],[38.41,-9.22],[38.44,-9.08],[38.52,-8.89],[38.45,-8.86],[38.2,-8.8],[37.95,-8.87],[37.73,-8.82],[37.45,-8.8],[37.2,-8.9],[37.02,-8.99],[37.01,-8.92],[37.08,-8.67],[37.12,-8.53],[37.09,-8.25],[37.07,-8.1],[36.96,-7.89],[37.08,-7.7],[37.12,-7.62],[37.17,-7.41],[37.4,-7.44],[37.56,-7.52],[37.85,-7.2],[38.0,-7.05],[38.14,-6.94],[38.22,-7.1],[38.4,-7.3],[38.63,-7.26],[38.8,-7.08],[38.88,-7.03],[39.02,-6.98],[39.2,-7.08],[39.4,-7.3],[39.66,-7.53],[39.72,-7.02],[39.85,-6.96],[40.03,-6.86],[40.25,-6.8],[40.45,-6.82],[40.63,-6.8],[40.85,-6.82],[41.03,-6.93],[41.15,-6.68],[41.3,-6.45],[41.5,-6.25],[41.62,-6.2],[41.83,-6.55],[41.97,-6.62],[41.93,-6.85],[41.99,-7.05],[41.9,-7.2],[41.95,-7.45],[41.86,-7.68],[41.88,-7.9],[41.95,-8.05],[42.15,-8.2],[42.08,-8.42],[42.03,-8.64]];
const ptXY = (lat, lon) => [((lon + 10.65) * 77).toFixed(1), ((42.35 - lat) * 100).toFixed(1)];
/* Açores: cada ilha desenhada como uma elipse (centro, meio-comprimento e meia-largura em graus, rotação) */
const ACORES = [['Flores', 39.44, -31.20, .085, .06, -10], ['Corvo', 39.70, -31.10, .035, .03, 0], ['Faial', 38.58, -28.70, .1, .07, 0], ['Pico', 38.47, -28.33, .23, .07, -12],
  ['São Jorge', 38.65, -28.08, .28, .045, -20], ['Graciosa', 39.05, -28.02, .06, .04, 0], ['Terceira', 38.72, -27.22, .16, .1, 0], ['São Miguel', 37.78, -25.50, .37, .08, -8], ['Santa Maria', 36.97, -25.10, .07, .05, 0]];
const MADEIRA = [[32.85,-17.27],[32.8,-17.1],[32.75,-16.9],[32.72,-16.72],[32.65,-16.82],[32.64,-17.0],[32.7,-17.15],[32.75,-17.26]];
function portugalMapSVG(farmers, lang, active) {
  const path = 'M' + PT_OUTLINE.map(p => ptXY(...p).join(' ')).join('L') + 'Z';
  const cities = [['Porto', 41.15, -8.61], ['Aveiro', 40.64, -8.65], ['Coimbra', 40.21, -8.43], [lang === 'en' ? 'Lisbon' : 'Lisboa', 38.72, -9.14], ['Évora', 38.57, -7.91], ['Faro', 37.02, -7.93], ['Bragança', 41.81, -6.76]];
  const mx = (lon) => (18 + (lon + 17.3) * 60).toFixed(1), my = (lat) => (470 + (32.9 - lat) * 60).toFixed(1);
  const madPath = 'M' + MADEIRA.map(([la, lo]) => `${mx(lo)} ${my(la)}`).join('L') + 'Z';
  /* quadro dos Açores (canto superior esquerdo, sobre o mar) */
  const ax = lon => +(16 + (lon + 31.5) * 17.5).toFixed(1), ay = lat => +(30 + (39.85 - lat) * 17.5).toFixed(1);
  const acores = ACORES.map(([n, la, lo, a, b, r]) => `<ellipse cx="${ax(lo)}" cy="${ay(la)}" rx="${Math.max(1.6, a * 17.5).toFixed(1)}" ry="${Math.max(1.4, b * 17.5).toFixed(1)}" transform="rotate(${r} ${ax(lo)} ${ay(la)})" fill="#F3F1DC" stroke="#B9C59A" stroke-width="1"/>`).join('');
  const islandOf = f => f.island || (ISLAND_REGIONS.includes(f.region) ? f.region : '');
  const pins = farmers.map(f => {
    const isl = islandOf(f), [x, y] = isl === 'madeira' ? [mx(f.lon), my(f.lat)] : isl === 'acores' ? [ax(f.lon), ay(f.lat)] : ptXY(f.lat, f.lon);
    const on = f.id === active;
    return `<a class="pin${on ? ' on' : ''}" href="${f.href}" data-pin="${f.id}" aria-label="${f.name}, ${f.place}">
      <g transform="translate(${x} ${y})"><path d="M0 0c-6-8-10-13-10-19a10 10 0 0 1 20 0c0 6-4 11-10 19z" fill="${on ? C.pera : C.campo}" stroke="${on ? C.campo : '#fff'}" stroke-width="2"/><circle cx="0" cy="-19" r="3.6" fill="${on ? C.campo : C.pera}"/></g></a>`;
  }).join('');
  const vrsa = PT_OUTLINE.findIndex(p => p[0] === 37.17 && p[1] === -7.41);
  const border = PT_OUTLINE.slice(vrsa).map(p => ptXY(...p).join(' '));
  const spain = 'M' + [...border, ptXY(42.35, -8.95).join(' '), '370 0', '370 ' + ptXY(36.85, -6.2)[1], ptXY(36.9, -6.6).join(' '), ptXY(37.12, -7.0).join(' ')].join('L') + 'Z';
  return `<svg class="ptmap" viewBox="0 0 370 560" role="img" aria-label="${lang === 'en' ? 'Map of Portugal with the location of each farm' : 'Mapa de Portugal com a localização de cada quinta'}">
    <defs><clipPath id="ptclip"><rect width="370" height="560" rx="18"/></clipPath></defs>
    <g clip-path="url(#ptclip)"><rect width="370" height="560" fill="#DCE9E4"/>
    <path d="${spain}" fill="#E6E4D6" stroke="#D2CFBC" stroke-width="1"/>
    <text x="358" y="250" text-anchor="end" font-size="12" fill="#A09C84" letter-spacing="1.5">${lang === 'en' ? 'SPAIN' : 'ESPANHA'}</text>
    <text x="22" y="300" font-size="11" fill="#7FA3A0" font-style="italic" transform="rotate(-90 22 300)">${lang === 'en' ? 'Atlantic Ocean' : 'Oceano Atlântico'}</text></g>
    <path d="${path}" fill="#F3F1DC" stroke="#B9C59A" stroke-width="1.5" stroke-linejoin="round"/>
    ${cities.map(([n, la, lo]) => { const [x, y] = ptXY(la, lo); return `<circle cx="${x}" cy="${y}" r="2.6" fill="#8A9A6A"/><text x="${+x + 5}" y="${+y + 4}" font-size="10" fill="#6A7A4A">${n}</text>`; }).join('')}
    <rect x="10" y="452" width="96" height="58" rx="10" fill="#CFE0DA" stroke="#B9C59A"/><text x="58" y="503" text-anchor="middle" font-size="10" fill="#4D6A6A">Madeira</text>
    <path d="${madPath}" fill="#F3F1DC" stroke="#B9C59A" stroke-width="1.2"/>
    <rect x="8" y="10" width="128" height="76" rx="10" fill="#CFE0DA" stroke="#B9C59A"/><text x="130" y="24" text-anchor="end" font-size="10" fill="#4D6A6A">${lang === 'en' ? 'Azores' : 'Açores'}</text>
    ${acores}
    <text x="290" y="548" font-size="10" fill="#4D6A6A" font-style="italic">${lang === 'en' ? 'Illustrative map' : 'Mapa ilustrativo'}</text>
    ${pins}
  </svg>`;
}

/* ---------- Mapa da cidade de Aveiro (posições aproximadas a partir de coordenadas reais) ---------- */
const avXY = (lat, lon) => [+((lon + 8.672) / 0.040 * 640).toFixed(1), +((40.652 - lat) / 0.026 * 548).toFixed(1)];
function aveiroMapSVG(markers, lang, active, opts = {}) {
  const en = lang === 'en', W = '#BCD5CE', Wd = '#A9C8C0';
  const lab = (x, y, t, o = {}) => `<text x="${x}" y="${y}" font-size="${o.s || 11}" fill="${o.c || '#5A6B3F'}"${o.it ? ' font-style="italic"' : ''}${o.w ? ' font-weight="700"' : ''}${o.a ? ` text-anchor="${o.a}"` : ''}${o.r ? ` transform="rotate(${o.r} ${x} ${y})"` : ''} paint-order="stroke" stroke="${o.halo || '#F7F5EC'}" stroke-width="3" stroke-linejoin="round">${t}</text>`;
  const road = (d, w = 6, name = '', id = '') => `<path d="${d}" stroke="#D9D3BC" stroke-width="${w + 3}" fill="none" stroke-linecap="round"/><path${id ? ` id="${id}"` : ''} d="${d}" stroke="#fff" stroke-width="${w}" fill="none" stroke-linecap="round"/>`;
  const canal = (d, w, id) => `<path id="${id}" d="${d}" stroke="${W}" stroke-width="${w}" fill="none" stroke-linecap="round"/><path d="${d}" stroke="${Wd}" stroke-width="1" fill="none" opacity=".6"/>`;
  const along = (id, t, off = '50%', s = 10.5, c = '#3E6E6A') => `<text font-size="${s}" fill="${c}" font-style="italic" paint-order="stroke" stroke="${W}" stroke-width="0"><textPath href="#${id}" startOffset="${off}" text-anchor="middle">${t}</textPath></text>`;
  const pins = markers.map((m, i) => { const [x, y] = avXY(m.lat, m.lon), on = m.id === active;
    return `<a class="pin${on ? ' on' : ''}" href="${m.href || '#' + m.id}" data-rest="${m.id}" aria-label="${m.name}"><g transform="translate(${x} ${y})">
      <path d="M0 0c-7-9-12-15-12-22a12 12 0 0 1 24 0c0 7-5 13-12 22z" fill="${on ? C.pera : C.campo}" stroke="#fff" stroke-width="2.2"/>
      <text y="-17.5" text-anchor="middle" font-size="12" font-weight="700" fill="${on ? C.campo : C.pera}">${opts.icon ? '•' : i + 1}</text></g></a>`; }).join('');
  /* mapa real por baixo dos marcadores: mosaicos do OpenStreetMap (não precisam de chave). Sem internet, fica o desenho acima.
     Para usar o estilo CARTO (mais claro), peça uma chave grátis em carto.com/basemaps/apikey e acrescente ao fim de js/supabase-config.js:
       const MAPA_CARTO_CHAVE = 'a-sua-chave';                                                                                      */
  const CARTO = typeof MAPA_CARTO_CHAVE === 'string' && MAPA_CARTO_CHAVE.trim() ? MAPA_CARTO_CHAVE.trim() : '';
  const Z = 14, n = 2 ** Z, tx = lon => (lon + 180) / 360 * n, ty = lat => { const r = lat * Math.PI / 180; return (1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * n; };
  const lonOf = x => x / n * 360 - 180, latOf = y => Math.atan(Math.sinh(Math.PI * (1 - 2 * y / n))) * 180 / Math.PI;
  let tiles = '';
  for (let x = Math.floor(tx(-8.672)); x <= Math.floor(tx(-8.632)); x++) for (let y = Math.floor(ty(40.652)); y <= Math.floor(ty(40.626)); y++) {
    const [x0, y0] = avXY(latOf(y), lonOf(x)), [x1, y1] = avXY(latOf(y + 1), lonOf(x + 1));
    const src = CARTO ? `https://basemaps.cartocdn.com/rastertiles/voyager/${Z}/${x}/${y}@2x.png?key=${encodeURIComponent(CARTO)}` : `https://tile.openstreetmap.org/${Z}/${x}/${y}.png`;
    tiles += `<image href="${src}" x="${x0}" y="${y0}" width="${(x1 - x0).toFixed(1)}" height="${(y1 - y0).toFixed(1)}" preserveAspectRatio="none"/>`;
  }
  return `<svg class="avmap" viewBox="0 0 640 548" role="img" aria-label="${en ? 'Map of Aveiro city centre' : 'Mapa do centro de Aveiro'}">
    <defs>
      <clipPath id="av-clip"><rect width="640" height="548" rx="18"/></clipPath>
      <filter id="av-f1" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values="0.35"/><feComponentTransfer><feFuncR type="linear" slope="0.8" intercept="0.19"/><feFuncG type="linear" slope="0.8" intercept="0.18"/><feFuncB type="linear" slope="0.8" intercept="0.15"/></feComponentTransfer></filter>
      <filter id="av-f2" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncR type="linear" slope="0.5" intercept="0.48"/><feFuncG type="linear" slope="0.5" intercept="0.49"/><feFuncB type="linear" slope="0.5" intercept="0.47"/></feComponentTransfer></filter>
      <pattern id="av-blocks" width="24" height="19" patternUnits="userSpaceOnUse" patternTransform="rotate(-14)"><rect width="24" height="19" fill="#FAF8F0"/><rect x="2" y="2" width="20" height="15" rx="2" fill="#E8E3D2"/></pattern>
      <pattern id="av-blocks2" width="30" height="22" patternUnits="userSpaceOnUse" patternTransform="rotate(8)"><rect width="30" height="22" fill="#FAF8F0"/><rect x="2" y="2" width="26" height="18" rx="2" fill="#ECE8DA"/></pattern>
      <pattern id="av-pans" width="20" height="15" patternUnits="userSpaceOnUse" patternTransform="rotate(-8)"><rect width="20" height="15" fill="${Wd}"/><rect x="1.5" y="1.5" width="17" height="12" fill="#E2ECE8"/></pattern>
    </defs>
    <g clip-path="url(#av-clip)">
    <rect width="640" height="548" fill="#EEF0E2"/>
    <path d="M0 0H74C64 70 46 140 52 220 58 300 34 380 40 460 44 500 30 530 24 548H0Z" fill="${W}"/>
    <path d="M74 0H238C236 50 226 104 204 150 196 166 168 176 122 182 86 186 60 176 52 150 50 90 64 40 74 0Z" fill="url(#av-pans)"/>
    <path d="M56 252C110 240 150 226 180 228 210 270 214 330 206 412 168 432 110 436 44 430 40 360 52 300 56 252Z" fill="url(#av-pans)"/>
    <path d="M238 0H640V548H312C308 500 306 450 304 412 270 404 236 392 220 360 214 320 214 270 206 232 200 210 196 192 200 172 214 140 230 104 236 60Z" fill="url(#av-blocks)"/>
    <path d="M168 418C210 410 262 408 300 414L310 520C270 530 222 532 186 528Z" fill="#E3E8CB" stroke="#CDD5AE"/>
    ${[[190, 440, 30, 18], [232, 436, 36, 16], [276, 442, 20, 26], [200, 474, 26, 22], [244, 470, 40, 18], [212, 502, 34, 14], [262, 498, 30, 16]].map(([x, y, w, h]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="#D6DCB8"/>`).join('')}
    <ellipse cx="346" cy="330" rx="46" ry="32" fill="#CFE0AE"/><ellipse cx="352" cy="334" rx="15" ry="8" fill="${W}"/>
    <rect x="236" y="188" width="30" height="14" rx="3" fill="#D5E4B8"/>
    ${canal('M0 258C70 244 130 210 194 176', 15, 'av-c-pir')}
    ${canal('M194 176C226 188 256 206 290 230', 13, 'av-c-cen')}
    ${canal('M194 176C210 140 226 104 236 62 242 36 250 14 256 0', 11, 'av-c-sr')}
    ${canal('M290 230C324 226 362 222 418 208', 10, 'av-c-cojo')}
    <path d="M556 0L446 548" stroke="#8E8E7A" stroke-width="4"/><path d="M556 0L446 548" stroke="#fff" stroke-width="2" stroke-dasharray="7 7"/>
    ${road('M300 214L512 176', 8, '', 'av-r-lp')}
    ${road('M290 232C300 262 308 288 314 306', 5)}
    ${road('M314 306C298 360 276 398 258 430', 6, '', 'av-r-uni')}
    ${road('M512 176C522 260 476 360 404 440 380 470 360 500 350 548', 6)}
    ${road('M300 212C318 150 360 84 424 0', 5)}
    ${road('M314 306C380 300 450 296 520 300', 4)}
    <text font-size="10.5" fill="#7A7A60" font-weight="700"><textPath href="#av-r-lp" startOffset="52%" text-anchor="middle">Av. Dr. Lourenço Peixinho</textPath></text>
    <text font-size="10" fill="#7A7A60"><textPath href="#av-r-uni" startOffset="50%" text-anchor="middle">${en ? 'Av. da Universidade' : 'Av. da Universidade'}</textPath></text>
    ${along('av-c-cen', 'Canal Central', '50%')}${along('av-c-sr', 'Canal de São Roque', '30%')}${along('av-c-cojo', 'Canal do Cojo', '55%')}${along('av-c-pir', 'Canal das Pirâmides', '45%')}
    <rect x="503" y="168" width="18" height="12" rx="2" fill="${C.campo}"/>
    <circle cx="418" cy="207" r="4" fill="#8A6A3A"/><circle cx="307" cy="276" r="4" fill="#8A6A3A"/><circle cx="268" cy="160" r="3.5" fill="#8A6A3A"/><circle cx="334" cy="250" r="4" fill="#8A6A3A"/>
    ${lab(528, 172, en ? 'Station' : 'Estação', { w: 1 })}
    ${lab(426, 200, en ? 'Congress Centre' : 'Centro de Congressos', { s: 10 })}
    ${lab(316, 280, 'Sé', { s: 10 })}${lab(342, 262, 'Fórum Aveiro', { s: 10 })}
    ${lab(276, 152, 'Praça do Peixe', { s: 10 })}${lab(232, 222, 'Rossio', { s: 10 })}
    ${lab(346, 372, en ? 'Infante D. Pedro Park' : 'Parque Infante D. Pedro', { s: 10, a: 'middle' })}
    ${lab(244, 520, en ? 'University of Aveiro' : 'Universidade de Aveiro', { s: 11, a: 'middle', w: 1, halo: '#E3E8CB' })}
    ${lab(268, 120, 'Beira-Mar', { s: 10, c: '#8A8A70' })}${lab(408, 404, 'Glória', { s: 10, c: '#8A8A70' })}${lab(480, 56, 'Esgueira', { s: 10, c: '#8A8A70' })}
    ${lab(120, 96, en ? 'Salt pans' : 'Salinas', { s: 11, c: '#4D6A6A', it: 1, halo: '#E2ECE8' })}${lab(120, 350, en ? 'Salt pans' : 'Salinas', { s: 11, c: '#4D6A6A', it: 1, halo: '#E2ECE8' })}
    ${lab(26, 380, 'Ria de Aveiro', { s: 12, c: '#3E6E6A', it: 1, r: -82, halo: W })}
    ${opts.drawn ? '' : `<g class="av-tiles"${(typeof LOOK !== 'undefined' && LOOK.map) ? ` filter="url(#av-f${LOOK.map})"` : ''}>${tiles}</g>`}
    <g transform="translate(596 40)"><circle r="16" fill="#fff" opacity=".85"/><path d="M0-12L5 4 0 1-5 4Z" fill="${C.campo}"/><text y="13" text-anchor="middle" font-size="9" font-weight="700" fill="${C.campo}">N</text></g>
    <g transform="translate(520 520)"><rect x="-6" y="-14" width="110" height="24" rx="6" fill="#fff" opacity=".85"/><path d="M0 0h95" stroke="${C.folha}" stroke-width="2"/><path d="M0-4v8M95-4v8M47.5-3v6" stroke="${C.folha}" stroke-width="1.5"/><text x="47" y="-4" text-anchor="middle" font-size="9" fill="${C.folha}">500 m</text></g>
    ${opts.drawn ? lab(14, 536, en ? 'Approximate positions' : 'Posições aproximadas', { s: 10, c: '#4D6A6A', it: 1, halo: W }) : `<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener"><rect x="8" y="526" width="${CARTO ? 226 : 172}" height="16" rx="4" fill="#fff" opacity=".85"/><text x="14" y="537.5" font-size="9.5" fill="#4D5A3F">© OpenStreetMap contributors${CARTO ? ' © CARTO' : ''}</text></a>`}
    ${pins}
    </g></svg>`;
}

/* Phone illustration: viewBox 0 0 240 200 */
function phoneSVG(cls = '') {
  return `<svg class="${cls}" viewBox="0 0 240 200" aria-hidden="true" focusable="false">
    <ellipse cx="120" cy="186" rx="96" ry="9" fill="rgba(34,56,10,.14)"/>
    <path d="M40 120c0-20 16-32 34-32h92c18 0 34 12 34 32v52c0 8-6 12-12 12H52c-6 0-12-4-12-12z" fill="${C.campo}"/>
    <path d="M30 96c0-28 40-44 90-44s90 16 90 44c0 8-6 12-14 12h-24c-8 0-12-6-12-12v-6c-12-4-26-6-40-6s-28 2-40 6v6c0 6-4 12-12 12H44c-8 0-14-4-14-12z" fill="${C.folha}"/>
    <circle cx="120" cy="144" r="28" fill="${C.pera}"/>
    ${Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + i / 10 * Math.PI * 2; return `<circle cx="${(120 + 18 * Math.cos(a)).toFixed(1)}" cy="${(144 + 18 * Math.sin(a)).toFixed(1)}" r="3.6" fill="${C.campo}"/>`; }).join('')}
    <circle cx="120" cy="144" r="7" fill="${C.peraL}"/>
    <g transform="translate(170 20) scale(.5)">${ART.pera}</g><g transform="translate(18 18) scale(.46)">${ART.alface}</g>
  </svg>`;
}

/* Restaurant seal: viewBox 0 0 200 200 */
function sealSVG(cls = '', lang = 'pt') {
  const txt = lang === 'en' ? 'FRESH AND TRACEABLE • DAQUI SEAL • ' : 'FRESCO E RASTREÁVEL • SELO DAQUI • ';
  return `<svg class="${cls}" viewBox="0 0 200 200" role="img" aria-label="${lang === 'en' ? 'Daqui seal' : 'Selo Daqui'}">
    <defs><path id="sealpath-${cls}" d="M100 100m-72 0a72 72 0 1 1 144 0a72 72 0 1 1-144 0"/></defs>
    <circle cx="100" cy="100" r="96" fill="${C.campo}"/><circle cx="100" cy="100" r="88" fill="none" stroke="${C.pera}" stroke-width="2"/>
    <circle cx="100" cy="100" r="56" fill="none" stroke="${C.pera}" stroke-width="1.5" stroke-dasharray="3 4"/>
    <text font-size="13" fill="${C.pera}" font-family="Atkinson Hyperlegible, sans-serif" font-weight="700"><textPath href="#sealpath-${cls}" textLength="448" lengthAdjust="spacing">${txt}</textPath></text>
    <g transform="translate(64 60) scale(.6)">${ART.pera.replaceAll(C.leaf, C.pera).replaceAll(C.folha, '#1a2b06')}</g>
  </svg>`;
}

/* ===== UI line icons (24x24, stroke=currentColor) ===== */
const IC = {
  doc: '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h6"/>',
  wallet: '<path d="M4 7h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a1 1 0 0 1-1-1V7z"/><path d="M4 7l11-3v3M16 13.5h2"/>',
  gift: '<rect x="4" y="9" width="16" height="11" rx="1"/><path d="M3 9h18v-2H3zM12 7v13M12 7c-1-3-5-4-5-1.5S12 7 12 7zm0 0c1-3 5-4 5-1.5S12 7 12 7z"/>',
  receipt: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6M9 16h3"/>',
  download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.5"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
  palette: '<path d="M12 3a9 9 0 1 0 0 18c1.2 0 1.6-.9 1.2-1.8-.5-1.1.2-2.2 1.4-2.2H17a4 4 0 0 0 4-4c0-5.5-4-10-9-10z"/><circle cx="7.5" cy="11" r="1.2"/><circle cx="10" cy="7" r="1.2"/><circle cx="15" cy="7.5" r="1.2"/>',
  sound: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>',
  layers: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
  crosshair: '<circle cx="12" cy="12" r="7"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
  chat: '<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9.5h8M8 12.5h5"/>',
  send: '<path d="M4 12l16-8-6 16-3-7z"/><path d="M11 13l9-9"/>',
  star: '<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8 6.8 19.6l1-5.8-4.3-4.1 5.9-.8z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  home: '<path d="M4 11l8-7 8 7"/><path d="M6 9.5V20h4.5v-5.5h3V20H18V9.5"/>',
  map: '<path d="M9 4L3 6.5v13.5l6-2.5 6 2.5 6-2.5V4l-6 2.5z"/><path d="M9 4v13.5M15 6.5V20"/>',
  camera: '<path d="M4 8h3.2L9 5.5h6L16.8 8H20a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.6"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.5 4 5.6 4 9s-1.4 6.5-4 9c-2.6-2.5-4-5.6-4-9s1.4-6.5 4-9z"/>',
  inbox: '<path d="M3 13l2.5-8h13L21 13v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><path d="M3 13h5l1.5 2.5h5L16 13h5"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>',
  grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/>',
  locate: '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4.5-6 8-6s7 2 8 6"/>',
  basket: '<path d="M3 10h18l-2 10H5z"/><path d="M8 10l3-6M16 10l-3-6M9 14v3M12 14v3M15 14v3"/>',
  phone: '<path d="M5 3h4l2 5-2.5 1.5a11 11 0 006 6L16 13l5 2v4a2 2 0 01-2 2A17 17 0 013 5a2 2 0 012-2z"/>',
  menu: '<path d="M3 6h18M3 12h18M3 18h18"/>', close: '<path d="M6 6l12 12M18 6L6 18"/>',
  chevL: '<path d="M15 5l-7 7 7 7"/>', chevR: '<path d="M9 5l7 7-7 7"/>', chevD: '<path d="M5 9l7 7 7-7"/>',
  check: '<path d="M4 12.5l5 5L20 6.5"/>', x: '<path d="M6 6l12 12M18 6L6 18"/>',
  leaf: '<path d="M5 19C5 10 11 4 20 4c0 9-6 15-15 15z"/><path d="M5 19l8-8"/>',
  coins: '<ellipse cx="9" cy="7" rx="6" ry="3"/><path d="M3 7v4c0 1.7 2.7 3 6 3s6-1.3 6-3V7"/><path d="M9 14v3c0 1.7 2.7 3 6 3s6-1.3 6-3v-4c0-1.7-2.7-3-6-3"/>',
  euro: '<path d="M17 6.5A7 7 0 0 0 7 12a7 7 0 0 0 10 5.5"/><path d="M4 10h9M4 14h9"/>',
  pin: '<path d="M12 21s-7-6.5-7-12a7 7 0 0114 0c0 5.5-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
  truck: '<path d="M2 6h12v10H2zM14 10h4l3 3v3h-7z"/><circle cx="6" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
  store: '<path d="M4 9l1.5-5h13L20 9"/><path d="M4 9h16v2a3 3 0 01-6 0 3 3 0 01-4 0 3 3 0 01-6 0z"/><path d="M5 13v7h14v-7"/><path d="M10 20v-4h4v4"/>',
  box: '<path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4M12 11v10"/>',
  tractor: '<circle cx="7" cy="16" r="4"/><circle cx="18" cy="17" r="3"/><path d="M7 12V6h5l2 6M14 12h5l1 3M11 16h4"/>',
  utensils: '<path d="M7 3v8M4 3v5a3 3 0 006 0V3M7 11v10"/><path d="M17 21V3c-2.5 1.5-3.5 4-3.5 7v3H17"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  sprout: '<path d="M12 21v-8"/><path d="M12 13c0-4-3-7-8-7 0 4 3 7 8 7z"/><path d="M12 11c0-4 3-7 8-7 0 4-3 7-8 7z"/>',
  snow: '<path d="M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7"/><path d="M9 4l3 2 3-2M9 20l3-2 3 2"/>',
  hand: '<path d="M3 12l4-4 4 2 3-3 7 6-5 5-3-2-2 2-3-3-2 1z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
  heart: '<path d="M12 20s-8-5-8-11a4.5 4.5 0 018-3 4.5 4.5 0 018 3c0 6-8 11-8 11z"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 015 .5c0 2-2.5 2-2.5 4M12 17.5v.01"/>',
  alert: '<path d="M12 3l9.5 17h-19z"/><path d="M12 10v4M12 17.5v.01"/>',
  route: '<circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="6" r="2.5"/><path d="M8.5 18H16a3 3 0 000-6H8a3 3 0 010-6h7.5"/>',
  repeat: '<path d="M17 2l3 3-3 3"/><path d="M4 11V9a4 4 0 014-4h12M7 22l-3-3 3-3"/><path d="M20 13v2a4 4 0 01-4 4H4"/>',
  sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 17l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/>',
  flyer: '<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4M9 12h7M9 16h5"/>',
  app: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>',
  instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5v.01"/>',
  facebook: '<path d="M14 21v-8h3l.5-3.5H14V7.5c0-1 .4-1.8 1.8-1.8H18V2.6c-.4 0-1.6-.2-3-.2-3 0-4.6 1.8-4.6 5v2.1H7.5V13h2.9v8"/>',
  tiktok: '<path d="M14 3v12a4 4 0 11-4-4"/><path d="M14 3c.5 3 2.5 5 6 5"/>',
  minus: '<path d="M5 12h14"/>', plus: '<path d="M12 5v14M5 12h14"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
  filter: '<path d="M4 5h16l-6 8v6l-4-2v-4z"/>', bell: '<path d="M6 16V11a6 6 0 0112 0v5l2 2H4z"/><path d="M10 20a2 2 0 004 0"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  logout: '<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10"/>', pause: '<path d="M9 5v14M15 5v14"/>', play: '<path d="M7 4l13 8-13 8z"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.5 3.5-5.5 6.5-5.5s5.7 2 6.5 5.5"/><circle cx="17" cy="9" r="2.8"/><path d="M16.5 14.5c2.5.2 4.4 2 5 5"/>'
};
function icon(name, size = 22, cls = '') {
  return `<svg class="ic ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${IC[name] || ''}</svg>`;
}
