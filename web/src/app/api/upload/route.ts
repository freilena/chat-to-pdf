export async function POST(req: Request) {
  const base = process.env.API_BASE_URL || 'http://localhost:8000';
  const res = await fetch(`${base}/fastapi/upload`, {
    method: 'POST',
    body: req.body,
    headers: req.headers,
    // @ts-expect-error - duplex is required for streaming requests in Next.js
    duplex: 'half',
  });
  return new Response(await res.text(), { status: res.status, headers: res.headers });
}
