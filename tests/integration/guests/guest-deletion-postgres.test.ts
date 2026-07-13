import { PrismaClient } from '@prisma/client';

const testDatabaseUrl = process.env.GUEST_DELETION_TEST_DATABASE_URL;
const describeWithDatabase = testDatabaseUrl ? describe : describe.skip;

let prisma: PrismaClient;
let deleteGuest: typeof import('@/modules/guests/guest-service').deleteGuest;

describeWithDatabase('PostgreSQL guest deletion cascades', () => {
  let eventId: string;
  let otherEventId: string;
  let guestId: string;
  let otherGuestId: string;

  beforeAll(async () => {
    process.env.DATABASE_URL = testDatabaseUrl;
    prisma = new PrismaClient({ datasources: { db: { url: testDatabaseUrl } } });
    ({ deleteGuest } = await import('@/modules/guests/guest-service'));
    await prisma.$connect();
  });

  beforeEach(async () => {
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const event = await prisma.event.create({
      data: { title: 'Deletion test event', slug: `guest-deletion-${suffix}` },
    });
    const otherEvent = await prisma.event.create({
      data: { title: 'Other deletion test event', slug: `guest-deletion-other-${suffix}` },
    });
    eventId = event.id;
    otherEventId = otherEvent.id;

    const guest = await prisma.guest.create({
      data: { eventId, name: 'Delete Me', email: `delete-me-${suffix}@example.com` },
    });
    const otherGuest = await prisma.guest.create({
      data: { eventId: otherEventId, name: 'Keep Me', email: `keep-me-${suffix}@example.com` },
    });
    guestId = guest.id;
    otherGuestId = otherGuest.id;

    await prisma.invitation.create({
      data: { eventId, guestId, token: `delete-token-${suffix}` },
    });
    await prisma.rsvp.create({
      data: { eventId, guestId, status: 'GOING' },
    });
  });

  afterEach(async () => {
    await prisma.event.deleteMany({ where: { id: { in: [eventId, otherEventId] } } });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('removes the scoped guest, invitation, and RSVP while preserving another event guest', async () => {
    await expect(deleteGuest(eventId, guestId)).resolves.toEqual({ count: 1 });

    await expect(prisma.guest.findUnique({ where: { id: guestId } })).resolves.toBeNull();
    await expect(prisma.invitation.findUnique({ where: { guestId } })).resolves.toBeNull();
    await expect(prisma.rsvp.findUnique({ where: { guestId } })).resolves.toBeNull();
    await expect(prisma.guest.findUnique({ where: { id: otherGuestId } })).resolves.toMatchObject({
      id: otherGuestId,
      eventId: otherEventId,
    });
  });
});
