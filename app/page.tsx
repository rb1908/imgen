
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function Home() {
    const { userId } = await auth();

    if (userId) {
        redirect("/projects");
    }

    return (
        <div className="flex flex-col min-h-screen bg-black text-white selection:bg-indigo-500/30">
            {/* Header */}
            <header className="px-6 h-16 flex items-center justify-between border-b border-white/10">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold text-lg tracking-tight">ImageForge</span>
                </div>
                <div className="flex items-center gap-4">
                    <Link href="/sign-in">
                        <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/10">
                            Log in
                        </Button>
                    </Link>
                    <Link href="/sign-up">
                        <Button className="bg-white text-black hover:bg-gray-200">
                            Get Started
                        </Button>
                    </Link>
                </div>
            </header>

            {/* Hero Section */}
            <main className="flex-1 flex flex-col items-center justify-center px-4 text-center relative overflow-hidden">
                {/* Background Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />

                <div className="relative z-10 max-w-4xl mx-auto space-y-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-gray-300 mb-4 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        <span>v2.0 is now live</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-white/50 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
                        Craft stunning visuals <br /> with AI precision.
                    </h1>

                    <p className="text-xl text-gray-400 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                        The professional workspace for AI image generation. Manage projects, create templates, and sync directly to your store.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
                        <Link href="/sign-up">
                            <Button size="lg" className="h-12 px-8 text-base bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 transition-all hover:scale-105">
                                Start Creating Free
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </Link>
                        <Link href="/sign-in">
                            <Button variant="outline" size="lg" className="h-12 px-8 text-base border-white/10 hover:bg-white/5 hover:text-white bg-transparent">
                                View Demo
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* UI Preview (Abstract) */}
                <div className="mt-20 relative w-full max-w-5xl mx-auto aspect-[16/9] rounded-t-xl border border-white/10 bg-gray-900/50 backdrop-blur shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500">
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
                    <div className="p-4 grid grid-cols-12 gap-4 h-full opacity-50">
                        {/* Sidebar */}
                        <div className="col-span-2 border-r border-white/10 h-full bg-white/5 rounded-l-lg" />
                        {/* Main */}
                        <div className="col-span-10 grid grid-rows-2 gap-4 h-full">
                            <div className="row-span-1 bg-white/5 rounded-lg border border-white/10" />
                            <div className="row-span-1 grid grid-cols-3 gap-4">
                                <div className="bg-white/5 rounded-lg border border-white/10" />
                                <div className="bg-white/5 rounded-lg border border-white/10" />
                                <div className="bg-white/5 rounded-lg border border-white/10" />
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="h-16 border-t border-white/10 flex items-center justify-center text-sm text-gray-500">
                <p>&copy; 2024 ImageForge AI. All rights reserved.</p>
            </footer>
        </div>
    );
}
