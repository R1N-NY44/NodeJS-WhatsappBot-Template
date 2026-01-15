const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const DB_PATH = path.join(__dirname, "reminder.json");
const UTIL_PATH = path.join(__dirname, "utilities");

function readDB() {
    if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, "[]");
    return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
}
function writeDB(data) {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}
function pad(n) {
    return String(n).padStart(2, "0");
}

module.exports = async (message) => {
    const chat = await message.getChat();

    if (!message.hasQuotedMsg) {
        await message.reply("⚠️ Harus *reply* ke pesan yang ingin dijadikan reminder.");
        return;
    }

    const args = message.body.trim().split(" ");
    if (args.length < 2) {
        await message.reply("⚠️ Format salah.\nGunakan: `?reminder DD/MM/YYYY/HH.mm.ss`");
        return;
    }

    const datetime = args[1];
    const [day, month, year, time] = datetime.split("/");
    if (!day || !month || !year || !time) {
        await message.reply("⚠️ Format tanggal tidak valid.\nContoh: `?reminder 13/11/2025/23.59.00`");
        return;
    }

    const timeClean = time.replace(/:/g, ".");
    let [hour, minute, second] = timeClean.split(".").map(Number);
    hour = hour || 0;
    minute = minute || 0;
    second = second || 0;

    const remindAt = new Date(
        `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:${pad(second)}+07:00`
    ).getTime();

    if (isNaN(remindAt)) {
        await message.reply("⚠️ Format waktu reminder tidak valid.");
        return;
    }

    const tolerance = 5000;
    if (remindAt < Date.now() - tolerance) {
        await message.reply("⚠️ Waktu reminder sudah lewat.");
        return;
    }

    const quotedMsg = await message.getQuotedMessage();
    const chatId = chat.id._serialized;
    const userId = message.author || message.from;
    const reminderId = uuidv4();

    const groupFolder = path.join(UTIL_PATH, chatId);
    if (!fs.existsSync(groupFolder)) fs.mkdirSync(groupFolder, { recursive: true });

    let filePath = null;
    let originalName = null;
    let textContent = quotedMsg.body || "";
    let caption = quotedMsg._data?.caption || "";

    if (quotedMsg.hasMedia) {
        const media = await quotedMsg.downloadMedia();
        if (!media) {
            await message.reply("⚠️ Gagal mengambil file dari pesan yang direply.");
            return;
        }

        const ext = media.mimetype.split("/")[1] || "bin";
        // ambil nama file asli kalau ada
        originalName =
            quotedMsg._data?.filename ||
            quotedMsg._data?.caption?.split("\n")[0] ||
            `reminder_${reminderId}.${ext}`;
        if (!originalName.includes(".")) originalName += `.${ext}`;

        filePath = path.join(groupFolder, `${reminderId}.${ext}`);
        fs.writeFileSync(filePath, Buffer.from(media.data, "base64"));
    }

    const db = readDB();
    db.push({
        id: reminderId,
        chatId,
        userId,
        message: textContent,
        caption,
        filePath,
        originalName,
        remindAt,
        createdAt: Date.now(),
        status: "pending",
    });
    writeDB(db);

    await message.reply(
        `✅ Reminder disimpan!\nAkan dikirim pada *${pad(day)}/${pad(month)}/${year} ${pad(hour)}:${pad(minute)}:${pad(second)} WIB*`
    );
};


// const fs = require("fs");
// const path = require("path");
// const { v4: uuidv4 } = require("uuid");

// const DB_PATH = path.join(__dirname, "reminder.json");
// const UTIL_PATH = path.join(__dirname, "utilities");

// // Baca database
// function readDB() {
//     if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, "[]");
//     return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
// }

// // Tulis ke database
// function writeDB(data) {
//     fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
// }

// // Helper untuk padding angka (contoh: 7 → 07)
// function pad(n) {
//     return String(n).padStart(2, "0");
// }

// module.exports = async (message) => {
//     const chat = await message.getChat();

//     // Pastikan pesan di-reply
//     if (!message.hasQuotedMsg) {
//         await message.reply("⚠️ Harus *reply* ke pesan yang ingin dijadikan reminder.");
//         return;
//     }

//     // Ambil argumen
//     const args = message.body.trim().split(" ");
//     if (args.length < 2) {
//         await message.reply("⚠️ Format salah.\nGunakan: `?reminder DD/MM/YYYY/HH.mm.ss`");
//         return;
//     }

//     const datetime = args[1];
//     const [day, month, year, time] = datetime.split("/");

//     // Validasi tanggal dasar
//     if (!day || !month || !year || !time) {
//         await message.reply("⚠️ Format tanggal tidak valid.\nContoh: `?reminder 13/11/2025/23.59.00`");
//         return;
//     }

//     // Pisahkan waktu
//     const [hour, minute, second] = time.split(".").map(Number);

//     // Buat timestamp dengan format ISO + zona WIB
//     const remindAt = new Date(
//         `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:${pad(second)}+07:00`
//     ).getTime();

//     // Validasi waktu
//     if (isNaN(remindAt)) {
//         await message.reply("⚠️ Format waktu reminder tidak valid.");
//         return;
//     }

//     // Beri toleransi waktu agar reminder < 1 menit tetap valid
//     const tolerance = 5000; // 5 detik
//     if (remindAt < Date.now() - tolerance) {
//         await message.reply("⚠️ Waktu reminder sudah lewat.");
//         return;
//     }

//     // Ambil pesan yang direply
//     const quotedMsg = await message.getQuotedMessage();
//     const chatId = chat.id._serialized;
//     const userId = message.author || message.from;
//     const reminderId = uuidv4();

//     // Pastikan folder utilities/<groupId>/ ada
//     const groupFolder = path.join(UTIL_PATH, chatId);
//     if (!fs.existsSync(groupFolder)) fs.mkdirSync(groupFolder, { recursive: true });

//     let filePath = null;
//     let textContent = "";

//     // Jika pesan memiliki media
//     if (quotedMsg.hasMedia) {
//         const media = await quotedMsg.downloadMedia();
//         if (!media) {
//             await message.reply("⚠️ Gagal mengambil file dari pesan yang direply.");
//             return;
//         }

//         const ext = media.mimetype.split("/")[1];
//         filePath = path.join(groupFolder, `${reminderId}.${ext}`);
//         fs.writeFileSync(filePath, Buffer.from(media.data, "base64"));
//     } else {
//         textContent = quotedMsg.body;
//     }

//     // Simpan ke database
//     const db = readDB();
//     db.push({
//         id: reminderId,
//         chatId,
//         userId,
//         message: textContent,
//         filePath,
//         remindAt,
//         createdAt: Date.now(),
//         status: "pending"
//     });
//     writeDB(db);

//     // Kirim konfirmasi ke user
//     await message.reply(
//         `✅ Reminder disimpan!\nAkan dikirim pada *${pad(day)}/${pad(month)}/${year} ${pad(hour)}:${pad(minute)}:${pad(second)} WIB*`
//     );
// };
