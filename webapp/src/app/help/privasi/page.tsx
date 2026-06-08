export const metadata = {
    title: 'Privasi Pengguna - KUBU',
    description: 'Kebijakan Privasi Layanan Kubu.',
};

export default function PrivasiPage() {
    return (
        <div className="max-w-none text-zinc-300">
            <h1 className="text-4xl sm:text-5xl md:text-[64px] font-black tracking-tight leading-[1.1] mb-12 sm:mb-20 text-white">
                Kebijakan Privasi
            </h1>

            <div className="bg-zinc-900/50 border border-brand-border/60 rounded-xl p-6 md:p-8 mb-12">
                <p className="text-sm font-bold text-white mb-0">
                    <span className="text-brand-blue">Kebijakan Privasi Kubu</span> kami berfokus pada transparansi publik. Segala bentuk *vote* dan argumen akan tercatat sebagai bagian dari diskusi terbuka.
                </p>
            </div>

            <h2 className="text-2xl font-bold text-white mb-6">Prinsip Privasi Kami</h2>
            
            <p className="text-zinc-400 mb-8 leading-relaxed">
                Di Kubu, kami membangun ruang publik untuk berdebat secara sehat. Karena sifat alamiah aplikasi kami adalah jajak pendapat publik, privasi Anda dikelola dengan transparansi penuh. 
                <strong className="text-white"> Berikut adalah poin utama bagaimana kami mengelola data Anda:</strong>
            </p>

            <ul className="space-y-6 text-zinc-400 list-disc pl-5">
                <li className="leading-relaxed">
                    <strong className="text-white block mb-1">Data Opini Publik (Polling & Argumen):</strong>
                    Seluruh pilihan kubu (A atau B) yang Anda ambil, beserta argumen yang Anda lemparkan di kolom komentar, adalah data publik yang akan ditampilkan di profil Anda dan dapat dilihat oleh seluruh pengguna internet.
                </li>
                <li className="leading-relaxed">
                    <strong className="text-white block mb-1">Informasi Identitas:</strong>
                    Informasi dasar seperti *username*, foto profil, dan Peringkat Pengaruh (Title/Points) Anda bersifat publik untuk menjaga transparansi reputasi setiap pengguna dalam ekosistem Kubu.
                </li>
                <li className="leading-relaxed">
                    <strong className="text-white block mb-1">Kami tidak menjual data Anda kepada pihak ketiga:</strong>
                    Data perilaku *voting* Anda tidak akan dijual ke pihak ketiga untuk kepentingan iklan tertarget di luar *platform* kami. Kami menggunakannya murni untuk menghitung sentimen publik dan algoritma peringkat internal Kubu.
                </li>
                <li className="leading-relaxed">
                    <strong className="text-white block mb-1">Hak Hapus Data:</strong>
                    Anda memiliki hak penuh untuk menarik opini Anda. Menghapus sebuah komentar akan menghilangkannya secara permanen dari basis data kami, walaupun kutipan (*quote*) oleh pengguna lain mungkin masih tertinggal.
                </li>
            </ul>

            <div className="my-12 h-px w-full bg-brand-border/40" />

            <h2 className="text-2xl font-bold text-white mb-6">Penyimpanan dan Keamanan Data</h2>
            <p className="text-zinc-400 mb-6 leading-relaxed">
                Data Anda dilindungi melalui enkripsi tingkat bank yang disediakan oleh infrastruktur otentikasi kami (Supabase Auth). Kata sandi Anda dan sesi *login* terlindungi dan tidak dapat diakses oleh karyawan internal Kubu.
            </p>

        </article>
    );
}
