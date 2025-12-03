/** @type {import('next').NextConfig} */
const nextConfig = {
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
