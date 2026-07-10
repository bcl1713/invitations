import { notFound } from 'next/navigation';
import * as path from 'node:path';
import { readFile } from 'node:fs/promises';

import { getEnv } from '@/lib/env';

const ALLOWED_MEDIA_EXTENSIONS = new Set(['.png', '.jpg', '.webp']);
const SAFE_MEDIA_FILE_NAME_PATTERN = /^[0-9a-f-]+\.(png|jpg|webp)$/i;

function getContentType(fileName: string) {
  const extension = path.extname(fileName).toLowerCase();

  if (extension === '.png') {
    return 'image/png';
  }

  if (extension === '.webp') {
    return 'image/webp';
  }

  if (extension === '.jpg') {
    return 'image/jpeg';
  }

  return null;
}

function isSafeMediaFileName(fileName: string) {
  const extension = path.extname(fileName).toLowerCase();

  return ALLOWED_MEDIA_EXTENSIONS.has(extension)
    && SAFE_MEDIA_FILE_NAME_PATTERN.test(fileName)
    && path.basename(fileName) === fileName;
}

export async function GET(_: Request, context: { params: Promise<{ fileName: string }> }) {
  const { fileName } = await context.params;

  if (!isSafeMediaFileName(fileName)) {
    notFound();
  }

  const env = getEnv();
  const filePath = path.join(env.UPLOADS_PATH, fileName);
  const contentType = getContentType(fileName);

  if (!contentType) {
    notFound();
  }

  try {
    const buffer = await readFile(filePath);

    return new Response(buffer, {
      headers: {
        'content-type': contentType,
        'cache-control': 'public, max-age=31536000, immutable',
        'x-content-type-options': 'nosniff',
      },
    });
  } catch {
    notFound();
  }
}
