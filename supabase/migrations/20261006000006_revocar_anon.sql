-- Supabase otorga EXECUTE a anon/authenticated en cada función nueva de public
-- (default privileges), así que "revoke ... from public" no alcanza.
-- Las RPCs de usuarios logueados no deben ser invocables por anon.
revoke execute on function
  public.tomar_envio(uuid), public.kpis_hoy(), public.resumen_cadete(),
  public.liquidacion_semana(date), public.mensajerias_con_envios_mes(), public.fecha_operativa()
from anon;
