module.exports = async (message) => {
    const chat = await message.getChat();
    const args = message.body.trim().split(/\s+/);
    const id = args[1];

    if (!id || isNaN(id)) {
        return chat.sendMessage("⚠️ Mohon masukkan ID sticker LINE yang valid.\nContoh: `!lst 12126860`");
    }

    const url = `https://stickershop.line-scdn.net/stickershop/v1/product/${id}/PC/stickers.zip`;
    await chat.sendMessage(`🔗 URL ZIP: ${url}`);
};
