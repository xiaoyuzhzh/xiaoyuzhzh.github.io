import '@/app/global.css';
import {Provider} from './provider';
import {Inter} from 'next/font/google';
import type {ReactNode} from 'react';

const inter = Inter({
    subsets: ['latin'],
});

export default function Layout({children}: { children: ReactNode }) {
    return (
        <html lang="en" className={inter.className} suppressHydrationWarning>
        <head>
            <link rel="icon" href="/favicon.svg"/>
            <title>凌波小碎步</title>
        </head>
        <body className="flex flex-col min-h-screen">
        <Provider>{children}</Provider>
        </body>
        </html>
    );
}
