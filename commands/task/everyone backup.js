// Map untuk menyimpan timestamp terakhir per grup
const cooldownMap = new Map();
const COOLDOWN = 30 * 60 * 1000; // 30 menit dalam milidetik

module.exports = async (message) => {
    const chat = await message.getChat();

    // Pastikan hanya di grup
    if (!chat.isGroup) {
        await message.reply("⚠️ Fitur ini hanya bisa digunakan di grup.");
        return;
    }

    const groupId = chat.id._serialized;
    const now = Date.now();

    // Cek apakah grup ini masih dalam cooldown
    if (cooldownMap.has(groupId)) {
        const lastUsed = cooldownMap.get(groupId);
        const timeLeft = lastUsed + COOLDOWN - now;

        if (timeLeft > 0) {
            const minutesLeft = Math.ceil(timeLeft / 60000);
            await message.reply(`⏳ Command @everyone bisa digunakan lagi dalam ${minutesLeft} menit.`);
            return;
        }
    }

    try {
        const mentions = [];
        let text = "📢 *Panggilan untuk semua anggota grup!* \n";

        for (const participant of chat.participants) {
            const contact = await message.client.getContactById(participant.id._serialized);
            mentions.push(contact);
            text += `@${participant.id.user} `;
        }

        // Kirim pesan dan simpan waktu penggunaan
        await chat.sendMessage(text.trim(), { mentions });
        cooldownMap.set(groupId, now);

    } catch (err) {
        console.error("❌ Error saat memanggil semua anggota:", err);
        await message.reply("⚠️ Terjadi kesalahan saat memanggil semua anggota.");
    }
};