export const metadata = {
    title: 'Tentang Kubu',
    description: 'Visi dan Misi Platform Jajak Pendapat Sosial Kubu.',
};

export default function TentangPage() {
    return (
        <div className="max-w-none text-zinc-300">
            <h1 className="text-4xl sm:text-5xl md:text-[64px] font-black tracking-tight leading-[1.1] mb-12 sm:mb-20 text-white">
                Tentang Kami
            </h1>

            <h2 className="text-2xl font-bold text-white mb-6">Demokratisasi Opini Publik</h2>
            
            <p className="text-zinc-400 mb-8 leading-relaxed">
                Kubu lahir dari sebuah kegelisahan: diskusi di media sosial sering kali berujung pada argumen tanpa ujung dan tidak terukur. Kami ingin menciptakan sebuah platform di mana opini bisa diukur, dipertanggungjawabkan, dan didebatkan secara sehat dan transparan.
            </p>

            <div className="bg-brand-blue/10 border border-brand-blue/20 rounded-xl p-8 mb-12">
                <h3 className="text-xl font-bold text-white mb-4">Visi Kami</h3>
                <p className="text-brand-blue/80 font-medium leading-relaxed mb-0">
                    Menjadi arena digital utama di mana masyarakat bisa secara transparan menentukan sikap, menemukan konsensus, dan menyuarakan sentimen nyata di balik setiap perdebatan yang terjadi di Indonesia.
                </p>
            </div>

            <h2 className="text-2xl font-bold text-white mb-6">Sistem Peringkat (Reputasi)</h2>
            <p className="text-zinc-400 mb-6 leading-relaxed">
                Di Kubu, opini yang berbobot dihargai. Setiap dukungan (support) yang didapatkan argumen Anda akan dihitung menjadi Reputasi Anda. Ini menjamin bahwa pengguna dengan argumen paling logis dan berempati akan memiliki *Peringkat Pengaruh* yang tinggi, membedakan akun manusia yang berpikir dari sekadar mesin penyebar berita bohong (*bot*).
            </p>

            <h2 className="text-2xl font-bold text-white mb-6">Transparansi Pertama</h2>
            <p className="text-zinc-400 mb-6 leading-relaxed">
                Tidak ada manipulasi algoritma. Apa yang Anda lihat di *Topik Panas* dan hasil *voting* adalah murni interaksi organik dari Warga Kubu lainnya. Angka berbicara lebih keras daripada polarisasi semu.
            </p>

            <div className="mt-20 pt-8 border-t border-brand-border/40 text-sm text-zinc-600 font-medium">
                © 2026 Kreativlabs & Kubu Team. Dibuat dengan semangat keterbukaan.
            </div>
        </article>
    );
}
