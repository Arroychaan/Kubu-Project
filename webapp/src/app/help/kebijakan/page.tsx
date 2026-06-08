export const metadata = {
    title: 'Kebijakan Pengguna - KUBU',
    description: 'Syarat dan Ketentuan Penggunaan Layanan Kubu.',
};

export default function KebijakanPage() {
    return (
        <div className="max-w-none text-zinc-300">
            <h1 className="text-4xl sm:text-5xl md:text-[64px] font-black tracking-tight leading-[1.1] mb-12 sm:mb-20 text-white">
                Kebijakan Pengguna
            </h1>

            <div className="bg-zinc-900/50 border border-brand-border/60 rounded-xl p-6 md:p-8 mb-12">
                <p className="text-sm font-bold text-white mb-0">
                    <span className="text-brand-blue">Kebijakan Pengguna Kubu</span> untuk pengguna di seluruh wilayah Indonesia telah diperbarui. Kebijakan ini berlaku efektif sejak tanggal publikasi.
                </p>
            </div>

            <h2 className="text-2xl font-bold text-white mb-6">Ringkasan Ketentuan Kami</h2>
            
            <p className="text-zinc-400 mb-8 leading-relaxed">
                Kebijakan Pengguna ("Ketentuan") ini adalah bagian dari Perjanjian Pengguna — sebuah kontrak yang mengikat secara hukum yang mengatur hubungan Anda dengan Kubu. 
                <strong className="text-white"> Anda harus membaca Ketentuan ini secara penuh, tetapi berikut adalah beberapa poin utama yang perlu Anda ketahui:</strong>
            </p>

            <ul className="space-y-6 text-zinc-400 list-disc pl-5">
                <li className="leading-relaxed">
                    <strong className="text-white block mb-1">Panggung Opini Publik yang Terbuka:</strong>
                    Kubu adalah arena sosial untuk jajak pendapat dan perdebatan opini secara terbuka. Dengan menggunakan Layanan, Anda setuju untuk berinteraksi dengan rasa saling menghargai.
                </li>
                <li className="leading-relaxed">
                    <strong className="text-white block mb-1">Saat membuat Topik (Polling) dan memberikan argumen:</strong>
                    Anda bertanggung jawab penuh atas penggunaan Layanan dan Konten Anda. Anda harus mematuhi Perjanjian Pengguna, termasuk semua kebijakan, aturan moderasi, dan hukum yang berlaku di Indonesia.
                </li>
                <li className="leading-relaxed">
                    <strong className="text-white block mb-1">Kami memiliki hak penegakan hukum yang luas:</strong>
                    Kubu berhak untuk mengambil tindakan penegakan terhadap Anda jika Anda melanggar ketentuan ini. Misalnya, menghapus Konten Anda (Topik maupun Argumen), membatasi visibilitas (*shadowban*), menghentikan akses Anda ke Kubu, atau menangguhkan akun Anda karena risiko hukum, penyebaran hoaks, atau ujaran kebencian.
                </li>
                <li className="leading-relaxed">
                    <strong className="text-white block mb-1">Penggunaan Layanan adalah risiko Anda sendiri:</strong>
                    Kami menyediakan Layanan "SEBAGAIMANA ADANYA" (AS IS). Anda mungkin akan terekspos pada Konten yang menyinggung, menyesatkan, atau tidak pantas dari pengguna lain. Kubu tidak bertanggung jawab atas segala kerugian yang timbul dari partisipasi opini pihak ketiga.
                </li>
            </ul>

            <div className="my-12 h-px w-full bg-brand-border/40" />

            <h2 className="text-2xl font-bold text-white mb-6">1. Siapa yang Dapat Menggunakan Layanan</h2>
            <p className="text-zinc-400 mb-6 leading-relaxed">
                Anda hanya dapat menggunakan Layanan jika Anda menyetujui untuk mengikatkan diri dalam kontrak yang sah dengan Kubu dan bukan merupakan orang yang dilarang untuk menerima layanan berdasarkan hukum yurisdiksi yang berlaku. 
            </p>

            <h2 className="text-2xl font-bold text-white mb-6">2. Privasi Anda</h2>
            <p className="text-zinc-400 mb-6 leading-relaxed">
                Kebijakan Privasi kami menjelaskan bagaimana kami menangani informasi yang Anda berikan kepada kami ketika Anda menggunakan Layanan. Anda mengerti bahwa melalui penggunaan Layanan Anda menyetujui pengumpulan dan penggunaan (sebagaimana ditetapkan dalam Kebijakan Privasi) informasi ini.
            </p>

        </article>
    );
}
