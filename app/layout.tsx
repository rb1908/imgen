import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LayoutShell } from "@/components/LayoutShell";
import { Toaster } from 'sonner';


const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "ImageForge",
    description: "AI Image Generation Platform",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body
                className={`${inter.className} antialiased bg-background text-foreground`}
            >
                <LayoutShell>
                    {children}
                </LayoutShell>
                <Toaster />
            </body>
        </html>
    );
}
