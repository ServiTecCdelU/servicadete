-- El comercio necesita ver los cadetes activos de su mensajería para poder elegir
-- uno (opcional) al pedir. Mismo criterio que ya existe al revés (cadete ve comercios).
drop policy cadetes_select on public.cadetes;
create policy cadetes_select on public.cadetes for select to authenticated using (
  (mensajeria_id = (select private.mi_mensajeria()) and (select private.mi_rol()) = 'admin')
  or (mensajeria_id = (select private.mi_mensajeria()) and (select private.mi_rol()) = 'comercio' and activo)
  or perfil_id = (select auth.uid())
);
