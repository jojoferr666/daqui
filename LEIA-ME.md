# Site da Daqui — documentação

Site de demonstração da Daqui (fruta e legumes do campo para casa), feito para a cadeira de Inglês: Projeto de Aplicação (IPA) da Universidade de Aveiro. Empresa, pessoas, preços e contactos são fictícios.

O site é **estático** (HTML, CSS e JavaScript) e funciona de duas maneiras:

- **com a base de dados Supabase** (secção 2): contas, encomendas, pedidos e catálogo ficam online, a mesma conta funciona em qualquer dispositivo e a gestão vê tudo em tempo real. É o modo para o site publicado no GitHub Pages;
- **sem base de dados**: tudo o que um visitante faz fica no `localStorage` do navegador. É o que acontece com `js/supabase-config.js` vazio, a abrir o ficheiro com duplo clique sem internet, ou no OnionShare.

Todo o site existe em **português e inglês** (botões PT / EN no cabeçalho).

O site inclui também a **app para telemóvel** (pasta `app/`): a mesma loja, contas e painéis, organizados em ecrãs de app com separadores em baixo. Abre no navegador do telemóvel em `<endereço do site>/app/` e é a base da app Android (projeto `daqui-android`, com o seu próprio `LEIA-ME-APP.md`). Ver secção 23.

Índice

1. [Abrir o site](#1-abrir-o-site)
2. [Ligar à base de dados Supabase (passo a passo)](#2-ligar-à-base-de-dados-supabase-passo-a-passo)
3. [Publicar no GitHub Pages](#3-publicar-no-github-pages)
4. [Contas de demonstração](#4-contas-de-demonstração)
5. [Mapa dos ficheiros](#5-mapa-dos-ficheiros)
6. [Como uma página é desenhada](#6-como-uma-página-é-desenhada)
7. [Português e inglês](#7-português-e-inglês)
8. [Dados do catálogo (js/data.js)](#8-dados-do-catálogo-jsdatajs)
9. [Ícones e boletins de análises](#9-ícones-e-boletins-de-análises)
10. [Conta de gestão](#10-conta-de-gestão)
11. [As alterações da gestão ficam no código?](#11-as-alterações-da-gestão-ficam-no-código)
12. [Contas de agricultor e de restaurante](#12-contas-de-agricultor-e-de-restaurante)
13. [Encomendas, entregas e seguimento](#13-encomendas-entregas-e-seguimento)
14. [Pedidos que chegam à gestão](#14-pedidos-que-chegam-à-gestão)
15. [Subscrições e preço garantido](#15-subscrições-e-preço-garantido)
16. [O que fica guardado no navegador](#16-o-que-fica-guardado-no-navegador)
17. [Estilos, cores e mapas](#17-estilos-cores-e-mapas)
18. [Ferramentas](#18-ferramentas)
19. [Partilhar com o OnionShare](#19-partilhar-com-o-onionshare)
20. [Receitas: alterações frequentes](#20-receitas-alterações-frequentes)
21. [Testar e resolver problemas](#21-testar-e-resolver-problemas)
22. [Limites desta demonstração](#22-limites-desta-demonstração)
23. [App para telemóvel](#23-app-para-telemóvel)
24. [Versão 7: o que mudou](#24-versão-7-o-que-mudou)

---

## 1. Abrir o site

Há três maneiras, todas a partir da pasta do site:

- **Duplo clique** em `index.html`. Funciona: os links passam a apontar para `.../index.html` automaticamente.
- **VS Code**: extensão *Live Server*, botão direito em `index.html` → *Open with Live Server*. Os endereços ficam limpos (`/produtos`, `/conta`).
- **Terminal**: `python3 -m http.server 8000` e abrir `http://localhost:8000`.

Os endereços são pastas: `/produtos`, `/produtos/pera-rocha`, `/agricultores/joaquim`, `/subscricao/caixa-mista`, `/conta`, `/parceiro`. Cada pasta tem um `index.html`.

## 2. Ligar à base de dados Supabase (passo a passo)

Sem base de dados, cada navegador guarda os seus próprios dados. Com o Supabase ligado:

- a mesma conta funciona em qualquer computador ou telemóvel;
- contas (nome, telemóvel, e-mail, morada, favoritos, produtos que não quer receber), subscrições, inscrições no Colhe Connosco, encomendas e o seu estado, pedidos e todo o catálogo (produtos com ou sem stock, épocas, colheitas, preços, divisão do preço, caixas, agricultores, restaurantes, dias Colhe Connosco) ficam numa base de dados;
- a conta de gestão vê em tempo real o que clientes, agricultores e restaurantes estão a fazer;
- cada quinta e cada restaurante tem a sua conta (secção 4).

O mesmo site funciona com e sem base de dados: se `js/supabase-config.js` estiver vazio, ou se não houver ligação (por exemplo no OnionShare), usa os dados do navegador como antes e mostra um aviso.

### 2.1 Criar o projeto

1. Entre em [supabase.com](https://supabase.com) → *Start your project* (pode entrar com a conta do GitHub).
2. *New project*: nome `daqui`, uma palavra-passe para a base de dados (guarde-a, mas o site não precisa dela), região na Europa (ex.: *West EU (Ireland)* ou *Central EU (Frankfurt)*), plano *Free*.
3. Espere um ou dois minutos até o projeto ficar pronto.

### 2.2 Criar as tabelas e os dados (SQL Editor)

No menu da esquerda, **SQL Editor** → *New query*. Para cada ficheiro da pasta `supabase/`, **por esta ordem**: abra-o no VS Code, copie tudo (Ctrl+A, Ctrl+C), cole no editor do Supabase e carregue em **Run**.

| Ficheiro | O que faz |
|---|---|
| `supabase/01-estrutura.sql` | Cria as tabelas, as regras de acesso (quem pode ler e mudar o quê), as funções usadas pelo site e liga o tempo real. O Supabase avisa que tem operações destrutivas (*destructive operations*): confirme. |
| `supabase/02-catalogo.sql` | Põe na base de dados os 94 produtos, 15 agricultores, 8 restaurantes, preços das caixas e dias Colhe Connosco de `js/data.js`. |
| `supabase/03-contas.sql` | Cria as 27 contas de demonstração (clientes, gestão, uma por quinta e uma por restaurante), com subscrições, inscrições, encomendas e pedidos de exemplo. |
| `supabase/04-app.sql` | Para a app: telemóveis que recebem notificações, fotografias das incidências (Storage, pasta `incidencias`) e "deslizar para confirmar" o levantamento. Corra também se só usar o site: as fotografias das incidências do site usam-no. |
| `supabase/06-melhorias.sql` | Versão 7: vários produtores por produto e escolha convencional/biológico, aprovar ou rejeitar pedidos com mensagem, edição e avaliações do Colhe Connosco, registo da colheita e "Falar com a Daqui". Corra-o **antes** de enviar a versão 7 do site. Pode ser corrido mais do que uma vez. |
| `supabase/07-colhe-e-produtos.sql` | Versão 9: vários dias Colhe Connosco na mesma data (cada dia tem um id), avaliação só uma vez, registo da colheita com valor pago, "Deixar de vender" e fotografias de produtos novos. Corra-o **antes** de enviar a versão 9 do site, depois do 06. Depois do 07, não volte a correr o 06. |
| `supabase/08-avaliacoes-e-caixas.sql` | Versão 10: respostas da gestão aos comentários do Colhe Connosco, lista pública das avaliações dos dias passados e tabela `caixas` (caixas novas criadas na gestão). Corra-o **antes** de enviar a versão 10 do site, depois do 07. |
| `supabase/09-loja-e-inventario.sql` | Versão 11: inventário (entregas dos agricultores em lotes, stock confirmado em cada encomenda), Saldo Daqui, Cooperativa, promoções e códigos, notificações do sininho, avaliações de produtos, caixas preparadas e definições da gestão (portes). Corra-o **antes** de enviar a versão 11 do site, depois do 08. |
| `supabase/05-notificacoes.sql` | Só para as notificações da app Android, **depois** de criar a função `notificar` (ver `LEIA-ME-APP.md` do projeto `daqui-android`). Antes de correr, troque as 2 linhas marcadas com `<<<`. |

Para confirmar: **Table Editor** → tabela `perfis` deve ter 27 linhas e `produtos` 94.

O `01` pode ser corrido outra vez, mas apaga as tabelas da Daqui (contas de login continuam a existir). Depois disso corra outra vez o `02` e o `03`.

### 2.3 Deixar criar contas sem confirmar o e-mail

**Authentication** → **Sign In / Providers** (em alguns painéis: *Providers* → *Email*) → desligue **Confirm email** → *Save*.

Assim, quem cria conta no site entra logo. Se deixar ligado, o Supabase envia um e-mail de confirmação e a pessoa só consegue entrar depois de carregar no link (o plano grátis só envia poucos e-mails por hora).

### 2.4 Ligar o site ao projeto

1. No Supabase, carregue no botão **Connect** no topo (ou **Project Settings** → **API Keys** e **Data API**).
2. Copie o **Project URL** (ex.: `https://abcdefghijklmno.supabase.co`) e a chave pública: **anon public** (começa por `eyJ…`) ou **publishable** (começa por `sb_publishable_…`).
3. Abra `js/supabase-config.js` e preencha:

```js
const SUPABASE_URL = 'https://abcdefghijklmno.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOi…';   // a chave pública (anon / publishable)
```

4. Envie o ficheiro para o GitHub (secção 3). Pode também editá-lo diretamente no github.com (ícone do lápis → *Commit changes*).

A chave pública pode estar no site: só permite o que as regras da base de dados deixam (cada conta vê o que é seu; só a gestão vê e muda tudo). **Nunca** use a chave `service_role` / `secret` (`sb_secret_…`) no site.

### 2.5 Experimentar

- Abra o site no computador e entre com `gestao` / `gestao2026`. O painel mostra "Base de dados: tempo real" (ou "atualiza a cada 30 s" se o tempo real não estiver disponível).
- No telemóvel, entre com `maria` / `daqui2026`, mude os favoritos ou faça uma encomenda: aparece no painel da gestão sem recarregar.
- Crie uma conta nova no telemóvel e entre com ela no computador.

### 2.6 Ver e mudar os dados no Supabase

**Table Editor** mostra cada tabela como uma folha de cálculo; pode editar diretamente.

| Tabela | O que guarda |
|---|---|
| `perfis` | uma linha por conta: utilizador, nome, telemóvel, e-mail, tipo (`cliente`, `agricultor`, `restaurante`, `admin`), morada, `favoritos`, `excluidos` (produtos que não quer receber), `avisos`, dados de parceiro |
| `subscricoes` | caixa, tamanho, frequência, dia, entrega, preço guardado, início, estado |
| `inscricoes_colhe` | quem vai a cada dia Colhe Connosco e quantas pessoas |
| `encomendas` | número, cliente, dia de entrega, artigos, totais, estado (`etapa`: vazio = automático, 0 recebida … 3 entregue), `preferencias` do cliente nas caixas |
| `pedidos` | tudo o que chega ao painel da gestão (secção 14) |
| `produtos` | catálogo de fruta e legumes: nomes PT/EN, preço, unidade, agricultor, ícone, época (`epoca_inicio`, `epoca_fim`), última colheita, essencial, biológico, `fora_stock`, `divisao` do preço |
| `caixas_precos` | preço e peso de cada tamanho de cada caixa |
| `agricultores`, `restaurantes`, `dias_colhe` | quintas, restaurantes parceiros e dias Colhe Connosco |

As contas de login (e-mail e palavra-passe) estão em **Authentication** → **Users**. As contas de demonstração usam e-mails fictícios `<utilizador>@contas.daqui.pt`; entra-se com o nome de utilizador ou o telemóvel.

**Dar acesso de gestão a outra conta** (SQL Editor):

```sql
update public.perfis set papel = 'admin' where username = 'o-nome-de-utilizador';
```

### 2.7 Como o código fala com a base de dados

- `js/supabase-config.js`: o endereço e a chave. Vazio = modo local.
- `js/nuvem.js`: toda a ligação ao Supabase, sem bibliotecas externas (usa as APIs REST, Auth e Realtime diretamente).
  - Ao abrir cada página, `NUVEM.start()` lê o catálogo e, com sessão iniciada, as contas, subscrições, inscrições, encomendas e pedidos que a pessoa pode ver. Só depois a página é desenhada.
  - O resto do site continua a usar `USERS`, `ORDERS`, `REQUESTS`, `PRODUCTS`… Quando o código chama `saveUsers()`, `saveOrders()`, `saveRequests()` ou `saveCatalog()`, o `nuvem.js` compara com o que veio da base de dados e envia só o que mudou, por ordem.
  - Tempo real: com sessão iniciada, o site recebe um aviso sempre que uma tabela muda, volta a ler os dados e redesenha a página (espera se estiver a escrever num campo ou com uma janela aberta). Sem tempo real, volta a ler a cada `SUPABASE_ATUALIZAR_SEGUNDOS`.
  - Entrar: `email_para_login` descobre o e-mail a partir do utilizador ou telemóvel e o Supabase Auth valida a palavra-passe. Criar conta: o Supabase Auth cria o login e um *trigger* cria a linha em `perfis`.
  - Visitantes sem conta podem encomendar e enviar pedidos; para seguir ou mudar uma encomenda usam as funções `encomenda_por_numero` e `gerir_encomenda` (número + telemóvel).
- `supabase/01-estrutura.sql`: regras de acesso (RLS). Resumo: catálogo público para leitura; cada conta lê e muda o que é seu; a gestão (`papel = 'admin'`) lê e muda tudo; agricultores aprovados mudam o stock dos seus produtos e o perfil da sua quinta; restaurantes aprovados mudam o seu perfil. *Triggers* impedem que alguém mude o seu tipo de conta, a aprovação ou o estado de uma encomenda, e que se passe do limite de lugares do Colhe Connosco.

**Acrescentar um campo** (ex.: "calibre" nos produtos):
1. SQL Editor: `alter table public.produtos add column calibre text;`
2. `js/nuvem.js`: em `toProd` leia `r.calibre` para `p.caliber`; em `fromProd` escreva `calibre: p.caliber || null`; se a gestão o puder mudar, junte `caliber: v => ({ calibre: v })` a `PROD_PATCH`.
3. Use `p.caliber` nas páginas, com `T()` para os textos.

**Passar mudanças de `data.js` para a base de dados**: `node ferramentas/gerar-sql.js` volta a gerar `02-catalogo.sql` e `03-contas.sql`; corra o `02` no SQL Editor (atualiza os produtos que existem e acrescenta os novos, não apaga nada).

### 2.8 Plano grátis: a ter em conta

- Um projeto sem atividade durante uma semana fica em pausa. Abra o painel do Supabase uns dias antes da apresentação e, se aparecer *Paused*, carregue em *Restore*.
- Limites do plano grátis: 500 MB de base de dados e 50 000 utilizadores por mês, muito acima do que este projeto usa.

## 3. Publicar no GitHub Pages

O site é uma pasta de ficheiros estáticos e funciona tal como está no GitHub Pages.

**Atualizar o repositório que já tem** (a nova versão muda cerca de 480 ficheiros e o carregamento pelo browser do github.com aceita no máximo 100 de cada vez, por isso use o VS Code ou o GitHub Desktop):

1. **VS Code**: *Source Control* → *Clone Repository* → escolha o seu repositório (ou abra a pasta onde já o tem clonado).
2. Copie para dentro dessa pasta todo o conteúdo da pasta `daqui-site` do zip, substituindo os ficheiros (não apague a pasta escondida `.git`).
3. Preencha `js/supabase-config.js` (secção 2.4).
4. *Source Control* → escreva uma mensagem (ex.: "Base de dados Supabase") → *Commit* → *Sync Changes* (ou *Push*).
5. No github.com: **Settings** → **Pages** → *Build and deployment*: *Deploy from a branch*, ramo `main`, pasta `/ (root)`. Espere um a dois minutos.
6. Abra o endereço `https://<utilizador>.github.io/<repositório>/` e recarregue com Ctrl+F5 para não usar ficheiros antigos.

O `index.html` tem de estar na raiz do repositório (não dentro de outra pasta). Os endereços funcionam também dentro de `/<repositório>/`.

## 4. Contas de demonstração

Entre em `/entrar` com o nome de utilizador **ou** o telemóvel (com a base de dados, também com o e-mail).

| Utilizador | Telemóvel | Palavra-passe | O que mostra |
|---|---|---|---|
| `maria` | 912 345 678 | `daqui2026` | Cliente: Caixa Mista semanal, inscrita num Colhe Connosco, morada guardada, favoritos e um produto que não quer receber |
| `joao` | 913 222 111 | `daqui2026` | Cliente: Caixa de Fruta quinzenal cujo preço baixou, encomendas |
| `anarocha` | 936 555 444 | `daqui2026` | Cliente com subscrição em pausa |
| `gestao` | 234 000 000 | `gestao2026` | **Equipa Daqui**: painel de gestão |

**Cada quinta e cada restaurante tem a sua conta de parceiro**, todas com a palavra-passe `daqui2026`: agricultores `agr.<id>`, restaurantes `rest.<id>` (a lista também aparece na página Entrar).

| Utilizador | Telemóvel | Quinta ou restaurante |
|---|---|---|
| `agr.joaquim` | 914 000 101 | Quinta do Casal Novo |
| `agr.duarte` | 914 000 102 | Pomar dos Duarte |
| `agr.pereira` | 914 000 103 | Horta da Ribeira |
| `agr.antonio` | 914 000 104 | Terras da Gândara |
| `agr.ines` | 914 000 105 | Horta Viva |
| `agr.luis` | 914 000 106 | Quinta da Várzea |
| `agr.rui` | 914 000 107 | Bagas do Vouga |
| `agr.teresa` | 914 000 108 | Casal das Hortas |
| `agr.carlos` | 914 000 109 | Quinta do Vale Tejo |
| `agr.ana` | 914 000 110 | Pomar da Gardunha |
| `agr.jose` | 914 000 111 | Quinta da Esmolfe |
| `agr.maria` | 914 000 112 | Monte da Vinha |
| `agr.paulo` | 914 000 113 | Pomar do Arade |
| `agr.helena` | 914 000 114 | Souto da Lombada |
| `agr.freitas` | 914 000 115 | Fajã do Sol |
| `rest.mesa-da-ria` | 234 000 101 | Mesa da Ria |
| `rest.tasca-da-horta` | 234 000 102 | Tasca da Horta |
| `rest.moliceiro-verde` | 234 000 103 | Moliceiro Verde |
| `rest.sal-e-campo` | 234 000 104 | Sal & Campo |
| `rest.fonte-nova` | 234 000 105 | Bistrô Fonte Nova |
| `rest.cantina-do-parque` | 234 000 106 | Cantina do Parque |
| `rest.cafe-campus` | 234 000 107 | Café Campus |
| `rest.estacao-74` | 234 000 108 | Estação 74 |

As contas de demonstração estão definidas em `seedAccounts()` (`js/auth.js`). Com a base de dados são criadas pelo `supabase/03-contas.sql` (gerado a partir dessa lista).

Sem base de dados, para voltar ao estado inicial: conta `gestao` → separador **Guardar alterações** → *Repor contas, encomendas e pedidos de demonstração* (e/ou *Desfazer as alterações ao catálogo*). Com base de dados, corra outra vez os três ficheiros SQL (secção 2.2).

## 5. Mapa dos ficheiros

```
index.html                  página inicial (só a "casca", ver secção 6)
produtos/  produtos/<id>/   loja e página de cada produto e caixa
subscricao/  subscricao/<caixa>/   subscrições e configuração de cada caixa
agricultores/  agricultores/<id>/  mapa de quintas e página de cada agricultor
restaurantes/ colhe-connosco/ sobre/ contacto/ faq/ politicas/
entrar/ conta/ finalizar/ parceiro/
css/styles.css              todos os estilos
img/                        logótipos, favicon
img/produtos/<id>.svg       ícone de cada produto (pode editar ou substituir)
docs/analises/<id>.pdf      boletim de análises de cada produto
js/                         ver tabela abaixo
ferramentas/                scripts para gerar páginas, ícones, análises e o SQL da base de dados
app/index.html              a app para telemóvel (secção 23); app/manifest.webmanifest, app/sw.js, app/icones/
css/app.css                 estilos só da app (tudo começa por body.app)
supabase/                   01-estrutura.sql … 09-loja-e-inventario.sql (secção 2)
supabase/funcoes/notificar/index.ts   função do Supabase que envia as notificações (Firebase)
LEIA-ME.md                  este ficheiro
```

Os ficheiros JavaScript carregam **por esta ordem** (definida em `ferramentas/gerar-paginas.py`, lista `SCRIPTS`). Cada um pode usar o que os anteriores definem.

| Ficheiro | O que contém |
|---|---|
| `js/art.js` | Desenhos em SVG: frutas e legumes (`ART`), caixas (`crateSVG`), quintas (`farmSVG`), mapa de Portugal (`portugalMapSVG`), mapa de Aveiro (`aveiroMapSVG`), selo (`sealSVG`), ícones da interface (`IC` e `icon(nome, tamanho)`) |
| `js/data.js` | Catálogo de base: regiões, agricultores, produtos, caixas e tamanhos, distribuição, pontos de recolha, dias Colhe Connosco, restaurantes, perguntas frequentes, grupos e dicas |
| `js/alteracoes.js` | `SAVED_CHANGES`: alterações permanentes exportadas da conta de gestão (secção 11) |
| `js/catalogo.js` | Aplica `SAVED_CHANGES` e as alterações locais da gestão por cima de `data.js`; exportação do ficheiro |
| `js/analises.js` | `ANALYSES`: resumo das análises de cada produto (gerado por `ferramentas/gerar-analises.py`) |
| `js/supabase-config.js` | Endereço e chave pública do Supabase (vazio = sem base de dados) |
| `js/nuvem.js` | Ligação à base de dados: ler, gravar só o que mudou, entrar e criar conta, tempo real (secção 2.7) |
| `js/auth.js` | Contas de demonstração, contas e sessão (no modo local: SHA-256 com sal), datas de entrega, encomendas, pedidos, subscrições; escolhe entre o modo local e a base de dados |
| `js/app.js` | Núcleo: línguas, links, cabeçalho e rodapé, cartões de produto, carrinho, modais, avisos, formulários, eventos, `render()` |
| `js/pages-loja.js` | Páginas Início, Produtos, Produto, Subscrição, Subscrever, Finalizar encomenda |
| `js/pages-info.js` | Agricultores, Agricultor, Restaurantes, Colhe Connosco, Sobre nós, Contacto (gerir/seguir encomenda, incidências), FAQ, Políticas |
| `js/pages-conta.js` | Entrar / Criar conta (cliente, agricultor, restaurante) e A minha conta |
| `js/pages-gestao.js` | Painel da conta de gestão (aparece dentro de `/conta`) |
| `js/pages-parceiro.js` | Área de parceiro (`/parceiro`) para agricultores e restaurantes |
| `js/app-config.js` | Só na app: endereço público do site (para abrir os PDF) e se as notificações estão ligadas. Na app Android este ficheiro é gerado pelo `npm run preparar` |
| `js/app-nativo.js` | Só na app Android: câmara, localização, notificações, botão "voltar", ecrã de arranque e barras do sistema (Capacitor). No navegador não faz nada |
| `js/app-movel.js` | Só na app: rotas `#/…`, separadores por tipo de conta, ecrãs próprios (Início, Loja, Mapa, Conta, encomenda com "deslizar para confirmar", incidência com fotografia) e reaproveitamento das páginas do site |

## 6. Como uma página é desenhada

Cada `index.html` é uma casca igual às outras. Só muda o `<body>`:

```html
<body data-page="produto" data-id="pera-rocha" data-root="../../">
```

- `data-page`: que página desenhar. Corresponde a uma função `PAGES.<nome>` num dos `js/pages-*.js`.
- `data-id`: o produto, agricultor ou caixa (páginas de detalhe).
- `data-root`: caminho até à raiz do site, para encontrar `css/`, `js/` e `img/`.

Quando a página abre, `render()` (em `app.js`) chama `PAGES[PAGE]()`, que devolve `{ title, html, after }`, e escreve cabeçalho + `html` + rodapé dentro de `<div id="app">`. Mudar de língua ou mudar dados chama `render()` outra vez.

**Não edite os `index.html` à mão**: são gerados por `python3 ferramentas/gerar-paginas.py`. Corra-o sempre que acrescentar um produto, agricultor ou caixa em `data.js`, ou uma página nova.

**Links**: use sempre `href('produtos')`, `href('produtos/kiwi')`, `href('conta', 'sec=encomendas')`. A função calcula o caminho relativo e acrescenta `/index.html` quando o site é aberto com duplo clique. Para produtos e agricultores use `productHref(p)` e `farmerHref(f)`.

**Produtos, quintas e restaurantes criados na conta de gestão** não têm pasta própria. Abrem em `/produtos?id=<id>` e `/agricultores?id=<id>` (o JavaScript percebe pelo `?id=`). Se um dia os passar para `data.js`, corra o gerador e passam a ter endereço próprio.

**Eventos**: os cliques, alterações, escrita e envio de formulários são tratados num só sítio (`app.js`). Cada ficheiro de páginas acrescenta as suas funções a `PAGE_EVENTS.click`, `.change`, `.input` ou `.submit`. Uma função de clique recebe `(evento, elemento, elemento.dataset)` e devolve `true` quando tratou o clique. Os botões usam atributos `data-*` (ex.: `<button data-approve="P-1004">` → `d.approve`).

**Atualizar sem perder a posição**: `rerenderKeep('#seletor')` volta a desenhar a página, mantém o scroll e põe o foco no elemento indicado.

**Página nova** (ex.: `/receitas`):
1. Em `ferramentas/gerar-paginas.py`, acrescente `('receitas', 'receitas', 'Receitas')` à lista `pages`.
2. Num `js/pages-*.js`, crie `PAGES.receitas = () => ({ title: T('Receitas', 'Recipes'), html: \`...\` });`.
3. Acrescente o link ao menu em `header()` / `footer()` de `app.js` com `href('receitas')`.
4. Corra `python3 ferramentas/gerar-paginas.py`.

## 7. Português e inglês

Tudo o que aparece no ecrã tem as duas línguas:

- Texto fixo: `T('Texto em português', 'Text in English')`.
- Dados com duas línguas: objetos `{ pt: '...', en: '...' }`, mostrados com `L(objeto)`. Ex.: `L(p.name)`.
- A língua escolhida fica em `localStorage` (`daqui-lang`) e a variável `lang` vale `'pt'` ou `'en'`.
- Datas e preços: `fdate(data, opções)` e `money(valor)` formatam conforme a língua.

Regra para alterações: **nunca escreva texto visível sem `T()` ou `L()`**. Nos dados que os utilizadores preenchem (nomes, mensagens) o texto fica como foi escrito. Nos pedidos guardam-se códigos (`area: '1-5'`, `action: 'cancel'`) que são traduzidos ao mostrar (secção 14). Nos formulários da gestão e da área de parceiro há sempre dois campos, português e inglês.

Para verificar: mude para EN e percorra a página; qualquer frase em português que não seja um nome próprio é um `T()` em falta.

## 8. Dados do catálogo (js/data.js)

### Produtos

Cada produto é uma linha `prod(...)`:

```js
prod('pera-rocha','fruta','Pera Rocha do Oeste','Rocha pear from the Oeste',1.89,'kg','joaquim','pera',[8,5],'08-27','e','Sumarenta, doce e de polpa firme.','Juicy, sweet and firm.');
//    id          cat     nome PT              nome EN                     preço unid. agricultor desenho época  colheita marcas descrição PT                     descrição EN
```

| Campo | Valores |
|---|---|
| `id` | único, minúsculas e hífens; é o nome da pasta, do ícone e do PDF |
| `cat` | `'fruta'` ou `'legumes'` (as caixas estão em `BOXES`) |
| `preço` | em euros, por unidade |
| `unidade` | `'kg'`, `'un'` (unidade), `'molho'`, `'cuv'` (cuvete) |
| `agricultor` | `id` de um agricultor de `FARMERS` |
| `desenho` | chave de `ART` em `art.js`, usada para o ícone e para os desenhos de quintas |
| `época` | `[mês de início, mês de fim]`; pode passar o fim do ano (`[8,5]` = agosto a maio) |
| `colheita` | data `'MM-DD'` da última colheita (aparece na ficha e na análise) |
| `marcas` | `'e'` = essencial (entra na Caixa Essencial), `'b'` = biológico, `'eb'` = ambos, `''` = nenhum |

Fora da época, o produto mostra "Fora de época" e não se pode comprar. Com `outOfStock: true` (posto pela gestão ou pelo agricultor) mostra "Fora de stock".

A divisão do preço (agricultor / conservação e embalamento / Daqui) é calculada em `splitOf(p)` (`app.js`): por omissão 60/10/30, 54/22/24 para produtos que passam por câmara frigorífica, 52/18/30 na Madeira. Se o produto tiver `split: [a, b, c]` (definido na gestão), usa esse.

Outras tabelas no mesmo ficheiro:

- `GROUP_OF` e `GROUP_TIPS`: em que grupo está cada produto (citrinos, folhas, raízes...) e as dicas de conservação mostradas na ficha. Produtos sem grupo usam as dicas gerais de fruta ou legumes.
- `REGIONS` e `REGION_CENTER`: regiões do mapa e o seu centro (para quintas novas).
- `FARMERS`: `{ id, name, farm, place, region, lat, lon, since, crop, seed, story:{pt,en} }`. `lat`/`lon` põem o pin no mapa; `crop` e `seed` escolhem o desenho da quinta.
- `BOXES` e `BOX_SIZES`: as quatro caixas e os preços de cada tamanho (`P`, `M`, `G`).
- `DELIVERY_FEE`, `DISTRIBUTION` (dias, horas-limite, janelas e zona de entrega) e `PICKUP_POINTS`.
- `HARVEST_DAYS`: dias Colhe Connosco `{ date:'AAAA-MM-DD', farmer, crop, what:{pt,en}, time, spots }`.
- `RESTAURANTS`: `{ id, name, lat, lon, kind:{pt,en}, area:{pt,en}, dish:{pt,en}, since:'AAAA-MM', dishes:[{pt,en}] }`.
- `FAQ`: perguntas `{ k, cat, q:{pt,en}, a:{pt,en} }`.

## 9. Ícones e boletins de análises

**Ícones**: cada produto usa `img/produtos/<id>.svg` (`artFor(p)` em `app.js`). Pode abrir o ficheiro no VS Code ou num editor como o Inkscape e alterá-lo, ou substituí-lo por outro SVG com o mesmo nome (de preferência quadrado, `viewBox="0 0 120 120"`). Produtos criados na gestão podem usar o ícone de outro produto ou o provisório `_novo.svg`; o campo `icon` diz que ficheiro usar.

- `node ferramentas/exportar-icones.js` desenha os ícones que faltam a partir de `ART` (em `art.js`).
- `node ferramentas/exportar-icones.js pimento-amarelo` volta a desenhar só esse produto.
- `--todos` volta a desenhar todos e **apaga as suas edições**.
- Se não houver desenho, `gerar-paginas.py` copia `_novo.svg` para o produto e avisa.

Para usar PNG ou JPG em vez de SVG, mude a extensão em `artFor()` (`app.js`) e ponha os ficheiros com o mesmo nome.

**Análises**: a separador "Análises" da ficha de produto mostra o resumo de `ANALYSES[id]` (`js/analises.js`) e o link para `docs/analises/<id>.pdf`. Os dois são gerados por `python3 ferramentas/gerar-analises.py` (precisa de `pip install reportlab`). Para usar boletins reais, ponha os PDF com o mesmo nome e edite os valores em `analises.js`. Produtos criados na gestão não têm boletim e a ficha diz isso.

## 10. Conta de gestão

Entre como `gestao` / `gestao2026` e abra **A minha conta**. O painel tem oito separadores (também por endereço: `/conta?tab=catalogo`):

| Separador | O que permite |
|---|---|
| **Pedidos e avisos** | Todos os pedidos do site (secção 14), filtráveis por tipo. Marcar como tratado ou reabrir. Pedidos de parceiros com conta têm botão **Aprovar**: quinta passa a aparecer no mapa, restaurante recebe o selo e aparece no mapa de Aveiro, produto proposto é publicado na loja, dia Colhe Connosco proposto é criado. |
| **Encomendas** | Todas as encomendas. Nas encomendas com caixas aparecem as preferências do cliente: produtos a **não incluir** e favoritos. O estado é *Automático* (muda com a data de entrega) ou escolhido à mão: Recebida, Em preparação, Em distribuição / Pronta para levantar, Entregue / Levantada, Cancelada. O cliente vê o estado no seguimento e no histórico. |
| **Catálogo** | Por produto: preço, meses de início e fim da época, divisão do preço em % (tem de somar 100), "Fora de stock". Procurar e filtrar (fruta, legumes, alterados, fora de stock). **Adicionar produto novo** com nomes e descrições em PT e EN, categoria, agricultor, preço, unidade, época, ícone, essencial, biológico. Produtos novos podem ser apagados. |
| **Caixas e preços** | Preço de cada tamanho de cada caixa e, por baixo, cada subscritor com o preço guardado, o preço atual e o que paga. Serve para testar o preço garantido (secção 15). |
| **Colhe Connosco** | Mudar o número máximo de participantes de cada dia (nunca abaixo dos inscritos), ver quem está inscrito, apagar dias, **adicionar dia**: data, horário, quinta parceira, produto dessa quinta, máximo de participantes. |
| **Subscrições** | Todas as subscrições de todos os clientes, com os produtos que cada um não quer receber e os favoritos. |
| **Contas** | Todas as contas (clientes, agricultores, restaurantes, gestão), com contactos, aprovação dos parceiros e atividade (encomendas, subscrições, inscrições). |
| **Guardar alterações** | Sem base de dados: descarregar `alteracoes.js` (secção 11), desfazer as alterações ao catálogo, repor os dados de demonstração. Com base de dados: tudo já fica guardado; aqui só se descarrega o `alteracoes.js` com o catálogo atual para a versão sem base de dados (OnionShare). |

O código está em `js/pages-gestao.js`: uma função por separador (`tabPedidos`, `tabEncomendas`, `tabCatalogo`, `tabCaixas`, `tabColhe`, `tabSubs`, `tabContas`, `tabExportar`), `approveRequest(r)` para as aprovações e, no fim, os eventos. Para acrescentar um separador: junte a chave a `ADMIN_TABS`, o nome em `names` e a função em `body` dentro de `adminPanel()`.

## 11. As alterações da gestão ficam no código?

**Com a base de dados Supabase ligada (secção 2): sim.** Tudo o que a gestão muda é gravado logo na base de dados e aparece para toda a gente, em todos os dispositivos. O resto desta secção é para o modo sem base de dados.

**Sem base de dados: não, não automaticamente.** Um site estático não consegue escrever nos seus próprios ficheiros. O que a gestão muda fica guardado no `localStorage` **deste navegador** (chave `daqui-catalog`) e é aplicado por cima de `data.js` sempre que o site abre nesse navegador. Noutro navegador, noutro computador ou para quem receber a pasta (OnionShare), as alterações não existem.

**Para as tornar permanentes:**

1. Conta de gestão → **Guardar alterações** → **Descarregar alteracoes.js**.
2. Substitua `js/alteracoes.js` da pasta do site pelo ficheiro descarregado.
3. Pronto: a partir daí as alterações fazem parte do site para toda a gente. O contador do separador volta a 0.

Entram no ficheiro: preços, épocas, stock, divisão do preço, produtos novos, preços das caixas, dias Colhe Connosco, quintas e restaurantes aprovados e os perfis editados pelos parceiros. **Não entram** contas, encomendas e pedidos: são dados dos utilizadores e precisariam de um servidor.

Ordem de aplicação (em `js/catalogo.js`): `data.js` → `SAVED_CHANGES` (`alteracoes.js`) → alterações locais. Formato:

```js
const SAVED_CHANGES = {
  products:    { "kiwi": { "price": 2.6, "season": [10, 5], "split": [62, 10, 28], "outOfStock": true } },
  newProducts: [ { "id": "tomate-rosa", "cat": "legumes", "name": {"pt": "Tomate rosa", "en": "Pink tomato"}, "price": 3.4,
                   "unit": "kg", "farmer": "antonio", "icon": "tomate", "season": [6, 10], "harvest": 2,
                   "essential": false, "organic": false, "desc": {"pt": "...", "en": "..."} } ],
  boxes:       { "caixa-mista": { "P": 11.9, "G": 22.5 } },
  harvestDays: [ /* lista completa de dias; substitui HARVEST_DAYS */ ],
  farmers:     { "joaquim": { "story": {"pt": "...", "en": "..."} } },
  newFarmers:  [ /* quintas aprovadas */ ],
  restaurants: { "mesa-da-ria": { "dish": {"pt": "...", "en": "..."}, "dishes": [{"pt": "...", "en": "..."}] } },
  newRestaurants: [ /* restaurantes aprovados */ ]
};
```

Também pode editar este ficheiro à mão. Se preferir que uma alteração fique no catálogo de base, passe-a para `data.js` e retire-a de `alteracoes.js`.

## 12. Contas de agricultor e de restaurante

**Registo**: em `/entrar` → *Criar conta*, escolha o tipo de conta (Cliente, Agricultor, Restaurante). Também por endereço: `/entrar?modo=registo&tipo=agricultor`.

- Agricultor: nome da quinta, localidade, região, o que produz. Cria um pedido "Adesão de agricultor".
- Restaurante: nome do restaurante, localidade, tipo de cozinha. Cria um "Pedido de Selo Daqui".

A conta fica `partner.approved = false` até a gestão aprovar o pedido (com a base de dados, só a gestão pode mudar este valor). As quintas e os restaurantes que já existem têm contas prontas (secção 4). Depois de entrar, o parceiro vai para `/parceiro` (o link do cabeçalho também).

**Área do agricultor** (`/parceiro`): editar o perfil da quinta e a história em PT e EN (publicado logo, se aprovado); ver os seus produtos e marcá-los como fora de stock ou repor; propor produtos novos; ver os seus dias Colhe Connosco e propor dias novos; pedir armazenamento em frio. Propostas vão para os pedidos da gestão e mostram o estado (Em análise, Analisado, Aprovado).

**Área do restaurante**: estado do Selo Daqui; tipo de cozinha, zona e prato da semana em PT e EN (aparecem no mapa de restaurantes); lista de pratos com produtos Daqui; atalhos para a loja e para o histórico de encomendas. Antes da aprovação o perfil fica guardado como rascunho e é publicado quando a gestão aprova.

Dados da conta: `user.role` (`'cliente'`, `'agricultor'`, `'restaurante'`, `'admin'`) e `user.partner` (`{ kind, farm, place, region, farmerId, approved }` ou `{ kind, name, place, kind2, restId, approved }`). `farmerId` / `restId` ligam a conta à quinta ou ao restaurante publicado.

## 13. Encomendas, entregas e seguimento

- A Daqui distribui à **quinta-feira** e ao **sábado**. Encomendas para quinta-feira até terça às 18h, para sábado até quinta às 18h (`DISTRIBUTION` em `data.js`; datas calculadas em `slotOptions()` de `auth.js`).
- Entrega em casa (janelas `9h–13h` ou `17h–21h`, taxa `DELIVERY_FEE`) ou levantamento num ponto de recolha.
- Na entrega em casa, a morada é pedida sempre, a não ser que a conta já tenha uma morada guardada.
- Cada encomenda recebe um número `DQ` + 6 algarismos (`newOrderNumber()`).
- Estado (`orderStage(o)`): 0 Recebida, 1 Em preparação (a partir da véspera), 2 Em distribuição / Pronta para levantar (no dia), 3 Entregue / Levantada (depois das 21h), 4 Cancelada. Se a gestão escolher um estado à mão, fica em `o.stage` e tem prioridade.
- Em **Contacto**: *Gerir encomenda* (mudar a data ou cancelar, até à hora-limite), *Seguir entrega* e *Comunicar incidência*. Pedem o número e o telemóvel da encomenda. Tudo fica registado nos pedidos da gestão.
- Na conta do cliente: histórico de compras, seguimento e repetir encomenda.

## 14. Pedidos que chegam à gestão

Todos os formulários criam um pedido com `addRequest(tipo, campos, extra)` (`auth.js`), guardado em `daqui-requests` ou, com base de dados, na tabela `pedidos` (aí a referência é do tipo `P-MHZ3K2A`, para não haver números repetidos entre dispositivos):

```js
{ id: 'P-1017', type: 'produto', created: '2026-11-15T10:00:00Z', status: 'novo' | 'tratado',
  user: 'agr.joaquim' | null, partnerUser: 'agr.joaquim', approved: true, fields: { namePt: '...', price: '2.20', season: '8-4' } }
```

Tipos (`REQ_TYPES` em `pages-gestao.js`): `selo`, `agricultor`, `produto`, `colhe`, `frio`, `gerir`, `seguimento`, `incidencia`, `contacto`, `fundador`.

Os campos guardam **códigos**, não frases, para poderem aparecer em PT ou EN. Os nomes dos campos estão em `REQ_LABELS()` e os valores são traduzidos por `reqValue(chave, valor)` (ambos em `app.js`). Nos formulários simples (`<form data-form="...">`), `FORM_KEYS` diz que campo HTML corresponde a que chave.

Para um campo novo num formulário: acrescente o campo ao HTML, a entrada em `FORM_KEYS` (id do campo → chave), o rótulo em `REQ_LABELS()` e, se o valor for um código, a tradução em `reqValue()`.

## 15. Subscrições e preço garantido

- Ao subscrever (`/subscricao/<caixa>`), escolhe-se tamanho, frequência (semanal, quinzenal, mensal), dia, entrega e pagamento. A Caixa Essencial leva só produtos marcados com `e`.
- **Favoritos e produtos que não quer receber** escolhem-se na conta (*A minha conta* → *Favoritos e exclusões*), sem limite, e valem para todas as caixas: subscrições e caixas compradas uma vez. Ficam em `user.favs` e `user.exclude` (colunas `favoritos` e `excluidos` de `perfis`). A página da subscrição e o checkout mostram-nos com um atalho para os mudar. Cada encomenda com caixas guarda uma cópia em `order.prefs`, que a gestão vê no separador Encomendas.
- O preço do dia em que se subscreve fica **guardado durante 12 meses** (`sub.locked`). Se o preço da caixa subir, o subscritor continua a pagar o guardado. Se descer, passa a pagar o mais baixo e esse fica guardado. Ao fim de 12 meses, o preço guardado passa a ser o do dia.
- A regra está em `refreshSub(sub)` (`auth.js`). Para testar: conta de gestão → **Caixas e preços** → suba ou desça um preço e veja a coluna "Paga por caixa" e a conta do cliente (`maria`, `joao`).

## 16. O que fica guardado no navegador

| Chave do localStorage | Conteúdo |
|---|---|
| `daqui-lang` | língua (`"pt"` / `"en"`) |
| `daqui-users` | todas as contas (nome, telemóvel, sal e hash da palavra-passe, morada, subscrições, inscrições, favoritos, avisos, parceiro) |
| `daqui-session` | utilizador com sessão iniciada |
| `daqui-cart`, `daqui-deliver` | carrinho e tipo de entrega |
| `daqui-orders` | encomendas |
| `daqui-requests` | pedidos para a gestão |
| `daqui-pending-sub`, `daqui-last-order` | passos intermédios da subscrição e do checkout |
| `daqui-catalog` | alterações ao catálogo feitas na gestão (secção 11) |
| `daqui-nuvem-sessao` | com base de dados: a sessão do Supabase (tokens de acesso) |
| `daqui-encomendas-visitante` | com base de dados: números das encomendas feitas sem conta neste navegador, para as mostrar e seguir |

Com a base de dados ligada, contas, encomendas, pedidos e catálogo **não** ficam no navegador: são lidos do Supabase em cada página (as chaves `daqui-users`, `daqui-orders`, `daqui-requests` e `daqui-catalog` só são usadas no modo local).

Para limpar tudo: ferramentas do programador do navegador (F12) → *Application* → *Local Storage* → apagar, ou usar os botões do separador **Guardar alterações**.

## 17. Estilos, cores e mapas

**Cores** (início de `css/styles.css`):

```css
--campo:#3C6104;  /* verde do logótipo: botões, cabeçalho */
--pera:#F2C663;   /* dourado do logótipo: destaques, texto sobre verde */
--folha:#22380A;  /* texto principal e rodapé */
--paper:#FFFDF6;  /* fundo */
--sage:#EFF2DF;   /* fundos de cartões e painéis */
--tomato:#B5432C; /* erros, cancelar, fora de stock */
```

Mudar uma cor nestas variáveis muda-a em todo o site. Os tipos de letra são Marcellus (títulos) e Atkinson Hyperlegible (texto), com alternativas do sistema quando não há internet.

Classes mais usadas: `.wrap` (largura da página), `.btn` + `.btn-green` / `.btn-line` / `.btn-sm`, `.panel`, `.acc-sec` (secções da conta), `.form` / `.field` / `.row`, `.note` / `.note.done`, `.badge` (`.bio`, `.sub`, `.off`, `.nostock`), `.tbl`, `.chips`, `.modal`, `.toast`. As regras das versões mais recentes estão no fim do ficheiro.

**Mapas**: são SVG desenhados em `art.js`, sem serviços externos.
- `portugalMapSVG(agricultores, lang, ativo)`: converte `lat`/`lon` em pontos com `ptXY()`.
- `aveiroMapSVG(marcadores, lang, ativo, opções)`: ruas, canais e ria de Aveiro; `avXY()` converte coordenadas (área aprox. lat 40.626–40.652, lon −8.672 a −8.632). Os restaurantes novos aprovados pela gestão são colocados no centro.

## 18. Ferramentas

Corra a partir da pasta do site:

| Comando | Para quê |
|---|---|
| `python3 ferramentas/gerar-paginas.py` | Cria/atualiza os `index.html` de todas as páginas, produtos, agricultores e caixas; cria ícones provisórios em falta e avisa de PDF em falta |
| `node ferramentas/exportar-icones.js` | Desenha os ícones de produto em falta a partir de `art.js` |
| `python3 ferramentas/gerar-analises.py` | Gera os PDF de análises e `js/analises.js` (precisa de `reportlab`) |
| `node ferramentas/gerar-sql.js` | Gera `supabase/02-catalogo.sql` e `supabase/03-contas.sql` a partir de `data.js`, `alteracoes.js` e das contas de `auth.js` |

## 19. Partilhar com o OnionShare

1. OnionShare → separador **Alojar um site** (*Host a website*).
2. Arraste **o conteúdo da pasta** (o `index.html` tem de ficar na raiz, não dentro de outra pasta).
3. Inicie a partilha e envie o endereço `.onion` (abre no Tor Browser).

O site já cumpre a política de segurança do OnionShare: não há scripts dentro do HTML e os estilos escritos pelo JavaScript são reaplicados de forma permitida (`applyInlineStyles` no fim de `app.js`). As letras do Google não carregam no Tor e são usadas as alternativas. A consola mostra avisos "violates the following Content Security Policy": são esperados e não afetam o site.

O OnionShare não deixa o site ligar-se a outros endereços, por isso a base de dados não funciona lá: o site mostra o aviso "Sem ligação à base de dados" e usa os dados do navegador. Cada visitante tem o seu próprio `localStorage`. Para que a versão OnionShare mostre o catálogo atual, descarregue `alteracoes.js` no painel da gestão (separador *Guardar alterações*) e substitua o da pasta antes de partilhar.

## 20. Receitas: alterações frequentes

**Mudar um texto**: procure a frase no VS Code (Ctrl+Shift+F) dentro de `js/` e altere as duas línguas do `T('...', '...')`.

**Mudar um preço para sempre**: em `data.js`, na linha `prod(...)` (ou em `BOX_SIZES` para caixas). Ou na gestão e depois exportar `alteracoes.js`.

**Acrescentar um produto ao catálogo de base**:
1. Nova linha `prod(...)` em `data.js` na secção certa (fruta antes de `/* legumes */`, legumes antes de `/* caixas`).
2. Opcional: acrescente-o a `GROUP_OF` para ter as dicas certas.
3. Ícone: ponha `img/produtos/<id>.svg` ou corra `node ferramentas/exportar-icones.js` (usa o desenho indicado).
4. Opcional: `python3 ferramentas/gerar-analises.py` para o boletim.
5. `python3 ferramentas/gerar-paginas.py` para criar `/produtos/<id>`.

**Acrescentar um agricultor**: novo objeto em `FARMERS` com `lat`/`lon` aproximados da quinta, e depois `gerar-paginas.py`.

**Acrescentar um restaurante**: novo objeto em `RESTAURANTS` com coordenadas dentro do centro de Aveiro.

**Acrescentar um dia Colhe Connosco**: objeto em `HARVEST_DAYS` ou pelo separador Colhe Connosco da gestão.

**Nova pergunta frequente**: objeto em `FAQ` com `q` e `a` em PT e EN.

**Mudar dias ou horas de entrega**: `DISTRIBUTION` em `data.js` (dia da semana: 0 = domingo; `cutoff: [dia, hora]`).

## 21. Testar e resolver problemas

- Abra a consola (F12 → *Console*). Um erro vermelho diz o ficheiro e a linha.
- Depois de editar um `.js`, teste a sintaxe com `node --check js/ficheiro.js`.
- **Página em branco**: quase sempre um erro de sintaxe (vírgula ou acento grave em falta numa template string) num dos `js/`.
- **Mudei `data.js` e não aparece**: confirme que não há uma alteração em `alteracoes.js` ou no `localStorage` (`daqui-catalog`) a sobrepor-se. Use *Desfazer as alterações ao catálogo*.
- **Produto novo dá "página não encontrada"**: falta correr `gerar-paginas.py`.
- **Ícone não aparece**: o nome do ficheiro tem de ser igual ao `id` (ou ao campo `icon`).
- **Os dados ficaram estranhos**: *Repor contas, encomendas e pedidos de demonstração*.
- Verifique sempre as duas línguas e o telemóvel (F12 → ícone de telemóvel).

**Com a base de dados**
- **Aviso "Sem ligação à base de dados"**: confirme `js/supabase-config.js` (endereço com `https://` e a chave pública completa), se o projeto está em pausa no Supabase (*Restore*), e a internet.
- **"A base de dados não tem produtos"**: falta correr `supabase/02-catalogo.sql`.
- **Não consigo entrar com as contas de demonstração**: falta correr `supabase/03-contas.sql`, ou o `01` foi corrido outra vez depois dele (corra o `02` e o `03` de novo). Se o `03` der erro ao criar contas, crie uma conta pelo site e dê-lhe acesso de gestão com o SQL da secção 2.6.
- **Criei conta mas diz para confirmar o e-mail**: desligue *Confirm email* (secção 2.3).
- **Não foi possível guardar na base de dados**: a mensagem diz o motivo (por exemplo, lugares esgotados no Colhe Connosco). A página volta a ler os dados para mostrar o estado verdadeiro.
- **O painel diz "atualiza a cada 30 s" em vez de "tempo real"**: o tempo real não ligou (rede da faculdade, por exemplo). O site continua a funcionar e atualiza sozinho de 30 em 30 segundos.
- Para ver o que o site pede à base de dados: F12 → *Network* → filtre por `supabase`. Os erros aparecem na *Console* com `[Daqui/Supabase]`.

## 22. Limites desta demonstração

- Sem a base de dados, contas, encomendas e pedidos vivem num só navegador. Com o Supabase ficam online, mas continua a ser uma demonstração: não há pagamentos reais nem envio de e-mails ou SMS.
- No modo local, as palavras-passe têm hash com sal, mas qualquer pessoa com acesso ao navegador pode ver os dados. Com o Supabase, as palavras-passe são guardadas pelo Supabase Auth. Mesmo assim, não use palavras-passe verdadeiras numa demonstração.
- Pagamentos, mensagens e notificações são simulados.

## 23. App para telemóvel

A app está em `app/index.html` e usa **os mesmos ficheiros** `js/` e `css/styles.css` do site, mais `css/app.css`, `js/app-config.js`, `js/app-nativo.js` e `js/app-movel.js`. Tudo o que muda no site (produtos, preços, textos, base de dados) muda também na app.

- **Separadores**: cliente e visitante: Início, Loja, Mapa, Conta (o cabaz é o botão redondo). Agricultor: Produtos, Colhe, Propostas, Conta. Restaurante: Perfil, Pratos, Loja, Conta. Gestão: Pedidos, Encomendas, Catálogo, Mais.
- **Primeira abertura**: escolha da língua e três ecrãs de boas-vindas (para os voltar a ver: apagar `daqui-app-boas-vindas` do `localStorage`).
- **Levantamento**: numa encomenda com levantamento, no dia (ou quando a gestão a marca como pronta), o cliente desliza o botão e a encomenda passa a "Levantada" (também no painel da gestão).
- **Incidências com fotografia**: com a base de dados ligada, a fotografia vai para o Storage do Supabase (`04-app.sql`) e aparece no painel da gestão.
- **No navegador**: abra `<endereço do site>/app/` no telemóvel; no Chrome, menu ⋮ → *Adicionar ao ecrã principal* instala-a como app (sem câmara nativa nem notificações; a fotografia usa o seletor de ficheiros).
- **Como app Android**: projeto `daqui-android` (Capacitor). Os passos estão no `LEIA-ME-APP.md` desse projeto.
- **Gerar a página**: `app/index.html` é escrita por `python3 ferramentas/gerar-paginas.py`, como as outras páginas (lista `APP_SCRIPTS`).

## 24. Versão 7: o que mudou

Base de dados: corra `supabase/06-melhorias.sql` (uma vez; pode repetir). Sem ele, a versão 7 não grava produtos, mensagens nem avaliações.

- **Pedidos de parceiros** (adesão de agricultor, Selo Daqui, produtos, dias Colhe Connosco): no painel da gestão há **Aprovar e publicar**, **Rejeitar** e **Marcar como tratado**, com uma mensagem opcional. O parceiro vê a decisão e a mensagem na sua área e recebe uma notificação no telemóvel. Um parceiro rejeitado pode pedir nova análise.
- **Produtos com vários produtores**: o agricultor escolhe um produto que já existe (indicando se o dele é biológico) e só propõe preço para produtos novos. Cada produto mostra quem o produz; o cliente não escolhe o agricultor. O stock é de cada produtor: o produto só esgota quando todos estão sem stock.
- **Convencional ou biológico**: quando há os dois, o cliente escolhe na página do produto; o biológico custa mais 20% (`BIO_EXTRA` em `js/app.js`). O preço guardado é o do convencional (num produto só biológico é o do biológico).
- **Produtos repetidos**: o catálogo da gestão mostra os produtos com o mesmo nome (sem contar "biológico") e junta-os com um botão. O endereço antigo continua a abrir, e favoritos, exclusões e avisos passam para o produto que fica. O ficheiro 06 junta automaticamente os que tiverem exatamente o mesmo nome.
- **Quantidades ao meio quilo**: os produtos ao quilo encomendam-se de 0,5 em 0,5 kg (`KG_STEP`).
- **Colhe Connosco**: o agricultor edita os seus dias (data, horário, lugares, produto) até começarem, e os inscritos são avisados. Os dias que já começaram aparecem em "Colheitas passadas" (agricultor) e "A decorrer e colheitas passadas" (gestão). Os participantes avaliam de 1 a 5 estrelas e comentam desde o início do dia até 48 horas depois do fim. A gestão regista o que cada participante colheu, e o cliente vê o registo na sua conta.
- **Falar com a Daqui**: botão redondo no canto inferior direito do site e opção na Conta da app. Visitantes sem conta também podem escrever (indicam nome e contacto). A gestão responde no separador **Mensagens**.
- **App**: as contas de agricultor, restaurante e gestão têm agora as ligações para Termos de utilização, Privacidade, Cookies e Devoluções.
- **Correção**: em "Gerir encomenda" e "Seguir entrega", a janela já não volta a abrir sozinha depois de fechada.


## 25. Versão 8: o que mudou

- **Colhe Connosco com hora livre**: nos formulários da gestão (novo dia) e do agricultor (propor e editar dia) há agora dois campos, *Início* e *Fim*, em vez de uma lista de horários. O horário continua a ser gravado como texto (ex.: "9h45–12h15"), por isso a base de dados não muda.
- **Login sem contas de demonstração**: a página Entrar (site e app) já não mostra a lista de contas nem as palavras-passe. As contas continuam a existir.
- **Alterar palavra-passe**: em *Dados da conta* (site: A minha conta → Dados; app: Conta → Dados e morada; gestão na app: Mais → Dados e palavra-passe) há "Alterar palavra-passe". Pede a palavra-passe atual, a nova (mínimo 8 caracteres) e a repetição. Com base de dados, a troca é feita no Supabase Auth; sem base de dados, fica guardada neste navegador.
- Ficheiros alterados: js/app.js, js/auth.js, js/nuvem.js, js/pages-conta.js, js/pages-gestao.js, js/pages-parceiro.js, js/app-movel.js, css/styles.css, app/index.html, app/sw.js, ferramentas/gerar-paginas.py. Sem SQL novo.


## 26. Versão 9: o que mudou

Base de dados: corra `supabase/07-colhe-e-produtos.sql` (depois do 06; pode repetir). Não volte a correr o 06 depois do 07.

| Ponto | O que mudou |
| --- | --- |
| Subscrição na app | Ao configurar uma subscrição, o tamanho, a frequência, o dia e a forma de receber já mudam (antes voltavam ao início em cada toque). |
| Colhe Connosco | Pode haver vários dias na mesma data, em quintas diferentes (a mesma quinta só tem um dia por data). Cada dia tem um id; as inscrições ficam ligadas ao dia. |
| Produtos | O agricultor pode "Deixar de vender" um produto. Sem nenhum produtor, o produto fica sem stock. A página do produto mostra um cartão por agricultor. |
| Filtros na app | Botão "Filtros" na loja: categoria, disponibilidade, modo de produção, região e preço (desde/até). O site também passou a ter preço desde/até. |
| IVA | Junto à divisão do preço: a divisão é do valor sem IVA; os preços mostrados já incluem IVA (6%). |
| Informação do produto | A app mostra o mesmo texto do site em Análises, Mais sobre o produto e Envio e entrega. |
| Registo de colheita | A gestão regista quilos e valor pago (sugerido: quilos × preço da loja). O registo tem um identificador (CC-aammdd-nnnn) e aparece nas encomendas do cliente. A avaliação só se envia uma vez. |
| Conta na app | Sem a lista de encomendas no topo. "Favoritos, exclusões e avisos" inclui "Avisar-me quando voltar" (com notificação quando o produto volta à época ou ao stock). |
| Produto novo | O agricultor escolhe o desenho ou carrega uma fotografia (vai para a pasta "produtos" do Storage). |
| Início da app | Desliza-se entre a próxima entrega e todas as subscrições, também as que estão em pausa. |
| A minha conta (site) | Separadores com ícone, texto centrado e o mesmo estilo dos botões. |


## 27. Versão 10: o que mudou

Base de dados: corra `supabase/08-avaliacoes-e-caixas.sql` (depois do 07; pode repetir).

| Ponto | O que mudou |
| --- | --- |
| Colhe Connosco | No fundo da página (site e app) aparecem os dias passados, com a avaliação média e os comentários (só o primeiro nome). A gestão responde a cada comentário nessa página ou no separador Colhe Connosco; o participante vê a resposta e recebe um aviso. |
| App: área do agricultor | "Marcar fora de stock" e "Deixar de vender" ficam lado a lado, numa linha própria. |
| App: catálogo da gestão | Cada produto num cartão que cabe no ecrã (o texto longo dos produtores já não empurra a página para o lado). |
| Caixas novas | Gestão → Caixas → "Criar uma caixa nova": nome, descrição, preço por tamanho e os produtos que a caixa pode levar (ex.: frutos secos, aromáticas, fruta exótica). Aparece na loja, nas subscrições e na app. Sem subscritores, pode ser apagada. |
| Ícones | Todos os `.svg` da pasta `img/produtos` aparecem para escolher (produto novo, proposta do agricultor e "Mudar a imagem" no catálogo, ao carregar no ícone). No site publicado, a lista vem do GitHub; na app, o `npm run atualizar` cria-a; também pode correr `node ferramentas/listar-icones.js`. |
| Regiões | Novas regiões: Minho, Porto e Douro, Região de Coimbra, Região de Leiria, Lisboa e Setúbal e Açores (com o seu quadro no mapa de Portugal). |
| Mapa de Aveiro | Os restaurantes e o ponto de recolha aparecem sobre um mapa real (OpenStreetMap, estilo CARTO). Sem internet, aparece o desenho antigo. |


## 28. Versão 11: o que mudou

Base de dados: corra `supabase/09-loja-e-inventario.sql` (depois do 08; pode repetir). Volte a publicar a função `notificar` (som próprio das notificações).
App Android: `npm install` (plugins novos: Filesystem e Share, para as faturas em PDF), `npm run configurar` (copia o som das notificações) e `npm run atualizar`.

| Ponto | O que mudou |
| --- | --- |
| Pedidos ao Supabase | Tudo é lido numa só ronda ao abrir o site e fica guardado no separador (`sessionStorage`). Ao mudar de página não há pedidos nem "A carregar…". Volta a ler só depois de gravar, quando o tempo real avisa, com F5 ou ao fim de 30 min. O chat usa o tempo real em vez de perguntar a cada 6 s. Os ficheiros do site levam `?v=<versão>`, por isso cada atualização aparece logo. |
| Guardar alterações | Na gestão (catálogo, caixas, parceiros) as alterações nos campos ficam por guardar; uma barra no fundo mostra quantas são e envia-as todas de uma vez (os preços de vários produtos vão num só pedido). |
| Gestão | Registo de colheita só no próprio dia do Colhe Connosco; história, região e "Agricultor desde" de cada quinta; "Selo desde" e tipo de cozinha de cada restaurante; peso, preço e número de tamanhos de cada caixa e os produtos que leva (ou "escolhidos entre os favoritos"), também nas 4 caixas da Daqui; catálogo alinhado; pedidos dos últimos 7 dias com filtro de datas; separadores novos: Preparar caixas, Inventário, Parceiros, Promoções e Definições (portes, quota, bloquear alterações às entregas). |
| Inventário | O agricultor regista "Entregas à Daqui": produto, quantidade, data de colheita, refrigeração, análise de laboratório e transporte (leva ele ou a Daqui recolhe numa data). O stock é a soma do que falta vender; encomendas e caixas tiram dos lotes mais antigos. Na loja aparece "Colheita mais recente" e, na página do produto, a data de cada agricultor. Duas pessoas a comprar o último quilo: a base de dados só deixa passar a primeira e a segunda vê quanto resta. |
| Preparar caixas | No dia antes da distribuição a gestão vê as caixas das subscrições com uma sugestão (favoritos, nunca o que o cliente não quer, stock, colheitas mais antigas, produtos a sair de época) e aceita ou muda. |
| Agricultores | Filtro por região na app; o pino passa para a frente ao passar o rato (ou a vinheta) e mostra um cartão ao fim de um momento; mapas acompanham a página; setas de "Outros agricultores" na app; o agricultor muda região, posição do pino (tocando no mapa), ano e foto de capa (desenhos ou fotografia). |
| Restaurantes | Página própria de cada restaurante (menu Daqui com vegetariano/vegan), filtro por cozinha e por vegetariano/vegan, distância a partir da localização do navegador, mapa com arrastar e zoom, 3 estilos de mapa (Conta → Aspeto no site; Definições → Aspeto na app). Lista de cozinhas em `CUISINES` (js/data.js). |
| Preços | Caixas de cartão (5 kg 0,85 €; 10 kg 1,00 €, sempre a combinação mais barata), portes em casa e no ponto de recolha, grátis acima do valor da gestão (25 €) e para membros. |
| Saldo, Cooperativa e promoções | Carregar saldo (demonstração), pagar com saldo e o resto com outro método, quota anual da Cooperativa (página `/cooperativa`), sininho com notificações e promoções para reclamar, códigos promocionais, janela de promoção ao abrir a app. |
| Conta | E-mail, telemóvel, NIF e dados de faturação; faturas e recibos em PDF; na app, língua e permissões em Definições. |
| Produtos | Avaliações (estrelas e comentário) de quem recebeu o produto ou a caixa, com resposta da Daqui; sugestões da pesquisa alinhadas à esquerda. |
| Aspeto | Transições suaves entre páginas no site; na app, deslizar entre ecrãs (desliga-se em Definições), animação da pera ao abrir, som ao confirmar um levantamento e som próprio das notificações. |
| Textos | Termos, Privacidade, Cookies e Devoluções em páginas próprias; mais perguntas frequentes. |

Ficheiros novos: `js/dados.js`, `js/pages-gestao2.js`, `js/pages-extra.js`, `js/faturas.js`, `js/textos.js`, páginas `restaurante/`, `cooperativa/`, `termos/`, `privacidade/`, `cookies/`, `devolucoes/`.
