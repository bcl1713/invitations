import { readFileSync } from 'node:fs';

describe('release workflow', () => {
  it('publishes to ghcr', () => {
    const raw = readFileSync('.github/workflows/release.yml', 'utf8');
    expect(raw).toContain('ghcr.io');
  });
});
