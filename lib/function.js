const axios = require("axios");

async function kirimPesan(receiver, messageType, messageText, url, filename) {
  try {
    const response = await axios.get(
      "https://wa.notifku.my.id/api/send-message",
      {
        params: {
          receiver: receiver,
          apikey: "123",
          mtype: messageType,
          text: messageText,
          url: url,
          filename: filename
        },
      },
    );
    console.log("Pesan terkirim:", response.data);
    return response.data;
  } catch (error) {
    console.error("Gagal mengirim pesan:", error);
    throw error;
  }
}

module.exports = kirimPesan;
