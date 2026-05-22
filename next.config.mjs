/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
    ],
  },
  async redirects() {
    return [
      // Old Squarespace pages → homepage (permanent redirects)
      {
        source: "/home",
        destination: "/",
        permanent: true,
      },
      {
        source: "/terms",
        destination: "/",
        permanent: true,
      },
      {
        source: "/Full",
        destination: "/",
        permanent: true,
      },
      {
        source: "/privacy-policy-3975-8774-8031-8438-2279-3890",
        destination: "/",
        permanent: true,
      },
      {
        source: "/terms-and-conditions-4338-7294-8836-7704-3508-2366",
        destination: "/",
        permanent: true,
      },
      {
        source: "/landing-page",
        destination: "/",
        permanent: true,
      },
      {
        source: "/thanks-for-applying",
        destination: "/",
        permanent: true,
      },
      // Squarespace build artifacts
      {
        source: "/tmp/:path*",
        destination: "/",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
