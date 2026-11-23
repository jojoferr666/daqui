-- =====================================================================================
-- Daqui — 10: estados novos das encomendas ("Preparada" e "Em distribuição"), todas as encomendas e caixas
--             passam por "Preparar caixas", caixas das subscrições nas encomendas, avisos para a gestão,
--             avaliações que o cliente pode editar ou apagar, pino dos restaurantes e vendas de cada agricultor.
-- Correr DEPOIS do 09 (SQL Editor → colar → Run). Pode correr-se outra vez sem estragar nada.
-- =====================================================================================

-- ---------- etapas das encomendas: 0 Recebida, 1 Em preparação, 2 Preparada, 3 Em distribuição, 4 Entregue/Levantada ----------
alter table public.encomendas drop constraint if exists encomendas_etapa_check;
alter table public.encomendas add constraint encomendas_etapa_check check (etapa between 0 and 4);
-- as encomendas que já existiam passam para a numeração nova (só uma vez; os avisos ficam desligados durante a mudança)
do $$
begin
  if not exists (select 1 from public.definicoes where chave = 'migracao-etapas-v12') then
    alter table public.encomendas disable trigger user;
    update public.encomendas set etapa = etapa + 1 where etapa >= 2;
    alter table public.encomendas enable trigger user;
    insert into public.definicoes (chave, valor) values ('migracao-etapas-v12', 'true');
  end if;
end $$;

-- o cliente pode mudar o dia ou cancelar enquanto a encomenda não está preparada, e confirmar o levantamento
create or replace function public.proteger_encomenda() returns trigger
language plpgsql set search_path = public as $$
declare d date := new.data_entrega; dd text := new.dia; e text := new.estado; et int := new.etapa;
begin
  new.atualizada := now();
  if not public.vem_do_site() or public.eh_admin() then return new; end if;
  if tg_op = 'INSERT' then new.estado := 'ativa'; new.etapa := null; new.criada := now(); return new; end if;
  new := old; new.atualizada := now();
  if coalesce(old.etapa, 0) <= 1 then new.data_entrega := d; new.dia := dd; if e = 'cancelada' then new.estado := 'cancelada'; end if; end if;
  if et = 4 and old.entrega = 'pickup' and old.estado = 'ativa' and (old.data_entrega <= current_date or old.etapa = 3) then new.etapa := 4; end if;
  return new;
end $$;
create or replace function public.confirmar_levantamento(p_num text, p_tel text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare r public.encomendas;
begin
  update public.encomendas set etapa = 4
   where num = upper(p_num) and telemovel = p_tel and entrega = 'pickup' and estado = 'ativa'
     and (data_entrega <= current_date or etapa = 3)
  returning * into r;
  if r.num is null then return null; end if;
  return to_jsonb(r) - 'user_id';
end $$;
create or replace function public.gerir_encomenda(p_num text, p_tel text, p_data date default null, p_dia text default null, p_cancelar boolean default false) returns jsonb
language plpgsql security definer set search_path = public as $$
declare r public.encomendas;
begin
  update public.encomendas
     set data_entrega = coalesce(p_data, data_entrega), dia = coalesce(p_dia, dia),
         estado = case when p_cancelar then 'cancelada' else estado end
   where num = upper(p_num) and telemovel = p_tel and estado = 'ativa' and coalesce(etapa, 0) <= 1
  returning * into r;
  if r.num is null then return null; end if;
  return to_jsonb(r) - 'user_id';
end $$;
grant execute on function public.confirmar_levantamento(text, text), public.gerir_encomenda(text, text, date, text, boolean) to anon, authenticated;

create or replace function public.daqui_admins() returns uuid[] language sql stable security definer set search_path = public as $$
  select coalesce(array_agg(id), '{}') from public.perfis where papel = 'admin';
$$;
create or replace function public.daqui_eur(v numeric) returns text language sql immutable as $$
  select replace(to_char(coalesce(v, 0), 'FM999990.00'), '.', ',') || ' €';
$$;

-- avisos das encomendas: o cliente (estado mudado pela Daqui) e a gestão (encomenda nova, cancelada ou levantada)
create or replace function public.daqui_notificar_encomenda() returns trigger
language plpgsql security definer set search_path = public as $$
declare pt_e text; en_e text; pt_t text; en_t text; quem uuid := auth.uid();
begin
  if tg_op = 'INSERT' then
    perform public.daqui_avisar(public.daqui_admins(), 'Nova encomenda ' || new.num,
      new.nome || ', ' || public.daqui_eur(new.total) || ', entrega a ' || to_char(new.data_entrega, 'DD/MM') || case when new.entrega = 'pickup' then ' (' || coalesce(new.ponto, '') || ')' else ' (em casa)' end || '.',
      'New order ' || new.num, new.nome || ', ' || public.daqui_eur(new.total) || ', delivery on ' || to_char(new.data_entrega, 'DD/MM') || '.', '/g/encomendas');
    return new;
  end if;
  if new.estado is not distinct from old.estado and new.etapa is not distinct from old.etapa then return new; end if;
  if new.estado = 'cancelada' then pt_e := 'Cancelada'; en_e := 'Cancelled'; pt_t := 'A encomenda foi cancelada.'; en_t := 'The order was cancelled.';
  elsif new.etapa is null then return new;
  elsif new.etapa = 0 then pt_e := 'Recebida'; en_e := 'Received'; pt_t := 'Recebemos a sua encomenda.'; en_t := 'We received your order.';
  elsif new.etapa = 1 then pt_e := 'Em preparação'; en_e := 'Being packed'; pt_t := 'Já estamos a preparar a sua encomenda.'; en_t := 'We are packing your order.';
  elsif new.etapa = 2 then pt_e := 'Preparada'; en_e := 'Packed'; pt_t := 'A sua encomenda está pronta e segue na próxima distribuição.'; en_t := 'Your order is packed and goes out on the next delivery run.';
  elsif new.etapa = 3 and new.entrega = 'pickup' then pt_e := 'Em distribuição'; en_e := 'Out for delivery';
    pt_t := 'Já pode levantar em ' || coalesce(new.ponto, '') || '. No ponto de recolha, deslize para confirmar.'; en_t := 'You can collect it at ' || coalesce(new.ponto, '') || '. At the pick-up point, swipe to confirm.';
  elsif new.etapa = 3 then pt_e := 'Em distribuição'; en_e := 'Out for delivery';
    pt_t := 'Vai a caminho' || coalesce(', ' || nullif(new.janela, ''), '') || '.'; en_t := 'On its way' || coalesce(', ' || nullif(new.janela, ''), '') || '.';
  else
    pt_e := case when new.entrega = 'pickup' then 'Levantada' else 'Entregue' end; en_e := case when new.entrega = 'pickup' then 'Collected' else 'Delivered' end;
    pt_t := 'Bom proveito! Já pode avaliar os produtos na app ou no site.'; en_t := 'Enjoy! You can now review the products in the app or on the website.';
  end if;
  if new.user_id is not null and quem is distinct from new.user_id then
    perform public.daqui_avisar(array[new.user_id], 'Encomenda ' || new.num || ': ' || pt_e, pt_t, 'Order ' || new.num || ': ' || en_e, en_t, '/encomenda/' || new.num);
  end if;
  if quem is not null and quem = new.user_id and (new.estado = 'cancelada' or new.etapa = 4) then
    perform public.daqui_avisar(public.daqui_admins(), 'Encomenda ' || new.num || ': ' || pt_e,
      new.nome || case when new.estado = 'cancelada' then ' cancelou a encomenda.' else ' confirmou o levantamento.' end,
      'Order ' || new.num || ': ' || en_e, new.nome || case when new.estado = 'cancelada' then ' cancelled the order.' else ' confirmed collection.' end, '/g/encomendas');
  end if;
  return new;
end $$;
drop trigger if exists daqui_notificar_encomenda on public.encomendas;
create trigger daqui_notificar_encomenda after insert or update on public.encomendas for each row execute function public.daqui_notificar_encomenda();

-- =====================================================================================
-- PREPARAR CAIXAS: cada caixa (de uma subscrição ou comprada à unidade numa encomenda) tem uma linha com o
-- conteúdo escolhido pela gestão e a sua etapa (2 Preparada, 3 Em distribuição, 4 Entregue)
-- =====================================================================================
alter table public.preparacoes alter column subscricao drop not null;
alter table public.preparacoes add column if not exists encomenda text references public.encomendas(num) on delete cascade;
alter table public.preparacoes add column if not exists caixa text;
alter table public.preparacoes add column if not exists tamanho text;
alter table public.preparacoes add column if not exists etapa int not null default 2 check (etapa between 2 and 4);
update public.preparacoes p set caixa = s.caixa, tamanho = s.tamanho from public.subscricoes s where s.id = p.subscricao and p.caixa is null;

-- o stock só volta a ser calculado quando o conteúdo muda (mudar a etapa não mexe no stock)
create or replace function public.daqui_preparacao_stock() returns trigger
language plpgsql security definer set search_path = public as $$
declare a jsonb; usados jsonb := '[]';
begin
  if tg_op = 'UPDATE' and new.artigos is not distinct from old.artigos then new.lotes := old.lotes; return new; end if;
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

-- avisos ao cliente sobre a caixa da subscrição (o conteúdo só se revela depois de entregue)
create or replace function public.daqui_notificar_caixa() returns trigger
language plpgsql security definer set search_path = public as $$
declare pt text; en text;
begin
  if new.subscricao is null or new.user_id is null then return new; end if;
  if tg_op = 'UPDATE' and new.etapa is not distinct from old.etapa then return new; end if;
  pt := case new.etapa when 2 then 'A sua caixa está preparada' when 3 then 'A sua caixa está em distribuição' else 'A sua caixa foi entregue' end;
  en := case new.etapa when 2 then 'Your box is packed' when 3 then 'Your box is out for delivery' else 'Your box was delivered' end;
  perform public.daqui_avisar(array[new.user_id], pt,
    case when new.etapa = 4 then 'Já pode ver o que veio na caixa e avaliar os produtos.' else 'Entrega a ' || to_char(new.data, 'DD/MM') || '. O conteúdo é surpresa até chegar!' end,
    en, case when new.etapa = 4 then 'You can now see what was in the box and review the products.' else 'Delivery on ' || to_char(new.data, 'DD/MM') || '. What is inside stays a surprise until it arrives!' end,
    '/conta/encomendas');
  return new;
end $$;
drop trigger if exists daqui_notificar_caixa on public.preparacoes;
create trigger daqui_notificar_caixa after insert or update on public.preparacoes for each row execute function public.daqui_notificar_caixa();

-- quem comprou pode avaliar: encomenda entregue/levantada (etapa 4) ou caixa entregue
create or replace function public.daqui_comprou(p_user uuid, p_produto text) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.encomendas e
                  where e.user_id = p_user and e.estado = 'ativa'
                    and (e.etapa = 4 or (e.etapa is null and e.data_entrega < current_date))
                    and e.artigos @> jsonb_build_array(jsonb_build_object('id', p_produto)))
      or exists (select 1 from public.preparacoes pr
                  where pr.user_id = p_user and (pr.etapa = 4 or pr.data < current_date)
                    and (pr.caixa = p_produto or pr.artigos @> jsonb_build_array(jsonb_build_object('id', p_produto))));
$$;

-- =====================================================================================
-- AVISOS PARA A GESTÃO: entregas dos agricultores, avaliações novas e caixas a preparar (48 horas antes)
-- =====================================================================================
create or replace function public.daqui_notificar_lote() returns trigger
language plpgsql security definer set search_path = public as $$
declare a text; p text; u text;
begin
  if public.eh_admin() then return new; end if;
  select nome into a from public.agricultores where id = new.agricultor;
  select nome_pt, unidade into p, u from public.produtos where id = new.produto;
  perform public.daqui_avisar(public.daqui_admins(), 'Entrega nova: ' || coalesce(p, new.produto),
    coalesce(a, new.agricultor) || ': ' || trim(to_char(new.quantidade, 'FM999990.##')) || ' ' || coalesce(u, '') || ', colhido a ' || to_char(new.colheita, 'DD/MM') ||
      case when new.transporte = 'recolha' then '. Recolher na quinta a ' || to_char(new.recolha, 'DD/MM') || '.' else '. Entrega na central.' end,
    'New supply: ' || coalesce(p, new.produto), coalesce(a, new.agricultor) || ': ' || trim(to_char(new.quantidade, 'FM999990.##')) || ' ' || coalesce(u, '') || ', picked on ' || to_char(new.colheita, 'DD/MM') || '.',
    '/g/inventario');
  return new;
end $$;
drop trigger if exists daqui_notificar_lote on public.lotes;
create trigger daqui_notificar_lote after insert on public.lotes for each row execute function public.daqui_notificar_lote();

create or replace function public.daqui_notificar_avaliacao() returns trigger
language plpgsql security definer set search_path = public as $$
declare p text;
begin
  select nome_pt into p from public.produtos where id = new.produto;
  perform public.daqui_avisar(public.daqui_admins(), 'Avaliação nova: ' || coalesce(p, new.produto) || ' (' || new.estrelas || '★)',
    new.nome || coalesce(': ' || nullif(left(new.comentario, 100), ''), '.'), 'New review: ' || coalesce(p, new.produto) || ' (' || new.estrelas || '★)',
    new.nome || coalesce(': ' || nullif(left(new.comentario, 100), ''), '.'), '/produto/' || new.produto);
  return new;
end $$;
drop trigger if exists daqui_notificar_avaliacao on public.avaliacoes_produtos;
create trigger daqui_notificar_avaliacao after insert on public.avaliacoes_produtos for each row execute function public.daqui_notificar_avaliacao();

-- todos os dias às 9h: se daqui a 2 dias há distribuição (quinta ou sábado), diz à gestão quanto há para preparar
create or replace function public.daqui_aviso_preparar() returns void
language plpgsql security definer set search_path = public as $$
declare d date := current_date + 2; nsub int; nenc int; ncx int;
begin
  if extract(dow from d) not in (4, 6) then return; end if;
  select count(*) into nsub from public.subscricoes s
   where s.estado = 'ativa' and d >= s.primeira and (d - s.primeira) % (case s.frequencia when 'quinz' then 14 when 'mens' then 28 else 7 end) = 0;
  select count(*), coalesce(sum((select count(*) from jsonb_array_elements(e.artigos) x where x->>'id' like 'caixa-%' or not exists (select 1 from public.produtos where id = x->>'id'))), 0)
    into nenc, ncx from public.encomendas e where e.data_entrega = d and e.estado = 'ativa' and coalesce(e.etapa, 0) < 2;
  if nsub + nenc = 0 then return; end if;
  perform public.daqui_avisar(public.daqui_admins(), 'Preparar para ' || public.daqui_data(d, 'pt'),
    nsub || case when nsub = 1 then ' caixa de subscrição' else ' caixas de subscrição' end || ', ' || nenc || case when nenc = 1 then ' encomenda' else ' encomendas' end ||
      case when ncx > 0 then ' (' || ncx || case when ncx = 1 then ' caixa avulsa)' else ' caixas avulsas)' end else '' end || '. Abra "Preparar caixas".',
    'To prepare for ' || public.daqui_data(d, 'en'), nsub || ' subscription boxes, ' || nenc || ' orders. Open "Prepare boxes".', '/g/preparar');
end $$;
revoke all on function public.daqui_aviso_preparar() from public, anon, authenticated;
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule('daqui-preparar') where exists (select 1 from cron.job where jobname = 'daqui-preparar');
    perform cron.schedule('daqui-preparar', '0 9 * * *', 'select public.daqui_aviso_preparar()');
  end if;
end $$;

-- lembretes da véspera (versão com o sininho e as etapas novas)
create or replace function public.daqui_lembretes() returns void
language plpgsql security definer set search_path = public as $$
declare r record; amanha date := current_date + 1; m int := extract(month from current_date)::int;
begin
  for r in select * from public.encomendas where data_entrega = amanha and estado = 'ativa' and coalesce(etapa, 0) < 4 and user_id is not null loop
    perform public.daqui_avisar(array[r.user_id], 'Amanhã: encomenda ' || r.num,
      case when r.entrega = 'pickup' then 'Levantamento em ' || coalesce(r.ponto, '') || case when extract(dow from amanha) = 4 then ', 16h–20h.' else ', 9h–13h.' end else 'Entrega em casa' || coalesce(', ' || nullif(r.janela, ''), '') || '.' end,
      'Tomorrow: order ' || r.num,
      case when r.entrega = 'pickup' then 'Collect it at ' || coalesce(r.ponto, '') || case when extract(dow from amanha) = 4 then ', 4–8 pm.' else ', 9 am–1 pm.' end else 'Home delivery' || coalesce(', ' || nullif(r.janela, ''), '') || '.' end,
      '/encomenda/' || r.num);
  end loop;
  for r in select s.* from public.subscricoes s
            where s.estado = 'ativa' and amanha >= s.primeira and (amanha - s.primeira) % (case s.frequencia when 'quinz' then 14 when 'mens' then 28 else 7 end) = 0 loop
    perform public.daqui_avisar(array[r.user_id], 'Amanhã chega a sua caixa Daqui',
      case when r.entrega = 'pickup' then 'Levantamento em ' || r.ponto || '.' else 'Entrega em casa.' end || ' O conteúdo é surpresa!',
      'Your Daqui box arrives tomorrow', case when r.entrega = 'pickup' then 'Collect it at ' || r.ponto || '.' else 'Home delivery.' end || ' What is inside is a surprise!', '/conta/encomendas');
  end loop;
  for r in select d.id, d.horario, d.produto_pt, d.produto_en, a.quinta, array_agg(i.user_id) as quem
             from public.dias_colhe d join public.inscricoes_colhe i on i.dia_id = d.id left join public.agricultores a on a.id = d.agricultor
            where d.dia = amanha group by d.id, d.horario, d.produto_pt, d.produto_en, a.quinta loop
    perform public.daqui_avisar(r.quem, 'Amanhã: Colhe Connosco', coalesce(r.quinta, '') || ', ' || r.horario || '. Vamos colher ' || lower(r.produto_pt) || '.',
      'Tomorrow: Join the Harvest', coalesce(r.quinta, '') || ', ' || r.horario || '. We are picking ' || lower(r.produto_en) || '.', '/conta/colhe');
  end loop;
  if extract(day from current_date) = 1 then
    for r in select * from public.produtos where epoca_inicio = m and not fora_stock loop
      perform public.daqui_avisar(array(select id from public.perfis where r.id = any(avisos)), 'Voltou à época: ' || r.nome_pt, 'Já pode encomendar na Daqui.',
        'Back in season: ' || r.nome_en, 'You can order it on Daqui now.', '/produto/' || r.id);
    end loop;
  end if;
end $$;
revoke all on function public.daqui_lembretes() from public, anon, authenticated;

-- =====================================================================================
-- AVALIAÇÕES: o cliente pode editar (estrelas e comentário) ou apagar as suas; a gestão só responde
-- =====================================================================================
drop policy if exists "avaliações: o próprio edita" on public.avaliacoes_produtos;
drop policy if exists "avaliações: o próprio apaga" on public.avaliacoes_produtos;
create policy "avaliações: o próprio edita" on public.avaliacoes_produtos for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "avaliações: o próprio apaga" on public.avaliacoes_produtos for delete to authenticated using (user_id = auth.uid() or public.eh_admin());
create or replace function public.proteger_avaliacao() returns trigger
language plpgsql set search_path = public as $$
declare st int := new.estrelas; co text := new.comentario; re text := new.resposta;
begin
  if tg_op = 'INSERT' then
    if public.vem_do_site() and not public.eh_admin() and not public.daqui_comprou(new.user_id, new.produto) then
      raise exception 'Só pode avaliar produtos que já recebeu.';
    end if;
    new.nome := coalesce((select split_part(btrim(nome), ' ', 1) from public.perfis where id = new.user_id), '');
    new.comentario := left(btrim(coalesce(new.comentario, '')), 600); new.criada := now(); new.resposta := null; new.respondida := null;
    return new;
  end if;
  new := old;
  if public.eh_admin() or not public.vem_do_site() then
    new.resposta := nullif(left(btrim(coalesce(re, '')), 600), '');
    new.respondida := case when new.resposta is null then null when new.resposta is distinct from old.resposta then now() else old.respondida end;
  end if;
  if old.user_id = auth.uid() or not public.vem_do_site() then
    if st between 1 and 5 then new.estrelas := st; end if;
    new.comentario := left(btrim(coalesce(co, '')), 600);
  end if;
  return new;
end $$;

-- =====================================================================================
-- RESTAURANTE: também muda a posição do seu pino no mapa de Aveiro
-- =====================================================================================
create or replace function public.proteger_restaurante() returns trigger
language plpgsql set search_path = public as $$
declare a text := new.tipo_pt; b text := new.tipo_en; c text := new.zona_pt; d text := new.zona_en;
        e text := new.prato_pt; f text := new.prato_en; g jsonb := new.pratos; ex jsonb := new.extra; la double precision := new.lat; lo double precision := new.lon;
begin
  if not public.vem_do_site() or public.eh_admin() then return new; end if;
  new := old; new.tipo_pt := a; new.tipo_en := b; new.zona_pt := c; new.zona_en := d; new.prato_pt := e; new.prato_en := f; new.pratos := g;
  if la between 40.55 and 40.72 and lo between -8.76 and -8.55 then new.lat := la; new.lon := lo; end if;   -- só dentro da zona de Aveiro
  new.extra := coalesce(old.extra, '{}') - 'cuisine' - 'dishVeg' - 'dishVegan' || jsonb_strip_nulls(jsonb_build_object('cuisine', ex->'cuisine', 'dishVeg', ex->'dishVeg', 'dishVegan', ex->'dishVegan'));
  return new;
end $$;

-- =====================================================================================
-- VENDAS DE CADA AGRICULTOR (para as notas de pagamento): o que saiu dos seus lotes em encomendas e caixas
-- =====================================================================================
create or replace function public.agricultor_vendas(p_agricultor text default null) returns table (data date, ref text, produto text, qtd numeric, preco numeric, tipo text)
language sql stable security definer set search_path = public as $$
  with quem as (select case when public.eh_admin() and p_agricultor is not null then p_agricultor else public.meu_agricultor() end as a),
  meus as (select l.id from public.lotes l, quem where l.agricultor = quem.a)
  select e.data_entrega, e.num, l.produto, (x->>'qtd')::numeric,
         coalesce((select (i->>'price')::numeric from jsonb_array_elements(e.artigos) i where i->>'id' = l.produto limit 1), pr.preco), 'encomenda'
    from public.encomendas e, jsonb_array_elements(coalesce(e.lotes, '[]')) x, public.lotes l, public.produtos pr
   where e.estado = 'ativa' and l.id = x->>'lote' and l.id in (select id from meus) and pr.id = l.produto
  union all
  select p.data, p.id, l.produto, (x->>'qtd')::numeric, pr.preco, 'caixa'
    from public.preparacoes p, jsonb_array_elements(coalesce(p.lotes, '[]')) x, public.lotes l, public.produtos pr
   where l.id = x->>'lote' and l.id in (select id from meus) and pr.id = l.produto;
$$;
grant execute on function public.agricultor_vendas(text) to authenticated;
