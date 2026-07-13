import { describe, expect, it } from 'vitest';

import nextConfig from '../../../next.config';

describe('next config', () => {
  it('allows server actions to accept hero uploads up to the app upload limit', () => {
    expect(nextConfig.experimental?.serverActions?.bodySizeLimit).toBe('5mb');
  });

  it('allows the loopback origin used by local browser smoke tests to hydrate', () => {
    expect(nextConfig.allowedDevOrigins).toContain('127.0.0.1');
  });
});
