// module.exports = async (message, client) => {
//     const jokes = [
//         "Kenapa programmer selalu pakai kacamata? Karena mereka nggak bisa C# 🤓",
//         "Kenapa JavaScript suka bercanda? Karena dia nggak punya tipe yang jelas 😂",
//         "Kenapa komputer suka hujan? Karena ada banyak *cloud* ☁️"
//     ];
//     const joke = jokes[Math.floor(Math.random() * jokes.length)];
//     await message.reply(joke);
// };
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
