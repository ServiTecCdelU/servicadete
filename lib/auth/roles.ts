export const ROLES = ['superadmin', 'admin', 'cadete', 'comercio'] as const
export type Rol = (typeof ROLES)[number]

export const HOME_POR_ROL: Record<Rol, string> = {
  superadmin: '/superadmin',
  admin: '/admin',
  cadete: '/cadete',
  comercio: '/comercio',
}

// Prefijo de ruta → rol que puede entrar.
export const RUTAS_PROTEGIDAS: ReadonlyArray<readonly [string, Rol]> = [
  ['/superadmin', 'superadmin'],
  ['/admin', 'admin'],
  ['/cadete', 'cadete'],
  ['/comercio', 'comercio'],
]

export function esRol(value: unknown): value is Rol {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value)
}

export function rolRequerido(pathname: string): Rol | null {
  const match = RUTAS_PROTEGIDAS.find(
    ([prefijo]) => pathname === prefijo || pathname.startsWith(`${prefijo}/`),
  )
  return match ? match[1] : null
}
