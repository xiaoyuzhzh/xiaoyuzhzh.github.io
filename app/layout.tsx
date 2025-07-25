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
            {/* Google Analytics */}
            <script async src="https://www.googletagmanager.com/gtag/js?id=G-LF308Y9BGJ"></script>
            <script
                dangerouslySetInnerHTML={{
                    __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-LF308Y9BGJ');
          `,
                }}
            />
        </head>
        <body className="flex flex-col min-h-screen">
        <Provider>{children}</Provider>
        </body>
        </html>
    );
}
