-- =====================================================================================
-- Daqui — 09: inventário (entregas dos agricultores), Saldo Daqui, Cooperativa, promoções,
--             notificações (sininho), avaliações de produtos, portes e definições da gestão.
-- Correr DEPOIS do 08 (SQL Editor → colar → Run). Pode correr-se outra vez sem estragar nada.
-- =====================================================================================

-- ---------- definições da gestão (portes, quota, bloqueio das entregas) ----------
create table if not exists public.definicoes (
  chave      text primary key,
  valor      jsonb not null,
  atualizado timestamptz not null default now()
);
alter table public.definicoes enable row level security;
drop policy if exists "definições: todos leem" on public.definicoes;
drop policy if exists "definições: gestão altera" on public.definicoes;
create policy "definições: todos leem" on public.definicoes for select using (true);
create policy "definições: gestão altera" on public.definicoes for all to authenticated using (public.eh_admin()) with check (public.eh_admin());
insert into public.definicoes (chave, valor) values
  ('geral', '{"homeFee": 3.90, "pointFee": 1.90, "freeFrom": 25, "coopFee": 30, "coopFreeShipping": true, "lockLots": false}')
on conflict (chave) do nothing;
create or replace function public.daqui_def(k text) returns jsonb language sql stable security definer set search_path = public as $$
  select valor -> k from public.definicoes where chave = 'geral';
$$;

-- ---------- perfis: NIF, dados de faturação e Cooperativa ----------
alter table public.perfis add column if not exists nif text;
alter table public.perfis add column if not exists faturacao jsonb;          -- {"name": "...", "address": "...", "postal": "...", "town": "..."}
alter table public.perfis add column if not exists cooperativa_ate date;     -- membro da Cooperativa até esta data (quota anual)

create or replace function public.proteger_perfil() returns trigger
language plpgsql set search_path = public as $$
begin
  new.atualizado := now();
  if not public.vem_do_site() or public.eh_admin() then return new; end if;
  new.id := old.id; new.username := old.username; new.papel := old.papel; new.criado := old.criado;
  new.cooperativa_ate := old.cooperativa_ate;                                  -- só muda pagando a quota (pagar_quota)
  if new.nif is not null then new.nif := nullif(regexp_replace(new.nif, '\D', '', 'g'), ''); end if;
  if old.parceiro is null then new.parceiro := null;
  else
    new.parceiro := (coalesce(new.parceiro, '{}'::jsonb) - 'approved' - 'farmerId' - 'restId')
      || jsonb_strip_nulls(jsonb_build_object('approved', old.parceiro->'approved', 'farmerId', old.parceiro->'farmerId', 'restId', old.parceiro->'restId'));
  end if;
  return new;
end $$;

-- e-mail novo: o login por nome de utilizador procura o e-mail em perfis; enquanto o e-mail novo
-- não está confirmado no Supabase Auth, continua a valer o do Auth
create or replace function public.email_para_login(p_login text, p_tel text default '') returns text
language sql stable security definer set search_path = public, auth as $$
  select coalesce(u.email, p.email) from public.perfis p left join auth.users u on u.id = p.id
   where p.username = lower(trim(p_login)) or lower(p.email) = lower(trim(p_login)) or lower(u.email) = lower(trim(p_login))
      or (coalesce(p_tel, '') <> '' and p.telemovel = p_tel)
   limit 1;
$$;

-- ---------- agricultor: muda também região, posição no mapa, "agricultor desde" e foto de capa ----------
create or replace function public.proteger_agricultor() returns trigger
language plpgsql set search_path = public as $$
declare q text := new.quinta; l text := new.localidade; hp text := new.historia_pt; he text := new.historia_en;
        rg text := new.regiao; la double precision := new.lat; lo double precision := new.lon; ds int := new.desde; ex jsonb := new.extra;
begin
  if not public.vem_do_site() or public.eh_admin() then return new; end if;
  new := old; new.quinta := q; new.localidade := l; new.historia_pt := hp; new.historia_en := he;
  new.regiao := rg; new.lat := la; new.lon := lo;
  if ds between 1900 and extract(year from now())::int then new.desde := ds; end if;
  new.extra := coalesce(old.extra, '{}') - 'cover' - 'island' || jsonb_strip_nulls(jsonb_build_object('cover', ex->'cover', 'island', ex->'island'));
  return new;
end $$;

-- ---------- restaurante: escolhe o tipo de cozinha da lista (extra.cuisine) e marca pratos vegetarianos/vegan ----------
create or replace function public.proteger_restaurante() returns trigger
language plpgsql set search_path = public as $$
declare a text := new.tipo_pt; b text := new.tipo_en; c text := new.zona_pt; d text := new.zona_en;
        e text := new.prato_pt; f text := new.prato_en; g jsonb := new.pratos; ex jsonb := new.extra;
begin
  if not public.vem_do_site() or public.eh_admin() then return new; end if;
  new := old; new.tipo_pt := a; new.tipo_en := b; new.zona_pt := c; new.zona_en := d; new.prato_pt := e; new.prato_en := f; new.pratos := g;
  new.extra := coalesce(old.extra, '{}') - 'cuisine' - 'dishVeg' - 'dishVegan' || jsonb_strip_nulls(jsonb_build_object('cuisine', ex->'cuisine', 'dishVeg', ex->'dishVeg', 'dishVegan', ex->'dishVegan'));
  return new;
end $$;

-- ---------- caixas: as 4 caixas da Daqui também passam a ter linha aqui (produtos e modo editáveis) ----------
alter table public.caixas add column if not exists modo text not null default 'fixo';   -- 'fixo' (lista) ou 'favoritos' (escolhidos entre os favoritos do cliente)
alter table public.caixas add column if not exists base boolean not null default false; -- true: uma das caixas da Daqui (não se apaga)

-- ---------- registo da colheita (Colhe Connosco): só no próprio dia ----------
create or replace function public.daqui_registo_no_dia() returns trigger
language plpgsql set search_path = public as $$
begin
  if public.vem_do_site() and new.registo is distinct from old.registo
     and (select dia from public.dias_colhe where id = new.dia_id) <> current_date then
    raise exception 'O registo da colheita só pode ser feito ou alterado no próprio dia do Colhe Connosco.';
  end if;
  return new;
end $$;
drop trigger if exists daqui_registo_no_dia on public.inscricoes_colhe;
create trigger daqui_registo_no_dia before update on public.inscricoes_colhe for each row execute function public.daqui_registo_no_dia();

-- =====================================================================================
-- INVENTÁRIO: cada entrega de um agricultor à Daqui é um lote (produto, quantidade, data de colheita).
-- O stock de um produto é a soma do que falta vender em todos os lotes. As encomendas e as caixas
-- preparadas tiram dos lotes mais antigos primeiro.
-- =====================================================================================
create table if not exists public.lotes (
  id         text primary key default ('L-' || substr(md5(random()::text || clock_timestamp()::text), 1, 10)),
  agricultor text not null references public.agricultores(id) on update cascade on delete cascade,
  produto    text not null references public.produtos(id) on update cascade on delete cascade,
  quantidade numeric(10,2) not null check (quantidade > 0),
  vendido    numeric(10,2) not null default 0,
  colheita   date not null,
  frio       boolean not null default false,
  analise    boolean not null default false,
  transporte text not null default 'proprio' check (transporte in ('proprio', 'recolha')),
  recolha    date,
  criado     timestamptz not null default now(),
  atualizado timestamptz not null default now()
);
create index if not exists lotes_produto on public.lotes (produto, colheita);
alter table public.lotes enable row level security;
drop policy if exists "lotes: todos leem" on public.lotes;
drop policy if exists "lotes: agricultor cria" on public.lotes;
drop policy if exists "lotes: agricultor muda" on public.lotes;
drop policy if exists "lotes: agricultor apaga" on public.lotes;
drop policy if exists "lotes: gestão" on public.lotes;
create policy "lotes: todos leem" on public.lotes for select using (true);
create policy "lotes: agricultor cria" on public.lotes for insert to authenticated with check (agricultor = public.meu_agricultor());
create policy "lotes: agricultor muda" on public.lotes for update to authenticated using (agricultor = public.meu_agricultor()) with check (agricultor = public.meu_agricultor());
create policy "lotes: agricultor apaga" on public.lotes for delete to authenticated using (agricultor = public.meu_agricultor() and vendido = 0);
create policy "lotes: gestão" on public.lotes for all to authenticated using (public.eh_admin()) with check (public.eh_admin());

create or replace function public.proteger_lote() returns trigger
language plpgsql set search_path = public as $$
begin
  new.atualizado := now();
  if not public.vem_do_site() or public.eh_admin() then
    if new.quantidade < new.vendido then raise exception 'A quantidade não pode ser menor do que o que já foi vendido (%).', new.vendido; end if;
    return new;
  end if;
  if tg_op = 'INSERT' then new.vendido := 0; new.criado := now(); return new; end if;
  new.id := old.id; new.agricultor := old.agricultor; new.produto := old.produto; new.vendido := old.vendido; new.criado := old.criado;
  if coalesce((public.daqui_def('lockLots'))::boolean, false) then
    new.quantidade := old.quantidade; new.colheita := old.colheita;     -- a gestão bloqueou alterações às entregas submetidas
  end if;
  if new.quantidade < new.vendido then raise exception 'A quantidade não pode ser menor do que o que já foi vendido (%).', new.vendido; end if;
  return new;
end $$;
drop trigger if exists proteger_lote on public.lotes;
create trigger proteger_lote before insert or update on public.lotes for each row execute function public.proteger_lote();

-- lotes iniciais: cada agricultor entregou 100 (kg, unidades ou molhos) de cada produto que vende,
-- com a data de colheita que o produto já tinha
do $$
begin
  if not exists (select 1 from public.lotes) then
    insert into public.lotes (agricultor, produto, quantidade, colheita, frio)
    select o->>'farmer', p.id, 100,
           case when p.colheita ~ '^\d+$' then current_date - p.colheita::int
                when p.colheita ~ '^\d{2}-\d{2}$' then
                  case when make_date(extract(year from current_date)::int, split_part(p.colheita, '-', 1)::int, split_part(p.colheita, '-', 2)::int) > current_date
                       then make_date(extract(year from current_date)::int - 1, split_part(p.colheita, '-', 1)::int, split_part(p.colheita, '-', 2)::int)
                       else make_date(extract(year from current_date)::int, split_part(p.colheita, '-', 1)::int, split_part(p.colheita, '-', 2)::int) end
                else current_date - 3 end,
           p.colheita ~ '^\d{2}-\d{2}$'
      from public.produtos p, jsonb_array_elements(coalesce(p.produtores, '[]')) o
     where exists (select 1 from public.agricultores a where a.id = o->>'farmer');
  end if;
end $$;

-- tirar do stock: lotes mais antigos primeiro; devolve [{"lote": id, "qtd": n}] ou dá erro se não houver que chegue
create or replace function public.daqui_tirar_stock(p_produto text, p_qtd numeric) returns jsonb
language plpgsql security definer set search_path = public as $$
declare l record; falta numeric := p_qtd; tira numeric; res jsonb := '[]'; total numeric;
begin
  if p_qtd is null or p_qtd <= 0 then return res; end if;
  if not exists (select 1 from public.lotes where produto = p_produto) then return res; end if;   -- produto sem lotes: não controla stock
  select coalesce(sum(quantidade - vendido), 0) into total from public.lotes where produto = p_produto;
  if total < p_qtd then
    raise exception 'stock:%:%', p_produto, trim(to_char(total, 'FM999990.##'));
  end if;
  for l in select * from public.lotes where produto = p_produto and quantidade > vendido order by colheita, criado for update loop
    exit when falta <= 0;
    tira := least(falta, l.quantidade - l.vendido);
    update public.lotes set vendido = vendido + tira where id = l.id;
    res := res || jsonb_build_object('lote', l.id, 'qtd', tira);
    falta := falta - tira;
  end loop;
  return res;
end $$;
create or replace function public.daqui_devolver_stock(p_lotes jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare x jsonb;
begin
  for x in select * from jsonb_array_elements(coalesce(p_lotes, '[]')) loop
    update public.lotes set vendido = greatest(0, vendido - (x->>'qtd')::numeric) where id = x->>'lote';
  end loop;
end $$;
revoke all on function public.daqui_tirar_stock(text, numeric), public.daqui_devolver_stock(jsonb) from public, anon, authenticated;

-- ---------- encomendas: portes, caixas de cartão, saldo, promoção e lotes usados ----------
alter table public.encomendas add column if not exists cartao   numeric(8,2) not null default 0;   -- caixas de cartão (5 kg 0,85 €; 10 kg 1,00 €)
alter table public.encomendas add column if not exists saldo    numeric(8,2) not null default 0;   -- parte paga com o Saldo Daqui
alter table public.encomendas add column if not exists desconto numeric(8,2) not null default 0;
alter table public.encomendas add column if not exists promo    text;
alter table public.encomendas add column if not exists lotes    jsonb;

-- =====================================================================================
-- SALDO DAQUI E COOPERATIVA: cada movimento fica registado (é também o que aparece nas faturas)
-- =====================================================================================
create table if not exists public.movimentos (
  id        bigint generated always as identity primary key,
  user_id   uuid not null references public.perfis(id) on delete cascade,
  tipo      text not null check (tipo in ('carregamento', 'compra', 'quota', 'reembolso', 'promo')),
  descricao text not null default '',
  valor     numeric(8,2) not null,           -- valor total da operação
  saldo     numeric(8,2) not null default 0, -- efeito no Saldo Daqui (+ carrega, - gasta)
  metodo    text,                            -- 'mbway', 'cartao', 'multibanco', 'saldo'…
  ref       text,                            -- encomenda, ano da quota…
  criado    timestamptz not null default now()
);
create index if not exists movimentos_user on public.movimentos (user_id, criado);
alter table public.movimentos enable row level security;
drop policy if exists "movimentos: o próprio ou a gestão" on public.movimentos;
create policy "movimentos: o próprio ou a gestão" on public.movimentos for select to authenticated using (user_id = auth.uid() or public.eh_admin());

create or replace function public.daqui_saldo(p_user uuid) returns numeric language sql stable security definer set search_path = public as $$
  select coalesce(sum(saldo), 0) from public.movimentos where user_id = p_user;
$$;
create or replace function public.carregar_saldo(p_valor numeric, p_metodo text) returns numeric
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Inicie sessão.'; end if;
  if p_valor is null or p_valor < 5 or p_valor > 500 then raise exception 'O carregamento tem de ser entre 5 € e 500 €.'; end if;
  if p_metodo not in ('mbway', 'cartao', 'multibanco') then raise exception 'Método de pagamento inválido.'; end if;
  insert into public.movimentos (user_id, tipo, descricao, valor, saldo, metodo) values (auth.uid(), 'carregamento', 'Carregamento do Saldo Daqui', round(p_valor, 2), round(p_valor, 2), p_metodo);
  return public.daqui_saldo(auth.uid());
end $$;
create or replace function public.pagar_quota(p_metodo text) returns date
language plpgsql security definer set search_path = public as $$
declare q numeric := coalesce((public.daqui_def('coopFee'))::numeric, 30); ate date; ini date;
begin
  if auth.uid() is null then raise exception 'Inicie sessão.'; end if;
  if p_metodo not in ('mbway', 'cartao', 'multibanco', 'saldo') then raise exception 'Método de pagamento inválido.'; end if;
  if p_metodo = 'saldo' and public.daqui_saldo(auth.uid()) < q then raise exception 'saldo-insuficiente'; end if;
  select greatest(coalesce(cooperativa_ate, current_date), current_date) into ini from public.perfis where id = auth.uid();
  ate := (ini + interval '1 year')::date;
  insert into public.movimentos (user_id, tipo, descricao, valor, saldo, metodo, ref)
  values (auth.uid(), 'quota', 'Quota anual da Cooperativa Daqui', q, case when p_metodo = 'saldo' then -q else 0 end, p_metodo, to_char(ini, 'YYYY-MM-DD') || '/' || to_char(ate, 'YYYY-MM-DD'));
  update public.perfis set cooperativa_ate = ate where id = auth.uid();
  return ate;
end $$;
grant execute on function public.carregar_saldo(numeric, text), public.pagar_quota(text) to authenticated;

-- =====================================================================================
-- PROMOÇÕES E CÓDIGOS PROMOCIONAIS
-- =====================================================================================
create table if not exists public.promocoes (
  id        text primary key default ('PR-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8))),
  titulo_pt text not null, titulo_en text not null default '',
  texto_pt  text not null default '', texto_en text not null default '',
  tipo      text not null check (tipo in ('percent', 'valor', 'portes')),
  valor     numeric(8,2) not null default 0,
  minimo    numeric(8,2) not null default 0,
  ate       date not null,
  codigo    text unique,
  publica   boolean not null default true,   -- aparece no sininho de todos; false: só com o código
  ativa     boolean not null default true,
  criada    timestamptz not null default now()
);
create table if not exists public.promos_utilizador (
  user_id   uuid not null references public.perfis(id) on delete cascade,
  promo     text not null references public.promocoes(id) on delete cascade,
  reclamada timestamptz not null default now(),
  usada     timestamptz,
  encomenda text,
  primary key (user_id, promo)
);
alter table public.promocoes enable row level security;
alter table public.promos_utilizador enable row level security;
drop policy if exists "promoções: ver" on public.promocoes;
drop policy if exists "promoções: gestão" on public.promocoes;
drop policy if exists "promoções reclamadas: o próprio ou a gestão" on public.promos_utilizador;
create or replace function public.daqui_reclamei(p text) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.promos_utilizador where promo = p and user_id = auth.uid());
$$;
grant execute on function public.daqui_reclamei(text) to anon, authenticated;
create policy "promoções: ver" on public.promocoes for select using (public.eh_admin() or (publica and ativa) or public.daqui_reclamei(id));
create policy "promoções: gestão" on public.promocoes for all to authenticated using (public.eh_admin()) with check (public.eh_admin());
create policy "promoções reclamadas: o próprio ou a gestão" on public.promos_utilizador for select to authenticated using (user_id = auth.uid() or public.eh_admin());

-- reclamar uma promoção do sininho (p_promo) ou com um código (p_codigo); devolve o id da promoção
create or replace function public.reclamar_promo(p_promo text default null, p_codigo text default null) returns text
language plpgsql security definer set search_path = public as $$
declare pr public.promocoes;
begin
  if auth.uid() is null then raise exception 'Inicie sessão.'; end if;
  if coalesce(p_codigo, '') <> '' then select * into pr from public.promocoes where upper(codigo) = upper(trim(p_codigo));
  else select * into pr from public.promocoes where id = p_promo and publica; end if;
  if pr.id is null or not pr.ativa then raise exception 'promo-invalida'; end if;
  if pr.ate < current_date then raise exception 'promo-expirada'; end if;
  insert into public.promos_utilizador (user_id, promo) values (auth.uid(), pr.id) on conflict do nothing;
  return pr.id;
end $$;
grant execute on function public.reclamar_promo(text, text) to authenticated;

-- =====================================================================================
-- NOTIFICAÇÕES (sininho): tudo o que já ia por notificação para o telemóvel fica também aqui
-- =====================================================================================
create table if not exists public.notificacoes (
  id        bigint generated always as identity primary key,
  user_id   uuid not null references public.perfis(id) on delete cascade,
  titulo_pt text not null, texto_pt text not null default '',
  titulo_en text not null, texto_en text not null default '',
  rota      text,
  promo     text references public.promocoes(id) on delete cascade,
  lida      boolean not null default false,
  criada    timestamptz not null default now()
);
create index if not exists notificacoes_user on public.notificacoes (user_id, criada desc);
alter table public.notificacoes enable row level security;
drop policy if exists "notificações: o próprio" on public.notificacoes;
drop policy if exists "notificações: marcar lida" on public.notificacoes;
drop policy if exists "notificações: apagar" on public.notificacoes;
create policy "notificações: o próprio" on public.notificacoes for select to authenticated using (user_id = auth.uid());
create policy "notificações: marcar lida" on public.notificacoes for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "notificações: apagar" on public.notificacoes for delete to authenticated using (user_id = auth.uid());

create or replace function public.daqui_avisar(p_quem uuid[], p_tpt text, p_cpt text, p_ten text, p_cen text, p_rota text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_quem is null or cardinality(p_quem) = 0 then return; end if;
  begin
    insert into public.notificacoes (user_id, titulo_pt, texto_pt, titulo_en, texto_en, rota)
    select q, coalesce(p_tpt, ''), coalesce(p_cpt, ''), coalesce(p_ten, p_tpt, ''), coalesce(p_cen, p_cpt, ''), p_rota
      from unnest(p_quem) q where exists (select 1 from public.perfis where id = q);
  exception when others then raise warning 'Daqui: notificação não guardada: %', sqlerrm;
  end;
  if to_regprocedure('public.daqui_enviar(jsonb)') is null or to_regprocedure('public.daqui_msgs(uuid[],text,text,text,text,text)') is null then return; end if;
  execute 'select public.daqui_enviar(public.daqui_msgs($1, $2, $3, $4, $5, $6))' using p_quem, p_tpt, p_cpt, p_ten, p_cen, p_rota;
exception when others then
  raise warning 'Daqui: aviso não enviado: %', sqlerrm;
end $$;
revoke all on function public.daqui_avisar(uuid[], text, text, text, text, text) from public, anon, authenticated;

-- promoção pública nova: aparece no sininho de todos os clientes
create or replace function public.daqui_notificar_promo() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.publica and new.ativa and (tg_op = 'INSERT' or not old.publica or not old.ativa) then
    insert into public.notificacoes (user_id, titulo_pt, texto_pt, titulo_en, texto_en, rota, promo)
    select id, new.titulo_pt, new.texto_pt, coalesce(nullif(new.titulo_en, ''), new.titulo_pt), coalesce(nullif(new.texto_en, ''), new.texto_pt), '/notificacoes', new.id
      from public.perfis where papel = 'cliente';
    if to_regprocedure('public.daqui_enviar(jsonb)') is not null and to_regprocedure('public.daqui_msgs(uuid[],text,text,text,text,text)') is not null then
      begin
        execute 'select public.daqui_enviar(public.daqui_msgs($1, $2, $3, $4, $5, $6))'
          using array(select id from public.perfis where papel = 'cliente'), new.titulo_pt, new.texto_pt, coalesce(nullif(new.titulo_en, ''), new.titulo_pt), coalesce(nullif(new.texto_en, ''), new.texto_pt), '/notificacoes';
      exception when others then raise warning 'Daqui: promoção não enviada: %', sqlerrm;
      end;
    end if;
  end if;
  return new;
end $$;
drop trigger if exists daqui_notificar_promo on public.promocoes;
create trigger daqui_notificar_promo after insert or update on public.promocoes for each row execute function public.daqui_notificar_promo();

-- =====================================================================================
-- ENCOMENDA NOVA: confirma o stock (lotes mais antigos primeiro), o saldo e a promoção, tudo de uma vez.
-- Se duas pessoas comprarem o último quilo ao mesmo tempo, a segunda recebe o erro "stock:…".
-- =====================================================================================
create or replace function public.daqui_encomenda_stock() returns trigger
language plpgsql security definer set search_path = public as $$
declare a jsonb; usados jsonb := '[]'; pr public.promocoes; disp numeric;
begin
  if tg_op = 'INSERT' then
    for a in select * from jsonb_array_elements(coalesce(new.artigos, '[]')) loop
      if exists (select 1 from public.produtos where id = a->>'id') and coalesce((a->>'qty')::numeric, 0) > 0 then
        usados := usados || public.daqui_tirar_stock(a->>'id', (a->>'qty')::numeric);
      end if;
    end loop;
    new.lotes := usados;
    if coalesce(new.saldo, 0) > 0 then
      if new.user_id is null or new.user_id is distinct from auth.uid() and not public.eh_admin() then raise exception 'saldo-sem-conta'; end if;
      disp := public.daqui_saldo(new.user_id);
      if disp < new.saldo then raise exception 'saldo-insuficiente:%', disp; end if;
      insert into public.movimentos (user_id, tipo, descricao, valor, saldo, metodo, ref)
      values (new.user_id, 'compra', 'Encomenda ' || new.num, new.total, -new.saldo, 'saldo', new.num);
    end if;
    if new.promo is not null then
      select * into pr from public.promocoes where id = new.promo;
      if pr.id is null or not pr.ativa or pr.ate < current_date
         or not exists (select 1 from public.promos_utilizador where user_id = new.user_id and promo = new.promo and usada is null) then
        new.promo := null; new.desconto := 0;
      else
        update public.promos_utilizador set usada = now(), encomenda = new.num where user_id = new.user_id and promo = new.promo;
      end if;
    end if;
    return new;
  end if;
  -- cancelada: o stock volta aos lotes e o saldo usado volta à conta
  if new.estado = 'cancelada' and old.estado <> 'cancelada' then
    perform public.daqui_devolver_stock(old.lotes);
    new.lotes := '[]';
    if coalesce(old.saldo, 0) > 0 and old.user_id is not null then
      insert into public.movimentos (user_id, tipo, descricao, valor, saldo, metodo, ref)
      values (old.user_id, 'reembolso', 'Encomenda ' || old.num || ' cancelada', old.saldo, old.saldo, 'saldo', old.num);
    end if;
    if old.promo is not null and old.user_id is not null then
      update public.promos_utilizador set usada = null, encomenda = null where user_id = old.user_id and promo = old.promo;
    end if;
  else
    new.lotes := old.lotes; new.saldo := old.saldo; new.promo := old.promo;
  end if;
  return new;
end $$;
drop trigger if exists daqui_encomenda_stock on public.encomendas;
create trigger daqui_encomenda_stock before insert or update on public.encomendas for each row execute function public.daqui_encomenda_stock();

-- =====================================================================================
-- CAIXAS PREPARADAS: no dia antes da entrega, a gestão escolhe (ou aceita a sugestão d)os produtos de cada caixa
-- =====================================================================================
create table if not exists public.preparacoes (
  id         text primary key,                -- '<subscrição>-<data>'
  subscricao text not null references public.subscricoes(id) on delete cascade,
  user_id    uuid references public.perfis(id) on delete cascade,
  data       date not null,
  artigos    jsonb not null default '[]',     -- [{"id": "pera-rocha", "qty": 1.5}]
  lotes      jsonb not null default '[]',
  criada     timestamptz not null default now()
);
alter table public.preparacoes enable row level security;
drop policy if exists "preparações: gestão" on public.preparacoes;
drop policy if exists "preparações: o cliente vê" on public.preparacoes;
create policy "preparações: gestão" on public.preparacoes for all to authenticated using (public.eh_admin()) with check (public.eh_admin());
create policy "preparações: o cliente vê" on public.preparacoes for select to authenticated using (user_id = auth.uid());
create or replace function public.daqui_preparacao_stock() returns trigger
language plpgsql security definer set search_path = public as $$
declare a jsonb; usados jsonb := '[]';
begin
  if tg_op in ('UPDATE', 'DELETE') then perform public.daqui_devolver_stock(old.lotes); end if;
  if tg_op = 'DELETE' then return old; end if;
  for a in select * from jsonb_array_elements(coalesce(new.artigos, '[]')) loop
    if exists (select 1 from public.produtos where id = a->>'id') and coalesce((a->>'qty')::numeric, 0) > 0 then
      usados := usados || public.daqui_tirar_stock(a->>'id', (a->>'qty')::numeric);
    end if;
  end loop;
  new.lotes := usados;
  return new;
end $$;
drop trigger if exists daqui_preparacao_stock on public.preparacoes;
create trigger daqui_preparacao_stock before insert or update or delete on public.preparacoes for each row execute function public.daqui_preparacao_stock();

-- =====================================================================================
-- AVALIAÇÕES DE PRODUTOS E CAIXAS: só quem comprou e já recebeu (etapa 3); a gestão responde
-- =====================================================================================
create table if not exists public.avaliacoes_produtos (
  id         bigint generated always as identity primary key,
  produto    text not null references public.produtos(id) on update cascade on delete cascade,
  user_id    uuid not null references public.perfis(id) on delete cascade,
  nome       text not null default '',
  estrelas   int not null check (estrelas between 1 and 5),
  comentario text not null default '',
  criada     timestamptz not null default now(),
  resposta   text,
  respondida timestamptz,
  unique (produto, user_id)
);
alter table public.avaliacoes_produtos drop constraint if exists avaliacoes_produtos_produto_fkey;   -- as caixas também se avaliam (não estão em produtos)
alter table public.avaliacoes_produtos enable row level security;
drop policy if exists "avaliações: o próprio ou a gestão" on public.avaliacoes_produtos;
drop policy if exists "avaliações: quem comprou" on public.avaliacoes_produtos;
drop policy if exists "avaliações: gestão responde" on public.avaliacoes_produtos;
create policy "avaliações: o próprio ou a gestão" on public.avaliacoes_produtos for select to authenticated using (user_id = auth.uid() or public.eh_admin());
create policy "avaliações: quem comprou" on public.avaliacoes_produtos for insert to authenticated with check (user_id = auth.uid());
create policy "avaliações: gestão responde" on public.avaliacoes_produtos for update to authenticated using (public.eh_admin()) with check (public.eh_admin());

create or replace function public.daqui_comprou(p_user uuid, p_produto text) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.encomendas e
                  where e.user_id = p_user and e.estado = 'ativa'
                    and (e.etapa = 3 or (e.etapa is null and e.data_entrega < current_date))
                    and e.artigos @> jsonb_build_array(jsonb_build_object('id', p_produto)))
      or exists (select 1 from public.preparacoes pr join public.subscricoes s on s.id = pr.subscricao
                  where pr.user_id = p_user and pr.data < current_date and (s.caixa = p_produto or pr.artigos @> jsonb_build_array(jsonb_build_object('id', p_produto))));
$$;
create or replace function public.proteger_avaliacao() returns trigger
language plpgsql set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    if public.vem_do_site() and not public.eh_admin() and not public.daqui_comprou(new.user_id, new.produto) then
      raise exception 'Só pode avaliar produtos que já recebeu.';
    end if;
    new.nome := coalesce((select split_part(btrim(nome), ' ', 1) from public.perfis where id = new.user_id), '');
    new.comentario := left(btrim(coalesce(new.comentario, '')), 600); new.criada := now(); new.resposta := null; new.respondida := null;
    return new;
  end if;
  new.id := old.id; new.produto := old.produto; new.user_id := old.user_id; new.nome := old.nome; new.estrelas := old.estrelas; new.comentario := old.comentario; new.criada := old.criada;
  new.resposta := nullif(left(btrim(coalesce(new.resposta, '')), 600), '');
  new.respondida := case when new.resposta is null then null when new.resposta is distinct from old.resposta then now() else old.respondida end;
  return new;
end $$;
drop trigger if exists proteger_avaliacao on public.avaliacoes_produtos;
create trigger proteger_avaliacao before insert or update on public.avaliacoes_produtos for each row execute function public.proteger_avaliacao();

-- leitura pública: sem ids de contas, só o primeiro nome; "minha" diz se a avaliação é da conta que está a ver
create or replace view public.avaliacoes_publicas as
  select id, produto, nome, estrelas, comentario, criada, resposta, respondida, (user_id = auth.uid()) as minha
    from public.avaliacoes_produtos;
grant select on public.avaliacoes_publicas to anon, authenticated;

-- resposta da gestão: avisa quem avaliou
create or replace function public.daqui_notificar_resposta_produto() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.resposta is not null and new.resposta is distinct from old.resposta then
    perform public.daqui_avisar(array[new.user_id], 'A Daqui respondeu à sua avaliação', left(new.resposta, 120),
      'Daqui replied to your review', left(new.resposta, 120), '/produto/' || new.produto);
  end if;
  return new;
end $$;
drop trigger if exists daqui_notificar_resposta_produto on public.avaliacoes_produtos;
create trigger daqui_notificar_resposta_produto after update on public.avaliacoes_produtos for each row execute function public.daqui_notificar_resposta_produto();

-- =====================================================================================
-- permissões das tabelas novas (as regras de cima decidem o que cada conta vê e muda)
-- =====================================================================================
grant select on public.definicoes, public.lotes, public.promocoes to anon, authenticated;
grant insert, update, delete on public.definicoes, public.lotes, public.promocoes, public.preparacoes, public.notificacoes, public.avaliacoes_produtos to authenticated;
grant select on public.movimentos, public.promos_utilizador, public.notificacoes, public.preparacoes, public.avaliacoes_produtos to authenticated;
grant execute on function public.daqui_def(text) to anon, authenticated;

-- restaurantes de exemplo: tipo de cozinha e pratos vegetarianos/vegan
update public.restaurantes r set extra = coalesce(r.extra, '{}') || x.e
  from (values ('mesa-da-ria', '{"cuisine": "peixe"}'::jsonb), ('tasca-da-horta', '{"cuisine": "portuguesa"}'), ('moliceiro-verde', '{"cuisine": "vegetariana", "dishVeg": true}'),
               ('sal-e-campo', '{"cuisine": "bistro", "dishVeg": true, "dishVegan": true}'), ('fonte-nova', '{"cuisine": "autor"}'), ('cantina-do-parque', '{"cuisine": "pastelaria", "dishVeg": true}'),
               ('cafe-campus', '{"cuisine": "cafe", "dishVeg": true, "dishVegan": true}'), ('estacao-74', '{"cuisine": "petiscos", "dishVeg": true, "dishVegan": true}')) as x(id, e)
 where r.id = x.id and coalesce(r.extra->>'cuisine', '') = '';

-- =====================================================================================
-- tempo real para as tabelas novas
-- =====================================================================================
do $$
declare t text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach t in array array['lotes', 'definicoes', 'promocoes', 'avaliacoes_produtos', 'notificacoes', 'movimentos', 'preparacoes'] loop
      if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
        execute format('alter publication supabase_realtime add table public.%I', t);
      end if;
    end loop;
  end if;
end $$;
