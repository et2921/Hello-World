import './globals.css';
import type { Metadata } from 'next';
import { MusicPlayer } from '@/components/MusicPlayer';

export const metadata: Metadata = {
  title: 'Meme Court',
  description: 'Vote on memes — Meme Court.'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <MusicPlayer />
      </body>
    </html>
  );
}
