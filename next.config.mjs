/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        // Vietnamese (default): /:slug → /events/:slug
        source: '/:slug((?!en|dashboard|account|share|account-event-agency|marketplace|transaction-checkout|auth|errors|event-studio|events|sso|_next|static|favicon.ico)[^/]+)',
        destination: '/events/:slug',
        permanent: false,    // 307 redirect; switch to `true` for a 308 permanent
      },
      {
        // English: /en/:slug → /en/events/:slug
        source: '/en/:slug((?!dashboard|account|share|account-event-agency|marketplace|transaction-checkout|auth|errors|event-studio|events|sso)[^/]+)',
        destination: '/en/events/:slug',
        permanent: false,
      },
    ]
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'etik-media.s3.amazonaws.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'media.etik.vn',
        port: '',
        pathname: '/**',
      },
    ],
  },

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
      };
    }
    return config;
  },
};
export default nextConfig;
