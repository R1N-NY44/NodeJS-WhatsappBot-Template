const fs = require('fs');
const prefix = process.env.PREFIX || "!";

module.exports = async (message, client) => {
    // Load routes.json
    const routes = JSON.parse(fs.readFileSync('./routes.json'));

    // Format daftar command
    let response = "📌 *Daftar Perintah Bot:*\n";
    // routes.forEach(route => {
    //     response += `\n🔹 *${prefix}${route.name}* - ${route.desc}`;
    // });
    routes.forEach(group => {
        response += `\n📂 *${group.group}* - ${group.desc}\n`;
        group.commands.forEach(cmd => {
            response += `  🔹 *${prefix}${cmd.name}* - ${cmd.desc}\n`;
        });
    });

    await message.reply(response);
};
