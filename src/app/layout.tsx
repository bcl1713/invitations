import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Invitations Platform',
  description: 'Self-hosted invitations and RSVP platform',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
