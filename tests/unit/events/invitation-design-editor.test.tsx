import { fireEvent, render, screen } from '@testing-library/react';

import { InvitationDesignEditor } from '@/app/admin/events/[eventId]/InvitationDesignEditor';
import { buildInvitationPresentation } from '@/modules/invitations/invitation-presentation';

describe('InvitationDesignEditor', () => {
  it('serializes contenteditable input immediately', () => {
    const presentation = buildInvitationPresentation({
      appUrl: 'http://localhost:3000',
      inviteUrl: '#preview',
      event: {
        title: 'Initial title',
        hostName: 'Initial host',
        location: '',
        description: '',
        startsAt: null,
        timeZone: 'UTC',
        templateKey: 'classic',
        heroImagePath: null,
        emblemImagePath: null,
        watermarkImagePath: null,
      },
      guest: { name: 'Your guest', canBringPlusOne: true },
    });
    const form = document.createElement('form');
    document.body.append(form);

    render(<InvitationDesignEditor initialDesign={presentation.editableDesign} />, { container: form });

    const title = screen.getByRole('textbox', { name: 'Main title' });
    fireEvent.input(title, { target: { textContent: 'Updated title' } });

    expect(form.querySelector<HTMLInputElement>('input[name="designConfig"]')?.value).toContain('Updated title');
  });
});
