import { networkInterfaces } from "node:os";
import type { NextConfig } from "next";

const isDemoMode = ["1", "true", "yes", "on"].includes(
  process.env.NEXT_PUBLIC_DEMO_MODE?.trim().toLowerCase() ?? "",
);
const basePath = (() => {
  const raw = process.env.NEXT_PUBLIC_BASE_PATH?.trim() ?? "";
  if (!raw) return "";
  const normalized = raw.startsWith("/") ? raw : `/${raw}`;
  return normalized.replace(/\/+$/, "");
})();
const rawCdnUrl = process.env.NEXT_PUBLIC_CDN_URL?.trim() ?? "";
const cdnUrl = rawCdnUrl.replace(/\/$/, "");
const rawDistDir = process.env.NEXT_DIST_DIR?.trim() ?? "";
const rawApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ?? "";
const backendOrigin = (rawApiBaseUrl || "http://127.0.0.1:8000").replace(/\/$/, "");
const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() ?? "";
const rawAllowedDevOrigins = process.env.NEXT_DEV_ALLOWED_ORIGINS?.trim() ?? "";

const normalizeOrigin = (value: string): string | null => {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
};

const currentDevPort = process.env.PORT?.trim() || "3000";

const localNetworkDevOrigins = (() => {
  if (process.env.NODE_ENV === "production") return [];

  const interfaces = networkInterfaces();
  const origins = new Set<string>();

  for (const addresses of Object.values(interfaces)) {
    for (const address of addresses ?? []) {
      if (address.internal || address.family !== "IPv4") continue;

      const value = address.address.trim();
      const isPrivateIPv4 =
        value.startsWith("10.") ||
        value.startsWith("192.168.") ||
        /^172\.(1[6-9]|2\d|3[0-1])\./.test(value);

      if (!isPrivateIPv4) continue;
      origins.add(`http://${value}:${currentDevPort}`);
    }
  }

  return Array.from(origins);
})();

const cdnHostname = (() => {
  if (!cdnUrl) return null;
  try {
    return new URL(cdnUrl).hostname;
  } catch {
    return null;
  }
})();

const apiHostname = (() => {
  if (!rawApiBaseUrl) return null;
  try {
    return new URL(rawApiBaseUrl).hostname;
  } catch {
    return null;
  }
})();

const remotePatterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [
  {
    protocol: "http",
    hostname: "127.0.0.1",
    port: "8000",
    pathname: "/media/**",
  },
  {
    protocol: "http",
    hostname: "localhost",
    port: "8000",
    pathname: "/media/**",
  },
  {
    protocol: "https",
    hostname: "127.0.0.1",
    port: "8000",
    pathname: "/media/**",
  },
  {
    protocol: "https",
    hostname: "localhost",
    port: "8000",
    pathname: "/media/**",
  },
  {
    protocol: "https",
    hostname: "cdn.jsdelivr.net",
    pathname: "/**",
  },
];

if (cdnHostname) {
  remotePatterns.push({
    protocol: "https",
    hostname: cdnHostname,
    pathname: "/**",
  });
}

if (apiHostname && !["localhost", "127.0.0.1"].includes(apiHostname)) {
  remotePatterns.push(
    {
      protocol: "http",
      hostname: apiHostname,
      pathname: "/media/**",
    },
    {
      protocol: "https",
      hostname: apiHostname,
      pathname: "/media/**",
    },
  );
}

const allowedDevOrigins = Array.from(
  new Set(
    [
      "http://127.0.0.1:3000",
      "http://localhost:3000",
      normalizeOrigin(rawApiBaseUrl),
      normalizeOrigin(rawSiteUrl),
      ...localNetworkDevOrigins,
      ...rawAllowedDevOrigins
        .split(",")
        .map((value) => normalizeOrigin(value.trim())),
    ].filter((value): value is string => Boolean(value)),
  ),
);

const nextConfig: NextConfig = {
  allowedDevOrigins,
  assetPrefix: isDemoMode ? basePath || undefined : process.env.NODE_ENV === "production" && cdnUrl ? cdnUrl : undefined,
  basePath: isDemoMode ? basePath || undefined : undefined,
  compress: true,
  distDir: rawDistDir || undefined,
  output: isDemoMode ? "export" : undefined,
  poweredByHeader: false,
  skipTrailingSlashRedirect: isDemoMode,
  trailingSlash: isDemoMode,
  images: {
    remotePatterns,
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 7,
    unoptimized: process.env.NODE_ENV === "development" || isDemoMode,
  },
};

if (!isDemoMode) {
  nextConfig.rewrites = async () => [
    {
      source: "/api-proxy/:path*",
      destination: `${backendOrigin}/:path*`,
    },
  ];
}

export default nextConfig;
