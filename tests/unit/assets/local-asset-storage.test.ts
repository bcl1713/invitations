import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';

const { getEnvMock } = vi.hoisted(() => ({
  getEnvMock: vi.fn(),
}));

vi.mock('@/lib/env', () => ({
  getEnv: getEnvMock,
}));

import { saveUploadedImage } from '@/modules/assets/local-asset-storage';

function makeFile({ type, size, bytes = new Uint8Array([1, 2, 3]) }: { type: string; size?: number; bytes?: Uint8Array }) {
  return {
    type,
    size: size ?? bytes.byteLength,
    arrayBuffer: vi.fn().mockResolvedValue(bytes.buffer),
  } as unknown as File;
}

describe('saveUploadedImage', () => {
  let uploadsDir: string;

  beforeEach(async () => {
    getEnvMock.mockReset();

    uploadsDir = await mkdtemp(path.join(os.tmpdir(), 'invitations-asset-storage-'));
    getEnvMock.mockReturnValue({
      UPLOADS_PATH: uploadsDir,
    });
  });

  afterEach(async () => {
    await rm(uploadsDir, { recursive: true, force: true });
  });

  it.each([
    ['image/png', '.png'],
    ['image/jpeg', '.jpg'],
    ['image/webp', '.webp'],
  ])('stores supported %s uploads with the expected extension', async (type, extension) => {
    const bytes = new Uint8Array([1, 2, 3]);
    const file = makeFile({ type, bytes });

    const storedFileName = await saveUploadedImage(file);
    const storedFiles = await readdir(uploadsDir);

    expect(storedFileName).toMatch(new RegExp(`^[0-9a-f-]+\\${extension}$`, 'i'));
    expect(storedFiles).toEqual([storedFileName]);
    await expect(readFile(path.join(uploadsDir, storedFileName))).resolves.toEqual(Buffer.from(bytes));
  });

  it('throws for unsupported upload types', async () => {
    const file = makeFile({ type: 'image/gif' });

    await expect(saveUploadedImage(file)).rejects.toThrow('Unsupported file type');
    await expect(readdir(uploadsDir)).resolves.toEqual([]);
  });

  it('throws for uploads over the size limit', async () => {
    const file = makeFile({ type: 'image/png', size: 5 * 1024 * 1024 + 1, bytes: new Uint8Array([1]) });

    await expect(saveUploadedImage(file)).rejects.toThrow('File too large');
    await expect(readdir(uploadsDir)).resolves.toEqual([]);
  });
});
