// Map untuk menyimpan data per grup
const cooldownMap = new Map();
const COOLDOWN = 30 * 60 * 1000; // 30 menit
const MAX_USER_PER_GROUP = 3;

module.exports = async (message) => {
    const chat = await message.getChat();

    // Pastikan hanya di grup
    if (!chat.isGroup) {
        await message.reply("⚠️ Fitur ini hanya bisa digunakan di grup.");
        return;
    }

    const groupId = chat.id._serialized;
    const userId = message.author || message.from; // ID pengirim
    const now = Date.now();

    let groupData = cooldownMap.get(groupId);

    // Jika belum ada data atau cooldown sudah habis, reset
    if (!groupData || now - groupData.startTime > COOLDOWN) {
        groupData = {
            startTime: now,
            users: new Set(), // kumpulan user unik yang sudah pakai
        };
        cooldownMap.set(groupId, groupData);
    }

    // Cek apakah user sudah pernah pakai dalam periode ini
    if (groupData.users.has(userId)) {
        await message.reply("⏳ Kamu sudah menggunakan command ini dalam 30 menit terakhir di grup ini.");
        return;
    }

    // Jika sudah mencapai batas 5 user, tolak duluan
    if (groupData.users.size >= MAX_USER_PER_GROUP) {
        const minutesLeft = Math.ceil((groupData.startTime + COOLDOWN - now) / 60000);
        await message.reply(
            `🚫 Batas penggunaan perintah tercapai (${MAX_USER_PER_GROUP}/${MAX_USER_PER_GROUP}).\n\n Hanya ${MAX_USER_PER_GROUP} pengguna yang bisa memakai command ini setiap 30 menit dalam grup.\n\nCoba lagi dalam ${minutesLeft} menit.`
        );
        return;
    }

    try {
        const mentions = [];
        let text = "📢 *Panggilan untuk semua anggota grup!* \n";

        for (const participant of chat.participants) {
            const contact = await message.client.getContactById(participant.id._serialized);
            mentions.push(contact);
            text += `@${participant.id.user} `;
        }

        // Kirim pesan
        await chat.sendMessage(text.trim(), { mentions });

        // Tambahkan user ke daftar pengguna
        groupData.users.add(userId);
        cooldownMap.set(groupId, groupData);

    } catch (err) {
        console.error("❌ Error saat memanggil semua anggota:", err);
        await message.reply("⚠️ Terjadi kesalahan saat memanggil semua anggota.");
    }
};
