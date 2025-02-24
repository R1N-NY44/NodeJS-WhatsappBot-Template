require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');

// Load routes.json
const routes = JSON.parse(fs.readFileSync('./routes.json'));

// Load prefix from environment variable or use default value
const prefix = process.env.PREFIX || "!";

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
    console.log(`${message.from} [${message._data.notifyName}] : ${message.body}`);

    let text = message.body.trim();

    // Cek apakah pesan diawali dengan prefix
    if (!text.startsWith(prefix)) return;

    // Hapus prefix dari pesan
    text = text.slice(prefix.length).trim().toLowerCase();
    console.log(`Command Issue by ${message.from} [${message._data.notifyName}] : ${message.body}`);

    // Cari command yang cocok di routes.json
    // const command = routes.find(route => text === route.name);

    // Cari command dalam semua grup
    let command, groupPath;
    for (const group of routes) {
        command = group.commands.find(cmd => text === cmd.name);
        if (command) {
            groupPath = group.path;
            break;
        }
    }

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
