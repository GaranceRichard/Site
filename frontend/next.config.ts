import type { NextConfig } from "next";

const rawCdnUrl = process.env.NEXT_PUBLIC_CDN_URL?.trim() ?? "";
const cdnUrl = rawCdnUrl.replace(/\/$/, "");
const rawApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ?? "";

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

const nextConfig: NextConfig = {
  assetPrefix: process.env.NODE_ENV === "production" && cdnUrl ? cdnUrl : undefined,
  compress: true,
  poweredByHeader: false,
  images: {
    remotePatterns,
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 7,
    unoptimized: process.env.NODE_ENV === "development",
  },
};

export default nextConfig;
