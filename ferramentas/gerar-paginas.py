#!/usr/bin/env python3
"""Gera um index.html para cada página e subpágina do site da Daqui.

Corra a partir da pasta do site:   python3 ferramentas/gerar-paginas.py

Lê js/data.js para saber que produtos, agricultores e caixas existem e cria:
  /produtos/<id>/index.html, /agricultores/<id>/index.html, /subscricao/<caixa>/index.html
O conteúdo de cada página é desenhado pelo JavaScript (js/pages-*.js); estes ficheiros
só dizem qual é a página (data-page) e onde estão o CSS e o JS (data-root).
"""
import re, pathlib, html

SITE = pathlib.Path(__file__).resolve().parent.parent
data = (SITE / 'js' / 'data.js').read_text(encoding='utf-8')

products = re.findall(r"^prod\('([a-z0-9-]+)'", data, re.M)
boxes = re.findall(r"\{ id:'(caixa-[a-z0-9-]+)'", data)
farmers_block = data[data.index('const FARMERS'):data.index('];', data.index('const FARMERS'))]
farmers = re.findall(r"\{ id:'([a-z0-9-]+)', name:'([^']+)'", farmers_block)

# muda a cada versão: obriga o navegador a ir buscar os ficheiros novos (e não misturar com os antigos em cache)
APP_VERSAO = '2026-11-23-v11'
SCRIPTS = ['art', 'data', 'alteracoes', 'catalogo', 'analises', 'supabase-config', 'nuvem', 'auth', 'dados', 'app', 'pages-loja', 'pages-info', 'pages-conta', 'pages-gestao', 'pages-gestao2', 'pages-parceiro', 'textos', 'faturas', 'pages-extra']
FONTS = 'https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Marcellus&display=swap'

def shell(page, title, root, pid=''):
    scripts = '\n'.join(f'<script src="{root}js/{s}.js?v={APP_VERSAO}"></script>' for s in SCRIPTS)
    data_id = f' data-id="{pid}"' if pid else ''
    return f'''<!DOCTYPE html>
<html lang="pt-PT">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Daqui | {html.escape(title)}</title>
<meta name="description" content="Daqui: fruta e legumes de agricultores portugueses, do campo para a sua casa, com preço justo e origem transparente.">
<meta name="theme-color" content="#3C6104">
<link rel="icon" href="{root}img/favicon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="{FONTS}" rel="stylesheet">
<link rel="stylesheet" href="{root}css/styles.css?v={APP_VERSAO}">
</head>
<body data-page="{page}"{data_id} data-root="{root}">
<a class="sr skip" href="#main">Saltar para o conteúdo / Skip to content</a>
<div id="app"><noscript><p class="wrap">Este site precisa de JavaScript. / This site needs JavaScript.</p></noscript></div>
<div id="overlay" class="overlay"></div>
<aside id="drawer" class="drawer" role="dialog" aria-modal="true" aria-labelledby="cart-title"></aside>
<div id="modal" class="modal"><div class="scrim"></div><div class="box" role="dialog" aria-modal="true"></div></div>
<div id="toast" class="toast" role="status" aria-live="polite"></div>
{scripts}
</body>
</html>
'''

pages = [
    ('', 'inicio', 'Fruta e legumes do campo para a sua casa'),
    ('produtos', 'produtos', 'Produtos'), ('subscricao', 'subscricao', 'Subscrição'),
    ('agricultores', 'agricultores', 'Os nossos agricultores'), ('restaurantes', 'restaurantes', 'Restaurantes'),
    ('colhe-connosco', 'colhe-connosco', 'Colhe Connosco'), ('sobre', 'sobre', 'Sobre nós'),
    ('contacto', 'contacto', 'Contacto'), ('faq', 'faq', 'Perguntas frequentes'), ('politicas', 'politicas', 'Políticas'),
    ('entrar', 'entrar', 'Entrar'), ('conta', 'conta', 'A minha conta'), ('finalizar', 'finalizar', 'Finalizar encomenda'), ('parceiro', 'parceiro', 'Área de parceiro'),
    ('restaurante', 'restaurante', 'Restaurante'), ('cooperativa', 'cooperativa', 'Cooperativa'),
    ('termos', 'termos', 'Termos e condições'), ('privacidade', 'privacidade', 'Privacidade'), ('cookies', 'cookies', 'Cookies'), ('devolucoes', 'devolucoes', 'Devoluções'),
]
count = 0
def write(path, page, title, pid=''):
    global count
    depth = len([p for p in path.split('/') if p])
    root = './' if depth == 0 else '../' * depth
    folder = SITE / path if path else SITE
    folder.mkdir(parents=True, exist_ok=True)
    (folder / 'index.html').write_text(shell(page, title, root, pid), encoding='utf-8')
    count += 1

for path, page, title in pages:
    write(path, page, title)
for pid in boxes + products:
    write(f'produtos/{pid}', 'produto', 'Produto', pid)
for fid, name in farmers:
    write(f'agricultores/{fid}', 'agricultor', name, fid)
for box in boxes:
    write(f'subscricao/{box}', 'subscrever', 'Subscrever', box)

# ícones: cada produto precisa de img/produtos/<id>.svg (cria um provisório se faltar)
icons = SITE / 'img' / 'produtos'
for pid in boxes + products:
    f = icons / f'{pid}.svg'
    if not f.exists() and (icons / '_novo.svg').exists():
        f.write_text((icons / '_novo.svg').read_text(encoding='utf-8'), encoding='utf-8')
        print(f'Ícone provisório criado: img/produtos/{pid}.svg (substitua por um desenho próprio)')
for pid in products:
    if not (SITE / 'docs' / 'analises' / f'{pid}.pdf').exists():
        print(f'Aviso: falta o boletim docs/analises/{pid}.pdf (corra ferramentas/gerar-analises.py ou coloque um PDF com esse nome)')

# app para telemóvel (web app em /app e base da app Android): mesmos scripts do site + os da app
APP_SCRIPTS = SCRIPTS + ['app-config', 'app-nativo', 'app-movel']
# muda a cada versão: obriga o navegador a ir buscar os ficheiros novos (e não misturar com os antigos em cache)
# se faltar um ficheiro no site ou houver um erro antes de a app abrir, mostra o motivo em vez de um ecrã vazio
APP_GUARDA = r'''<script>
(function () {
  var erro = '';
  function mostrar(pt, en, tipo) {
    if (document.getElementById('daqui-falha')) return;
    if (!document.body) { document.addEventListener('DOMContentLoaded', function () { mostrar(pt, en, tipo); }); return; }
    var d = document.createElement('div');
    d.id = 'daqui-falha';
    d.setAttribute('role', 'alert');
    if (tipo) d.setAttribute('data-tipo', tipo);
    d.style.cssText = 'position:fixed;inset:0;z-index:99999;overflow:auto;background:#FFFDF6;color:#2F4C03;font:16px/1.5 system-ui,sans-serif;padding:12vh 24px 24px';
    d.innerHTML = '<div style="max-width:30em;margin:0 auto"><p style="font-size:20px;margin:0 0 10px"><b>A app não abriu</b> · <span lang="en">The app did not open</span></p>'
      + '<p style="margin:0 0 10px">' + pt + '</p><p lang="en" style="margin:0;color:#556">' + en + '</p></div>';
    document.body.appendChild(d);
  }
  window.addEventListener('error', function (e) {
    var t = e.target;
    if (t && (t.tagName === 'SCRIPT' || t.tagName === 'LINK')) {
      var f = (t.getAttribute('src') || t.getAttribute('href') || '').replace(/^(\.\.?\/)+/, '').replace(/\?.*$/, '');
      if (/^https?:/.test(f)) return;
      mostrar('Falta no site o ficheiro <b>' + f + '</b>. Confirme no GitHub que ele existe nessa pasta, a partir da raiz do repositório.',
              'The file <b>' + f + '</b> is missing from the site. Check on GitHub that it exists in that folder, from the root of the repository.');
    } else if (!window.__daquiPronto && !erro) {
      erro = String(e.message || e.error || '?').replace(/</g, '&lt;');
      setTimeout(verificar, 1500);
    }
  }, true);
  window.addEventListener('unhandledrejection', function (e) {
    if (window.__daquiPronto || erro) return;
    var r = e.reason; erro = String((r && r.message) || r || '?').replace(/</g, '&lt;');
    setTimeout(verificar, 1500);
  });
  window.addEventListener('load', function () { setTimeout(verificar, 20000); });
  function verificar() {
      if (window.__daquiPronto) return;
      mostrar('Erro: <code>' + (erro || 'a app não terminou de carregar') + '</code>. Recarregue a página (no computador: Ctrl+F5). Se continuar, confirme que todos os ficheiros das pastas js/ e app/ foram atualizados no GitHub.',
              'Reload the page (on a computer: Ctrl+F5). If it persists, check that every file in the js/ and app/ folders was updated on GitHub.', 'espera');
  }
})();
</script>'''
app_dir = SITE / 'app'; app_dir.mkdir(exist_ok=True)
(app_dir / 'index.html').write_text(f'''<!DOCTYPE html>
<html lang="pt-PT">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="color-scheme" content="light">
<title>Daqui</title>
<meta name="description" content="App da Daqui: fruta e legumes do campo para a sua casa.">
<meta name="theme-color" content="#3C6104">
<meta name="mobile-web-app-capable" content="yes">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="../img/favicon.png">
<link rel="apple-touch-icon" href="icones/icone-192.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="{FONTS}" rel="stylesheet">
{APP_GUARDA}
<link rel="stylesheet" href="../css/styles.css?v={APP_VERSAO}">
<link rel="stylesheet" href="../css/app.css?v={APP_VERSAO}">
</head>
<body class="app" data-page="app" data-root="../">
<div id="app"><noscript><p class="wrap">A app precisa de JavaScript. / The app needs JavaScript.</p></noscript></div>
<div id="overlay" class="overlay"></div>
<aside id="drawer" class="drawer" role="dialog" aria-modal="true" aria-labelledby="cart-title"></aside>
<div id="modal" class="modal"><div class="scrim"></div><div class="box" role="dialog" aria-modal="true"></div></div>
<div id="toast" class="toast" role="status" aria-live="polite"></div>
{chr(10).join(f'<script src="../js/{x}.js?v={APP_VERSAO}"></script>' for x in APP_SCRIPTS)}
</body>
</html>
''', encoding='utf-8')
count += 1

print(f'{count} páginas geradas ({len(products) + len(boxes)} produtos, {len(farmers)} agricultores, {len(boxes)} caixas).')
