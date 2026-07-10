import { readFileSync } from 'node:fs';

describe('semantic release config', () => {
  it('declares a release branch policy', () => {
    const raw = readFileSync('.releaserc.json', 'utf8');
    const config = JSON.parse(raw);
    expect(config.branches).toBeDefined();
    expect(config.branches).toContain('main');
  });
});
