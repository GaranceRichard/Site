const backendOrigin = (process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "http://127.0.0.1:8000").replace(
  /\/$/,
  "",
);

function buildResponseHeaders(source: Response): Headers {
  const headers = new Headers();
  const contentType = source.headers.get("content-type");
  if (contentType) {
    headers.set("content-type", contentType);
  }
  return headers;
}

export async function POST(request: Request) {
  const body = await request.text();

  const upstream = await fetch(`${backendOrigin}/api/auth/refresh/`, {
    method: "POST",
    headers: {
      "content-type": request.headers.get("content-type") ?? "application/json",
    },
    body,
    cache: "no-store",
  });

  return new Response(upstream.body, {
    status: upstream.status,
    headers: buildResponseHeaders(upstream),
  });
}
