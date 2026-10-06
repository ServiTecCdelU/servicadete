// La app vive bajo un subpath (servitec.net.ar/servicadete). Se puede sobrescribir por env.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '/servicadete'

/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath,
  // Expone el mismo valor al cliente: lo necesitan las URLs que Next no prefija solo
  // (redirectTo de OAuth, iconos de metadata).
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
