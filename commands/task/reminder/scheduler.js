const fs = require("fs");
const path = require("path");
const { MessageMedia } = require("whatsapp-web.js");

const DB_PATH = path.join(__dirname, "reminder.json");

function readDB() {
    if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, "[]");
    return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
}
function writeDB(data) {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

module.exports = function startReminderScheduler(client) {
    console.log("⏰ Reminder scheduler aktif...");

    setInterval(async () => {
        const db = readDB();
        const now = Date.now();
        let changed = false;

        for (const item of db) {
            if (item.status === "pending" && now >= item.remindAt) {
                try {
                    const chat = await client.getChatById(item.chatId);

                    // kirim file jika ada
                    if (item.filePath && fs.existsSync(item.filePath)) {
                        const media = MessageMedia.fromFilePath(item.filePath);

                        // tambahkan nama file asli biar tampil di WA
                        media.filename = item.originalName || path.basename(item.filePath);

                        await chat.sendMessage(media, {
                            sendMediaAsDocument: true,
                            fileName: media.filename, // redundant tapi aman
                            caption: item.caption || "",
                        });

                        console.log(`📁 Reminder ${item.id}: file ${media.filename} dikirim`);
                    }
                    // if (item.filePath && fs.existsSync(item.filePath)) {
                    //     const media = MessageMedia.fromFilePath(item.filePath);

                    //     await chat.sendMessage(media, {
                    //         sendMediaAsDocument: true,
                    //         fileName: item.originalName || path.basename(item.filePath),
                    //         caption: item.caption || "",
                    //     });

                    //     console.log(`📁 Reminder ${item.id}: file ${item.originalName} dikirim`);
                    // }

                    // kirim pesan teks jika ada dan berbeda dari caption
                    if (
                        item.message &&
                        item.message.trim() !== (item.caption || "").trim()
                    ) {
                        await chat.sendMessage(item.message);
                        console.log(`💬 Reminder ${item.id}: pesan teks dikirim`);
                    }

                    item.status = "sent";
                    changed = true;
                } catch (err) {
                    console.error(`❌ Gagal kirim reminder ${item.id}:`, err.message);
                }
            }
        }

        if (changed) writeDB(db);
    }, 5000); // cek tiap 5 detik
};



// const fs = require("fs");
// const path = require("path");
// const { MessageMedia } = require("whatsapp-web.js");

// const DB_PATH = path.join(__dirname, "reminder.json");

// function readDB() {
//     if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, "[]");
//     return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
// }

// function writeDB(data) {
//     fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
// }

// module.exports = function startReminderScheduler(client) {
//     console.log("⏰ Reminder scheduler aktif...");

//     setInterval(async () => {
//         let db = readDB();
//         const now = Date.now();

//         for (const reminder of db) {
//             if (reminder.status === "pending" && now >= reminder.remindAt) {
//                 try {
//                     const chat = await client.getChatById(reminder.chatId);

//                     // kirim file jika ada
//                     if (reminder.filePath && fs.existsSync(reminder.filePath)) {
//                         const media = MessageMedia.fromFilePath(reminder.filePath);
//                         await chat.sendMessage(media, { sendMediaAsDocument: true });
//                         console.log(`📎 File dikirim: ${reminder.filePath}`);
//                     }

//                     // kirim pesan teks jika ada
//                     if (reminder.message && reminder.message.trim() !== "") {
//                         await chat.sendMessage(reminder.message);
//                     }

//                     reminder.status = "sent";
//                     console.log(`📤 Reminder dikirim: ${reminder.id}`);
//                 } catch (err) {
//                     console.error(`❌ Gagal mengirim reminder ${reminder.id}:`, err);
//                 }
//             }
//         }

//         // Update database
//         writeDB(db);
//     }, 60 * 1000); // cek tiap 1 menit
// };
