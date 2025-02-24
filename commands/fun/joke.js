const axios = require("axios");

module.exports = async (message, client) => {
    try {
        const response = await axios.get("https://v2.jokeapi.dev/joke/Programming?type=single");
        const joke = response.data.joke || "Maaf, tidak bisa mengambil joke saat ini. 😅";

        await message.reply(joke);
    } catch (error) {
        console.error("Error fetching joke:", error);
        await message.reply("❌ Terjadi kesalahan saat mengambil joke.");
    }
};
