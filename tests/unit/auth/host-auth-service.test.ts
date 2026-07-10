import { authenticateHost } from '@/modules/auth/host-auth-service';

describe('authenticateHost', () => {
  it('accepts matching host credentials', async () => {
    await expect(
      authenticateHost(
        {
          email: 'host@example.com',
          password: 'correct-horse',
        },
        {
          adminEmail: 'host@example.com',
          adminPassword: 'correct-horse',
        },
      ),
    ).resolves.toBe(true);
  });

  it('rejects invalid host credentials', async () => {
    await expect(
      authenticateHost(
        {
          email: 'host@example.com',
          password: 'wrong-password',
        },
        {
          adminEmail: 'host@example.com',
          adminPassword: 'correct-horse',
        },
      ),
    ).resolves.toBe(false);
  });
});
