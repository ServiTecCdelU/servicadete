-- Landing pública por mensajería (/[slug]): un eslogan corto editable desde
-- Configuración, además del nombre y el logo que ya existían.
alter table public.mensajerias add column eslogan text check (eslogan is null or length(eslogan) <= 140);

drop function public.mensajeria_publica(text);

create function public.mensajeria_publica(p_slug text)
returns table (nombre text, logo_url text, eslogan text)
language sql stable security definer set search_path = '' as $$
  select m.nombre, m.logo_url, m.eslogan from public.mensajerias m
  where m.slug = lower(p_slug) and m.activa
$$;

grant execute on function public.mensajeria_publica(text) to anon, authenticated;
