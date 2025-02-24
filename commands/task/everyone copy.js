module.exports = async (message, client) => {
    try {
        // Get chat info and log it
        const chat = await message.getChat();
        console.log('Chat info:', {
            id: chat.id,
            isGroup: chat.isGroup,
            name: chat.name
        });

        // Check if it's a group message
        if (!chat.isGroup) {
            console.log('Not a group message:', chat);
            await message.reply('⚠️ Perintah ini hanya dapat digunakan dalam grup!');
            return;
        }

        // Log participants
        console.log('Participants:', chat.participants.length);

        // Format mention list with names
        let mentions = [];
        let text = '🔔 *Pengumuman untuk semua anggota!*\n\n';

        for (let participant of chat.participants) {
            // Log each participant for debugging
            console.log('Processing participant:', participant.id.user);
            
            // Add to mentions array
            mentions.push(participant.id._serialized);
            // Add to text with @mention format
            text += `@${participant.id.user} `;
        }

        console.log('Sending message with mentions:', mentions.length);

        // Send message with mentions
        await chat.sendMessage(text, {
            mentions: mentions
        });

    } catch (error) {
        console.error('Detailed error in everyone command:', error);
        await message.reply('⚠️ Terjadi kesalahan saat mention semua anggota.');
    }
};