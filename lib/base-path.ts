// Next prefija el basePath en <Link>, redirect() y router, pero no en URLs armadas a mano.
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

export function withBasePath(path: string): string {
  return `${BASE_PATH}${path}`
}
