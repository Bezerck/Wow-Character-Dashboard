/** @type {import('next').NextConfig} */
// Allow configuring a base path for GitHub Pages (e.g. '/repo-name').
// Set NEXT_PUBLIC_BASE_PATH in the build environment (the GitHub Action below does this).
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Use basePath/assetPrefix so assets and routes work when the site is served
  // from a subpath like `https://username.github.io/repo-name`.
  basePath: basePath,
  assetPrefix: basePath,
  // Make exported paths end with a slash which is more compatible with GitHub Pages
  // (optional but commonly useful).
  trailingSlash: true,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: 'https://classic.warcraftlogs.com',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-Requested-With',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
