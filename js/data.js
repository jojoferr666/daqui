/* ===== Daqui — dados do catálogo (fictícios, projeto académico) =====
   Depois de acrescentar ou remover um produto ou agricultor, corra: python3 ferramentas/gerar-paginas.py
   (cria a página /produtos/<id> ou /agricultores/<id>). */

/* ---------- Agricultores ---------- */
const REGIONS = {
  minho: { pt: 'Minho', en: 'Minho' }, douro: { pt: 'Porto e Douro', en: 'Porto and Douro' }, tras: { pt: 'Trás-os-Montes', en: 'Trás-os-Montes' },
  aveiro: { pt: 'Região de Aveiro', en: 'Aveiro region' }, beiras: { pt: 'Beiras', en: 'Beiras' }, coimbra: { pt: 'Região de Coimbra', en: 'Coimbra region' },
  leiria: { pt: 'Região de Leiria', en: 'Leiria region' }, oeste: { pt: 'Oeste', en: 'Oeste' }, ribatejo: { pt: 'Ribatejo', en: 'Ribatejo' },
  lisboa: { pt: 'Lisboa e Setúbal', en: 'Lisbon and Setúbal' }, alentejo: { pt: 'Alentejo', en: 'Alentejo' }, algarve: { pt: 'Algarve', en: 'Algarve' },
  madeira: { pt: 'Madeira', en: 'Madeira' }, acores: { pt: 'Açores', en: 'Azores' }
};
/* regiões nas ilhas: no mapa aparecem nos quadros da Madeira e dos Açores */
const ISLAND_REGIONS = ['madeira', 'acores'];
const FARMERS = [
  { id:'joaquim', name:'Joaquim Santos', farm:'Quinta do Casal Novo', place:'Cadaval', region:'oeste', lat:39.243, lon:-9.103, since:1987, crop:'pera', seed:0,
    story:{ pt:'Terceira geração a cultivar Pera Rocha no Cadaval. Durante anos vendeu tudo a um armazenista que decidia o preço no fim da campanha. Na Daqui vê, em cada pera, quanto do preço fica com ele.',
            en:'Third generation growing Rocha pears in Cadaval. For years he sold his whole crop to a packer who set the price at the end of the season. With Daqui he can see how much of each pear\'s price stays with him.' } },
  { id:'duarte', name:'Rosa e Manuel Duarte', farm:'Pomar dos Duarte', place:'Alcobaça', region:'oeste', lat:39.552, lon:-8.977, since:1995, crop:'macaGala', seed:1,
    story:{ pt:'Um pomar familiar de maçã Gala, Golden, Fuji e Reineta, e alguns marmeleiros. A maçã é colhida no fim do verão e guardada nas câmaras frigoríficas da Daqui.',
            en:'A family orchard of Gala, Golden, Fuji and Reineta apples, plus a few quince trees. The apples are picked at the end of summer and kept in Daqui\'s cold rooms.' } },
  { id:'pereira', name:'Família Pereira', farm:'Horta da Ribeira', place:'Lourinhã', region:'oeste', lat:39.242, lon:-9.312, since:2004, crop:'alface', seed:2,
    story:{ pt:'Três irmãos que trocaram a venda ao intermediário pela venda direta. Alfaces, couves e ervas aromáticas colhidas na véspera da entrega.',
            en:'Three siblings who swapped selling to a middleman for selling direct. Lettuce, cabbage and herbs picked the day before delivery.' } },
  { id:'antonio', name:'António Marques', farm:'Terras da Gândara', place:'Vagos', region:'aveiro', lat:40.556, lon:-8.683, since:1979, crop:'batata', seed:3,
    story:{ pt:'Os solos arenosos da Gândara dão uma batata de pele fina e sabor intenso. O Sr. António não usa a internet: um agente de campo da Daqui regista os produtos dele por telefone.',
            en:'The sandy soils of the Gândara give a thin-skinned, full-flavoured potato. Mr António does not use the internet: a Daqui field agent lists his produce over the phone.' } },
  { id:'ines', name:'Inês Carvalho', farm:'Horta Viva', place:'Mira', region:'aveiro', lat:40.428, lon:-8.736, since:2019, crop:'alhoFrances', seed:4,
    story:{ pt:'Jovem agricultora em modo de produção biológico. Escolheu a Daqui para vender sem embalagens de plástico e para conhecer as pessoas que comem o que ela planta.',
            en:'A young organic grower. She chose Daqui to sell without plastic packaging and to meet the people who eat what she plants.' } },
  { id:'luis', name:'Luís Fonseca', farm:'Quinta da Várzea', place:'Oliveira do Bairro', region:'aveiro', lat:40.515, lon:-8.494, since:2008, crop:'kiwi', seed:5,
    story:{ pt:'Kiwi e dióspiro a poucos quilómetros do armazém da Daqui. Abre a quinta nos dias Colhe Connosco.',
            en:'Kiwis and persimmons a few kilometres from the Daqui warehouse. He opens the farm on Join the Harvest days.' } },
  { id:'rui', name:'Rui Tavares', farm:'Bagas do Vouga', place:'Sever do Vouga', region:'aveiro', lat:40.733, lon:-8.367, since:2014, crop:'mirtilo', seed:6,
    story:{ pt:'Trocou um emprego em Lisboa pelos mirtilos da terra dos avós. No verão também tem framboesas e amoras.',
            en:'He swapped a job in Lisbon for blueberries on his grandparents\' land. In summer he also grows raspberries and blackberries.' } },
  { id:'teresa', name:'Teresa Gomes', farm:'Casal das Hortas', place:'Torres Vedras', region:'oeste', lat:39.091, lon:-9.259, since:1999, crop:'abobora', seed:7,
    story:{ pt:'Abóboras, tomate, pimentos e batata-doce. Gosta de sugerir receitas e é ela quem escolhe muitas das Descobertas da Estação.',
            en:'Pumpkins, tomatoes, peppers and sweet potatoes. She loves suggesting recipes and picks many of our Seasonal Discoveries.' } },
  { id:'carlos', name:'Carlos Ribeiro', farm:'Quinta do Vale Tejo', place:'Almeirim', region:'ribatejo', lat:39.209, lon:-8.627, since:1991, crop:'melancia', seed:8,
    story:{ pt:'Na lezíria do Tejo cultiva melão, melancia, morango e leguminosas. As favas e as ervilhas anunciam a primavera.',
            en:'On the Tagus floodplain he grows melons, watermelons, strawberries and pulses. Broad beans and peas announce the spring.' } },
  { id:'ana', name:'Ana Mendes', farm:'Pomar da Gardunha', place:'Fundão', region:'beiras', lat:40.139, lon:-7.501, since:2001, crop:'cereja', seed:9,
    story:{ pt:'Cereja do Fundão, pêssego, ameixa e figo na encosta da Gardunha. A cereja chega em maio e acaba depressa.',
            en:'Fundão cherries, peaches, plums and figs on the slopes of the Gardunha. Cherries arrive in May and are gone quickly.' } },
  { id:'jose', name:'José Lopes', farm:'Quinta da Esmolfe', place:'Penalva do Castelo', region:'beiras', lat:40.676, lon:-7.693, since:1983, crop:'macaBravo', seed:10,
    story:{ pt:'Guarda as macieiras Bravo de Esmolfe que o pai plantou, uma maçã pequena, perfumada e protegida por Denominação de Origem.',
            en:'He looks after the Bravo de Esmolfe trees his father planted, a small, fragrant apple with protected designation of origin.' } },
  { id:'maria', name:'Maria Calado', farm:'Monte da Vinha', place:'Vidigueira', region:'alentejo', lat:38.209, lon:-7.800, since:2010, crop:'uvaBranca', seed:11,
    story:{ pt:'Uva de mesa branca e tinta no calor do Baixo Alentejo, colhida à mão de agosto a outubro.',
            en:'White and red table grapes in the heat of the Lower Alentejo, picked by hand from August to October.' } },
  { id:'paulo', name:'Paulo Viegas', farm:'Pomar do Arade', place:'Silves', region:'algarve', lat:37.189, lon:-8.438, since:1996, crop:'laranja', seed:12,
    story:{ pt:'Laranjas, tangerinas, limões e abacates no barrocal algarvio. A laranja é colhida só quando a encomenda está feita.',
            en:'Oranges, mandarins, lemons and avocados in the Algarve hills. Oranges are only picked once the order is in.' } },
  { id:'helena', name:'Helena Morais', farm:'Souto da Lombada', place:'Vinhais', region:'tras', lat:41.835, lon:-7.000, since:1988, crop:'castanha', seed:13,
    story:{ pt:'Castanha e noz de soutos centenários em Trás-os-Montes. O outono é a época mais trabalhosa e a mais bonita.',
            en:'Chestnuts and walnuts from century-old groves in Trás-os-Montes. Autumn is the busiest season and the most beautiful.' } },
  { id:'freitas', name:'Família Freitas', farm:'Fajã do Sol', place:'Ponta do Sol, Madeira', region:'madeira', island:'madeira', lat:32.68, lon:-17.10, since:1975, crop:'banana', seed:14,
    story:{ pt:'Banana da Madeira em socalcos virados ao mar, maracujá e anona. Chega ao continente de barco, uma vez por semana.',
            en:'Madeira bananas on terraces facing the sea, plus passion fruit and custard apples. They reach the mainland by boat once a week.' } }
];

/* ---------- Produtos ----------
   prod(id, categoria, nome PT, nome EN, preço, unidade, agricultor, desenho, [mês início, mês fim], colheita, etiquetas, descrição PT, descrição EN)
   colheita: número = há quantos dias foi colhido; 'MM-DD' = data da última colheita (produto guardado em frio ou curado)
   etiquetas: 'e' essencial, 'b' biológico */
const PRODUCTS = [];
function prod(id, cat, pt, en, price, unit, farmer, art, season, harvest, flags, dpt, den) {
  PRODUCTS.push({ id, cat, name: { pt, en }, price, unit, farmer, art, season, harvest, essential: flags.includes('e'), organic: flags.includes('b'), desc: { pt: dpt, en: den } });
}
/* fruta */
prod('pera-rocha','fruta','Pera Rocha do Oeste','Rocha pear from the Oeste',1.89,'kg','joaquim','pera',[8,5],'08-27','e','Sumarenta, doce e de polpa firme.','Juicy, sweet and firm.');
prod('maca-gala','fruta','Maçã Gala de Alcobaça','Gala apple from Alcobaça',1.69,'kg','duarte','macaGala',[8,6],'09-08','e','Crocante e doce, a preferida dos mais novos.','Crunchy and sweet, a favourite with children.');
prod('maca-golden','fruta','Maçã Golden','Golden apple',1.59,'kg','duarte','macaGolden',[9,6],'09-20','','Doce e suave, boa para comer e para compotas.','Sweet and mellow, good to eat or for jam.');
prod('maca-fuji','fruta','Maçã Fuji','Fuji apple',1.99,'kg','duarte','macaFuji',[10,6],'10-12','','Muito doce e estaladiça.','Very sweet and crisp.');
prod('maca-reineta','fruta','Maçã Reineta','Reineta apple',1.79,'kg','duarte','macaReineta',[9,3],'10-03','','Ácida e aromática, ideal para assar.','Tart and aromatic, ideal for baking.');
prod('maca-bravo-esmolfe','fruta','Maçã Bravo de Esmolfe DOP','Bravo de Esmolfe apple (PDO)',2.79,'kg','jose','macaBravo',[9,2],'09-25','','Pequena, perfumada e de polpa branca.','Small, fragrant and white-fleshed.');
prod('marmelo','fruta','Marmelo','Quince',1.49,'kg','duarte','marmelo',[9,12],'10-05','','Para marmelada e para assar no forno.','For quince paste or roasting.');
prod('kiwi','fruta','Kiwi','Kiwi',2.49,'kg','luis','kiwi',[11,5],'11-10','','Deixe amadurecer um ou dois dias à temperatura ambiente.','Let it ripen for a day or two at room temperature.');
prod('diospiro','fruta','Dióspiro','Persimmon',2.19,'kg','luis','diospiro',[10,12],3,'','Doce como mel quando bem maduro.','Sweet as honey when fully ripe.');
prod('laranja','fruta','Laranja do Algarve','Algarve orange',1.39,'kg','paulo','laranja',[11,6],4,'e','Para sumo ou para comer à dentada.','For juice or to eat as it is.');
prod('tangerina','fruta','Tangerina','Mandarin',1.79,'kg','paulo','tangerina',[11,2],4,'','Casca fina, fácil de descascar.','Thin skin, easy to peel.');
prod('clementina','fruta','Clementina','Clementine',1.99,'kg','paulo','clementina',[10,1],4,'','Sem grainhas e muito doce.','Seedless and very sweet.');
prod('limao','fruta','Limão','Lemon',1.89,'kg','paulo','limao',[1,12],6,'','Para temperar, para chá e para sobremesas.','For seasoning, tea and desserts.');
prod('abacate','fruta','Abacate do Algarve','Algarve avocado',4.49,'kg','paulo','abacate',[10,5],6,'','Pronto a comer quando cede ligeiramente ao toque.','Ready when it yields slightly to the touch.');
prod('roma','fruta','Romã','Pomegranate',2.99,'kg','paulo','roma',[9,12],6,'','Bagos sumarentos para saladas e sobremesas.','Juicy seeds for salads and desserts.');
prod('nespera','fruta','Nêspera','Loquat',3.49,'kg','paulo','nespera',[4,6],2,'','Fruta de primavera, delicada e ácida.','A delicate, tangy spring fruit.');
prod('banana-madeira','fruta','Banana da Madeira','Madeira banana',1.79,'kg','freitas','banana',[1,12],8,'e','Pequena, doce e aromática.','Small, sweet and fragrant.');
prod('maracuja','fruta','Maracujá','Passion fruit',6.90,'kg','freitas','maracuja',[7,12],6,'','Está pronto quando a casca enruga.','Ready when the skin wrinkles.');
prod('anona','fruta','Anona da Madeira','Madeira custard apple',4.90,'kg','freitas','anona',[11,4],6,'','Polpa cremosa, come-se à colher.','Creamy flesh, eaten with a spoon.');
prod('cereja','fruta','Cereja do Fundão','Fundão cherry',7.90,'kg','ana','cereja',[5,7],2,'','Escura, firme e muito doce.','Dark, firm and very sweet.');
prod('pessego','fruta','Pêssego','Peach',2.49,'kg','ana','pessego',[6,9],2,'','Polpa amarela e sumarenta.','Juicy yellow flesh.');
prod('nectarina','fruta','Nectarina','Nectarine',2.69,'kg','ana','nectarina',[6,9],2,'','Pele lisa e polpa doce.','Smooth skin, sweet flesh.');
prod('ameixa','fruta','Ameixa','Plum',2.29,'kg','ana','ameixa',[6,9],2,'','Para comer fresca ou fazer doce.','Eat fresh or make jam.');
prod('alperce','fruta','Alperce','Apricot',2.99,'kg','ana','alperce',[5,7],2,'','Aveludado e perfumado.','Velvety and fragrant.');
prod('figo','fruta','Figo','Fig',4.50,'kg','ana','figo',[8,10],1,'','Muito delicado: coma no próprio dia.','Very delicate: eat it the same day.');
prod('melao','fruta','Melão','Melon',1.49,'kg','carlos','melao',[6,10],3,'','Doce e refrescante.','Sweet and refreshing.');
prod('meloa','fruta','Meloa','Cantaloupe',1.79,'kg','carlos','meloa',[6,9],3,'','Polpa cor de laranja, muito aromática.','Orange flesh, very fragrant.');
prod('melancia','fruta','Melancia','Watermelon',0.89,'kg','carlos','melancia',[6,9],3,'','Vendida inteira ou às metades.','Sold whole or in halves.');
prod('uva-branca','fruta','Uva de mesa branca','White table grapes',2.49,'kg','maria','uvaBranca',[8,10],2,'','Bago grande e estaladiço.','Large, crisp grapes.');
prod('uva-tinta','fruta','Uva de mesa tinta','Red table grapes',2.69,'kg','maria','uvaTinta',[8,10],2,'','Doce, com notas de frutos vermelhos.','Sweet, with red-berry notes.');
prod('morango','fruta','Morango','Strawberries',2.99,'cuv','carlos','morango',[3,6],1,'','Cuvete de 500 g.','500 g punnet.');
prod('mirtilo','fruta','Mirtilo','Blueberries',3.49,'cuv','rui','mirtilo',[6,9],1,'b','Cuvete de 250 g.','250 g punnet.');
prod('framboesa','fruta','Framboesa','Raspberries',3.29,'cuv','rui','framboesa',[6,10],1,'b','Cuvete de 125 g.','125 g punnet.');
prod('amora','fruta','Amora','Blackberries',2.99,'cuv','rui','amora',[7,9],1,'b','Cuvete de 125 g.','125 g punnet.');
prod('castanha','fruta','Castanha de Trás-os-Montes','Chestnuts from Trás-os-Montes',4.90,'kg','helena','castanha',[10,12],'10-20','','Para assar ou cozer com erva-doce.','Roast them or boil with fennel seeds.');
prod('noz','fruta','Noz','Walnuts',7.90,'kg','helena','noz',[10,3],'10-05','','Com casca, secas ao ar.','In shell, air-dried.');
prod('lima','fruta','Lima','Lime',3.49,'kg','paulo','lima',[9,3],5,'','Sumo perfumado para limonadas e marinadas.','Fragrant juice for lemonades and marinades.');
prod('toranja','fruta','Toranja','Grapefruit',1.99,'kg','paulo','toranja',[11,5],5,'','Agridoce, ótima ao pequeno-almoço.','Bittersweet, great at breakfast.');
prod('ameixa-rainha-claudia','fruta','Ameixa Rainha-Cláudia','Greengage plum',3.49,'kg','ana','ameixaRC',[7,8],2,'','Pequena, verde-dourada e muito doce.','Small, golden-green and very sweet.');
prod('uva-moscatel','fruta','Uva moscatel','Muscat grapes',2.99,'kg','maria','uvaMoscatel',[8,10],2,'','Aroma intenso a moscatel.','Intense muscat aroma.');
prod('physalis','fruta','Physalis','Physalis',3.90,'cuv','freitas','physalis',[9,5],5,'','Cuvete de 100 g, ácida e doce.','100 g punnet, tangy and sweet.');
prod('medronho','fruta','Medronho','Strawberry-tree fruit',6.90,'cuv','paulo','medronho',[10,12],2,'','Fruto silvestre do Algarve, em cuvete de 250 g.','Wild Algarve fruit, in a 250 g punnet.');
/* legumes */
prod('batata','legumes','Batata da Gândara','Gândara potato',0.95,'kg','antonio','batata',[1,12],'09-12','e','Boa para cozer, assar ou fritar.','Good for boiling, roasting or frying.');
prod('batata-vermelha','legumes','Batata vermelha','Red potato',1.19,'kg','antonio','batataVermelha',[1,12],'09-12','','Polpa firme, ideal para assar.','Firm flesh, ideal for roasting.');
prod('batata-doce','legumes','Batata-doce','Sweet potato',1.89,'kg','teresa','batataDoce',[9,3],'10-27','b','Polpa alaranjada e doce.','Sweet orange flesh.');
prod('cebola','legumes','Cebola','Onion',1.39,'kg','antonio','cebola',[1,12],'08-20','e','Curada ao ar, de sabor doce.','Air-cured, with a sweet flavour.');
prod('cebola-roxa','legumes','Cebola roxa','Red onion',1.69,'kg','antonio','cebolaRoxa',[1,12],'08-20','','Suave, boa para saladas.','Mild, good for salads.');
prod('alho','legumes','Alho','Garlic',4.90,'kg','antonio','alho',[1,12],'07-10','','Cabeças secas ao sol.','Sun-dried bulbs.');
prod('alho-frances','legumes','Alho-francês','Leek',1.69,'kg','ines','alhoFrances',[9,4],2,'b','Perfeito para sopas e quiches.','Perfect for soups and quiches.');
prod('cenoura','legumes','Cenoura','Carrot',0.99,'kg','ines','cenoura',[1,12],4,'eb','Doce e estaladiça.','Sweet and crunchy.');
prod('beterraba','legumes','Beterraba','Beetroot',1.49,'kg','ines','beterraba',[1,12],4,'b','Crua ralada ou assada no forno.','Grated raw or roasted.');
prod('nabo','legumes','Nabo','Turnip',1.29,'kg','ines','nabo',[10,3],3,'','Para o cozido e para sopas.','For stews and soups.');
prod('rabanete','legumes','Rabanete','Radishes',0.99,'molho','ines','rabanete',[1,12],2,'','Picante e estaladiço.','Peppery and crunchy.');
prod('nabicas','legumes','Nabiças','Turnip greens',1.19,'molho','ines','nabicas',[10,3],2,'','Salteadas com alho ou na sopa.','Sautéed with garlic or in soup.');
prod('grelos','legumes','Grelos','Turnip tops',1.49,'molho','ines','grelos',[11,3],2,'','Um clássico de inverno.','A winter classic.');
prod('espinafres','legumes','Espinafres','Spinach',1.49,'molho','pereira','espinafres',[10,5],1,'','Folha tenra para saladas e esparregado.','Tender leaves for salads or creamed spinach.');
prod('agriao','legumes','Agrião','Watercress',1.19,'molho','pereira','agriao',[10,5],1,'','Para a sopa de agrião.','For watercress soup.');
prod('rucula','legumes','Rúcula','Rocket',1.29,'molho','pereira','rucula',[1,12],1,'','Folha picante para saladas.','Peppery salad leaves.');
prod('salsa','legumes','Salsa','Parsley',0.79,'molho','pereira','salsa',[1,12],1,'','Molho fresco.','Fresh bunch.');
prod('coentros','legumes','Coentros','Coriander',0.79,'molho','pereira','coentros',[1,12],1,'','Indispensável na açorda.','Essential in açorda.');
prod('hortela','legumes','Hortelã','Mint',0.89,'molho','pereira','hortela',[1,12],1,'','Para chás, saladas e caldos.','For teas, salads and broths.');
prod('alface','legumes','Alface frisada','Curly lettuce',0.79,'un','pereira','alface',[1,12],1,'e','Colhida na véspera da entrega.','Picked the day before delivery.');
prod('alface-romana','legumes','Alface romana','Romaine lettuce',0.89,'un','pereira','alfaceRomana',[1,12],1,'','Folhas longas e crocantes.','Long, crunchy leaves.');
prod('alface-iceberg','legumes','Alface iceberg','Iceberg lettuce',0.99,'un','pereira','alfaceIceberg',[1,12],1,'','Compacta e fresca.','Compact and crisp.');
prod('couve-portuguesa','legumes','Couve-portuguesa','Portuguese cabbage',1.29,'un','pereira','couve',[9,4],1,'','Para o cozido à portuguesa.','For Portuguese boiled dinner.');
prod('couve-galega','legumes','Couve-galega','Galician kale',1.19,'molho','pereira','couveGalega',[1,12],1,'','A couve do caldo verde.','The kale for caldo verde.');
prod('couve-coracao','legumes','Couve-coração','Pointed cabbage',1.19,'un','pereira','couveCoracao',[1,12],2,'','Tenra e doce, boa salteada.','Tender and sweet, good sautéed.');
prod('couve-lombarda','legumes','Couve-lombarda','Savoy cabbage',1.39,'un','pereira','couveLombarda',[10,3],2,'','Folhas enrugadas, para sopas e arroz.','Crinkly leaves for soups and rice.');
prod('couve-roxa','legumes','Couve-roxa','Red cabbage',1.49,'un','pereira','couveRoxa',[9,3],2,'','Crua em salada ou estufada.','Raw in salads or braised.');
prod('couve-flor','legumes','Couve-flor','Cauliflower',1.99,'un','pereira','couveFlor',[10,4],2,'','Cabeça branca e firme.','White, firm head.');
prod('brocolos','legumes','Brócolos','Broccoli',2.39,'kg','pereira','brocolos',[10,4],2,'b','Cabeças compactas e verdes.','Compact green heads.');
prod('tomate','legumes','Tomate coração-de-boi','Oxheart tomato',2.49,'kg','teresa','tomate',[6,11],3,'','Carnudo e com poucas sementes.','Meaty, with few seeds.');
prod('tomate-cherry','legumes','Tomate cherry','Cherry tomatoes',2.29,'cuv','teresa','tomateCherry',[1,12],3,'','Cuvete de 500 g, de estufa fria.','500 g punnet, from a cold greenhouse.');
prod('tomate-chucha','legumes','Tomate chucha','Plum tomato',1.99,'kg','carlos','tomateChucha',[6,10],3,'','Para molhos e conservas.','For sauces and preserves.');
prod('abobora','legumes','Abóbora-menina','Pumpkin',1.19,'kg','teresa','abobora',[9,2],'10-18','','Vendida às fatias ou inteira.','Sold in slices or whole.');
prod('abobora-manteiga','legumes','Abóbora-manteiga','Butternut squash',1.49,'kg','teresa','aboboraManteiga',[9,2],'10-10','','Doce e cremosa, para sopas e assados.','Sweet and creamy, for soups and roasts.');
prod('courgette','legumes','Courgette','Courgette',1.79,'kg','teresa','courgette',[5,10],2,'','Grelhada, salteada ou na sopa.','Grilled, sautéed or in soup.');
prod('pepino','legumes','Pepino','Cucumber',1.49,'kg','teresa','pepino',[5,10],2,'','Fresco para saladas e gaspacho.','Fresh for salads and gazpacho.');
prod('beringela','legumes','Beringela','Aubergine',2.29,'kg','teresa','beringela',[6,10],2,'','Assada ou em moussaka.','Roasted or in moussaka.');
prod('pimento-verde','legumes','Pimento verde','Green pepper',2.49,'kg','teresa','pimentoVerde',[6,10],2,'','Para assar na brasa.','For grilling.');
prod('pimento-vermelho','legumes','Pimento vermelho','Red pepper',2.99,'kg','teresa','pimentoVermelho',[7,11],4,'','Doce e carnudo.','Sweet and meaty.');
prod('feijao-verde','legumes','Feijão-verde','Green beans',3.49,'kg','carlos','feijaoVerde',[5,10],2,'','Fino e sem fios.','Fine and stringless.');
prod('ervilhas','legumes','Ervilhas','Peas',3.99,'kg','carlos','ervilhas',[3,6],1,'','Em vagem, para descascar.','In the pod, ready to shell.');
prod('favas','legumes','Favas','Broad beans',2.99,'kg','carlos','favas',[2,5],1,'','Para favas à portuguesa.','For Portuguese-style broad beans.');
prod('milho-doce','legumes','Milho doce','Sweetcorn',0.69,'un','carlos','milho',[7,9],1,'','Cozido ou na brasa.','Boiled or grilled.');
prod('espargos','legumes','Espargos verdes','Green asparagus',3.49,'molho','carlos','espargos',[3,5],1,'','Molho de 250 g.','250 g bunch.');
prod('aipo','legumes','Aipo','Celery',1.49,'un','pereira','aipo',[9,5],3,'','Para sopas, caldos e sumos.','For soups, stocks and juices.');
prod('funcho','legumes','Funcho','Fennel',1.99,'un','ines','funcho',[10,4],3,'b','Anisado, cru ou assado.','Aniseed flavour, raw or roasted.');
prod('pimento-amarelo','legumes','Pimento amarelo','Yellow pepper',2.99,'kg','teresa','pimentoAmarelo',[7,11],4,'','Doce, bom cru em saladas.','Sweet, good raw in salads.');
prod('malagueta','legumes','Malagueta','Chilli pepper',1.49,'cuv','teresa','malagueta',[7,11],4,'','Cuvete de 100 g. Muito picante.','100 g punnet. Very hot.');
prod('couve-de-bruxelas','legumes','Couve-de-bruxelas','Brussels sprouts',3.29,'kg','pereira','couveBruxelas',[10,3],2,'','Pequenas e firmes, ótimas assadas.','Small and firm, great roasted.');
prod('acelga','legumes','Acelga','Swiss chard',1.39,'molho','pereira','acelga',[1,12],1,'','Folhas e talos para salteados e sopas.','Leaves and stalks for stir-fries and soups.');
prod('chuchu','legumes','Chuchu','Chayote',1.99,'kg','freitas','chuchu',[9,4],6,'','Da Madeira, para sopas e saladas.','From Madeira, for soups and salads.');
prod('manjericao','legumes','Manjericão','Basil',0.99,'molho','pereira','manjericao',[5,10],1,'','Perfumado, para molhos e saladas.','Fragrant, for sauces and salads.');

/* caixas da estação (sempre disponíveis) */
const BOXES = [
  { id:'caixa-mista', cat:'caixas', box:'mista', name:{pt:'Caixa Mista da Estação',en:'Mixed Seasonal Box'}, price:11.90, unit:'cx', kg:4, essential:false, organic:false,
    desc:{pt:'Pelo menos 6 variedades de fruta e legumes da época, mais uma Descoberta da Estação.',en:'At least 6 kinds of seasonal fruit and vegetables, plus one Seasonal Discovery.'} },
  { id:'caixa-essencial', cat:'caixas', box:'essencial', name:{pt:'Caixa Essencial',en:'Essentials Box'}, price:9.90, unit:'cx', kg:4, essential:false, organic:false,
    desc:{pt:'Os 8 essenciais da semana: pera Rocha, maçã Gala, laranja, banana da Madeira, batata, cebola, cenoura e alface.',en:'The 8 weekly essentials: Rocha pear, Gala apple, orange, Madeira banana, potato, onion, carrot and lettuce.'} },
  { id:'caixa-fruta', cat:'caixas', box:'fruta', name:{pt:'Caixa de Fruta da Estação',en:'Seasonal Fruit Box'}, price:8.90, unit:'cx', kg:3, essential:false, organic:false,
    desc:{pt:'Pelo menos 4 variedades de fruta da época.',en:'At least 4 kinds of seasonal fruit.'} },
  { id:'caixa-legumes', cat:'caixas', box:'legumes', name:{pt:'Caixa de Legumes da Estação',en:'Seasonal Vegetable Box'}, price:6.90, unit:'cx', kg:3, essential:false, organic:false,
    desc:{pt:'Pelo menos 4 variedades de legumes da época.',en:'At least 4 kinds of seasonal vegetables.'} }
];
PRODUCTS.unshift(...BOXES);

/* preços atuais das caixas por tamanho (o preço de cada subscrição fica guardado 12 meses) */
const BOX_SIZES = {
  'caixa-mista':   [{s:'P',kg:4,price:11.90},{s:'G',kg:8,price:21.90}],
  'caixa-essencial': [{s:'P',kg:4,price:9.90},{s:'G',kg:8,price:17.90}],
  'caixa-fruta':   [{s:'P',kg:3,price:8.90},{s:'M',kg:5,price:13.90},{s:'G',kg:8,price:20.90}],
  'caixa-legumes': [{s:'P',kg:3,price:6.90},{s:'M',kg:5,price:10.90},{s:'G',kg:8,price:16.90}]
};
const DELIVERY_FEE = 2.90;
/* Distribuição: a Daqui entrega à quinta-feira e ao sábado.
   cutoff = [dia da semana (0=domingo), hora] até quando se pode encomendar para esse dia */
const DISTRIBUTION = {
  days: { qui: { dow: 4, cutoff: [2, 18], pickup: '16h–20h' }, sab: { dow: 6, cutoff: [4, 18], pickup: '9h–13h' } },
  windows: ['9h–13h', '17h–21h'],
  area: ['Aveiro', 'Ílhavo', 'Vagos', 'Oliveira do Bairro', 'Mira', 'Águeda', 'Albergaria-a-Velha', 'Estarreja']
};
const PICKUP_POINTS = ['Armazém Daqui, Vagos', 'Aveiro, Rossio', 'Ílhavo', 'Oliveira do Bairro', 'Mira', 'Águeda'];

/* ---------- Colhe Connosco ---------- */
const HARVEST_DAYS = [
  { id:'2026-11-28-luis', date:'2026-11-28', farmer:'luis', crop:'diospiro', what:{pt:'Dióspiros',en:'Persimmons'}, time:'9h30–12h30', spots:40 },
  { id:'2026-12-05-luis', date:'2026-12-05', farmer:'luis', crop:'kiwi', what:{pt:'Kiwis',en:'Kiwis'}, time:'9h30–12h30', spots:40 },
  { id:'2026-12-12-ines', date:'2026-12-12', farmer:'ines', crop:'alhoFrances', what:{pt:'Alho-francês e cenoura',en:'Leeks and carrots'}, time:'10h–13h', spots:25 },
  { id:'2026-12-19-paulo', date:'2026-12-19', farmer:'paulo', crop:'laranja', what:{pt:'Laranjas e tangerinas',en:'Oranges and mandarins'}, time:'10h–13h', spots:30 },
  { id:'2027-01-16-pereira', date:'2027-01-16', farmer:'pereira', crop:'couve', what:{pt:'Couves e brócolos',en:'Cabbage and broccoli'}, time:'10h–13h', spots:30 }
];

/* tipos de cozinha que um restaurante pode escolher (filtro na página dos restaurantes) */
const CUISINES = [
  { id: 'portuguesa', pt: 'Cozinha portuguesa', en: 'Portuguese' }, { id: 'peixe', pt: 'Peixe e marisco', en: 'Fish and seafood' },
  { id: 'vegetariana', pt: 'Vegetariana', en: 'Vegetarian' }, { id: 'vegana', pt: 'Vegana', en: 'Vegan' },
  { id: 'mediterranica', pt: 'Mediterrânica', en: 'Mediterranean' }, { id: 'bistro', pt: 'Bistrô', en: 'Bistro' },
  { id: 'autor', pt: 'Cozinha de autor', en: 'Chef\'s cuisine' }, { id: 'petiscos', pt: 'Petiscos', en: 'Small plates' },
  { id: 'grelhados', pt: 'Grelhados', en: 'Grill' }, { id: 'italiana', pt: 'Italiana', en: 'Italian' },
  { id: 'asiatica', pt: 'Asiática', en: 'Asian' }, { id: 'brunch', pt: 'Brunch', en: 'Brunch' },
  { id: 'cafe', pt: 'Café e refeições rápidas', en: 'Café and quick meals' }, { id: 'pastelaria', pt: 'Almoços e pastelaria', en: 'Lunches and pastries' }
];
/* ---------- Restaurantes com Selo Daqui (inventados) — x, y = posição no mapa de Aveiro ---------- */
const RESTAURANTS = [
  { id:'mesa-da-ria', name:'Mesa da Ria', cuisine:'peixe', lat:40.6446, lon:-8.6562, kind:{pt:'Peixe e marisco',en:'Fish and seafood'}, area:{pt:'Bairro da Beira-Mar, junto à Praça do Peixe',en:'Beira-Mar quarter, by Praça do Peixe'}, dish:{pt:'Robalo grelhado com batata da Gândara',en:'Grilled sea bass with Gândara potatoes'}, since:'2026-09' },
  { id:'tasca-da-horta', name:'Tasca da Horta', cuisine:'portuguesa', lat:40.6424, lon:-8.6553, kind:{pt:'Cozinha portuguesa',en:'Portuguese cooking'}, area:{pt:'Rossio',en:'Rossio'}, dish:{pt:'Caldo verde com couve-galega da Família Pereira',en:'Caldo verde with the Pereira family\'s kale'}, since:'2026-10' },
  { id:'moliceiro-verde', name:'Moliceiro Verde', cuisine:'vegetariana', dishVeg:true, lat:40.6430, lon:-8.6598, kind:{pt:'Vegetariano',en:'Vegetarian'}, area:{pt:'Canal Central',en:'Canal Central'}, dish:{pt:'Risoto de abóbora-manteiga e alho-francês',en:'Butternut squash and leek risotto'}, since:'2026-09' },
  { id:'sal-e-campo', name:'Sal & Campo', cuisine:'bistro', dishVeg:true, dishVegan:true, lat:40.6478, lon:-8.6566, kind:{pt:'Bistrô',en:'Bistro'}, area:{pt:'Canal de São Roque',en:'Canal de São Roque'}, dish:{pt:'Salada de rúcula, pera Rocha e noz',en:'Rocket, Rocha pear and walnut salad'}, since:'2026-11' },
  { id:'fonte-nova', name:'Bistrô Fonte Nova', cuisine:'autor', lat:40.6408, lon:-8.6466, kind:{pt:'Cozinha de autor',en:'Chef\'s cuisine'}, area:{pt:'Canal do Cojo, junto ao Centro de Congressos',en:'Canal do Cojo, by the Congress Centre'}, dish:{pt:'Cachaço de porco com castanhas de Vinhais',en:'Pork with Vinhais chestnuts'}, since:'2026-10' },
  { id:'cantina-do-parque', name:'Cantina do Parque', cuisine:'pastelaria', dishVeg:true, lat:40.6358, lon:-8.6488, kind:{pt:'Almoços e pastelaria',en:'Lunches and pastries'}, area:{pt:'Parque Infante D. Pedro',en:'Infante D. Pedro park'}, dish:{pt:'Tarte de maçã Reineta',en:'Reineta apple tart'}, since:'2026-11' },
  { id:'cafe-campus', name:'Café Campus', cuisine:'cafe', dishVeg:true, dishVegan:true, lat:40.6318, lon:-8.6578, kind:{pt:'Café e refeições rápidas',en:'Café and quick meals'}, area:{pt:'Universidade de Aveiro',en:'University of Aveiro'}, dish:{pt:'Sopa do dia com legumes da Horta Viva',en:'Soup of the day with Horta Viva vegetables'}, since:'2026-10' },
  { id:'estacao-74', name:'Estação 74', cuisine:'petiscos', dishVeg:true, dishVegan:true, lat:40.6431, lon:-8.6418, kind:{pt:'Petiscos',en:'Small plates'}, area:{pt:'Junto à estação',en:'By the railway station'}, dish:{pt:'Pimentos assados de Torres Vedras',en:'Roast peppers from Torres Vedras'}, since:'2026-11' }
];

/* ---------- Perguntas frequentes ---------- */
const FAQ = [
  { k:'quem', home:true, cat:'enc', q:{pt:'Para quem é a Daqui?',en:'Who is Daqui for?'},
    a:{pt:'Para quem quer fruta e legumes frescos a um preço justo, para quem quer apoiar os agricultores portugueses e para quem prefere encomendar por telefone e receber em casa. Também trabalhamos com restaurantes através do Selo Daqui.',
       en:'For anyone who wants fresh fruit and vegetables at a fair price, wants to support Portuguese farmers, or prefers to order by phone and get it delivered. We also work with restaurants through the Daqui seal.'} },
  { k:'origem', cat:'prod', q:{pt:'Como sei de onde vem cada produto?',en:'How do I know where each product comes from?'},
    a:{pt:'Cada produto tem uma etiqueta com o nome do agricultor, a localidade e a data de colheita. A fruta guardada em frio mostra a data em que foi colhida.',
       en:'Every product carries a tag with the farmer\'s name, the place and the harvest date. Cold-stored fruit shows the day it was picked.'} },
  { k:'epoca', cat:'prod', q:{pt:'Porque é que alguns produtos estão fora de época?',en:'Why are some products out of season?'},
    a:{pt:'Só vendemos o que está na época em Portugal. Quando um produto volta, avisamos quem carregou em "Avisar-me" na página do produto.',
       en:'We only sell what is in season in Portugal. When a product comes back, we let you know if you tapped "Notify me" on its page.'} },
  { k:'prazo', home:true, cat:'enc', q:{pt:'Quanto tempo demora a entrega?',en:'How long does delivery take?'},
    a:{pt:'Distribuímos à quinta-feira e ao sábado. Encomendas feitas até terça-feira às 18h seguem na quinta; até quinta-feira às 18h seguem no sábado.',
       en:'We deliver on Thursdays and Saturdays. Orders placed by Tuesday at 6 pm go out on Thursday; by Thursday at 6 pm, on Saturday.'} },
  { k:'seguir', cat:'enc', q:{pt:'Como sigo a minha encomenda?',en:'How do I track my order?'},
    a:{pt:'Cada encomenda tem um número (por exemplo DQ104871). Na página de contacto, escolha "Seguir entrega" e indique o número e o telemóvel. Se tiver conta, encontra todas as encomendas no seu histórico.',
       en:'Every order has a number (for example DQ104871). On the contact page, choose "Track delivery" and enter the number and your mobile. If you have an account, all your orders are in your history.'} },
  { k:'estrago', home:true, cat:'enc', q:{pt:'E se algum produto chegar em mau estado?',en:'What if something arrives damaged?'},
    a:{pt:'Envie-nos uma fotografia nas 48 horas seguintes, pela página de contacto ou por telefone. Substituímos o produto na entrega seguinte ou devolvemos o valor.',
       en:'Send us a photo within 48 hours through the contact page or by phone. We replace the item in your next delivery or refund it.'} },
  { k:'envio', home:true, cat:'enc', q:{pt:'Quanto custa a entrega?',en:'How much is delivery?'},
    a:{pt:'O levantamento no armazém ou num ponto de recolha é grátis. A entrega ao domicílio custa 2,90 € por encomenda.',
       en:'Pick-up at the warehouse or at a collection point is free. Home delivery costs €2.90 per order.'} },
  { k:'dinheiro', home:true, cat:'prod', q:{pt:'Quem fica com o dinheiro que pago?',en:'Who gets the money I pay?'},
    a:{pt:'Mostramos a divisão do preço em cada produto: a parte do agricultor, a parte da conservação e do embalamento e a parte da Daqui.',
       en:'Every product shows how its price is split: the farmer\'s share, the cold-storage and packing share, and Daqui\'s share.'} },
  { k:'telefone', cat:'enc', q:{pt:'Posso encomendar por telefone?',en:'Can I order by phone?'},
    a:{pt:'Sim. Ligue para a Linha Daqui (234 000 000), de segunda a sexta das 9h às 18h e ao sábado das 9h às 13h.',
       en:'Yes. Call the Daqui line (234 000 000), Monday to Friday 9 am–6 pm and Saturday 9 am–1 pm.'} },
  { k:'preco', cat:'sub', q:{pt:'Como funciona o preço garantido da subscrição?',en:'How does the subscription price guarantee work?'},
    a:{pt:'Quando subscreve, o preço da caixa fica guardado durante 12 meses. Se o preço subir, continua a pagar o preço guardado. Se descer, passa a pagar o preço mais baixo, que fica a ser o seu novo preço guardado.',
       en:'When you subscribe, the box price is saved for 12 months. If the price goes up, you keep paying your saved price. If it goes down, you pay the lower price, which becomes your new saved price.'} },
  { k:'pausa', cat:'sub', q:{pt:'Posso pausar ou cancelar a subscrição?',en:'Can I pause or cancel my subscription?'},
    a:{pt:'Sim, a qualquer momento e sem fidelização, na sua conta ou por telefone.',
       en:'Yes, at any time, with no lock-in, in your account or by phone.'} },
  { k:'descobertas', cat:'sub', q:{pt:'O que são as Descobertas da Estação?',en:'What are Seasonal Discoveries?'},
    a:{pt:'Em cada caixa juntamos um produto da época que talvez ainda não conheça, com uma sugestão de receita escrita pelo agricultor.',
       en:'Each box includes one seasonal product you may not know yet, with a recipe idea written by the farmer.'} },
  { k:'conta', cat:'sub', q:{pt:'Preciso de conta para subscrever?',en:'Do I need an account to subscribe?'},
    a:{pt:'Sim. Entre com o seu nome de utilizador ou telemóvel e a palavra-passe. Na conta vê as suas subscrições e as inscrições no Colhe Connosco.',
       en:'Yes. Sign in with your username or mobile number and password. Your account shows your subscriptions and Join the Harvest sign-ups.'} },
  { k:'colhe', cat:'prod', q:{pt:'Como funciona o Colhe Connosco?',en:'How does Join the Harvest work?'},
    a:{pt:'Em dias marcados, algumas quintas abrem as portas. Inscreve-se na sua conta, traz os seus sacos, colhe e paga o peso à saída.',
       en:'On set days, some farms open their gates. You sign up in your account, bring your bags, pick, and pay by weight on the way out.'} },
  { k:'agricultor', cat:'parc', q:{pt:'Sou agricultor. Como posso vender na Daqui?',en:'I am a farmer. How can I sell on Daqui?'},
    a:{pt:'Preencha o formulário na página Agricultores ou ligue-nos. Um agente de campo visita a sua exploração e regista os seus produtos consigo.',
       en:'Fill in the form on the Farmers page or call us. A field agent visits your farm and lists your produce with you.'} },
  { k:'selo', cat:'parc', q:{pt:'O que é o Selo Daqui?',en:'What is the Daqui seal?'},
    a:{pt:'É um selo para restaurantes que compram pela Daqui. Mostra aos clientes a quinta e a data de colheita dos ingredientes e é verificado por uma entidade certificadora independente.',
       en:'A seal for restaurants that buy through Daqui. It shows diners the farm and harvest date of the ingredients and is checked by an independent certification body.'} }
];

/* ---------- Informação extra por tipo de produto (aba "Mais sobre o produto") ---------- */
const GROUP_OF = {
  'pera-rocha':'pomoideas','maca-gala':'pomoideas','maca-golden':'pomoideas','maca-fuji':'pomoideas','maca-reineta':'pomoideas','maca-bravo-esmolfe':'pomoideas','marmelo':'pomoideas',
  'kiwi':'kiwi','diospiro':'kiwi','laranja':'citrinos','tangerina':'citrinos','clementina':'citrinos','limao':'citrinos',
  'abacate':'tropicais','banana-madeira':'tropicais','maracuja':'tropicais','anona':'tropicais','roma':'tropicais','nespera':'caroco',
  'cereja':'caroco','pessego':'caroco','nectarina':'caroco','ameixa':'caroco','alperce':'caroco','figo':'caroco',
  'melao':'meloes','meloa':'meloes','melancia':'meloes','uva-branca':'uvas','uva-tinta':'uvas',
  'morango':'bagas','mirtilo':'bagas','framboesa':'bagas','amora':'bagas','castanha':'frutos-secos','noz':'frutos-secos',
  'batata':'tuberculos','batata-vermelha':'tuberculos','batata-doce':'tuberculos','cebola':'bolbos','cebola-roxa':'bolbos','alho':'bolbos','alho-frances':'bolbos',
  'cenoura':'raizes','beterraba':'raizes','nabo':'raizes','rabanete':'raizes',
  'nabicas':'folhas','grelos':'folhas','espinafres':'folhas','agriao':'folhas','rucula':'folhas','couve-galega':'folhas',
  'alface':'folhas','alface-romana':'folhas','alface-iceberg':'folhas',
  'salsa':'ervas','coentros':'ervas','hortela':'ervas',
  'couve-portuguesa':'couves','couve-coracao':'couves','couve-lombarda':'couves','couve-roxa':'couves','couve-flor':'couves','brocolos':'couves',
  'tomate':'frutos-horticolas','tomate-cherry':'frutos-horticolas','tomate-chucha':'frutos-horticolas','courgette':'frutos-horticolas','pepino':'frutos-horticolas','beringela':'frutos-horticolas','pimento-verde':'frutos-horticolas','pimento-vermelho':'frutos-horticolas',
  'abobora':'aboboras','abobora-manteiga':'aboboras','feijao-verde':'vagens','ervilhas':'vagens','favas':'vagens','milho-doce':'vagens',
  'espargos':'caules','aipo':'caules','funcho':'caules',
  'lima':'citrinos','toranja':'citrinos','ameixa-rainha-claudia':'caroco','uva-moscatel':'uvas','physalis':'bagas','medronho':'bagas',
  'pimento-amarelo':'frutos-horticolas','malagueta':'frutos-horticolas','couve-de-bruxelas':'couves','acelga':'folhas','chuchu':'frutos-horticolas','manjericao':'ervas'
};
const GROUP_TIPS = {
  pomoideas:   { keep:{pt:'Na gaveta do frigorífico duram 2 a 4 semanas. Afaste-as de outros frutos: libertam etileno e aceleram o amadurecimento.',en:'They keep 2 to 4 weeks in the fridge drawer. Keep them away from other fruit: they release ethylene and speed up ripening.'}, pick:{pt:'Pele lisa, sem manchas moles, e firme ao toque.',en:'Smooth skin, no soft spots, firm to the touch.'}, use:{pt:'Ao natural, assadas, em compotas e tartes.',en:'Fresh, baked, in jams and tarts.'} },
  kiwi:        { keep:{pt:'Amadurecem à temperatura ambiente; depois de maduros, guarde no frigorífico até uma semana.',en:'They ripen at room temperature; once ripe, keep in the fridge for up to a week.'}, pick:{pt:'Devem ceder ligeiramente quando pressionados.',en:'They should give slightly when pressed.'}, use:{pt:'Ao natural, em saladas de fruta e batidos.',en:'Fresh, in fruit salads and smoothies.'} },
  citrinos:    { keep:{pt:'À temperatura ambiente uma semana; no frigorífico até três.',en:'A week at room temperature; up to three in the fridge.'}, pick:{pt:'Pesados para o tamanho, sinal de que têm muito sumo.',en:'Heavy for their size, a sign of plenty of juice.'}, use:{pt:'Sumos, saladas, sobremesas e temperos.',en:'Juices, salads, desserts and seasoning.'} },
  tropicais:   { keep:{pt:'Fora do frigorífico até amadurecerem. A banana não deve ir ao frigorífico.',en:'Keep out of the fridge until ripe. Bananas should not go in the fridge.'}, pick:{pt:'Sem pancadas; o aroma indica a maturação.',en:'No bruises; the smell tells you how ripe they are.'}, use:{pt:'Ao natural, em batidos e sobremesas.',en:'Fresh, in smoothies and desserts.'} },
  caroco:      { keep:{pt:'Amadurecem fora do frigorífico; depois, 2 a 3 dias no frio.',en:'They ripen out of the fridge; then 2 to 3 days in the cold.'}, pick:{pt:'Perfumados e a ceder ligeiramente junto ao pé.',en:'Fragrant and slightly soft near the stem.'}, use:{pt:'Ao natural, em tartes, compotas e saladas.',en:'Fresh, in tarts, jams and salads.'} },
  meloes:      { keep:{pt:'Inteiros, fora do frigorífico; depois de abertos, tapados no frigorífico até 3 dias.',en:'Whole, out of the fridge; once cut, covered in the fridge for up to 3 days.'}, pick:{pt:'Pesados, com aroma doce junto ao pé.',en:'Heavy, with a sweet smell near the stem.'}, use:{pt:'Ao natural, com presunto ou em sumos.',en:'Fresh, with cured ham or in juices.'} },
  uvas:        { keep:{pt:'No frigorífico, sem lavar, até uma semana.',en:'In the fridge, unwashed, for up to a week.'}, pick:{pt:'Cachos firmes, com o engaço verde.',en:'Firm bunches with green stems.'}, use:{pt:'Ao natural ou com queijo.',en:'Fresh or with cheese.'} },
  bagas:       { keep:{pt:'No frigorífico, sem lavar, 2 a 4 dias. Lave só antes de comer.',en:'In the fridge, unwashed, 2 to 4 days. Wash just before eating.'}, pick:{pt:'Brilhantes, secas e sem bolor.',en:'Shiny, dry and mould-free.'}, use:{pt:'Ao natural, com iogurte ou em bolos.',en:'Fresh, with yoghurt or in cakes.'} },
  'frutos-secos': { keep:{pt:'Em local fresco e seco. As castanhas aguentam uma semana no frigorífico.',en:'In a cool, dry place. Chestnuts keep a week in the fridge.'}, pick:{pt:'Casca brilhante, sem furos.',en:'Shiny shell, no holes.'}, use:{pt:'Assadas, cozidas, em doces e saladas.',en:'Roasted, boiled, in sweets and salads.'} },
  tuberculos:  { keep:{pt:'Em local fresco, escuro e arejado, longe das cebolas.',en:'In a cool, dark, airy place, away from onions.'}, pick:{pt:'Firmes, sem rebentos nem zonas verdes.',en:'Firm, with no sprouts or green patches.'}, use:{pt:'Cozidas, assadas, fritas e em puré.',en:'Boiled, roasted, fried and mashed.'} },
  bolbos:      { keep:{pt:'Em local seco e arejado; o alho-francês no frigorífico até uma semana.',en:'In a dry, airy place; leeks in the fridge for up to a week.'}, pick:{pt:'Firmes e sem rebentos.',en:'Firm and not sprouting.'}, use:{pt:'A base de quase todos os refogados.',en:'The base of almost every Portuguese sauté.'} },
  raizes:      { keep:{pt:'No frigorífico, sem as folhas, até duas semanas.',en:'In the fridge, leaves removed, for up to two weeks.'}, pick:{pt:'Firmes e de cor intensa.',en:'Firm and deeply coloured.'}, use:{pt:'Cruas raladas, em sopas e assadas.',en:'Grated raw, in soups and roasted.'} },
  folhas:      { keep:{pt:'No frigorífico, num saco com um pano húmido, 3 a 5 dias.',en:'In the fridge, in a bag with a damp cloth, 3 to 5 days.'}, pick:{pt:'Folhas viçosas, sem partes amarelas.',en:'Crisp leaves with no yellow patches.'}, use:{pt:'Saladas, sopas e salteados.',en:'Salads, soups and stir-fries.'} },
  ervas:       { keep:{pt:'Como um ramo de flores: num copo com água, no frigorífico.',en:'Like a bunch of flowers: in a glass of water, in the fridge.'}, pick:{pt:'Aromáticas e sem folhas murchas.',en:'Fragrant, with no wilted leaves.'}, use:{pt:'Para temperar no fim da cozedura.',en:'To season at the end of cooking.'} },
  couves:      { keep:{pt:'No frigorífico, inteiras, até uma semana.',en:'Whole, in the fridge, for up to a week.'}, pick:{pt:'Pesadas e com folhas firmes.',en:'Heavy, with firm leaves.'}, use:{pt:'Cozidas, salteadas, em sopas e no forno.',en:'Boiled, sautéed, in soups and roasted.'} },
  'frutos-horticolas': { keep:{pt:'O tomate fora do frigorífico; pimentos, courgette e pepino na gaveta até uma semana.',en:'Tomatoes out of the fridge; peppers, courgettes and cucumbers in the drawer for up to a week.'}, pick:{pt:'Pele lisa e brilhante, firmes ao toque.',en:'Smooth, shiny skin, firm to the touch.'}, use:{pt:'Saladas, grelhados, molhos e assados.',en:'Salads, grills, sauces and roasts.'} },
  aboboras:    { keep:{pt:'Inteiras, em local fresco, até três meses; às fatias, no frigorífico 4 a 5 dias.',en:'Whole, in a cool place, up to three months; sliced, in the fridge 4 to 5 days.'}, pick:{pt:'Casca dura e pé seco.',en:'Hard skin and a dry stem.'}, use:{pt:'Sopas, doces, assados e risotos.',en:'Soups, jams, roasts and risottos.'} },
  vagens:      { keep:{pt:'No frigorífico 2 a 4 dias; congelam bem depois de branqueadas.',en:'In the fridge 2 to 4 days; they freeze well once blanched.'}, pick:{pt:'Vagens firmes e de cor viva.',en:'Firm, brightly coloured pods.'}, use:{pt:'Cozidas, salteadas e em guisados.',en:'Boiled, sautéed and in stews.'} },
  caules:      { keep:{pt:'No frigorífico, envoltos num pano húmido, até uma semana.',en:'In the fridge, wrapped in a damp cloth, for up to a week.'}, pick:{pt:'Firmes e sem fibras secas.',en:'Firm, with no dry fibres.'}, use:{pt:'Crus, assados ou em sopas.',en:'Raw, roasted or in soups.'} },
  fruta:       { keep:{pt:'Guarde em local fresco; no frigorífico depois de madura.',en:'Keep somewhere cool; in the fridge once ripe.'}, pick:{pt:'Firme, perfumada e sem pancadas.',en:'Firm, fragrant and unbruised.'}, use:{pt:'Ao natural, em sobremesas e saladas.',en:'Fresh, in desserts and salads.'} },
  legumes:     { keep:{pt:'No frigorífico, na gaveta dos legumes.',en:'In the fridge, in the vegetable drawer.'}, pick:{pt:'Firme e de cor viva.',en:'Firm and brightly coloured.'}, use:{pt:'Em sopas, salteados e assados.',en:'In soups, stir-fries and roasts.'} },
  caixas:      { keep:{pt:'Arrume a fruta à temperatura ambiente e os legumes de folha no frigorífico logo que receber a caixa.',en:'Put fruit at room temperature and leafy greens in the fridge as soon as the box arrives.'}, pick:{pt:'A composição muda todas as semanas, conforme o que está na época.',en:'The selection changes every week, according to what is in season.'}, use:{pt:'Cada caixa traz uma ficha com sugestões de receitas.',en:'Every box comes with a card of recipe ideas.'} }
};

/* centro aproximado de cada região: usado para pôr no mapa as quintas novas aprovadas na gestão */
const REGION_CENTER = { minho:[41.7,-8.4], douro:[41.15,-8.0], tras:[41.6,-7.0], aveiro:[40.6,-8.6], beiras:[40.4,-7.6], coimbra:[40.2,-8.4], leiria:[39.75,-8.8], oeste:[39.3,-9.15], ribatejo:[39.25,-8.6],
  lisboa:[38.7,-9.0], alentejo:[38.5,-7.9], algarve:[37.15,-8.2], madeira:[32.72,-16.95], acores:[37.78,-25.55] };
