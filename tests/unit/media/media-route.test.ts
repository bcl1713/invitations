import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';

const { getEnvMock, notFoundMock } = vi.hoisted(() => ({
  getEnvMock: vi.fn(),
  notFoundMock: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));

vi.mock('@/lib/env', () => ({
  getEnv: getEnvMock,
}));

vi.mock('next/navigation', () => ({
  notFound: notFoundMock,
}));

import { GET } from '@/app/media/[fileName]/route';

describe('media route', () => {
  let uploadsDir: string;

  beforeEach(async () => {
    getEnvMock.mockReset();
    notFoundMock.mockClear();

    uploadsDir = await mkdtemp(path.join(os.tmpdir(), 'invitations-media-route-'));
    getEnvMock.mockReturnValue({
      UPLOADS_PATH: uploadsDir,
    });
  });

  afterEach(async () => {
    await rm(uploadsDir, { recursive: true, force: true });
  });

  it('serves valid media with safe headers', async () => {
    const fileName = '123e4567-e89b-12d3-a456-426614174000.png';
    await writeFile(path.join(uploadsDir, fileName), Buffer.from([1, 2, 3]));

    const response = await GET(new Request('http://localhost/media/hero.png'), {
      params: Promise.resolve({ fileName }),
    });

    expect(response.headers.get('content-type')).toBe('image/png');
    expect(response.headers.get('cache-control')).toBe('public, max-age=31536000, immutable');
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
  });

  it('rejects suspicious file names before reading from disk', async () => {
    await expect(GET(new Request('http://localhost/media/../secret.txt'), {
      params: Promise.resolve({ fileName: '../secret.txt' }),
    })).rejects.toThrow('NEXT_NOT_FOUND');

    expect(notFoundMock).toHaveBeenCalled();
  });

  it('returns not found for unsupported extensions', async () => {
    await expect(GET(new Request('http://localhost/media/hero.gif'), {
      params: Promise.resolve({ fileName: '123e4567-e89b-12d3-a456-426614174000.gif' }),
    })).rejects.toThrow('NEXT_NOT_FOUND');
  });
});
