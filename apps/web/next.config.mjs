/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Emit a self-contained server bundle into .next/standalone — used by the
  // production Docker image so the runtime stage doesn't need node_modules.
  output: "standalone",
};

export default nextConfig;
