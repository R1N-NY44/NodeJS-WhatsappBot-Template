const { MessageMedia } = require('whatsapp-web.js');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const extract = require('extract-zip');
const { tmpdir } = require('os');
const crypto = require('crypto');

module.exports = async (message) => {
    const chat = await message.getChat();
    const args = message.body.trim().split(/\s+/);
    const id = args[1];

    if (!id || isNaN(id)) {
        return chat.sendMessage("⚠️ Mohon masukkan ID sticker LINE yang valid.\nContoh: `!lst 12126860`");
    }

    const url = `https://stickershop.line-scdn.net/stickershop/v1/product/${id}/PC/stickers.zip`;
    const zipName = `${crypto.randomBytes(8).toString('hex')}.zip`;
    const zipPath = path.join(tmpdir(), zipName);
    const extractPath = zipPath.replace('.zip', '');

    try {
        // Download ZIP
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        fs.writeFileSync(zipPath, response.data);

        // Extract ZIP
        await extract(zipPath, { dir: extractPath });

        // Ambil semua file yang hanya angka.png
        const files = fs.readdirSync(extractPath).filter(name => /^\d+\.png$/.test(name));

        if (files.length === 0) {
            return chat.sendMessage("❌ Tidak ditemukan file sticker PNG yang valid.");
        }

        // Kirim stiker satu per satu (atau bisa di-limit)
        for (const file of files) {
            const imgPath = path.join(extractPath, file);
            const imgData = fs.readFileSync(imgPath, { encoding: 'base64' });
            const mimeType = 'image/png';

            const media = new MessageMedia(mimeType, imgData, file);
            await chat.sendMessage(media, {
                sendMediaAsSticker: true,
                stickerName: `Line ID ${id}`,
            });
        }

        // Bersihkan file sementara
        fs.rmSync(zipPath, { force: true });
        fs.rmSync(extractPath, { recursive: true, force: true });

    } catch (error) {
        console.error("❌ Error saat mengambil sticker LINE:", error);
        await chat.sendMessage("⚠️ Gagal mengambil data sticker LINE. Pastikan ID benar dan coba lagi.");
    }
};