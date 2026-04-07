import './globals.css';
import { Inter } from 'next/font/google';
import Providers from './providers';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/layout/CartDrawer';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: {
    default: 'VoltStore — Premium EV Charging Equipment',
    template: '%s | VoltStore',
  },
  description: 'Charge smarter with VoltStore. Shop premium EV chargers, NEMA splitters, and charging accessories for every electric vehicle.',
  keywords: ['EV charger', 'NEMA splitter', 'electric vehicle', 'home EV charging', 'Level 2 charger'],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'VoltStore',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen flex flex-col">
        <Providers>
          <Header />
          <CartDrawer />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
