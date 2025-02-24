const fs = require('fs');

module.exports = async (message, client) => {
    // Load routes.json
    const routes = JSON.parse(fs.readFileSync('./routes.json'));

    // Format daftar command
    let response = "📌 *Daftar Perintah Bot:*\n";
    routes.forEach(route => {
        response += `\n🔹 *${route.name}* - ${route.desc}`;
    });

    await message.reply(response);
};
