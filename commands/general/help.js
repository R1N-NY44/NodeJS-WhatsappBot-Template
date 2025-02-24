const fs = require('fs');
const routes = JSON.parse(fs.readFileSync('./routes.json'));

const prefix = process.env.PREFIX || "!";

module.exports = async (message, client) => {
    
    // Generate help message
    let response = "📌 *Daftar Perintah Bot:*\n";
    routes.forEach(group => {
        response += `\n*${group.group}* - ${group.desc}\n`;
        group.commands.forEach(cmd => {
            response += `  🔹 *${prefix}${cmd.name}* - ${cmd.desc}\n`;
        });
    });
    response += "\n\n📝 *Cara menggunakan perintah:*";
    response += "\nKetik perintah dengan awalan `" + prefix + "`";
    response += "\nContoh: `" + prefix + "help`";

    await message.reply(response);
};
