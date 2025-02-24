require('dotenv').config();
const fs = require('fs');
const path = require('path');
const routes = JSON.parse(fs.readFileSync('./routes.json', 'utf-8'));

const PREFIX = process.env.PREFIX || "!";

module.exports = async (message, client) => {
    const text = message.body.toLowerCase().trim();
    console.log(`${message.from} [${message._data.notifyName}] : ${message.body}`);

    // Only process message that starts with the prefix
    if (!text.startsWith(PREFIX)) return;
    const commandText = text.slice(PREFIX.length).toLowerCase();

    let command, groupPath;
    for (const group of routes) {
        command = group.commands.find(cmd => commandText === cmd.name);
        if (command) {
            groupPath = group.path;
            break;
        }
    }

    if (!command) return;

    try {
        const handlerPath = path.join(__dirname, "commands", groupPath, command.handler);
        const handler = require(handlerPath);
        await handler(message, client);
    } catch (error) {
        console.error("Error pada handler:", error);
        message.reply("⚠️ Terjadi kesalahan saat memproses perintah.");
    }
};
