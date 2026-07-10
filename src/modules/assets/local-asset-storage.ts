import { mkdir, writeFile } from 'node:fs/promises';
import * as path from 'node:path';
import { randomUUID } from 'node:crypto';

import { getEnv } from '@/lib/env';

const ALLOWED_TYPES = new Map([
  ['image/png', '.png'],
  ['image/jpeg', '.jpg'],
  ['image/webp', '.webp'],
]);

export async function saveUploadedImage(file: File) {
  const extension = ALLOWED_TYPES.get(file.type);

  if (!extension) {
    throw new Error('Unsupported file type');
  }

  const env = getEnv();
  const uploadsDir = env.UPLOADS_PATH;
  await mkdir(uploadsDir, { recursive: true });

  const fileName = `${randomUUID()}${extension}`;
  const outputPath = path.join(uploadsDir, fileName);
  const buffer = Buffer.from(await file.arrayBuffer());

  await writeFile(outputPath, buffer);

  return fileName;
}
