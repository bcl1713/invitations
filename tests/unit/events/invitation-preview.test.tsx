import { fireEvent, render, screen } from '@testing-library/react';

import { InvitationPreview } from '@/app/admin/events/[eventId]/InvitationPreview';

const initialEvent = {
  title: 'Initial title',
  hostName: 'Initial host',
  location: 'Initial location',
  description: 'Initial description',
  startsAt: null,
  timeZone: 'UTC',
  templateKey: 'classic',
  heroUrl: null,
  emblemUrl: null,
  watermarkUrl: null,
};

describe('InvitationPreview', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'ResizeObserver', {
      configurable: true,
      value: class {
        observe() {}
        disconnect() {}
      },
    });
  });

  it('updates the rendered preview when the event form changes after mount', () => {
    const form = document.createElement('form');
    form.id = 'event-details-form';
    for (const [name, value] of [
      ['title', initialEvent.title],
      ['hostName', initialEvent.hostName],
      ['location', initialEvent.location],
      ['description', initialEvent.description],
      ['timeZone', initialEvent.timeZone],
      ['templateKey', initialEvent.templateKey],
    ]) {
      const input = document.createElement(name === 'description' ? 'textarea' : name === 'templateKey' ? 'select' : 'input');
      input.name = name;
      input.value = value;
      form.append(input);
    }
    document.body.append(form);

    render(<InvitationPreview appUrl="http://localhost:3000" initialEvent={initialEvent} />);

    const titleInput = form.elements.namedItem('title') as HTMLInputElement;
    fireEvent.input(titleInput, { target: { value: 'Updated title' } });

    expect(screen.getByText('Updated title')).toBeInTheDocument();
  });
});
