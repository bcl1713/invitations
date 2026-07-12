import { prisma } from '@/lib/db';
import { deleteUploadedImageIfUnused } from '@/modules/assets/local-asset-storage';

export async function retryEventAssetCleanup(eventId: string) {
  const cleanupJobs = await prisma.assetCleanup.findMany({
    where: { eventId },
  });

  let cleanupPending = false;

  for (const cleanupJob of cleanupJobs) {
    try {
      await deleteUploadedImageIfUnused(cleanupJob.fileName);
      await prisma.assetCleanup.delete({
        where: { id: cleanupJob.id },
      });
    } catch {
      cleanupPending = true;
    }
  }

  return { cleanupPending };
}
