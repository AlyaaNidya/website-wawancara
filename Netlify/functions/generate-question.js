const interviewQuestionBank = {
    'Adaptability': {
      operator: ["Kalau kamu tiba-tiba dipindah ke area produksi atau memegang mesin yang belum pernah kamu kerjakan sebelumnya, apa yang akan kamu lakukan pertama kali?", "Pernahkah kamu mendapat giliran shift malam padahal biasanya bekerja di shift pagi? Bagaimana caramu membiasakan kondisi badanmu?"],
      admin: ["Kalau pabrik tiba-tiba mengganti program komputer atau format laporan Excel dengan yang baru, apa yang akan kamu lakukan supaya cepat paham?", "Biasanya kamu mendata barang keluar, tapi hari ini tiba-tiba diminta menggantikan teman yang sakit untuk mengecek barang masuk di gudang. Bagaimana tanggapanmu?"]
    },
    'Creativity': {
      operator: ["Saat sedang mengejar target produksi, tiba-tiba bahan baku di mejamu habis dan petugas suplai sedang tidak ada. Apa akalmu?"],
      admin: ["Kalau kamu harus merekap ratusan lembar bon kertas tapi waktunya sangat mepet, adakah cara atau urutan kerja yang kamu buat sendiri?"]
    },
    'Curiosity': {
      operator: ["Kerja produksi menuntut kita hafal cara kerja banyak mesin. Waktu baru pertama diajari, bagian apa yang paling ingin kamu pelajari duluan?"],
      admin: ["Saat sedang membuat data di komputer, apakah kamu suka mencari tahu rumus atau tombol cepat (shortcut) baru supaya kerjamu lebih enak?"]
    },
    'Emotional Intelligence': {
      operator: ["Di area pabrik itu biasanya bising dan mandor kadang bicara dengan nada tinggi. Bagaimana sikapmu saat ditegur dengan keras?"],
      admin: ["Kalau ada sopir truk pengiriman yang marah-marah minta surat jalan cepat dicetak padahal kamu sedang merekap data lain, apa yang kamu lakukan?"]
    },
    'Initiative': {
      operator: ["Kalau target kuota kerjamu hari ini kebetulan sudah beres, tapi jam pulang pabrik masih setengah jam lagi, apa yang biasanya akan kamu kerjakan?"],
      admin: ["Kalau semua data hari ini sudah kamu masukkan ke sistem dan atasan belum memberi tugas baru, biasanya apa yang kamu lakukan di mejamu?"]
    },
    'Resilience': {
      operator: ["Kerja produksi mengharuskan kamu berdiri lama. Bagaimana caramu agar tidak gampang lelah atau bosan?"],
      admin: ["Menjadi admin berarti harus betah menatap layar komputer berjam-jam. Bagaimana caramu menjaga konsentrasi?"]
    },
    'Integrity': {
      operator: ["Kalau kamu tidak sengaja menjatuhkan barang produksi sampai rusak, tapi kebetulan tidak ada pengawas yang melihat, apa yang akan kamu lakukan?"],
      admin: ["Kalau ternyata jumlah barang fisik di gudang dengan catatan di komputermu tidak sama (selisih), apakah kamu akan jujur melapor?"]
    },
    'Motivation': {
      operator: ["Selain karena butuh penghasilan, adakah alasan lain mengapa kamu tertarik bekerja sebagai operator di pabrik kami?"],
      admin: ["Menurutmu, apa yang membuat pekerjaan administrasi itu menarik atau membuatmu betah, padahal kerjanya hanya duduk di depan komputer?"]
    },
    'Resolution': {
      operator: ["Waktu pergantian shift, teman penggantimu belum juga datang padahal mesinmu tidak boleh ditinggal mati. Apa yang akan kamu lakukan?"],
      admin: ["Sudah waktunya pulang kantor, tapi laporan pengeluaran harian yang kamu kerjakan ternyata angkanya belum seimbang (balance). Apa keputusanmu?"]
    }
};

exports.handler = async (event) => {
    try {
        const { aspect, role } = JSON.parse(event.body);
        const isRoleAdmin = role.toLowerCase().includes('admin');
        const roleKey = isRoleAdmin ? 'admin' : 'operator';
        
        const pool = interviewQuestionBank[aspect][roleKey];
        const randomQuestion = pool[Math.floor(Math.random() * pool.length)];

        return {
            statusCode: 200,
            body: JSON.stringify({ question: randomQuestion })
        };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: "Gagal memproses pertanyaan" }) };
    }
};