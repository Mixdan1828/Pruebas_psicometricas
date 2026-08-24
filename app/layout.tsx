import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata = {
  title: 'Pruebas Psicométricas - Fundación Dr. Hernández Zurita',
  description: 'Plataforma para la realización de pruebas psicométricas de la Fundación Dr. Hernández Zurita.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}