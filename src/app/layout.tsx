import { Manrope, Space_Grotesk } from 'next/font/google';

const spaceGrotesk = Space_Grotesk({ variable: '--font-space-grotesk', subsets: ['latin'] });
const manrope = Manrope({ variable: '--font-manrope', subsets: ['latin'] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html className={`${spaceGrotesk.variable} ${manrope.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
