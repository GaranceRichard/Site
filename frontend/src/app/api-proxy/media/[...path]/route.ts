const backendOrigin = (process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "http://127.0.0.1:8000").replace(
  /\/$/,
  "",
);

export const dynamic = "force-dynamic";

function buildTarget(pathSegments: string[], request: Request): string {
  const encodedPath = pathSegments.map(encodeURIComponent).join("/");
  const { search } = new URL(request.url);
  return `${backendOrigin}/media/${encodedPath}${search}`;
}

function buildResponseHeaders(source: Response): Headers {
  const headers = new Headers();
  for (const name of [
    "accept-ranges",
    "cache-control",
    "content-disposition",
    "content-length",
    "content-type",
    "etag",
    "last-modified",
  ]) {
    const value = source.headers.get(name);
    if (value) {
      headers.set(name, value);
    }
  }
  return headers;
}

async function proxyMedia(request: Request, pathSegments: string[]) {
  const upstream = await fetch(buildTarget(pathSegments, request), {
    method: request.method,
    headers: {
      accept: request.headers.get("accept") ?? "*/*",
      ...(request.headers.get("if-none-match")
        ? { "if-none-match": request.headers.get("if-none-match") ?? "" }
        : {}),
      ...(request.headers.get("if-modified-since")
        ? { "if-modified-since": request.headers.get("if-modified-since") ?? "" }
        : {}),
      ...(request.headers.get("range")
        ? { range: request.headers.get("range") ?? "" }
        : {}),
    },
    cache: "no-store",
  });

  return new Response(request.method === "HEAD" ? null : upstream.body, {
    status: upstream.status,
    headers: buildResponseHeaders(upstream),
  });
}

export async function GET(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  return proxyMedia(request, path);
}

export async function HEAD(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  return proxyMedia(request, path);
}
