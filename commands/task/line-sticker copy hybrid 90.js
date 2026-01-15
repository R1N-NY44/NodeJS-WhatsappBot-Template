const { MessageMedia } = require('whatsapp-web.js');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const extract = require('extract-zip');
const { tmpdir } = require('os');
const crypto = require('crypto');
const sharp = require('sharp');

module.exports = async (message) => {
    const chat = await message.getChat();
    const args = message.body.trim().split(/\s+/);
    const id = args[1];

    if (!id || isNaN(id)) {
        return chat.sendMessage("⚠️ Mohon masukkan ID sticker LINE yang valid.\nContoh: `!lst 12126860`");
    }

    const urls = [
        `https://stickershop.line-scdn.net/stickershop/v1/product/${id}/PC/stickerpack.zip`,
        `https://stickershop.line-scdn.net/stickershop/v1/product/${id}/PC/stickers.zip`
    ];

    const zipName = `${crypto.randomBytes(8).toString('hex')}.zip`;
    const zipPath = path.join(tmpdir(), zipName);
    const extractPath = zipPath.replace('.zip', '');

    try {
        let downloaded = false;

        await chat.sendMessage("📥 Mencoba mengunduh stiker dari LINE...");

        for (const url of urls) {
            try {
                const response = await axios.get(url, { responseType: 'arraybuffer' });
                fs.writeFileSync(zipPath, response.data);
                downloaded = true;
                break;
            } catch (err) {
                console.warn(`❌ Gagal unduh dari ${url}`);
            }
        }

        if (!downloaded) {
            return chat.sendMessage("❌ Gagal mengunduh file ZIP dari kedua URL.");
        }

        await chat.sendMessage("📦 Mengekstrak file ZIP...");
        await extract(zipPath, { dir: extractPath });

        // Cek apakah ini paket animasi (GIF)
        let animationFolder = path.join(extractPath, 'animation@2x');
        if (!fs.existsSync(animationFolder)) {
            animationFolder = path.join(extractPath, 'animation');
        }

        if (fs.existsSync(animationFolder)) {
            const animFiles = fs.readdirSync(animationFolder).filter(name =>
                // name.endsWith('@2x.png') || name.endsWith('.png')
                name.endsWith('.png')
            );

            if (animFiles.length > 0) {
                await chat.sendMessage(`✨ Stiker GIF ditemukan: ${animFiles.length} stiker...`);

                for (const file of animFiles) {
                    const inputPath = path.join(animationFolder, file);
                    const gifBuffer = await sharp(inputPath, { animated: true }).gif().toBuffer();
                    const media = new MessageMedia('image/gif', gifBuffer.toString('base64'), file.replace('.png', '.gif'));

                    await chat.sendMessage(media, {
                        sendMediaAsSticker: true,
                        stickerName: `LINE ID ${id} (GIF)`,
                        stickerAuthor: `Made by ${message._data.notifyName}`,
                    });
                }

                // Cleanup
                fs.rmSync(zipPath, { force: true });
                fs.rmSync(extractPath, { recursive: true, force: true });

                return await chat.sendMessage("🧹 Selesai. Semua stiker GIF telah dikirim dan file sementara dihapus.");
            }
        }

        // Fallback: PNG statis
        const staticFiles = fs.readdirSync(extractPath).filter(name => /^\d+\.png$/.test(name));

        if (staticFiles.length === 0) {
            return chat.sendMessage("❌ Tidak ditemukan file PNG stiker yang valid dalam ZIP.");
        }

        await chat.sendMessage(`✅ Ditemukan ${staticFiles.length} stiker PNG...`);

        for (const file of staticFiles) {
            const imgPath = path.join(extractPath, file);
            const imgData = fs.readFileSync(imgPath, { encoding: 'base64' });
            const media = new MessageMedia('image/png', imgData, file);

            await chat.sendMessage(media, {
                sendMediaAsSticker: true,
                stickerName: `LINE ID ${id}`,
                stickerAuthor: `Made by ${message._data.notifyName}`,
            });
        }

        fs.rmSync(zipPath, { force: true });
        fs.rmSync(extractPath, { recursive: true, force: true });

        await chat.sendMessage("🧹 Selesai. File sementara dibersihkan.");
    } catch (error) {
        console.error("❌ Error saat mengambil sticker LINE:", error);
        await chat.sendMessage("⚠️ Terjadi kesalahan saat mengambil atau memproses stiker. Pastikan ID benar.");
    }
};
