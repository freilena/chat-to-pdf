import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from './route';

describe('api/index/status route', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.API_BASE_URL = 'http://localhost:8000';
  });

  it('proxies status requests', async () => {
    const fetchMock = vi.spyOn(global, 'fetch' as any).mockResolvedValue(
      new Response(
        JSON.stringify({ status: 'indexing', total_files: 1, files_indexed: 0 }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ) as any,
    );

    const req = new Request(new URL('http://localhost/api/index/status?session_id=s1'), { method: 'GET' });
    const res = await GET(req as any);

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8000/fastapi/index/status?session_id=s1',
      expect.any(Object),
    );
    const data = await res.json();
    expect(data.status).toBe('indexing');
  });
});


