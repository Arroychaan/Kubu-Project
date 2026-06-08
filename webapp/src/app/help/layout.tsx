import Link from 'next/link';
import Image from 'next/image';

export default function HelpLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-brand-blue/30 font-sans">
            {/* Minimal Header */}
            <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-brand-border/40">
                <div className="max-w-[1000px] mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
                    {/* Left: Logo & Title */}
                    <div className="flex items-center gap-4">
                        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                            <div className="relative w-8 h-8 flex items-center justify-center bg-white rounded-full overflow-hidden shrink-0">
                                <Image
                                    src="/logo.png"
                                    alt="Kubu Logo"
                                    fill
                                    sizes="32px"
                                    className="object-contain p-1.5"
                                    priority
                                />
                            </div>
                        </Link>
                        <div className="h-4 w-px bg-brand-border" />
                        <Link href="/help" className="text-white font-bold text-lg hover:underline">
                            Pusat Bantuan
                        </Link>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-4 text-[13px] md:text-sm font-medium">
                        <Link href="/help/arsip" className="text-zinc-400 hover:text-white transition-colors hidden sm:block">
                            Arsip Kebijakan
                        </Link>
                        <button className="px-4 py-1.5 rounded-full border border-brand-border text-white hover:bg-zinc-800 transition-colors">
                            Unduh PDF
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="max-w-[800px] mx-auto px-4 sm:px-6 md:px-8 py-12 md:py-20">
                {children}
            </main>
        </div>
    );
}
