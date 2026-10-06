-- Promueve a superadmin a un usuario que ya existe en auth.users.
-- El usuario se crea antes con la Auth Admin API (email confirmado, sin contraseña);
-- al entrar con Google, Supabase vincula esa identidad al mismo usuario por email.
insert into public.perfiles (user_id, mensajeria_id, rol, nombre)
select id, null, 'superadmin', 'Superadmin'
from auth.users
where email = 'informaticabalbin@gmail.com'
on conflict (user_id) do update set rol = 'superadmin', mensajeria_id = null;
