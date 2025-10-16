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
  output: 'export',
  generateBuildId: async () => {
    return 'build-' + Date.now()
  },
  poweredByHeader: false,
  generateEtags: false,
}

export default nextConfig