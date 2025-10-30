// Force dynamic rendering (no caching)
export const dynamic = 'force-dynamic';

// Use Node.js runtime (not Edge)
export const runtime = 'nodejs';

// Maximum execution time (effective on Vercel Pro, ignored on Hobby)
export const maxDuration = 60;

export async function POST(req: Request) {
  const base = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const res = await fetch(`${base}/fastapi/upload`, {
    method: 'POST',
    body: req.body,
    headers: req.headers,
    // @ts-expect-error - duplex is required for streaming requests in Next.js
    duplex: 'half',
  });
  return new Response(await res.text(), { status: res.status, headers: res.headers });
}
