const { MessageMedia } = require('whatsapp-web.js');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const extract = require('extract-zip');
const { execSync } = require('child_process');
const { tmpdir } = require('os');
const crypto = require('crypto');

module.exports = async (message) => {
    const chat = await message.getChat();
    const args = message.body.trim().split(/\s+/);
    let input = args[1];

    if (!input) {
        message.reply("Mohon masukkan ID atau URL stiker LINE.");
        return;
    }

    // Cek apakah input berupa URL
    let idMatch = input.match(/\/product\/(\d+)/);
    let id = idMatch ? idMatch[1] : input;

    if (!id || isNaN(id)) {
        return chat.sendMessage("⚠️ Mohon masukkan ID sticker LINE yang valid atau URL stiker yang valid\nContoh: `!lst 12126860`\natau `!lst https://line.me/S/sticker/12126860`");
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
            return chat.sendMessage("❌ Gagal mengunduh data...");
        }

        await chat.sendMessage("📦 Mengekstrak...");
        await extract(zipPath, { dir: extractPath });

        // Cek apakah ini paket animasi (GIF)
        let animationFolder = path.join(extractPath, 'animation@2x');
        if (!fs.existsSync(animationFolder)) {
            animationFolder = path.join(extractPath, 'animation');
        }

        if (fs.existsSync(animationFolder)) {
            const animFiles = fs.readdirSync(animationFolder).filter(name =>
                name.endsWith('.png')
            );

            if (animFiles.length > 0) {
                await chat.sendMessage(`✨ ${animFiles.length} Stiker animasi ditemukan...`);

                // for (const file of animFiles) {
                //     const inputPath = path.join(animationFolder, file);
                //     const outputPath = path.join(extractPath, file.replace('.png', '.mp4'));

                //     try {
                //         // Konversi APNG ke MP4
                //         execSync(`ffmpeg -y -i "${inputPath}" -vf "scale=512:-2:flags=lanczos,format=rgba,split[bg][fg];[bg]drawbox=0:0:iw:ih:white@1.0:t=fill[white];[white][fg]overlay=format=auto,format=yuv420p,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=white" -movflags faststart "${outputPath}"`);

                //         if (!fs.existsSync(outputPath)) {
                //             console.warn(`⚠️ ffmpeg tidak menghasilkan file video: ${outputPath}`);
                //             continue;
                //         }

                //         const videoBuffer = fs.readFileSync(outputPath);
                //         const media = new MessageMedia('video/mp4', videoBuffer.toString('base64'), file.replace('.png', '.mp4'));

                //         await chat.sendMessage(media, {
                //             sendMediaAsSticker: true,
                //             stickerName: `Made By ${message._data.notifyName}`,
                //             stickerAuthor: `Rin Nyaa Bot :3`,
                //         });

                //         fs.rmSync(outputPath, { force: true });
                //     } catch (error) {
                //         console.error(`❌ Gagal mengonversi ${inputPath} ke MP4:`, error);
                //     }
                // }

                for (const file of animFiles) {
                    const inputPath = path.join(animationFolder, file);
                    const outputPath = path.join(extractPath, file.replace('.png', '.webp'));

                    try {
                        // Konversi APNG ke WebP animasi dengan transparansi
                        execSync(`ffmpeg -y -i "${inputPath}" -vf "scale=512:512:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000" -lossless 1 -compression_level 6 -q:v 100 -loop 0 -preset picture -an -vsync 0 "${outputPath}"`);

                        if (!fs.existsSync(outputPath)) {
                            console.warn(`⚠️ ffmpeg tidak menghasilkan file webp: ${outputPath}`);
                            continue;
                        }

                        const webpBuffer = fs.readFileSync(outputPath);
                        const media = new MessageMedia('image/webp', webpBuffer.toString('base64'), file.replace('.png', '.webp'));

                        await chat.sendMessage(media, {
                            sendMediaAsSticker: true,
                            stickerName: `Made By ${message._data.notifyName}`,
                            stickerAuthor: `Rin Nyaa Bot :3`,
                        });

                        fs.rmSync(outputPath, { force: true });
                    } catch (error) {
                        console.error(`❌ Gagal mengonversi ${inputPath} ke WebP:`, error);
                    }
                }

                fs.rmSync(zipPath, { force: true });
                fs.rmSync(extractPath, { recursive: true, force: true });

                return await chat.sendMessage("✅ Semua stiker animasi telah dikirim");
            }
        }

        // Fallback: PNG statis
        const staticFiles = fs.readdirSync(extractPath).filter(name => /^\d+\.png$/.test(name));

        if (staticFiles.length === 0) {
            return chat.sendMessage("❌ Tidak ditemukan file stiker yang valid");
        }

        await chat.sendMessage(`✅ Ditemukan ${staticFiles.length} stiker...`);

        for (const file of staticFiles) {
            const imgPath = path.join(extractPath, file);
            const imgData = fs.readFileSync(imgPath, { encoding: 'base64' });
            const media = new MessageMedia('image/png', imgData, file);

            await chat.sendMessage(media, {
                sendMediaAsSticker: true,
                stickerName: `Made By ${message._data.notifyName}`,
                stickerAuthor: `Rin Nyaa Bot :3`,
            });
        }

        fs.rmSync(zipPath, { force: true });
        fs.rmSync(extractPath, { recursive: true, force: true });
    } catch (error) {
        console.error("❌ Error saat mengambil sticker LINE:", error);
        await chat.sendMessage("⚠️ Terjadi kesalahan saat mengambil atau memproses stiker");
    }
};
