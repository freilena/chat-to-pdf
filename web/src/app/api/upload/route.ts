export async function POST(req: Request) {
  const base = process.env.API_BASE_URL || 'http://localhost:8000';
  const res = await fetch(`${base}/fastapi/upload`, {
    method: 'POST',
    body: (req as any).body,
    headers: req.headers as any,
  });
  return new Response(await res.text(), { status: res.status, headers: res.headers });
}
