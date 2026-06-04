/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['10.202.135.233'],

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://127.0.0.1:8000/api/:path*",
      },
    ];
  },
};

export default nextConfig;