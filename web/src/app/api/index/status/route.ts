export async function GET(req: Request) {
  const base = process.env.API_BASE_URL || 'http://localhost:8000';
  const url = new URL(req.url);
  const res = await fetch(`${base}/fastapi/index/status?${url.searchParams.toString()}`, { method: 'GET' });
  return new Response(await res.text(), { status: res.status, headers: res.headers });
}
