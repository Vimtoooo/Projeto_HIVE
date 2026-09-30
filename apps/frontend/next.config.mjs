import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.dirname(fileURLToPath(import.meta.url));
const backend = new URL(process.env.API_URL || "http://localhost:3000");
if (
  !["http:", "https:"].includes(backend.protocol) ||
  backend.username ||
  backend.password ||
  backend.search ||
  backend.hash ||
  backend.pathname !== "/"
) {
  throw new Error(
    "API_URL deve conter somente a origem HTTP(S) do backend, sem credenciais ou caminho.",
  );
}
const nextConfig = {
  turbopack: { root },
  async redirects() {
    return [
      { source: "/pages/Hive.html", destination: "/login", permanent: false },
      {
        source: "/pages/register.html",
        destination: "/cadastro",
        permanent: false,
      },
      { source: "/pages/home.html", destination: "/home", permanent: false },
      {
        source: "/pages/pagina-login.html",
        destination: "/login",
        permanent: false,
      },
      {
        source: "/pages/pagina-cadastro.html",
        destination: "/cadastro",
        permanent: false,
      },
      {
        source: "/pages/pagina-home.html",
        destination: "/home",
        permanent: false,
      },
    ];
  },
  async rewrites() {
    return [{ source: "/api/:path*", destination: backend.origin + "/:path*" }];
  },
};

export default nextConfig;
