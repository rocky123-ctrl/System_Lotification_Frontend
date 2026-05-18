/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Añade esto para permitir el desarrollo por IP
  experimental: {
    allowedDevOrigins: ['192.168.1.21'],
  },
}

export default nextConfig