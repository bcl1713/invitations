import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('docker image build contract', () => {
  it('defines a production Dockerfile', () => {
    const dockerfile = readFileSync('Dockerfile', 'utf8');
    expect(dockerfile).toContain('FROM');
    expect(dockerfile).toContain('EXPOSE 3000');
    expect(dockerfile).toContain('COPY --from=builder /app/scripts/production-entrypoint.sh ./scripts/production-entrypoint.sh');
    expect(dockerfile).toContain('CMD ["./scripts/production-entrypoint.sh"]');
  });

  it('starts the application only after migrations succeed', () => {
    const binDirectory = mkdtempSync(join(tmpdir(), 'invitations-entrypoint-'));
    const logPath = join(binDirectory, 'npm.log');
    const npmPath = join(binDirectory, 'npm');
    writeFileSync(npmPath, '#!/bin/sh\nprintf "%s\\n" "$*" >> "$NPM_LOG"\n[ "$1 $2" = "run prisma:migrate" ] && exit "${MIGRATION_EXIT_CODE:-0}"\nexit 0\n');
    chmodSync(npmPath, 0o755);

    try {
      execFileSync('/bin/sh', ['scripts/production-entrypoint.sh'], {
        env: { ...process.env, PATH: `${binDirectory}:${process.env.PATH}`, NPM_LOG: logPath },
      });
      expect(readFileSync(logPath, 'utf8').trim().split('\n')).toEqual(['run prisma:migrate', 'run start']);
    } finally {
      rmSync(binDirectory, { force: true, recursive: true });
    }
  });

  it('does not start the application when migrations fail', () => {
    const binDirectory = mkdtempSync(join(tmpdir(), 'invitations-entrypoint-'));
    const logPath = join(binDirectory, 'npm.log');
    const npmPath = join(binDirectory, 'npm');
    writeFileSync(npmPath, '#!/bin/sh\nprintf "%s\\n" "$*" >> "$NPM_LOG"\n[ "$1 $2" = "run prisma:migrate" ] && exit "${MIGRATION_EXIT_CODE:-0}"\nexit 0\n');
    chmodSync(npmPath, 0o755);

    try {
      const result = spawnSync('/bin/sh', ['scripts/production-entrypoint.sh'], {
        env: { ...process.env, PATH: `${binDirectory}:${process.env.PATH}`, NPM_LOG: logPath, MIGRATION_EXIT_CODE: '1' },
      });
      expect(result.status).toBe(1);
      expect(readFileSync(logPath, 'utf8').trim().split('\n')).toEqual(['run prisma:migrate']);
    } finally {
      rmSync(binDirectory, { force: true, recursive: true });
    }
  });
});
