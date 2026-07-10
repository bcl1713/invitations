import { readFileSync } from 'node:fs';

describe('docker image build contract', () => {
  it('defines a production Dockerfile', () => {
    const dockerfile = readFileSync('Dockerfile', 'utf8');
    expect(dockerfile).toContain('FROM');
    expect(dockerfile).toContain('EXPOSE 3000');
  });
});
