const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');

// Load routes.json
const routes = JSON.parse(fs.readFileSync('./routes.json'));

// Create a new client using the LocalAuth method
const client = new Client({
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    },
    authStrategy: new LocalAuth(),
});

// Print QR code on terminal for authentication
client.on('qr', (qr) => {
    console.log('Scan QR ini untuk login:');
    qrcode.generate(qr, { small: true });
});

// Print message when client is ready
client.on('ready', () => {
    console.log('Bot siap dan terhubung!');
});

// Handle incoming messages
client.on('message', async (message) => {
    const text = message.body.toLowerCase().trim();
    console.log(`Pesan masuk dari ${message.from}: ${message.body}`);

    // Cari command yang cocok di routes.json
    const command = routes.find(route => text === route.name);
    if (!command) return; // Jika tidak ditemukan, abaikan

    try {
        const handler = require(command.handler);
        await handler(message, client);
    } catch (error) {
        console.error("Error pada handler:", error);
        message.reply("⚠️ Terjadi kesalahan saat memproses perintah.");
    }
});

client.initialize();
