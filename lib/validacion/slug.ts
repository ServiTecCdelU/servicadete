export const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/
export const SLUGS_RESERVADOS = new Set([
  'login',
  'auth',
  'admin',
  'superadmin',
  'cadete',
  'comercio',
  'api',
  'envio',
])
