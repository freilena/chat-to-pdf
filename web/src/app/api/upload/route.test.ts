import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';

describe('api/upload route', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.API_BASE_URL = 'http://localhost:8000';
  });

  it('forwards multipart and returns JSON', async () => {
    const form = new FormData();
    form.append('files', new File([new Blob(['%PDF-1.4'])], 'a.pdf', { type: 'application/pdf' }));

    const fetchMock = vi.spyOn(global, 'fetch' as any).mockResolvedValue(
      new Response(
        JSON.stringify({ session_id: 's1', totals: { files: 1, bytes: 7 } }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ) as any,
    );

    const req = new Request('http://localhost/api/upload', { method: 'POST', body: form as any });
    const res = await POST(req as any);

    expect(fetchMock).toHaveBeenCalled();
    const [url, init] = (fetchMock as any).mock.calls[0];
    expect(url).toBe('http://localhost:8000/fastapi/upload');
    expect((init as any).method).toBe('POST');
    const json = await res.json();
    expect(json.session_id).toBe('s1');
    expect(json.totals.files).toBe(1);
  });
});


