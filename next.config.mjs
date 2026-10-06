// La app vive bajo un subpath (servitec.net.ar/servicadete), servida por un rewrite
// desde el proyecto de ServiTec. Se puede sobrescribir por env.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '/servicadete'

/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath,
  // Expone el mismo valor al cliente: lo necesitan las URLs que Next no prefija solo
  // (redirectTo de OAuth, iconos de metadata).
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  experimental: {
    serverActions: {
      // Detrás del rewrite, Origin (servitec.net.ar) no coincide con Host (vercel.app).
      allowedOrigins: ['servitec.net.ar', 'www.servitec.net.ar'],
    },
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
