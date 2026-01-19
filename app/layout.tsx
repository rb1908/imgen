import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from 'sonner';


const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "ImageForge",
    description: "AI Image Generation Platform",
};

export const viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    themeColor: '#000000',
};


import { ClerkProvider } from '@clerk/nextjs';

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <ClerkProvider>
            <html lang="en">
                <body
                    className={`${inter.className} antialiased bg-background text-foreground`}
                >
                    {children}
                    <Toaster />
                </body>
            </html>
        </ClerkProvider>
    );
}
