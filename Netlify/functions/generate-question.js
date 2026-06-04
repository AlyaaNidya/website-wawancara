exports.handler = async (event) => {
    try {
        // Hanya memproses request POST
        if (event.httpMethod !== 'POST') {
            return { statusCode: 405, body: 'Method Not Allowed' };
        }

        const data = JSON.parse(event.body);
        const aspectName = data.aspect;
        const role = data.role;

        const isRoleAdmin = role.toLowerCase().includes('admin');
        const roleName = role.split('(')[0].trim();

        const templatesAdmin = [
            `Berdasarkan pengalaman Anda sebagai ${roleName}, ceritakan situasi spesifik di mana Anda harus menunjukkan ${aspectName.toLowerCase()} saat merekap data atau berkoordinasi di kantor.`,
            `Bagaimana cara Anda mengimplementasikan ${aspectName.toLowerCase()} ketika ada pembaruan sistem IT atau prosedur pendataan secara mendadak?`,
            `Gambarkan momen krusial sebagai ${roleName} di mana ${aspectName.toLowerCase()} Anda diuji saat menghadapi tenggat waktu laporan yang ketat.`,
            `Sebagai ${roleName}, seberapa penting ${aspectName.toLowerCase()} menurut Anda ketika menghadapi komplain dari divisi lain mengenai data yang tidak cocok?`,
            `Ceritakan pengalaman Anda menemukan solusi kerja baru di kantor. Bagaimana ${aspectName.toLowerCase()} berperan dalam proses tersebut bagi seorang ${roleName}?`
        ];

        const templatesOperator = [
            `Berdasarkan pengalaman Anda sebagai ${roleName}, ceritakan situasi spesifik di mana Anda harus menunjukkan ${aspectName.toLowerCase()} saat menghadapi kendala operasional di lapangan.`,
            `Di lingkungan pabrik yang dinamis, berikan contoh saat ${aspectName.toLowerCase()} membuat Anda berhasil mengatasi perubahan target produksi secara mendadak.`,
            `Jelaskan satu insiden di lini produksi di mana ${aspectName.toLowerCase()} sangat menentukan keselamatan (K3) dan kelancaran shift Anda sebagai ${roleName}.`,
            `Sebagai ${roleName}, bagaimana Anda menerapkan ${aspectName.toLowerCase()} saat harus bekerja dengan regu yang baru atau supervisor yang berbeda gaya kerjanya?`,
            `Ceritakan saat Anda menghadapi kelelahan fisik yang luar biasa namun harus mencapai target harian. Bagaimana ${aspectName.toLowerCase()} membantu Anda melewatinya?`
        ];

        const pool = isRoleAdmin ? templatesAdmin : templatesOperator;
        const randomQuestion = pool[Math.floor(Math.random() * pool.length)];

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question: randomQuestion })
        };
    } catch (error) {
        return { 
            statusCode: 500, 
            body: JSON.stringify({ error: "Gagal memproses pertanyaan AI." }) 
        };
    }
};