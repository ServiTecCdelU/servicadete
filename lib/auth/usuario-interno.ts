import 'server-only'

// Cadetes y comercios no tienen email propio: entran con "usuario" + PIN.
// Puertas adentro siguen siendo un email+password de Supabase Auth, con un dominio
// que no existe (nunca se les manda un mail real, así que no gastan la cuota de envíos).
const DOMINIO_INTERNO = 'servicadete.local'

export function emailInterno(usuario: string): string {
  return `${usuario.toLowerCase()}@${DOMINIO_INTERNO}`
}

export function esUsuarioInterno(email: string): boolean {
  return email.toLowerCase().endsWith(`@${DOMINIO_INTERNO}`)
}

// El "usuario" incluye el slug de la mensajería, así alcanza con un solo campo en el
// login (no hace falta preguntar a qué mensajería pertenece). nombre-apellido.slug
export function usuarioBase(nombre: string, slug: string): string {
  const persona = nombre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30)
  return `${persona || 'usuario'}.${slug}`
}

export function usuarioConSufijo(base: string, intento: number): string {
  return intento === 0 ? base : `${base}${intento + 1}`
}
