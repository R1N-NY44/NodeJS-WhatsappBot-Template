const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const messageHandler = require('./handler'); // Import handler

const client = new Client({
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    },
    authStrategy: new LocalAuth(),
});

// Show QR code
client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
});

// Show ready message
client.on('ready', () => {
    console.log('Bot siap dan terhubung!');
});

// Handle incoming message using handler.js
client.on('message', (message) => messageHandler(message, client));

client.initialize();
