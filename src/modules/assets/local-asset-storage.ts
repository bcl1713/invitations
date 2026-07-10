import { mkdir, writeFile } from 'node:fs/promises';
import * as path from 'node:path';
import { randomUUID } from 'node:crypto';

import { getEnv } from '@/lib/env';

const ALLOWED_TYPES = new Map([
  ['image/png', '.png'],
  ['image/jpeg', '.jpg'],
  ['image/webp', '.webp'],
]);

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export async function saveUploadedImage(file: File) {
  const extension = ALLOWED_TYPES.get(file.type);

  if (!extension) {
    throw new Error('Unsupported file type');
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error('File too large');
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
