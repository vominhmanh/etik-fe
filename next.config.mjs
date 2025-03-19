/** @type {import('next').NextConfig} */
const nextConfig = {
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
                hostname: 'media.etik.io.vn',
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
    }
};
export default nextConfig;
