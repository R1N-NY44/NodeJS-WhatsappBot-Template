const { MessageMedia } = require('whatsapp-web.js');

module.exports = async (message) => {
    const chat = await message.getChat();

    if (message.hasMedia) {
        try {
            const media = await message.downloadMedia();
            const maxSize = 1024 * 1024 * 8; // 8MB

            if (media.data.length > maxSize) {
                await chat.sendMessage("⚠️ *File terlalu besar!* \nMaksimal ukuran: 8MB dan dimensi 1024x1024px.");
                return;
            }

            const sticker = new MessageMedia(media.mimetype, media.data, media.filename);
            await chat.sendMessage(sticker, {
                sendMediaAsSticker: true,
                stickerName: `by ${message._data.notifyName}`,
                // stickerAuthor: message._data.notifyName,
            });

        } catch (error) {
            console.error("❌ Error saat membuat stiker:", error);
            await chat.sendMessage("⚠️ Terjadi kesalahan saat memproses stiker.");
        }
    }
};
