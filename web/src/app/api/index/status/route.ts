// Force dynamic rendering (no caching)
export const dynamic = 'force-dynamic';

// Use Node.js runtime (not Edge)
export const runtime = 'nodejs';

// Maximum execution time (effective on Vercel Pro, ignored on Hobby)
export const maxDuration = 60;

export async function GET(req: Request) {
  const base = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const url = new URL(req.url);
  const res = await fetch(`${base}/fastapi/index/status?${url.searchParams.toString()}`, { method: 'GET' });
  return new Response(await res.text(), { status: res.status, headers: res.headers });
}
