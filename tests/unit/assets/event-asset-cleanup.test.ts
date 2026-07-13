import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  findManyMock,
  deleteMock,
  deleteUploadedImageIfUnusedMock,
} = vi.hoisted(() => ({
  findManyMock: vi.fn(),
  deleteMock: vi.fn(),
  deleteUploadedImageIfUnusedMock: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  prisma: {
    assetCleanup: {
      findMany: findManyMock,
      delete: deleteMock,
    },
  },
}));

vi.mock('@/modules/assets/local-asset-storage', () => ({
  deleteUploadedImageIfUnused: deleteUploadedImageIfUnusedMock,
}));

import { retryEventAssetCleanup } from '@/modules/assets/event-asset-cleanup';

describe('retryEventAssetCleanup', () => {
  beforeEach(() => {
    findManyMock.mockReset();
    deleteMock.mockReset();
    deleteUploadedImageIfUnusedMock.mockReset();
  });

  it('keeps failed cleanup work for a later retry while processing other files', async () => {
    findManyMock.mockResolvedValue([
      { id: 'cleanup-failed', fileName: 'failed.png' },
      { id: 'cleanup-success', fileName: 'success.png' },
    ]);
    deleteUploadedImageIfUnusedMock.mockImplementation(async (fileName: string) => {
      if (fileName === 'failed.png') {
        throw new Error('disk offline');
      }
    });

    await expect(retryEventAssetCleanup('event-123')).resolves.toEqual({ cleanupPending: true });

    expect(findManyMock).toHaveBeenCalledWith({ where: { eventId: 'event-123' } });
    expect(deleteUploadedImageIfUnusedMock).toHaveBeenCalledWith('failed.png');
    expect(deleteUploadedImageIfUnusedMock).toHaveBeenCalledWith('success.png');
    expect(deleteMock).toHaveBeenCalledWith({ where: { id: 'cleanup-success' } });
    expect(deleteMock).not.toHaveBeenCalledWith({ where: { id: 'cleanup-failed' } });
  });

  it('removes persisted cleanup work once a retry safely deletes its file', async () => {
    findManyMock.mockResolvedValue([{ id: 'cleanup-123', fileName: 'orphaned.png' }]);
    deleteUploadedImageIfUnusedMock.mockResolvedValue(undefined);

    await expect(retryEventAssetCleanup('event-123')).resolves.toEqual({ cleanupPending: false });

    expect(deleteMock).toHaveBeenCalledWith({ where: { id: 'cleanup-123' } });
  });
});
