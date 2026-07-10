import { notFound } from 'next/navigation';
import * as path from 'node:path';
import { readFile } from 'node:fs/promises';

import { getEnv } from '@/lib/env';

export async function GET(_: Request, context: { params: Promise<{ fileName: string }> }) {
  const { fileName } = await context.params;
  const env = getEnv();
  const filePath = path.join(env.UPLOADS_PATH, fileName);

  try {
    const buffer = await readFile(filePath);
    const extension = path.extname(fileName).toLowerCase();
    const contentType = extension === '.png'
      ? 'image/png'
      : extension === '.webp'
        ? 'image/webp'
        : 'image/jpeg';

    return new Response(buffer, {
      headers: {
        'content-type': contentType,
        'cache-control': 'public, max-age=3600',
      },
    });
  } catch {
    notFound();
  }
}
