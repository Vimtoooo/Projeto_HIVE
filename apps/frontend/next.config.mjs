import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.dirname(fileURLToPath(import.meta.url));
const backend = new URL(process.env.API_URL || 'http://localhost:3000');
if (!['http:', 'https:'].includes(backend.protocol) || backend.username || backend.password || backend.search || backend.hash || backend.pathname !== '/') {
  throw new Error('API_URL deve conter somente a origem HTTP(S) do backend, sem credenciais ou caminho.');
}
const nextConfig = {
  turbopack: { root },
  async rewrites() { return [{ source: '/api/:path*', destination: backend.origin + '/:path*' }]; },
};

export default nextConfig;
