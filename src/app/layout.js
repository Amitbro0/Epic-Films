import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { siteConfig } from '@/config/siteConfig';
import { Outfit } from 'next/font/google';

import Tracker from '@/components/Analytics/Tracker';

const outfit = Outfit({ subsets: ['latin'] });

export const viewport = {
    themeColor: '#020617',
};

export const metadata = {
    title: siteConfig.studioName,
    description: siteConfig.hero.subheadline,
    manifest: '/manifest.json',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: siteConfig.studioName,
    },
};

import { Suspense } from 'react';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';
// ...
export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body className={outfit.className}>
                <ServiceWorkerRegister />
                <Suspense fallback={null}>
                    <Tracker />
                </Suspense>
                <Navbar />
                <main>{children}</main>
                <Footer />
            </body>
        </html>
    );
}
