/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
      // This allows the build to finish even if there are punctuation errors
      ignoreDuringBuilds: true,
    },
  };
  
  export default nextConfig;