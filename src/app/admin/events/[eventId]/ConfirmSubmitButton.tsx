'use client';

interface ConfirmSubmitButtonProps {
  action: (formData: FormData) => void | Promise<void>;
  guestId: string;
  guestName: string;
}

export function ConfirmSubmitButton({ action, guestId, guestName }: ConfirmSubmitButtonProps) {
  const descriptionId = `delete-guest-help-${guestId}`;
  const confirmationMessage = `Delete ${guestName}? Their invitation and RSVP will also be removed, and the current invite link will stop working.`;

  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(confirmationMessage)) {
          event.preventDefault();
        }
      }}
      className="stack compact-info"
    >
      <p id={descriptionId} className="muted">
        Delete this guest, their invitation, and their RSVP. The current invite link will stop working.
      </p>
      <button type="submit" className="secondary" aria-describedby={descriptionId}>
        Delete guest
      </button>
    </form>
  );
}
