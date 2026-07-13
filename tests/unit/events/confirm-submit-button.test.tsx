import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ConfirmSubmitButton } from '@/app/admin/events/[eventId]/ConfirmSubmitButton';

describe('ConfirmSubmitButton', () => {
  it('describes the cascade and invite-link consequence accessibly', () => {
    render(<ConfirmSubmitButton action={vi.fn()} guestId="guest-1" guestName="Jamie Guest" />);

    expect(screen.getByRole('button', { name: 'Delete guest' })).toHaveAccessibleDescription(
      'Delete this guest, their invitation, and their RSVP. The current invite link will stop working.',
    );
    expect(screen.getByText(/Delete this guest, their invitation, and their RSVP/i)).toBeInTheDocument();
  });

  it('requires confirmation before allowing submission', async () => {
    const user = userEvent.setup();
    const action = vi.fn();
    const confirmMock = vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(<ConfirmSubmitButton action={action} guestId="guest-1" guestName="Jamie Guest" />);
    await user.click(screen.getByRole('button', { name: 'Delete guest' }));

    expect(confirmMock).toHaveBeenCalledWith(
      "Delete Jamie Guest? Their invitation and RSVP will also be removed, and the current invite link will stop working.",
    );
    expect(action).not.toHaveBeenCalled();
    confirmMock.mockRestore();
  });
});
