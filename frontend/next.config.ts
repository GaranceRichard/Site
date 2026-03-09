import type { NextConfig } from "next";

const rawCdnUrl = process.env.NEXT_PUBLIC_CDN_URL?.trim() ?? "";
const cdnUrl = rawCdnUrl.replace(/\/$/, "");
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
      normalizeOrigin(rawSiteUrl),
      ...rawAllowedDevOrigins
        .split(",")
        .map((value) => normalizeOrigin(value.trim())),
    ].filter((value): value is string => Boolean(value)),
  ),
);

const nextConfig: NextConfig = {
  allowedDevOrigins,
  assetPrefix: process.env.NODE_ENV === "production" && cdnUrl ? cdnUrl : undefined,
  compress: true,
  poweredByHeader: false,
  async rewrites() {
    return [
      {
        source: "/api-proxy/:path*",
        destination: `${backendOrigin}/:path*`,
      },
    ];
  },
  images: {
    remotePatterns,
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 7,
    unoptimized: process.env.NODE_ENV === "development",
  },
};

export default nextConfig;
