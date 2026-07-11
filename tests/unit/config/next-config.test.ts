import { describe, expect, it } from 'vitest';

import nextConfig from '../../../next.config';

describe('next config', () => {
  it('allows server actions to accept hero uploads up to the app upload limit', () => {
    expect(nextConfig.experimental?.serverActions?.bodySizeLimit).toBe('5mb');
  });
});
