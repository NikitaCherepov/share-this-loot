import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const nextConfig = {
    eslint: {
    ignoreDuringBuilds: true,
  },
};

/** @type {import('next').NextConfig} */
export default withNextIntl(nextConfig);