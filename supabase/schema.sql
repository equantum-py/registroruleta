-- Ejecutar desde Supabase SQL Editor. Funciones accesibles SOLO al backend service_role.
create table if not exists public.participantes_ruleta (
 id uuid primary key default gen_random_uuid(),
 nombre text not null check (char_length(nombre) between 2 and 60),
 apellido text not null check (char_length(apellido) between 2 and 60),
 iglesia text not null check (char_length(iglesia) between 2 and 100),
 sorteado boolean not null default false,
 fecha_registro timestamptz not null default now(),
 fecha_sorteo timestamptz
);
create unique index if not exists participantes_ruleta_unicos
 on public.participantes_ruleta (lower(btrim(nombre)),lower(btrim(apellido)),lower(btrim(iglesia)));
alter table public.participantes_ruleta enable row level security;
revoke all on public.participantes_ruleta from public,anon,authenticated;
create or replace function public.registrar_participante(p_nombre text,p_apellido text,p_iglesia text)
returns void language plpgsql security definer set search_path = '' as $$
begin
 if length(btrim(p_nombre)) not between 2 and 60
 or length(btrim(p_apellido)) not between 2 and 60
 or length(btrim(p_iglesia)) not between 2 and 100 then
 raise exception 'Datos inválidos' using errcode = '22023';
 end if;
 insert into public.participantes_ruleta(nombre,apellido,iglesia)
 values (btrim(p_nombre),btrim(p_apellido),btrim(p_iglesia));
end; $$;
create or replace function public.listar_participantes()
returns table (id uuid,nombre text,apellido text,iglesia text,sorteado boolean)
language sql security definer set search_path = '' stable as $$
 select p.id,p.nombre,p.apellido,p.iglesia,p.sorteado
 from public.participantes_ruleta p order by p.fecha_registro,p.id;
$$;
create or replace function public.sortear_participante()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare elegido public.participantes_ruleta%rowtype;
begin
 perform pg_catalog.pg_advisory_xact_lock(428001);
 select * into elegido from public.participantes_ruleta
 where not sorteado order by random() limit 1 for update;
 if not found then return null; end if;
 update public.participantes_ruleta
 set sorteado=true,fecha_sorteo=now() where id=elegido.id;
 return jsonb_build_object('id',elegido.id,'nombre',elegido.nombre,
 'apellido',elegido.apellido,'iglesia',elegido.iglesia);
end; $$;
create or replace function public.reiniciar_sorteo()
returns void language sql security definer set search_path = '' as $$
 update public.participantes_ruleta set sorteado=false,fecha_sorteo=null where sorteado=true;
$$;
revoke all on function public.registrar_participante(text,text,text) from public,anon,authenticated;
revoke all on function public.listar_participantes() from public,anon,authenticated;
revoke all on function public.sortear_participante() from public,anon,authenticated;
revoke all on function public.reiniciar_sorteo() from public,anon,authenticated;
grant execute on function public.registrar_participante(text,text,text) to service_role;
grant execute on function public.listar_participantes() to service_role;
grant execute on function public.sortear_participante() to service_role;
grant execute on function public.reiniciar_sorteo() to service_role;