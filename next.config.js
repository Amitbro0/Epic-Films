/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        serverComponentsExternalPackages: ['mongoose'],
    },
    async redirects() {
        return [
            {
                source: '/transfer',
                destination: '/plik',
                permanent: true,
            },
        ];
    },
};

export default nextConfig;
