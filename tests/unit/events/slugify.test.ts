import { slugifyEventTitle } from '@/modules/events/slugify';

describe('slugifyEventTitle', () => {
  it('creates a stable event slug from a title', () => {
    expect(slugifyEventTitle('Porter Birthday Bash 2026!')).toBe('porter-birthday-bash-2026');
  });
});
